import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useAuthContext } from '../app/AuthProvider';
import { resolveAuthenticatedDestination } from '../lib/onboarding/redirect';

type SessionUser = Record<string, unknown>;

/** Navigate after sign-in or app bootstrap when user session exists. */
export function usePostAuthRedirect() {
  const router = useRouter();
  const { updateUser } = useAuthContext();

  const redirectAuthenticatedUser = useCallback(
    async (sessionUser?: SessionUser | null) => {
      const route = await resolveAuthenticatedDestination(sessionUser);
      try {
        const stored = await AsyncStorage.getItem('user');
        if (stored) {
          updateUser(JSON.parse(stored));
        } else if (sessionUser) {
          updateUser(sessionUser);
        }
      } catch {
        if (sessionUser) updateUser(sessionUser);
      }
      router.replace(route as any);
    },
    [router, updateUser],
  );

  return { redirectAuthenticatedUser };
}
