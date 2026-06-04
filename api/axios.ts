import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const PROD_URL = 'https://api-oq-agile-athletes.onrender.com';
const DEV_URL = 'http://localhost:4000';

/** Metro / dev-client host, e.g. 192.168.1.5 from 192.168.1.5:8081 */
function getDevMachineHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;
  const host = hostUri.split(':')[0];
  return host || null;
}

/**
 * Dev: EXPO_PUBLIC_SERVER_URL from .env.development (localhost), rewritten to
 * LAN IP / 10.0.2.2 on device. Prod: .env.production / EAS → Render URL.
 */
export function resolveServerUrl(): string {
  let url =
    process.env.EXPO_PUBLIC_SERVER_URL ?? (__DEV__ ? DEV_URL : PROD_URL);

  if (!__DEV__) {
    return url;
  }

  if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
    return url;
  }

  if (Platform.OS === 'android' && !Device.isDevice) {
    return url
      .replace('localhost', '10.0.2.2')
      .replace('127.0.0.1', '10.0.2.2');
  }

  const devHost = getDevMachineHost();
  if (devHost) {
    return url.replace('localhost', devHost).replace('127.0.0.1', devHost);
  }

  return url;
}

export const SERVER_URL = resolveServerUrl();

if (__DEV__) {
  console.log('[API] Using SERVER_URL:', SERVER_URL);
}

async function getAuthToken(): Promise<string | null> {
  const sessionToken = await AsyncStorage.getItem('session');
  const legacyToken = await AsyncStorage.getItem('token');
  return sessionToken || legacyToken;
}

const api = {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = await getAuthToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${SERVER_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Request failed' }));
      const message =
        error.message ||
        error.error ||
        error.details ||
        (response.status === 404 ? 'Route not found' : 'Request failed');
      throw new Error(message);
    }

    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  },

  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  },

  async post(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async put(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};

export default api;
