import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useAuthContext } from '../app/AuthProvider';
import { resolvePostAuthRoute } from '../lib/onboarding/navigation';
import {
  ensureOnboardingFromUser,
  getOnboardingProfile,
  isOnboardingComplete,
} from '../lib/onboarding/storage';

/** Navigate after sign-in or app bootstrap when user session exists. */
export function usePostAuthRedirect() {
  const router = useRouter();
  const { user } = useAuthContext();

  const redirectAuthenticatedUser = useCallback(async () => {
    let complete = await isOnboardingComplete();
    if (!complete && user) {
      complete = await ensureOnboardingFromUser(
        user as Record<string, unknown>,
      );
    }
    const profile = await getOnboardingProfile();
    const route = await resolvePostAuthRoute(complete, profile);
    router.replace(route as any);
  }, [router, user]);

  return { redirectAuthenticatedUser };
}
