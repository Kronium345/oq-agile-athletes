import api from '../api/axios';
import { getLocalTodayKey, loadTodayStepsFromLocal, pickStepCount } from '../lib/dailySteps';
import { getUserStorageId } from '../lib/stepStorageKeys';
import { computePerformanceScores } from '../lib/performance/scoring';
import { fetchTrainingLoadBand } from '../lib/performance/trainingLoad';
import {
  listLocalCheckIns,
  loadLocalCheckIn,
  saveLocalCheckIn,
} from '../lib/performance/storage';
import type {
  PerformanceCheckInInput,
  PerformanceCheckInRecord,
  PerformanceTodayPayload,
  PerformanceTrendPoint,
  PerformanceTrendsPayload,
  PerformanceWeeklySummary,
  TrainingLoadBand,
} from '../lib/performance/types';
import type { StepStorageUser } from '../lib/stepStorageKeys';

function unwrap<T>(response: unknown): T | null {
  if (response == null) return null;
  if (typeof response === 'object' && 'data' in (response as object)) {
    return (response as { data: T }).data;
  }
  if (typeof response === 'object' && 'success' in (response as object)) {
    const r = response as { success?: boolean; data?: T };
    if (r.success === false) return null;
    return r.data ?? null;
  }
  return response as T;
}

async function getStepsContext(
  user: StepStorageUser,
  userId: string,
): Promise<{ todaySteps: number; dailyStepGoal: number }> {
  const dailyStepGoal = 10000;
  try {
    const res = await api.get(`/api/steps/${getLocalTodayKey()}`);
    const count = pickStepCount(res as Parameters<typeof pickStepCount>[0]);
    if (count != null) {
      return { todaySteps: count, dailyStepGoal };
    }
  } catch {
    // fall through
  }
  const local = await loadTodayStepsFromLocal(user, getLocalTodayKey());
  return { todaySteps: local ?? 0, dailyStepGoal };
}

async function buildTrainingContext(
  user: StepStorageUser,
  userId: string,
): Promise<{
  todaySteps: number;
  dailyStepGoal: number;
  trainingLoad: TrainingLoadBand;
}> {
  const steps = await getStepsContext(user, userId);
  const trainingLoad = await fetchTrainingLoadBand(userId);
  return { ...steps, trainingLoad };
}

export async function submitPerformanceCheckIn(
  user: StepStorageUser,
  input: PerformanceCheckInInput,
): Promise<PerformanceCheckInRecord> {
  const userId = getUserStorageId(user);
  if (!userId) {
    throw new Error('Sign in to save your check-in.');
  }

  try {
    const response = await api.post('/performance/check-ins', input);
    const data = unwrap<PerformanceCheckInRecord>(response);
    if (data?.recoveryScore != null) {
      await saveLocalCheckIn(user, data);
      return data;
    }
  } catch {
    // Client-side fallback until backend is live.
  }

  const context = await buildTrainingContext(user, userId);
  const record = computePerformanceScores(input, context);
  await saveLocalCheckIn(user, record);
  return record;
}

export async function fetchPerformanceToday(
  user: StepStorageUser,
  date = getLocalTodayKey(),
): Promise<PerformanceTodayPayload> {
  const userId = getUserStorageId(user);

  try {
    const response = await api.get(`/performance/today?date=${date}`);
    const data = unwrap<PerformanceTodayPayload>(response);
    if (data) return data;
  } catch {
    // local fallback
  }

  const local = await loadLocalCheckIn(user, date);
  let stepsToday = 0;
  const dailyStepGoal = 10000;
  if (userId) {
    const steps = await getStepsContext(user, userId);
    stepsToday = steps.todaySteps;
  }

  return {
    date,
    hasCheckIn: Boolean(local),
    checkIn: local ?? undefined,
    stepsToday,
    dailyStepGoal,
  };
}

export async function fetchPerformanceHistory(
  user: StepStorageUser,
  limit = 7,
): Promise<PerformanceCheckInRecord[]> {
  try {
    const response = await api.get(
      `/performance/check-ins?limit=${limit}`,
    );
    const data = unwrap<PerformanceCheckInRecord[]>(response);
    if (Array.isArray(data) && data.length > 0) return data;
  } catch {
    // local fallback
  }
  return listLocalCheckIns(user, limit);
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export async function fetchPerformanceTrends(
  user: StepStorageUser,
  period: 30 | 90,
): Promise<PerformanceTrendsPayload> {
  try {
    const response = await api.get(`/performance/trends?period=${period}`);
    const data = unwrap<PerformanceTrendsPayload>(response);
    if (data?.series) return data;
  } catch {
    // compute from local
  }

  const history = await listLocalCheckIns(user, period);
  const series: PerformanceTrendPoint[] = history
    .slice()
    .reverse()
    .map((row) => ({
      date: row.date,
      recoveryScore: row.recoveryScore,
      sleepScore: row.sleepScore,
      stressScore: row.stressScore,
      energyScore: row.energyScore,
      trainingLoad: row.trainingLoad,
    }));

  const trainingLoadSummary: Record<TrainingLoadBand, number> = {
    Normal: 0,
    Building: 0,
    High: 0,
    'Very High': 0,
  };
  for (const row of history) {
    trainingLoadSummary[row.trainingLoad] += 1;
  }

  return {
    period,
    averages: {
      recoveryScore: average(history.map((r) => r.recoveryScore)),
      sleepScore: average(history.map((r) => r.sleepScore)),
      stressScore: average(history.map((r) => r.stressScore)),
      energyScore: average(history.map((r) => r.energyScore)),
    },
    series,
    trainingLoadSummary,
  };
}

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && !Number.isNaN(value) ? value : fallback;
}

