import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { requestPasswordReset } from './lib/actions/auth.action';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../constants/theme';

type ForgotPasswordModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function ForgotPasswordModal({
  visible,
  onClose,
}: ForgotPasswordModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleClose = () => {
    setEmail('');
    setEmailError('');
    setSent(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      setEmailError('Please enter your email address');
      return;
    }
    if (!isValidEmail(email.trim())) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailError('');
    setLoading(true);

    try {
      const result = await requestPasswordReset(email.trim());

      if (!result.success) {
        setEmailError(result.message || 'Failed to send reset instructions');
        return;
      }

      setSent(true);

      if (__DEV__ && result.resetCode) {
        Toast.show({
          type: 'info',
          text1: 'Dev: reset code',
          text2: result.resetCode,
          position: 'bottom',
        });
      }

      setTimeout(() => {
        handleClose();
        router.push({
          pathname: '/reset-password',
          params: { email: email.trim() },
        } as any);
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={handleClose}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={styles.card}>
          <TouchableOpacity style={styles.close} onPress={handleClose}>
            <Feather name="x" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>

          {sent ? (
            <View style={styles.successBlock}>
              <View style={styles.checkCircle}>
                <Feather name="check" size={28} color={COLORS.textButton} />
              </View>
              <Text style={styles.title}>Check your email</Text>
              <Text style={styles.subtitle}>
                If an account exists for {email.trim()}, you will receive reset
                instructions shortly.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.title}>Reset password</Text>
              <Text style={styles.subtitle}>
                Enter your email and we will send you a reset code.
              </Text>

              <View style={styles.inputSection}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, emailError ? styles.inputError : null]}
                  placeholder="you@example.com"
                  placeholderTextColor={COLORS.textSecondary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {emailError ? (
                  <Text style={styles.errorText}>{emailError}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Sending…' : 'Send reset instructions'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.xl,
    ...SHADOWS.cardLarge,
  },
  close: {
    position: 'absolute',
    right: SPACING.lg,
    top: SPACING.lg,
    zIndex: 1,
    padding: SPACING.xs,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.medium,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.medium,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.small,
    marginTop: SPACING.xs,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.medium,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.orange,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
  successBlock: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  checkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
});
