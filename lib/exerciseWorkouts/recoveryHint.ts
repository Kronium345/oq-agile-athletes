import { getLocalTodayKey } from '../dailySteps';
import { loadLocalCheckIn } from '../performance/storage';
import type { StepStorageUser } from '../stepStorageKeys';

export type ExerciseRecoveryHint = {
  message: string;
  severity: 'info' | 'caution';
};

export async function getExerciseRecoveryHint(
  user: StepStorageUser,
): Promise<ExerciseRecoveryHint | null> {
  const today = getLocalTodayKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getLocalTodayKey(yesterday);

  const [todayCheckIn, yesterdayCheckIn] = await Promise.all([
    loadLocalCheckIn(user, today),
    loadLocalCheckIn(user, yesterdayKey),
  ]);

  const checkIn = todayCheckIn ?? yesterdayCheckIn;
  if (!checkIn) return null;

  if (checkIn.muscleSoreness >= 7) {
    return {
      severity: 'caution',
      message:
        'You logged high muscle soreness recently — consider the Beginner preset or fewer sets today.',
    };
  }

  if (checkIn.energy <= 4) {
    return {
      severity: 'caution',
      message:
        'Energy was low on your last check-in — a shorter session may feel better today.',
    };
  }

  if (checkIn.recoveryScore >= 75) {
    return {
      severity: 'info',
      message:
        'Recovery looks solid — good day to push the Standard or Burnout preset if you feel ready.',
    };
  }

  return null;
}
