import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import OnboardingScreen, {
  SelectionCard,
} from '../../components/onboarding/OnboardingScreen';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { saveOnboardingProfile } from '../../lib/onboarding/storage';
import { EXPERIENCE_LEVELS } from '../../lib/onboarding/types';

export default function ExperienceScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const selectExperience = async (experience: string) => {
    if (loading) return;
    setLoading(true);
    try {
      await saveOnboardingProfile({ experience });
      router.push('/onboarding/avatar' as any);
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
      step={2}
      title='Your lifting experience'
      subtitle='How much strength training have you done?'
    >
      {EXPERIENCE_LEVELS.map((exp) => (
        <SelectionCard
          key={exp.label}
          onPress={() => selectExperience(exp.label)}
        >
          <View style={styles.row}>
            <MaterialCommunityIcons
              name={exp.icon}
              size={32}
              color={exp.color}
            />
            <View style={styles.textBlock}>
              <Text style={styles.label}>{exp.label}</Text>
              <Text style={styles.description}>{exp.description}</Text>
            </View>
          </View>
        </SelectionCard>
      ))}
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={styles.loader} />
      ) : null}
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textBlock: {
    marginLeft: SPACING.lg,
    flex: 1,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  loader: { marginTop: SPACING.lg },
});
