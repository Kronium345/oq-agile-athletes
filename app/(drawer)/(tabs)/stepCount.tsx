import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pedometer } from 'expo-sensors';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  LogBox,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import SVG, {
  Circle,
  Defs,
  Line,
  Path,
  LinearGradient as SVGGradient,
  Stop,
} from 'react-native-svg';
import Toast from 'react-native-toast-message';
import api from '../../../api/axios';
import BackgroundGradient from '../../../components/BackgroundGradient';
import { COLORS } from '../../../constants/theme';
import { useNotifications } from '../../../hooks/useNotifications';
import { useAuthContext } from '../../AuthProvider';

// Ignore the specific warning if needed
LogBox.ignoreLogs(['The value lock with tag']);

// Progress Ring Component Start
const StepRingProgress = ({
  radius = 150,
  strokeWidth = 8,
  progress = 0.7,
  dailyGoal,
  stepCount,
}: {
  radius?: number;
  strokeWidth?: number;
  progress?: number;
  dailyGoal: number;
  stepCount: number;
}) => {
  const fill = useSharedValue(0);
  const innerRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * innerRadius;

  // Initialize the animation with a delay
  useEffect(() => {
    // Add a small delay before starting the animation
    const timer = setTimeout(() => {
      fill.value = withTiming(stepCount / dailyGoal, {
        duration: 1500,
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [stepCount, dailyGoal]);

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  const animatedProps = useAnimatedProps(() => ({
    strokeDasharray: [circumference * (fill.value || 0), circumference],
  }));

  return (
    <View
      style={{ width: radius * 2, height: radius * 2, alignSelf: 'center' }}
    >
      <SVG
        width={radius * 2}
        height={radius * 2}
        viewBox={`0 0 ${radius * 2} ${radius * 2}`}
      >
        <Defs>
          <SVGGradient id='grad' x1='0' y1='0' x2='0' y2='1'>
            <Stop offset='0' stopColor={COLORS.primary} />
            <Stop offset='1' stopColor='#FFA500' />
          </SVGGradient>
        </Defs>

        {/* Background circle */}
        <Circle
          cx={radius}
          cy={radius}
          r={innerRadius}
          stroke={COLORS.borderOrange}
          strokeWidth={strokeWidth}
          fill='transparent'
        />

        {/* Progress circle */}
        <AnimatedCircle
          animatedProps={animatedProps}
          cx={radius}
          cy={radius}
          r={innerRadius}
          stroke='url(#grad)'
          strokeWidth={strokeWidth}
          strokeLinecap='round'
          fill='transparent'
          transform={`rotate(-90 ${radius} ${radius})`}
        />
      </SVG>

      {/* Main Circle Top text */}
      <View style={[styles.textOverlay, { top: '28%' }]}>
        <View style={styles.stepsContainer}>
          <Feather
            name='activity'
            size={16}
            color={COLORS.textPrimary}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.stepsLabel}>Steps today</Text>
        </View>
      </View>

      {/* Main Circle Center text */}
      <View style={[styles.textOverlay, { top: '37%' }]}>
        <Text style={styles.stepsText}>{stepCount}</Text>
      </View>

      {/* Main Circle Bottom text */}
      <View style={[styles.textOverlay, { top: '70%' }]}>
        <Text style={styles.goalText}>
          Daily goal: {dailyGoal?.toLocaleString()}
        </Text>
      </View>
    </View>
  );
};
// Progress Ring Component End

// Streak Counter Start
const StreakCounter = ({ days = 0 }) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.streakContainer}
      onPress={() => router.push('/stepHistory')}
    >
      <Text style={styles.fireEmoji}>🔥</Text>
      <Text style={styles.streakText}>Progress</Text>
      <Feather
        name='chevron-right'
        size={16}
        color={COLORS.textPrimary}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          padding: 4,
          paddingLeft: 5,
          borderRadius: 50,
          marginLeft: 2,
        }}
      />
    </TouchableOpacity>
  );
};
// Streak Counter End

