import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundGradient from '../../../../components/BackgroundGradient';
import { TrainerScreenHeader } from '../../../../components/trainers/TrainerScreenHeader';
import { drawerScreenStyles } from '../../../../constants/drawerScreen';
import { COLORS, SPACING, TYPOGRAPHY } from '../../../../constants/theme';
import { usePremiumGate } from '../../../../hooks/usePremiumGate';
import { getEducationArticle } from '../../../../lib/performance/education';

export default function PerformanceEducationArticleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { isLoading: isPremiumLoading, requirePremium } =
    usePremiumGate('Performance Hub');
  const article = getEducationArticle(String(slug ?? ''));

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
            title={article?.title ?? 'Article'}
            avoidDrawerMenu
          />

          {!article ? (
            <Text style={styles.muted}>Article not found.</Text>
          ) : (
            <>
              <Text style={styles.summary}>{article.summary}</Text>
              {article.body.map((paragraph) => (
                <Text key={paragraph} style={styles.paragraph}>
                  {paragraph}
                </Text>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  summary: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  paragraph: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  muted: { color: COLORS.textSecondary },
});
