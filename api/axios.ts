import AsyncStorage from '@react-native-async-storage/async-storage';

// TEMP: Hard-coded dev server URL so Expo Go can reach backend reliably
const SERVER_URL = 'http://192.168.1.205:4000';

console.log('[axios] SERVER_URL at runtime:', SERVER_URL);  // add this

const api = {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = await AsyncStorage.getItem('session');
    
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
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
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

