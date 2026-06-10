import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  formatLeaderboardValue,
  getStepLeaderboard,
  StepLeaderboardEntry,
  tabLabelToPeriod,
} from '../services/stepsSocialApi';
import BackgroundGradient from './BackgroundGradient';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../constants/theme';

const TABS = ['Streaks', 'Steps today', 'Steps this week'] as const;

const StepLeaderboard = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] =
    useState<(typeof TABS)[number]>('Streaks');
  const [entries, setEntries] = useState<StepLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const period = tabLabelToPeriod(activeTab);
      const data = await getStepLeaderboard(period, 'all', 12);
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const period = tabLabelToPeriod(activeTab);

  const renderFriendRow = (entry: StepLeaderboardEntry, index: number) => {
    const rank = entry.rank || index + 1;
    const valueLabel = formatLeaderboardValue(period, entry.value);

    return (
      <BlurView
        key={entry.userId}
        intensity={20}
        tint='light'
        style={styles.friendRowContainer}
      >
        <View style={styles.friendRow}>
          <View style={styles.friendInfo}>
            <Text style={styles.friendRank}>{rank}</Text>
            <View style={styles.friendAvatar}>
              <Text style={styles.avatarText}>{entry.avatarLetter}</Text>
            </View>
            <Text style={styles.friendName} numberOfLines={1}>
              {entry.displayName}
            </Text>
          </View>
          <Text style={styles.valueText}>{valueLabel}</Text>
        </View>
      </BlurView>
    );
  };

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <BlurView intensity={20} tint='light' style={styles.blurContainer}>
              <Ionicons
                name='chevron-back'
                size={18}
                color={COLORS.textPrimary}
              />
            </BlurView>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leaderboard</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.tabsContainer}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.activeTabText,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator
              color={COLORS.primary}
              style={styles.loader}
              size='large'
            />
          ) : entries.length === 0 ? (
            <Text style={styles.emptyText}>
              No leaderboard data yet. Add friends or enable step sharing.
            </Text>
          ) : (
            <ScrollView
              style={styles.leaderboardContainer}
              showsVerticalScrollIndicator={false}
            >
              {entries.map((entry, index) => renderFriendRow(entry, index))}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </BackgroundGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: SPACING.lg,
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.xs,
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
  leaderboardContainer: {
    flex: 1,
  },
  loader: {
    marginTop: SPACING.xl,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
    textAlign: 'center',
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  friendRowContainer: {
    borderRadius: BORDER_RADIUS.medium,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundCard,
    ...SHADOWS.card,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  friendRank: {
    color: COLORS.textPrimary,
    width: 30,
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.circle,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  friendName: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    flex: 1,
  },
  valueText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
});

export default StepLeaderboard;
