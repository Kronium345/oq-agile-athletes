import api from '../api/axios';
import { USE_TRAINER_MOCKS } from '../lib/trainers/config';
import { MOCK_GROUPS, MOCK_PARTNERS } from '../lib/trainers/mocks';
import type { FitnessGroup, TrainingPartner } from '../types/trainer';

export async function listTrainingPartners(params?: {
  gymName?: string;
  goal?: string;
}): Promise<TrainingPartner[]> {
  if (USE_TRAINER_MOCKS) {
    let list = MOCK_PARTNERS;
    if (params?.gymName) {
      const g = params.gymName.toLowerCase();
      list = list.filter((p) => p.gymName?.toLowerCase().includes(g));
    }
    return list;
  }
  const query = new URLSearchParams();
  if (params?.gymName) query.set('gymName', params.gymName);
  if (params?.goal) query.set('goal', params.goal);
  const response = (await api.get(`/community/partners?${query}`)) as {
    success?: boolean;
    partners?: TrainingPartner[];
  };
  return response?.partners ?? [];
}

export async function requestPartnerConnect(userId: string): Promise<boolean> {
  if (USE_TRAINER_MOCKS) return true;
  const response = (await api.post(`/community/partners/${userId}/connect`)) as {
    success?: boolean;
  };
  return Boolean(response?.success);
}

export async function listGroups(params?: {
  postcode?: string;
}): Promise<FitnessGroup[]> {
  if (USE_TRAINER_MOCKS) return MOCK_GROUPS;
  const query = new URLSearchParams();
  if (params?.postcode) query.set('postcode', params.postcode);
  const response = (await api.get(`/community/groups?${query}`)) as {
    success?: boolean;
    groups?: FitnessGroup[];
  };
  return response?.groups ?? [];
}

export async function getGroupById(id: string): Promise<FitnessGroup | null> {
  if (USE_TRAINER_MOCKS) {
    return MOCK_GROUPS.find((g) => g.id === id) ?? null;
  }
  const response = (await api.get(`/community/groups/${id}`)) as {
    success?: boolean;
    group?: FitnessGroup;
  };
  return response?.group ?? null;
}
