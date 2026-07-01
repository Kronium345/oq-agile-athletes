import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
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
  SPACING,
  TYPOGRAPHY,
} from '../../../constants/theme';
import { usePremiumGate } from '../../../hooks/usePremiumGate';
import { PERFORMANCE_EDUCATION_ARTICLES } from '../../../lib/performance/education';

export default function PerformanceEducationScreen() {
  const router = useRouter();
  const { isLoading: isPremiumLoading, requirePremium } =
    usePremiumGate('Performance Hub');

  useFocusEffect(
    useCallback(() => {
      if (isPremiumLoading) return;
      requirePremium();
    }, [isPremiumLoading, requirePremium]),
  );

  return (
    <BackgroundGradient>
      <SafeAreaView style={drawerScreenStyles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={drawerScreenStyles.scrollContent}>
          <TrainerScreenHeader
            title='Recovery education'
            subtitle='Sleep, stress, training load & nutrition'
            avoidDrawerMenu
          />

          <Text style={styles.disclaimer}>
            Educational content only — not medical advice.
          </Text>

          {PERFORMANCE_EDUCATION_ARTICLES.map((article) => (
            <TouchableOpacity
              key={article.slug}
              style={styles.card}
              onPress={() =>
                router.push(
                  `/(drawer)/performance/education/${article.slug}` as any,
                )
              }
            >
              <View style={styles.cardBody}>
                <Text style={styles.title}>{article.title}</Text>
                <Text style={styles.summary}>{article.summary}</Text>
                <Text style={styles.meta}>{article.readMinutes} min read</Text>
              </View>
              <Ionicons
                name='chevron-forward'
                size={20}
                color={COLORS.textSecondary}
              />
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
    marginBottom: SPACING.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SPACING.sm,
  },
  cardBody: { flex: 1 },
  title: {
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  summary: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  meta: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.primary,
  },
});
