import { signUp } from '@/components/lib/actions/auth.action';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useAuthContext } from '../app/AuthProvider';
import BackgroundGradient from '../components/BackgroundGradient';
import { BORDER_RADIUS, COLORS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
// NOTE: BlobBackground, AuthForm, Toast, and ErrorBoundary removed temporarily on native

export default function SignUp() {
  const router = useRouter();
  const { login } = useAuthContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Please fill in name, email, and password.',
      });
      return;
    }

    try {
      setSubmitting(true);
      const result = await signUp({ name, email, password });

      if (!result?.success) {
        Toast.show({
          type: 'error',
          text1: result?.message || 'Could not create account.',
        });
        return;
      }

      if (result.user && result.session) {
        await login(result.user, result.session);
        Toast.show({
          type: 'success',
          text1: 'Account created successfully.',
        });
        router.replace('/(drawer)/(tabs)/exercises' as any);
      } else {
        Toast.show({
          type: 'success',
          text1: 'Account created. Please sign in.',
        });
        router.push('/sign-in');
      }
    } catch (err: any) {
      console.error('Sign up error:', err);
      Toast.show({
        type: 'error',
        text1: err?.message || 'Something went wrong during sign up.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <BackgroundGradient>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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

                {/* Inline sign-up form with Toast feedback */}
                <View style={styles.form}>
                  <TextInput
                    style={styles.input}
                    placeholder="Name"
                    placeholderTextColor={COLORS.textSecondary}
                    autoCapitalize="words"
                    value={name}
                    onChangeText={setName}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={COLORS.textSecondary}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    style={[styles.primaryButton, submitting && { opacity: 0.7 }]}
                    onPress={handleSignUp}
                    disabled={submitting}
                  >
                    <Text style={styles.primaryButtonText}>
                      {submitting ? 'Signing Up...' : 'Sign Up'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Have an account already?</Text>
                  <TouchableOpacity onPress={() => router.push('/sign-in')}>
                    <Text style={styles.linkText}>Sign in</Text>
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