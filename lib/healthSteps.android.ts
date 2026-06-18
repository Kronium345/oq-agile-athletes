import { format, subDays } from 'date-fns';
import { Linking } from 'react-native';
import {
  aggregateGroupByPeriod,
  aggregateRecord,
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  openHealthConnectSettings,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';
import type { HealthStepsStatus } from './healthStepsTypes';
import { localDayBounds } from './healthStepsTypes';
import { logHealthConnectDiagnostics } from './healthConnectDebug';

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
      if (__DEV__) {
        console.warn('[HC Steps] ensureSdk: SDK not available', status);
      }
      return false;
    }
    if (!sdkInitialized) {
      sdkInitialized = await initialize();
      if (__DEV__) {
        console.log('[HC Steps] initialize()', sdkInitialized);
      }
    }
    return sdkInitialized;
  } catch (error) {
    if (__DEV__) {
      console.warn('[HC Steps] ensureSdk failed:', error);
    }
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

    if (await hasStepsReadPermission()) {
      return 'authorized';
    }

    await requestPermission([{ accessType: 'read', recordType: 'Steps' }]);

    if (await hasStepsReadPermission()) {
      return 'authorized';
    }

    return 'denied';
  } catch {
    return 'denied';
  }
}

async function sumStepsRecords(start: Date, end: Date): Promise<number> {
  let pageToken: string | undefined;
  let total = 0;

  do {
    const page = await readRecords('Steps', {
      timeRangeFilter: {
        operator: 'between',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
      pageToken,
    });

    for (const record of page.records) {
      const count = (record as { count?: number }).count;
      if (typeof count === 'number' && !Number.isNaN(count)) {
        total += count;
      }
    }

    pageToken = page.pageToken;
  } while (pageToken);

  return Math.round(total);
}

export async function readTodayStepCount(): Promise<number | null> {
  try {
    const ready = await ensureSdk();
    if (!ready) {
      if (__DEV__) console.warn('[HC Steps] readTodayStepCount: SDK not ready');
      return null;
    }

    const hasPermission = await hasStepsReadPermission();
    if (!hasPermission) {
      if (__DEV__) {
        console.warn('[HC Steps] readTodayStepCount: Steps read permission missing');
      }
      return null;
    }

    if (__DEV__) {
      await logHealthConnectDiagnostics();
    }

    const { start } = localDayBounds();
    const end = new Date();
    const timeRangeFilter = {
      operator: 'between' as const,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    };

    const result = await aggregateRecord({
      recordType: 'Steps',
      timeRangeFilter,
    });

    const aggregateTotal = result.COUNT_TOTAL;
    if (typeof aggregateTotal === 'number' && aggregateTotal > 0) {
      const rounded = Math.round(aggregateTotal);
      if (__DEV__) {
        console.log('[HC Steps] readTodayStepCount → aggregate', rounded);
      }
      return rounded;
    }

    const fromRecords = await sumStepsRecords(start, end);
    if (__DEV__) {
      console.log('[HC Steps] readTodayStepCount → record sum', fromRecords, {
        aggregateWas: aggregateTotal,
      });
    }
    return fromRecords;
  } catch (error) {
    if (__DEV__) {
      console.error('[HC Steps] readTodayStepCount failed:', error);
    }
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
  return [
    '1. Open Health Connect (Samsung Health → Settings → Health Connect)',
    '2. Tap App permissions',
    '3. Select Agile Athletes',
    '4. Allow Steps',
    '5. Return here and tap the label below',
  ].join('\n');
}

export function getHealthSettingsButtonLabel(): string {
  return 'Open Settings';
}

export async function openHealthPermissionSettings(): Promise<void> {
  try {
    openHealthConnectSettings();
  } catch {
    await Linking.openSettings();
  }
}

export async function readLastWeekStepCounts(): Promise<Map<string, number>> {
  const today = new Date();
  const start = subDays(today, 6);
  start.setHours(0, 0, 0, 0);
  return readDailyStepCounts(start, today);
}
