import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  activateKeepAwakeAsync,
  deactivateKeepAwake,
} from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LogBox,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
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
  Line,
  Path,
} from 'react-native-svg';
import Toast from 'react-native-toast-message';
import { AppBannerAd } from '../../../components/ads/AppBannerAd';
import BackgroundGradient from '../../../components/BackgroundGradient';
import { FrostedPanel } from '../../../components/ui/FrostedPanel';
import {
  athleticStatLabel,
  athleticStatNumber,
} from '../../../constants/athleticDashboard';
import { COLORS } from '../../../constants/theme';
import { useNotifications } from '../../../hooks/useNotifications';
import { useAnimatedStepCount } from '../../../hooks/useAnimatedStepCount';
import { useStepCounter } from '../../../hooks/useStepCounter';
import {
  getLocalTodayKey,
  saveDailyGoal,
} from '../../../lib/dailySteps';
import {
  getUserStorageId,
  lastStepReminderKey,
} from '../../../lib/stepStorageKeys';
import {
  getHealthPermissionSettingsHint,
  getHealthSettingsButtonLabel,
  openHealthPermissionSettings,
} from '../../../lib/healthSteps';
import type { HealthStepsStatus, StepDataSource } from '../../../lib/healthStepsTypes';
import {
  buildEmptyWeekDays,
  computeWeeklyAverage,
  getChartMax,
  loadWeekStepData,
  WeekDayPoint,
} from '../../../lib/stepsWeekData';
import { ConnectPartnerModal } from '../../../components/community/ConnectPartnerModal';
import {
  formatLeaderboardValue,
  FriendSuggestion,
  getStepLeaderboard,
  getStepSharingPreference,
  getUserSuggestions,
  StepLeaderboardEntry,
  tabLabelToPeriod,
  updateStepSharing,
} from '../../../services/stepsSocialApi';
import type { TrainingPartner } from '../../../types/trainer';
import { useAuthContext } from '../../AuthProvider';

// Ignore the specific warning if needed
LogBox.ignoreLogs(['The value lock with tag']);

function getStepSourceLabel(
  stepSource: StepDataSource,
  healthStatus: HealthStepsStatus,
): string {
  if (stepSource === 'health') {
    return Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect';
  }
  if (healthStatus === 'authorized') {
    return Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect';
  }
  if (healthStatus === 'not_determined') {
    return 'Tap to connect step data';
  }
  return 'Saved steps';
}

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
        duration: 2200,
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
          stroke={COLORS.primary}
          strokeWidth={strokeWidth}
          strokeLinecap='round'
          fill='transparent'
          transform={`rotate(-90 ${radius} ${radius})`}
        />
      </SVG>

      <View style={styles.goalMilestone}>
        <Text style={styles.goalMilestoneLabel}>10k</Text>
        <View style={styles.goalMilestoneDot} />
      </View>

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
      <View style={styles.terrainSVG}>
        <SVG width='100%' height={1200}>
        {/* Dense perspective lines converging to center */}
        {[...Array(60)].map((_, i) => (
          <Path
            key={`center-${i}`}
            d={`M ${200 + (i - 30) * 15} 1200 L ${200 + (i - 30) * 45} 0`}
            stroke={COLORS.primary}
            strokeOpacity={0.45}
            strokeWidth='0.4'
          />
        ))}

        {/* Dense horizontal cross lines */}
        {[...Array(120)].map((_, i) => (
          <Path
            key={`cross-${i}`}
            d={`M -200 ${100 + i * 8} L 600 ${100 + i * 8}`}
            stroke={COLORS.primary}
            strokeOpacity={0.45}
            strokeWidth='0.4'
          />
        ))}
        </SVG>
      </View>
    </View>
  );
};
// Grid Terrain Component End

// Main Component Start
const KEEP_AWAKE_TAG = 'steps-tab';

