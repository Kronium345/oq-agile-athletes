import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, UploadType } from 'expo-file-system';
import api, { SERVER_URL } from '../api/axios';
import { USE_TRAINER_MOCKS } from '../lib/trainers/config';
import { MOCK_TRAINER_VIDEOS } from '../lib/trainers/mocks';
import type { TrainerVideo, TrainerVideoInput } from '../types/trainer';

let mockVideos: TrainerVideo[] = [...MOCK_TRAINER_VIDEOS];

async function getAuthToken(): Promise<string | null> {
  const sessionToken = await AsyncStorage.getItem('session');
  const legacyToken = await AsyncStorage.getItem('token');
  return sessionToken || legacyToken;
}

function normalizeVideo(raw: Record<string, unknown>): TrainerVideo {
  return {
    id: String(raw.id ?? raw._id ?? ''),
    trainerId: String(raw.trainerId ?? ''),
    title: String(raw.title ?? 'Untitled'),
    description: raw.description ? String(raw.description) : undefined,
    playUrl: String(raw.playUrl ?? raw.videoUrl ?? ''),
    thumbnailUrl:
      raw.thumbnailUrl != null ? String(raw.thumbnailUrl) : undefined,
    durationSec:
      raw.durationSec != null ? Number(raw.durationSec) : undefined,
    assignedMemberIds: Array.isArray(raw.assignedMemberIds)
      ? raw.assignedMemberIds.map(String)
      : [],
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

function videoMimeFromUri(uri: string): { name: string; type: string } {
  const lower = uri.toLowerCase();
  const ext = lower.includes('.') ? lower.split('.').pop() : 'mp4';
  const type =
    ext === 'mov'
      ? 'video/quicktime'
      : ext === 'avi'
        ? 'video/x-msvideo'
        : ext === 'mkv'
          ? 'video/x-matroska'
          : 'video/mp4';
  return { name: `coach-video.${ext}`, type };
}

export async function listMyTrainerVideos(): Promise<TrainerVideo[]> {
  if (USE_TRAINER_MOCKS) {
    return [...mockVideos];
  }
  const response = (await api.get('/trainers/me/content')) as {
    success?: boolean;
    videos?: Record<string, unknown>[];
  };
  if (!response?.videos) return [];
  return response.videos.map(normalizeVideo).filter((v) => v.id);
}

export async function listAssignedTrainerVideos(): Promise<TrainerVideo[]> {
  if (USE_TRAINER_MOCKS) {
    const userRaw = await AsyncStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    const memberId = String(user?._id ?? user?.userId ?? '');
    return mockVideos.filter((v) => v.assignedMemberIds.includes(memberId));
  }
  const response = (await api.get('/trainers/content/assigned')) as {
    success?: boolean;
    videos?: Record<string, unknown>[];
  };
  if (!response?.videos) return [];
  return response.videos.map(normalizeVideo).filter((v) => v.id);
}

export async function listTrainerVideos(
  trainerId: string,
): Promise<TrainerVideo[]> {
  if (USE_TRAINER_MOCKS) {
    return mockVideos.filter((v) => v.trainerId === trainerId);
  }
  const response = (await api.get(`/trainers/${trainerId}/content`)) as {
    success?: boolean;
    videos?: Record<string, unknown>[];
  };
  if (!response?.videos) return [];
  return response.videos.map(normalizeVideo).filter((v) => v.id);
}

export async function uploadTrainerVideo(
  videoUri: string,
  input: TrainerVideoInput,
): Promise<TrainerVideo> {
  if (USE_TRAINER_MOCKS) {
    const { type } = videoMimeFromUri(videoUri);
    const video: TrainerVideo = {
      id: `tv_${Date.now()}`,
      trainerId: 'tr_1',
      title: input.title.trim() || 'Coach video',
      description: input.description?.trim() || undefined,
      playUrl: videoUri,
      assignedMemberIds: input.assignedMemberIds ?? [],
      createdAt: new Date().toISOString(),
    };
    mockVideos = [video, ...mockVideos];
    if (__DEV__) {
      console.log('[TrainerContent] Mock upload', { type, title: video.title });
    }
    return video;
  }

  const token = await getAuthToken();
  if (!token) throw new Error('Please sign in to upload videos.');

  const { type } = videoMimeFromUri(videoUri);
  const file = new File(videoUri);
  const uploadResult = await file.upload(
    `${SERVER_URL}/trainers/me/content`,
    {
      uploadType: UploadType.MULTIPART,
      fieldName: 'video',
      mimeType: type,
      parameters: {
        title: input.title,
        description: input.description ?? '',
        assignedMemberIds: JSON.stringify(input.assignedMemberIds ?? []),
      },
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  );

  let data: unknown = {};
  try {
    data = JSON.parse(uploadResult.body);
  } catch {
    data = {};
  }

  if (uploadResult.status < 200 || uploadResult.status >= 300) {
    const message =
      typeof data === 'object' &&
      data &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : 'Could not upload video.';
    throw new Error(message);
  }

  const record =
    typeof data === 'object' && data && 'video' in data
      ? (data as { video: Record<string, unknown> }).video
      : (data as Record<string, unknown>);
  return normalizeVideo(record);
}

export async function updateTrainerVideoAssignments(
  videoId: string,
  assignedMemberIds: string[],
): Promise<TrainerVideo> {
  if (USE_TRAINER_MOCKS) {
    const idx = mockVideos.findIndex((v) => v.id === videoId);
    if (idx < 0) throw new Error('Video not found');
    mockVideos[idx] = { ...mockVideos[idx], assignedMemberIds };
    return mockVideos[idx];
  }
  const response = (await api.put(`/trainers/me/content/${videoId}`, {
    assignedMemberIds,
  })) as { success?: boolean; video?: Record<string, unknown> };
  if (!response?.video) throw new Error('Could not update assignments');
  return normalizeVideo(response.video);
}

export async function deleteTrainerVideo(videoId: string): Promise<boolean> {
  if (USE_TRAINER_MOCKS) {
    mockVideos = mockVideos.filter((v) => v.id !== videoId);
    return true;
  }
  const response = (await api.delete(`/trainers/me/content/${videoId}`)) as {
    success?: boolean;
  };
  return Boolean(response?.success);
}

export function formatVideoDuration(sec?: number): string {
  if (sec == null || !Number.isFinite(sec)) return '';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
}

export function parseMemberIdsInput(raw: string): string[] {
  return raw
    .split(/[,\s]+/)
    .map((id) => id.trim())
    .filter(Boolean);
}
