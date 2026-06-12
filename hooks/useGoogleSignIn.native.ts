import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { signInWithProvider } from '../components/lib/actions/auth.action';

const LOG_PREFIX = '[Google Sign-In]';

function maskClientId(id?: string): string {
  if (!id) return '(not set)';
  if (id.length <= 20) return `${id.slice(0, 6)}…`;
  return `${id.slice(0, 10)}…${id.slice(-12)}`;
}

function logGoogleError(phase: string, error: unknown) {
  const err = error as Record<string, unknown>;
  const code = err?.code;
  const message = err?.message;

  console.error(`${LOG_PREFIX} Error during ${phase}:`, {
    code,
    message,
    name: err?.name,
    userInfo: err?.userInfo,
    nativeStackAndroid: err?.nativeStackAndroid,
    stack: err instanceof Error ? err.stack : undefined,
  });

  const isDeveloperError =
    code === '10' ||
    code === 10 ||
    String(code).includes('DEVELOPER') ||
    String(message).includes('DEVELOPER_ERROR');

  if (isDeveloperError) {
    console.error(
      `${LOG_PREFIX} DEVELOPER_ERROR hints:`,
      'Android: add your app SHA-1 to the Google Cloud OAuth client and use the Web client ID in EXPO_PUBLIC_WEB_CLIENT_ID.',
      `Package: ${Constants.expoConfig?.android?.package ?? 'unknown'}`,
      `Web client ID set: ${Boolean(process.env.EXPO_PUBLIC_WEB_CLIENT_ID)}`,
      `iOS client ID set: ${Boolean(process.env.EXPO_PUBLIC_IOS_CLIENT_ID)}`,
    );
  }
}

export const useGoogleSignIn = () => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    try {
      const webClientId = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
      const iosClientId = process.env.EXPO_PUBLIC_IOS_CLIENT_ID;

      console.log(`${LOG_PREFIX} Configuring`, {
        platform: Platform.OS,
        androidPackage: Constants.expoConfig?.android?.package,
        iosBundleId: Constants.expoConfig?.ios?.bundleIdentifier,
        webClientId: maskClientId(webClientId),
        iosClientId: maskClientId(iosClientId),
        dev: __DEV__,
      });

      if (!webClientId) {
        console.warn(
          `${LOG_PREFIX} EXPO_PUBLIC_WEB_CLIENT_ID is not set (required on Android).`,
        );
      }

      if (Platform.OS === 'ios' && !iosClientId) {
        console.error(
          `${LOG_PREFIX} EXPO_PUBLIC_IOS_CLIENT_ID is not set — Google Sign-In will not work on iOS.`,
        );
        return;
      }

      GoogleSignin.configure({
        webClientId,
        iosClientId,
        offlineAccess: false,
      });
      setIsConfigured(true);
      console.log(`${LOG_PREFIX} Configuration complete`);
    } catch (error) {
      logGoogleError('configure', error);
    }
  }, []);

  const signIn = async () => {
    if (!isConfigured) {
      console.error(`${LOG_PREFIX} signIn called before configuration finished`);
      throw new Error('Google Sign-In is not configured on this device.');
    }

    setIsSigningIn(true);
    console.log(`${LOG_PREFIX} signIn started`);

    try {
      if (Platform.OS === 'android') {
        console.log(`${LOG_PREFIX} Checking Play Services…`);
        await GoogleSignin.hasPlayServices();
        console.log(`${LOG_PREFIX} Play Services OK`);
      }

      await GoogleSignin.signOut().catch(() => {});

      console.log(`${LOG_PREFIX} Launching Google account picker…`);
      const response = await GoogleSignin.signIn();
      console.log(`${LOG_PREFIX} signIn response`, {
        type: (response as { type?: string }).type,
        hasUser: Boolean((response as { data?: unknown }).data),
      });

      if ((response as { type?: string }).type === 'cancelled') {
        throw new Error('Sign-in was cancelled.');
      }

      console.log(`${LOG_PREFIX} Fetching ID token…`);
      const { idToken } = await GoogleSignin.getTokens();
      if (!idToken) {
        throw new Error('No ID token received from Google.');
      }
      console.log(`${LOG_PREFIX} ID token received (${idToken.length} chars)`);

      console.log(`${LOG_PREFIX} Exchanging token with backend…`);
      const result = await signInWithProvider('google', idToken);
      console.log(`${LOG_PREFIX} Backend response`, {
        success: result.success,
        isNewUser: result.isNewUser,
        message: result.message,
        hasUser: Boolean(result.user),
        hasSession: Boolean(result.session),
      });

      if (!result.success || !result.user || !result.session) {
        throw new Error(result.message || 'Google sign-in failed.');
      }

      console.log(`${LOG_PREFIX} signIn complete`);
      return result;
    } catch (error: unknown) {
      logGoogleError('signIn', error);

      const err = error as { code?: string | number; message?: string };

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
