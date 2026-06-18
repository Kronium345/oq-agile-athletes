import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useAuthContext } from '../app/AuthProvider';
import {
  loadDailyGoal,
  loadTodaySteps,
  subscribeTodaySteps,
} from '../lib/dailySteps';
import { syncHealthStepsToStorage } from '../lib/syncHealthSteps';

const REFRESH_MS = 15_000;

export function useDailySteps() {
  const { user } = useAuthContext();
  const [todaySteps, setTodaySteps] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(10000);
  const refreshingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      let syncSteps: number | null = null;
      if (Platform.OS !== 'web') {
        const syncResult = await syncHealthStepsToStorage(user);
        syncSteps = syncResult.steps;
      }
      const [steps, goal] = await Promise.all([
        loadTodaySteps(user),
        loadDailyGoal(),
      ]);
      setTodaySteps(syncSteps ?? steps.today);
      setDailyGoal(goal);
    } finally {
      refreshingRef.current = false;
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    return subscribeTodaySteps((steps) => {
      setTodaySteps(steps);
    });
  }, []);

  useEffect(() => {
    return subscribeTodaySteps((steps) => {
      setTodaySteps(steps);
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
