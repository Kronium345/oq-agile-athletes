import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  clearStaleSession,
  getCurrentUsers,
} from '../components/lib/actions/auth.action';
import { clearOnboardingProfile } from '../lib/onboarding/storage';
import { recordAppActivity } from '../lib/appActivity';

interface User {
  _id?: string;
  userId?: string;
  email?: string;
  name?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  updateUser: (patch: Record<string, unknown>) => void;
  login: (userData: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const session = await AsyncStorage.getItem('session');
        if (!session) {
          const storedUser = await AsyncStorage.getItem('user');
          if (storedUser) {
            await clearStaleSession();
          }
          setUser(null);
          return;
        }

        const validated = await getCurrentUsers();
        if (!validated) {
          setUser(null);
          return;
        }

        await AsyncStorage.setItem('user', JSON.stringify(validated));
        setUser(validated);
        const userId = validated._id ?? validated.userId;
        if (userId) {
          void recordAppActivity(String(userId));
        }
      } catch (error) {
        console.error('Failed to load user from storage:', error);
        await clearStaleSession();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  const login = async (userData: User, token: string) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('session', token);
      await AsyncStorage.setItem('token', token);
      setUser(userData);
      const userId = userData._id ?? userData.userId;
      if (userId) {
        void recordAppActivity(String(userId));
      }
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  };

  const updateUser = useCallback((patch: Record<string, unknown>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      AsyncStorage.setItem('user', JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['user', 'session', 'token']);
      await clearOnboardingProfile();
      setUser(null);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, updateUser, login, logout, isLoading }}
    >
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
