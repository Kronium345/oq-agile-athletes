import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundGradient from '../../../../components/BackgroundGradient';
import { TrainerScreenHeader } from '../../../../components/trainers/TrainerScreenHeader';
import { drawerScreenStyles } from '../../../../constants/drawerScreen';
import {
  BORDER_RADIUS,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '../../../../constants/theme';
import { useDrawerListPadding } from '../../../../hooks/useDrawerListPadding';
import { usePremiumGate } from '../../../../hooks/usePremiumGate';
import { getEducationArticle } from '../../../../lib/performance/education';

export default function PerformanceEducationArticleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const listPadding = useDrawerListPadding();
  const { isLoading: isPremiumLoading, requirePremium } =
    usePremiumGate('Performance Hub');
  const article = getEducationArticle(String(slug ?? ''));

  useFocusEffect(
    useCallback(() => {
      if (isPremiumLoading) return;
      requirePremium();
    }, [isPremiumLoading, requirePremium]),
  );

  const openSource = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {
      // Silently ignore if no handler is available.
    });
  }, []);

  return (
    <BackgroundGradient>
      <SafeAreaView style={drawerScreenStyles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={[drawerScreenStyles.scrollContent, listPadding]}
        >
          <TrainerScreenHeader
            title={article?.title ?? 'Article'}
            avoidDrawerMenu
          />

          {!article ? (
            <Text style={styles.muted}>Article not found.</Text>
          ) : (
            <>
              <View style={styles.metaRow}>
                <Ionicons
                  name='time-outline'
                  size={14}
                  color={COLORS.primary}
                />
                <Text style={styles.metaText}>
                  {article.readMinutes} min read
                </Text>
              </View>

              <Text style={styles.summary}>{article.summary}</Text>

              {article.body.map((paragraph) => (
                <Text key={paragraph} style={styles.paragraph}>
                  {paragraph}
                </Text>
              ))}

              {article.sections.map((section) => (
                <View key={section.heading} style={styles.section}>
                  <Text style={styles.sectionHeading}>{section.heading}</Text>
                  {section.paragraphs.map((paragraph) => (
                    <Text key={paragraph} style={styles.paragraph}>
                      {paragraph}
                    </Text>
                  ))}
                </View>
              ))}

              {article.keyTakeaways.length > 0 ? (
                <View style={styles.takeawayCard}>
                  <Text style={styles.takeawayTitle}>Key takeaways</Text>
                  {article.keyTakeaways.map((item) => (
                    <View key={item} style={styles.takeawayRow}>
                      <Ionicons
                        name='checkmark-circle'
                        size={18}
                        color={COLORS.primary}
                      />
                      <Text style={styles.takeawayText}>{item}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {article.sources.length > 0 ? (
                <View style={styles.sourcesSection}>
                  <Text style={styles.sourcesTitle}>Sources & further reading</Text>
                  {article.sources.map((source) => (
                    <TouchableOpacity
                      key={source.url}
                      style={styles.sourceRow}
                      onPress={() => openSource(source.url)}
                      accessibilityRole='link'
                    >
                      <Ionicons
                        name='open-outline'
                        size={16}
                        color={COLORS.primary}
                      />
                      <Text style={styles.sourceText}>{source.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}

              <Text style={styles.disclaimer}>
                Educational content only — not medical advice. Consult a
                qualified professional for personal guidance.
              </Text>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  metaText: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  summary: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 24,
  },
  paragraph: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  section: {
    marginBottom: SPACING.sm,
  },
  sectionHeading: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  takeawayCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1,
    borderColor: COLORS.borderOrange,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  takeawayTitle: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  takeawayRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'flex-start',
  },
  takeawayText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  sourcesSection: {
    marginBottom: SPACING.lg,
  },
  sourcesTitle: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  sourceRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  sourceText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  disclaimer: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: SPACING.sm,
  },
  muted: { color: COLORS.textSecondary },
});
