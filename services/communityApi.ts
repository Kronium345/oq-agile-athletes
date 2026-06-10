import api from '../api/axios';
import { discoverLocalGroups } from '../lib/community/discoverLocalGroups';
import { DEFAULT_SEARCH_RADIUS_KM } from '../lib/trainers/constants';
import { USE_TRAINER_MOCKS } from '../lib/trainers/config';
import { MOCK_CONNECTIONS, MOCK_GROUPS, MOCK_PARTNERS } from '../lib/trainers/mocks';
import type {
  FitnessGroup,
  PartnerConnection,
  TrainingPartner,
} from '../types/trainer';
import { updateMemberGym } from './trainersApi';
import { addFriend, getUserSuggestions } from './stepsSocialApi';

export type PartnerMatchingProfile = {
  userId: string;
  gender: string;
  experience: string;
  weight?: number;
  gymName: string;
  postcode: string;
  unit?: string;
};

/** Persists profile fields server-side before connect (backend reads JWT user, not POST body). */
export async function savePartnerMatchingProfile(
  data: PartnerMatchingProfile,
): Promise<void> {
  const gymName = data.gymName.trim();
  const postcode = data.postcode.trim().toUpperCase();

  await api.put(`/user/${data.userId}`, {
    gender: data.gender.trim(),
    experience: data.experience.trim(),
    gymName,
    postcode,
    unit: data.unit ?? 'kg',
    ...(data.weight != null &&
      !Number.isNaN(data.weight) && { weight: data.weight }),
  });

  if (!USE_TRAINER_MOCKS) {
    try {
      await updateMemberGym({ gymName, postcode });
    } catch {
      // User PUT may already include gym fields
    }
  }
}

function normalizePartner(raw: Record<string, unknown>): TrainingPartner {
  const displayName = String(
    raw.displayName ?? raw.name ?? raw.username ?? 'Athlete',
  );
  return {
    userId: String(raw.userId ?? raw.id ?? raw._id ?? ''),
    displayName,
    avatar: (raw.avatar as string | null | undefined) ?? null,
    gymName: raw.gymName ? String(raw.gymName) : undefined,
    postcode: raw.postcode ? String(raw.postcode) : undefined,
    goal: raw.goal ? String(raw.goal) : undefined,
    experience: raw.experience
      ? String(raw.experience)
      : raw.experienceLevel
        ? String(raw.experienceLevel)
        : undefined,
    gender:
      raw.gender != null
        ? String(raw.gender)
        : raw.sex != null
          ? String(raw.sex)
          : undefined,
    weight: raw.weight != null ? Number(raw.weight) : undefined,
    unit: raw.unit ? String(raw.unit) : undefined,
  };
}

function normalizeConnection(raw: Record<string, unknown>): PartnerConnection | null {
  const id = String(raw.id ?? raw._id ?? '');
  if (!id) return null;

  const userRaw =
    (raw.user as Record<string, unknown> | undefined) ??
    (raw.partner as Record<string, unknown> | undefined) ??
    (raw.fromUser as Record<string, unknown> | undefined) ??
    raw;

  const user = normalizePartner(userRaw);
  if (!user.userId) return null;

  const status = String(raw.status ?? 'pending') as PartnerConnection['status'];
  const direction = String(
    raw.direction ?? 'incoming',
  ) as PartnerConnection['direction'];

  return {
    id,
    status,
    direction,
    user,
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
  };
}

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

function suggestionsAsPartners(
  gymName?: string,
): Promise<TrainingPartner[]> {
  return getUserSuggestions(25).then((users) =>
    users.map((user) => ({
      userId: user.userId,
      displayName: user.displayName,
      gymName,
    })),
  );
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

  try {
    const query = new URLSearchParams();
    if (params?.gymName) query.set('gymName', params.gymName);
    if (params?.goal) query.set('goal', params.goal);
    const response = (await api.get(`/community/partners?${query}`)) as {
      success?: boolean;
      partners?: TrainingPartner[];
    };
    if (response?.partners?.length) {
      return response.partners
        .map((p) => normalizePartner(p as Record<string, unknown>))
        .filter((p) => p.userId);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[Community] /community/partners unavailable, using suggestions', error);
    }
  }

  return suggestionsAsPartners(params?.gymName);
}

export type PartnerConnectResult = {
  ok: boolean;
  message?: string;
};