/** Guard against partial/legacy backend shapes so the UI never hits undefined. */
function normalizeWeeklySummary(
  data: Partial<PerformanceWeeklySummary> | null | undefined,
  fallbackStart: string,
): PerformanceWeeklySummary {
  const averages = data?.averages ?? ({} as PerformanceWeeklySummary['averages']);
  const fallbackEnd = (() => {
    const end = new Date(fallbackStart);
    end.setDate(end.getDate() + 6);
    return getLocalTodayKey(end);
  })();

  return {
    weekStart: data?.weekStart ?? fallbackStart,
    weekEnd: data?.weekEnd ?? fallbackEnd,
    checkInCount: toNumber(data?.checkInCount),
    averages: {
      recoveryScore: toNumber(averages.recoveryScore),
      sleepHours: toNumber(averages.sleepHours),
      energy: toNumber(averages.energy),
      stress: toNumber(averages.stress),
    },
    dominantTrainingLoad: data?.dominantTrainingLoad ?? 'Normal',
    topRecommendations: Array.isArray(data?.topRecommendations)
      ? data.topRecommendations
      : [],
    narrative: data?.narrative ?? 'No summary available.',
  };
}

export async function fetchWeeklySummary(
  user: StepStorageUser,
  weekStart?: string,
): Promise<PerformanceWeeklySummary> {
  const start =
    weekStart ??
    (() => {
      const d = new Date();
      const day = d.getDay();
      const diff = day === 0 ? 6 : day - 1;
      d.setDate(d.getDate() - diff);
      return getLocalTodayKey(d);
    })();

  try {
    const response = await api.get(
      `/performance/weekly-summary?weekStart=${start}`,
    );
    const data = unwrap<PerformanceWeeklySummary>(response);
    if (data?.narrative) return normalizeWeeklySummary(data, start);
  } catch {
    // template from local
  }

  const history = await listLocalCheckIns(user, 14);
  const weekRows = history.filter((r) => r.date >= start);

  const loadCounts: Record<TrainingLoadBand, number> = {
    Normal: 0,
    Building: 0,
    High: 0,
    'Very High': 0,
  };
  for (const row of weekRows) {
    loadCounts[row.trainingLoad] += 1;
  }
  const dominantTrainingLoad =
    (Object.entries(loadCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as
      | TrainingLoadBand
      | undefined) ?? 'Normal';

  const avgRecovery = average(weekRows.map((r) => r.recoveryScore));
  const avgSleep = average(weekRows.map((r) => r.sleepHours));
  const avgEnergy = average(weekRows.map((r) => r.energy));
  const avgStress = average(weekRows.map((r) => r.stress));

  const recMap = new Map<string, PerformanceCheckInRecord['recommendations'][0]>();
  for (const row of weekRows) {
    for (const rec of row.recommendations) {
      recMap.set(rec.message, rec);
    }
  }

  const endDate = new Date(start);
  endDate.setDate(endDate.getDate() + 6);

  const narrative =
    weekRows.length === 0
      ? 'No check-ins this week yet. Complete your daily recovery check-in to build your weekly summary.'
      : `This week you logged ${weekRows.length} check-in${weekRows.length === 1 ? '' : 's'}. Average recovery score: ${avgRecovery}/100. Dominant training load: ${dominantTrainingLoad}. ${avgSleep < 7 ? 'Sleep hours trended low — prioritize an earlier bedtime.' : 'Sleep looked solid — keep your routine consistent.'}`;

  return {
    weekStart: start,
    weekEnd: getLocalTodayKey(endDate),
    checkInCount: weekRows.length,
    averages: {
      recoveryScore: avgRecovery,
      sleepHours: avgSleep,
      energy: avgEnergy,
      stress: avgStress,
    },
    dominantTrainingLoad,
    topRecommendations: Array.from(recMap.values()).slice(0, 5),
    narrative,
  };
}
