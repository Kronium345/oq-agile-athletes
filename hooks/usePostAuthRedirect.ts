import { useFocusEffect, usePathname, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useAuthContext } from '../app/AuthProvider';
import { parseSafeReturnPath } from '../lib/linking/safeReturnPath';
import { resolveAuthenticatedDestination } from '../lib/onboarding/redirect';

type SessionUser = Record<string, unknown>;
type AppRouter = ReturnType<typeof useRouter>;

const redirectInFlight = { current: false };
let lastReplacedRoute: string | null = null;
let lastReplacedAt = 0;
const REPLACE_DEDUPE_MS = 2000;

const NEW_USER_ONBOARDING_ROUTE = '/onboarding/gender';

function replaceOnce(router: AppRouter, route: string) {
  const now = Date.now();
  if (
    lastReplacedRoute === route &&
    now - lastReplacedAt < REPLACE_DEDUPE_MS
  ) {
    return;
  }
  lastReplacedRoute = route;
  lastReplacedAt = now;
  router.replace(route as any);
}

/** After email/social sign-up — single navigation, deduped against bootstrap redirects. */
export function navigateToNewUserOnboarding(router: AppRouter) {
  if (redirectInFlight.current) return;
  redirectInFlight.current = true;
  try {
    replaceOnce(router, NEW_USER_ONBOARDING_ROUTE);
  } finally {
    redirectInFlight.current = false;
  }
}

/** Navigate after sign-in or app bootstrap when user session exists. */
export function usePostAuthRedirect(returnTo?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuthContext();
  const safeReturnTo = parseSafeReturnPath(returnTo);

  const redirectAuthenticatedUser = useCallback(
    async (sessionUser?: SessionUser | null) => {
      if (redirectInFlight.current) return;
      redirectInFlight.current = true;

      try {
        const route =
          safeReturnTo ?? (await resolveAuthenticatedDestination(sessionUser));
        if (route === '/') {
          await logout();
        }
        if (pathname !== route) {
          replaceOnce(router, route);
        }
      } finally {
        redirectInFlight.current = false;
      }
    },
    [router, logout, safeReturnTo, pathname],
  );

  return { redirectAuthenticatedUser };
}

/**
 * If the user already has a session, leave auth entry screens (index / sign-in).
 * Uses focus so signing up on /sign-up does not also trigger index underneath.
 */
export function useBootstrapAuthRedirect(returnTo?: string) {
  const { user, isLoading } = useAuthContext();
  const { redirectAuthenticatedUser } = usePostAuthRedirect(returnTo);

  useFocusEffect(
    useCallback(() => {
      if (isLoading || !user) return;
      void redirectAuthenticatedUser(user as Record<string, unknown>);
    }, [isLoading, user, redirectAuthenticatedUser]),
  );
}
