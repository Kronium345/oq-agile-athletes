import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';
import {
  dailyGoalKey,
  getUserStorageId,
  stepHistoryKey,
  stepsDayKey,
  totalStepsKey,
  type StepStorageUser,
} from './stepStorageKeys';
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
  user: StepStorageUser,
  today = getLocalTodayKey(),
): Promise<number> {
  const userId = getUserStorageId(user);
  if (!userId) return 0;

  const fromKey = await AsyncStorage.getItem(stepsDayKey(userId, today));
  if (fromKey != null) {
    const parsed = parseInt(fromKey, 10);
    if (!Number.isNaN(parsed)) return parsed;
  }

  const historyRaw = await AsyncStorage.getItem(stepHistoryKey(userId));
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

export async function loadStepHistoryLocal(
  user: StepStorageUser,
): Promise<{ date: string; steps: number }[]> {
  const userId = getUserStorageId(user);
  if (!userId) return [];

  try {
    const savedHistory = await AsyncStorage.getItem(stepHistoryKey(userId));
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export async function saveStepHistoryLocal(
  user: StepStorageUser,
  history: { date: string; steps: number }[],
): Promise<void> {
  const userId = getUserStorageId(user);
  if (!userId) return;
  await AsyncStorage.setItem(stepHistoryKey(userId), JSON.stringify(history));
}

type TodayStepsListener = (steps: number) => void;
const todayStepsListeners = new Set<TodayStepsListener>();

/** Subscribe to today's step count updates (Health Connect sync, persist, etc.). */
export function subscribeTodaySteps(listener: TodayStepsListener): () => void {
  todayStepsListeners.add(listener);
  return () => {
    todayStepsListeners.delete(listener);
  };
}

function notifyTodaySteps(steps: number): void {
  for (const listener of todayStepsListeners) {
    listener(steps);
  }
}

export async function loadTodaySteps(
  user?: StepStorageUser,
): Promise<{ today: number; total: number }> {
  const today = getLocalTodayKey();
  const userId = getUserStorageId(user);
  const localToday = await loadTodayStepsFromLocal(user, today);
  const hasUser = Boolean(userId);

  if (hasUser) {
    try {
      const dateRes = (await api.get(
        `/api/steps/date/${today}`,
      )) as StepsApiPayload;
      const fromApi = pickStepCount(dateRes);
      if (fromApi !== null) {
        const mergedToday = Math.max(fromApi, localToday);
        let totalSteps = 0;
        try {
          const totalRes = (await api.get('/api/steps/total')) as StepsApiPayload;
          const total = pickTotalSteps(totalRes);
          if (total !== null) totalSteps = total;
        } catch {
          // keep 0; local cache may still have total
        }
        if (mergedToday !== localToday || totalSteps > 0) {
          await cacheTodaySteps(user, today, mergedToday, totalSteps);
        }
        return { today: mergedToday, total: totalSteps };
      }
    } catch {
      // fall through to local
    }
  }

  const todaySteps = await loadTodayStepsFromLocal(user, today);
  let totalSteps = 0;
  if (userId) {
    try {
      const cached = await AsyncStorage.getItem(totalStepsKey(userId));
      if (cached != null) {
        const parsed = parseInt(cached, 10);
        if (!Number.isNaN(parsed)) totalSteps = parsed;
      }
    } catch {
      // ignore
    }
  }

  return { today: todaySteps, total: totalSteps };
}

export async function cacheTodaySteps(
  user: StepStorageUser,
  today: string,
  stepCount: number,
  totalSteps?: number,
): Promise<void> {
  const userId = getUserStorageId(user);
  if (!userId) return;

  await AsyncStorage.setItem(stepsDayKey(userId, today), String(stepCount));
  if (totalSteps != null) {
    await AsyncStorage.setItem(totalStepsKey(userId), String(totalSteps));
  }

  const todayLabel = formatStepHistoryDate(new Date());
  const historyRaw = await AsyncStorage.getItem(stepHistoryKey(userId));
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
  await AsyncStorage.setItem(stepHistoryKey(userId), JSON.stringify(history));
}

export async function persistTodaySteps(
  user: StepStorageUser,
  newSteps: number,
): Promise<{ totalSteps: number }> {
  const today = getLocalTodayKey();
  const userId = getUserStorageId(user);
  const prevToday = await loadTodayStepsFromLocal(user, today);

  let prevTotal = 0;
  if (userId) {
    try {
      const totalStr = await AsyncStorage.getItem(totalStepsKey(userId));
      if (totalStr != null) {
        prevTotal = parseInt(totalStr, 10) || 0;
      }
    } catch {
      // ignore
    }
  }

  const totalSteps = Math.max(0, prevTotal - prevToday + newSteps);
  await cacheTodaySteps(user, today, newSteps, totalSteps);
  notifyTodaySteps(newSteps);

  if (userId) {
    try {
      await api.put(`/api/steps/${today}`, { stepCount: newSteps });
    } catch (error) {
      console.error('Error saving steps to backend:', error);
    }
  }

  return { totalSteps };
}

export async function loadDailyGoal(user: StepStorageUser): Promise<number> {
  const userId = getUserStorageId(user);
  if (!userId) return 10000;

  try {
    const raw = await AsyncStorage.getItem(dailyGoalKey(userId));
    if (raw != null) {
      const parsed = parseInt(raw, 10);
      if (!Number.isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return 10000;
}

export async function saveDailyGoal(
  user: StepStorageUser,
  goal: number,
): Promise<void> {
  const userId = getUserStorageId(user);
  if (!userId) return;
  await AsyncStorage.setItem(dailyGoalKey(userId), String(goal));
}
