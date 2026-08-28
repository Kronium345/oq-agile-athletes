import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { getCurrentUsers } from '../../components/lib/actions/auth.action';
import BackgroundGradient from '../../components/BackgroundGradient';
import { TrainerScreenHeader } from '../../components/trainers/TrainerScreenHeader';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { TRAINER_SPECIALTIES } from '../../lib/trainers/constants';
import {
  getTrainerProfileValidationMessages,
  trainerProfileSchema,
  TRAINER_PROFILE_REQUIREMENTS,
} from '../../lib/trainers/validation';
import {
  getMyTrainerProfile,
  saveTrainerProfile,
} from '../../services/trainersApi';
import type { TrainerSpecialty } from '../../types/trainer';
import { useAuthContext } from '../AuthProvider';

const SETUP_LOG = '[TrainerSetup]';
const TOAST_DURATION_MS = 5000;

function showSetupToast(
  type: 'success' | 'error' | 'info',
  text1: string,
  text2?: string,
) {
  Toast.show({
    type,
    text1,
    text2,
    visibilityTime: TOAST_DURATION_MS,
  });
}

function buildTrainerPayload(
  fields: {
    displayName: string;
    bio: string;
    qualifications: string;
    specialties: TrainerSpecialty[];
    gymName: string;
    postcode: string;
    priceFrom: string;
    instagram: string;
    published: boolean;
  },
) {
  return {
    displayName: fields.displayName.trim(),
    bio: fields.bio.trim(),
    qualifications: fields.qualifications
      .split(',')
      .map((q) => q.trim())
      .filter(Boolean),
    specialties: fields.specialties,
    gymName: fields.gymName.trim(),
    postcode: fields.postcode.trim().toUpperCase(),
    priceFrom: fields.priceFrom ? Number(fields.priceFrom) : undefined,
    priceUnit: 'session' as const,
    instagram: fields.instagram.trim() || undefined,
    published: fields.published,
  };
}

