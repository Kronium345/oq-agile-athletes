import {
  AuthorizationRequestStatus,
  getRequestStatusForAuthorization,
  isHealthDataAvailable,
  queryStatisticsCollectionForQuantity,
  queryStatisticsForQuantity,
  requestAuthorization,
} from '@kingstinct/react-native-healthkit';
import { format, subDays } from 'date-fns';
import { Linking } from 'react-native';
import type { HealthStepsStatus } from './healthStepsTypes';
import {
  dateKeyFromDate,
  localDayBounds,
  STEP_COUNT_IDENTIFIER,
} from './healthStepsTypes';
export type { HealthStepsStatus, StepDataSource } from './healthStepsTypes';
export {
  dateKeyFromDate,
  localDayBounds,
  STEP_COUNT_IDENTIFIER,
} from './healthStepsTypes';

let authorizationRequested = false;

async function readAuthorizationStatus(): Promise<AuthorizationRequestStatus | null> {
  try {
    return await getRequestStatusForAuthorization({
      toRead: [STEP_COUNT_IDENTIFIER],
    });
  } catch {
    return null;
  }
}

function statusFromAuthorization(
  status: AuthorizationRequestStatus | null,
): HealthStepsStatus {
  if (status === AuthorizationRequestStatus.unnecessary) {
    return 'authorized';
  }
  if (status === AuthorizationRequestStatus.shouldRequest) {
    return authorizationRequested ? 'authorized' : 'not_determined';
  }
  return authorizationRequested ? 'denied' : 'not_determined';
}

async function ensureAuthorization(): Promise<boolean> {
  if (!isHealthDataAvailable()) return false;

  const status = await readAuthorizationStatus();
  if (status === AuthorizationRequestStatus.shouldRequest) {
    await requestAuthorization({ toRead: [STEP_COUNT_IDENTIFIER] });
    authorizationRequested = true;
    return true;
  }

  if (status === AuthorizationRequestStatus.unnecessary) {
    authorizationRequested = true;
    return true;
  }

  return false;
}

export async function getHealthStepsStatus(): Promise<HealthStepsStatus> {
  if (!isHealthDataAvailable()) return 'unavailable';

  try {
    return statusFromAuthorization(await readAuthorizationStatus());
  } catch {
    return 'unavailable';
  }
}

export async function requestHealthStepsPermission(): Promise<HealthStepsStatus> {
  if (!isHealthDataAvailable()) return 'unavailable';

  try {
    await requestAuthorization({ toRead: [STEP_COUNT_IDENTIFIER] });
    authorizationRequested = true;
    return statusFromAuthorization(await readAuthorizationStatus());
  } catch {
    return 'denied';
  }
}

export async function readTodayStepCount(): Promise<number | null> {
  if (!isHealthDataAvailable()) return null;

  try {
    const ready = await ensureAuthorization();
    if (!ready) return null;

    const { start } = localDayBounds();
    const stats = await queryStatisticsForQuantity(
      STEP_COUNT_IDENTIFIER,
      ['cumulativeSum'],
      {
        unit: 'count',
        filter: { date: { startDate: start, endDate: new Date() } },
      },
    );

    const quantity = stats.sumQuantity?.quantity;
    return typeof quantity === 'number' && !Number.isNaN(quantity)
      ? Math.round(quantity)
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
  if (!isHealthDataAvailable()) return result;

  try {
    const ready = await ensureAuthorization();
    if (!ready) return result;

    const anchor = new Date(startDate);
    anchor.setHours(0, 0, 0, 0);

    const collection = await queryStatisticsCollectionForQuantity(
      STEP_COUNT_IDENTIFIER,
      ['cumulativeSum'],
      anchor,
      { day: 1 },
      {
        unit: 'count',
        filter: {
          date: {
            startDate: anchor,
            endDate,
          },
        },
      },
    );

    for (const entry of collection) {
      const key = entry.startDate
        ? dateKeyFromDate(entry.startDate)
        : null;
      const steps = entry.sumQuantity?.quantity;
      if (key && typeof steps === 'number' && !Number.isNaN(steps)) {
        result.set(key, Math.round(steps));
      }
    }
  } catch {
    let cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    while (cursor <= end) {
      const { start, end: dayEnd, dateKey } = localDayBounds(cursor);
      try {
        const stats = await queryStatisticsForQuantity(
          STEP_COUNT_IDENTIFIER,
          ['cumulativeSum'],
          {
            unit: 'count',
            filter: { date: { startDate: start, endDate: dayEnd } },
          },
        );
        const quantity = stats.sumQuantity?.quantity;
        if (typeof quantity === 'number' && !Number.isNaN(quantity)) {
          result.set(dateKey, Math.round(quantity));
        }
      } catch {
        // skip day
      }
      cursor = subDays(cursor, -1);
    }
  }

  return result;
}

export function getHealthPermissionSettingsHint(): string {
  return [
    'Tap "Connect" first — iOS will show the Apple Health permission sheet.',
    '',
    'Apple Health is not listed under the Agile Athletes app settings page.',
    'To change access later:',
    '1. Open the Health app',
    '2. Tap your profile picture (top right)',
    '3. Tap Apps (under Privacy)',
    '4. Select Agile Athletes',
    '5. Turn on Steps',
  ].join('\n');
}

export function getHealthSettingsButtonLabel(): string {
  return 'Open Health App';
}

/** Opens the Health app — Apple does not allow deep-linking to per-app Health permissions. */
export async function openHealthPermissionSettings(): Promise<void> {
  try {
    const canOpen = await Linking.canOpenURL('x-apple-health://');
    if (canOpen) {
      await Linking.openURL('x-apple-health://');
      return;
    }
  } catch {
    // fall through
  }

  try {
    await Linking.openURL('x-apple-health://');
  } catch {
    // Last resort: app settings (notifications, etc.) — not where Health lives.
    await Linking.openSettings();
  }
}

export async function readLastWeekStepCounts(): Promise<Map<string, number>> {
  const today = new Date();
  const start = subDays(today, 6);
  start.setHours(0, 0, 0, 0);
  const counts = await readDailyStepCounts(start, today);
  if (!counts.has(format(today, 'yyyy-MM-dd'))) {
    const todayCount = await readTodayStepCount();
    if (todayCount != null) {
      counts.set(format(today, 'yyyy-MM-dd'), todayCount);
    }
  }
  return counts;
}