export async function requestPartnerConnect(
  userId: string,
): Promise<PartnerConnectResult> {
  if (USE_TRAINER_MOCKS) {
    return { ok: true };
  }

  try {
    const response = (await api.post(
      `/community/partners/${userId}/connect`,
      {},
    )) as { success?: boolean; message?: string };
    if (response?.success) {
      return { ok: true, message: response.message };
    }
  } catch (error) {
    if (__DEV__) {
      console.warn(
        '[Community] /community/partners/connect unavailable, trying /user/friends',
        error,
      );
    }
  }

  try {
    const ok = await addFriend(userId);
    return ok
      ? { ok: true, message: 'Friend request sent' }
      : { ok: false, message: 'Could not send friend request' };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not send request';
    return { ok: false, message };
  }
}

export async function listGroups(params?: {
  postcode?: string;
  latitude?: number;
  longitude?: number;
  /** Required by the API for geo filter; defaults when postcode is set. */
  radiusKm?: number;
  /** When true, query OpenStreetMap if the API returns nothing (needs lat/lng). */
  discoverIfEmpty?: boolean;
}): Promise<FitnessGroup[]> {
  if (USE_TRAINER_MOCKS) return MOCK_GROUPS;

  const radiusKm = params?.radiusKm ?? DEFAULT_SEARCH_RADIUS_KM;

  try {
    const query = new URLSearchParams();
    if (params?.postcode) {
      query.set('postcode', params.postcode);
      query.set('radiusKm', String(radiusKm));
    }
    if (params?.latitude != null && params?.longitude != null) {
      query.set('latitude', String(params.latitude));
      query.set('longitude', String(params.longitude));
      query.set('radiusKm', String(radiusKm));
    }
    const response = (await api.get(`/community/groups?${query}`)) as {
      success?: boolean;
      groups?: Record<string, unknown>[];
    };
    if (response?.groups?.length) {
      return response.groups
        .map((raw) => ({ ...normalizeGroup(raw), source: 'api' as const }))
        .filter((g) => g.id);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[Community] /community/groups unavailable', error);
    }
  }

  if (
    params?.discoverIfEmpty !== false &&
    params?.latitude != null &&
    params?.longitude != null
  ) {
    try {
      return await discoverLocalGroups(
        params.latitude,
        params.longitude,
        radiusKm,
      );
    } catch (error) {
      if (__DEV__) {
        console.warn('[Community] OpenStreetMap discovery failed', error);
      }
    }
  }

  return [];
}

export async function listPendingConnections(): Promise<PartnerConnection[]> {
  if (USE_TRAINER_MOCKS) {
    return [...MOCK_CONNECTIONS.pending];
  }
  try {
    const response = (await api.get('/community/connections/pending')) as {
      success?: boolean;
      requests?: Record<string, unknown>[];
      connections?: Record<string, unknown>[];
    };
    const rows = response?.requests ?? response?.connections ?? [];
    return rows
      .map((row) => normalizeConnection(row))
      .filter((row): row is PartnerConnection => row != null);
  } catch (error) {
    if (__DEV__) {
      console.warn('[Community] /community/connections/pending unavailable', error);
    }
    return [];
  }
}

export async function listAcceptedConnections(): Promise<PartnerConnection[]> {
  if (USE_TRAINER_MOCKS) {
    return [...MOCK_CONNECTIONS.accepted];
  }
  try {
    const response = (await api.get('/community/connections')) as {
      success?: boolean;
      connections?: Record<string, unknown>[];
    };
    return (response?.connections ?? [])
      .map((row) => normalizeConnection({ ...row, status: 'accepted' }))
      .filter((row): row is PartnerConnection => row != null);
  } catch (error) {
    if (__DEV__) {
      console.warn('[Community] /community/connections unavailable', error);
    }
    return [];
  }
}

export async function getPendingConnectionCount(): Promise<number> {
  const pending = await listPendingConnections();
  return pending.filter(
    (item) => item.direction === 'incoming' && item.status === 'pending',
  ).length;
}

export async function acceptConnection(requestId: string): Promise<boolean> {
  if (USE_TRAINER_MOCKS) return true;
  const response = (await api.post(
    `/community/connections/${requestId}/accept`,
    {},
  )) as { success?: boolean };
  return Boolean(response?.success);
}

export async function declineConnection(requestId: string): Promise<boolean> {
  if (USE_TRAINER_MOCKS) return true;
  const response = (await api.post(
    `/community/connections/${requestId}/decline`,
    {},
  )) as { success?: boolean };
  return Boolean(response?.success);
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
