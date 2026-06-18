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

const LOG = '[HC Sync]';

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
      if (__DEV__) {
        console.log(LOG, { ok: false, status, reason: 'not authorized' });
      }
      return { ok: false, status, steps: null };
    }

    const healthSteps = await readTodayStepCount();
    if (healthSteps == null) {
      if (__DEV__) {
        console.log(LOG, { ok: false, status, reason: 'readTodayStepCount returned null' });
      }
      return { ok: false, status, steps: null };
    }

    const localToday = await loadTodayStepsFromLocal();
    const merged = Math.max(localToday, healthSteps);
    const persisted = merged > localToday;
    if (persisted) {
      await persistTodaySteps(user, merged);
    }

    if (__DEV__) {
      console.log(LOG, {
        ok: true,
        status: 'authorized',
        healthSteps,
        localToday,
        merged,
        persisted,
      });
    }

    return { ok: true, status: 'authorized', steps: merged };
  } catch (error) {
    if (__DEV__) {
      console.error(LOG, 'sync failed:', error);
    }
    return { ok: false, status: 'unavailable', steps: null };
  }
}
