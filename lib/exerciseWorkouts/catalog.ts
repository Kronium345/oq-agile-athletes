import { SERVER_URL } from '../../api/axios';
import { getCachedExercises } from '../../services/exerciseCache';
import type { CatalogExercise, ExerciseWorkoutContext } from './types';

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function toCatalogExercise(raw: Record<string, unknown>): CatalogExercise | null {
  const id = raw.id;
  const name = raw.name;
  if (typeof id !== 'string' || typeof name !== 'string') return null;

  let gifUrl = typeof raw.gifUrl === 'string' ? raw.gifUrl : '';
  if (gifUrl.startsWith('/api/')) {
    gifUrl = `${SERVER_URL}${gifUrl}`;
  } else if (!gifUrl) {
    gifUrl = `${SERVER_URL}/api/exercise-recognition/image/${id}`;
  }

  return {
    id,
    name,
    gifUrl,
    equipment: String(raw.equipment ?? 'Not specified'),
    bodyPart: String(raw.bodyPart ?? 'Not specified'),
    target: String(raw.target ?? 'Not specified'),
  };
}

export async function loadCatalogExercises(): Promise<CatalogExercise[]> {
  const cached = await getCachedExercises();
  if (!cached?.exercises?.length) return [];

  return cached.exercises
    .map((item) => toCatalogExercise(item as Record<string, unknown>))
    .filter((item): item is CatalogExercise => item != null);
}

export function contextToCatalogExercise(
  context: ExerciseWorkoutContext,
): CatalogExercise {
  return {
    id: context.id,
    name: context.name,
    gifUrl: context.image ?? '',
    equipment: context.equipment ?? 'Not specified',
    bodyPart: context.exerciseType ?? 'Not specified',
    target: context.majorMuscle ?? 'Not specified',
  };
}

export function findSimilarCatalogExercises(
  context: ExerciseWorkoutContext,
  catalog: CatalogExercise[],
  limit = 2,
): CatalogExercise[] {
  const major = normalizeText(context.majorMuscle ?? '');
  const body = normalizeText(context.exerciseType ?? '');
  const selfId = context.id;
  const selfName = normalizeText(context.name);

  const scored = catalog
    .filter((ex) => ex.id !== selfId && normalizeText(ex.name) !== selfName)
    .map((ex) => {
      let score = 0;
      const exTarget = normalizeText(ex.target);
      const exBody = normalizeText(ex.bodyPart);
      if (major && (exTarget === major || exTarget.includes(major) || major.includes(exTarget))) {
        score += 3;
      }
      if (body && (exBody === body || exBody.includes(body) || body.includes(exBody))) {
        score += 2;
      }
      if (ex.equipment === context.equipment) score += 1;
      return { ex, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((row) => row.ex);
}
