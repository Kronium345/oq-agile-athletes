import { FALLBACK_COACH_LAUNCH } from '../../services/formCoachApi';

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function findFormCoachMatch(exerciseName: string): {
  id: string;
  name: string;
} | null {
  const target = normalizeName(exerciseName);
  if (!target) return null;

  for (const exercise of FALLBACK_COACH_LAUNCH) {
    const coachName = normalizeName(exercise.name);
    if (
      target === coachName ||
      target.includes(coachName) ||
      coachName.includes(target)
    ) {
      return { id: exercise.id, name: exercise.name };
    }
  }

  return null;
}
