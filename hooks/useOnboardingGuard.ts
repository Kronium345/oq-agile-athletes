import { usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { getResumeOnboardingRoute } from '../lib/onboarding/navigation';
import { getOnboardingProfile, isOnboardingComplete } from '../lib/onboarding/storage';

const HOME_ROUTE = '/(drawer)/(tabs)/home';

/**
 * Redirects finished users to home and resumes incomplete onboarding elsewhere.
 * Never blocks render — avoids a spinner flash on onboarding screens after sign-up.
 */
export function useOnboardingGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const complete = await isOnboardingComplete();
        if (cancelled) return;

        if (complete) {
          if (pathname !== HOME_ROUTE) {
            router.replace(HOME_ROUTE as any);
          }
          return;
        }

        if (pathname.startsWith('/onboarding')) {
          return;
        }

        const profile = await getOnboardingProfile();
        const resume = getResumeOnboardingRoute(profile);
        if (resume && resume !== pathname) {
          router.replace(resume as any);
        }
      } catch {
        // Non-blocking — user can continue onboarding manually.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);
}
