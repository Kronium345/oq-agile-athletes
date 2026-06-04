import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api/axios';
import { getCurrentUsers } from '../../components/lib/actions/auth.action';
import type { OnboardingProfile } from './types';

export function getUserId(user: Record<string, unknown> | null | undefined): string | null {
  if (!user) return null;
  const id = user._id ?? user.userId ?? user.id;
  return id != null ? String(id) : null;
}

/** Map API user shape to fields used for onboarding resume/skip. */
export function normalizeUserForOnboarding(
  user: Record<string, unknown>,
): Record<string, unknown> {
  const weight =
    user.weight ?? user.weightKg ?? user.bodyWeight ?? user.weight_kg;
  return {
    ...user,
    gender: user.gender ?? user.sex,
    experience: user.experience ?? user.experienceLevel ?? user.level,
    weight,
  };
}

function unwrapUserPayload(
  response: unknown,
): Record<string, unknown> | null {
  if (!response || typeof response !== 'object') return null;
  const obj = response as Record<string, unknown>;
  const nested = obj.data;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  return obj;
}

function hasOnboardingFields(user: Record<string, unknown>): boolean {
  const normalized = normalizeUserForOnboarding(user);
  return Boolean(
    normalized.gender &&
      normalized.experience &&
      normalized.weight != null &&
      !Number.isNaN(Number(normalized.weight)),
  );
}

export async function fetchUserProfileFromApi(
  userId: string,
): Promise<Record<string, unknown> | null> {
  let fromUserEndpoint: Record<string, unknown> | null = null;
  try {
    const response = await api.get(`/user/${userId}`);
    fromUserEndpoint = unwrapUserPayload(response);
  } catch {
    // fall through to current-user
  }

  let fromCurrentUser: Record<string, unknown> | null = null;
  try {
    const current = await getCurrentUsers();
    if (current && typeof current === 'object') {
      fromCurrentUser = normalizeUserForOnboarding(
        current as unknown as Record<string, unknown>,
      );
    }
  } catch {
    // ignore
  }

  const merged = normalizeUserForOnboarding({
    ...(fromUserEndpoint ?? {}),
    ...(fromCurrentUser ?? {}),
  });

  if (hasOnboardingFields(merged)) return merged;
  return fromUserEndpoint ?? fromCurrentUser;
}

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

/** Skip onboarding only when the server user matches the full local onboarding flow. */
export async function ensureOnboardingFromUser(
  user: Record<string, unknown> | null | undefined,
): Promise<boolean> {
  if (!user) return false;
  const normalized = normalizeUserForOnboarding(user);
  const hasCore =
    normalized.gender &&
    normalized.experience &&
    normalized.avatar &&
    normalized.weight != null &&
    !Number.isNaN(Number(normalized.weight));

  if (!hasCore) return false;

  const profile: OnboardingProfile = {
    gender: normalized.gender as OnboardingProfile['gender'],
    experience: String(normalized.experience),
    avatar: normalized.avatar ? String(normalized.avatar) : undefined,
    weight: Number(normalized.weight),
    unit: (normalized.unit as OnboardingProfile['unit']) || 'kg',
  };

  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  await markOnboardingComplete();
  return true;
}
