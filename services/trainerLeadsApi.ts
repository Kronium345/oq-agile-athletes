import api from '../api/axios';
import { USE_TRAINER_MOCKS } from '../lib/trainers/config';
import { MOCK_LEADS } from '../lib/trainers/mocks';
import type { ContactRequestInput, TrainerLead } from '../types/trainer';

export async function submitContactRequest(
  trainerId: string,
  payload: ContactRequestInput,
): Promise<boolean> {
  if (USE_TRAINER_MOCKS) return true;
  const response = (await api.post(
    `/trainers/${trainerId}/contact-request`,
    payload,
  )) as { success?: boolean };
  return Boolean(response?.success);
}

export async function listMyLeads(): Promise<TrainerLead[]> {
  if (USE_TRAINER_MOCKS) return MOCK_LEADS;
  const response = (await api.get('/trainers/leads')) as {
    success?: boolean;
    leads?: TrainerLead[];
  };
  return response?.leads ?? [];
}
