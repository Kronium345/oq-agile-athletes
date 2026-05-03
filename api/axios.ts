export const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      throw new Error(error.message || 'Request failed');
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
