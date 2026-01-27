import AsyncStorage from '@react-native-async-storage/async-storage';

// TEMP: Hard-coded dev server URL so Expo Go can reach backend reliably
const SERVER_URL = 'http://192.168.1.205:4000';

console.log('[auth] SERVER_URL at runtime:', SERVER_URL);

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

    if (!res.ok) {
      throw new Error(data.message || 'Signup failed');
    }

    if (data.session) {
      await AsyncStorage.setItem('session', data.session);
    }

    return data;
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

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Signin failed');
    }

    if (data.session) {
      await AsyncStorage.setItem('session', data.session);
    }

    return data;
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