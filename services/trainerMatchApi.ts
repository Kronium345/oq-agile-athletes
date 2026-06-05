import api from '../api/axios';
import { USE_TRAINER_MOCKS } from '../lib/trainers/config';
import { MOCK_MATCH_RESULT } from '../lib/trainers/mocks';
import type { TrainerMatchInput, TrainerMatchResult } from '../types/trainer';

export async function matchTrainers(
  payload: TrainerMatchInput,
): Promise<TrainerMatchResult> {
  if (USE_TRAINER_MOCKS) {
    return MOCK_MATCH_RESULT;
  }
  const response = (await api.post('/trainers/match', payload)) as {
    success?: boolean;
  } & TrainerMatchResult;
  if (!response?.trainers?.length) {
    throw new Error('No matching trainers found');
  }
  return {
    trainers: response.trainers,
    explanations: response.explanations ?? [],
  };
}
