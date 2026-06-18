import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalTodayKey, loadTodayStepsFromLocal } from './dailySteps';
import {
  deviceStepsBaselineKey,
  getUserStorageId,
  type StepStorageUser,
} from './stepStorageKeys';

async function readDeviceStepsBaseline(
  user: StepStorageUser,
  today: string,
): Promise<number | null> {
  const userId = getUserStorageId(user);
  if (!userId) return null;

  try {
    const raw = await AsyncStorage.getItem(deviceStepsBaselineKey(userId, today));
    if (raw == null) return null;
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? null : parsed;
  } catch {
    return null;
  }
}

async function writeDeviceStepsBaseline(
  user: StepStorageUser,
  today: string,
  baseline: number,
): Promise<void> {
  const userId = getUserStorageId(user);
  if (!userId) return;
  await AsyncStorage.setItem(
    deviceStepsBaselineKey(userId, today),
    String(Math.max(0, Math.round(baseline))),
  );
}

/**
 * Map device-level step totals (Health Connect / HealthKit) to this app account.
 * Accounts with no stored steps for today anchor at the current device total so
 * they start at 0 instead of inheriting steps walked before sign-in.
 */
export async function resolveAccountDeviceSteps(
  user: StepStorageUser,
  deviceSteps: number,
): Promise<number> {
  const rounded = Math.max(0, Math.round(deviceSteps));
  const today = getLocalTodayKey();
  const localToday = await loadTodayStepsFromLocal(user, today);
  const baseline = await readDeviceStepsBaseline(user, today);

  if (baseline === null) {
    if (localToday > 0) {
      return Math.max(localToday, rounded);
    }
    await writeDeviceStepsBaseline(user, today, rounded);
    return 0;
  }

  const fromDevice = Math.max(0, rounded - baseline);
  return Math.max(localToday, fromDevice);
}
