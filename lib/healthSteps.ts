import type { HealthStepsStatus } from './healthStepsTypes';

export type { HealthStepsStatus, StepDataSource } from './healthStepsTypes';
export {
  dateKeyFromDate,
  localDayBounds,
  STEP_COUNT_IDENTIFIER,
} from './healthStepsTypes';

export async function getHealthStepsStatus(): Promise<HealthStepsStatus> {
  return 'unavailable';
}

export async function requestHealthStepsPermission(): Promise<HealthStepsStatus> {
  return 'unavailable';
}

export async function readTodayStepCount(): Promise<number | null> {
  return null;
}

export async function readDailyStepCounts(
  _startDate: Date,
  _endDate: Date,
): Promise<Map<string, number>> {
  return new Map();
}

export function getHealthPermissionSettingsHint(): string {
  return 'Health step sync is not available on this platform.';
}

export function getHealthSettingsButtonLabel(): string {
  return 'Open Settings';
}

export async function openHealthPermissionSettings(): Promise<void> {
  // no-op on web
}

export async function readLastWeekStepCounts(): Promise<Map<string, number>> {
  return new Map();
}
