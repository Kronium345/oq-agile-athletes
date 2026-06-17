export type HealthStepsStatus =
  | 'unavailable'
  | 'not_determined'
  | 'denied'
  | 'authorized';

export type StepDataSource = 'health' | 'pedometer' | 'cached';

export const STEP_COUNT_IDENTIFIER =
  'HKQuantityTypeIdentifierStepCount' as const;

/** Local calendar midnight and end-of-day for health queries. */
export function localDayBounds(date = new Date()): {
  start: Date;
  end: Date;
  dateKey: string;
} {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  const y = start.getFullYear();
  const m = String(start.getMonth() + 1).padStart(2, '0');
  const d = String(start.getDate()).padStart(2, '0');
  return { start, end, dateKey: `${y}-${m}-${d}` };
}

export function dateKeyFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
