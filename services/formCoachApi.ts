import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, UploadType } from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { SERVER_URL } from '../api/axios';

async function getAuthToken(): Promise<string | null> {
  const sessionToken = await AsyncStorage.getItem('session');
  const legacyToken = await AsyncStorage.getItem('token');
  return sessionToken || legacyToken;
}

export type FormCoachIssue = {
  issue: string;
  severity: string;
  feedback: string;
};

export type FormCoachAnalysisRecord = {
  id: string;
  exercise: string;
  score: number;
  issues: FormCoachIssue[];
  joint_angles: Record<string, number>;
  analyzedAt: string;
  videoUrl: string | null;
};

export type AnalyzeFormResponse = {
  success: boolean;
  exercise: string;
  score: number;
  issues: FormCoachIssue[];
  joint_angles: Record<string, number>;
  analysis?: FormCoachAnalysisRecord;
  error?: string;
};

export type FormCoachHealthResponse = {
  success: boolean;
  status: string;
  version: string;
  exercises: string[];
};

export type FormCoachExercise = {
  id: string;
  name: string;
  description: string;
  muscle_groups: string[];
  filming_tip: string;
  available: boolean;
};

export type FormCoachExercisesResponse = {
  success?: boolean;
  exercises: FormCoachExercise[];
  coach_enabled: string[];
  specialized: string[];
  coach_launch: string[];
};

/** MVP launch list — used if the catalog endpoint is unavailable. */
export const FALLBACK_COACH_LAUNCH: FormCoachExercise[] = [
  {
    id: 'back_squat',
    name: 'Back Squat',
    description: '',
    muscle_groups: ['quadriceps', 'glutes', 'core'],
    filming_tip:
      'Film from the side with your entire body visible from head to feet.',
    available: true,
  },
  {
    id: 'front_squat',
    name: 'Front Squat',
    description: '',
    muscle_groups: ['quadriceps', 'glutes', 'core'],
    filming_tip:
      'Film from the side with your entire body visible from head to feet.',
    available: true,
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    description: '',
    muscle_groups: ['hamstrings', 'glutes', 'back'],
    filming_tip:
      'Film from the side so your full spine and hip hinge are visible.',
    available: true,
  },
  {
    id: 'romanian_deadlift',
    name: 'Romanian Deadlift',
    description: '',
    muscle_groups: ['hamstrings', 'glutes', 'back'],
    filming_tip:
      'Film from the side so your full spine and hip hinge are visible.',
    available: true,
  },
  {
    id: 'bench_press',
    name: 'Bench Press',
    description: '',
    muscle_groups: ['chest', 'shoulders', 'triceps'],
    filming_tip:
      'Film from the side or at a slight angle so bar path and elbow position are visible.',
    available: true,
  },
  {
    id: 'overhead_press',
    name: 'Overhead Press',
    description: '',
    muscle_groups: ['shoulders', 'triceps', 'core'],
    filming_tip:
      'Film from the side with your full body visible from head to feet.',
    available: true,
  },
  {
    id: 'pull_up',
    name: 'Pull-Up',
    description: '',
    muscle_groups: ['back', 'biceps', 'core'],
    filming_tip:
      'Film from the side or front so your full range of motion is visible.',
    available: true,
  },
];

function parseApiError(data: unknown, status: number): string {
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (typeof record.error === 'string') return record.error;
    if (typeof record.message === 'string') return record.message;
    if (typeof record.detail === 'string') return record.detail;
    if (Array.isArray(record.detail)) {
      const first = record.detail[0];
      if (first && typeof first === 'object' && 'msg' in first) {
        return String((first as { msg: string }).msg);
      }
    }
  }

  switch (status) {
    case 401:
      return 'Please sign in to analyze your form.';
    case 400:
      return 'Invalid video or unsupported exercise. Use a short clip (5–15 seconds).';
    case 413:
      return 'Video is too large (max 50MB). Try a shorter clip.';
    case 429:
      return 'You can run up to 10 analyses per hour. Try again later.';
    case 502:
    case 503:
      return 'Form Coach is waking up. Please try again in a moment.';
    case 504:
      return 'Analysis timed out. Use a shorter video (5–15 seconds).';
    default:
      return 'Form analysis failed. Please try again.';
  }
}

