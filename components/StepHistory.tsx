import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Pedometer } from 'expo-sensors';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../constants/theme';

// Blob Blurred Background Start
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const BlobBackground = () => {
  const blob1Animation = useSharedValue(0);
  const blob2Animation = useSharedValue(0);
  const blob3Animation = useSharedValue(0);

  useEffect(() => {
    const animate = (value: any, duration: number) => {
      'worklet';
      value.value = withRepeat(
        withTiming(1, { duration }),
        -1,
        true
      );
    };

    animate(blob1Animation, 8000);
    animate(blob2Animation, 12000);
    animate(blob3Animation, 10000);
  }, []);

  const createBlobStyle = (animation: any) => {
    'worklet';
    return useAnimatedStyle(() => ({
      transform: [
        { translateX: animation.value * 40 - 20 },
        { translateY: animation.value * 40 - 20 }
      ]
    }));
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.backgroundContainer}>
        <AnimatedSvg style={[styles.blob, createBlobStyle(blob1Animation)]}>
          <Circle r={100} cx={100} cy={100} fill={COLORS.primaryOverlay} />
        </AnimatedSvg>
        <AnimatedSvg style={[styles.blob, styles.blob2, createBlobStyle(blob2Animation)]}>
          <Circle r={110} cx={110} cy={110} fill={COLORS.primaryLight} />
        </AnimatedSvg>
        <AnimatedSvg style={[styles.blob, styles.blob3, createBlobStyle(blob3Animation)]}>
          <Circle r={90} cx={90} cy={90} fill="rgba(0, 0, 0, 0.4)" />
        </AnimatedSvg>
      </View>
      <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
    </View>
  );
};
// Blob Blurred Background End


// Milestone Badge Component Start
type Achievement = {
  steps: number;
  unlocked: boolean;
  icon: string;
  color: string;
  label: string;
};

// Milestone Badge Data
const ACHIEVEMENTS: Achievement[] = [
  {
    steps: 10000,
    unlocked: true,
    icon: 'trophy',
    color: '#CD7F32',
    label: '10K Steps'
  },
  {
    steps: 50000,
    unlocked: false,
    icon: 'trophy',
    color: '#C0C0C0',
    label: '50K Steps'
  },
  {
    steps: 75000,
    unlocked: false,
    icon: 'trophy',
    color: '#FFD700',
    label: '75K Steps'
  },
  {
    steps: 100000,
    unlocked: false,
    icon: 'trophy-award',
    color: '#B9F2FF',
    label: '100K Steps'
  },
  {
    steps: 150000,
    unlocked: false,
    icon: 'trophy',
    color: '#4CAF50',
    label: '150K Steps'
  },
  {
    steps: 200000,
    unlocked: false,
    icon: 'trophy',
    color: '#9C27B0',
    label: '200K Steps'
  },
  {
    steps: 250000,
    unlocked: false,
    icon: 'trophy-award',
    color: COLORS.primary,
    label: '250K Steps'
  },
  {
    steps: 300000,
    unlocked: false,
    icon: 'trophy',
    color: '#2196F3',
    label: '300K Steps'
  },
  {
    steps: 350000,
    unlocked: false,
    icon: 'trophy-award',
    color: '#E91E63',
    label: '350K Steps'
  },
  {
    steps: 400000,
    unlocked: false,
    icon: 'trophy',
    color: '#673AB7',
    label: '400K Steps'
  },
  {
    steps: 450000,
    unlocked: false,
    icon: 'trophy-award',
    color: '#00BCD4',
    label: '450K Steps'
  },
  {
    steps: 500000,
    unlocked: false,
    icon: 'trophy',
    color: '#FFC107',
    label: '500K Steps'
  },
  {
    steps: 600000,
    unlocked: false,
    icon: 'trophy-award',
    color: '#FF4081',
    label: '600K Steps'
  },
  {
    steps: 700000,
    unlocked: false,
    icon: 'trophy',
    color: '#7C4DFF',
    label: '700K Steps'
  },
  {
    steps: 800000,
    unlocked: false,
    icon: 'trophy-award',
    color: '#64FFDA',
    label: '800K Steps'
  }
];

// Format Large Numbers
const formatNumber = (num: number): string => {
  return num >= 1000 ? `${num / 1000}K` : num.toString();
};

