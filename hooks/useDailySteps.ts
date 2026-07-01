import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useAuthContext } from '../app/AuthProvider';
import {
  loadDailyGoal,
  loadTodaySteps,
  loadTodayStepsFromLocal,
  subscribeTodaySteps,
} from '../lib/dailySteps';
import { checkAndNotifyDailyStepAchievements } from '../lib/stepAchievements';
import { getUserStorageId } from '../lib/stepStorageKeys';
import { syncHealthStepsToStorage } from '../lib/syncHealthSteps';

const REFRESH_MS = 15_000;

export function useDailySteps() {
  const { user } = useAuthContext();
  const userId = getUserStorageId(user);
  const [todaySteps, setTodaySteps] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(10000);
  const refreshingRef = useRef(false);
  const userRef = useRef(user);
  const userIdRef = useRef(userId);

  useEffect(() => {
    userRef.current = user;
    userIdRef.current = userId;
  }, [user, userId]);

  /** Only reset when the signed-in account changes — not on profile field updates. */
  useEffect(() => {
    if (!userId) {
      setTodaySteps(0);
      setDailyGoal(10000);
      return;
    }

    let cancelled = false;
    void (async () => {
      const [localSteps, goal] = await Promise.all([
        loadTodayStepsFromLocal(user),
        loadDailyGoal(user),
      ]);
      if (!cancelled && userIdRef.current === userId) {
        setTodaySteps(localSteps);
        setDailyGoal(goal);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, user]);

  const refresh = useCallback(async () => {
    if (refreshingRef.current) return;

    const activeUser = userRef.current;
    const activeUserId = userIdRef.current;
    if (!activeUserId || !activeUser) return;

    refreshingRef.current = true;
    try {
      let syncSteps: number | null = null;
      if (Platform.OS !== 'web') {
        const syncResult = await syncHealthStepsToStorage(activeUser);
        syncSteps = syncResult.steps;
      }
      const [steps, goal] = await Promise.all([
        loadTodaySteps(activeUser),
        loadDailyGoal(activeUser),
      ]);
      if (userIdRef.current !== activeUserId) return;

      const nextToday =
        syncSteps != null ? Math.max(syncSteps, steps.today) : steps.today;
      setTodaySteps(nextToday);
      setDailyGoal(goal);
      void checkAndNotifyDailyStepAchievements(activeUser, nextToday);
    } finally {
      refreshingRef.current = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    return subscribeTodaySteps((steps) => {
      if (userIdRef.current) {
        setTodaySteps(steps);
      }
    });
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        void refresh();
      }
    }, REFRESH_MS);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refresh();
      }
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [refresh]);

  return { todaySteps, dailyGoal, refresh };
}
