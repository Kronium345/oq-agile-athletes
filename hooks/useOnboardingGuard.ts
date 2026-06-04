import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { getResumeOnboardingRoute } from '../lib/onboarding/navigation';
import { getOnboardingProfile, isOnboardingComplete } from '../lib/onboarding/storage';

const HOME_ROUTE = '/(drawer)/(tabs)/home';

/** Keeps users out of onboarding when already done; does not re-run full post-auth resolution. */
export function useOnboardingGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const complete = await isOnboardingComplete();
        if (complete) {
          if (!cancelled && pathname !== HOME_ROUTE) {
            router.replace(HOME_ROUTE as any);
          }
          return;
        }

        // Stay on the current onboarding step — no API redirect (prevents sign-up navigation loops).
        if (pathname.startsWith('/onboarding')) {
          return;
        }

        const profile = await getOnboardingProfile();
        const resume = getResumeOnboardingRoute(profile);
        if (!cancelled && resume && resume !== pathname) {
          router.replace(resume as any);
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return { checking };
}
