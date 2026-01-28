import AsyncStorage from '@react-native-async-storage/async-storage';

export const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://fitness-api-prod-v2-123.us-east-1.elasticbeanstalk.com';

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

