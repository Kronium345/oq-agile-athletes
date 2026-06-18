import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, subDays } from 'date-fns';
import api from '../api/axios';
import { readDailyStepCounts } from './healthSteps';
import {
  getUserStorageId,
  stepHistoryKey,
  stepsDayKey,
} from './stepStorageKeys';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export function formatStepHistoryDate(date: Date): string {
  const month = MONTH_NAMES[date.getMonth()];
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}, ${day}`;
}

export type WeekDayPoint = {
  day: string;
  steps: number;
  progress: number;
  dateKey: string;
  isToday: boolean;
};

type HistoryEntry = {
  date?: string;
  steps?: number;
  stepCount?: number;
};

export function buildEmptyWeekDays(dailyGoal: number): WeekDayPoint[] {
  const today = new Date();
  const todayIso = format(today, 'yyyy-MM-dd');
  const goal = Math.max(dailyGoal, 1);

  return Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const iso = format(date, 'yyyy-MM-dd');
    return {
      day: format(date, 'EEE'),
      steps: 0,
      progress: 0,
      dateKey: iso,
      isToday: iso === todayIso,
    };
  });
}

export async function loadWeekStepData(options: {
  user: unknown;
  dailyGoal: number;
  todaySteps: number;
}): Promise<WeekDayPoint[]> {
  const { user, dailyGoal, todaySteps } = options;
  const today = new Date();
  const todayIso = format(today, 'yyyy-MM-dd');
  const startIso = format(subDays(today, 6), 'yyyy-MM-dd');

  const stepsByIso = new Map<string, number>();
  const stepsByDisplay = new Map<string, number>();
  const userId = getUserStorageId(user as { _id?: string; userId?: string });

  if (userId) {
    try {
      const raw = await AsyncStorage.getItem(stepHistoryKey(userId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const entry of parsed as HistoryEntry[]) {
            if (entry.date) {
              stepsByDisplay.set(
                entry.date,
                entry.steps ?? entry.stepCount ?? 0,
              );
            }
          }
        }
      }
    } catch {
      // ignore local parse errors
    }

    await Promise.all(
      Array.from({ length: 7 }, async (_, i) => {
        const iso = format(subDays(today, 6 - i), 'yyyy-MM-dd');
        try {
          const val = await AsyncStorage.getItem(stepsDayKey(userId, iso));
          if (val != null) {
            stepsByIso.set(iso, parseInt(val, 10) || 0);
          }
        } catch {
          // ignore
        }
      }),
    );
  }

  if (user) {
    try {
      const response = await api.get(
        `/api/steps/history?startDate=${startIso}&endDate=${todayIso}`,
      );
      if (
        (response as { success?: boolean }).success &&
        Array.isArray((response as { data?: HistoryEntry[] }).data)
      ) {
        for (const item of (response as { data: HistoryEntry[] }).data) {
          if (item.date) {
            stepsByIso.set(
              item.date,
              item.stepCount ?? item.steps ?? 0,
            );
          }
        }
      }
    } catch {
      // backend optional; local data still used
    }
  }

  try {
    const weekStart = subDays(today, 6);
    weekStart.setHours(0, 0, 0, 0);
    const healthCounts = await readDailyStepCounts(weekStart, today);
    for (const [iso, steps] of healthCounts) {
      const existing = stepsByIso.get(iso) ?? 0;
      stepsByIso.set(iso, Math.max(existing, steps));
    }
  } catch {
    // health store optional
  }

  const goal = Math.max(dailyGoal, 1);
  const days: WeekDayPoint[] = [];

  for (let i = 0; i < 7; i++) {
    const date = subDays(today, 6 - i);
    const iso = format(date, 'yyyy-MM-dd');
    const display = formatStepHistoryDate(date);
    const isToday = iso === todayIso;

    let steps = 0;
    if (isToday) {
      steps = todaySteps;
    } else if (stepsByIso.has(iso)) {
      steps = stepsByIso.get(iso)!;
    } else if (stepsByDisplay.has(display)) {
      steps = stepsByDisplay.get(display)!;
    }

    days.push({
      day: format(date, 'EEE'),
      steps,
      progress: Math.min(steps / goal, 1),
      dateKey: iso,
      isToday,
    });
  }

  return days;
}

export function computeWeeklyAverage(days: WeekDayPoint[]): number {
  if (!days.length) return 0;
  const total = days.reduce((sum, d) => sum + d.steps, 0);
  return Math.round(total / days.length);
}

export function getChartMax(
  days: WeekDayPoint[],
  dailyGoal: number,
): number {
  const peak = days.reduce((max, d) => Math.max(max, d.steps), 0);
  return Math.max(dailyGoal, peak, 1000);
}