function videoMimeFromUri(uri: string): { name: string; type: string } {
  const rawName = uri.split('/').pop() || 'squat.mp4';
  const name = rawName.includes('.') ? rawName : 'squat.mp4';
  const ext = name.split('.').pop()?.toLowerCase();

  const type =
    ext === 'mov'
      ? 'video/quicktime'
      : ext === 'avi'
        ? 'video/x-msvideo'
        : ext === 'mkv'
          ? 'video/x-matroska'
          : 'video/mp4';

  return { name, type };
}

/**
 * RN fetch+FormData often hangs on gallery/camera URIs (content://, ph://).
 * Copy to cache and upload via expo-file-system native multipart instead.
 */
async function resolveVideoUriForUpload(uri: string): Promise<{
  uri: string;
  cleanup: () => Promise<void>;
}> {
  const needsCopy =
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    uri.startsWith('assets-library://');

  if (!needsCopy && uri.startsWith('file://')) {
    const info = await LegacyFileSystem.getInfoAsync(uri);
    if (info.exists) {
      return { uri, cleanup: async () => {} };
    }
  }

  const { name } = videoMimeFromUri(uri);
  const cacheDir = LegacyFileSystem.cacheDirectory;
  if (!cacheDir) {
    throw new Error('Could not access device storage for video upload.');
  }

  const dest = `${cacheDir}form-coach-${Date.now()}-${name}`;
  await LegacyFileSystem.copyAsync({ from: uri, to: dest });

  return {
    uri: dest,
    cleanup: () => LegacyFileSystem.deleteAsync(dest, { idempotent: true }),
  };
}

function normalizeExercise(raw: unknown): FormCoachExercise | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const id = record.id;
  if (id == null) return null;

  const muscleRaw = record.muscle_groups ?? record.muscleGroups;
  const muscle_groups = Array.isArray(muscleRaw)
    ? muscleRaw.map(String)
    : [];

  return {
    id: String(id),
    name: String(record.name ?? humanizeExerciseId(String(id))),
    description: String(record.description ?? ''),
    muscle_groups,
    filming_tip: String(
      record.filming_tip ?? record.filmingTip ?? '',
    ),
    available: record.available !== false,
  };
}

export function humanizeExerciseId(id: string): string {
  return id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildExerciseNameMap(
  exercises: FormCoachExercise[],
): Map<string, string> {
  return new Map(exercises.map((item) => [item.id, item.name]));
}

export function resolveLaunchExercises(
  data: FormCoachExercisesResponse,
): FormCoachExercise[] {
  const all = (data.exercises ?? [])
    .map(normalizeExercise)
    .filter((item): item is FormCoachExercise => item != null);

  const launchIds = data.coach_launch ?? [];
  if (launchIds.length === 0) {
    return all.filter((item) => item.available);
  }

  const byId = new Map(all.map((item) => [item.id, item]));
  return launchIds
    .map((id) => byId.get(id))
    .filter((item): item is FormCoachExercise => item != null);
}

function normalizeIssue(raw: unknown): FormCoachIssue {
  if (!raw || typeof raw !== 'object') {
    return { issue: 'unknown', severity: 'low', feedback: '' };
  }
  const record = raw as Record<string, unknown>;
  return {
    issue: String(record.issue ?? 'unknown'),
    severity: String(record.severity ?? 'low'),
    feedback: String(record.feedback ?? ''),
  };
}

export function normalizeAnalysisRecord(
  raw: unknown,
): FormCoachAnalysisRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const id = record.id ?? record._id;
  if (id == null && record.score == null) return null;

  const issuesRaw = record.issues;
  const issues = Array.isArray(issuesRaw)
    ? issuesRaw.map(normalizeIssue)
    : [];

  const anglesRaw = record.joint_angles ?? record.jointAngles;
  const joint_angles =
    anglesRaw && typeof anglesRaw === 'object' && !Array.isArray(anglesRaw)
      ? (anglesRaw as Record<string, number>)
      : {};

  return {
    id: String(id ?? ''),
    exercise: String(record.exercise ?? 'squat'),
    score: Number(record.score ?? 0),
    issues,
    joint_angles,
    analyzedAt: String(
      record.analyzedAt ?? record.createdAt ?? new Date().toISOString(),
    ),
    videoUrl: record.videoUrl != null ? String(record.videoUrl) : null,
  };
}

