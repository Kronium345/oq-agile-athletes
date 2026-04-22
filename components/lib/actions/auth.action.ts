import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from '../../../api/axios';

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