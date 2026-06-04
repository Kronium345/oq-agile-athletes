import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OnboardingProfile } from './types';

const PROFILE_KEY = 'onboardingProfile';
const COMPLETE_KEY = 'onboardingComplete';
const LAST_PAGE_KEY = 'lastPage';

export async function getOnboardingProfile(): Promise<OnboardingProfile> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveOnboardingProfile(
  patch: Partial<OnboardingProfile>,
): Promise<OnboardingProfile> {
  const current = await getOnboardingProfile();
  const next = { ...current, ...patch };
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  return next;
}

export async function clearOnboardingProfile(): Promise<void> {
  await AsyncStorage.multiRemove([PROFILE_KEY, COMPLETE_KEY]);
}

export async function isOnboardingComplete(): Promise<boolean> {
  const flag = await AsyncStorage.getItem(COMPLETE_KEY);
  return flag === 'true';
}

export async function markOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(COMPLETE_KEY, 'true');
  await AsyncStorage.setItem(
    LAST_PAGE_KEY,
    '/(drawer)/(tabs)/home',
  );
}

export async function mergeOnboardingIntoUser(
  user: Record<string, unknown>,
  profile: OnboardingProfile,
): Promise<Record<string, unknown>> {
  return {
    ...user,
    gender: profile.gender ?? user.gender,
    experience: profile.experience ?? user.experience,
    avatar: profile.avatar ?? user.avatar,
    weight: profile.weight ?? user.weight,
    unit: profile.unit ?? user.unit ?? 'kg',
  };
}

/** Skip onboarding when the stored user already has setup fields (e.g. from API). */
export async function ensureOnboardingFromUser(
  user: Record<string, unknown> | null | undefined,
): Promise<boolean> {
  if (!user) return false;
  const hasCore =
    user.gender &&
    user.experience &&
    user.weight != null &&
    !Number.isNaN(Number(user.weight));

  if (!hasCore) return false;

  const profile: OnboardingProfile = {
    gender: user.gender as OnboardingProfile['gender'],
    experience: String(user.experience),
    avatar: user.avatar ? String(user.avatar) : undefined,
    weight: Number(user.weight),
    unit: (user.unit as OnboardingProfile['unit']) || 'kg',
  };

  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  await markOnboardingComplete();
  return true;
}
