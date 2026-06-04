import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundGradient from '../BackgroundGradient';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../constants/theme';

const TOTAL_STEPS = 4;

type OnboardingScreenProps = {
  step: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  footer?: React.ReactNode;
};

export default function OnboardingScreen({
  step,
  title,
  subtitle,
  children,
  onBack,
  footer,
}: OnboardingScreenProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/sign-in');
    }
  };

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.select({ ios: 'padding', android: undefined })}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View style={styles.progressRow}>
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressDot,
                    i < step && styles.progressDotDone,
                    i === step - 1 && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.stepLabel}>
              Step {step} of {TOTAL_STEPS}
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            {children}
          </ScrollView>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

export function OnboardingPrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.primaryButton, disabled && styles.primaryButtonDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function SelectionCard({
  selected,
  onPress,
  children,
}: {
  selected?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.card, selected && styles.cardSelected]}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.small,
    backgroundColor: COLORS.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
    marginBottom: SPACING.md,
  },
  progressRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderLight,
  },
  progressDotDone: {
    backgroundColor: COLORS.primaryLight,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
  },
  stepLabel: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.extraLarge,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.backgroundCard,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    ...SHADOWS.orange,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: COLORS.textButton,
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.card,
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
});
