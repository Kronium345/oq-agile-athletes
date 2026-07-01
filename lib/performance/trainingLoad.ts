import { subDays, format } from 'date-fns';
import api from '../../api/axios';
import { getLocalTodayKey } from '../dailySteps';
import {
  computeTrainingLoadBand,
  dailyLoadFromWorkoutAndSteps,
} from './scoring';
import type { TrainingLoadBand } from './types';

type WorkoutRow = {
  timeStamp?: string;
  createdAt?: string;
  duration?: number;
};

type StepHistoryRow = {
  date?: string;
  stepCount?: number;
};

function dateKeyFromIso(iso: string): string {
  const d = new Date(iso);
  return format(d, 'yyyy-MM-dd');
}

function sumLoadsByDate(
  workoutRows: WorkoutRow[],
  stepRows: StepHistoryRow[],
): Map<string, number> {
  const loads = new Map<string, number>();

  for (const row of workoutRows) {
    const iso = row.timeStamp ?? row.createdAt;
    if (!iso) continue;
    const key = dateKeyFromIso(iso);
    const minutes = typeof row.duration === 'number' ? row.duration : 0;
    const prev = loads.get(key) ?? 0;
    loads.set(key, prev + dailyLoadFromWorkoutAndSteps(minutes, 0));
  }

  for (const row of stepRows) {
    const key = row.date;
    if (!key) continue;
    const steps = typeof row.stepCount === 'number' ? row.stepCount : 0;
    const prev = loads.get(key) ?? 0;
    loads.set(key, prev + dailyLoadFromWorkoutAndSteps(0, steps));
  }

  return loads;
}

function sumRange(loads: Map<string, number>, days: number): number {
  const today = new Date();
  let total = 0;
  for (let i = 0; i < days; i++) {
    const key = format(subDays(today, i), 'yyyy-MM-dd');
    total += loads.get(key) ?? 0;
  }
  return total;
}

export async function fetchTrainingLoadBand(
  userId: string,
): Promise<TrainingLoadBand> {
  try {
    const end = getLocalTodayKey();
    const start = format(subDays(new Date(), 27), 'yyyy-MM-dd');

    const [historyRes, stepsRes] = await Promise.all([
      api.get(`/history/history?userId=${userId}`),
      api.get(`/api/steps/history?startDate=${start}&endDate=${end}`),
    ]);

    const workouts: WorkoutRow[] =
      (historyRes as { success?: boolean; data?: WorkoutRow[] })?.data ?? [];
    const steps: StepHistoryRow[] = Array.isArray(stepsRes)
      ? (stepsRes as StepHistoryRow[])
      : ((stepsRes as { data?: StepHistoryRow[] })?.data ?? []);

    const loads = sumLoadsByDate(workouts, steps);
    const acute = sumRange(loads, 7);
    const chronic = sumRange(loads, 28) / 4;
    return computeTrainingLoadBand(acute, chronic);
  } catch {
    return 'Normal';
  }
}
