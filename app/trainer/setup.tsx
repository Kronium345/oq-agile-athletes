import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import BackgroundGradient from '../../components/BackgroundGradient';
import { TrainerScreenHeader } from '../../components/trainers/TrainerScreenHeader';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { TRAINER_SPECIALTIES } from '../../lib/trainers/constants';
import { createTrainerProfile } from '../../services/trainersApi';
import type { TrainerSpecialty } from '../../types/trainer';

export default function TrainerSetupScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [gymName, setGymName] = useState('');
  const [postcode, setPostcode] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [instagram, setInstagram] = useState('');
  const [specialties, setSpecialties] = useState<TrainerSpecialty[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleSpecialty = (s: TrainerSpecialty) => {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const handleSave = async (publish: boolean) => {
    setSaving(true);
    try {
      await createTrainerProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        qualifications: qualifications.split(',').map((q) => q.trim()).filter(Boolean),
        specialties,
        gymName: gymName.trim(),
        postcode: postcode.trim().toUpperCase(),
        priceFrom: priceFrom ? Number(priceFrom) : undefined,
        priceUnit: 'session',
        instagram: instagram.trim() || undefined,
        published: publish,
      });
      Toast.show({
        type: 'success',
        text1: publish ? 'Profile published' : 'Draft saved',
      });
      router.replace('/(drawer)/trainers' as any);
    } catch {
      Toast.show({ type: 'error', text1: 'Could not save profile' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <TrainerScreenHeader title='Trainer profile' subtitle='' />
          {[
            { label: 'Display name', value: displayName, set: setDisplayName },
            { label: 'Bio', value: bio, set: setBio, multiline: true },
            { label: 'Qualifications (comma-separated)', value: qualifications, set: setQualifications },
            { label: 'Gym name', value: gymName, set: setGymName },
            { label: 'Postcode', value: postcode, set: setPostcode },
            { label: 'Price from (£/session)', value: priceFrom, set: setPriceFrom, keyboard: 'numeric' as const },
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
                <Text style={[styles.chipText, specialties.includes(s) && styles.chipTextOn]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.primary}
            onPress={() => handleSave(true)}
            disabled={saving}
          >
            <Text style={styles.primaryText}>{saving ? 'Saving…' : 'Publish profile'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondary} onPress={() => handleSave(false)} disabled={saving}>
            <Text style={styles.secondaryText}>Save draft</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xl },
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.lg },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundAlt,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  chipOn: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.borderOrange },
  chipText: { fontSize: 12, color: COLORS.textSecondary },
  chipTextOn: { color: COLORS.primary },
  primary: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  primaryText: { color: COLORS.textButton, fontWeight: TYPOGRAPHY.fontWeight.bold },
  secondary: { padding: SPACING.md, alignItems: 'center' },
  secondaryText: { color: COLORS.primary },
});