// Grid Terrain Component Start
const GridTerrain = () => {
  return (
    <View style={styles.terrainContainer}>
      <SVG width='100%' height='1200' style={styles.terrainSVG}>
        {/* Dense perspective lines converging to center */}
        {[...Array(60)].map((_, i) => (
          <Path
            key={`center-${i}`}
            d={`M ${200 + (i - 30) * 15} 1200 L ${200 + (i - 30) * 45} 0`}
            stroke='rgba(255, 255, 255, 0.4)'
            strokeWidth='0.4'
          />
        ))}

        {/* Dense horizontal cross lines */}
        {[...Array(120)].map((_, i) => (
          <Path
            key={`cross-${i}`}
            d={`M -200 ${100 + i * 8} L 600 ${100 + i * 8}`}
            stroke='rgba(255, 255, 255, 0.4)'
            strokeWidth='0.4'
          />
        ))}
      </SVG>
    </View>
  );
};
// Grid Terrain Component End

// Main Component Start
const StepCounter = () => {
  useKeepAwake();
  const [dailyGoal, setDailyGoal] = useState(4500);
  const [stepCount, setStepCount] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [isPedometerAvailable, setPedometerAvailable] = useState(false);
  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Notification functionality
  const {
    notificationSettings,
    scheduleLeaderboardAlert,
    scheduleStepReminder,
  } = useNotifications();

  // Auth context for user ID
  const { user } = useAuthContext();

  // Function to get today's date as a string
  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const saveSteps = async (newSteps: number) => {
    try {
      const today = getTodayString();
      const total = totalSteps + newSteps;

      // Save to AsyncStorage for offline support
      await AsyncStorage.setItem(`steps_${today}`, newSteps.toString());
      await AsyncStorage.setItem('totalSteps', total.toString());

      setStepCount(newSteps);
      setTotalSteps(total);

      if (user) {
        try {
          const userId = (user as any)?._id || (user as any)?.userId;
          if (userId) {
            await api.put(`/api/steps/${today}`, { stepCount: newSteps });
            console.log('✅ Steps saved to backend:', {
              date: today,
              stepCount: newSteps,
            });
          }
        } catch (backendError) {
          console.error('Error saving steps to backend:', backendError);
        }
      }

      // Check if we should trigger notifications based on progress
      checkStepProgress(newSteps);

      console.log('Saved steps:', { today: newSteps, total });
    } catch (error) {
      console.error('Error saving steps:', error);
    }
  };

  // Check step progress and trigger appropriate notifications
  const checkStepProgress = async (currentSteps: number) => {
    if (!notificationSettings?.stepStreakReminders) return;

    try {
      const progressPercentage = (currentSteps / dailyGoal) * 100;
      const currentHour = new Date().getHours();

      // If it's evening (after 6 PM) and user is below 80% of their goal
      if (currentHour >= 18 && progressPercentage < 80) {
        // Check if we've already sent a reminder today
        const lastReminderDate = await AsyncStorage.getItem('lastStepReminder');
        const today = getTodayString();

        if (lastReminderDate !== today) {
          // Schedule an immediate reminder
          await scheduleStepReminder({
            hour: new Date().getHours(),
            minute: new Date().getMinutes() + 1,
          });
          await AsyncStorage.setItem('lastStepReminder', today);
        }
      }

      // Example leaderboard alert (you can integrate with actual leaderboard data)
      if (currentSteps > dailyGoal * 0.9 && Math.random() > 0.95) {
        // Random trigger for demo
        await scheduleLeaderboardAlert(
          'John',
          Math.floor(Math.random() * 500) + 100,
        );
      }
    } catch (error) {
      console.error('Error checking step progress:', error);
    }
  };

  // Load saved steps on mount
  useEffect(() => {
    const loadSavedSteps = async () => {
      try {
        const today = getTodayString();

        if (user) {
          try {
            const userId = (user as any)?._id || (user as any)?.userId;
            if (userId) {
              const response = await api.get(`/api/steps/date/${today}`);
              if (
                (response as any).success &&
                typeof (response as any).stepCount === 'number'
              ) {
                setStepCount((response as any).stepCount);

                // Also get total steps
                const totalResponse = await api.get('/api/steps/total');
                if (
                  (totalResponse as any).success &&
                  typeof (totalResponse as any).totalSteps === 'number'
                ) {
                  setTotalSteps((totalResponse as any).totalSteps);
                }

                // Save to AsyncStorage for offline access
                await AsyncStorage.setItem(
                  `steps_${today}`,
                  (response as any).stepCount.toString(),
                );
                await AsyncStorage.setItem(
                  'totalSteps',
                  (totalResponse as any).totalSteps.toString(),
                );
                return;
              }
            }
          } catch (backendError) {
            console.log(
              'Backend not available, using local storage:',
              backendError,
            );
          }
        }

        // Fallback to local storage
        const [stepHistoryStr, totalStepsStr] = await Promise.all([
          AsyncStorage.getItem('stepHistory'),
          AsyncStorage.getItem('totalSteps'),
        ]);

        if (totalStepsStr) {
          setTotalSteps(parseInt(totalStepsStr, 10));
        }

        if (stepHistoryStr) {
          const stepHistory = JSON.parse(stepHistoryStr);
          const todaySteps = stepHistory[today] || 0;
          setStepCount(todaySteps);
        }
      } catch (error) {
        console.error('Error loading saved steps:', error);
      }
    };

    loadSavedSteps();
  }, [user]);

  // Initialize and subscribe to pedometer
  useEffect(() => {
    let subscription: any = null;

    const initPedometer = async () => {
      try {
        const isAvailable = await Pedometer.isAvailableAsync();
        setPedometerAvailable(isAvailable);

        if (!isAvailable) {
          console.log('⚠️ Pedometer not available on this device');
          return;
        }

        if (isAvailable) {
          console.log('✅ Pedometer is available, requesting permissions...');
          const { granted } = await Pedometer.requestPermissionsAsync();

          if (!granted) {
            console.log('❌ Motion permissions not granted');
            setPermissionDenied(true);

            // Show alert with option to open settings
            Alert.alert(
              'Motion Permission Required',
              Platform.OS === 'ios'
                ? 'Please enable Motion & Fitness in Settings > Privacy & Security > Motion & Fitness, then restart the app.'
                : 'Please enable Physical Activity permission in Settings > Apps > Expo Go > Permissions.',
              [
                {
                  text: 'Open Settings',
                  onPress: () => {
                    if (Platform.OS === 'ios') {
                      Linking.openURL('app-settings:');
                    } else {
                      Linking.openSettings();
                    }
                  },
                },
                {
                  text: 'Later',
                  style: 'cancel',
                },
              ],
            );
            return;
          }

          console.log('✅ Motion permissions granted');
          setPermissionDenied(false);

          if (Platform.OS === 'ios') {
            // Get start of today
            const start = new Date();
            start.setHours(0, 0, 0, 0);

            // Get current steps for today (iOS only)
            try {
              const result = await Pedometer.getStepCountAsync(
                start,
                new Date(),
              );
              if (result) {
                setStepCount(result.steps);
                saveSteps(result.steps);
              }
            } catch (iosError) {
              console.log(
                '⚠️ Could not get initial step count on iOS:',
                iosError,
              );
              // Continue anyway, watchStepCount will start tracking
            }
          } else {
            // Android: Steps will be loaded from AsyncStorage (from loadSavedSteps)
            // and watchStepCount will track new steps going forward
            console.log(
              '📱 Android: Using watchStepCount only (date range queries not supported)',
            );
          }

          // Subscribe to pedometer updates (works on both iOS and Android)
          subscription = Pedometer.watchStepCount((result: any) => {
            setStepCount(result.steps);
            saveSteps(result.steps);
          });
        }
      } catch (error) {
        console.error('Error initializing pedometer:', error);
      }
    };

    initPedometer();

    // Cleanup subscription
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return (
    <BackgroundGradient>
      <SafeAreaView
        style={{ flex: 1, top: -10 }}
        edges={['top', 'right', 'left']}
      >
        <GridTerrain />

        <View style={styles.headerContainer}>
          <View style={{ width: 40 }} />
          <StreakCounter days={0} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <StepRingProgress
              radius={150}
              dailyGoal={dailyGoal}
              stepCount={stepCount}
            />

            {/* Quick Stats Row Start */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {stepCount.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Steps Today</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {dailyGoal.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Daily Goal</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>2,450</Text>
                <Text style={styles.statLabel}>Weekly Avg</Text>
              </View>
            </View>
            {/* Quick Stats Row End */}

            {/* Action Buttons Row Start */}
            <View style={styles.actionButtonsRow}>
              {/* Permission Button (only shown if denied) or Change Goal Button */}
              {permissionDenied ? (
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { flex: 1, backgroundColor: 'rgba(255, 82, 82, 0.2)' },
                  ]}
                  onPress={() => {
                    Alert.alert(
                      'Enable Motion Permission',
                      Platform.OS === 'ios'
                        ? '1. Go to Settings\n2. Scroll to Privacy & Security\n3. Tap Motion & Fitness\n4. Enable for Expo Go\n5. Restart the app'
                        : '1. Go to Settings\n2. Tap Apps\n3. Find Expo Go\n4. Tap Permissions\n5. Enable Physical Activity\n6. Restart the app',
                      [
                        {
                          text: 'Open Settings',
                          onPress: () => {
                            if (Platform.OS === 'ios') {
                              Linking.openURL('app-settings:');
                            } else {
                              Linking.openSettings();
                            }
                          },
                        },
                        { text: 'OK', style: 'cancel' },
                      ],
                    );
                  }}
                >
                  <View style={styles.actionBtnContent}>
                    <Feather name='alert-circle' size={18} color='#FF5252' />
                    <Text style={[styles.actionBtnText, { color: '#FF5252' }]}>
                      Enable Permission
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionBtn, { flex: 1 }]}
                  onPress={() => setIsGoalModalVisible(true)}
                >
                  <View style={styles.actionBtnContent}>
                    <Feather
                      name='target'
                      size={18}
                      color={COLORS.textPrimary}
                    />
                    <Text style={styles.actionBtnText}>Adjust Goal</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
            {/* Action Buttons Row End */}

            {/* Rendering Of Heavy Components */}
            <WeekView />
            <TotalStepsProgress totalSteps={totalSteps} />
            <FriendsList />
          </View>
        </ScrollView>
        <StatusBar style='dark' />

        <GoalAdjustmentModal
          isVisible={isGoalModalVisible}
          onClose={() => setIsGoalModalVisible(false)}
          currentGoal={dailyGoal}
          onGoalChange={setDailyGoal}
        />
      </SafeAreaView>
      <Toast />
    </BackgroundGradient>
  );
};
// Main Component End

// Week >> Day Steps Data Component Start
const DayCircle = ({
  day,
  progress = 0,
  isActive = false,
}: {
  day: string;
  progress?: number;
  isActive?: boolean;
}) => (
  <View style={styles.dayColumn}>
    <SVG width={22} height={28} viewBox='0 0 32 32'>
      <Circle
        cx={16}
        cy={16}
        r={14}
        stroke='rgba(243, 112, 33, 0.2)'
        strokeWidth={4}
        fill='transparent'
      />
      <Circle
        cx={16}
        cy={16}
        r={14}
        stroke={COLORS.primary}
        strokeWidth={3}
        strokeDasharray={`${2 * Math.PI * 14 * progress} ${2 * Math.PI * 14}`}
        strokeLinecap='round'
        fill='transparent'
        transform={`rotate(-90 16 16)`}
      />
    </SVG>
    <Text style={[styles.dayText, isActive && styles.activeDayText]}>
      {day}
    </Text>
  </View>
);

const WeekView = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const days = [
    { day: 'Thu', progress: 0.3, steps: 690 },
    { day: 'Fri', progress: 0.5, steps: 8600 },
    { day: 'Sat', progress: 0.7, steps: 10000 },
    { day: 'Sun', progress: 0.2, steps: 7300 },
    { day: 'Mon', progress: 0.8, steps: 4300 },
    { day: 'Tue', progress: 0.4, steps: 8200 },
    { day: 'Wed', progress: 0.6, steps: 175 },
  ];

  return (
    <View style={styles.weekContainer}>
      <View style={styles.weekView}>
        {days.map((item, index) => (
          <DayCircle
            key={item.day}
            day={item.day}
            progress={item.progress}
            isActive={index === 3}
          />
        ))}
      </View>

      {isExpanded ? (
        <>
          <WeeklyGraph data={days} />
          <TouchableOpacity
            style={styles.expandButtonExpanded}
            onPress={() => setIsExpanded(false)}
          >
            <Feather
              name='chevron-up'
              size={24}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setIsExpanded(true)}
        >
          <Feather
            name='chevron-down'
            size={24}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};
// Week >> Day Steps Data Component End

// Expanded Graph View Start
const WeeklyGraph = ({ data }: { data: any[] }) => {
  const { width } = useWindowDimensions();
  const animation = useSharedValue(0);

  useEffect(() => {
    // Add a small delay before starting the animation
    const timer = setTimeout(() => {
      animation.value = withTiming(1, { duration: 1000 });
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Helper function to create a smooth curve through points
  const createSmoothPath = (points: any[]) => {
    if (points.length < 2) return '';

    // Calculate x and y coordinates for each point
    const coordinates = points.map((point: any, i: number) => ({
      x: (5 + (i * 90) / 6) * (width / 100),
      y: 80 - (point.steps / 10000) * 60,
    }));

    let path = `M ${coordinates[0].x} ${coordinates[0].y}`;

    // Create curved segments between points
    for (let i = 0; i < coordinates.length - 1; i++) {
      const current = coordinates[i];
      const next = coordinates[i + 1];

      // Control point calculations for smooth curves
      const controlX1 = current.x + (next.x - current.x) / 3;
      const controlY1 = current.y;
      const controlX2 = next.x - (next.x - current.x) / 3;
      const controlY2 = next.y;

      path += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${next.x} ${next.y}`;
    }

    return path;
  };

  return (
    <View style={styles.graphOuterContainer}>
      {/* Theme-matched gradient background */}
      <LinearGradient
        colors={[
          'rgba(243, 112, 33, 0.16)',
          'rgba(243, 112, 33, 0.08)',
          'rgba(255, 255, 255, 0.95)',
        ]}
        style={styles.graphGradientBackground}
      />

      {/* Content layer */}
      <View style={styles.graphContainer}>
        <SVG height={120} width='100%' style={styles.graph}>
          {/* Connect points with smooth curved line */}
          <Path
            d={createSmoothPath(data)}
            stroke={COLORS.primary}
            strokeWidth={2}
            fill='none'
          />

          {/* Vertical connector lines from data points to labels */}
          {data.map((point: any, i: number) => (
            <Line
              key={`connector-${i}`}
              x1={`${5 + (i * 90) / 6}%`}
              y1={80 - (point.steps / 10000) * 60}
              x2={`${5 + (i * 90) / 6}%`}
              y2='110'
              stroke='rgba(243, 112, 33, 0.35)'
              strokeWidth={1}
            />
          ))}

          {/* Data Points - updated styling */}
          {data.map((point: any, i: number) => (
            <Circle
              key={i}
              cx={`${5 + (i * 90) / 6}%`}
              cy={80 - (point.steps / 10000) * 60}
              r={5}
              fill={COLORS.primary}
              stroke='rgba(243, 112, 33, 0.2)'
              strokeWidth={1}
            />
          ))}
        </SVG>

        {/* Step Axis Labels Start */}
        <View style={styles.stepLabels}>
          <View style={styles.labelRow}>
            {data.map((point: any, i: number) => (
              <View
                key={i}
                style={[
                  styles.stepCountContainer,
                  {
                    left: `${5 + (i * 90) / 6}%`,
                    transform: [{ translateX: -20 }],
                  },
                ]}
              >
                <Text style={styles.stepCount}>
                  {point.steps >= 1000
                    ? `${(point.steps / 1000).toFixed(1)}K`
                    : point.steps}
                </Text>
              </View>
            ))}
          </View>
        </View>
        {/* Step Axis Labels End */}
      </View>
    </View>
  );
};
// Expanded Graph View End

// Total Steps Progress Component Start
const TotalStepsProgress = ({ totalSteps }: { totalSteps: number }) => {
  const formattedSteps = (totalSteps / 1000).toFixed(1) + 'K';
  const nextMilestone = Math.ceil(totalSteps / 50000) * 50000;
  const progress = totalSteps / nextMilestone;

  return (
    <View style={styles.totalStepsContainer}>
      <BlurView
        intensity={8}
        tint='light'
        style={styles.totalStepsBlurBackground}
      />

      <View style={styles.totalStepsContent}>
        <View style={styles.iconContainer}></View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <Text style={styles.totalStepsTitle}>
            Steps since you started using the app
          </Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progress * 100}%` },
                ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.currentSteps}>{formattedSteps}</Text>
              <Text style={styles.milestoneSteps}>
                {nextMilestone / 1000 + 'K'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};
// Total Steps Progress Component Start

// Change Goal Modal Start
const GoalAdjustmentModal = ({
  isVisible,
  onClose,
  currentGoal,
  onGoalChange,
}: {
  isVisible: boolean;
  onClose: () => void;
  currentGoal: number;
  onGoalChange: (goal: number) => void;
}) => {
  const [goal, setGoal] = useState(currentGoal);
  const modalAnimation = useSharedValue(0);

  // Step Goal Recommendation Conditions
  const getRecommendationInfo = (steps: number) => {
    if (steps <= 4400) {
      return {
        text: 'Easy Goal',
        color: '#4CAF50', // Green
        backgroundColor: 'rgba(74, 175, 80, 0.25)',
        icon: 'smile',
      };
    } else if (steps >= 4600) {
      return {
        text: 'Challenging Goal',
        color: COLORS.primary, // Orange
        backgroundColor: 'rgba(243, 112, 33, 0.25)',
        icon: 'trending-up',
      };
    } else {
      return {
        text: 'Recommended',
        color: '#7c3aed', // Purple
        backgroundColor: 'rgba(124, 58, 237, 0.25)',
        icon: 'zap',
      };
    }
  };

  const recommendationInfo = getRecommendationInfo(goal);

  const RecommendationBadge = ({ info }: { info: any }) => (
    <TouchableOpacity
      style={[
        styles.recommendationBadge,
        { backgroundColor: info.backgroundColor },
      ]}
      onPress={() => setGoal(4500)}
    >
      <Feather
        name={info.icon}
        size={16}
        color={info.color}
        style={styles.recommendationIcon}
      />
      <Text style={styles.recommendationText}>{info.text}</Text>
    </TouchableOpacity>
  );

  useEffect(() => {
    modalAnimation.value = withSpring(isVisible ? 1 : 0);
  }, [isVisible]);

  const modalStyle = useAnimatedStyle(() => {
    return {
      opacity: modalAnimation.value,
      transform: [
        {
          translateY: interpolate(modalAnimation.value, [0, 1], [100, 0]),
        },
      ],
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: modalAnimation.value * 0.5,
    };
  });

  return (
    <Modal
      transparent
      visible={isVisible}
      onRequestClose={onClose}
      animationType='none'
    >
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.modalOverlay, overlayStyle]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.modalContent, modalStyle]}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Feather name='x' size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>Set your daily goal</Text>
          <Text style={styles.modalSubtitle}>
            Achieve your daily goal to continue your streak
          </Text>

          <View style={styles.goalAdjuster}>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() =>
                setGoal((prev: number) => Math.max(1000, prev - 100))
              }
            >
              <Feather name='minus' size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>

            <View style={styles.goalDisplay}>
              <Text style={styles.goalValue}>{goal.toLocaleString()}</Text>
              <Text style={styles.goalUnit}>steps</Text>
            </View>

            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() =>
                setGoal((prev: number) => Math.min(50000, prev + 100))
              }
            >
              <Feather name='plus' size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <RecommendationBadge info={recommendationInfo} />

          <TouchableOpacity
            style={styles.setGoalButton}
            onPress={() => {
              onGoalChange(goal);
              onClose();
            }}
          >
            <Text style={styles.setGoalButtonText}>Set up Daily Goal</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};
// Change Goal Modal End

// Social Component Start
const FriendsList = () => {
  const [activeTab, setActiveTab] = useState('Streaks');
  const [shareEnabled, setShareEnabled] = useState(true);
  const router = useRouter();

  // Data for different tabs
  const friendsData = {
    streaks: [
      { id: 1, name: 'ro', streaks: 5, avatar: 'R' },
      { id: 2, name: 'Killa', streaks: 4, avatar: 'K' },
      { id: 3, name: 'Jacob', streaks: 0, avatar: 'J' },
      { id: 4, name: 'Daniel', streaks: 0, avatar: 'A' },
      { id: 5, name: 'Trump', streaks: 0, avatar: 'S' },
    ],
    stepsToday: [
      { id: 1, name: 'Killa', steps: 9235, avatar: 'K' },
      { id: 2, name: 'Jacob', steps: 0, avatar: 'J' },
      { id: 3, name: 'ro', steps: 0, avatar: 'R' },
      { id: 4, name: 'Daniel', steps: 0, avatar: 'A' },
      { id: 5, name: 'Trump', steps: 0, avatar: 'S' },
    ],
    stepsWeek: [
      { id: 1, name: 'Killa', steps: 45235, avatar: 'K' },
      { id: 2, name: 'Jacob', steps: 32150, avatar: 'J' },
      { id: 3, name: 'ro', steps: 28430, avatar: 'R' },
      { id: 4, name: 'Daniel', steps: 25800, avatar: 'A' },
      { id: 5, name: 'Trump', steps: 21650, avatar: 'S' },
    ],
  };

  const renderFriendRow = (friend: any, index: number) => {
    const value =
      activeTab === 'Streaks'
        ? `${friend.streaks} streaks`
        : `${friend.steps.toLocaleString()} steps`;

    return (
      <View key={friend.id} style={styles.friendRow}>
        <View style={styles.friendInfo}>
          <Text style={styles.friendRank}>{index + 1}</Text>
          <View style={styles.friendAvatar}>
            <Text style={styles.avatarText}>{friend.avatar}</Text>
          </View>
          <Text style={styles.friendName}>{friend.name}</Text>
        </View>
        <Text style={styles.streakCount}>{value}</Text>
      </View>
    );
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'Streaks':
        return friendsData.streaks;
      case 'Steps today':
        return friendsData.stepsToday;
      case 'Steps this week':
        return friendsData.stepsWeek;
      default:
        return friendsData.streaks;
    }
  };

  return (
    <View style={styles.friendsContainer}>
      <BlurView
        intensity={8}
        tint='light'
        style={styles.friendsBlurBackground}
      />

      <View style={styles.friendsContent}>
        <Text style={styles.friendsTitle}>Your friends</Text>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Streaks' && styles.activeTab]}
            onPress={() => setActiveTab('Streaks')}
          >
            <Text style={styles.tabText}>Streaks 🔥</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'Steps today' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('Steps today')}
          >
            <Text style={styles.tabText}>Steps today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'Steps this week' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('Steps this week')}
          >
            <Text style={styles.tabText}>Steps this week</Text>
          </TouchableOpacity>
        </View>

        {/* Friends List */}
        {getCurrentData().map((friend, index) =>
          renderFriendRow(friend, index),
        )}

        {/* See All Button */}
        <TouchableOpacity
          style={styles.seeAllButton}
          onPress={() => router.push('/stepLeaderboard')}
        >
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>

        {/* Share Toggle */}
        <View style={styles.shareContainer}>
          <View style={styles.shareTextContainer}>
            <Text style={styles.shareTitle}>Share steps with followers</Text>
            <Text style={styles.shareSubtitle}>
              We'll share your steps with people that follow you
            </Text>
          </View>
          <Switch
            value={shareEnabled}
            onValueChange={setShareEnabled}
            trackColor={{
              false: 'rgba(0, 0, 0, 0.1)',
              true: 'rgba(243, 112, 33, 0.3)',
            }}
            thumbColor={shareEnabled ? COLORS.primary : '#f4f3f4'}
          />
        </View>
      </View>
    </View>
  );
};
// Social Component End

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  content: {
    paddingTop: 10,
  },
  // Header Start
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '600',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.borderOrange,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
  },
  fireEmoji: {
    fontSize: 16,
  },
  streakText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  // Header End

  // Grid Terrain Styles Start
  terrainContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  terrainSVG: {
    transform: [
      { perspective: 1000 },
      { rotateX: '65deg' },
      { scale: 1.5 },
      { translateY: -50 },
    ],
    position: 'absolute',
    top: -200,
    opacity: 0.12,
  },
  // Grid Terrain Styles End

  // Main Circle Text Start
  textOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepsLabel: {
    color: COLORS.textPrimary,
    fontSize: 14,
    opacity: 0.8,
  },
  stepsText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    lineHeight: 72,
  },
  goalText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    opacity: 1,
  },
  // Main Circle Text End

  // Quick Stats Row Start
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  // Quick Stats Row End

  // Action Buttons Row Start
  actionButtonsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 20,
    width: '80%',
    alignSelf: 'center',
  },
  actionBtn: {
    backgroundColor: COLORS.backgroundCard,
    boxShadow: '0 0 8px rgba(0, 0, 0, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.borderOrange,
  },
  actionBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  // Action Buttons Row End

  // Week >> Day Steps Data  Start
  weekView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    marginBottom: 2,
    alignSelf: 'center',
  },
  dayColumn: {
    alignItems: 'center',
    gap: 8,
  },
  dayText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  activeDayText: {
    opacity: 1,
    fontWeight: '500',
  },
  expandButton: {
    alignSelf: 'center',
  },
  expandButtonExpanded: {
    alignSelf: 'center',
  },
  weekContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  graphOuterContainer: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 0 12px rgba(0, 0, 0, 0.5)',
    width: '100%',
    alignSelf: 'center',
  },
  graphGradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  graphContainer: {
    width: '100%',
    height: 160,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  graph: {
    width: '100%',
  },
  stepLabels: {
    position: 'absolute',
    bottom: 40,
    width: '95%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'center',
    alignItems: 'center',
  },
  labelRow: {
    width: '100%',
    position: 'relative',
  },
  stepCountContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(243, 112, 33, 0.18)',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    minWidth: 40,
    alignItems: 'center',
  },
  stepCount: {
    color: COLORS.textPrimary,
    textShadowColor: 'rgba(255, 255, 255, 0.75)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  // Line Graph End

  // Total Steps Component Start
  totalStepsContainer: {
    marginTop: 2,
    marginBottom: 20,
    paddingHorizontal: 16,
    position: 'relative',
  },
  totalStepsBlurBackground: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    bottom: 0,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundCard,
    boxShadow: '0 0 16px rgba(0, 0, 0, 0.25)',
    borderWidth: 0.5,
    borderColor: COLORS.borderOrange,
  },
  totalStepsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  iconContainer: {
    justifyContent: 'center',
    boxShadow: '0 0 12px rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
  },
  progressSection: {
    flex: 1,
  },
  totalStepsTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  progressContainer: {
    width: '100%',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(243, 112, 33, 0.12)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  currentSteps: {
    color: COLORS.textSecondary,
    fontSize: 12,
    opacity: 0.7,
  },
  milestoneSteps: {
    color: COLORS.textSecondary,
    fontSize: 12,
    opacity: 0.7,
  },
  // Total Steps Component End

  // Change Goal Modal Start
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  modalContent: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 16,
    boxShadow: '0 0 24px rgba(0, 0, 0, 0.45)',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 26,
    height: 26,
    borderRadius: 16,
    backgroundColor: 'rgba(243, 112, 33, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  goalAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  adjustButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(243, 112, 33, 0.12)',
    borderWidth: 1,
    borderColor: COLORS.borderOrange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalDisplay: {
    alignItems: 'center',
  },
  goalValue: {
    fontSize: 40,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  goalUnit: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  recommendationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 24,
  },
  recommendationIcon: {
    marginRight: 8,
  },
  recommendationText: {
    fontWeight: '500',
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  setGoalButton: {
    backgroundColor: COLORS.primary,
    boxShadow: '0 0 8px rgba(0, 0, 0, 0.3)',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  setGoalButtonText: {
    color: COLORS.textButton,
    fontSize: 16,
    fontWeight: '600',
  },
  // Change Goal Modal End

  // Social Component Start
  friendsContainer: {
    marginBottom: 120,
    paddingHorizontal: 16,
    position: 'relative',
  },
  friendsBlurBackground: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    bottom: 0,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 0.5,
    borderColor: COLORS.borderOrange,
  },
  friendsContent: {
    padding: 16,
  },
  friendsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(243, 112, 33, 0.12)',
    borderRadius: 20,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: COLORS.backgroundCard,
  },
  tabText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    textAlign: 'center',
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendRank: {
    color: COLORS.textPrimary,
    width: 24,
    fontSize: 14,
  },
  friendAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(243, 112, 33, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  friendName: {
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  streakCount: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  seeAllButton: {
    alignItems: 'center',
  },
  seeAllText: {
    color: COLORS.textButton,
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  shareContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  shareTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  shareTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  shareSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  // Social Component End
});

export default StepCounter;
