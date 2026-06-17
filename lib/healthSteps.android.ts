import { format, subDays } from 'date-fns';
import {
  aggregateGroupByPeriod,
  aggregateRecord,
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  openHealthConnectSettings,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';
import type { HealthStepsStatus } from './healthStepsTypes';
import { localDayBounds } from './healthStepsTypes';

export type { HealthStepsStatus, StepDataSource } from './healthStepsTypes';
export {
  dateKeyFromDate,
  localDayBounds,
  STEP_COUNT_IDENTIFIER,
} from './healthStepsTypes';

let sdkInitialized = false;

async function ensureSdk(): Promise<boolean> {
  try {
    const status = await getSdkStatus();
    if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) {
      return false;
    }
    if (!sdkInitialized) {
      sdkInitialized = await initialize();
    }
    return sdkInitialized;
  } catch {
    return false;
  }
}

async function hasStepsReadPermission(): Promise<boolean> {
  try {
    const granted = await getGrantedPermissions();
    return granted.some(
      (p) =>
        'recordType' in p &&
        p.recordType === 'Steps' &&
        p.accessType === 'read',
    );
  } catch {
    return false;
  }
}

export async function getHealthStepsStatus(): Promise<HealthStepsStatus> {
  try {
    const status = await getSdkStatus();
    if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE) {
      return 'unavailable';
    }
    if (
      status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
    ) {
      return 'unavailable';
    }

    const ready = await ensureSdk();
    if (!ready) return 'unavailable';

    const hasPermission = await hasStepsReadPermission();
    if (hasPermission) return 'authorized';

    return 'not_determined';
  } catch {
    return 'unavailable';
  }
}

export async function requestHealthStepsPermission(): Promise<HealthStepsStatus> {
  try {
    const ready = await ensureSdk();
    if (!ready) return 'unavailable';

    const granted = await requestPermission([
      { accessType: 'read', recordType: 'Steps' },
    ]);

    const hasSteps = granted.some(
      (p) =>
        'recordType' in p &&
        p.recordType === 'Steps' &&
        p.accessType === 'read',
    );

    return hasSteps ? 'authorized' : 'denied';
  } catch {
    return 'denied';
  }
}

export async function readTodayStepCount(): Promise<number | null> {
  try {
    const ready = await ensureSdk();
    if (!ready) return null;

    const hasPermission = await hasStepsReadPermission();
    if (!hasPermission) return null;

    const { start, end } = localDayBounds();
    const result = await aggregateRecord({
      recordType: 'Steps',
      timeRangeFilter: {
        operator: 'between',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
    });

    const total = result.COUNT_TOTAL;
    return typeof total === 'number' && !Number.isNaN(total)
      ? Math.round(total)
      : 0;
  } catch {
    return null;
  }
}

export async function readDailyStepCounts(
  startDate: Date,
  endDate: Date,
): Promise<Map<string, number>> {
  const result = new Map<string, number>();

  try {
    const ready = await ensureSdk();
    if (!ready) return result;

    const hasPermission = await hasStepsReadPermission();
    if (!hasPermission) return result;

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const groups = await aggregateGroupByPeriod({
      recordType: 'Steps',
      timeRangeFilter: {
        operator: 'between',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
      timeRangeSlicer: {
        period: 'DAYS',
        length: 1,
      },
    });

    for (const group of groups) {
      const key = format(new Date(group.startTime), 'yyyy-MM-dd');
      const total = group.result.COUNT_TOTAL;
      if (typeof total === 'number' && !Number.isNaN(total)) {
        result.set(key, Math.round(total));
      }
    }
  } catch {
    // per-day fallback
    let cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    while (cursor <= end) {
      const { start, end: dayEnd, dateKey } = localDayBounds(cursor);
      try {
        const dayResult = await aggregateRecord({
          recordType: 'Steps',
          timeRangeFilter: {
            operator: 'between',
            startTime: start.toISOString(),
            endTime: dayEnd.toISOString(),
          },
        });
        const total = dayResult.COUNT_TOTAL;
        if (typeof total === 'number' && !Number.isNaN(total)) {
          result.set(dateKey, Math.round(total));
        }
      } catch {
        // skip
      }
      cursor = subDays(cursor, -1);
    }
  }

  return result;
}

export function getHealthPermissionSettingsHint(): string {
  return '1. Open Health Connect\n2. App permissions\n3. Agile Athletes\n4. Allow Steps\n5. Return to the app';
}

export async function openHealthPermissionSettings(): Promise<void> {
  try {
    openHealthConnectSettings();
  } catch {
    const { Linking } = await import('react-native');
    await Linking.openSettings();
  }
}

export async function readLastWeekStepCounts(): Promise<Map<string, number>> {
  const today = new Date();
  const start = subDays(today, 6);
  start.setHours(0, 0, 0, 0);
  return readDailyStepCounts(start, today);
}
