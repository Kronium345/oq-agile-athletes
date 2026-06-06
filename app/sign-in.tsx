import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AuthForm from '../components/AuthForm';
import BackgroundGradient from '../components/BackgroundGradient';
import { BORDER_RADIUS, COLORS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { useBootstrapAuthRedirect } from '../hooks/usePostAuthRedirect';
import { useMarkAppInteractive } from '../hooks/useMarkAppInteractive';
// NOTE: BlobBackground and ErrorBoundary remain removed on native for stability

export default function SignIn() {
  const router = useRouter();

  // Only if already logged in when opening this screen — sign-in submit navigates in AuthForm.
  useBootstrapAuthRedirect();
  useMarkAppInteractive();

  return (
    <>
      <BackgroundGradient>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.select({ ios: 'padding', android: 'height' })}
          keyboardVerticalOffset={Platform.select({ ios: 24, android: 0 })}
          enabled
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.container}>
              <View style={styles.card}>
                <Image
                  source={require('../assets/images/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.heading}>Welcome to Agile Athletes</Text>
                <Text style={styles.subheading}>Let's Get Our Sweat On!</Text>

                <View style={styles.form}>
                  <AuthForm type="sign-in" />
                </View>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>No account yet?</Text>
                  <TouchableOpacity onPress={() => router.push('/sign-up')}>
                    <Text style={styles.linkText}>Sign up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </BackgroundGradient>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: '100%',
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
  form: {
    marginTop: 16,
    width: '100%',
    gap: 12,
  },
  input: {
    width: '100%',
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    backgroundColor: '#FFFFFF',
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    ...SHADOWS.cardLarge,
  },
  primaryButtonText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
});