export default function TrainerSetupScreen() {
  const router = useRouter();
  const { setUser } = useAuthContext();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [gymName, setGymName] = useState('');
  const [postcode, setPostcode] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [instagram, setInstagram] = useState('');
  const [specialties, setSpecialties] = useState<TrainerSpecialty[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingProfile(true);
      try {
        const profile = await getMyTrainerProfile();
        if (cancelled || !profile) return;
        setHasExistingProfile(true);
        setDisplayName(profile.displayName);
        setBio(profile.bio);
        setQualifications(profile.qualifications.join(', '));
        setGymName(profile.gymName);
        setPostcode(profile.postcode);
        setPriceFrom(
          profile.priceFrom != null ? String(profile.priceFrom) : '',
        );
        setInstagram(profile.instagram ?? '');
        setSpecialties(profile.specialties);
        if (__DEV__) {
          console.log(SETUP_LOG, 'Loaded existing profile', { id: profile.id });
        }
      } catch (error) {
        if (__DEV__) {
          console.warn(SETUP_LOG, 'Could not load existing profile', error);
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSpecialty = (s: TrainerSpecialty) => {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const currentPayload = buildTrainerPayload({
    displayName,
    bio,
    qualifications,
    specialties,
    gymName,
    postcode,
    priceFrom,
    instagram,
    published: true,
  });
  const missingRequirements = getTrainerProfileValidationMessages(currentPayload);
  const formReady = missingRequirements.length === 0;

  const handleSave = async (publish: boolean) => {
    const payload = buildTrainerPayload({
      displayName,
      bio,
      qualifications,
      specialties,
      gymName,
      postcode,
      priceFrom,
      instagram,
      published: publish,
    });

    const parsed = trainerProfileSchema.safeParse(payload);
    if (!parsed.success) {
      const issues = getTrainerProfileValidationMessages(payload);
      if (__DEV__) {
        console.warn(SETUP_LOG, 'Validation failed', issues);
      }
      showSetupToast(
        'error',
        publish ? 'Cannot publish yet' : 'Cannot save yet',
        issues.length > 0
          ? issues.join('\n')
          : 'Please complete all required fields.',
      );
      return;
    }

    setSaving(true);
    showSetupToast(
      'info',
      publish ? 'Publishing profile…' : 'Saving draft…',
      'This may take a moment.',
    );
    if (__DEV__) {
      console.log(SETUP_LOG, publish ? 'Publishing profile' : 'Saving draft', {
        hasExistingProfile,
        displayName: payload.displayName,
        gymName: payload.gymName,
        postcode: payload.postcode,
      });
    }

    try {
      const saved = await saveTrainerProfile(parsed.data);
      if (__DEV__) {
        console.log(SETUP_LOG, 'Save succeeded', {
          id: saved.id,
          published: saved.published,
        });
      }

      try {
        const refreshed = await getCurrentUsers();
        if (refreshed) {
          await setUser(refreshed);
          if (__DEV__) {
            console.log(SETUP_LOG, 'User refreshed', {
              isTrainer: refreshed.isTrainer,
              roles: refreshed.roles,
            });
          }
        } else {
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  isTrainer: true,
                  roles: Array.isArray(prev.roles)
                    ? [...new Set([...prev.roles, 'trainer'])]
                    : ['trainer'],
                }
              : prev,
          );
        }
      } catch (refreshError) {
        if (__DEV__) {
          console.warn(SETUP_LOG, 'User refresh failed', refreshError);
        }
      }

      showSetupToast(
        'success',
        publish ? 'Profile published' : 'Draft saved',
        publish
          ? hasExistingProfile
            ? 'Your listing is updated and visible to clients.'
            : 'Your trainer listing is live. Open Coach video library to upload clips.'
          : hasExistingProfile
            ? 'Changes saved. Publish when you are ready.'
            : 'Draft saved. Complete the checklist and publish when ready.',
      );
      router.replace('/(drawer)/(tabs)/profile' as any);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not save profile';
      if (__DEV__) {
        console.error(SETUP_LOG, 'Save failed', error);
      }
      showSetupToast(
        'error',
        publish ? 'Publish failed' : 'Save failed',
        message,
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <BackgroundGradient>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ActivityIndicator color={COLORS.primary} style={styles.loader} />
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <TrainerScreenHeader
            title={hasExistingProfile ? 'Edit trainer profile' : 'Trainer profile'}
            subtitle={
              hasExistingProfile
                ? 'Update your listing'
                : 'Create your coach listing'
            }
          />
          <View style={styles.requirementsBox}>
            <Text style={styles.requirementsTitle}>Before you publish</Text>
            {TRAINER_PROFILE_REQUIREMENTS.map((item) => {
              const fieldChecks: Record<string, boolean> = {
                'Display name (at least 2 characters)':
                  currentPayload.displayName.length >= 2,
                'Bio (at least 20 characters)': currentPayload.bio.length >= 20,
                'At least one qualification':
                  currentPayload.qualifications.length >= 1,
                'At least one specialty': currentPayload.specialties.length >= 1,
                'Gym name': currentPayload.gymName.length >= 2,
                'UK postcode (5–8 characters)':
                  currentPayload.postcode.length >= 5 &&
                  currentPayload.postcode.length <= 8,
              };
              const done = fieldChecks[item] ?? false;
              return (
                <Text
                  key={item}
                  style={[styles.requirementRow, done && styles.requirementMet]}
                >
                  {done ? '✓' : '○'} {item}
                </Text>
              );
            })}
            {!formReady ? (
              <Text style={styles.requirementsHint}>
                Fill in the items above, then tap Publish profile.
              </Text>
            ) : (
              <Text style={styles.requirementsReady}>Ready to publish.</Text>
            )}
          </View>
          {[
            { label: 'Display name', value: displayName, set: setDisplayName },
            { label: 'Bio', value: bio, set: setBio, multiline: true },
            {
              label: 'Qualifications (comma-separated)',
              value: qualifications,
              set: setQualifications,
            },
            { label: 'Gym name', value: gymName, set: setGymName },
            { label: 'Postcode', value: postcode, set: setPostcode },
            {
              label: 'Price from (£/session)',
              value: priceFrom,
              set: setPriceFrom,
              keyboard: 'numeric' as const,
            },
            { label: 'Instagram handle', value: instagram, set: setInstagram },
          ].map((field) => (
            <View key={field.label} style={styles.field}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={[styles.input, field.multiline && styles.multiline]}
                value={field.value}
                onChangeText={field.set}
                multiline={field.multiline}
                keyboardType={field.keyboard}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          ))}
          <Text style={styles.label}>Specialties</Text>
          <View style={styles.chips}>
            {TRAINER_SPECIALTIES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, specialties.includes(s) && styles.chipOn]}
                onPress={() => toggleSpecialty(s)}
              >
                <Text
                  style={[
                    styles.chipText,
                    specialties.includes(s) && styles.chipTextOn,
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.primary, saving && styles.disabled]}
            onPress={() => handleSave(true)}
            disabled={saving}
          >
            <Text style={styles.primaryText}>
              {saving ? 'Saving…' : 'Publish profile'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondary}
            onPress={() => handleSave(false)}
            disabled={saving}
          >
            <Text style={styles.secondaryText}>Save draft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondary}
            onPress={() => router.push('/trainer/library' as any)}
          >
            <Text style={styles.secondaryText}>Coach video library</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loader: { marginTop: 48 },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xl },
  requirementsBox: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  requirementsTitle: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  requirementRow: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  requirementMet: {
    color: COLORS.textPrimary,
  },
  requirementsHint: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.error,
    lineHeight: 18,
  },
  requirementsReady: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  field: { marginBottom: SPACING.md },
  label: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    color: COLORS.textPrimary,
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundAlt,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  chipOn: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.borderOrange,
  },
  chipText: { fontSize: 12, color: COLORS.textSecondary },
  chipTextOn: { color: COLORS.primary },
  primary: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  primaryText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  disabled: { opacity: 0.6 },
  secondary: { padding: SPACING.md, alignItems: 'center' },
  secondaryText: { color: COLORS.primary },
});
