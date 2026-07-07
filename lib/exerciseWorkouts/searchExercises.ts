import api from '../../api/axios';

export type ExerciseSearchParams = {
  search?: string;
  bodyPart?: string;
  target?: string;
  equipment?: string;
  limit?: number;
  offset?: number;
};

export type ExerciseEnhancePagination = {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
  nextOffset: number | null;
};

export type ExerciseEnhanceResponse = {
  success: boolean;
  message?: string;
  count?: number;
  exercises?: unknown[];
  pagination?: ExerciseEnhancePagination;
};

export function hasSearchFilters(params: ExerciseSearchParams): boolean {
  return Boolean(
    params.search?.trim() ||
      params.bodyPart?.trim() ||
      params.target?.trim() ||
      params.equipment?.trim(),
  );
}

export async function fetchExerciseEnhance(
  params: ExerciseSearchParams & { apiKey?: string },
): Promise<ExerciseEnhanceResponse> {
  const body: Record<string, unknown> = {
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
  };

  if (params.search?.trim()) body.search = params.search.trim();
  if (params.bodyPart?.trim()) body.bodyPart = params.bodyPart.trim();
  if (params.target?.trim()) body.target = params.target.trim();
  if (params.equipment?.trim()) body.equipment = params.equipment.trim();

  if (!hasSearchFilters(params) && params.apiKey) {
    body.apiKey = params.apiKey;
  }

  const json = (await api.post(
    '/api/exercise-recognition/enhance',
    body,
  )) as ExerciseEnhanceResponse;

  if (json?.success === false) {
    throw new Error(json.message || 'Failed to fetch exercises');
  }

  return json;
}
