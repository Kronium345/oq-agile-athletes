import { useAuth, useUser } from '@clerk/expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { clearClerkTokenGetter, registerClerkTokenGetter } from '../api/axios';

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
  const { isLoaded: isClerkLoaded, isSignedIn, getToken } = useAuth({
    treatPendingAsSignedOut: false,
  });
  const { user: clerkUser } = useUser();

  useEffect(() => {
    registerClerkTokenGetter(async () => {
      try {
        return await getToken();
      } catch {
        return null;
      }
    });

    return () => {
      clearClerkTokenGetter();
    };
  }, [getToken]);

  // Populate user object from Clerk identity.
  useEffect(() => {
    if (clerkUser) {
      const clerkDerivedUser: User = {
        userId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || undefined,
        name:
          `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
          clerkUser.username ||
          undefined,
      };
      setUser(clerkDerivedUser);
      // Keep AsyncStorage in sync for legacy profile reads.
      AsyncStorage.setItem('user', JSON.stringify(clerkDerivedUser)).catch(
        () => {},
      );
    } else if (isClerkLoaded && isSignedIn === false) {
      setUser(null);
      // Do not clear token/session here automatically; this effect can run during
      // transient auth state changes. Explicit logout handles full cleanup.
      AsyncStorage.removeItem('user').catch(() => {});
    }
  }, [clerkUser, isClerkLoaded, isSignedIn]);

  const login = async (userData: User, token: string) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('session', token);
      await AsyncStorage.setItem('token', token);
      setUser(userData);
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['user', 'session', 'token']);
      setUser(null);
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
