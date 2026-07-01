import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuthContext } from '../app/AuthProvider';
import { resolveAccountDeviceSteps } from '../lib/accountDeviceSteps';
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
import { checkAndNotifyDailyStepAchievements } from '../lib/stepAchievements';

const HEALTH_POLL_MS = 10_000;

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

  const liveTodayRef = useRef(0);
  const lastPersistedRef = useRef(0);
  const healthAuthorizedRef = useRef(false);

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

  const syncFromHealth = useCallback(async (): Promise<boolean> => {
    const healthSteps = await readTodayStepCount();
    if (healthSteps == null) return false;

    healthAuthorizedRef.current = true;
    setStepSource('health');
    setPermissionDenied(false);

    const accountSteps = await resolveAccountDeviceSteps(user, healthSteps);
    const merged = Math.max(liveTodayRef.current, accountSteps);
    liveTodayRef.current = merged;
    setStepCount(merged);

    if (merged > lastPersistedRef.current) {
      await persistIfNeeded(merged);
    }
    return true;
  }, [persistIfNeeded, user]);

  const initHealth = useCallback(
    async (requestIfNeeded: boolean): Promise<boolean> => {
      let status = await getHealthStepsStatus();
      setHealthStatus(status);

      if (status === 'unavailable') return false;

      if (status === 'not_determined' && requestIfNeeded) {
        status = await requestHealthStepsPermission();
        setHealthStatus(status);
      }

      if (status === 'authorized') {
        healthAuthorizedRef.current = true;
        setPermissionDenied(false);
        await syncFromHealth();
        return true;
      }

      const recheck = await getHealthStepsStatus();
      if (recheck === 'authorized') {
        setHealthStatus('authorized');
        healthAuthorizedRef.current = true;
        setPermissionDenied(false);
        await syncFromHealth();
        return true;
      }

      return false;
    },
    [syncFromHealth],
  );

  useEffect(() => {
    let cancelled = false;

    setStepCount(0);
    setTotalSteps(0);
    setStepsReady(false);
    liveTodayRef.current = 0;
    lastPersistedRef.current = 0;

    const hydrate = async () => {
      const [steps, goal] = await Promise.all([
        loadTodaySteps(user),
        loadDailyGoal(user),
      ]);

      if (cancelled) return;

      liveTodayRef.current = steps.today;
      lastPersistedRef.current = steps.today;
      setStepCount(steps.today);
      setTotalSteps(steps.total);
      setDailyGoal(goal);
      setStepsReady(true);
      void checkAndNotifyDailyStepAchievements(user, steps.today);
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (!stepsReady) return;

      void loadTodaySteps(user).then((steps) => {
        const mergedToday = Math.max(steps.today, liveTodayRef.current);
        liveTodayRef.current = mergedToday;
        lastPersistedRef.current = Math.max(
          steps.today,
          lastPersistedRef.current,
        );
        setStepCount(mergedToday);
        setTotalSteps(steps.total);
      });
    }, [stepsReady, user]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!stepsReady || !enabled) return;

      let cancelled = false;
      let pollTimer: ReturnType<typeof setInterval> | null = null;

      const start = async () => {
        const healthOk = await initHealth(true);
        if (cancelled || !healthOk) {
          if (!healthOk && !healthAuthorizedRef.current) {
            setPermissionDenied(true);
          }
          return;
        }

        setStepSource('health');
        pollTimer = setInterval(() => {
          if (AppState.currentState !== 'active') return;
          void syncFromHealth();
        }, HEALTH_POLL_MS);
      };

      void start();

      return () => {
        cancelled = true;
        if (pollTimer) clearInterval(pollTimer);
      };
    }, [stepsReady, enabled, initHealth, syncFromHealth]),
  );

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

    setPermissionDenied(true);
  }, [syncFromHealth]);

  return {
    dailyGoal,
    setDailyGoal,
    stepCount,
    totalSteps,
    stepsReady,
    permissionDenied,
    healthStatus,
    stepSource,
    requestPermissions,
  };
}
