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

const HEALTH_POLL_MS = 60_000;

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

  const persistedTodayRef = useRef(0);
  const watchBaselineRef = useRef<number | null>(null);
  const healthAuthorizedRef = useRef(false);
  const healthPermissionRequestedRef = useRef(false);

  const saveSteps = useCallback(
    async (newSteps: number, source?: StepDataSource) => {
      const merged = Math.max(persistedTodayRef.current, Math.round(newSteps));

      try {
        const { totalSteps: nextTotal } = await persistTodaySteps(user, merged);
        persistedTodayRef.current = merged;
        setStepCount(merged);
        setTotalSteps(nextTotal);
        if (source) setStepSource(source);
      } catch (error) {
        console.error('Error saving steps:', error);
      }
    },
    [user],
  );

  const syncFromHealth = useCallback(async (): Promise<boolean> => {
    const healthSteps = await readTodayStepCount();
    if (healthSteps == null) return false;

    const merged = Math.max(persistedTodayRef.current, healthSteps);
    if (merged > persistedTodayRef.current) {
      await saveSteps(merged, 'health');
    } else if (healthAuthorizedRef.current) {
      setStepSource('health');
    }
    return true;
  }, [saveSteps]);

  const initHealth = useCallback(async (): Promise<boolean> => {
    let status = await getHealthStepsStatus();
    setHealthStatus(status);

    if (status === 'unavailable') return false;

    if (status === 'not_determined' && !healthPermissionRequestedRef.current) {
      healthPermissionRequestedRef.current = true;
      status = await requestHealthStepsPermission();
      setHealthStatus(status);
    }

    if (status === 'authorized') {
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
          if (result && result.steps > persistedTodayRef.current) {
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

      persistedTodayRef.current = steps.today;
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

  // Refresh cache when tab focused
  useFocusEffect(
    useCallback(() => {
      if (!stepsReady) return;
      void loadTodaySteps(user).then((steps) => {
        persistedTodayRef.current = Math.max(
          persistedTodayRef.current,
          steps.today,
        );
        watchBaselineRef.current = null;
        setStepCount(persistedTodayRef.current);
        setTotalSteps(steps.total);
      });
    }, [stepsReady, user]),
  );

  // Health + pedometer while tab focused
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
            const todayTotal = persistedTodayRef.current + delta;
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
      };
    }, [stepsReady, enabled, initHealth, initPedometer, syncFromHealth, saveSteps]),
  );

  // Refresh health when app returns to foreground
  useEffect(() => {
    if (!stepsReady || !enabled) return;

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && healthAuthorizedRef.current) {
        void syncFromHealth();
      }
    });

    return () => sub.remove();
  }, [stepsReady, enabled, syncFromHealth]);

  const requestPermissions = useCallback(async () => {
    healthPermissionRequestedRef.current = true;
    const next = await requestHealthStepsPermission();
    setHealthStatus(next);
    if (next === 'authorized') {
      healthAuthorizedRef.current = true;
      setPermissionDenied(false);
      await syncFromHealth();
      return;
    }

    const pedometerOk = await initPedometer();
    if (!pedometerOk && next !== 'authorized') {
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
