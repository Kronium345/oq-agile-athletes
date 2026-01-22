import { useRouter } from 'expo-router';
import React from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import AuthForm from '../components/AuthForm';
import BackgroundGradient from '../components/BackgroundGradient';
import BlobBackground from '../components/BlobBackground';
import { BORDER_RADIUS, COLORS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

function ErrorFallback({ error }: FallbackProps) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ color: COLORS.error, fontWeight: 'bold' }}>Oops! Something went wrong:</Text>
      <Text style={{ color: COLORS.textPrimary }}>{errorMessage}</Text>
    </View>
  );
}

export default function SignUp() {
  const router = useRouter();

  return (
    <>
      <BackgroundGradient>
        <BlobBackground variant="scale" />
        <View style={styles.container}>
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={styles.card}
          >
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.heading}>Welcome to Agile Athletes</Text>
            <Text style={styles.subheading}>Let's Get Our Sweat On!</Text>

            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <AuthForm type="sign-up" />
            </ErrorBoundary>

            <Animated.View
              entering={FadeInDown.delay(300).springify()}
              style={styles.footer}
            >
              <Text style={styles.footerText}>Have an account already?</Text>
              <TouchableOpacity onPress={() => router.push('/sign-in')}>
                <Text style={styles.linkText}>Sign in</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>
      </BackgroundGradient>
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.backgroundCard,
    padding: 32,
    borderRadius: BORDER_RADIUS.large,
    width: '100%',
    maxWidth: 400,
    ...SHADOWS.cardLarge,
    alignItems: 'center',
  },
  logo: {
    width: 42,
    height: 42,
    marginBottom: 16,
  },
  heading: {
    fontSize: TYPOGRAPHY.fontSize.large,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  subheading: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  footer: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.textSecondary,
    marginRight: 8,
    fontSize: TYPOGRAPHY.fontSize.small,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.small,
  },
});