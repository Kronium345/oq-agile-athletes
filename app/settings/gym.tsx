import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import BackgroundGradient from '../../components/BackgroundGradient';
import { TrainerScreenHeader } from '../../components/trainers/TrainerScreenHeader';
import { UseMyLocationButton } from '../../components/trainers/UseMyLocationButton';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { updateMemberGym } from '../../services/trainersApi';
import { useAuthContext } from '../AuthProvider';

export default function MemberGymSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuthContext();
  const [gymName, setGymName] = useState(String((user as any)?.gymName ?? ''));
  const [postcode, setPostcode] = useState(String((user as any)?.postcode ?? ''));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const ok = await updateMemberGym({
        gymName: gymName.trim(),
        postcode: postcode.trim().toUpperCase(),
      });
      if (ok) {
        updateUser?.({
          gymName: gymName.trim(),
          postcode: postcode.trim().toUpperCase(),
        });
        Toast.show({ type: 'success', text1: 'Gym saved' });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Could not save gym' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TrainerScreenHeader
            title='My gym'
            subtitle='Used for trainer & partner matching'
          />
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              { paddingBottom: insets.bottom + SPACING.xl },
            ]}
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.form}>
              <Text style={styles.label}>Gym name</Text>
              <TextInput
                style={styles.input}
                value={gymName}
                onChangeText={setGymName}
                placeholder='e.g. PureGym Aldgate'
                placeholderTextColor={COLORS.textSecondary}
              />
              <Text style={styles.label}>Postcode</Text>
              <TextInput
                style={styles.input}
                value={postcode}
                onChangeText={setPostcode}
                placeholder='e.g. E1 6AN'
                autoCapitalize='characters'
                placeholderTextColor={COLORS.textSecondary}
              />
              <View style={styles.locationBtn}>
                <UseMyLocationButton
                  onResolved={(loc) => setPostcode(loc.postcode)}
                />
              </View>
              <TouchableOpacity
                style={styles.btn}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.btnText}>{saving ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: SPACING.md },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xxl,
  },
  form: {},
  locationBtn: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: SPACING.md,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    color: COLORS.textPrimary,
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
