import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import OnboardingScreen, {
  SelectionCard,
} from '../../components/onboarding/OnboardingScreen';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useOnboardingGuard } from '../../hooks/useOnboardingGuard';
import { saveOnboardingProfile } from '../../lib/onboarding/storage';
import type { Gender } from '../../lib/onboarding/types';

const OPTIONS: {
  value: Gender;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { value: 'Male', label: 'Male', icon: 'male', color: COLORS.accentBlue },
  { value: 'Female', label: 'Female', icon: 'female', color: '#e11d48' },
];

export default function GenderScreen() {
  const router = useRouter();
  const { checking } = useOnboardingGuard();
  const [loading, setLoading] = useState(false);

  if (checking) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const selectGender = async (gender: Gender) => {
    if (loading) return;
    setLoading(true);
    try {
      await saveOnboardingProfile({ gender });
      router.push('/onboarding/experience' as any);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Could not save your selection',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingScreen
      step={1}
      title='Select your gender'
      subtitle='This helps us personalize your training experience.'
    >
      <View style={styles.row}>
        {OPTIONS.map((opt) => (
          <View key={opt.value} style={styles.col}>
            <SelectionCard onPress={() => selectGender(opt.value)}>
              <View style={styles.optionInner}>
                <Ionicons name={opt.icon} size={48} color={opt.color} />
                <Text style={styles.optionLabel}>{opt.label}</Text>
              </View>
            </SelectionCard>
          </View>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={styles.loader} />
      ) : null}
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  col: {
    flex: 1,
  },
  optionInner: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  optionLabel: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  loader: { marginTop: SPACING.lg },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
