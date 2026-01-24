import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface User {
  _id?: string;
  userId?: string;
  email?: string;
  name?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUserFromStorage = async () => {
      console.log('=== AUTH PROVIDER: Loading user from storage ===');
      try {
        const storedUser = await AsyncStorage.getItem('user');
        console.log('Stored user data:', storedUser);
        
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log('Setting user from storage:', parsedUser);
          setUser(parsedUser);
          return;
        }

        // If no stored user, check for session token and fetch current user
        const sessionToken = await AsyncStorage.getItem('session');
        console.log('Session token found:', !!sessionToken);
        
        if (sessionToken) {
          console.log('Fetching current user with session token...');
          try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3000'}/auth/current-user`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${sessionToken}`,
                'Content-Type': 'application/json',
              },
            });

            const data = await response.json();
            console.log('Current user response:', data);

            if (response.ok && data.success && data.user) {
              console.log('Setting user from API:', data.user);
              setUser(data.user);
              // Store user data for future use
              await AsyncStorage.setItem('user', JSON.stringify(data.user));
            } else {
              console.log('Failed to get current user, clearing session');
              await AsyncStorage.removeItem('session');
              await AsyncStorage.removeItem('user');
            }
          } catch (fetchError) {
            console.error('Error fetching current user:', fetchError);
            // Clear invalid session
            await AsyncStorage.removeItem('session');
            await AsyncStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Failed to load user from storage:', error);
      }
    };

    loadUserFromStorage();
  }, []);

  const login = async (userData: User, token: string) => {
    console.log('=== AUTH PROVIDER: Login called ===');
    console.log('User data:', userData);
    console.log('Token:', token);
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('session', token); 
      await AsyncStorage.setItem('token', token); 
      console.log('User data and token stored successfully');
      setUser(userData);
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  };

  const logout = async () => {
    console.log('=== AUTH PROVIDER: Logout called ===');
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('session');
      await AsyncStorage.removeItem('token');
      setUser(null);
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;