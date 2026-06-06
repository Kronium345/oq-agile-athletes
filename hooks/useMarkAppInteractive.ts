import * as SplashScreen from 'expo-splash-screen';
import { useObserve } from 'expo-observe';
import { useEffect } from 'react';

/** Hide splash and record TTI. Safe to call from multiple entry screens; first call wins. */
export function useMarkAppInteractive(enabled = true) {
  const { markInteractive } = useObserve();

  useEffect(() => {
    if (!enabled) return;

    void (async () => {
      try {
        await SplashScreen.hideAsync();
      } catch {
        // Splash may already be hidden.
      }
      markInteractive();
    })();
  }, [enabled, markInteractive]);
}
