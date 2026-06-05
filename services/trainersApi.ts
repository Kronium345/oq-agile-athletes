import api from '../api/axios';
import { USE_TRAINER_MOCKS } from '../lib/trainers/config';
import { filterMockTrainers, MOCK_TRAINERS } from '../lib/trainers/mocks';
import type {
  MemberGymProfile,
  TrainerListItem,
  TrainerProfile,
  TrainerProfileInput,
  TrainerReview,
} from '../types/trainer';

export type ListTrainersParams = {
  specialty?: string;
  q?: string;
  postcode?: string;
  radiusKm?: number;
  gymName?: string;
  limit?: number;
};

function normalizeListItem(raw: Record<string, unknown>): TrainerListItem {
  return {
    id: String(raw.id ?? raw._id ?? ''),
    userId: String(raw.userId ?? ''),
    displayName: String(raw.displayName ?? raw.name ?? 'Trainer'),
    avatar: (raw.avatar as string | null) ?? null,
    specialties: (raw.specialties as TrainerListItem['specialties']) ?? [],
    gymName: String(raw.gymName ?? ''),
    postcode: String(raw.postcode ?? ''),
    priceFrom: raw.priceFrom != null ? Number(raw.priceFrom) : undefined,
    priceUnit: raw.priceUnit as TrainerListItem['priceUnit'],
    verified: Boolean(raw.verified),
    featured: Boolean(raw.featured),
    distanceKm: raw.distanceKm != null ? Number(raw.distanceKm) : undefined,
    ratingAvg: raw.ratingAvg != null ? Number(raw.ratingAvg) : undefined,
    reviewCount: raw.reviewCount != null ? Number(raw.reviewCount) : undefined,
  };
}

function normalizeProfile(raw: Record<string, unknown>): TrainerProfile {
  const base = normalizeListItem(raw);
  return {
    ...base,
    bio: String(raw.bio ?? ''),
    qualifications: (raw.qualifications as string[]) ?? [],
    instagram: raw.instagram ? String(raw.instagram) : undefined,
    availabilityNotes: raw.availabilityNotes
      ? String(raw.availabilityNotes)
      : undefined,
    stripeConnectOnboarded: Boolean(raw.stripeConnectOnboarded),
    published: Boolean(raw.published ?? true),
  };
}

export async function listTrainers(
  params: ListTrainersParams = {},
): Promise<TrainerListItem[]> {
  if (USE_TRAINER_MOCKS) {
    return filterMockTrainers(params);
  }
  const query = new URLSearchParams();
  if (params.specialty) query.set('specialty', params.specialty);
  if (params.q) query.set('q', params.q);
  if (params.postcode) query.set('postcode', params.postcode);
  if (params.radiusKm != null) query.set('radiusKm', String(params.radiusKm));
  if (params.gymName) query.set('gymName', params.gymName);
  if (params.limit != null) query.set('limit', String(params.limit));
  const response = (await api.get(`/trainers?${query}`)) as {
    success?: boolean;
    trainers?: Record<string, unknown>[];
  };
  if (!response?.trainers) return [];
  return response.trainers.map(normalizeListItem).filter((t) => t.id);
}

export async function getTrainerById(id: string): Promise<TrainerProfile | null> {
  if (USE_TRAINER_MOCKS) {
    return MOCK_TRAINERS.find((t) => t.id === id) ?? null;
  }
  const response = (await api.get(`/trainers/${id}`)) as {
    success?: boolean;
    trainer?: Record<string, unknown>;
  };
  if (!response?.trainer) return null;
  return normalizeProfile(response.trainer);
}

export async function getMyTrainerProfile(): Promise<TrainerProfile | null> {
  if (USE_TRAINER_MOCKS) return null;
  const response = (await api.get('/trainers/me')) as {
    success?: boolean;
    trainer?: Record<string, unknown>;
  };
  if (!response?.trainer) return null;
  return normalizeProfile(response.trainer);
}

export async function createTrainerProfile(
  payload: TrainerProfileInput,
): Promise<TrainerProfile> {
  if (USE_TRAINER_MOCKS) {
    return {
      id: 'tr_new',
      userId: 'u_me',
      verified: false,
      published: payload.published ?? false,
      ...payload,
      specialties: payload.specialties,
      qualifications: payload.qualifications,
    };
  }
  const response = (await api.post('/trainers/profile', payload)) as {
    success?: boolean;
    trainer?: Record<string, unknown>;
  };
  if (!response?.trainer) throw new Error('Failed to create trainer profile');
  return normalizeProfile(response.trainer);
}

export async function updateTrainerProfile(
  payload: TrainerProfileInput,
): Promise<TrainerProfile> {
  if (USE_TRAINER_MOCKS) {
    return createTrainerProfile(payload);
  }
  const response = (await api.put('/trainers/profile', payload)) as {
    success?: boolean;
    trainer?: Record<string, unknown>;
  };
  if (!response?.trainer) throw new Error('Failed to update trainer profile');
  return normalizeProfile(response.trainer);
}

export async function updateMemberGym(
  payload: MemberGymProfile,
): Promise<boolean> {
  if (USE_TRAINER_MOCKS) return true;
  const response = (await api.put('/user/me/gym', payload)) as {
    success?: boolean;
  };
  return Boolean(response?.success);
}

export async function listSavedTrainers(): Promise<TrainerListItem[]> {
  if (USE_TRAINER_MOCKS) return MOCK_TRAINERS.slice(0, 1);
  const response = (await api.get('/trainers/saved')) as {
    success?: boolean;
    trainers?: Record<string, unknown>[];
  };
  if (!response?.trainers) return [];
  return response.trainers.map(normalizeListItem);
}

export async function saveTrainer(trainerId: string): Promise<boolean> {
  if (USE_TRAINER_MOCKS) return true;
  const response = (await api.post(`/trainers/${trainerId}/save`)) as {
    success?: boolean;
  };
  return Boolean(response?.success);
}

export async function unsaveTrainer(trainerId: string): Promise<boolean> {
  if (USE_TRAINER_MOCKS) return true;
  const response = (await api.delete(`/trainers/${trainerId}/save`)) as {
    success?: boolean;
  };
  return Boolean(response?.success);
}

export async function listTrainerReviews(
  trainerId: string,
): Promise<TrainerReview[]> {
  if (USE_TRAINER_MOCKS) {
    const { MOCK_REVIEWS } = await import('../lib/trainers/mocks');
    return MOCK_REVIEWS.filter((r) => r.trainerId === trainerId);
  }
  const response = (await api.get(`/trainers/${trainerId}/reviews`)) as {
    success?: boolean;
    reviews?: TrainerReview[];
  };
  return response?.reviews ?? [];
}

export async function submitTrainerReview(
  trainerId: string,
  payload: { rating: number; text: string },
): Promise<boolean> {
  if (USE_TRAINER_MOCKS) return true;
  const response = (await api.post(`/trainers/${trainerId}/reviews`, payload)) as {
    success?: boolean;
  };
  return Boolean(response?.success);
}

export function userHasTrainerProfile(
  user: Record<string, unknown> | null,
): boolean {
  if (!user) return false;
  const roles = user.roles;
  return Boolean(
    user.trainerProfile ||
      user.isTrainer ||
      (Array.isArray(roles) && roles.includes('trainer')),
  );
}
