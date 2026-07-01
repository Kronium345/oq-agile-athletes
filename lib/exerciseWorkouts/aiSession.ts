import AsyncStorage from '@react-native-async-storage/async-storage';
import { AI_COACH_FORMAT_INSTRUCTIONS } from '../formatChatText';
import { getLocalTodayKey } from '../dailySteps';
import { requestChatGeneration } from '../../services/aiChatApi';
import type { ExerciseWorkoutContext } from './types';

const TEASER_VERSION = 'v1';

function teaserKey(userId: string, exerciseId: string, date: string): string {
  return `exercise_ai_teaser_${TEASER_VERSION}_${userId}_${exerciseId}_${date}`;
}

export async function canUseExerciseAiTeaser(
  userId: string | null,
  exerciseId: string,
  isPremium: boolean,
): Promise<boolean> {
  if (isPremium) return true;
  if (!userId) return false;

  const used = await AsyncStorage.getItem(
    teaserKey(userId, exerciseId, getLocalTodayKey()),
  );
  return !used;
}

export async function markExerciseAiTeaserUsed(
  userId: string,
  exerciseId: string,
): Promise<void> {
  await AsyncStorage.setItem(
    teaserKey(userId, exerciseId, getLocalTodayKey()),
    '1',
  );
}

export async function generateSingleExerciseAiSession(
  context: ExerciseWorkoutContext,
): Promise<string> {
  const equipment = context.equipment ?? 'not specified';
  const majorMuscle = context.majorMuscle ?? 'not specified';
  const exerciseType = context.exerciseType ?? 'not specified';

  const userPart = `Create a focused workout session using ONLY this single exercise: "${context.name}".

Equipment available: ${equipment}
Primary muscle: ${majorMuscle}
Exercise type: ${exerciseType}

Rules:
- Do not recommend, mention, or substitute any other exercises.
- Include a brief movement prep, working sets with reps and rest periods, an optional finisher using the same exercise, and a short cooldown note for muscles used.
- Keep it practical for a 10-20 minute session.
- This is wellness and training guidance, not medical advice.`;

  const prompt = `${AI_COACH_FORMAT_INSTRUCTIONS}\n\n${userPart}`;
  return requestChatGeneration(prompt, 'coach');
}
