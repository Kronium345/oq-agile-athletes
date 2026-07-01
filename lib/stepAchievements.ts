import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getLocalTodayKey } from './dailySteps';
import { getUserStorageId, type StepStorageUser } from './stepStorageKeys';

const VERSION = 'v1';
const PUSH_SETTINGS_KEY = 'notificationSettings';

export type DailyStepAchievement = {
  steps: number;
  unlocked: boolean;
  icon: string;
  color: string;
  label: string;
};

/** Single-day step milestones (not lifetime total). */
export const DAILY_STEP_ACHIEVEMENT_DEFINITIONS: Omit<
  DailyStepAchievement,
  'unlocked'
>[] = [
  { steps: 5000, icon: 'trophy', color: '#CD7F32', label: '5K Day' },
  { steps: 7500, icon: 'trophy', color: '#C0C0C0', label: '7.5K Day' },
  { steps: 10000, icon: 'trophy', color: '#FFD700', label: '10K Day' },
  { steps: 12500, icon: 'trophy-award', color: '#E8B923', label: '12.5K Day' },
  { steps: 15000, icon: 'trophy', color: '#4CAF50', label: '15K Day' },
  { steps: 20000, icon: 'trophy-award', color: '#9C27B0', label: '20K Day' },
];

export function buildDailyStepAchievements(
  todaySteps: number,
): DailyStepAchievement[] {
  return DAILY_STEP_ACHIEVEMENT_DEFINITIONS.map((def) => ({
    ...def,
    unlocked: todaySteps >= def.steps,
  }));
}

function notifiedKey(userId: string, date: string): string {
  return `dailyStepAchievementNotified_${VERSION}_${userId}_${date}`;
}

async function loadNotifiedMilestones(
  userId: string,
  date: string,
): Promise<Set<number>> {
  const raw = await AsyncStorage.getItem(notifiedKey(userId, date));
  if (!raw) return new Set();
  try {
    const list = JSON.parse(raw) as number[];
    return new Set(Array.isArray(list) ? list : []);
  } catch {
    return new Set();
  }
}

async function saveNotifiedMilestones(
  userId: string,
  date: string,
  milestones: Set<number>,
): Promise<void> {
  await AsyncStorage.setItem(
    notifiedKey(userId, date),
    JSON.stringify(Array.from(milestones)),
  );
}

async function isStepPushEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(PUSH_SETTINGS_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { stepStreakReminders?: boolean };
    return Boolean(parsed.stepStreakReminders);
  } catch {
    return false;
  }
}

/** Send push once per milestone per calendar day when today's steps cross a threshold. */
export async function checkAndNotifyDailyStepAchievements(
  user: StepStorageUser,
  todaySteps: number,
): Promise<void> {
  const userId = getUserStorageId(user);
  if (!userId || todaySteps <= 0) return;
  if (!(await isStepPushEnabled())) return;

  const date = getLocalTodayKey();
  const notified = await loadNotifiedMilestones(userId, date);
  const unlocked = buildDailyStepAchievements(todaySteps).filter(
    (a) => a.unlocked && !notified.has(a.steps),
  );

  if (unlocked.length === 0) return;

  for (const achievement of unlocked) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏆 Step achievement unlocked!',
        body: `${achievement.label} — ${todaySteps.toLocaleString()} steps today!`,
        data: {
          type: 'step-achievement',
          milestone: achievement.steps,
        },
        ...(Platform.OS === 'android' && { channelId: 'step-reminders' }),
      },
      trigger: null,
    });
    notified.add(achievement.steps);
  }

  await saveNotifiedMilestones(userId, date, notified);
}
