import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BORDER_RADIUS, COLORS, TYPOGRAPHY } from '../constants/theme';

type SocialAuthButtonsProps = {
  mode: 'sign-in' | 'sign-up';
  onGooglePress: () => void;
  onApplePress: () => void;
  googleAvailable?: boolean;
  appleAvailable?: boolean;
  googleLoading?: boolean;
  appleLoading?: boolean;
};

export default function SocialAuthButtons({
  mode,
  onGooglePress,
  onApplePress,
  googleAvailable = false,
  appleAvailable = false,
  googleLoading = false,
  appleLoading = false,
}: SocialAuthButtonsProps) {
  if (!googleAvailable && !appleAvailable) {
    return null;
  }

  const googleLabel =
    mode === 'sign-in' ? 'Sign in with Google' : 'Sign up with Google';
  const appleLabel =
    mode === 'sign-in' ? 'Sign in with Apple' : 'Sign up with Apple';

  return (
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      {googleAvailable ? (
        <TouchableOpacity
          style={[styles.button, googleLoading && styles.buttonDisabled]}
          onPress={onGooglePress}
          disabled={googleLoading || appleLoading}
          activeOpacity={0.85}
        >
          {googleLoading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <>
              <Image
                source={require('../assets/images/logo-google.png')}
                style={styles.brandIcon}
              />
              <Text style={styles.buttonText}>{googleLabel}</Text>
            </>
          )}
        </TouchableOpacity>
      ) : null}

      {appleAvailable ? (
        <TouchableOpacity
          style={[
            styles.button,
            styles.appleButton,
            appleLoading && styles.buttonDisabled,
          ]}
          onPress={onApplePress}
          disabled={googleLoading || appleLoading}
          activeOpacity={0.85}
        >
          {appleLoading ? (
            <ActivityIndicator color={COLORS.textButton} />
          ) : (
            <>
              <Image
                source={require('../assets/images/logo-apple-white.png')}
                style={styles.brandIcon}
              />
              <Text style={[styles.buttonText, styles.appleButtonText]}>
                {appleLabel}
              </Text>
            </>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textSecondary,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.borderPeach,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.medium,
    paddingVertical: 12,
    marginBottom: 10,
  },
  appleButton: {
    backgroundColor: COLORS.textPrimary,
    borderColor: COLORS.textPrimary,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  brandIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  buttonText: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  appleButtonText: {
    color: COLORS.textButton,
  },
});