// Add Achievement Badge Component
const AchievementBadge = ({ achievement }: { achievement: Achievement }) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <TouchableOpacity
      style={styles.achievementItem}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      activeOpacity={0.7}
    >
      <Animated.View style={[
        styles.badge,
        !achievement.unlocked && styles.lockedBadge,
        { transform: [{ scale: isPressed ? 0.95 : 1 }] }
      ]}>
        {achievement.icon === 'trophy' ? (
          <FontAwesome5
            name="trophy"
            size={40}
            color={achievement.unlocked ? achievement.color : 'rgba(255,255,255,0.3)'}
          />
        ) : (
          <MaterialCommunityIcons
            name="trophy-award"
            size={45}
            color={achievement.unlocked ? achievement.color : 'rgba(255,255,255,0.3)'}
          />
        )}
        {!achievement.unlocked && (
          <View style={styles.lockOverlay}>
            <Feather name="lock" size={24} color="rgba(255,255,255,0.5)" />
          </View>
        )}
      </Animated.View>
      <Text style={styles.badgeNumber}>{formatNumber(achievement.steps)}</Text>
      <Text style={styles.badgeLabel}>{achievement.label}</Text>
    </TouchableOpacity>
  );
};


// Step History Component Start
// Function to get month name
const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month];
};

// Function to format date as "Month, DD"
const formatDate = (date: Date): string => {
  const month = getMonthName(date.getMonth());
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}, ${day}`;
};

// Function to determine if a date is today
const isToday = (dateStr: string): boolean => {
  const today = formatDate(new Date());
  return dateStr === today;
};

// Function to process history data and determine status
const processHistoryData = (rawData: any[]) => {
  const today = formatDate(new Date());

  return rawData.map(entry => ({
    ...entry,
    current: entry.date === today,
    completed: entry.steps > 0
  }));
};

const StepHistory = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Get the device-specific safe area insets
  const [activeTab, setActiveTab] = useState('History');
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to get today's date in the format "Month, DD"
  const getTodayFormatted = () => {
    return formatDate(new Date());
  };

  // Function to load step history from AsyncStorage
  const loadStepHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('stepHistory');
      if (savedHistory) {
        return JSON.parse(savedHistory);
      }
      return [];
    } catch (error) {
      console.error('Error loading step history:', error);
      return [];
    }
  };

  // Function to save step history to AsyncStorage
  const saveStepHistory = async (history: any[]) => {
    try {
      await AsyncStorage.setItem('stepHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Error saving step history:', error);
    }
  };

  // Function to update today's steps
  const updateTodaySteps = async (steps: number) => {
    const today = getTodayFormatted();
    const history = await loadStepHistory();

    // Find if today already exists in history
    const todayIndex = history.findIndex((item: any) => item.date === today);

    if (todayIndex >= 0) {
      // Update today's entry
      history[todayIndex].steps = steps;
    } else {
      // Add new entry for today
      history.unshift({ date: today, steps: steps });
    }

    // Save updated history
    await saveStepHistory(history);
    return history;
  };

  // Function to get steps from pedometer
  const getStepsFromPedometer = async () => {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) {
      console.log('Pedometer not available');
      return 0;
    }

    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0); // Start of today

    try {
      const { steps } = await Pedometer.getStepCountAsync(start, end);
      return steps;
    } catch (error) {
      console.error('Error getting step count:', error);
      return 0;
    }
  };

  // Initialize and update step history
  useEffect(() => {
    const initializeHistory = async () => {
      setIsLoading(true);

      // Load existing history
      let history = await loadStepHistory();
      const today = getTodayFormatted();

      // Check if we need to add today
      const todayExists = history.some((item: any) => item.date === today);

      if (!todayExists) {
        // Add today with 0 steps initially
        history.unshift({ date: today, steps: 0 });
        await saveStepHistory(history);
      }

      // Get today's steps from pedometer
      const steps = await getStepsFromPedometer();

      // Update today's steps
      history = await updateTodaySteps(steps);

      // Process and set history data
      setHistoryData(processHistoryData(history));
      setIsLoading(false);
    };

    initializeHistory();

    // Set up pedometer subscription to update steps in real-time
    let subscription: any;
    const subscribeToPedometer = async () => {
      const isAvailable = await Pedometer.isAvailableAsync();
      if (isAvailable) {
        subscription = Pedometer.watchStepCount((result: any) => {
          updateTodaySteps(result.steps).then(history => {
            setHistoryData(processHistoryData(history));
          });
        });
      }
    };

    subscribeToPedometer();

    // Clean up subscription
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <BlobBackground />
      <View style={{
        flex: 1,
        top: -10,
        paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 44) : insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right
      }}>
        {/* Fixed Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <BlurView intensity={20} tint="light" style={styles.blurContainer}>
              <Ionicons name="chevron-back" size={18} color="#fff" />
            </BlurView>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Progress</Text>
        </View>

        {/* Fixed Content */}
        <View style={styles.fixedContent}>
          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'History' && styles.activeTab]}
              onPress={() => setActiveTab('History')}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'History' && styles.activeTabText
              ]}>
                History
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'Achievements' && styles.activeTab]}
              onPress={() => setActiveTab('Achievements')}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'Achievements' && styles.activeTabText
              ]}>
                Achievements
              </Text>
            </TouchableOpacity>
          </View>

          {/* History */}
          {activeTab === 'History' ? (
            <>
              {/* Stat Box Start */}
              <View style={styles.statBoxContainer}>
                <View style={styles.statBox}>
                  <Feather name="activity" size={40} color={COLORS.primary} />
                  <Text style={styles.statBoxTitle}>Best Day</Text>
                  <Text style={styles.statBoxText}>
                    {isLoading ? '...' :
                      `${Math.max(...historyData.map((item: any) => item.steps), 0)} Steps`}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.fireEmoji}>🔥</Text>
                  <Text style={styles.statBoxTitle}>Total Steps</Text>
                  <Text style={styles.statBoxText}>
                    {isLoading ? '...' :
                      `${historyData.reduce((sum: number, item: any) => sum + item.steps, 0)} Steps`}
                  </Text>
                </View>
              </View>
              {/* Stat Box End */}

              {/* History Title */}
              <Text style={styles.historyTitle}>History</Text>
            </>
          ) : (
            // TODO: Add fixed achievements content here
            // This is where you put non-scrolling content like:
            // - Achievement summary
            // - Total achievements earned
            // - Current progress overview
            <View style={styles.achievementsContainer}>
              <Text style={styles.comingSoonText}>Achievements Coming Soon</Text>
            </View>
          )}
        </View>

        {/* Scrollable Content Section */}
        {activeTab === 'History' ? (
          <ScrollView
            style={styles.historyScrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : (
              historyData.map((item: any, index: number) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.stepCount}>{item.steps}</Text>
                    <Text style={styles.stepsLabel}>steps</Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.dateText}>{item.date}</Text>
                    <Ionicons
                      name={item.completed ? "checkmark-circle" : "time"}
                      size={20}
                      color={item.completed ? COLORS.primary : "#757575"}
                    />
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        ) : (
          <ScrollView style={styles.achievementsScrollContainer}>
            <View style={styles.achievementsGrid}>
              {ACHIEVEMENTS.map((achievement, index) => (
                <AchievementBadge
                  key={index}
                  achievement={achievement}
                />
              ))}
            </View>
          </ScrollView>
        )}

        <StatusBar style="light" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 26, 0, 1)',
  },
  // Blob Blurred Background Start
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
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
  // Blob Blurred Background End

  // Header Component Start
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  blurContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    paddingVertical: 8,
    paddingRight: 10,
    paddingLeft: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  fixedContent: {
    paddingHorizontal: 20,
  },
  // Header Component End

  // Tab Component Start
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '400',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '600',
  },
  // Tab Component End

  // Streak Stats Component Start
  statBoxContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    borderRadius: 15,
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressIcon: {
    width: 40,
    height: 40,
    marginRight: 4,
  },
  fireEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statBoxTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 4,
  },
  statBoxText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  historyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  historyScrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  stepCount: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  stepsLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },

  // Achievements Component Start
  achievementsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  achievementsScrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  comingSoonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '500',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
    gap: 16,
  },
  achievementItem: {
    width: '30%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  badge: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    backgroundColor: 'rgba(243, 112, 33, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: 'hidden',
  },
  lockedBadge: {
    opacity: 0.7,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  badgeLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  // Achievements Component End
});

export default StepHistory;

