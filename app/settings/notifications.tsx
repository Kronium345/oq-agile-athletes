import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import BackgroundGradient from '../../components/BackgroundGradient';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../constants/theme';
import { useDrawerListPadding } from '../../hooks/useDrawerListPadding';
import { useNotifications } from '../../hooks/useNotifications';
import type { EmailNotificationSettings } from '../../lib/notifications/types';
import { useAuthContext } from '../AuthProvider';

type SettingRowProps = {
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

function SettingRow({
  title,
  description,
  value,
  onValueChange,
  disabled,
}: SettingRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        {description ? (
          <Text style={styles.rowDescription}>{description}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: COLORS.borderLight,
          true: COLORS.primaryLight,
        }}
        thumbColor={value ? COLORS.primary : '#f4f3f4'}
      />
    </View>
  );
}

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const listPadding = useDrawerListPadding();
  const { user } = useAuthContext();
  const {
    notificationSettings,
    emailSettings,
    updateNotificationSetting,
    updateEmailNotificationSetting,
    registerForPushNotificationsAsync,
    sendTestNotification,
    refreshEmailSettingsFromServer,
    isSyncingEmail,
  } = useNotifications();

  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');

  useEffect(() => {
    (async () => {
      const Notifications = await import('expo-notifications');
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    })();
  }, []);

  useEffect(() => {
    const userId = user?._id ?? user?.userId;
    if (userId) {
      refreshEmailSettingsFromServer(String(userId));
    }
  }, [user, refreshEmailSettingsFromServer]);

  const ensurePushPermission = useCallback(
    async (key: keyof typeof notificationSettings) => {
      if (permissionStatus === 'granted') return true;

      Alert.alert(
        'Enable push notifications',
        'Allow notifications to use this reminder on your device.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: async () => {
              await registerForPushNotificationsAsync();
              const Notifications = await import('expo-notifications');
              const { status } = await Notifications.getPermissionsAsync();
              setPermissionStatus(status);
              if (status === 'granted') {
                await updateNotificationSetting(key, true);
              }
            },
          },
        ],
      );
      return false;
    },
    [
      permissionStatus,
      registerForPushNotificationsAsync,
      updateNotificationSetting,
    ],
  );

  const togglePush = async (
    key: keyof typeof notificationSettings,
    next: boolean,
  ) => {
    if (next && permissionStatus !== 'granted') {
      const ok = await ensurePushPermission(key);
      if (!ok) return;
    }
    await updateNotificationSetting(key, next);
  };

  const toggleEmail = async (
    key: keyof EmailNotificationSettings,
    next: boolean,
  ) => {
    const userId = user?._id ?? user?.userId;
    const result = await updateEmailNotificationSetting(key, next, userId ? String(userId) : undefined);
    if (!result.success && result.message) {
      Toast.show({
        type: 'error',
        text1: 'Could not save',
        text2: result.message,
        position: 'bottom',
      });
    }
  };

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerSpacer} />
        </View>

        {permissionStatus !== 'granted' && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              Push notifications are off. Enable them for step and workout
              reminders on this device.
            </Text>
            <TouchableOpacity
              style={styles.bannerButton}
              onPress={registerForPushNotificationsAsync}
            >
              <Text style={styles.bannerButtonText}>Enable push</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          contentContainerStyle={[styles.scroll, listPadding]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>Push on this device</Text>
          <View style={styles.section}>
            <SettingRow
              title="Step streak reminders"
              description="Evening nudge when you are close to missing your daily goal."
              value={notificationSettings.stepStreakReminders}
              onValueChange={(v) => togglePush('stepStreakReminders', v)}
              disabled={permissionStatus !== 'granted' && !notificationSettings.stepStreakReminders}
            />
            <SettingRow
              title="Leaderboard alerts"
              description="When friends are close to passing you on the leaderboard."
              value={notificationSettings.leaderboardAlerts}
              onValueChange={(v) => togglePush('leaderboardAlerts', v)}
              disabled={permissionStatus !== 'granted' && !notificationSettings.leaderboardAlerts}
            />
            <SettingRow
              title="Rest timer"
              description="Alert when your rest period ends between sets."
              value={notificationSettings.restTimer}
              onValueChange={(v) => togglePush('restTimer', v)}
              disabled={permissionStatus !== 'granted' && !notificationSettings.restTimer}
            />
          </View>

          <Text style={[styles.sectionLabel, { marginTop: SPACING.lg }]}>
            Workouts & exercises
          </Text>
          <View style={styles.section}>
            <SettingRow
              title="Daily workout reminder"
              description="Morning nudge to open Exercises and start training."
              value={notificationSettings.workoutReminders}
              onValueChange={(v) => togglePush('workoutReminders', v)}
              disabled={
                permissionStatus !== 'granted' &&
                !notificationSettings.workoutReminders
              }
            />
            <SettingRow
              title="Workout complete"
              description="Celebrate when you finish a guided workout session."
              value={notificationSettings.workoutCompleteAlerts}
              onValueChange={(v) => togglePush('workoutCompleteAlerts', v)}
              disabled={
                permissionStatus !== 'granted' &&
                !notificationSettings.workoutCompleteAlerts
              }
            />
            <SettingRow
              title="Finish your workout"
              description="Reminder if you started a session and may still be mid-workout."
              value={notificationSettings.workoutResumeReminders}
              onValueChange={(v) => togglePush('workoutResumeReminders', v)}
              disabled={
                permissionStatus !== 'granted' &&
                !notificationSettings.workoutResumeReminders
              }
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Email updates</Text>
            {isSyncingEmail ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : null}
          </View>
          <Text style={styles.sectionHint}>
            Scheduled fitness emails (step reminders, weekly summaries, and
            more) are sent from our server when these are on.
          </Text>
          <View style={styles.section}>
            <SettingRow
              title="Subscribe to Agile Athletes emails"
              description="Tips, product updates, and fitness messages."
              value={emailSettings.emailSubscription}
              onValueChange={(v) => toggleEmail('emailSubscription', v)}
            />
            <SettingRow
              title="Daily step reminders"
              value={emailSettings.stepReminders}
              onValueChange={(v) => toggleEmail('stepReminders', v)}
              disabled={!emailSettings.emailSubscription}
            />
            <SettingRow
              title="Weekly progress summary"
              value={emailSettings.weeklyProgress}
              onValueChange={(v) => toggleEmail('weeklyProgress', v)}
              disabled={!emailSettings.emailSubscription}
            />
            <SettingRow
              title="Leaderboard emails"
              value={emailSettings.leaderboardAlerts}
              onValueChange={(v) => toggleEmail('leaderboardAlerts', v)}
              disabled={!emailSettings.emailSubscription}
            />
            <SettingRow
              title="Motivation & goals"
              value={emailSettings.motivation}
              onValueChange={(v) => toggleEmail('motivation', v)}
              disabled={!emailSettings.emailSubscription}
            />
          </View>

          {__DEV__ && permissionStatus === 'granted' && (
            <TouchableOpacity
              style={styles.testButton}
              onPress={sendTestNotification}
            >
              <Text style={styles.testButtonText}>Send test push (dev)</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.small,
    backgroundColor: COLORS.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  headerSpacer: { width: 40 },
  banner: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.borderOrange,
  },
  bannerText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.regular,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  bannerButton: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.small,
  },
  bannerButtonText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  scroll: {
    paddingHorizontal: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  sectionHint: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  section: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  rowText: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  rowTitle: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  rowDescription: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
  testButton: {
    marginTop: SPACING.xl,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.borderOrange,
    alignItems: 'center',
  },
  testButtonText: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});