export function normalizeAnalyzeResponse(data: unknown): AnalyzeFormResponse {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid analysis response from server.');
  }

  const record = data as Record<string, unknown>;
  const nested = normalizeAnalysisRecord(record.analysis);

  const issuesRaw = record.issues ?? nested?.issues;
  const issues = Array.isArray(issuesRaw)
    ? issuesRaw.map(normalizeIssue)
    : (nested?.issues ?? []);

  const anglesRaw =
    record.joint_angles ?? record.jointAngles ?? nested?.joint_angles;
  const joint_angles =
    anglesRaw && typeof anglesRaw === 'object' && !Array.isArray(anglesRaw)
      ? (anglesRaw as Record<string, number>)
      : (nested?.joint_angles ?? {});

  const score = Number(record.score ?? nested?.score ?? NaN);
  if (Number.isNaN(score)) {
    throw new Error('Analysis completed but no score was returned.');
  }

  return {
    success: record.success !== false,
    exercise: String(record.exercise ?? nested?.exercise ?? 'squat'),
    score,
    issues,
    joint_angles,
    analysis: nested ?? undefined,
  };
}

export async function getFormCoachHealth(): Promise<FormCoachHealthResponse> {
  const res = await fetch(`${SERVER_URL}/api/form-coach/health`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(parseApiError(data, res.status));
  }
  return data as FormCoachHealthResponse;
}

export async function getFormCoachExercises(): Promise<{
  launchExercises: FormCoachExercise[];
  nameById: Map<string, string>;
}> {
  const res = await fetch(`${SERVER_URL}/api/form-coach/exercises`);
  const data = (await res.json().catch(() => ({}))) as FormCoachExercisesResponse;

  if (!res.ok) {
    throw new Error(parseApiError(data, res.status));
  }

  const launchExercises = resolveLaunchExercises(data);
  if (launchExercises.length === 0) {
    return {
      launchExercises: FALLBACK_COACH_LAUNCH,
      nameById: buildExerciseNameMap(FALLBACK_COACH_LAUNCH),
    };
  }

  const catalog = (data.exercises ?? [])
    .map(normalizeExercise)
    .filter((item): item is FormCoachExercise => item != null);

  return {
    launchExercises,
    nameById: buildExerciseNameMap(catalog),
  };
}

export async function analyzeFormVideo(
  videoUri: string,
  exercise = 'back_squat',
  allowRetry = true,
): Promise<AnalyzeFormResponse> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Please sign in to analyze your form.');
  }

  const { type } = videoMimeFromUri(videoUri);
  const { uri: uploadUri, cleanup } = await resolveVideoUriForUpload(videoUri);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  if (__DEV__) {
    console.log('[FormCoach] Uploading video', {
      platform: Platform.OS,
      server: `${SERVER_URL}/api/form-coach/analyze`,
      uploadUri: uploadUri.slice(0, 80),
    });
  }

  try {
    const file = new File(uploadUri);
    const uploadResult = await file.upload(
      `${SERVER_URL}/api/form-coach/analyze`,
      {
        uploadType: UploadType.MULTIPART,
        fieldName: 'video',
        mimeType: type,
        parameters: { exercise },
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      },
    );

    if (__DEV__) {
      console.log('[FormCoach] Upload finished', {
        status: uploadResult.status,
      });
    }

    let data: unknown = {};
    try {
      data = JSON.parse(uploadResult.body);
    } catch {
      data = {};
    }

    const status = uploadResult.status;

    if ((status === 502 || status === 503) && allowRetry) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return analyzeFormVideo(videoUri, exercise, false);
    }

    if (status < 200 || status >= 300) {
      throw new Error(parseApiError(data, status));
    }

    return normalizeAnalyzeResponse(data);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        'Analysis timed out. Use a shorter video (5–15 seconds).',
      );
    }
    if (error instanceof TypeError && error.message.includes('Network')) {
      throw new Error(
        'Network error — check your connection and that the API server is running.',
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    await cleanup().catch(() => {});
  }
}

export async function getFormCoachHistory(
  limit = 20,
): Promise<FormCoachAnalysisRecord[]> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Please sign in to view history.');
  }

  const res = await fetch(
    `${SERVER_URL}/api/form-coach/history?limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(parseApiError(data, res.status));
  }

  const record = data as Record<string, unknown>;
  const list = record.analyses ?? record.data ?? record.history;
  if (!Array.isArray(list)) {
    return [];
  }

  return list
    .map(normalizeAnalysisRecord)
    .filter((item): item is FormCoachAnalysisRecord => item != null);
}
