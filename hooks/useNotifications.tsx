import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import {
  fetchEmailNotificationSettings,
  syncEmailNotificationSettings,
} from '../components/lib/actions/notificationPreferences.action';
import {
  DEFAULT_EMAIL_SETTINGS,
  DEFAULT_PUSH_SETTINGS,
  type EmailNotificationSettings,
  type PushNotificationSettings,
} from '../lib/notifications/types';
import {
  clearActiveWorkoutSession,
  getPendingResumeNotificationId,
  setPendingResumeNotificationId,
} from '../lib/notifications/workoutSession';

const PUSH_SETTINGS_KEY = 'notificationSettings';
const EMAIL_SETTINGS_KEY = 'emailNotificationSettings';

// Set the notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const useNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [channels, setChannels] = useState<Notifications.NotificationChannel[]>(
    [],
  );
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [notificationSettings, setNotificationSettings] =
    useState<PushNotificationSettings>({ ...DEFAULT_PUSH_SETTINGS });
  const [emailSettings, setEmailSettings] = useState<EmailNotificationSettings>(
    { ...DEFAULT_EMAIL_SETTINGS },
  );
  const [isSyncingEmail, setIsSyncingEmail] = useState(false);

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // Initialize notifications
  useEffect(() => {
    loadNotificationSettings();
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
      }
    });

    // Set up notification channels for Android
    if (Platform.OS === 'android') {
      setupAndroidChannels();
      Notifications.getNotificationChannelsAsync().then((value) =>
        setChannels(value ?? []),
      );
    }

    // Listen for notifications
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('Notification response:', response);
        handleNotificationResponse(response);
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const [savedPush, savedEmail] = await Promise.all([
        AsyncStorage.getItem(PUSH_SETTINGS_KEY),
        AsyncStorage.getItem(EMAIL_SETTINGS_KEY),
      ]);

      if (savedPush) {
        const parsed = JSON.parse(savedPush) as PushNotificationSettings & {
          emailSubscription?: boolean;
        };
        const { emailSubscription: _legacy, ...pushOnly } = parsed;
        setNotificationSettings({ ...DEFAULT_PUSH_SETTINGS, ...pushOnly });
        if (typeof parsed.emailSubscription === 'boolean' && !savedEmail) {
          setEmailSettings((prev) => ({
            ...prev,
            emailSubscription: parsed.emailSubscription as boolean,
          }));
        }
      }

      if (savedEmail) {
        setEmailSettings({
          ...DEFAULT_EMAIL_SETTINGS,
          ...JSON.parse(savedEmail),
        });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const savePushNotificationSettings = async (
    settings: PushNotificationSettings,
  ) => {
    try {
      await AsyncStorage.setItem(PUSH_SETTINGS_KEY, JSON.stringify(settings));
      setNotificationSettings(settings);
    } catch (error) {
      console.error('Error saving push notification settings:', error);
    }
  };

  const saveEmailNotificationSettings = async (
    settings: EmailNotificationSettings,
  ) => {
    try {
      await AsyncStorage.setItem(EMAIL_SETTINGS_KEY, JSON.stringify(settings));
      setEmailSettings(settings);
    } catch (error) {
      console.error('Error saving email notification settings:', error);
    }
  };

  const refreshEmailSettingsFromServer = useCallback(async (userId: string) => {
    setIsSyncingEmail(true);
    try {
      const remote = await fetchEmailNotificationSettings(userId);
      await saveEmailNotificationSettings(remote);
    } finally {
      setIsSyncingEmail(false);
    }
  }, []);

  const updateEmailNotificationSetting = useCallback(
    async (
      settingKey: keyof EmailNotificationSettings,
      value: boolean,
      userId?: string,
    ) => {
      let next: EmailNotificationSettings = {
        ...emailSettings,
        [settingKey]: value,
      };

      if (settingKey === 'emailSubscription' && !value) {
        next = {
          ...next,
          stepReminders: false,
          weeklyProgress: false,
          leaderboardAlerts: false,
          motivation: false,
        };
      }

      await saveEmailNotificationSettings(next);

      if (!userId) return { success: true };

      setIsSyncingEmail(true);
      try {
        return await syncEmailNotificationSettings(userId, next);
      } finally {
        setIsSyncingEmail(false);
      }
    },
    [emailSettings],
  );

  // Register for push notifications
  const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === 'android') {
      await setupAndroidChannels();
    }

    if (Platform.OS === 'web') {
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Failed to get push token for push notification!',
      );
      return;
    }

    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;
      if (!projectId) {
        throw new Error('Project ID not found');
      }

      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;

      console.log('Push token:', token);
    } catch (error) {
      // Non-fatal on emulators or clients without push support.
      console.log('Push token unavailable in this runtime:', error);
    }

    return token;
  };

  // Setup Android notification channels
  const setupAndroidChannels = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('step-reminders', {
        name: 'Step Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        description: 'Notifications for step streak reminders',
      });

      await Notifications.setNotificationChannelAsync('leaderboard', {
        name: 'Leaderboard Alerts',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        description: 'Notifications for leaderboard updates',
      });

      await Notifications.setNotificationChannelAsync('community', {
        name: 'Community Events',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        description: 'Notifications for community runs and events',
      });

      await Notifications.setNotificationChannelAsync('workouts', {
        name: 'Workout Updates',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        description: 'Notifications for workout discussions and comments',
      });

      await Notifications.setNotificationChannelAsync('rest-timer', {
        name: 'Rest Timer',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        description: 'Notifications for rest timer alerts',
      });

      await Notifications.setNotificationChannelAsync('workout-reminders', {
        name: 'Workout Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        description: 'Reminders to train and finish workouts',
      });
    }
  };

  const cancelNotificationsByType = async (type: string) => {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const matches = scheduled.filter((n) => n.content.data?.type === type);
    for (const item of matches) {
      await Notifications.cancelScheduledNotificationAsync(item.identifier);
    }
  };

  // Handle notification responses (when user taps notification)
  const handleNotificationResponse = (
    response: Notifications.NotificationResponse,
  ) => {
    const notificationData = response.notification.request.content.data;

    // Navigate based on notification type
    switch (notificationData?.type) {
      case 'step-reminder':
        // Navigate to step counter
        console.log('Navigate to step counter');
        break;
      case 'leaderboard':
        // Navigate to leaderboard
        console.log('Navigate to leaderboard');
        break;
      case 'community-run':
        // Navigate to community runs
        console.log('Navigate to community runs');
        break;
      case 'community-group':
        if (notificationData?.groupId) {
          router.push(
            `/(drawer)/community/group/${notificationData.groupId}` as any,
          );
        } else {
          router.push('/(drawer)/community/groups' as any);
        }
        break;
      case 'workout-discussion':
        // Navigate to specific workout
        console.log('Navigate to workout discussion');
        break;
      case 'rest-timer':
        console.log('Rest timer completed');
        break;
      case 'workout-reminder':
      case 'workout-resume':
        router.push('/(drawer)/(tabs)/exercises' as any);
        break;
      case 'workout-complete':
        router.push('/(drawer)/(tabs)/home' as any);
        break;
      default:
        console.log('Unknown notification type');
    }
  };

  // Schedule step streak reminder
  const scheduleStepReminder = async (
    targetTime: { hour: number; minute: number } = { hour: 20, minute: 0 },
  ) => {
    if (!notificationSettings.stepStreakReminders) return;

    try {
      // Cancel existing step reminders
      const scheduledNotifications =
        await Notifications.getAllScheduledNotificationsAsync();
      const stepReminders = scheduledNotifications.filter(
        (n) => n.content.data?.type === 'step-reminder',
      );

      for (const reminder of stepReminders) {
        await Notifications.cancelScheduledNotificationAsync(
          reminder.identifier,
        );
      }

      // Schedule new daily reminder
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚶‍♀️ Step Streak Reminder',
          body: "Don't break your streak! You're close to missing today's step goal.",
          data: { type: 'step-reminder' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: targetTime.hour,
          minute: targetTime.minute,
        },
      });

      console.log(
        'Step reminder scheduled for',
        `${targetTime.hour}:${targetTime.minute}`,
      );
    } catch (error) {
      console.error('Error scheduling step reminder:', error);
    }
  };

  // Schedule leaderboard alert
  const scheduleLeaderboardAlert = async (
    friendName: string,
    stepsAhead: number,
  ) => {
    if (!notificationSettings.leaderboardAlerts) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏆 Leaderboard Alert',
          body: `${friendName} is only ${stepsAhead} steps ahead of you! Time to catch up!`,
          data: { type: 'leaderboard', friendName, stepsAhead },
        },
        trigger: null, // Immediate notification
      });
    } catch (error) {
      console.error('Error scheduling leaderboard alert:', error);
    }
  };

  // Schedule run reminder
  const scheduleRunReminder = async (runDetails: {
    id: string;
    name: string;
    location: string;
    startTime: Date | string;
  }) => {
    if (!notificationSettings.runReminders) return;

    try {
      const reminderTime = new Date(runDetails.startTime);
      reminderTime.setMinutes(reminderTime.getMinutes() - 30); // 30 minutes before

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏃‍♀️ Community Run Reminder',
          body: `${runDetails.name} starts in 30 minutes at ${runDetails.location}!`,
          data: { type: 'community-run', runId: runDetails.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderTime,
        },
      });
    } catch (error) {
      console.error('Error scheduling run reminder:', error);
    }
  };

  // Schedule rest timer notification
  const scheduleRestTimer = async (durationMinutes: number) => {
    if (!notificationSettings.restTimer) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Rest Timer Complete',
          body: `Your ${durationMinutes}-minute rest is over. Ready for the next set?`,
          data: { type: 'rest-timer' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: durationMinutes * 60,
        },
      });
    } catch (error) {
      console.error('Error scheduling rest timer:', error);
    }
  };

  const scheduleWorkoutReminder = async (
    targetTime: { hour: number; minute: number } = { hour: 10, minute: 0 },
  ) => {
    if (!notificationSettings.workoutReminders) return;

    try {
      await cancelNotificationsByType('workout-reminder');

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💪 Time to train',
          body: 'Open Exercises and start a workout when you are ready.',
          data: { type: 'workout-reminder' },
          ...(Platform.OS === 'android' && { channelId: 'workout-reminders' }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: targetTime.hour,
          minute: targetTime.minute,
        },
      });
    } catch (error) {
      console.error('Error scheduling workout reminder:', error);
    }
  };

  const scheduleWorkoutResumeReminder = async (delayMinutes: number = 45) => {
    if (!notificationSettings.workoutResumeReminders) return null;

    try {
      const pendingId = await getPendingResumeNotificationId();
      if (pendingId) {
        await Notifications.cancelScheduledNotificationAsync(pendingId);
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💪 Finish your workout?',
          body: 'You started a session earlier. Pick up where you left off in Exercises.',
          data: { type: 'workout-resume' },
          ...(Platform.OS === 'android' && { channelId: 'workout-reminders' }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(delayMinutes, 1) * 60,
        },
      });

      await setPendingResumeNotificationId(identifier);
      return identifier;
    } catch (error) {
      console.error('Error scheduling workout resume reminder:', error);
      return null;
    }
  };

  const cancelWorkoutResumeReminder = async () => {
    try {
      const pendingId = await getPendingResumeNotificationId();
      if (pendingId) {
        await Notifications.cancelScheduledNotificationAsync(pendingId);
      }
      await cancelNotificationsByType('workout-resume');
      await clearActiveWorkoutSession();
    } catch (error) {
      console.error('Error cancelling workout resume reminder:', error);
    }
  };

  const notifyWorkoutCompleted = async (options: {
    exerciseCount: number;
    lastExerciseName?: string;
  }) => {
    if (!notificationSettings.workoutCompleteAlerts) return;

    try {
      await cancelWorkoutResumeReminder();

      const { exerciseCount, lastExerciseName } = options;
      const body =
        exerciseCount === 1
          ? `Nice work${lastExerciseName ? ` on ${lastExerciseName}` : ''}! Session logged.`
          : `You completed ${exerciseCount} exercises. Great session!`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Workout complete',
          body,
          data: { type: 'workout-complete', exerciseCount },
          ...(Platform.OS === 'android' && { channelId: 'workouts' }),
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending workout complete notification:', error);
    }
  };

  // Send workout discussion notification
  const sendWorkoutDiscussionNotification = async (
    workoutTitle: string,
    commenterName: string,
  ) => {
    if (!notificationSettings.workoutDiscussions) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💬 New Workout Comment',
          body: `${commenterName} commented on "${workoutTitle}" that you're following.`,
          data: { type: 'workout-discussion', workoutTitle, commenterName },
        },
        trigger: null, // Immediate notification
      });
    } catch (error) {
      console.error('Error sending workout discussion notification:', error);
    }
  };

  // Update notification setting
  const updateNotificationSetting = async (
    settingKey: keyof PushNotificationSettings,
    value: boolean,
  ) => {
    const newSettings = {
      ...notificationSettings,
      [settingKey]: value,
    };

    await savePushNotificationSettings(newSettings);

    // Handle specific setting updates
    if (settingKey === 'stepStreakReminders' && value) {
      await scheduleStepReminder();
    } else if (settingKey === 'stepStreakReminders' && !value) {
      await cancelNotificationsByType('step-reminder');
    } else if (settingKey === 'workoutReminders' && value) {
      await scheduleWorkoutReminder();
    } else if (settingKey === 'workoutReminders' && !value) {
      await cancelNotificationsByType('workout-reminder');
    } else if (settingKey === 'workoutResumeReminders' && !value) {
      await cancelWorkoutResumeReminder();
    }
  };

  // Test notification (for development)
  const sendTestNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧪 Test Notification',
        body: 'This is a test notification from Agile Athletes!',
        data: { type: 'test' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    });
  };

  return {
    expoPushToken,
    channels,
    notification,
    notificationSettings,
    emailSettings,
    isSyncingEmail,
    updateNotificationSetting,
    updateEmailNotificationSetting,
    refreshEmailSettingsFromServer,
    scheduleStepReminder,
    scheduleLeaderboardAlert,
    scheduleRunReminder,
    scheduleRestTimer,
    scheduleWorkoutReminder,
    scheduleWorkoutResumeReminder,
    cancelWorkoutResumeReminder,
    notifyWorkoutCompleted,
    sendWorkoutDiscussionNotification,
    sendTestNotification,
    registerForPushNotificationsAsync,
  };
};
