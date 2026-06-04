import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { useAuthContext } from '../app/AuthProvider';
import { resolveAuthenticatedDestination } from '../lib/onboarding/redirect';

type SessionUser = Record<string, unknown>;

const redirectInFlight = { current: false };

/** Navigate after sign-in or app bootstrap when user session exists. */
export function usePostAuthRedirect() {
  const router = useRouter();
  const { logout } = useAuthContext();

  const redirectAuthenticatedUser = useCallback(
    async (sessionUser?: SessionUser | null) => {
      if (redirectInFlight.current) return;
      redirectInFlight.current = true;

      try {
        const route = await resolveAuthenticatedDestination(sessionUser);
        if (route === '/') {
          await logout();
        }
        router.replace(route as any);
      } finally {
        redirectInFlight.current = false;
      }
    },
    [router, logout],
  );

  return { redirectAuthenticatedUser };
}

/** Run post-auth redirect at most once until the user logs out. */
export function useBootstrapAuthRedirect() {
  const { user, isLoading } = useAuthContext();
  const { redirectAuthenticatedUser } = usePostAuthRedirect();
  const didRedirect = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      didRedirect.current = false;
      return;
    }
    if (didRedirect.current) return;
    didRedirect.current = true;
    redirectAuthenticatedUser(user as Record<string, unknown>);
  }, [isLoading, user, redirectAuthenticatedUser]);
}
