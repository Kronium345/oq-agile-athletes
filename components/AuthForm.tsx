import FormField from '@/components/FormField';
import { signIn, signUp } from '@/components/lib/actions/auth.action';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from 'firebase/auth';
import React from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { z } from 'zod';
import { BORDER_RADIUS, COLORS, TYPOGRAPHY } from '../constants/theme';
import { auth } from '../firebase/client';

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
  const isSignIn = type === 'sign-in';

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
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const idToken = await userCredential.user.getIdToken(); // 🔐 get token from Firebase

        const result = await signIn({ email, idToken });

        if (!result?.success) {
          Toast.show({
            type: 'error',
            text1: result.message || 'Sign in failed',
          });
          return;
        }

        Toast.show({
          type: 'success',
          text1: 'Signed in successfully.',
        });

        router.push('/home');
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const uid = userCredential.user.uid;

        const result = await signUp({
          uid,
          name,
          email,
          password,
        });

        if (!result?.success) {
          Toast.show({
            type: 'error',
            text1: result.message || 'Something went wrong!',
          });
          return;
        }

        Toast.show({
          type: 'success',
          text1: 'Account created successfully. Please sign in.',
        });

        router.push('/sign-in');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      Toast.show({
        type: 'error',
        text1: err.message || 'Something went wrong!',
      });
    }
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

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        style={styles.button}
        labelStyle={styles.buttonLabel}
      >
        {isSignIn ? 'Sign In' : 'Sign Up'}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
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