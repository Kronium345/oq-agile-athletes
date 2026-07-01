import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import BackgroundGradient from '../../../components/BackgroundGradient';
import {
  NumberField,
  RatingScale,
  ToggleRow,
} from '../../../components/performance/CheckInFields';
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
import { getLocalTodayKey } from '../../../lib/dailySteps';
import { loadLocalCheckIn } from '../../../lib/performance/storage';
import {
  fetchPerformanceToday,
  submitPerformanceCheckIn,
} from '../../../services/performanceApi';
import { useAuthContext } from '../../AuthProvider';

export default function PerformanceCheckInScreen() {
  const router = useRouter();
  const authContext = useAuthContext();
  const user = authContext?.user ?? null;
  const today = getLocalTodayKey();
  const listPadding = useDrawerListPadding();

  const [sleepHours, setSleepHours] = useState('7');
  const [sleepQuality, setSleepQuality] = useState(7);
  const [stress, setStress] = useState(5);
  const [energy, setEnergy] = useState(7);
  const [muscleSoreness, setMuscleSoreness] = useState(4);
  const [proteinIntake, setProteinIntake] = useState('');
  const [waterIntakeLiters, setWaterIntakeLiters] = useState('');
  const [alcohol, setAlcohol] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const existing =
        (await fetchPerformanceToday(user)).checkIn ??
        (await loadLocalCheckIn(user, today));
      if (existing) {
        setSleepHours(String(existing.sleepHours));
        setSleepQuality(existing.sleepQuality);
        setStress(existing.stress);
        setEnergy(existing.energy);
        setMuscleSoreness(existing.muscleSoreness);
        setProteinIntake(
          existing.proteinIntake != null ? String(existing.proteinIntake) : '',
        );
        setWaterIntakeLiters(
          existing.waterIntakeLiters != null
            ? String(existing.waterIntakeLiters)
            : '',
        );
        setAlcohol(Boolean(existing.alcohol));
      }
      setLoading(false);
    })();
  }, [user, today]);

  const onSubmit = async () => {
    if (!user) {
      Toast.show({
        type: 'info',
        text1: 'Sign in required',
        text2: 'Log in to save your check-in.',
      });
      return;
    }

    const hours = parseFloat(sleepHours);
    if (Number.isNaN(hours) || hours < 0 || hours > 14) {
      Toast.show({
        type: 'error',
        text1: 'Invalid sleep hours',
        text2: 'Enter a value between 0 and 14.',
      });
      return;
    }

    setSaving(true);
    try {
      await submitPerformanceCheckIn(user, {
        date: today,
        sleepHours: hours,
        sleepQuality,
        stress,
        energy,
        muscleSoreness,
        proteinIntake: proteinIntake ? parseFloat(proteinIntake) : undefined,
        waterIntakeLiters: waterIntakeLiters
          ? parseFloat(waterIntakeLiters)
          : undefined,
        alcohol,
      });
      Toast.show({
        type: 'success',
        text1: 'Check-in saved',
        text2: 'Your recovery scores are updated.',
      });
      router.back();
    } catch (e: unknown) {
      Toast.show({
        type: 'error',
        text1: 'Could not save',
        text2: e instanceof Error ? e.message : 'Try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <BackgroundGradient>
      <SafeAreaView style={drawerScreenStyles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={[
            drawerScreenStyles.scrollContent,
            listPadding,
          ]}
          keyboardShouldPersistTaps='handled'
        >
          <TrainerScreenHeader
            title='Daily Recovery Check-In'
            subtitle={today}
            avoidDrawerMenu
          />

          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <>
              <Text style={styles.disclaimer}>
                Wellness tracking only — not medical advice.
              </Text>

              <NumberField
                label='Sleep (hours)'
                value={sleepHours}
                onChange={setSleepHours}
                placeholder='7.5'
                unit='hrs'
              />

              <RatingScale
                label='Sleep quality'
                value={sleepQuality}
                onChange={setSleepQuality}
                lowLabel='Poor'
                highLabel='Great'
              />

              <RatingScale
                label='Stress level'
                value={stress}
                onChange={setStress}
                lowLabel='Low'
                highLabel='High'
              />

              <RatingScale
                label='Energy level'
                value={energy}
                onChange={setEnergy}
                lowLabel='Low'
                highLabel='High'
              />

              <RatingScale
                label='Muscle soreness'
                value={muscleSoreness}
                onChange={setMuscleSoreness}
                lowLabel='None'
                highLabel='Very sore'
              />

              <NumberField
                label='Protein intake (optional)'
                value={proteinIntake}
                onChange={setProteinIntake}
                placeholder='120'
                unit='g'
              />

              <NumberField
                label='Water intake (optional)'
                value={waterIntakeLiters}
                onChange={setWaterIntakeLiters}
                placeholder='2.5'
                unit='L'
              />

              <ToggleRow
                label='Alcohol yesterday?'
                value={alcohol}
                onToggle={() => setAlcohol((v) => !v)}
              />

              <TouchableOpacity
                style={[styles.submit, saving && styles.submitDisabled]}
                onPress={onSubmit}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color='#fff' />
                ) : (
                  <Text style={styles.submitText}>Save check-in</Text>
                )}
              </TouchableOpacity>
            </>
          )}
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
  submit: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.large,
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: {
    color: '#fff',
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
});
