import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundGradient from '../../../components/BackgroundGradient';
import { TrainerScreenHeader } from '../../../components/trainers/TrainerScreenHeader';
import { drawerScreenStyles } from '../../../constants/drawerScreen';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../../constants/theme';
import { useDrawerListPadding } from '../../../hooks/useDrawerListPadding';
import { usePremiumGate } from '../../../hooks/usePremiumGate';
import {
  BREATHING_PROTOCOLS,
  formatEvidenceLabel,
  formatRhythmSummary,
} from '../../../lib/recovery/protocols';
import { getBreathingSummary } from '../../../lib/recovery/summary';
import type { RecoveryBreathingSummary } from '../../../lib/recovery/types';
import { useAuthContext } from '../../AuthProvider';

export default function RecoveryToolkitScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ protocol?: string }>();
  const listPadding = useDrawerListPadding();
  const { user } = useAuthContext();
  const { isLoading: isPremiumLoading, requirePremium } =
    usePremiumGate('Mind Center');
  const [summary, setSummary] = useState<RecoveryBreathingSummary | null>(null);
  const deepLinkedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (isPremiumLoading) return;
      requirePremium();
    }, [isPremiumLoading, requirePremium]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        setSummary(null);
        return;
      }
      void getBreathingSummary(user).then(setSummary);
    }, [user]),
  );

  useEffect(() => {
    if (deepLinkedRef.current) return;
    const protocolId =
      typeof params.protocol === 'string' ? params.protocol : null;
    if (!protocolId) return;
    if (!BREATHING_PROTOCOLS.some((p) => p.id === protocolId)) return;
    deepLinkedRef.current = true;
    router.replace({
      pathname: '/(drawer)/recovery/breathing/[id]',
      params: { id: protocolId, source: 'deep_link' },
    } as any);
  }, [params.protocol, router]);

  return (
    <BackgroundGradient>
      <SafeAreaView style={drawerScreenStyles.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={[drawerScreenStyles.scrollContent, listPadding]}
        >
          <TrainerScreenHeader
            title='Recovery Toolkit'
            subtitle='Short guided breathing for calm, focus & recovery'
            avoidDrawerMenu
          />

          <Text style={styles.disclaimer}>
            Wellness support only — not medical advice, diagnosis, or treatment.
            Stop anytime if you feel worse.
          </Text>

          {summary ? (
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{summary.sessionsToday}</Text>
                <Text style={styles.summaryLabel}>Today</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{summary.sessionsWeek}</Text>
                <Text style={styles.summaryLabel}>This week</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{summary.streakDays}</Text>
                <Text style={styles.summaryLabel}>Day streak</Text>
              </View>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Choose a session</Text>

          {BREATHING_PROTOCOLS.map((protocol) => (
            <TouchableOpacity
              key={protocol.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: '/(drawer)/recovery/breathing/[id]',
                  params: { id: protocol.id, source: 'mind_center' },
                } as any)
              }
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{protocol.name}</Text>
                <Ionicons
                  name='chevron-forward'
                  size={18}
                  color={COLORS.textSecondary}
                />
              </View>
              <Text style={styles.cardBody}>{protocol.description}</Text>
              <Text style={styles.cardMeta}>
                {formatRhythmSummary(protocol)} ·{' '}
                {Math.round(protocol.defaultDurationSec / 60)} min default
              </Text>
              <Text style={styles.evidence}>
                {formatEvidenceLabel(protocol.evidenceStrength)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  disclaimer: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: COLORS.borderLight,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.card,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  cardBody: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  cardMeta: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  evidence: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.textSecondary,
  },
});
