export type StepStorageUser =
  | { _id?: string; userId?: string; id?: string }
  | null
  | undefined;

/** Stable per-account id for AsyncStorage namespacing. */
export function getUserStorageId(user: StepStorageUser): string | null {
  if (!user) return null;
  const id = user._id ?? user.userId ?? user.id;
  return id != null ? String(id) : null;
}

const VERSION = 'v1';

export function stepsDayKey(userId: string, date: string): string {
  return `steps_${VERSION}_${userId}_${date}`;
}

export function stepHistoryKey(userId: string): string {
  return `stepHistory_${VERSION}_${userId}`;
}

export function totalStepsKey(userId: string): string {
  return `totalSteps_${VERSION}_${userId}`;
}

export function dailyGoalKey(userId: string): string {
  return `dailyStepGoal_${VERSION}_${userId}`;
}

export function lastStepReminderKey(userId: string): string {
  return `lastStepReminder_${VERSION}_${userId}`;
}

/** Device step total at first sync for an account with no stored steps today. */
export function deviceStepsBaselineKey(userId: string, date: string): string {
  return `deviceStepsBaseline_${VERSION}_${userId}_${date}`;
}
