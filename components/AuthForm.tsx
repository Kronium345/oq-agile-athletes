import FormField from '@/components/FormField';
import { signIn, signUp } from '@/components/lib/actions/auth.action';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FieldErrors, useForm } from 'react-hook-form';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { z } from 'zod';
import { useAuthContext } from '../app/AuthProvider';
import { BORDER_RADIUS, COLORS, TYPOGRAPHY } from '../constants/theme';
import { usePostAuthRedirect } from '../hooks/usePostAuthRedirect';
import { DEFAULT_EMAIL_SETTINGS } from '../lib/notifications/types';
import { clearOnboardingProfile } from '../lib/onboarding/storage';
import { syncEmailNotificationSettings } from './lib/actions/notificationPreferences.action';

type FormType = 'sign-in' | 'sign-up';

const signUpSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const signInSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type SignUpFormData = z.infer<typeof signUpSchema>;
type SignInFormData = z.infer<typeof signInSchema>;

const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();
  const { login } = useAuthContext();
  const { redirectAuthenticatedUser } = usePostAuthRedirect();
  const isSignIn = type === 'sign-in';
  const [forgotVisible, setForgotVisible] = useState(false);
  const syncDefaultEmailPreferences = async (user: {
    _id?: string;
    userId?: string;
  }) => {
    const userId = user._id ?? user.userId;
    if (!userId) return;
    try {
      await syncEmailNotificationSettings(String(userId), {
        ...DEFAULT_EMAIL_SETTINGS,
      });
    } catch {
      // Non-blocking: local prefs still apply; server sync can retry in settings.
    }
  };

  const showToast = (toast: {
    type: 'success' | 'error';
    text1: string;
    text2?: string;
  }) => {
    Toast.show({
      ...toast,
      position: 'bottom',
    });
  };

  const schema = isSignIn ? signInSchema : signUpSchema;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData | SignInFormData>({
    resolver: zodResolver(schema),
    defaultValues: isSignIn
      ? { email: '', password: '' }
      : { name: '', email: '', password: '' },
  });

  const onSubmit = async (values: any) => {
    const { name, email, password } = values;

    try {
      if (isSignIn) {
        console.log('=== AUTH FORM: Starting sign in ===');
        const result = await signIn({ email, password });
        console.log('Sign in result:', result);

        if (!result?.success) {
          showToast({
            type: 'error',
            text1: result.message || 'Sign in failed',
          });
          return;
        }

        if (!result.user || !result.session) {
          showToast({
            type: 'error',
            text1: 'Invalid server auth response. Please try again.',
          });
          return;
        }
        console.log('=== AUTH FORM: Calling AuthProvider login ===');
        await login(result.user, result.session);
        await syncDefaultEmailPreferences(result.user);

        showToast({
          type: 'success',
          text1: 'Signed in successfully.',
        });

        await redirectAuthenticatedUser(
          result.user as Record<string, unknown>,
        );
      } else {
        console.log('=== AUTH FORM: Starting sign up ===');
        const result = await signUp({
          name,
          email,
          password,
        });
        console.log('Sign up result:', result);

        if (!result?.success) {
          showToast({
            type: 'error',
            text1: result.message || 'Something went wrong!',
          });
          return;
        }

        if (!result.user || !result.session) {
          showToast({
            type: 'error',
            text1: 'Account created but login data is missing. Please sign in.',
          });
          router.push('/sign-in');
          return;
        }
        console.log('=== AUTH FORM: Calling AuthProvider login after signup ===');
        await clearOnboardingProfile();
        await login(result.user, result.session);
        await syncDefaultEmailPreferences(result.user);

        // Go straight to onboarding — avoid resolveAuthenticatedDestination racing with the gender guard
        router.replace('/onboarding/gender' as any);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      showToast({
        type: 'error',
        text1: err.message || 'Something went wrong!',
      });
    }
  };

  const onInvalid = (formErrors: FieldErrors<SignUpFormData | SignInFormData>) => {
    const firstErrorMessage = Object.values(formErrors)[0]?.message;
    showToast({
      type: 'error',
      text1:
        typeof firstErrorMessage === 'string'
          ? firstErrorMessage
          : 'Please fix the highlighted form fields.',
    });
  };

  return (
    <View>
      {!isSignIn && (
        <FormField
          control={control}
          name="name"
          label="Name"
          placeholder="Enter your name"
          type="text"
        />
      )}

      <FormField
        control={control}
        name="email"
        label="Email"
        placeholder="Enter your email"
        type="email"
      />

      <FormField
        control={control}
        name="password"
        label="Password"
        placeholder="Enter your password"
        type="password"
      />

      {isSignIn && (
        <TouchableOpacity
          style={styles.forgotLink}
          onPress={() => setForgotVisible(true)}
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>
      )}

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit, onInvalid)}
        style={styles.button}
        labelStyle={styles.buttonLabel}
      >
        {isSignIn ? 'Sign In' : 'Sign Up'}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 4,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  button: {
    backgroundColor: COLORS.primary,
    marginTop: 16,
    borderRadius: BORDER_RADIUS.medium,
    paddingVertical: 8,
    ...COLORS.shadowOrange && {
      shadowColor: COLORS.primaryShadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
  },
  buttonLabel: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
});

export default AuthForm;