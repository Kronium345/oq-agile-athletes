import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import BackgroundGradient from '../../components/BackgroundGradient';
import { TrainerScreenHeader } from '../../components/trainers/TrainerScreenHeader';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { setMyAvailability } from '../../services/trainerBookingsApi';

export default function TrainerAvailabilityScreen() {
  const [notes, setNotes] = useState('Mon & Wed 6–8pm, Sat 10am–12pm');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setMyAvailability([]);
      Toast.show({ type: 'success', text1: 'Availability saved (API slots TBD)' });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not save' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <TrainerScreenHeader title='Availability' subtitle='Booking slots (Phase 6)' />
          <Text style={styles.hint}>
            Full slot picker will sync with GET/PUT /trainers/availability when the API is
            live. For now, describe your typical hours below.
          </Text>
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholderTextColor={COLORS.textSecondary}
          />
          <TouchableOpacity style={styles.btn} onPress={handleSave} disabled={saving}>
            <Text style={styles.btnText}>{saving ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: SPACING.md },
  hint: { color: COLORS.textSecondary, marginBottom: SPACING.md, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    minHeight: 120,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
  },
  btn: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
  },
  btnText: { color: COLORS.textButton, fontWeight: TYPOGRAPHY.fontWeight.bold },
});
