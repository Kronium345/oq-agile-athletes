import { useFocusEffect } from 'expo-router';
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
  SPACING,
  TYPOGRAPHY,
} from '../../../constants/theme';
import { useDrawerListPadding } from '../../../hooks/useDrawerListPadding';
import { usePremiumGate } from '../../../hooks/usePremiumGate';
import { recoveryScoreColor, formatRecoveryPercent } from '../../../lib/performance/scoring';
import { fetchPerformanceTrends } from '../../../services/performanceApi';
import { useAuthContext } from '../../AuthProvider';

export default function PerformanceTrendsScreen() {
  const authContext = useAuthContext();
  const user = authContext?.user ?? null;
  const listPadding = useDrawerListPadding();
  const { isLoading: isPremiumLoading, requirePremium } =
    usePremiumGate('Performance Hub');
  const [period, setPeriod] = useState<30 | 90>(30);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<
    ReturnType<typeof fetchPerformanceTrends>
  > | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (isPremiumLoading) return;
      if (!requirePremium()) return;
    }, [isPremiumLoading, requirePremium]),
  );

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchPerformanceTrends(user, period);
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [user, period]);

  useFocusEffect(
    useCallback(() => {
      if (isPremiumLoading) return;
      load();
    }, [load, isPremiumLoading]),
  );

  return (
    <BackgroundGradient>
      <SafeAreaView style={drawerScreenStyles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={[drawerScreenStyles.scrollContent, listPadding]}
        >
          <TrainerScreenHeader
            title='Recovery trends'
            subtitle='30 & 90-day patterns'
            avoidDrawerMenu
          />

          <View style={styles.toggle}>
            {([30, 90] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.toggleBtn, period === p && styles.toggleActive]}
                onPress={() => setPeriod(p)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    period === p && styles.toggleTextActive,
                  ]}
                >
                  {p} days
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : !data ? (
            <Text style={styles.muted}>No trend data yet.</Text>
          ) : (
            <>
              <View style={styles.scoreRow}>
                <ScoreCard
                  label='Avg recovery'
                  score={data.averages.recoveryScore}
                  asPercent
                />
                <ScoreCard label='Avg sleep' score={data.averages.sleepScore} asPercent />
                <ScoreCard
                  label='Avg stress'
                  score={data.averages.stressScore}
                  asPercent
                />
              </View>

              <Text style={styles.sectionTitle}>Training load breakdown</Text>
              {Object.entries(data.trainingLoadSummary).map(([band, count]) => (
                <View key={band} style={styles.loadRow}>
                  <Text style={styles.loadBand}>{band}</Text>
                  <Text style={styles.loadCount}>{count} days</Text>
                </View>
              ))}

              <Text style={styles.sectionTitle}>Daily series</Text>
              {data.series.length === 0 ? (
                <Text style={styles.muted}>
                  Complete more check-ins to see trends.
                </Text>
              ) : (
                data.series.map((point) => (
                  <View key={point.date} style={styles.seriesRow}>
                    <Text style={styles.seriesDate}>{point.date}</Text>
                    <Text
                      style={[
                        styles.seriesScore,
                        { color: recoveryScoreColor(point.recoveryScore) },
                      ]}
                    >
                      {formatRecoveryPercent(point.recoveryScore)}
                    </Text>
                    <Text style={styles.seriesLoad}>{point.trainingLoad}</Text>
                  </View>
                ))
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  toggleBtn: {
    flex: 1,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  toggleText: { color: COLORS.textSecondary },
  toggleTextActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  loadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  loadBand: { color: COLORS.textPrimary },
  loadCount: { color: COLORS.textSecondary },
  seriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  seriesDate: { flex: 1, color: COLORS.textPrimary },
  seriesScore: { fontWeight: TYPOGRAPHY.fontWeight.bold, width: 40, textAlign: 'right' },
  seriesLoad: {
    width: 72,
    textAlign: 'right',
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
  },
  muted: { color: COLORS.textSecondary },
});
