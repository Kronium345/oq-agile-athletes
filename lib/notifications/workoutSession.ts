import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_WORKOUT_KEY = 'activeWorkoutSession';
const PENDING_RESUME_NOTIFICATION_KEY = 'pendingWorkoutResumeNotificationId';

export type ActiveWorkoutSession = {
  startedAt: string;
  exerciseCount: number;
  completedCount: number;
};

export async function setActiveWorkoutSession(
  session: ActiveWorkoutSession,
): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify(session));
}

export async function getActiveWorkoutSession(): Promise<ActiveWorkoutSession | null> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_WORKOUT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveWorkoutSession;
  } catch {
    return null;
  }
}

export async function clearActiveWorkoutSession(): Promise<void> {
  await AsyncStorage.multiRemove([
    ACTIVE_WORKOUT_KEY,
    PENDING_RESUME_NOTIFICATION_KEY,
  ]);
}

export async function setPendingResumeNotificationId(
  id: string,
): Promise<void> {
  await AsyncStorage.setItem(PENDING_RESUME_NOTIFICATION_KEY, id);
}

export async function getPendingResumeNotificationId(): Promise<string | null> {
  return AsyncStorage.getItem(PENDING_RESUME_NOTIFICATION_KEY);
}
