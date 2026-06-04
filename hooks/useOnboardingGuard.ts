import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { resolveAuthenticatedDestination } from '../lib/onboarding/redirect';
import { isOnboardingComplete } from '../lib/onboarding/storage';

/** If the user already finished onboarding (local or server), leave the flow. */
export function useOnboardingGuard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const alreadyLocal = await isOnboardingComplete();
        if (alreadyLocal) {
          if (!cancelled) router.replace('/(drawer)/(tabs)/home' as any);
          return;
        }
        const route = await resolveAuthenticatedDestination();
        if (!cancelled && route !== '/onboarding/gender') {
          router.replace(route as any);
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return { checking };
}
