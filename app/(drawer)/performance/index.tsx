import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundGradient from '../../../components/BackgroundGradient';
import { ScoreCard } from '../../../components/performance/ScoreCard';
import { TrainerScreenHeader } from '../../../components/trainers/TrainerScreenHeader';
import { drawerScreenStyles } from '../../../constants/drawerScreen';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../../constants/theme';
import { usePremium } from '../../../app/PremiumProvider';
import { useDrawerListPadding } from '../../../hooks/useDrawerListPadding';
import {
  formatRecoveryPercent,
  recoveryScoreColor,
  trainingLoadColor,
} from '../../../lib/performance/scoring';
import type { PerformanceCheckInRecord } from '../../../lib/performance/types';
import {
  fetchPerformanceHistory,
  fetchPerformanceToday,
} from '../../../services/performanceApi';
import { useAuthContext } from '../../AuthProvider';

export default function PerformanceDashboardScreen() {
  const router = useRouter();
  const authContext = useAuthContext();
  const user = authContext?.user ?? null;
  const listPadding = useDrawerListPadding();
  const { isPremium } = usePremium();
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState<Awaited<
    ReturnType<typeof fetchPerformanceToday>
  > | null>(null);
  const [history, setHistory] = useState<PerformanceCheckInRecord[]>([]);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [todayData, historyData] = await Promise.all([
        fetchPerformanceToday(user),
        fetchPerformanceHistory(user, 7),
      ]);
      setToday(todayData);
      setHistory(historyData);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const checkIn = today?.checkIn;

  return (
    <BackgroundGradient>
      <SafeAreaView style={drawerScreenStyles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={[drawerScreenStyles.scrollContent, listPadding]}
        >
          <TrainerScreenHeader
            title="Today's Recovery"
            subtitle='Sleep, energy, stress & training readiness'
            avoidDrawerMenu
          />

          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={styles.loader} />
          ) : !user ? (
            <Text style={styles.empty}>Sign in to track your recovery.</Text>
          ) : (
            <>
              {!today?.hasCheckIn ? (
                <TouchableOpacity
                  style={styles.cta}
                  onPress={() =>
                    router.push('/(drawer)/performance/check-in' as any)
                  }
                >
                  <Ionicons name='add-circle' size={22} color='#fff' />
                  <Text style={styles.ctaText}>Complete today's check-in</Text>
                </TouchableOpacity>
              ) : checkIn ? (
                <View style={styles.hero}>
                  <Text style={styles.heroTitle}>Recovery score</Text>
                  <View
                    style={[
                      styles.heroRing,
                      {
                        borderColor: recoveryScoreColor(
                          checkIn.recoveryScore,
                        ),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.heroScore,
                        {
                          color: recoveryScoreColor(checkIn.recoveryScore),
                        },
                      ]}
                    >
                      {formatRecoveryPercent(checkIn.recoveryScore)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.loadBadge,
                      {
                        backgroundColor: `${trainingLoadColor(checkIn.trainingLoad)}22`,
                      },
                    ]}
                  >
                    <Text style={styles.loadLabel}>Training load</Text>
                    <Text
                      style={[
                        styles.loadText,
                        { color: trainingLoadColor(checkIn.trainingLoad) },
                      ]}
                    >
                      {checkIn.trainingLoad}
                    </Text>
                  </View>
                </View>
              ) : null}

              {checkIn ? (
                <View style={styles.scoreRow}>
                  <ScoreCard label='Sleep' score={checkIn.sleepScore} compact asPercent />
                  <ScoreCard
                    label='Stress'
                    score={checkIn.stressScore}
                    compact
                    asPercent
                  />
                  <ScoreCard
                    label='Energy'
                    score={checkIn.energyScore}
                    compact
                    asPercent
                  />
                </View>
              ) : null}

              {checkIn && checkIn.recommendations.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Today's tips</Text>
                  {checkIn.recommendations.slice(0, 3).map((rec) => (
                    <View key={rec.message} style={styles.tip}>
                      <Ionicons
                        name={
                          rec.severity === 'warning'
                            ? 'alert-circle'
                            : 'bulb-outline'
                        }
                        size={18}
                        color={
                          rec.severity === 'warning'
                            ? COLORS.warning
                            : COLORS.primary
                        }
                      />
                      <Text style={styles.tipText}>{rec.message}</Text>
                    </View>
                  ))}
                  {isPremium ? (
                    <TouchableOpacity
                      onPress={() =>
                        router.push(
                          '/(drawer)/performance/recommendations' as any,
                        )
                      }
                    >
                      <Text style={styles.link}>View all recommendations</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.upsell}>
                      Premium unlocks full recommendation detail in Performance
                      Hub.
                    </Text>
                  )}
                </View>
              ) : null}

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Last 7 days</Text>
                  <TouchableOpacity
                    style={styles.checkInBtn}
                    onPress={() =>
                      router.push('/(drawer)/performance/check-in' as any)
                    }
                  >
                    <Text style={styles.checkInBtnText}>Check-in</Text>
                  </TouchableOpacity>
                </View>
                {history.length === 0 ? (
                  <Text style={styles.muted}>
                    No history yet — complete your first check-in.
                  </Text>
                ) : (
                  <>
                    <View style={styles.historyHeader}>
                      <Text style={[styles.historyHeaderCell, styles.historyDateCol]}>
                        Date
                      </Text>
                      <Text style={[styles.historyHeaderCell, styles.historyScoreCol]}>
                        Recovery
                      </Text>
                      <Text style={[styles.historyHeaderCell, styles.historyLoadCol]}>
                        Load
                      </Text>
                    </View>
                    {history.map((row) => (
                      <View key={row.date} style={styles.historyRow}>
                        <Text style={[styles.historyDate, styles.historyDateCol]}>
                          {row.date}
                        </Text>
                        <Text
                          style={[
                            styles.historyScore,
                            styles.historyScoreCol,
                            { color: recoveryScoreColor(row.recoveryScore) },
                          ]}
                        >
                          {formatRecoveryPercent(row.recoveryScore)}
                        </Text>
                        <Text style={[styles.historyLoad, styles.historyLoadCol]}>
                          {row.trainingLoad}
                        </Text>
                      </View>
                    ))}
                  </>
                )}
              </View>

              <TouchableOpacity
                style={styles.hubLink}
                onPress={() => {
                  if (isPremium) {
                    router.push('/(drawer)/performance/hub' as any);
                  } else {
                    router.push('/subscription' as any);
                  }
                }}
              >
                <Ionicons name='analytics' size={20} color={COLORS.primary} />
                <View style={styles.hubLinkText}>
                  <Text style={styles.hubTitle}>Performance Hub</Text>
                  <Text style={styles.muted}>
                    {isPremium
                      ? 'Trends, education & weekly summary'
                      : 'Premium — 30/90-day trends & more'}
                  </Text>
                </View>
                <Ionicons
                  name='chevron-forward'
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: SPACING.xl },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xl },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.large,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  ctaText: {
    color: '#fff',
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
  hero: { alignItems: 'flex-start', marginBottom: SPACING.lg },
  heroTitle: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  heroRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  heroScore: {
    fontSize: 32,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  loadBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.medium,
    gap: 2,
  },
  loadLabel: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  loadText: {
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  section: { marginBottom: SPACING.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  tip: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  tipText: { flex: 1, color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.regular },
  link: { color: COLORS.primary, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  checkInBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.medium,
    ...SHADOWS.card,
  },
  checkInBtnText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  upsell: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  muted: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.small },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderMedium,
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  historyHeaderCell: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: SPACING.sm,
  },
  historyDateCol: { flex: 1 },
  historyScoreCol: { width: 64, textAlign: 'right' },
  historyLoadCol: {
    width: 72,
    textAlign: 'right',
    fontSize: TYPOGRAPHY.fontSize.small,
  },
  historyDate: { color: COLORS.textPrimary },
  historyScore: { fontWeight: TYPOGRAPHY.fontWeight.bold },
  historyLoad: { color: COLORS.textPrimary },
  hubLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1,
    borderColor: COLORS.borderOrange,
  },
  hubLinkText: { flex: 1 },
  hubTitle: {
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
});
