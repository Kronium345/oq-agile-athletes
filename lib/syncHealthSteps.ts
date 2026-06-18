import { Platform } from 'react-native';
import { loadTodayStepsFromLocal, persistTodaySteps } from './dailySteps';
import {
  getHealthStepsStatus,
  readTodayStepCount,
} from './healthSteps';
import type { HealthStepsStatus } from './healthStepsTypes';

export type HealthStepsSyncResult = {
  ok: boolean;
  status: HealthStepsStatus;
  steps: number | null;
};

/**
 * Pull today's step total from Health Connect / HealthKit and persist it.
 * When authorized, the OS health store is treated as the source of truth.
 */
export async function syncHealthStepsToStorage(
  user: { _id?: string; userId?: string } | null | undefined,
): Promise<HealthStepsSyncResult> {
  if (Platform.OS === 'web') {
    return { ok: false, status: 'unavailable', steps: null };
  }

  try {
    const status = await getHealthStepsStatus();
    if (status !== 'authorized') {
      return { ok: false, status, steps: null };
    }

    const healthSteps = await readTodayStepCount();
    if (healthSteps == null) {
      return { ok: false, status, steps: null };
    }

    const localToday = await loadTodayStepsFromLocal();
    if (healthSteps !== localToday) {
      await persistTodaySteps(user, healthSteps);
    }

    return { ok: true, status: 'authorized', steps: healthSteps };
  } catch {
    return { ok: false, status: 'unavailable', steps: null };
  }
}
