import type { StepStorageUser } from '../stepStorageKeys';
import {
  getLocalDateKey,
  isDateInCurrentWeek,
  listCompletedSessions,
} from './storage';
import type { RecoveryBreathingSummary } from './types';

function uniqueSortedDates(dates: string[]): string[] {
  return [...new Set(dates)].sort((a, b) => b.localeCompare(a));
}

function computeStreakDays(completedDatesDesc: string[], today: string): number {
  if (completedDatesDesc.length === 0) return 0;

  const unique = uniqueSortedDates(completedDatesDesc);
  let streak = 0;
  let cursor = today;

  // Allow streak to start from yesterday if nothing today yet
  if (!unique.includes(cursor)) {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    cursor = getLocalDateKey(y);
    if (!unique.includes(cursor)) return 0;
  }

  while (unique.includes(cursor)) {
    streak += 1;
    const d = new Date(`${cursor}T12:00:00`);
    d.setDate(d.getDate() - 1);
    cursor = getLocalDateKey(d);
  }

  return streak;
}

export async function getBreathingSummary(
  user: StepStorageUser,
): Promise<RecoveryBreathingSummary> {
  const completed = await listCompletedSessions(user, 120);
  const today = getLocalDateKey();
  const sessionsToday = completed.filter((s) => s.date === today).length;
  const sessionsWeek = completed.filter((s) =>
    isDateInCurrentWeek(s.date),
  ).length;
  const dates = completed.map((s) => s.date);
  const streakDays = computeStreakDays(dates, today);

  return {
    sessionsToday,
    sessionsWeek,
    streakDays,
    hasSessionToday: sessionsToday > 0,
  };
}
