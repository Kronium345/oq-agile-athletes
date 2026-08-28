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
    latitude: raw.latitude != null ? Number(raw.latitude) : undefined,
    longitude: raw.longitude != null ? Number(raw.longitude) : undefined,
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

const TRAINER_PROFILE_LOG = '[TrainerProfile]';

function logTrainerProfile(message: string, extra?: Record<string, unknown>) {
  if (__DEV__) {
    if (extra) console.log(TRAINER_PROFILE_LOG, message, extra);
    else console.log(TRAINER_PROFILE_LOG, message);
  }
}

export async function getMyTrainerProfile(): Promise<TrainerProfile | null> {
  if (USE_TRAINER_MOCKS) return null;
  try {
    const response = (await api.get('/trainers/me')) as {
      success?: boolean;
      trainer?: Record<string, unknown>;
    };
    if (!response?.trainer) return null;
    return normalizeProfile(response.trainer);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/not found/i.test(message)) {
      logTrainerProfile('No existing profile (GET /trainers/me 404)');
      return null;
    }
    logTrainerProfile('getMyTrainerProfile failed', { message });
    throw error;
  }
}

export async function createTrainerProfile(
  payload: TrainerProfileInput,
): Promise<TrainerProfile> {
  if (USE_TRAINER_MOCKS) {
    logTrainerProfile('Mock create (USE_TRAINER_MOCKS)', {
      published: payload.published,
    });
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
  logTrainerProfile('POST /trainers/profile', {
    displayName: payload.displayName,
    gymName: payload.gymName,
    postcode: payload.postcode,
    published: payload.published,
    specialtyCount: payload.specialties.length,
  });
  const response = (await api.post('/trainers/profile', payload)) as {
    success?: boolean;
    trainer?: Record<string, unknown>;
    error?: string;
  };
  if (!response?.trainer) {
    throw new Error(response?.error || 'Failed to create trainer profile');
  }
  logTrainerProfile('Profile created', { id: response.trainer.id });
  return normalizeProfile(response.trainer);
}

export async function updateTrainerProfile(
  payload: TrainerProfileInput,
): Promise<TrainerProfile> {
  if (USE_TRAINER_MOCKS) {
    return createTrainerProfile(payload);
  }
  logTrainerProfile('PUT /trainers/profile', {
    displayName: payload.displayName,
    published: payload.published,
  });
  const response = (await api.put('/trainers/profile', payload)) as {
    success?: boolean;
    trainer?: Record<string, unknown>;
    error?: string;
  };
  if (!response?.trainer) {
    throw new Error(response?.error || 'Failed to update trainer profile');
  }
  logTrainerProfile('Profile updated', { id: response.trainer.id });
  return normalizeProfile(response.trainer);
}

/** Create or update — avoids 409 when profile already exists. */
export async function saveTrainerProfile(
  payload: TrainerProfileInput,
): Promise<TrainerProfile> {
  const existing = await getMyTrainerProfile();
  if (existing) {
    logTrainerProfile('Existing profile found — updating', { id: existing.id });
    return updateTrainerProfile(payload);
  }

  try {
    return await createTrainerProfile(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/already exists/i.test(message)) {
      logTrainerProfile('POST returned already exists — retrying as PUT');
      return updateTrainerProfile(payload);
    }
    logTrainerProfile('saveTrainerProfile failed', { message });
    throw error;
  }
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
