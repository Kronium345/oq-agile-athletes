import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { UseMyLocationButton } from '../trainers/UseMyLocationButton';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../constants/theme';
import {
  formatExperienceForDisplay,
  formatGenderForDisplay,
  formatWeightForDisplay,
} from '../../lib/profile/display';
import { getUserId } from '../../lib/onboarding/storage';
import {
  requestPartnerConnect,
  savePartnerMatchingProfile,
} from '../../services/communityApi';
import type { TrainingPartner } from '../../types/trainer';
import { useAuthContext } from '../../app/AuthProvider';

type Props = {
  visible: boolean;
  partner: TrainingPartner | null;
  onClose: () => void;
  onSent: () => void;
};

export function ConnectPartnerModal({
  visible,
  partner,
  onClose,
  onSent,
}: Props) {
  const { user, updateUser } = useAuthContext();
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [experience, setExperience] = useState('');
  const [gymName, setGymName] = useState('');
  const [postcode, setPostcode] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!visible || !user) return;
    const record = user as Record<string, unknown>;
    setGender(formatGenderForDisplay(record.gender ?? record.sex));
    setWeight(formatWeightForDisplay(record.weight));
    setExperience(formatExperienceForDisplay(record.experience ?? record.experienceLevel));
    setGymName(String(record.gymName ?? '').trim());
    setPostcode(String(record.postcode ?? '').trim().toUpperCase());
  }, [visible, user]);

  const handleSend = async () => {
    if (!partner) return;

    const trimmedGender = gender.trim();
    const trimmedExperience = experience.trim();
    const trimmedGym = gymName.trim();
    const trimmedPostcode = postcode.trim().toUpperCase();

    if (!trimmedGender || !trimmedExperience) {
      Toast.show({
        type: 'error',
        text1: 'Profile incomplete',
        text2: 'Please add your gender and experience level.',
      });
      return;
    }

    if (!trimmedGym || !trimmedPostcode) {
      Toast.show({
        type: 'error',
        text1: 'Gym location needed',
        text2: 'Add your gym name and postcode for partner matching.',
      });
      return;
    }

    const userId = getUserId(user as Record<string, unknown>);
    if (!userId) {
      Toast.show({ type: 'error', text1: 'Please sign in again.' });
      return;
    }

    const weightNum = weight.trim() ? Number(weight) : undefined;
    if (weight.trim() && (weightNum == null || Number.isNaN(weightNum))) {
      Toast.show({
        type: 'error',
        text1: 'Invalid weight',
        text2: 'Enter your weight in kg as a number.',
      });
      return;
    }

    setSending(true);
    try {
      await savePartnerMatchingProfile({
        userId,
        gender: trimmedGender,
        experience: trimmedExperience,
        weight: weightNum,
        gymName: trimmedGym,
        postcode: trimmedPostcode,
        unit: String((user as Record<string, unknown>)?.unit ?? 'kg'),
      });

      updateUser?.({
        gender: trimmedGender,
        experience: trimmedExperience,
        ...(weightNum != null && { weight: weightNum }),
        gymName: trimmedGym,
        postcode: trimmedPostcode,
      });

      const result = await requestPartnerConnect(partner.userId);
      if (!result.ok) {
        Toast.show({
          type: 'error',
          text1: 'Could not send request',
          text2: result.message ?? 'Please try again.',
        });
        return;
      }

      Toast.show({
        type: 'success',
        text1: 'Request sent',
        text2: result.message ?? `${partner.displayName} will be notified.`,
      });
      onSent();
      onClose();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Could not send request',
        text2: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setSending(false);
    }
  };

  if (!partner) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType='fade'
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <ScrollView
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={styles.title}>Connect with {partner.displayName}</Text>
            <Text style={styles.subtitle}>
              Review your details for partner matching. We&apos;ll save these to
              your profile, then send your request to {partner.displayName}.
            </Text>

            <Text style={styles.sectionLabel}>About you</Text>
            <Text style={styles.label}>Gender</Text>
            <TextInput
              style={styles.input}
              value={gender}
              onChangeText={setGender}
              placeholder='e.g. Male, Female, Non-binary'
              placeholderTextColor={COLORS.textSecondary}
            />
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              placeholder='e.g. 75'
              keyboardType='decimal-pad'
              placeholderTextColor={COLORS.textSecondary}
            />
            <Text style={styles.label}>Experience level</Text>
            <TextInput
              style={styles.input}
              value={experience}
              onChangeText={setExperience}
              placeholder='e.g. Beginner, Intermediate, Advanced'
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={styles.sectionLabel}>Gym & location</Text>
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
                label='Use my location for postcode'
              />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                disabled={sending}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator color={COLORS.textButton} size='small' />
                ) : (
                  <Text style={styles.sendText}>Send request</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    maxHeight: '88%',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.lg,
    ...SHADOWS.cardLarge,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.backgroundCard,
  },
  locationBtn: {
    marginTop: SPACING.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
  },
  cancelText: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  sendBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  sendBtnDisabled: {
    opacity: 0.7,
  },
  sendText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});
