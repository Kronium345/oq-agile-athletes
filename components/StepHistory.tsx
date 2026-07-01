import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import {
  buildDailyStepAchievements,
  type DailyStepAchievement,
} from '../lib/stepAchievements';
import {
  loadTodayStepsFromLocal,
  loadStepHistoryLocal,
  saveStepHistoryLocal,
} from '../lib/dailySteps';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import api from '../api/axios';
import { useAuthContext } from '../app/AuthProvider';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../constants/theme';
import BackgroundGradient from './BackgroundGradient';

const GRID_HORIZONTAL_PADDING = SPACING.lg;
const GRID_GAP = SPACING.md;
const SCREEN_WIDTH = Dimensions.get('window').width;
const ACHIEVEMENT_CARD_WIDTH =
  (SCREEN_WIDTH - GRID_HORIZONTAL_PADDING * 2 - GRID_GAP) / 2;

type Achievement = DailyStepAchievement;

// Format Large Numbers
const formatNumber = (num: number): string => {
  return num >= 1000 ? `${num / 1000}K` : num.toString();
};

const AchievementBadge = ({ achievement }: { achievement: Achievement }) => {
  const iconColor = achievement.unlocked
    ? achievement.color
    : COLORS.textSecondary;

  return (
    <View style={styles.achievementItem}>
      <View
        style={[
          styles.badge,
          {
            borderColor: achievement.color,
            backgroundColor: achievement.unlocked
              ? `${achievement.color}22`
              : COLORS.backgroundAlt,
          },
          !achievement.unlocked && styles.lockedBadge,
        ]}
      >
        <Text
          style={[
            styles.badgeInnerLabel,
            achievement.unlocked && { color: achievement.color },
          ]}
          numberOfLines={1}
        >
          {achievement.label}
        </Text>
        {achievement.icon === 'trophy' ? (
          <FontAwesome5 name='trophy' size={36} color={iconColor} />
        ) : (
          <MaterialCommunityIcons name='trophy-award' size={38} color={iconColor} />
        )}
        {!achievement.unlocked && (
          <View style={styles.lockOverlay}>
            <Feather name='lock' size={20} color={COLORS.textSecondary} />
          </View>
        )}
      </View>
      <Text
        style={[
          styles.badgeNumber,
          achievement.unlocked && { color: achievement.color },
        ]}
      >
        {formatNumber(achievement.steps)}
      </Text>
      <Text style={styles.badgeStatus}>
        {achievement.unlocked ? 'Unlocked' : 'Locked'}
      </Text>
    </View>
  );
};

// Step History Component Start
const getMonthName = (month: number): string => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return months[month];
};

