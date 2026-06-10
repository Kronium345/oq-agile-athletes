import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from '../../../api/axios';

/** Remove cached auth when the token is invalid or the account no longer exists. */
export async function clearStaleSession(): Promise<void> {
  await AsyncStorage.multiRemove([
    'user',
    'session',
    'token',
    'onboardingProfile',
    'onboardingComplete',
    'lastPage',
  ]);
}

function normalizeAuthPayload(data: any) {
  const session = data?.session || data?.token || data?.accessToken || null;
  const user =
    data?.user ||
    data?.result ||
    data?.data?.user ||
    data?.data ||
    null;

  return {
    ...data,
    success: Boolean(data?.success ?? true),
    session,
    user,
  };
}

export async function signUp(params: SignUpParams) {
  try {
    const res = await fetch(`${SERVER_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();

    const normalized = normalizeAuthPayload(data);

    if (!res.ok || !normalized.success) {
      throw new Error(normalized.message || 'Signup failed');
    }

    if (normalized.session) {
      await AsyncStorage.setItem('session', normalized.session);
    }

    return normalized;
  } catch (e: any) {
    console.error('Error signing up user:', e.message);
    return {
      success: false,
      message: e.message || 'Signup failed',
    };
  }
}

export async function signIn(params: SignInParams) {
  try {
    const res = await fetch(`${SERVER_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();

    const normalized = normalizeAuthPayload(data);

    if (!res.ok || !normalized.success) {
      throw new Error(normalized.message || 'Signin failed');
    }

    if (normalized.session) {
      await AsyncStorage.setItem('session', normalized.session);
      console.log('[auth] session token stored:', normalized.session);
    }

    return normalized;
  } catch (error: any) {
    console.error('Error signing in user:', error.message);
    return {
      success: false,
      message: error.message || 'Signin failed',
    };
  }
}


export async function getCurrentUsers(): Promise<User | null> {
  try {
    const session = await AsyncStorage.getItem('session');

    if (!session) return null;

    const res = await fetch(`${SERVER_URL}/auth/current-user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session}`,
      },
    });

    const data = await res.json();

    if (!res.ok || !data?.success) {
      if (res.status === 401 || res.status === 403) {
        await clearStaleSession();
      }
      return null;
    }

    return data.user as User;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}


export async function isAuthenticated() {
  const user = await getCurrentUsers();

  // Trick to convert truth/false value into a boolean
  return !!user;
}

export async function requestPasswordReset(email: string) {
  try {
    const res = await fetch(`${SERVER_URL}/auth/forgotpassword`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || 'Failed to send reset email');
    }

    return {
      success: true,
      message: data?.message as string | undefined,
      resetCode: data?.resetCode as string | undefined,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to send reset email';
    return { success: false, message };
  }
}

export type SocialSignInResult = {
  success: boolean;
  message?: string;
  user?: User & { isNewUser?: boolean };
  session?: string;
  isNewUser?: boolean;
};

export async function signInWithProvider(
  provider: 'google' | 'apple',
  token: string,
): Promise<SocialSignInResult> {
  try {
    const endpoint = `${SERVER_URL}/auth/${provider}`;
    console.log(`[Social Auth] POST ${endpoint}`, {
      provider,
      tokenLength: token.length,
    });

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    const data = await res.json().catch(() => ({}));
    console.log(`[Social Auth] ${provider} response`, {
      status: res.status,
      ok: res.ok,
      message: data?.message ?? data?.error,
      hasUser: Boolean(data?.user ?? data?.result),
      hasSession: Boolean(data?.session ?? data?.token ?? data?.accessToken),
      isNewUser: data?.isNewUser ?? data?.user?.isNewUser,
    });

    const userRaw = data?.user ?? data?.result ?? null;
    const session =
      data?.session ?? data?.token ?? data?.accessToken ?? null;
    const isNewUser = Boolean(userRaw?.isNewUser ?? data?.isNewUser);

    if (!res.ok) {
      throw new Error(
        data?.message || data?.error || `${provider} sign-in failed`,
      );
    }

    if (!userRaw || !session) {
      throw new Error('Invalid server auth response. Please try again.');
    }

    const user = { ...userRaw, isNewUser } as User & { isNewUser?: boolean };

    await AsyncStorage.setItem('session', session);

    return {
      success: true,
      user,
      session,
      isNewUser,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : `${provider} sign-in failed`;
    console.error(`[Social Auth] ${provider} request failed`, {
      message,
      error,
    });
    return { success: false, message };
  }
}

export async function resetPasswordWithCode(params: {
  email: string;
  resetCode: string;
  newPassword: string;
}) {
  try {
    const res = await fetch(`${SERVER_URL}/auth/resetpassword`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || 'Failed to reset password');
    }

    return {
      success: true,
      message: (data?.message as string) || 'Password updated successfully',
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to reset password';
    return { success: false, message };
  }
}