import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundGradient from '../../../components/BackgroundGradient';
import { TrainerScreenHeader } from '../../../components/trainers/TrainerScreenHeader';
import { drawerScreenStyles } from '../../../constants/drawerScreen';
import {
  BORDER_RADIUS,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '../../../constants/theme';
import { usePremiumGate } from '../../../hooks/usePremiumGate';
import { trainingLoadColor, formatRecoveryPercent } from '../../../lib/performance/scoring';
import { fetchWeeklySummary } from '../../../services/performanceApi';
import { useAuthContext } from '../../AuthProvider';

export default function PerformanceWeeklySummaryScreen() {
  const authContext = useAuthContext();
  const user = authContext?.user ?? null;
  const { isLoading: isPremiumLoading, requirePremium } =
    usePremiumGate('Performance Hub');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Awaited<
    ReturnType<typeof fetchWeeklySummary>
  > | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (isPremiumLoading) return;
      if (!requirePremium()) return;
    }, [isPremiumLoading, requirePremium]),
  );

  useFocusEffect(
    useCallback(() => {
      if (isPremiumLoading || !user) {
        setLoading(false);
        return;
      }
      (async () => {
        setLoading(true);
        try {
          setSummary(await fetchWeeklySummary(user));
        } finally {
          setLoading(false);
        }
      })();
    }, [user, isPremiumLoading]),
  );

  return (
    <BackgroundGradient>
      <SafeAreaView style={drawerScreenStyles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={drawerScreenStyles.scrollContent}>
          <TrainerScreenHeader
            title='Weekly summary'
            subtitle={
              summary
                ? `${summary.weekStart} — ${summary.weekEnd}`
                : 'This week'
            }
            avoidDrawerMenu
          />

          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : !summary ? (
            <Text style={styles.muted}>No summary available.</Text>
          ) : (
            <>
              <View style={styles.narrativeCard}>
                <Text style={styles.narrative}>{summary.narrative}</Text>
              </View>

              <View style={styles.statsGrid}>
                <Stat label='Check-ins' value={String(summary.checkInCount)} />
                <Stat
                  label='Avg recovery'
                  value={formatRecoveryPercent(summary.averages.recoveryScore)}
                />
                <Stat
                  label='Avg sleep (h)'
                  value={summary.averages.sleepHours.toFixed(1)}
                />
                <Stat
                  label='Avg energy'
                  value={String(summary.averages.energy)}
                />
              </View>

              <View style={styles.loadRow}>
                <Text style={styles.loadLabel}>Dominant training load</Text>
                <Text
                  style={[
                    styles.loadValue,
                    { color: trainingLoadColor(summary.dominantTrainingLoad) },
                  ]}
                >
                  {summary.dominantTrainingLoad}
                </Text>
              </View>

              {summary.topRecommendations.length > 0 ? (
                <>
                  <Text style={styles.sectionTitle}>Top tips this week</Text>
                  {summary.topRecommendations.map((rec) => (
                    <View key={rec.message} style={styles.tip}>
                      <Ionicons
                        name='bulb-outline'
                        size={18}
                        color={COLORS.primary}
                      />
                      <Text style={styles.tipText}>{rec.message}</Text>
                    </View>
                  ))}
                </>
              ) : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  muted: { color: COLORS.textSecondary },
  narrativeCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderOrange,
    marginBottom: SPACING.lg,
  },
  narrative: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  stat: {
    width: '47%',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  loadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: BORDER_RADIUS.medium,
  },
  loadLabel: { color: COLORS.textPrimary },
  loadValue: { fontWeight: TYPOGRAPHY.fontWeight.bold },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  tip: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    alignItems: 'flex-start',
  },
  tipText: { flex: 1, color: COLORS.textPrimary },
});
