import {
  aggregateRecord,
  getGrantedPermissions,
  getSdkStatus,
  readRecords,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';
import { localDayBounds } from './healthStepsTypes';

/** Set to false to silence HC logs without removing the instrumentation. */
export const HEALTH_CONNECT_DEBUG = __DEV__;

const LOG = '[HC Steps]';
const FULL_DIAGNOSTIC_INTERVAL_MS = 45_000;
let lastFullDiagnosticAt = 0;

const SDK_STATUS_LABEL: Record<number, string> = {
  [SdkAvailabilityStatus.SDK_UNAVAILABLE]: 'SDK_UNAVAILABLE',
  [SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED]:
    'SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED',
  [SdkAvailabilityStatus.SDK_AVAILABLE]: 'SDK_AVAILABLE',
};

type StepRecord = {
  count?: number;
  startTime?: string;
  endTime?: string;
  metadata?: { dataOrigin?: string };
};

function summarizeRecord(record: StepRecord | undefined) {
  if (!record) return null;
  return {
    count: record.count,
    startTime: record.startTime,
    endTime: record.endTime,
    dataOrigin: record.metadata?.dataOrigin,
  };
}

async function probeWindow(
  label: string,
  start: Date,
  end: Date,
): Promise<{
  aggregateTotal: number | null;
  recordCount: number;
  recordSum: number;
  origins: string[];
  samples: ReturnType<typeof summarizeRecord>[];
}> {
  const timeRangeFilter = {
    operator: 'between' as const,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };

  let aggregateTotal: number | null = null;
  try {
    const aggregate = await aggregateRecord({
      recordType: 'Steps',
      timeRangeFilter,
    });
    const total = aggregate.COUNT_TOTAL;
    aggregateTotal =
      typeof total === 'number' && !Number.isNaN(total) ? Math.round(total) : 0;
  } catch (error) {
    console.warn(`${LOG} ${label} aggregate failed:`, error);
  }

  let recordCount = 0;
  let recordSum = 0;
  const origins = new Set<string>();
  const samples: ReturnType<typeof summarizeRecord>[] = [];
  let pageToken: string | undefined;

  try {
    do {
      const page = await readRecords('Steps', {
        timeRangeFilter,
        pageToken,
      });

      recordCount += page.records.length;
      for (const raw of page.records) {
        const record = raw as StepRecord;
        if (typeof record.count === 'number' && !Number.isNaN(record.count)) {
          recordSum += record.count;
        }
        const origin = record.metadata?.dataOrigin;
        if (origin) origins.add(origin);
        if (samples.length < 3) {
          samples.push(summarizeRecord(record));
        }
      }

      pageToken = page.pageToken;
    } while (pageToken);
  } catch (error) {
    console.warn(`${LOG} ${label} readRecords failed:`, error);
  }

  return {
    aggregateTotal,
    recordCount,
    recordSum: Math.round(recordSum),
    origins: [...origins],
    samples,
  };
}

/**
 * Logs Health Connect SDK state, permissions, today's query, and a 7-day probe.
 * Full probe runs at most once per 45s; filter Metro logs with: [HC Steps]
 */
export async function logHealthConnectDiagnostics(): Promise<void> {
  if (!HEALTH_CONNECT_DEBUG) return;

  const nowMs = Date.now();
  const runFullProbe =
    lastFullDiagnosticAt === 0 ||
    nowMs - lastFullDiagnosticAt >= FULL_DIAGNOSTIC_INTERVAL_MS;

  if (!runFullProbe) {
    return;
  }
  lastFullDiagnosticAt = nowMs;

  const now = new Date();
  const { start: todayStart } = localDayBounds(now);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  console.log(`${LOG} ===== HC DEBUG =====`);

  try {
    const sdkStatus = await getSdkStatus();
    console.log(`${LOG} SDK STATUS`, {
      code: sdkStatus,
      label: SDK_STATUS_LABEL[sdkStatus] ?? 'UNKNOWN',
    });
  } catch (error) {
    console.warn(`${LOG} getSdkStatus failed:`, error);
  }

  try {
    const perms = await getGrantedPermissions();
    console.log(`${LOG} PERMISSIONS`, JSON.stringify(perms, null, 2));
    const hasStepsRead = perms.some(
      (p) =>
        'recordType' in p &&
        p.recordType === 'Steps' &&
        p.accessType === 'read',
    );
    console.log(`${LOG} hasStepsReadPermission`, hasStepsRead);
  } catch (error) {
    console.warn(`${LOG} getGrantedPermissions failed:`, error);
  }

  console.log(`${LOG} TIME`, {
    deviceNow: now.toString(),
    timezoneOffsetMinutes: now.getTimezoneOffset(),
    todayStartLocal: todayStart.toString(),
    todayStartISO: todayStart.toISOString(),
    todayEndISO: now.toISOString(),
  });

  const today = await probeWindow('TODAY', todayStart, now);
  console.log(`${LOG} TODAY probe`, {
    aggregateTotal: today.aggregateTotal,
    recordCount: today.recordCount,
    recordSum: today.recordSum,
    dataOrigins: today.origins,
    firstRecords: today.samples,
  });

  const week = await probeWindow('LAST_7_DAYS', weekStart, now);
  console.log(`${LOG} LAST_7_DAYS probe`, {
    aggregateTotal: week.aggregateTotal,
    recordCount: week.recordCount,
    recordSum: week.recordSum,
    dataOrigins: week.origins,
    firstRecords: week.samples,
  });

  if (
    today.recordCount === 0 &&
    today.aggregateTotal === 0 &&
    (week.recordCount > 0 || (week.aggregateTotal ?? 0) > 0)
  ) {
    console.warn(
      `${LOG} HINT: Steps exist in the last 7 days but NOT in today's window — likely a timezone / midnight boundary issue.`,
    );
  }

  if (
    today.recordCount === 0 &&
    week.recordCount === 0 &&
    (week.aggregateTotal ?? 0) === 0
  ) {
    console.warn(
      `${LOG} HINT: No step records in Health Connect at all. Check Health Connect → Data & access → Steps → Data sources and confirm Samsung Health is writing to HC.`,
    );
  }

  if (today.recordCount > 0 && (today.aggregateTotal ?? 0) === 0) {
    console.warn(
      `${LOG} HINT: readRecords has data but aggregateRecord returned 0 — use record sum, not aggregate.`,
    );
  }

  console.log(`${LOG} ===== END HC DEBUG =====`);
}