const formatDate = (date: Date): string => {
  const month = getMonthName(date.getMonth());
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}, ${day}`;
};

const isToday = (dateStr: string): boolean => {
  const today = formatDate(new Date());
  return dateStr === today;
};

const processHistoryData = (rawData: any[]) => {
  const today = formatDate(new Date());

  return rawData.map((entry) => ({
    ...entry,
    current: entry.date === today,
    completed: entry.steps > 0,
  }));
};

const StepHistory = () => {
  const router = useRouter();
  const { user } = useAuthContext();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('History');
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [todaySteps, setTodaySteps] = useState(0);
  const [achievementsLoading, setAchievementsLoading] = useState(true);
  const achievements = buildDailyStepAchievements(todaySteps);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  // Function to get today's date in the format "Month, DD"
  const getTodayFormatted = () => {
    return formatDate(new Date());
  };

  // Function to load step history from AsyncStorage
  const loadStepHistory = async () => {
    return loadStepHistoryLocal(user);
  };

  const saveStepHistory = async (history: any[]) => {
    await saveStepHistoryLocal(user, history);
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

  const convertDateToFormatted = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return formatDate(date);
  };

  // Function to convert "Month, DD" to YYYY-MM-DD format
  const convertFormattedToDate = (formatted: string): string => {
    const today = new Date();
    const todayFormatted = formatDate(today);
    if (formatted === todayFormatted) {
      return today.toISOString().split('T')[0];
    }
    // For other dates, we'll need to parse - but for now, return today's date
    return today.toISOString().split('T')[0];
  };

  // Initialize and load step history from backend
  useEffect(() => {
    const loadHistoryFromBackend = async () => {
      setIsLoading(true);

      if (!user) {
        // Fallback to local storage if no user
        const localHistory = await loadStepHistory();
        setHistoryData(processHistoryData(localHistory));
        setIsLoading(false);
        return;
      }

      try {
        // Fetch step history from backend (last 30 days)
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

        const response = await api.get(
          `/api/steps/history?startDate=${startDate}&endDate=${endDate}`,
        );

        if (
          (response as any).success &&
          Array.isArray((response as any).data)
        ) {
          const formattedHistory = (response as any).data.map((item: any) => ({
            date: convertDateToFormatted(item.date),
            steps: item.stepCount || 0,
          }));

          // Sort by date (most recent first)
          formattedHistory.sort((a: any, b: any) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB.getTime() - dateA.getTime();
          });

          // Save to AsyncStorage for offline access
          await saveStepHistory(formattedHistory);

          setHistoryData(processHistoryData(formattedHistory));
        } else {
          // Fallback to local storage
          const localHistory = await loadStepHistory();
          setHistoryData(processHistoryData(localHistory));
        }
      } catch (error) {
        console.error('Error loading step history from backend:', error);
        // Fallback to local storage
        const localHistory = await loadStepHistory();
        setHistoryData(processHistoryData(localHistory));
      } finally {
        setIsLoading(false);
      }
    };

    loadHistoryFromBackend();
  }, [user]);

  useEffect(() => {
    const loadTodayStepsForAchievements = async () => {
      setAchievementsLoading(true);
      try {
        const steps = await loadTodayStepsFromLocal(user);
        setTodaySteps(steps);
      } catch {
        setTodaySteps(0);
      } finally {
        setAchievementsLoading(false);
      }
    };
    void loadTodayStepsForAchievements();
  }, [user]);

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'left']}>
        {/* Fixed Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole='button'
            accessibilityLabel='Go back'
          >
            <Ionicons
              name='chevron-back'
              size={22}
              color={COLORS.textButton}
            />
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
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'History' && styles.activeTabText,
                ]}
              >
                History
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'Achievements' && styles.activeTab,
              ]}
              onPress={() => setActiveTab('Achievements')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'Achievements' && styles.activeTabText,
                ]}
              >
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
                  <Feather name='activity' size={40} color={COLORS.primary} />
                  <Text style={styles.statBoxTitle}>Best Day</Text>
                  <Text style={styles.statBoxText}>
                    {isLoading
                      ? '...'
                      : `${Math.max(...historyData.map((item: any) => item.steps), 0)} Steps`}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.fireEmoji}>🔥</Text>
                  <Text style={styles.statBoxTitle}>Total Steps</Text>
                  <Text style={styles.statBoxText}>
                    {isLoading
                      ? '...'
                      : `${historyData.reduce((sum: number, item: any) => sum + item.steps, 0)} Steps`}
                  </Text>
                </View>
              </View>
              {/* Stat Box End */}

              {/* History Title */}
              <Text style={styles.historyTitle}>History</Text>
            </>
          ) : (
            <View style={styles.achievementsSummary}>
              <Text style={styles.achievementsSummaryTitle}>
                Daily step milestones
              </Text>
              <Text style={styles.achievementsSummaryText}>
                {achievementsLoading
                  ? 'Loading progress…'
                  : `${unlockedCount} of ${achievements.length} unlocked today · ${todaySteps.toLocaleString()} steps`}
              </Text>
            </View>
          )}
        </View>

        {/* Scrollable Content Section */}
        {activeTab === 'History' ? (
          <ScrollView
            style={styles.historyScrollContainer}
            contentContainerStyle={{
              paddingBottom: insets.bottom + SPACING.xxl + SPACING.lg,
            }}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <ActivityIndicator
                size='large'
                color={COLORS.primary}
                style={{ marginTop: 20 }}
              />
            ) : (
              historyData.map((item: any, index: number) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.stepCount}>
                      {item.steps.toLocaleString()}
                    </Text>
                    <Text style={styles.stepsLabel}>steps</Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.dateText}>{item.date}</Text>
                    <Ionicons
                      name={item.completed ? 'checkmark-circle' : 'time'}
                      size={20}
                      color={
                        item.completed ? COLORS.primary : COLORS.textSecondary
                      }
                    />
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.achievementsScrollContainer}
            contentContainerStyle={{
              paddingBottom: insets.bottom + SPACING.xxl,
            }}
            showsVerticalScrollIndicator={false}
          >
            {achievementsLoading ? (
              <ActivityIndicator
                size='large'
                color={COLORS.primary}
                style={styles.achievementsLoader}
              />
            ) : (
              <View style={styles.achievementsGrid}>
                {achievements.map((achievement) => (
                  <AchievementBadge
                    key={achievement.steps}
                    achievement={achievement}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        )}

        <StatusBar style='light' />
      </SafeAreaView>
    </BackgroundGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },

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
    left: SPACING.lg,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
    ...SHADOWS.card,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    letterSpacing: 0.5,
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  fixedContent: {
    paddingHorizontal: SPACING.lg,
  },
  // Header Component End

  // Tab Component Start
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: 4,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.large,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  activeTabText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  // Tab Component End

  statBoxContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statBox: {
    flex: 1,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.lg,
    backgroundColor: COLORS.backgroundCard,
    ...SHADOWS.card,
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
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
    marginBottom: SPACING.xs,
  },
  statBoxText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  historyTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    marginBottom: SPACING.md,
  },
  historyScrollContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  stepCount: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.extraLarge,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  stepsLabel: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dateText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },

  // Achievements Component Start
  achievementsSummary: {
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  achievementsSummaryTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    marginBottom: SPACING.xs,
  },
  achievementsSummaryText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
    lineHeight: 20,
  },
  achievementsScrollContainer: {
    flex: 1,
  },
  achievementsLoader: {
    marginTop: SPACING.xl,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_HORIZONTAL_PADDING,
    gap: GRID_GAP,
  },
  achievementItem: {
    width: ACHIEVEMENT_CARD_WIDTH,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  badge: {
    width: '100%',
    minHeight: 118,
    borderRadius: BORDER_RADIUS.large,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    overflow: 'hidden',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    gap: SPACING.xs,
  },
  badgeInnerLabel: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  lockedBadge: {
    opacity: 0.85,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeNumber: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  badgeStatus: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    marginTop: 2,
    textAlign: 'center',
  },
  // Achievements Component End
});

export default StepHistory;
