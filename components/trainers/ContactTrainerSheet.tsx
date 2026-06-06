import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
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
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) + SPACING.lg },
          ]}
        >
          <ScrollView
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={styles.title}>Request intro</Text>
            <Text style={styles.subtitle}>Message {trainerName}</Text>
            <TextInput
              style={[styles.input, styles.messageInput]}
              placeholder='Your message'
              placeholderTextColor={COLORS.textSecondary}
              value={message}
              onChangeText={setMessage}
              multiline
              textAlignVertical='top'
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
                <Text style={styles.submitText}>
                  {submitting ? 'Sending…' : 'Send'}
                </Text>
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
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.large,
    borderTopRightRadius: BORDER_RADIUS.large,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    maxHeight: '85%',
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
    minHeight: 48,
  },
  messageInput: {
    minHeight: 96,
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
