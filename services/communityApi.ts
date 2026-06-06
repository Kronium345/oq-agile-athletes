import api from '../api/axios';
import { DEFAULT_SEARCH_RADIUS_KM } from '../lib/trainers/constants';
import { USE_TRAINER_MOCKS } from '../lib/trainers/config';
import { MOCK_GROUPS, MOCK_PARTNERS } from '../lib/trainers/mocks';
import type { FitnessGroup, TrainingPartner } from '../types/trainer';

function normalizeGroup(raw: Record<string, unknown>): FitnessGroup {
  return {
    id: String(raw.id ?? raw._id ?? ''),
    name: String(raw.name ?? 'Group'),
    description: String(raw.description ?? ''),
    gymName: raw.gymName ? String(raw.gymName) : undefined,
    postcode: raw.postcode ? String(raw.postcode) : undefined,
    scheduleSummary: raw.scheduleSummary
      ? String(raw.scheduleSummary)
      : undefined,
    memberCount:
      raw.memberCount != null ? Number(raw.memberCount) : undefined,
  };
}

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
  /** Required by the API for geo filter; defaults when postcode is set. */
  radiusKm?: number;
}): Promise<FitnessGroup[]> {
  if (USE_TRAINER_MOCKS) return MOCK_GROUPS;
  try {
    const query = new URLSearchParams();
    if (params?.postcode) {
      query.set('postcode', params.postcode);
      query.set(
        'radiusKm',
        String(params.radiusKm ?? DEFAULT_SEARCH_RADIUS_KM),
      );
    }
    const response = (await api.get(`/community/groups?${query}`)) as {
      success?: boolean;
      groups?: Record<string, unknown>[];
    };
    if (!response?.groups?.length) return [];
    return response.groups.map(normalizeGroup).filter((g) => g.id);
  } catch {
    return [];
  }
}

export async function getGroupById(id: string): Promise<FitnessGroup | null> {
  if (USE_TRAINER_MOCKS) {
    return MOCK_GROUPS.find((g) => g.id === id) ?? null;
  }
  try {
    const response = (await api.get(`/community/groups/${id}`)) as {
      success?: boolean;
      group?: Record<string, unknown>;
    };
    if (!response?.group) return null;
    return normalizeGroup(response.group);
  } catch {
    return null;
  }
}
