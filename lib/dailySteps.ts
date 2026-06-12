import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';
import { formatStepHistoryDate } from './stepsWeekData';

type StepsApiPayload = {
  success?: boolean;
  stepCount?: number;
  totalSteps?: number;
  data?: {
    stepCount?: number;
    totalSteps?: number;
  };
};

/** Local calendar date key (YYYY-MM-DD), not UTC. */
export function getLocalTodayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function pickStepCount(
  response: StepsApiPayload | null | undefined,
): number | null {
  if (!response) return null;
  const count = response.data?.stepCount ?? response.stepCount;
  return typeof count === 'number' && !Number.isNaN(count) ? count : null;
}

export function pickTotalSteps(
  response: StepsApiPayload | null | undefined,
): number | null {
  if (!response) return null;
  const total =
    response.data?.totalSteps ??
    response.data?.stepCount ??
    response.totalSteps;
  return typeof total === 'number' && !Number.isNaN(total) ? total : null;
}

export async function loadTodayStepsFromLocal(
  today = getLocalTodayKey(),
): Promise<number> {
  const fromKey = await AsyncStorage.getItem(`steps_${today}`);
  if (fromKey != null) {
    const parsed = parseInt(fromKey, 10);
    if (!Number.isNaN(parsed)) return parsed;
  }

  const historyRaw = await AsyncStorage.getItem('stepHistory');
  if (!historyRaw) return 0;

  try {
    const history = JSON.parse(historyRaw);
    const todayLabel = formatStepHistoryDate(new Date());
    if (Array.isArray(history)) {
      const entry = history.find(
        (e: { date?: string }) => e.date === todayLabel,
      );
      if (entry && typeof entry.steps === 'number') return entry.steps;
    }
  } catch {
    // ignore
  }

  return 0;
}

export async function loadTodaySteps(
  user?: { _id?: string; userId?: string } | null,
): Promise<{ today: number; total: number }> {
  const today = getLocalTodayKey();
  const hasUser = Boolean(user?._id || user?.userId);

  if (hasUser) {
    try {
      const dateRes = (await api.get(
        `/api/steps/date/${today}`,
      )) as StepsApiPayload;
      const fromApi = pickStepCount(dateRes);
      if (fromApi !== null) {
        let totalSteps = 0;
        try {
          const totalRes = (await api.get('/api/steps/total')) as StepsApiPayload;
          const total = pickTotalSteps(totalRes);
          if (total !== null) totalSteps = total;
        } catch {
          // keep 0; local cache may still have total
        }
        await cacheTodaySteps(today, fromApi, totalSteps);
        return { today: fromApi, total: totalSteps };
      }
    } catch {
      // fall through to local
    }
  }

  const todaySteps = await loadTodayStepsFromLocal(today);
  let totalSteps = 0;
  try {
    const cached = await AsyncStorage.getItem('totalSteps');
    if (cached != null) {
      const parsed = parseInt(cached, 10);
      if (!Number.isNaN(parsed)) totalSteps = parsed;
    }
  } catch {
    // ignore
  }

  return { today: todaySteps, total: totalSteps };
}

export async function cacheTodaySteps(
  today: string,
  stepCount: number,
  totalSteps?: number,
): Promise<void> {
  await AsyncStorage.setItem(`steps_${today}`, String(stepCount));
  if (totalSteps != null) {
    await AsyncStorage.setItem('totalSteps', String(totalSteps));
  }

  const todayLabel = formatStepHistoryDate(new Date());
  const historyRaw = await AsyncStorage.getItem('stepHistory');
  let history: { date: string; steps: number }[] = [];
  if (historyRaw) {
    try {
      const parsed = JSON.parse(historyRaw);
      if (Array.isArray(parsed)) history = parsed;
    } catch {
      history = [];
    }
  }

  const todayIndex = history.findIndex((e) => e.date === todayLabel);
  if (todayIndex >= 0) {
    history[todayIndex].steps = stepCount;
  } else {
    history.unshift({ date: todayLabel, steps: stepCount });
  }
  await AsyncStorage.setItem('stepHistory', JSON.stringify(history));
}

export async function persistTodaySteps(
  user: { _id?: string; userId?: string } | null | undefined,
  newSteps: number,
): Promise<{ totalSteps: number }> {
  const today = getLocalTodayKey();
  const prevToday = await loadTodayStepsFromLocal(today);

  let prevTotal = 0;
  try {
    const totalStr = await AsyncStorage.getItem('totalSteps');
    if (totalStr != null) {
      prevTotal = parseInt(totalStr, 10) || 0;
    }
  } catch {
    // ignore
  }

  const totalSteps = Math.max(0, prevTotal - prevToday + newSteps);
  await cacheTodaySteps(today, newSteps, totalSteps);

  if (user) {
    const userId = (user as { _id?: string; userId?: string })._id
      ?? (user as { _id?: string; userId?: string }).userId;
    if (userId) {
      try {
        await api.put(`/api/steps/${today}`, { stepCount: newSteps });
      } catch (error) {
        console.error('Error saving steps to backend:', error);
      }
    }
  }

  return { totalSteps };
}

const DAILY_GOAL_KEY = 'dailyStepGoal';

export async function loadDailyGoal(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(DAILY_GOAL_KEY);
    if (raw != null) {
      const parsed = parseInt(raw, 10);
      if (!Number.isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return 10000;
}

export async function saveDailyGoal(goal: number): Promise<void> {
  await AsyncStorage.setItem(DAILY_GOAL_KEY, String(goal));
}
