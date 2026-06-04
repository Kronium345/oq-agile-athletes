import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import BackgroundGradient from '../components/BackgroundGradient';
import ResendCode from '../components/ResendCode';
import { resetPasswordWithCode } from '../components/lib/actions/auth.action';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../constants/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const [email] = useState(typeof emailParam === 'string' ? emailParam : '');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Email required',
        text2: 'Start from the sign-in screen',
        position: 'bottom',
      });
      router.replace('/sign-in');
    }
  }, [email, router]);

  const handleReset = async () => {
    if (!resetCode.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Enter the reset code from your email',
        position: 'bottom',
      });
      return;
    }
    if (newPassword.length < 8) {
      Toast.show({
        type: 'error',
        text1: 'Password must be at least 8 characters',
        position: 'bottom',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Passwords do not match',
        position: 'bottom',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await resetPasswordWithCode({
        email,
        resetCode: resetCode.trim(),
        newPassword,
      });

      if (!result.success) {
        Toast.show({
          type: 'error',
          text1: result.message || 'Reset failed',
          position: 'bottom',
        });
        return;
      }

      Toast.show({
        type: 'success',
        text1: 'Password updated',
        text2: 'Sign in with your new password',
        position: 'bottom',
      });
      router.replace('/sign-in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.select({ ios: 'padding', android: undefined })}
        >
          <TouchableOpacity
            style={styles.back}
            onPress={() => router.replace('/sign-in')}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              <Text style={styles.title}>Reset password</Text>
              <Text style={styles.subtitle}>
                Enter the code sent to{'\n'}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Text>

              <View style={styles.field}>
                <Text style={styles.label}>Reset code</Text>
                <TextInput
                  style={styles.input}
                  value={resetCode}
                  onChangeText={setResetCode}
                  placeholder="6-digit code"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <ResendCode email={email} />

              <View style={styles.field}>
                <Text style={styles.label}>New password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="At least 8 characters"
                    placeholderTextColor={COLORS.textSecondary}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eye}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Confirm password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter password"
                  placeholderTextColor={COLORS.textSecondary}
                  secureTextEntry={!showPassword}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleReset}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Updating…' : 'Update password'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  back: {
    marginLeft: SPACING.lg,
    marginTop: SPACING.sm,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.xl,
    ...SHADOWS.cardLarge,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.extraLarge,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  emailHighlight: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  field: {
    marginBottom: SPACING.md,
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
  passwordRow: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 44,
  },
  eye: {
    position: 'absolute',
    right: SPACING.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  button: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.medium,
    paddingVertical: SPACING.lg,
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
});
