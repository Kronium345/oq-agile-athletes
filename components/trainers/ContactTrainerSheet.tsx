import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { submitContactRequest } from '../../services/trainerLeadsApi';

type Props = {
  visible: boolean;
  trainerId: string;
  trainerName: string;
  onClose: () => void;
};

export function ContactTrainerSheet({
  visible,
  trainerId,
  trainerName,
  onClose,
}: Props) {
  const [message, setMessage] = useState('');
  const [goal, setGoal] = useState('');
  const [budget, setBudget] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (message.trim().length < 10) {
      Toast.show({ type: 'error', text1: 'Please write a longer message' });
      return;
    }
    setSubmitting(true);
    try {
      const ok = await submitContactRequest(trainerId, {
        message: message.trim(),
        goal: goal.trim() || undefined,
        budget: budget.trim() || undefined,
      });
      if (ok) {
        Toast.show({ type: 'success', text1: 'Request sent', text2: trainerName });
        setMessage('');
        setGoal('');
        setBudget('');
        onClose();
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Could not send request' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType='slide' transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Request intro</Text>
          <Text style={styles.subtitle}>Message {trainerName}</Text>
          <TextInput
            style={styles.input}
            placeholder='Your message'
            placeholderTextColor={COLORS.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder='Goal (optional)'
            placeholderTextColor={COLORS.textSecondary}
            value={goal}
            onChangeText={setGoal}
          />
          <TextInput
            style={styles.input}
            placeholder='Budget (optional)'
            placeholderTextColor={COLORS.textSecondary}
            value={budget}
            onChangeText={setBudget}
          />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancel} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submit, submitting && styles.disabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitText}>{submitting ? 'Sending…' : 'Send'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.large,
    borderTopRightRadius: BORDER_RADIUS.large,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    color: COLORS.textPrimary,
    minHeight: 44,
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: SPACING.md },
  cancel: {
    flex: 1,
    padding: SPACING.md,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.backgroundAlt,
  },
  cancelText: { color: COLORS.textPrimary },
  submit: {
    flex: 1,
    padding: SPACING.md,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.primary,
  },
  submitText: { color: COLORS.textButton, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  disabled: { opacity: 0.6 },
});
