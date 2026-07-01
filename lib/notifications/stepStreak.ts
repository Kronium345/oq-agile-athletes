import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalTodayKey } from '../dailySteps';
import { getUserStorageId, lastStepReminderKey, type StepStorageUser } from '../stepStorageKeys';

/** Fixed local time for the daily step-streak reminder (Settings → Step streak reminders). */
export const DEFAULT_STEP_STREAK_REMINDER = { hour: 20, minute: 0 };

/** Only nudge in the evening when below this % of the daily goal. */
export const STEP_STREAK_NUDGE_GOAL_PERCENT = 80;

export function isPastStepStreakReminderTime(
  date = new Date(),
  target = DEFAULT_STEP_STREAK_REMINDER,
): boolean {
  if (date.getHours() > target.hour) return true;
  if (date.getHours() === target.hour && date.getMinutes() >= target.minute) {
    return true;
  }
  return false;
}

export async function hasSentEveningStepNudgeToday(
  user: StepStorageUser,
): Promise<boolean> {
  const userId = getUserStorageId(user);
  if (!userId) return true;
  const last = await AsyncStorage.getItem(lastStepReminderKey(userId));
  return last === getLocalTodayKey();
}

export async function markEveningStepNudgeSent(
  user: StepStorageUser,
): Promise<void> {
  const userId = getUserStorageId(user);
  if (!userId) return;
  await AsyncStorage.setItem(lastStepReminderKey(userId), getLocalTodayKey());
}

export function shouldSendEveningStepNudge(
  todaySteps: number,
  dailyGoal: number,
  now = new Date(),
): boolean {
  if (dailyGoal <= 0) return false;
  if (!isPastStepStreakReminderTime(now)) return false;
  const progress = (todaySteps / dailyGoal) * 100;
  return progress < STEP_STREAK_NUDGE_GOAL_PERCENT;
}
