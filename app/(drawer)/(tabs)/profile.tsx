import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { eachDayOfInterval, endOfMonth, format, getDay, startOfMonth } from 'date-fns';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useClerk } from '@clerk/expo';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import api, { SERVER_URL } from '../../../api/axios';
import BackgroundGradient from '../../../components/BackgroundGradient';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import { useAuthContext } from '../../AuthProvider';

const { width, height } = Dimensions.get('window');
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

interface UserData {
  _id?: string;
  userId?: string;
  name?: string; 
  firstName?: string; 
  username?: string;
  email?: string;
  weight?: string;
  experience?: string;
  gender?: string;
  avatar?: string;
}

export default function Profile() {
  const router = useRouter();
  const { signOut } = useClerk();
  const authContext = useAuthContext();
  const user = authContext?.user || null;

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
  const [activityData, setActivityData] = useState<{[key: string]: boolean}>({});
  const [calendarIsAnimating, setCalendarIsAnimating] = useState(false);

  // Animation values for blobs
  const blob1Animation = useSharedValue(0);
  const blob2Animation = useSharedValue(0);
  const blob3Animation = useSharedValue(0);

  // Calendar animation
  const calendarAnimatedStyle = useAnimatedStyle(() => ({
    opacity: isAnimating ? 0.5 : 1,
  }));

  // Initialize blob animations
  useEffect(() => {
    const animate = (value: any, duration: number) => {
      'worklet';
      value.value = withRepeat(
        withTiming(1, { 
          duration,
          easing: Easing.inOut(Easing.ease)
        }),
        -1,
        true
      );
    };

    animate(blob1Animation, 15000);
    animate(blob2Animation, 25000);
    animate(blob3Animation, 20000);
  }, []);

  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
    fetchActivityData();
  }, []);

  const fetchUserData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      
      if (storedUser) {
        let parsedUser = null;
        try {
          parsedUser = JSON.parse(storedUser);
          if (parsedUser && typeof parsedUser === 'object') {
            setUserData(parsedUser);
            setWeight(parsedUser?.weight || '');
            setExperience(parsedUser?.experience || '');
            setGender(parsedUser?.gender || '');
          }
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          return; 
        }

        // Handle avatar URL
        if (parsedUser?.avatar) {
          setAvatar(getAvatarUrl(parsedUser.avatar));
        } else {
          setAvatar(getDefaultAvatar());
        }

        // Fetch latest data from server
        if (parsedUser?._id || parsedUser?.userId) {
          const userId = parsedUser._id || parsedUser.userId;
          const response = await api.get(`/user/${userId}`);

          setUserData(response.data || {});
          setWeight(response.data?.weight || '');
          setExperience(response.data?.experience || '');
          setGender(response.data?.gender || '');

          if (response.data?.avatar) {
            const avatarUrl = getAvatarUrl(response.data.avatar);
            setAvatar(avatarUrl);
            
            // Update AsyncStorage
            const updatedUser = { ...parsedUser, ...response.data, avatar: avatarUrl };
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
          }
        }
      }
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

      const response = await api.get(`/activity/${userId}/${startDate}/${endDate}`);
      
      const activities = (response.data || []).reduce((acc: {[key: string]: boolean}, activity: any) => {
        if (activity?.date) {
          const date = format(new Date(activity.date), 'yyyy-MM-dd');
          acc[date] = true;
        }
        return acc;
      }, {});

      setActivityData(activities);
    } catch (error) {
      console.error('Error fetching activity data:', error);
    }
  };

  const getAvatarUrl = (avatarPath: string) => {
    if (!avatarPath) return getDefaultAvatar();
    if (avatarPath.startsWith('http')) return avatarPath;
    
    const cleanPath = avatarPath.replace(/^\/+/, '');
    return `${SERVER_URL}/${cleanPath}`;
  };

  const getDefaultAvatar = () => {
    return 'https://img.icons8.com/?size=100&id=FDI4JxAMODWm&format=png&color=000000';
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'You need to grant permission to access your photos.');
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
          Alert.alert('File Too Large', 'Please select an image smaller than 5MB.');
          return;
        }

        setAvatar(imageUri);
        uploadImage(imageUri);
      }
    } catch (error) {
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
        Alert.alert('Error', 'Invalid user ID. Please log out and log in again.');
        return;
      }

      const fileName = uri.split('/').pop() || 'avatar.jpg';
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      
      const validTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      if (!fileExtension || !validTypes.includes(fileExtension)) {
        Alert.alert('Invalid File', 'Please select a valid image file (JPEG, PNG, GIF, or WebP)');
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
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
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
        const avatarUrl = getAvatarUrl(data.avatar);
        setAvatar(avatarUrl);

        const updatedUser = { ...parsedUser, avatar: avatarUrl };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Your profile image has been updated!',
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Upload Error', 'Failed to upload your profile picture. Please try again.');
    }
  };

  const handleSave = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      
      if (!storedUser || !token) return;

      const parsedUser = JSON.parse(storedUser);
      const userId = parsedUser?._id || parsedUser?.userId;

      const updatedData = { weight, experience, gender };
      const response = await api.put(`/user/${userId}`, updatedData);

      setUserData(response.data);
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
      await signOut();
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

  const createBlobStyle = (animation: any) => {
    return useAnimatedStyle(() => ({
      transform: [
        { scale: 1 + animation.value * 0.2 },
        { rotate: `${animation.value * 360}deg` },
      ],
      opacity: 0.7 + animation.value * 0.2,
    }));
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
    const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
    setSelectedDate(newDate);
    setTimeout(() => setCalendarIsAnimating(false), 250);
  };

  const handleNextMonth = () => {
    if (calendarIsAnimating) return;
    setCalendarIsAnimating(true);
    const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
    setSelectedDate(newDate);
    setTimeout(() => setCalendarIsAnimating(false), 250);
  };

  const jumpToToday = () => {
    if (calendarIsAnimating) return;
    setCalendarIsAnimating(true);
    setSelectedDate(new Date());
    setTimeout(() => setCalendarIsAnimating(false), 250);
  };

  const BlobBackground = () => (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.backgroundContainer}>
        <AnimatedSvg style={[styles.blob, createBlobStyle(blob1Animation)]}>
          <Circle r={100} cx={100} cy={100} fill={COLORS.primaryOverlay} />
        </AnimatedSvg>
        
        <AnimatedSvg style={[styles.blob, styles.blob2, createBlobStyle(blob2Animation)]}>
          <Circle r={110} cx={110} cy={110} fill={COLORS.primaryLight} />
        </AnimatedSvg>
        
        <AnimatedSvg style={[styles.blob, styles.blob3, createBlobStyle(blob3Animation)]}>
          <Circle r={90} cx={90} cy={90} fill={COLORS.backgroundOverlay} />
        </AnimatedSvg>
      </View>
      
      <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
    </View>
  );

  const renderCalendar = () => {
    const today = new Date();
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const days = eachDayOfInterval({ start, end });

    let firstDayOfWeek = getDay(start) - 1;
    if (firstDayOfWeek === -1) firstDayOfWeek = 6;

    const emptyDays = Array(firstDayOfWeek).fill(null);
    const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const isCurrentMonth = format(selectedDate, 'yyyy-MM') === format(today, 'yyyy-MM');

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            onPress={handlePreviousMonth}
            style={styles.navigationButton}
            disabled={calendarIsAnimating}
          >
            <Ionicons name="chevron-back" size={20} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>

          <View style={styles.monthYearContainer}>
            <Text style={styles.calendarTitle}>{format(selectedDate, 'MMMM yyyy')}</Text>
          </View>

          <TouchableOpacity
            onPress={handleNextMonth}
            style={styles.navigationButton}
            disabled={calendarIsAnimating}
          >
            <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>
        </View>

        <View style={styles.weekDaysRow}>
          {weekDays.map((day, index) => (
            <Text key={index} style={styles.weekDayText}>{day}</Text>
          ))}
        </View>

        <Animated.View style={[styles.daysGrid, calendarAnimatedStyle]}>
          {emptyDays.map((_, index) => (
            <View key={`empty-${index}`} style={styles.dayCell} />
          ))}
          {days.map((date) => {
            const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
            const wasUsed = wasAppUsedOnDate(date);
            const isPastOrToday = date <= today;

            return (
              <View key={date.toString()} style={styles.dayCell}>
                <View style={[
                  styles.dayWrapper,
                  isPastOrToday && (wasUsed ? styles.usedDayWrapper : styles.unusedDayWrapper),
                  isToday && styles.todayWrapper
                ]}>
                  <Text style={styles.dayText}>
                    {format(date, 'd')}
                  </Text>
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
    const totalSteps = 10900;
    const formattedSteps = (totalSteps / 1000).toFixed(1) + 'K';

    return (
      <View style={styles.stepsDataBox}>
        <View style={styles.totalStepsContainer}>
          <View style={styles.totalStepsContent}>
            <View style={styles.iconContainer}>
              <Feather name="pie-chart" size={26} color="#fff" />
            </View>

            <View style={styles.progressSection}>
              <Text style={styles.totalStepsTitle}>Total Steps Tracked</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: '85%' }]} />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={styles.currentSteps}>{formattedSteps}</Text>
                  <Text style={styles.rankText}>Top 1%</Text>
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
            <Ionicons name="chevron-forward" size={18} color="rgba(255, 255, 255, 0.75)" />
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

  return (
    <BackgroundGradient>
      <BlobBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{ uri: avatar }}
                style={styles.profileImage}
                onError={() => setAvatar(getDefaultAvatar())}
              />
              <TouchableOpacity onPress={pickImage} style={styles.editIcon}>
                <Ionicons name="add-circle" size={24} color={COLORS.background} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {userData?.name || userData?.firstName || user?.name || 'User'}
              </Text>
              <Text style={styles.profileUsername}>
                {userData?.email || user?.email || 'email@example.com'}
                <Ionicons name="copy-outline" size={14} color="rgba(255, 255, 255, 0.6)" />
              </Text>
            </View>
          </View>



          {/* Tab Navigation */}
          <View style={styles.iconRow}>
            <TouchableOpacity
              style={[styles.iconButton, selectedTab === 'calendar' && styles.selectedIcon]}
              onPress={() => setSelectedTab('calendar')}
            >
              <View style={styles.iconContent}>
                <Ionicons 
                  name="calendar-outline" 
                  size={24} 
                  color={selectedTab === 'calendar' ? COLORS.primary : 'rgba(255, 255, 255, 0.6)'} 
                />
                {selectedTab === 'calendar' && <Text style={styles.iconText}>Calendar</Text>}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconButton, selectedTab === 'steps' && styles.selectedIcon]}
              onPress={() => setSelectedTab('steps')}
            >
              <View style={styles.iconContent}>
                <Ionicons 
                  name="walk-outline" 
                  size={24} 
                  color={selectedTab === 'steps' ? COLORS.primary : 'rgba(255, 255, 255, 0.6)'} 
                />
                {selectedTab === 'steps' && <Text style={styles.iconText}>Step Stats</Text>}
              </View>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {renderTabContent()}
          </View>

          {/* Profile Edit Section */}
          {editing ? (
            <View style={styles.editSection}>
              <TextInput
                style={styles.input}
                placeholder="Weight (kg)"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={weight}
                onChangeText={setWeight}
              />
              <TextInput
                style={styles.input}
                placeholder="Experience Level"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={experience}
                onChangeText={setExperience}
              />
              <TextInput
                style={styles.input}
                placeholder="Gender"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={gender}
                onChangeText={setGender}
              />
              <View style={styles.editButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.logoutContainer}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      <Toast />
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
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    position: 'absolute',
    width: 200,
    height: 200,
    left: '10%',
    top: '20%',
  },
  blob2: {
    left: '60%',
    top: '45%',
  },
  blob3: {
    left: '30%',
    top: '70%',
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.medium,
    marginBottom: SPACING.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.md,
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
    marginHorizontal: 60,
    marginBottom: SPACING.xl,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)', // Red transparent background from template
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5, // For Android shadow
  },
  logoutButtonText: {
    color: '#ff4444', // Red text color from template
    fontSize: 16,
    fontWeight: '500',
  },
});
