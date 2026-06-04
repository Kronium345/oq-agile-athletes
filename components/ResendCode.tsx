import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Toast from 'react-native-toast-message';
import { requestPasswordReset } from './lib/actions/auth.action';
import { COLORS, TYPOGRAPHY } from '../constants/theme';

type ResendCodeProps = {
  email: string;
};

export default function ResendCode({ email }: ResendCodeProps) {
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const result = await requestPasswordReset(email);
      if (!result.success) {
        Toast.show({
          type: 'error',
          text1: result.message || 'Could not resend code',
          position: 'bottom',
        });
        return;
      }
      Toast.show({
        type: 'success',
        text1: 'Code resent',
        text2: __DEV__ && result.resetCode
          ? `Dev code: ${result.resetCode}`
          : 'Check your inbox',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleResend}
      disabled={loading || !email}
      style={styles.wrap}
    >
      <Text style={styles.text}>Didn&apos;t receive the code? </Text>
      <Text style={styles.link}>
        {loading ? 'Sending…' : 'Resend'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  text: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.small,
  },
  link: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.small,
  },
});
