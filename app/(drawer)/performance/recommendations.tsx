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
import type { PerformanceRecommendation } from '../../../lib/performance/types';
import {
  fetchPerformanceHistory,
  fetchPerformanceToday,
} from '../../../services/performanceApi';
import { useAuthContext } from '../../AuthProvider';

export default function PerformanceRecommendationsScreen() {
  const authContext = useAuthContext();
  const user = authContext?.user ?? null;
  const { isLoading: isPremiumLoading, requirePremium } =
    usePremiumGate('Performance Hub');
  const [loading, setLoading] = useState(true);
  const [recs, setRecs] = useState<PerformanceRecommendation[]>([]);

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
          const today = await fetchPerformanceToday(user);
          const history = await fetchPerformanceHistory(user, 14);
          const map = new Map<string, PerformanceRecommendation>();
          for (const row of [today.checkIn, ...history].filter(Boolean)) {
            for (const rec of row!.recommendations) {
              map.set(rec.message, rec);
            }
          }
          setRecs(Array.from(map.values()));
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
            title='Recommendations'
            subtitle='From your recent check-ins'
            avoidDrawerMenu
          />

          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : recs.length === 0 ? (
            <Text style={styles.muted}>
              Complete a daily check-in to get personalized tips.
            </Text>
          ) : (
            recs.map((rec) => (
              <View key={rec.message} style={styles.card}>
                <Ionicons
                  name={
                    rec.severity === 'warning'
                      ? 'alert-circle'
                      : 'checkmark-circle'
                  }
                  size={22}
                  color={
                    rec.severity === 'warning' ? COLORS.warning : COLORS.success
                  }
                />
                <View style={styles.cardBody}>
                  <Text style={styles.type}>{rec.type}</Text>
                  <Text style={styles.message}>{rec.message}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  muted: { color: COLORS.textSecondary },
  card: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardBody: { flex: 1 },
  type: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    textTransform: 'uppercase',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  message: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
});
