import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  startOfMonth,
} from 'date-fns';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import api, { SERVER_URL } from '../../../api/axios';
import {
  getDefaultAvatarUrl,
  resolveAvatarDisplayUrl,
} from '../../../lib/profile/avatarUrl';
import {
  formatExperienceForDisplay,
  formatGenderForDisplay,
  formatProfileStatLabel,
  formatWeightForDisplay,
} from '../../../lib/profile/display';
import {
  formatTotalStepsShort,
  getTotalStepsMilestone,
  loadTotalStepsTracked,
} from '../../../lib/loadTotalSteps';
import {
  fetchUserProfileFromApi,
  getUserId,
  isOnboardingComplete,
  loadUserWithOnboarding,
  mergeServerProfileWithLocal,
  normalizeUserForOnboarding,
  persistOnboardingToUser,
  saveOnboardingProfile,
} from '../../../lib/onboarding/storage';
import { getTabBarBottomInset } from '../../../constants/layout';
import BackgroundGradient from '../../../components/BackgroundGradient';
import { CardTopEdge } from '../../../components/ui/CardTopEdge';
import { resolveAthleteStatusLabel } from '../../../lib/profile/athleteStatus';
import {
  athleticStatLabel,
  athleticStatNumber,
  ATHLETIC,
} from '../../../constants/athleticDashboard';
import { PREMIUM_PROFILE_PROMO_SUBTITLE } from '../../../constants/premiumCopy';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../../constants/theme';
// PT / gym feature paused
// import { userHasTrainerProfile } from '../../../services/trainersApi';
import { useAuthContext } from '../../AuthProvider';
import { usePremium } from '../../PremiumProvider';
import { useWorkoutContext } from '../../WorkoutContext';

interface UserData {
  _id?: string;
  userId?: string;
  name?: string;
  firstName?: string;
  username?: string;
  email?: string;
  weight?: string | number;
  experience?: string;
  gender?: string;
  avatar?: string;
  unit?: string;
}

