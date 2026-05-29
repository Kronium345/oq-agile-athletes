import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BackgroundGradient from '../components/BackgroundGradient';
import BlobBackground from '../components/BlobBackground';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../constants/theme';
import { useAuthContext } from './AuthProvider';

export default function Index() {
  const { user, isLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/(drawer)/(tabs)/home' as any);
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <BackgroundGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={COLORS.primary} />
        </View>
      </BackgroundGradient>
    );
  }

  if (user) {
    return null;
  }

  return (
    <BackgroundGradient>
      <BlobBackground variant='translate' />
      <View style={styles.container}>
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.headerContainer}
        >
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode='contain'
          />
          <Text style={styles.emoji}>💪</Text>
          <Text style={styles.welcomeText}>Welcome to Agile Athletes</Text>
          <Text style={styles.subtitleText}>Let's Get Our Sweat On!</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={styles.buttonContainer}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              console.log('Navigating to Sign In...');
              router.push('/sign-in');
            }}
          >
            <Text style={styles.primaryButtonText}>SIGN IN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              console.log('Navigating to Sign Up...');
              router.push('/sign-up');
            }}
          >
            <Text style={styles.secondaryButtonText}>SIGN UP</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={styles.footerContainer}
        >
          <Text style={styles.footerText}>For our fitness family</Text>
        </Animated.View>
      </View>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
    width: '100%',
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: SPACING.lg,
  },
  emoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  welcomeText: {
    fontSize: TYPOGRAPHY.fontSize.extraLarge,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  buttonContainer: {
    width: '100%',
    gap: SPACING.md,
    marginBottom: SPACING.xxxl,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.medium,
    width: '100%',
    alignItems: 'center',
    ...SHADOWS.orange,
  },
  primaryButtonText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.medium,
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
  footerContainer: {
    marginTop: SPACING.xxl,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.small,
    textAlign: 'center',
  },
});
