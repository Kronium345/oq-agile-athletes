import { useFocusEffect } from 'expo-router';
import { Pedometer } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useAuthContext } from '../app/AuthProvider';
import {
  loadDailyGoal,
  loadTodaySteps,
  persistTodaySteps,
} from '../lib/dailySteps';
import {
  getHealthStepsStatus,
  readTodayStepCount,
  requestHealthStepsPermission,
} from '../lib/healthSteps';
import type { HealthStepsStatus, StepDataSource } from '../lib/healthStepsTypes';

const HEALTH_POLL_MS = 10_000;
const PEDOMETER_PERSIST_MS = 3_000;

type UseStepCounterOptions = {
  enabled: boolean;
};

export function useStepCounter(options: UseStepCounterOptions) {
  const { enabled } = options;
  const { user } = useAuthContext();

  const [dailyGoal, setDailyGoal] = useState(10000);
  const [stepCount, setStepCount] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [stepsReady, setStepsReady] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStepsStatus>('unavailable');
  const [stepSource, setStepSource] = useState<StepDataSource>('cached');
  const [isPedometerAvailable, setPedometerAvailable] = useState(false);

  /** Live in-session count (includes unsaved pedometer deltas). */
  const liveTodayRef = useRef(0);
  /** Last value written to AsyncStorage / API. */
  const lastPersistedRef = useRef(0);
  const watchBaselineRef = useRef<number | null>(null);
  const healthAuthorizedRef = useRef(false);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistIfNeeded = useCallback(
    async (steps: number): Promise<void> => {
      const merged = Math.max(lastPersistedRef.current, Math.round(steps));
      if (merged <= lastPersistedRef.current) return;

      try {
        const { totalSteps: nextTotal } = await persistTodaySteps(user, merged);
        lastPersistedRef.current = merged;
        liveTodayRef.current = Math.max(liveTodayRef.current, merged);
        setTotalSteps(nextTotal);
      } catch (error) {
        console.error('Error saving steps:', error);
      }
    },
    [user],
  );

  const flushScheduledPersist = useCallback(async () => {
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }
    await persistIfNeeded(liveTodayRef.current);
  }, [persistIfNeeded]);

  const schedulePersist = useCallback(() => {
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = setTimeout(() => {
      persistTimerRef.current = null;
      void persistIfNeeded(liveTodayRef.current);
    }, PEDOMETER_PERSIST_MS);
  }, [persistIfNeeded]);

  const saveSteps = useCallback(
    async (newSteps: number, source?: StepDataSource) => {
      if (source === 'pedometer' && healthAuthorizedRef.current) {
        return;
      }

      const merged = Math.max(liveTodayRef.current, Math.round(newSteps));
      liveTodayRef.current = merged;
      setStepCount(merged);
      if (source) setStepSource(source);

      if (source === 'pedometer') {
        schedulePersist();
        return;
      }

      await persistIfNeeded(merged);
    },
    [persistIfNeeded, schedulePersist],
  );

  const persistHealthSteps = useCallback(
    async (steps: number): Promise<void> => {
      const rounded = Math.max(0, Math.round(steps));
      if (rounded === lastPersistedRef.current) return;

      try {
        const { totalSteps: nextTotal } = await persistTodaySteps(user, rounded);
        lastPersistedRef.current = rounded;
        liveTodayRef.current = rounded;
        setTotalSteps(nextTotal);
      } catch (error) {
        console.error('Error saving steps:', error);
      }
    },
    [user],
  );

  const syncFromHealth = useCallback(async (): Promise<boolean> => {
    const healthSteps = await readTodayStepCount();
    if (healthSteps == null) return false;

    healthAuthorizedRef.current = true;
    setStepSource('health');
    setPermissionDenied(false);

    const merged = Math.max(liveTodayRef.current, healthSteps);
    liveTodayRef.current = merged;
    setStepCount(merged);
    if (healthSteps > 0 || merged > lastPersistedRef.current) {
      await persistHealthSteps(merged);
    }
    return true;
  }, [persistHealthSteps]);

  const initHealth = useCallback(async (): Promise<boolean> => {
    let status = await getHealthStepsStatus();
    setHealthStatus(status);

    if (status === 'unavailable') return false;

    if (status === 'not_determined') {
      status = await requestHealthStepsPermission();
      setHealthStatus(status);
    }

    if (status === 'authorized') {
      healthAuthorizedRef.current = true;
      setPermissionDenied(false);
      await syncFromHealth();
      return true;
    }

    // User may have granted access in Health Connect settings after denying in-app.
    const recheck = await getHealthStepsStatus();
    if (recheck === 'authorized') {
      setHealthStatus('authorized');
      healthAuthorizedRef.current = true;
      setPermissionDenied(false);
      await syncFromHealth();
      return true;
    }

    return false;
  }, [syncFromHealth]);

  const initPedometer = useCallback(async (): Promise<boolean> => {
    try {
      const isAvailable = await Pedometer.isAvailableAsync();
      setPedometerAvailable(isAvailable);
      if (!isAvailable) return false;

      const existing = await Pedometer.getPermissionsAsync();
      let granted = existing.granted;
      if (existing.status === 'undetermined') {
        const requested = await Pedometer.requestPermissionsAsync();
        granted = requested.granted;
      }

      if (!granted) {
        if (!healthAuthorizedRef.current) {
          setPermissionDenied(true);
        }
        return false;
      }

      if (!healthAuthorizedRef.current) {
        setPermissionDenied(false);
      }

      if (Platform.OS === 'ios') {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        try {
          const result = await Pedometer.getStepCountAsync(start, new Date());
          if (result && result.steps > liveTodayRef.current) {
            await saveSteps(result.steps, 'pedometer');
          }
        } catch {
          // iOS historical query may fail without motion permission
        }
      }

      return true;
    } catch (error) {
      console.error('Error initializing pedometer:', error);
      return false;
    }
  }, [saveSteps]);

  // Hydrate from cache/API on mount
  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      setStepsReady(false);
      watchBaselineRef.current = null;

      const [steps, goal] = await Promise.all([
        loadTodaySteps(user),
        loadDailyGoal(),
      ]);

      if (cancelled) return;

      liveTodayRef.current = steps.today;
      lastPersistedRef.current = steps.today;
      setStepCount(steps.today);
      setTotalSteps(steps.total);
      setDailyGoal(goal);
      setStepsReady(true);
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Merge stored steps when the Steps screen gains focus (never drop live count).
  useFocusEffect(
    useCallback(() => {
      if (!stepsReady) return;

      void loadTodaySteps(user).then((steps) => {
        const merged = Math.max(liveTodayRef.current, steps.today);
        liveTodayRef.current = merged;
        lastPersistedRef.current = Math.max(lastPersistedRef.current, steps.today);
        watchBaselineRef.current = null;
        setStepCount(merged);
        setTotalSteps(steps.total);
      });

      return () => {
        void flushScheduledPersist();
      };
    }, [stepsReady, user, flushScheduledPersist]),
  );

  // Health + pedometer while the Steps tab is active
  useFocusEffect(
    useCallback(() => {
      if (!stepsReady || !enabled) return;

      let cancelled = false;
      let pedometerSub: { remove: () => void } | null = null;
      let pollTimer: ReturnType<typeof setInterval> | null = null;

      const start = async () => {
        const healthOk = await initHealth();
        if (cancelled) return;

        if (healthOk) {
          pollTimer = setInterval(() => {
            void syncFromHealth();
          }, HEALTH_POLL_MS);
        }

        const pedometerOk = await initPedometer();
        if (cancelled) return;

        if (pedometerOk && !healthOk) {
          pedometerSub = Pedometer.watchStepCount((result: { steps: number }) => {
            const watchSteps = result.steps ?? 0;
            if (watchBaselineRef.current === null) {
              watchBaselineRef.current = watchSteps;
            }
            const delta = Math.max(0, watchSteps - watchBaselineRef.current);
            const todayTotal = liveTodayRef.current + delta;
            void saveSteps(todayTotal, 'pedometer');
          });
        }
      };

      void start();

      return () => {
        cancelled = true;
        pedometerSub?.remove();
        pedometerSub = null;
        if (pollTimer) clearInterval(pollTimer);
        watchBaselineRef.current = null;
        void flushScheduledPersist();
      };
    }, [
      stepsReady,
      enabled,
      initHealth,
      initPedometer,
      syncFromHealth,
      saveSteps,
      flushScheduledPersist,
    ]),
  );

  // Refresh health when app returns to foreground (any tab)
  useEffect(() => {
    if (!stepsReady) return;

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && healthAuthorizedRef.current) {
        void syncFromHealth();
      }
    });

    return () => sub.remove();
  }, [stepsReady, syncFromHealth]);

  const requestPermissions = useCallback(async () => {
    const next = await requestHealthStepsPermission();
    setHealthStatus(next);

    if (next === 'authorized') {
      healthAuthorizedRef.current = true;
      setPermissionDenied(false);
      await syncFromHealth();
      return;
    }

    const recheck = await getHealthStepsStatus();
    if (recheck === 'authorized') {
      setHealthStatus('authorized');
      healthAuthorizedRef.current = true;
      setPermissionDenied(false);
      await syncFromHealth();
      return;
    }

    const pedometerOk = await initPedometer();
    if (!pedometerOk && recheck !== 'authorized') {
      setPermissionDenied(true);
    }
  }, [syncFromHealth, initPedometer]);

  return {
    dailyGoal,
    setDailyGoal,
    stepCount,
    totalSteps,
    stepsReady,
    permissionDenied,
    healthStatus,
    stepSource,
    isPedometerAvailable,
    requestPermissions,
    saveSteps,
  };
}
