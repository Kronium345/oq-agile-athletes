import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { signInWithProvider } from '../components/lib/actions/auth.action';

export const useAppleSignIn = () => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      setIsAvailable(false);
      return;
    }

    AppleAuthentication.isAvailableAsync()
      .then(setIsAvailable)
      .catch(() => setIsAvailable(false));
  }, []);

  const signIn = async () => {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign-In is only available on iOS.');
    }

    setIsSigningIn(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple.');
      }

      const result = await signInWithProvider('apple', credential.identityToken);
      if (!result.success || !result.user || !result.session) {
        throw new Error(result.message || 'Apple sign-in failed.');
      }

      return result;
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err.code === 'ERR_REQUEST_CANCELED') {
        throw new Error('Sign-in was cancelled.');
      }
      throw new Error(err.message || 'Apple sign-in failed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return {
    signIn,
    isSigningIn,
    isAvailable,
  };
};