const StepCounter = () => {
  const [isTabFocused, setIsTabFocused] = useState(true);
  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsTabFocused(true);
      void activateKeepAwakeAsync(KEEP_AWAKE_TAG);
      return () => {
        setIsTabFocused(false);
        void deactivateKeepAwake(KEEP_AWAKE_TAG);
      };
    }, []),
  );

  // Notification functionality
  const {
    notificationSettings,
    scheduleLeaderboardAlert,
    scheduleStepReminder,
  } = useNotifications();

  // Auth context for user ID
  const { user } = useAuthContext();

  const {
    dailyGoal,
    setDailyGoal,
    stepCount,
    totalSteps,
    stepsReady,
    permissionDenied,
    healthStatus,
    stepSource,
    requestPermissions,
  } = useStepCounter({
    enabled: isTabFocused,
  });

  const displayStepCount = useAnimatedStepCount(stepCount);
  const stepSourceLabel = getStepSourceLabel(stepSource, healthStatus);

  const checkStepProgress = useCallback(
    async (currentSteps: number) => {
      if (!notificationSettings?.stepStreakReminders) return;

      try {
        const progressPercentage = (currentSteps / dailyGoal) * 100;
        const currentHour = new Date().getHours();

        if (currentHour >= 18 && progressPercentage < 80) {
          const userId = getUserStorageId(user);
          if (!userId) return;

          const lastReminderDate = await AsyncStorage.getItem(
            lastStepReminderKey(userId),
          );
          const today = getLocalTodayKey();

          if (lastReminderDate !== today) {
            await scheduleStepReminder({
              hour: new Date().getHours(),
              minute: new Date().getMinutes() + 1,
            });
            await AsyncStorage.setItem(lastStepReminderKey(userId), today);
          }
        }

        if (currentSteps > dailyGoal * 0.9 && Math.random() > 0.95) {
          await scheduleLeaderboardAlert(
            'John',
            Math.floor(Math.random() * 500) + 100,
          );
        }
      } catch (error) {
        console.error('Error checking step progress:', error);
      }
    },
    [
      dailyGoal,
      notificationSettings?.stepStreakReminders,
      scheduleLeaderboardAlert,
      scheduleStepReminder,
      user,
    ],
  );

  useEffect(() => {
    if (!stepsReady) return;
    void checkStepProgress(stepCount);
  }, [stepCount, stepsReady, checkStepProgress]);

  const [weekDays, setWeekDays] = useState<WeekDayPoint[]>(() =>
    buildEmptyWeekDays(dailyGoal),
  );

  const refreshWeekData = useCallback(async () => {
    const week = await loadWeekStepData({
      user,
      dailyGoal,
      todaySteps: stepCount,
    });
    setWeekDays(week);
  }, [user, dailyGoal, stepCount]);

  useEffect(() => {
    refreshWeekData();
  }, [refreshWeekData]);

  useFocusEffect(
    useCallback(() => {
      refreshWeekData();
    }, [refreshWeekData]),
  );

  const weeklyAvg = computeWeeklyAverage(weekDays);

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.screen} edges={['top', 'right', 'left']}>
        {isTabFocused && Platform.OS === 'ios' ? <GridTerrain /> : null}

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
              stepCount={displayStepCount}
            />

            <Pressable
              onPress={() => {
                if (stepSource === 'health' || healthStatus === 'authorized') {
                  return;
                }
                Alert.alert(
                  Platform.OS === 'ios'
                    ? 'Connect Apple Health'
                    : 'Connect Health Connect',
                  getHealthPermissionSettingsHint(),
                  [
                    {
                      text: 'Connect',
                      onPress: () => {
                        void requestPermissions();
                      },
                    },
                    {
                      text: getHealthSettingsButtonLabel(),
                      onPress: () => {
                        void openHealthPermissionSettings();
                      },
                    },
                    { text: 'Cancel', style: 'cancel' },
                  ],
                );
              }}
            >
              <Text
                style={[
                  styles.stepSourceLabel,
                  stepSource !== 'health' &&
                    healthStatus !== 'authorized' &&
                    styles.stepSourceLabelAction,
                ]}
              >
                {stepSourceLabel}
                {stepSource !== 'health' && healthStatus !== 'authorized'
                  ? ' · Tap to connect'
                  : ''}
              </Text>
            </Pressable>

            {/* Quick Stats Row Start */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {displayStepCount.toLocaleString()}
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
                <Text style={styles.statValue}>
                  {weeklyAvg.toLocaleString()}
                </Text>
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
                      Platform.OS === 'ios'
                        ? 'Connect Apple Health'
                        : 'Connect Health Connect',
                      getHealthPermissionSettingsHint(),
                      [
                        {
                          text: 'Try Again',
                          onPress: () => {
                            void requestPermissions();
                          },
                        },
                        {
                          text: getHealthSettingsButtonLabel(),
                          onPress: () => {
                            void openHealthPermissionSettings();
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
                      {Platform.OS === 'ios'
                        ? 'Connect Apple Health'
                        : 'Connect Health Connect'}
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
            <WeekView days={weekDays} dailyGoal={dailyGoal} />
            <TotalStepsProgress totalSteps={totalSteps} />
            <FriendsList />
            <AppBannerAd />
          </View>
        </ScrollView>

        <GoalAdjustmentModal
          isVisible={isGoalModalVisible}
          onClose={() => setIsGoalModalVisible(false)}
          currentGoal={dailyGoal}
          onGoalChange={(goal) => {
            setDailyGoal(goal);
            void saveDailyGoal(user, goal);
          }}
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

const WeekView = ({
  days,
  dailyGoal,
}: {
  days: WeekDayPoint[];
  dailyGoal: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const chartMax = getChartMax(days, dailyGoal);

  return (
    <View style={styles.weekContainer}>
      <View style={styles.weekView}>
        {days.map((item) => (
          <DayCircle
            key={item.dateKey}
            day={item.day}
            progress={item.progress}
            isActive={item.isToday}
          />
        ))}
      </View>

      {isExpanded ? (
        <>
          <WeeklyGraph data={days} chartMax={chartMax} />
          <TouchableOpacity
            style={styles.expandButtonExpanded}
            onPress={() => setIsExpanded(false)}
          >
            <Feather name='chevron-up' size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setIsExpanded(true)}
        >
          <Feather name='chevron-down' size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};
// Week >> Day Steps Data Component End

// Expanded Graph View Start
const WeeklyGraph = ({
  data,
  chartMax,
}: {
  data: WeekDayPoint[];
  chartMax: number;
}) => {
  const { width } = useWindowDimensions();
  const animation = useSharedValue(0);

  useEffect(() => {
    // Add a small delay before starting the animation
    const timer = setTimeout(() => {
      animation.value = withTiming(1, { duration: 1000 });
    }, 100);

    return () => clearTimeout(timer);
  }, [data, chartMax]);

  const yForSteps = (steps: number) =>
    80 - (steps / Math.max(chartMax, 1)) * 60;

  // Helper function to create a smooth curve through points
  const createSmoothPath = (points: WeekDayPoint[]) => {
    if (points.length < 2) return '';

    // Calculate x and y coordinates for each point
    const coordinates = points.map((point, i) => ({
      x: (5 + (i * 90) / 6) * (width / 100),
      y: yForSteps(point.steps),
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
        <SVG height={120} width='100%'>
          {/* Connect points with smooth curved line */}
          <Path
            d={createSmoothPath(data)}
            stroke={COLORS.primary}
            strokeWidth={2}
            fill='none'
          />

          {/* Vertical connector lines from data points to labels */}
          {data.map((point, i) => (
            <Line
              key={`connector-${i}`}
              x1={`${5 + (i * 90) / 6}%`}
              y1={yForSteps(point.steps)}
              x2={`${5 + (i * 90) / 6}%`}
              y2='110'
              stroke='rgba(243, 112, 33, 0.35)'
              strokeWidth={1}
            />
          ))}

          {/* Data Points - updated styling */}
          {data.map((point, i) => (
            <Circle
              key={i}
              cx={`${5 + (i * 90) / 6}%`}
              cy={yForSteps(point.steps)}
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
            {data.map((point, i) => (
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
      <FrostedPanel style={styles.totalStepsBlurBackground} />

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
      onPress={() => setGoal(10000)}
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
function suggestionAsPartner(suggestion: FriendSuggestion): TrainingPartner {
  return {
    userId: suggestion.userId,
    displayName: suggestion.displayName,
    avatar: suggestion.avatar,
  };
}

const FriendsList = () => {
  const [activeTab, setActiveTab] = useState('Streaks');
  const [shareEnabled, setShareEnabled] = useState(true);
  const [entries, setEntries] = useState<StepLeaderboardEntry[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [connectTarget, setConnectTarget] = useState<FriendSuggestion | null>(
    null,
  );
  const [sentUserIds, setSentUserIds] = useState<Set<string>>(new Set());
  const [updatingShare, setUpdatingShare] = useState(false);
  const router = useRouter();
  const { user } = useAuthContext();

  const loadSharingPreference = useCallback(async () => {
    const pref = await getStepSharingPreference();
    if (pref !== null) setShareEnabled(pref);
  }, []);

  const loadLeaderboard = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setLoadingLeaderboard(false);
      return;
    }
    setLoadingLeaderboard(true);
    try {
      const period = tabLabelToPeriod(activeTab);
      const data = await getStepLeaderboard(period, 'friends', 5);
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [activeTab, user]);

  const loadSuggestions = useCallback(async () => {
    if (!user) return;
    setLoadingSuggestions(true);
    try {
      const data = await getUserSuggestions(20);
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadSharingPreference();
      loadLeaderboard();
      loadSuggestions();
    }, [loadSharingPreference, loadLeaderboard, loadSuggestions]),
  );

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const handleConnectSent = (friendUserId: string) => {
    setSentUserIds((prev) => new Set(prev).add(friendUserId));
    setSuggestions((prev) => prev.filter((s) => s.userId !== friendUserId));
    void loadLeaderboard();
  };

  const handleShareToggle = async (next: boolean) => {
    const previous = shareEnabled;
    setShareEnabled(next);
    setUpdatingShare(true);
    try {
      const ok = await updateStepSharing(next);
      if (!ok) {
        setShareEnabled(previous);
        Toast.show({
          type: 'error',
          text1: 'Could not update sharing',
          position: 'bottom',
        });
      }
    } catch {
      setShareEnabled(previous);
      Toast.show({
        type: 'error',
        text1: 'Could not update sharing',
        position: 'bottom',
      });
    } finally {
      setUpdatingShare(false);
    }
  };

  const period = tabLabelToPeriod(activeTab);

  const renderLeaderboardRow = (entry: StepLeaderboardEntry, index: number) => {
    const rank = entry.rank || index + 1;
    return (
      <View key={entry.userId} style={styles.friendRow}>
        <View style={styles.friendInfo}>
          <Text style={styles.friendRank}>{rank}</Text>
          <View style={styles.friendAvatar}>
            <Text style={styles.avatarText}>{entry.avatarLetter}</Text>
          </View>
          <Text style={styles.friendName} numberOfLines={1}>
            {entry.displayName}
          </Text>
        </View>
        <Text style={styles.streakCount}>
          {formatLeaderboardValue(period, entry.value)}
        </Text>
      </View>
    );
  };

  const renderSuggestionRow = (suggestion: FriendSuggestion) => {
    const sent = sentUserIds.has(suggestion.userId);
    return (
      <View key={suggestion.userId} style={styles.suggestionRow}>
        <View style={styles.friendInfo}>
          <View style={styles.friendAvatar}>
            <Text style={styles.avatarText}>{suggestion.avatarLetter}</Text>
          </View>
          <Text style={styles.friendName} numberOfLines={1}>
            {suggestion.displayName}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addFriendButton, sent && styles.addFriendButtonSent]}
          onPress={() => setConnectTarget(suggestion)}
          disabled={sent}
        >
          <Text style={styles.addFriendButtonText}>{sent ? 'Sent' : 'Add'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.friendsContainer}>
      <FrostedPanel style={styles.friendsBlurBackground} />

      <View style={styles.friendsContent}>
        <View style={styles.friendsHeaderRow}>
          <Text style={styles.friendsTitle}>Your friends</Text>
          {suggestions.length > 0 && (
            <TouchableOpacity onPress={() => setSuggestionsVisible(true)}>
              <Text style={styles.addFriendsLink}>Add friends</Text>
            </TouchableOpacity>
          )}
        </View>

        {suggestions.length > 0 && (
          <View style={styles.suggestionsPreview}>
            <Text style={styles.suggestionsLabel}>Suggested</Text>
            {suggestions.slice(0, 3).map(renderSuggestionRow)}
          </View>
        )}

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

        {!user ? (
          <Text style={styles.friendsEmptyText}>
            Sign in to see friends and leaderboards.
          </Text>
        ) : loadingLeaderboard ? (
          <ActivityIndicator
            color={COLORS.primary}
            style={styles.friendsLoader}
          />
        ) : entries.length === 0 ? (
          <Text style={styles.friendsEmptyText}>
            No friends on the board yet. Add someone from suggestions above.
          </Text>
        ) : (
          entries.map((entry, index) => renderLeaderboardRow(entry, index))
        )}

        <TouchableOpacity
          style={styles.seeAllButton}
          onPress={() => router.push('/stepLeaderboard')}
        >
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>

        <View style={styles.shareContainer}>
          <View style={styles.shareTextContainer}>
            <Text style={styles.shareTitle}>Share steps with followers</Text>
            <Text style={styles.shareSubtitle}>
              We'll share your steps with people that follow you
            </Text>
          </View>
          <Switch
            value={shareEnabled}
            onValueChange={handleShareToggle}
            disabled={updatingShare || !user}
            trackColor={{
              false: 'rgba(0, 0, 0, 0.1)',
              true: 'rgba(243, 112, 33, 0.3)',
            }}
            thumbColor={shareEnabled ? COLORS.primary : '#f4f3f4'}
          />
        </View>
      </View>

      <Modal
        visible={suggestionsVisible}
        animationType='slide'
        transparent
        onRequestClose={() => setSuggestionsVisible(false)}
      >
        <View style={styles.suggestionsModalOverlay}>
          <View style={styles.suggestionsModalCard}>
            <View style={styles.suggestionsModalHeader}>
              <Text style={styles.suggestionsModalTitle}>Add friends</Text>
              <TouchableOpacity onPress={() => setSuggestionsVisible(false)}>
                <Feather name='x' size={22} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            {loadingSuggestions ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : suggestions.length === 0 ? (
              <Text style={styles.friendsEmptyText}>
                No suggestions right now.
              </Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {suggestions.map(renderSuggestionRow)}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <ConnectPartnerModal
        visible={connectTarget != null}
        partner={connectTarget ? suggestionAsPartner(connectTarget) : null}
        onClose={() => setConnectTarget(null)}
        onSent={() => {
          if (connectTarget) {
            handleConnectSent(connectTarget.userId);
          }
        }}
      />
    </View>
  );
};
// Social Component End

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
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
    fontWeight: '900',
    letterSpacing: -2,
    color: COLORS.textPrimary,
    lineHeight: 72,
  },
  goalMilestone: {
    position: 'absolute',
    top: 2,
    alignSelf: 'center',
    alignItems: 'center',
  },
  goalMilestoneLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  goalMilestoneDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 2,
  },
  goalText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    opacity: 1,
  },
  // Main Circle Text End

  // Quick Stats Row Start
  stepSourceLabel: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    color: COLORS.textSecondary,
    opacity: 0.85,
  },
  stepSourceLabelAction: {
    color: COLORS.primary,
    opacity: 1,
  },
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
    ...athleticStatNumber,
    fontSize: 28,
  },
  statLabel: {
    ...athleticStatLabel,
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
    ...StyleSheet.absoluteFill,
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
  friendsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  friendsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  addFriendsLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  suggestionsPreview: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  suggestionsLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '500',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  addFriendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 56,
    alignItems: 'center',
  },
  addFriendButtonSent: {
    opacity: 0.65,
  },
  addFriendButtonText: {
    color: COLORS.textButton,
    fontSize: 13,
    fontWeight: '600',
  },
  friendsLoader: {
    marginVertical: 16,
  },
  friendsEmptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 12,
    paddingHorizontal: 8,
  },
  suggestionsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  suggestionsModalCard: {
    backgroundColor: COLORS.backgroundCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    padding: 20,
    paddingBottom: 32,
  },
  suggestionsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  suggestionsModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
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
