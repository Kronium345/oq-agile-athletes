import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import BlobBackground from './BlobBackground';

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
    label: '10K Steps',
  },
  {
    steps: 50000,
    unlocked: false,
    icon: 'trophy',
    color: '#C0C0C0',
    label: '50K Steps',
  },
  {
    steps: 75000,
    unlocked: false,
    icon: 'trophy',
    color: '#FFD700',
    label: '75K Steps',
  },
  {
    steps: 100000,
    unlocked: false,
    icon: 'trophy-award',
    color: '#B9F2FF',
    label: '100K Steps',
  },
  {
    steps: 150000,
    unlocked: false,
    icon: 'trophy',
    color: '#4CAF50',
    label: '150K Steps',
  },
  {
    steps: 200000,
    unlocked: false,
    icon: 'trophy',
    color: '#9C27B0',
    label: '200K Steps',
  },
  {
    steps: 250000,
    unlocked: false,
    icon: 'trophy-award',
    color: COLORS.primary,
    label: '250K Steps',
  },
  {
    steps: 300000,
    unlocked: false,
    icon: 'trophy',
    color: '#2196F3',
    label: '300K Steps',
  },
  {
    steps: 350000,
    unlocked: false,
    icon: 'trophy-award',
    color: '#E91E63',
    label: '350K Steps',
  },
  {
    steps: 400000,
    unlocked: false,
    icon: 'trophy',
    color: '#673AB7',
    label: '400K Steps',
  },
  {
    steps: 450000,
    unlocked: false,
    icon: 'trophy-award',
    color: '#00BCD4',
    label: '450K Steps',
  },
  {
    steps: 500000,
    unlocked: false,
    icon: 'trophy',
    color: '#FFC107',
    label: '500K Steps',
  },
  {
    steps: 600000,
    unlocked: false,
    icon: 'trophy-award',
    color: '#FF4081',
    label: '600K Steps',
  },
  {
    steps: 700000,
    unlocked: false,
    icon: 'trophy',
    color: '#7C4DFF',
    label: '700K Steps',
  },
  {
    steps: 800000,
    unlocked: false,
    icon: 'trophy-award',
    color: '#64FFDA',
    label: '800K Steps',
  },
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
      <View
        style={[
          styles.badge,
          !achievement.unlocked && styles.lockedBadge,
          { transform: [{ scale: isPressed ? 0.95 : 1 }] },
        ]}
      >
        {achievement.icon === 'trophy' ? (
          <FontAwesome5
            name='trophy'
            size={40}
            color={
              achievement.unlocked ? achievement.color : COLORS.textSecondary
            }
          />
        ) : (
          <MaterialCommunityIcons
            name='trophy-award'
            size={45}
            color={
              achievement.unlocked ? achievement.color : COLORS.textSecondary
            }
          />
        )}
        {!achievement.unlocked && (
          <View style={styles.lockOverlay}>
            <Feather name='lock' size={24} color={COLORS.textSecondary} />
          </View>
        )}
      </View>
      <Text style={styles.badgeNumber}>{formatNumber(achievement.steps)}</Text>
      <Text style={styles.badgeLabel}>{achievement.label}</Text>
    </TouchableOpacity>
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

  return (
    <BackgroundGradient>
      <BlobBackground variant='scale' />
      <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'left']}>
        {/* Fixed Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <BlurView intensity={20} tint='light' style={styles.blurContainer}>
              <Ionicons
                name='chevron-back'
                size={18}
                color={COLORS.textButton}
              />
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
            // TODO: Add fixed achievements content here
            // This is where you put non-scrolling content like:
            // - Achievement summary
            // - Total achievements earned
            // - Current progress overview
            <View style={styles.achievementsContainer}>
              <Text style={styles.comingSoonText}>
                Achievements Coming Soon
              </Text>
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
          <ScrollView style={styles.achievementsScrollContainer}>
            <View style={styles.achievementsGrid}>
              {ACHIEVEMENTS.map((achievement, index) => (
                <AchievementBadge key={index} achievement={achievement} />
              ))}
            </View>
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
    left: 16,
    zIndex: 1,
  },
  blurContainer: {
    borderRadius: BORDER_RADIUS.medium,
    overflow: 'hidden',
    paddingVertical: SPACING.sm,
    paddingRight: SPACING.md,
    paddingLeft: SPACING.sm,
    backgroundColor: COLORS.backgroundCard,
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
  achievementsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  achievementsScrollContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  comingSoonText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    gap: SPACING.lg,
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
    backgroundColor: 'rgba(243, 112, 33, 0.18)',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.backgroundOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeNumber: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginTop: SPACING.sm,
  },
  badgeLabel: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.small,
    marginTop: SPACING.xs,
  },
  // Achievements Component End
});

export default StepHistory;
