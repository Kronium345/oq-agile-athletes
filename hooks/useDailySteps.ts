import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { loadDailyGoal, loadTodaySteps } from '../lib/dailySteps';
import { useAuthContext } from '../app/AuthProvider';

export function useDailySteps() {
  const { user } = useAuthContext();
  const [todaySteps, setTodaySteps] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(10000);

  const refresh = useCallback(async () => {
    const [steps, goal] = await Promise.all([
      loadTodaySteps(user),
      loadDailyGoal(),
    ]);
    setTodaySteps(steps.today);
    setDailyGoal(goal);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refresh();
      }
    });
    return () => sub.remove();
  }, [refresh]);

  return { todaySteps, dailyGoal, refresh };
}
