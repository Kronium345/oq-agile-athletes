import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useAuthContext } from '../app/AuthProvider';
import { resolvePostAuthRoute } from '../lib/onboarding/navigation';
import {
  ensureOnboardingFromUser,
  fetchUserProfileFromApi,
  getOnboardingProfile,
  getUserId,
  isOnboardingComplete,
  normalizeUserForOnboarding,
} from '../lib/onboarding/storage';

/** Navigate after sign-in or app bootstrap when user session exists. */
export function usePostAuthRedirect() {
  const router = useRouter();
  const { user, updateUser } = useAuthContext();

  const redirectAuthenticatedUser = useCallback(async () => {
    let complete = await isOnboardingComplete();

    let userRecord = user ? ({ ...user } as Record<string, unknown>) : null;
    const userId = getUserId(userRecord);

    if (!complete && userId) {
      const serverUser = await fetchUserProfileFromApi(userId);
      if (serverUser) {
        userRecord = normalizeUserForOnboarding({
          ...userRecord,
          ...serverUser,
        });
        updateUser(userRecord);
      }
    }

    if (!complete && userRecord) {
      complete = await ensureOnboardingFromUser(
        normalizeUserForOnboarding(userRecord),
      );
    }

    const profile = await getOnboardingProfile();
    const route = await resolvePostAuthRoute(complete, profile);
    router.replace(route as any);
  }, [router, user, updateUser]);

  return { redirectAuthenticatedUser };
}
