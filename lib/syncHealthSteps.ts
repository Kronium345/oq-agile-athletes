import { AppState, Platform } from 'react-native';
import { resolveAccountDeviceSteps } from './accountDeviceSteps';
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

  // Health Connect on Android only allows step reads while the app is foregrounded.
  if (AppState.currentState !== 'active') {
    return { ok: false, status: 'authorized', steps: null };
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

    const localToday = await loadTodayStepsFromLocal(user);
    const accountSteps = await resolveAccountDeviceSteps(user, healthSteps);
    const persisted = accountSteps > localToday;
    if (persisted) {
      await persistTodaySteps(user, accountSteps);
    }

    if (__DEV__) {
      console.log(LOG, {
        ok: true,
        status: 'authorized',
        healthSteps,
        localToday,
        accountSteps,
        persisted,
      });
    }

    return { ok: true, status: 'authorized', steps: accountSteps };
  } catch (error) {
    if (__DEV__) {
      console.error(LOG, 'sync failed:', error);
    }
    return { ok: false, status: 'unavailable', steps: null };
  }
}
