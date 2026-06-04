import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearStaleSession,
  getCurrentUsers,
} from '../../components/lib/actions/auth.action';
import { resolvePostAuthRoute } from './navigation';
import {
  ensureOnboardingFromUser,
  fetchUserProfileFromApi,
  getOnboardingProfile,
  getUserId,
  isOnboardingComplete,
  normalizeUserForOnboarding,
} from './storage';

async function loadSessionUser(
  override?: Record<string, unknown> | null,
): Promise<Record<string, unknown> | null> {
  if (override && typeof override === 'object') {
    return override;
  }
  try {
    const stored = await AsyncStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Decide post-auth destination from server profile + local onboarding state.
 * Pass the user from sign-in/sign-up so this works before React context updates.
 */
export async function resolveAuthenticatedDestination(
  sessionUser?: Record<string, unknown> | null,
): Promise<string> {
  const session = await AsyncStorage.getItem('session');
  if (!session) {
    if (await loadSessionUser(sessionUser)) {
      await clearStaleSession();
    }
    return '/';
  }

  const validated = await getCurrentUsers();
  if (!validated) {
    return '/';
  }

  let complete = await isOnboardingComplete();

  let userRecord = normalizeUserForOnboarding(
    {
      ...(await loadSessionUser(sessionUser)),
      ...validated,
    } as Record<string, unknown>,
  );
  let userId = getUserId(userRecord);

  if (!complete && userId) {
    const serverUser = await fetchUserProfileFromApi(userId);
    if (serverUser) {
      userRecord = normalizeUserForOnboarding({
        ...(userRecord ?? {}),
        ...serverUser,
      });
      try {
        const stored = await AsyncStorage.getItem('user');
        const prev = stored ? JSON.parse(stored) : {};
        await AsyncStorage.setItem(
          'user',
          JSON.stringify({ ...prev, ...userRecord }),
        );
      } catch {
        // non-blocking
      }
    }
  }

  if (!complete && userRecord) {
    complete = await ensureOnboardingFromUser(
      normalizeUserForOnboarding(userRecord),
    );
  }

  const profile = await getOnboardingProfile();
  return resolvePostAuthRoute(complete, profile);
}
