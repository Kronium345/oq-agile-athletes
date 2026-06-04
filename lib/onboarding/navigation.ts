import type { OnboardingProfile } from './types';

export type OnboardingRoute =
  | '/onboarding/gender'
  | '/onboarding/experience'
  | '/onboarding/avatar'
  | '/onboarding/weight';

export function getResumeOnboardingRoute(
  profile: OnboardingProfile,
): OnboardingRoute | null {
  if (!profile.gender) return '/onboarding/gender';
  if (!profile.experience) return '/onboarding/experience';
  if (!profile.avatar) return '/onboarding/avatar';
  if (profile.weight == null || Number.isNaN(profile.weight)) {
    return '/onboarding/weight';
  }
  return null;
}

export async function resolvePostAuthRoute(
  isComplete: boolean,
  profile: OnboardingProfile,
): Promise<string> {
  if (isComplete) {
    return '/(drawer)/(tabs)/home';
  }
  const resume = getResumeOnboardingRoute(profile);
  return resume ?? '/(drawer)/(tabs)/home';
}
