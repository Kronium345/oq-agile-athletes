import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useEffect, useState } from 'react';
import { signInWithProvider } from '../components/lib/actions/auth.action';

export const useGoogleSignIn = () => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    try {
      const webClientId = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
      const iosClientId = process.env.EXPO_PUBLIC_IOS_CLIENT_ID;

      if (!webClientId) {
        console.warn(
          'Google Sign-In: EXPO_PUBLIC_WEB_CLIENT_ID is not set.',
        );
      }

      GoogleSignin.configure({
        webClientId,
        iosClientId,
        offlineAccess: false,
      });
      setIsConfigured(true);
    } catch (error) {
      console.error('Google Sign-In configuration error:', error);
    }
  }, []);

  const signIn = async () => {
    if (!isConfigured) {
      throw new Error('Google Sign-In is not configured on this device.');
    }

    setIsSigningIn(true);
    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signOut().catch(() => {});

      const response = await GoogleSignin.signIn();
      if ((response as { type?: string }).type === 'cancelled') {
        throw new Error('Sign-in was cancelled.');
      }

      const { idToken } = await GoogleSignin.getTokens();
      if (!idToken) {
        throw new Error('No ID token received from Google.');
      }

      const result = await signInWithProvider('google', idToken);
      if (!result.success || !result.user || !result.session) {
        throw new Error(result.message || 'Google sign-in failed.');
      }

      return result;
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };

      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Sign-in was cancelled.');
      }
      if (err.code === statusCodes.IN_PROGRESS) {
        throw new Error('Sign-in is already in progress.');
      }
      if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services are not available.');
      }

      throw new Error(err.message || 'Google sign-in failed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return {
    signIn,
    isSigningIn,
    isAvailable: isConfigured,
  };
};
