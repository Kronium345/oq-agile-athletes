import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { useAuthContext } from '../app/AuthProvider';
import { syncHealthStepsToStorage } from '../lib/syncHealthSteps';

const BACKGROUND_SYNC_MS = 15_000;

/** Sync Health Connect / HealthKit steps app-wide (not only on the Steps tab). */
export function useHealthStepsBackgroundSync() {
  const { user } = useAuthContext();
  const syncingRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const sync = async () => {
      if (syncingRef.current || AppState.currentState !== 'active') return;
      syncingRef.current = true;
      try {
        await syncHealthStepsToStorage(user);
      } finally {
        syncingRef.current = false;
      }
    };

    void sync();

    const interval = setInterval(() => {
      void sync();
    }, BACKGROUND_SYNC_MS);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void sync();
      }
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [user]);
}