export default function Profile() {
  const router = useRouter();
  const authContext = useAuthContext();
  const user = authContext?.user || null;
  const { isPremium } = usePremium();
  const { workout, calories, minutes } = useWorkoutContext();
  // const isTrainer = userHasTrainerProfile(
  //   user as Record<string, unknown> | null,
  // );
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const scrollBottomPadding = getTabBarBottomInset(insets.bottom, tabBarHeight);

  if (!authContext) {
    return null;
  }

  // State management
  const [userData, setUserData] = useState<UserData>({});
  const [avatar, setAvatar] = useState('');
  const [weight, setWeight] = useState('');
  const [experience, setExperience] = useState('');
  const [gender, setGender] = useState('');
  const [editing, setEditing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAnimating, setIsAnimating] = useState(false);
  const [activityData, setActivityData] = useState<{ [key: string]: boolean }>(
    {},
  );
  const [calendarIsAnimating, setCalendarIsAnimating] = useState(false);
  const [totalStepsTracked, setTotalStepsTracked] = useState(0);
  const skipNextFocusRefresh = useRef(false);
  const avatarUriRef = useRef('');

  // Calendar animation
  const calendarAnimatedStyle = useAnimatedStyle(() => ({
    opacity: isAnimating ? 0.5 : 1,
  }));

  const refreshTotalSteps = useCallback(async () => {
    const total = await loadTotalStepsTracked(user);
    setTotalStepsTracked(total);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (skipNextFocusRefresh.current) {
        skipNextFocusRefresh.current = false;
        refreshTotalSteps();
        return;
      }
      fetchUserData();
      refreshTotalSteps();
    }, [refreshTotalSteps]),
  );

  useEffect(() => {
    if (selectedTab === 'steps') {
      refreshTotalSteps();
    }
  }, [selectedTab, refreshTotalSteps]);

  useEffect(() => {
    fetchActivityData();
  }, []);

  const setAvatarUri = (uri: string) => {
    avatarUriRef.current = uri;
    setAvatar(uri);
  };

  const applyProfileFields = (record: Record<string, unknown>) => {
    const normalized = normalizeUserForOnboarding(record);
    setUserData(normalized as UserData);
    setWeight(formatWeightForDisplay(normalized.weight));
    setExperience(formatExperienceForDisplay(normalized.experience));
    setGender(formatGenderForDisplay(normalized.gender));

    const current = avatarUriRef.current;
    if (
      current.startsWith('file://') ||
      current.startsWith('content://')
    ) {
      return;
    }

    if (normalized.avatar) {
      setAvatarUri(resolveAvatarDisplayUrl(String(normalized.avatar)));
    } else {
      setAvatarUri(getDefaultAvatarUrl());
    }
  };

  const fetchUserData = async () => {
    try {
      let localUser = await loadUserWithOnboarding();
      if (!getUserId(localUser)) {
        return;
      }

      if (await isOnboardingComplete()) {
        const normalized = normalizeUserForOnboarding(localUser);
        const missingCore =
          normalized.weight == null ||
          !normalized.experience ||
          !normalized.gender;
        if (missingCore) {
          localUser = await persistOnboardingToUser();
        }
      }

      const userId = getUserId(localUser)!;
      const serverUser = await fetchUserProfileFromApi(userId);
      const merged = serverUser
        ? mergeServerProfileWithLocal(localUser, serverUser)
        : localUser;

      applyProfileFields(merged);

      const avatarForStorage = merged.avatar
        ? String(merged.avatar)
        : undefined;
      const updatedUser = {
        ...merged,
        ...(avatarForStorage && {
          avatar: resolveAvatarDisplayUrl(avatarForStorage),
        }),
      };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      authContext.updateUser(updatedUser);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchActivityData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (!storedUser) return;

      const parsedUser = JSON.parse(storedUser);
      const userId = parsedUser?._id || parsedUser?.userId;

      const startDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(selectedDate), 'yyyy-MM-dd');

      const response = await api.get(
        `/activity/${userId}/${startDate}/${endDate}`,
      );

      const activities = ((response as any).data || []).reduce(
        (acc: { [key: string]: boolean }, activity: any) => {
          if (activity?.date) {
            const date = format(new Date(activity.date), 'yyyy-MM-dd');
            acc[date] = true;
          }
          return acc;
        },
        {},
      );

      setActivityData(activities);
    } catch (error) {
      console.error('Error fetching activity data:', error);
    }
  };

  const pickImage = async () => {
    try {
      skipNextFocusRefresh.current = true;
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'You need to grant permission to access your photos.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        const fileSize = result.assets[0].fileSize;

        if (fileSize && fileSize > 5 * 1024 * 1024) {
          Alert.alert(
            'File Too Large',
            'Please select an image smaller than 5MB.',
          );
          return;
        }

        setAvatarUri(imageUri);
        uploadImage(imageUri);
      } else {
        skipNextFocusRefresh.current = false;
      }
    } catch (error) {
      skipNextFocusRefresh.current = false;
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Something went wrong while selecting the image.');
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');

      if (!storedUser || !token) {
        Alert.alert('Error', 'Please log in again.');
        return;
      }

      const parsedUser = JSON.parse(storedUser);
      const userId = parsedUser?._id || parsedUser?.userId;

      if (!userId) {
        Alert.alert(
          'Error',
          'Invalid user ID. Please log out and log in again.',
        );
        return;
      }

      const fileName = uri.split('/').pop() || 'avatar.jpg';
      const fileExtension = fileName.split('.').pop()?.toLowerCase();

      const validTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      if (!fileExtension || !validTypes.includes(fileExtension)) {
        Alert.alert(
          'Invalid File',
          'Please select a valid image file (JPEG, PNG, GIF, or WebP)',
        );
        return;
      }

      const fileType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';

      const formData = new FormData();
      formData.append('avatar', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        type: fileType,
        name: fileName,
      } as any);

      // Use shared SERVER_URL for backend
      const response = await fetch(`${SERVER_URL}/user/${userId}/avatar`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);

        if (response.status === 401) {
          Alert.alert('Authentication Error', 'Please log in again.');
          return;
        }
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.avatar) {
        const avatarPath = String(data.avatar);
        const avatarUrl = resolveAvatarDisplayUrl(avatarPath);
        setAvatarUri(avatarUrl);

        await saveOnboardingProfile({ avatar: avatarPath });
        const updatedUser = { ...parsedUser, avatar: avatarUrl };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        authContext.updateUser(updatedUser);

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Your profile image has been updated!',
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert(
        'Upload Error',
        'Failed to upload your profile picture. Please try again.',
      );
    } finally {
      skipNextFocusRefresh.current = false;
    }
  };

  const handleSave = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');

      if (!storedUser || !token) return;

      const parsedUser = JSON.parse(storedUser);
      const userId = parsedUser?._id || parsedUser?.userId;

      const weightNum = weight.trim() ? Number(weight) : undefined;
      const updatedData = {
        experience: experience.trim() || undefined,
        gender: gender.trim() || undefined,
        ...(weightNum != null &&
          !Number.isNaN(weightNum) && { weight: weightNum }),
        unit: userData.unit || 'kg',
      };
      const response = await api.put(`/user/${userId}`, updatedData);

      setUserData((response as any).data);
      setEditing(false);

      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your profile has been saved successfully.',
      });
    } catch (error) {
      console.error('Error updating user data:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Failed to update your profile. Please try again.',
      });
    }
  };

  const handleLogout = async () => {
    console.log('🚪 LOGOUT PROCESS STARTED');

    try {
      console.log('🗑️ Clearing AsyncStorage...');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('session');

      console.log('✅ AsyncStorage cleared');
      console.log('🧭 Navigating to login screen...');

      // Step 2: Clear auth context state
      if (authContext?.logout) {
        await authContext.logout();
      }

      // Step 3: Show success message
      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'You have been logged out successfully',
        position: 'bottom',
      });

      // Step 4: Navigate to login
      router.replace('/');

      console.log('✅ LOGOUT COMPLETED');
    } catch (error) {
      console.error('❌ Error logging out:', error);

      // Even if there's an error, still try to navigate to login
      router.replace('/');

      Toast.show({
        type: 'error',
        text1: 'Logout Error',
        text2: 'An error occurred during logout, but you have been logged out.',
        position: 'bottom',
      });
    }
  };

  const deleteAccountOnServer = () => api.delete('/auth/delete');

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This permanently deletes your account and data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccountOnServer();
              await AsyncStorage.multiRemove(['token', 'user', 'session']);
              if (authContext?.logout) await authContext.logout();
              Toast.show({
                type: 'success',
                text1: 'Account deleted',
                text2: 'Your account has been removed.',
                position: 'bottom',
              });
              router.replace('/');
            } catch (e: any) {
              Toast.show({
                type: 'error',
                text1: 'Delete failed',
                text2: e?.message ?? 'Try again later.',
                position: 'bottom',
              });
            }
          },
        },
      ],
    );
  };

  const wasAppUsedOnDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const today = format(new Date(), 'yyyy-MM-dd');

    if (dateString === today) return true;
    return activityData[dateString] || false;
  };

  const handlePreviousMonth = () => {
    if (calendarIsAnimating) return;
    setCalendarIsAnimating(true);
    const newDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() - 1,
      1,
    );
    setSelectedDate(newDate);
    setTimeout(() => setCalendarIsAnimating(false), 250);
  };

  const handleNextMonth = () => {
    if (calendarIsAnimating) return;
    setCalendarIsAnimating(true);
    const newDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      1,
    );
    setSelectedDate(newDate);
    setTimeout(() => setCalendarIsAnimating(false), 250);
  };

  const jumpToToday = () => {
    if (calendarIsAnimating) return;
    setCalendarIsAnimating(true);
    setSelectedDate(new Date());
    setTimeout(() => setCalendarIsAnimating(false), 250);
  };

  const renderCalendar = () => {
    const today = new Date();
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const days = eachDayOfInterval({ start, end });

    let firstDayOfWeek = getDay(start) - 1;
    if (firstDayOfWeek === -1) firstDayOfWeek = 6;

    const emptyDays = Array(firstDayOfWeek).fill(null);
    const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const isCurrentMonth =
      format(selectedDate, 'yyyy-MM') === format(today, 'yyyy-MM');

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            onPress={handlePreviousMonth}
            style={styles.navigationButton}
            disabled={calendarIsAnimating}
          >
            <Ionicons
              name='chevron-back'
              size={20}
              color='rgba(255, 255, 255, 0.6)'
            />
          </TouchableOpacity>

          <View style={styles.monthYearContainer}>
            <Text style={styles.calendarTitle}>
              {format(selectedDate, 'MMMM yyyy')}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleNextMonth}
            style={styles.navigationButton}
            disabled={calendarIsAnimating}
          >
            <Ionicons
              name='chevron-forward'
              size={20}
              color='rgba(255, 255, 255, 0.6)'
            />
          </TouchableOpacity>
        </View>

        <View style={styles.weekDaysRow}>
          {weekDays.map((day, index) => (
            <Text key={index} style={styles.weekDayText}>
              {day}
            </Text>
          ))}
        </View>

        <Animated.View style={[styles.daysGrid, calendarAnimatedStyle]}>
          {emptyDays.map((_, index) => (
            <View key={`empty-${index}`} style={styles.dayCell} />
          ))}
          {days.map((date) => {
            const isToday =
              format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
            const wasUsed = wasAppUsedOnDate(date);
            const isPastOrToday = date <= today;

            return (
              <View key={date.toString()} style={styles.dayCell}>
                <View
                  style={[
                    styles.dayWrapper,
                    isPastOrToday &&
                      (wasUsed
                        ? styles.usedDayWrapper
                        : styles.unusedDayWrapper),
                    isToday && styles.todayWrapper,
                  ]}
                >
                  <Text style={styles.dayText}>{format(date, 'd')}</Text>
                </View>
              </View>
            );
          })}
        </Animated.View>

        {!isCurrentMonth && (
          <View style={styles.todayButtonContainer}>
            <TouchableOpacity
              onPress={jumpToToday}
              style={styles.todayButton}
              disabled={calendarIsAnimating}
            >
              <Text style={styles.todayButtonText}>Jump to Today</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderStepsTab = () => {
    const formattedSteps = formatTotalStepsShort(totalStepsTracked);
    const { progress, milestoneLabel } =
      getTotalStepsMilestone(totalStepsTracked);

    return (
      <View style={styles.stepsDataBox}>
        <View style={styles.totalStepsContainer}>
          <View style={styles.totalStepsContent}>
            <View style={styles.iconContainer}>
              <Feather name='pie-chart' size={26} color='#fff' />
            </View>

            <View style={styles.progressSection}>
              <Text style={styles.totalStepsTitle}>Total Steps Tracked</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.round(progress * 100)}%` },
                    ]}
                  />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={styles.currentSteps}>{formattedSteps}</Text>
                  <Text style={styles.rankText}>{milestoneLabel}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.stepsAchievementsContainer}
          onPress={() => router.push('/stepHistory' as any)}
        >
          <View style={styles.stepsTitleContainer}>
            <Text style={styles.stepsAchievementTitle}>Steps Achievements</Text>
            <Ionicons
              name='chevron-forward'
              size={18}
              color='rgba(255, 255, 255, 0.75)'
            />
          </View>

          <View style={styles.badgesContainer}>
            <View style={styles.badgeItem}>
              <View style={styles.badge}>
                <View style={styles.badgeTextContainer}>
                  <Text style={styles.badgeNumber}>10</Text>
                  <Text style={styles.badgeUnit}>K</Text>
                </View>
              </View>
              <Text style={styles.badgeLabel}>10K steps</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'calendar':
        return renderCalendar();
      case 'steps':
        return renderStepsTab();
      default:
        return renderCalendar();
    }
  };

  const weightStr = formatWeightForDisplay(weight);
  const weightLabel = weightStr
    ? `${weightStr} ${userData.unit || 'kg'}`
    : '—';

  const athleteStatus = resolveAthleteStatusLabel({
    experience,
    workouts: workout,
    minutes,
    totalSteps: totalStepsTracked,
  });

  const renderStatRow = (
    items: { label: string; value: string }[],
  ) => (
    <CardTopEdge style={styles.statsContainer} contentStyle={styles.statsContent}>
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 && <View style={styles.statDivider} />}
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label.toUpperCase()}</Text>
          </View>
        </React.Fragment>
      ))}
    </CardTopEdge>
  );

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{ uri: avatar }}
                style={styles.profileImage}
                onError={() => {
                  if (
                    avatarUriRef.current.startsWith('file://') ||
                    avatarUriRef.current.startsWith('content://')
                  ) {
                    return;
                  }
                  setAvatarUri(getDefaultAvatarUrl());
                }}
              />
              <TouchableOpacity onPress={pickImage} style={styles.editIcon}>
                <Ionicons
                  name='add-circle'
                  size={24}
                  color={COLORS.background}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {userData?.name || userData?.firstName || user?.name || 'User'}
              </Text>
              <Text style={styles.athleteStatus}>{athleteStatus}</Text>
              <Text style={styles.profileUsername}>
                {userData?.email || user?.email || 'email@example.com'}
              </Text>
            </View>
          </View>

          {renderStatRow([
            { label: 'Weight', value: weightLabel },
            {
              label: 'Experience',
              value: formatProfileStatLabel(experience),
            },
            { label: 'Gender', value: formatProfileStatLabel(gender) },
          ])}

          {renderStatRow([
            { label: 'Workouts', value: String(workout) },
            { label: 'Calories', value: calories.toFixed(0) },
            { label: 'Minutes', value: String(Math.round(minutes)) },
          ])}

          {/* Tab Navigation */}
          <View style={styles.iconRow}>
            <TouchableOpacity
              style={[
                styles.iconButton,
                selectedTab === 'calendar' && styles.selectedIcon,
              ]}
              onPress={() => setSelectedTab('calendar')}
            >
              <View style={styles.iconContent}>
                <Ionicons
                  name='calendar-outline'
                  size={24}
                  color={
                    selectedTab === 'calendar'
                      ? COLORS.primary
                      : COLORS.textSecondary
                  }
                />
                {selectedTab === 'calendar' && (
                  <Text style={styles.iconText}>Calendar</Text>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconButton,
                selectedTab === 'steps' && styles.selectedIcon,
              ]}
              onPress={() => setSelectedTab('steps')}
            >
              <View style={styles.iconContent}>
                <Ionicons
                  name='walk-outline'
                  size={24}
                  color={
                    selectedTab === 'steps'
                      ? COLORS.primary
                      : COLORS.textSecondary
                  }
                />
                {selectedTab === 'steps' && (
                  <Text style={styles.iconText}>Step Stats</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>{renderTabContent()}</View>

          {/* Premium Promo */}
          {!isPremium && (
            <View style={styles.premiumPromoContainer}>
              <BlurView intensity={20} tint='light' style={StyleSheet.absoluteFill} />
              <View style={styles.premiumPromoContent}>
                <View style={styles.premiumPromoTextContainer}>
                  <Text style={styles.premiumPromoTitle}>Upgrade to Premium</Text>
                  <Text style={styles.premiumPromoSubtitle}>
                    {PREMIUM_PROFILE_PROMO_SUBTITLE}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.tryPremiumButton}
                  onPress={() => router.push('/subscription')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.tryPremiumText}>Try Premium</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Profile Edit Section */}
          {editing ? (
            <View style={styles.editSection}>
              <TextInput
                style={styles.input}
                placeholder='Weight (kg)'
                placeholderTextColor='rgba(255, 255, 255, 0.5)'
                value={weight}
                onChangeText={setWeight}
              />
              <TextInput
                style={styles.input}
                placeholder='Experience Level'
                placeholderTextColor='rgba(255, 255, 255, 0.5)'
                value={experience}
                onChangeText={setExperience}
              />
              <TextInput
                style={styles.input}
                placeholder='Gender'
                placeholderTextColor='rgba(255, 255, 255, 0.5)'
                value={gender}
                onChangeText={setGender}
              />
              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditing(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.logoutContainer}>
              {/* PT / gym feature paused
              <TouchableOpacity
                style={styles.notificationsButton}
                onPress={() =>
                  router.push(
                    (isTrainer ? '/trainer/setup' : '/trainer/become') as any,
                  )
                }
              >
                <Ionicons
                  name='fitness-outline'
                  size={18}
                  color={COLORS.textPrimary}
                  style={styles.notificationsIcon}
                />
                <Text style={styles.notificationsButtonText}>
                  {isTrainer ? 'Manage trainer profile' : 'Become a trainer'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.notificationsButton}
                onPress={() => router.push('/settings/gym' as any)}
              >
                <Ionicons
                  name='location-outline'
                  size={18}
                  color={COLORS.textPrimary}
                  style={styles.notificationsIcon}
                />
                <Text style={styles.notificationsButtonText}>My gym</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.notificationsButton}
                onPress={() => router.push('/trainer/bookings' as any)}
              >
                <Ionicons
                  name='calendar-outline'
                  size={18}
                  color={COLORS.textPrimary}
                  style={styles.notificationsIcon}
                />
                <Text style={styles.notificationsButtonText}>My bookings</Text>
              </TouchableOpacity>
              */}
              <TouchableOpacity
                style={styles.notificationsButton}
                onPress={() => router.push('/settings/notifications' as any)}
              >
                <Ionicons
                  name="notifications-outline"
                  size={18}
                  color={COLORS.textPrimary}
                  style={styles.notificationsIcon}
                />
                <Text style={styles.notificationsButtonText}>
                  Notifications & email
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.logoutButtonText}>Delete account</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.background,
    ...SHADOWS.cardLarge,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: TYPOGRAPHY.fontSize.extraLarge,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  profileUsername: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    color: COLORS.textSecondary,
  },
  athleteStatus: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.2,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  statsContainer: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    ...athleticStatNumber,
    fontSize: 24,
  },
  statLabel: {
    ...athleticStatLabel,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.borderPeach,
  },
  premiumPromoContainer: {
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.large,
    overflow: 'hidden',
  },
  premiumPromoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  premiumPromoTextContainer: {
    flex: 1,
  },
  premiumPromoTitle: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  premiumPromoSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
  },
  tryPremiumButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.medium,
  },
  tryPremiumText: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.lg,
  },
  iconButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.medium,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedIcon: {
    backgroundColor: 'rgba(243, 112, 33, 0.1)',
  },
  iconContent: {
    alignItems: 'center',
  },
  iconText: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.primary,
    marginTop: SPACING.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  tabContent: {
    marginBottom: SPACING.xl,
  },
  calendarContainer: {
    backgroundColor: COLORS.background,
    borderRadius: ATHLETIC.cardRadius,
    borderWidth: 1,
    borderColor: COLORS.borderPeach,
    borderTopWidth: 3,
    borderTopColor: COLORS.primary,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  navigationButton: {
    padding: SPACING.sm,
  },
  monthYearContainer: {
    flex: 1,
    alignItems: 'center',
  },
  calendarTitle: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  weekDayText: {
    width: '14.28%',
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayWrapper: {
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12.5,
  },
  usedDayWrapper: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  unusedDayWrapper: {
    backgroundColor: 'rgba(255, 82, 82, 0.3)',
  },
  todayWrapper: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  dayText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  todayButtonContainer: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  todayButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.medium,
  },
  todayButtonText: {
    color: COLORS.textButton,
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  stepsDataBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.md,
  },
  totalStepsContainer: {
    marginBottom: SPACING.md,
  },
  totalStepsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: SPACING.md,
  },
  progressSection: {
    flex: 1,
  },
  totalStepsTitle: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  progressContainer: {
    marginBottom: SPACING.sm,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginBottom: SPACING.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  currentSteps: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  rankText: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  stepsAchievementsContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: SPACING.md,
  },
  stepsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  stepsAchievementTitle: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  badgesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  badgeItem: {
    alignItems: 'center',
  },
  badge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  badgeTextContainer: {
    alignItems: 'center',
  },
  badgeNumber: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textButton,
  },
  badgeUnit: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textButton,
  },
  badgeLabel: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
  },
  editSection: {
    marginBottom: SPACING.xl,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
  editButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.textButton,
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  logoutContainer: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  notificationsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundCard,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.borderOrange,
    ...SHADOWS.card,
  },
  notificationsIcon: {
    marginRight: SPACING.sm,
  },
  notificationsButtonText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#b91c1c',
    ...SHADOWS.card,
  },
  logoutButtonText: {
    color: COLORS.textButton,
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
});
