import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useAuthContext } from '../AuthProvider';
import OnboardingScreen, {
  OnboardingPrimaryButton,
} from '../../components/onboarding/OnboardingScreen';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../constants/theme';
import {
  markOnboardingComplete,
  persistOnboardingToUser,
  saveOnboardingProfile,
  syncUserProfileToServer,
} from '../../lib/onboarding/storage';
import type { WeightUnit } from '../../lib/onboarding/types';
export default function WeightScreen() {
  const router = useRouter();
  const { updateUser } = useAuthContext();
  const [weightText, setWeightText] = useState('');
  const [unit, setUnit] = useState<WeightUnit>('kg');
  const [saving, setSaving] = useState(false);

  const toggleUnit = () => {
    const current = parseFloat(weightText);
    if (!isNaN(current) && current > 0) {
      if (unit === 'kg') {
        setWeightText((current * 2.20462).toFixed(1));
        setUnit('lbs');
      } else {
        setWeightText((current / 2.20462).toFixed(1));
        setUnit('kg');
      }
    } else {
      setUnit((u) => (u === 'kg' ? 'lbs' : 'kg'));
    }
  };

  const validate = (): number | null => {
    const value = parseFloat(weightText);
    if (isNaN(value) || value <= 0) {
      Alert.alert('Invalid weight', 'Please enter a valid number.');
      return null;
    }
    const min = unit === 'kg' ? 20 : 44;
    const max = unit === 'kg' ? 300 : 661;
    if (value < min || value > max) {
      Alert.alert(
        'Weight out of range',
        `Enter a weight between ${min} and ${max} ${unit}.`,
      );
      return null;
    }
    return value;
  };

  const finish = async () => {
    const weight = validate();
    if (weight == null) return;

    setSaving(true);
    try {
      await saveOnboardingProfile({ weight, unit });
      await markOnboardingComplete();

      const merged = await persistOnboardingToUser();
      updateUser(merged);

      try {
        await syncUserProfileToServer(merged);
      } catch (syncError) {
        console.warn('Onboarding profile sync to server failed:', syncError);
      }

      Toast.show({
        type: 'success',
        text1: 'Profile setup complete',
        text2: 'Welcome to Agile Athletes!',
        position: 'bottom',
      });

      router.replace('/(drawer)/(tabs)/home' as any);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Could not save your weight',
        position: 'bottom',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingScreen
      step={4}
      title="What's your weight?"
      subtitle="Used for progress tracking. You can change this later in settings."
      footer={
        <OnboardingPrimaryButton
          label={saving ? 'Saving…' : 'Finish setup'}
          onPress={finish}
          disabled={saving || !weightText.trim()}
        />
      }
    >
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={weightText}
          onChangeText={setWeightText}
          placeholder="0.0"
          placeholderTextColor={COLORS.textSecondary}
          keyboardType="decimal-pad"
          maxLength={6}
          autoFocus
        />
        <Text style={styles.unit}>{unit}</Text>
      </View>

      <TouchableOpacity onPress={toggleUnit} style={styles.unitToggle}>
        <Text style={styles.unitToggleText}>
          Switch to {unit === 'kg' ? 'lbs' : 'kg'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        {unit === 'kg' ? 'Typical range: 20–300 kg' : 'Typical range: 44–661 lbs'}
      </Text>

      <Text style={styles.legal}>
        By continuing, you agree to our terms of service and privacy policy.
      </Text>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    ...SHADOWS.card,
    marginBottom: SPACING.lg,
  },
  input: {
    flex: 1,
    fontSize: 32,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  unit: {
    fontSize: TYPOGRAPHY.fontSize.large,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginLeft: SPACING.sm,
  },
  unitToggle: {
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  unitToggleText: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  hint: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.small,
    marginBottom: SPACING.md,
  },
  legal: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.small,
    lineHeight: 16,
    marginTop: SPACING.sm,
  },
});
