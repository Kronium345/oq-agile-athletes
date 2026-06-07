import AsyncStorage from '@react-native-async-storage/async-storage';
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

function parseApiError(data: unknown, status: number): string {
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (typeof record.error === 'string') return record.error;
    if (typeof record.message === 'string') return record.message;
    if (typeof record.detail === 'string') return record.detail;
  }

  switch (status) {
    case 401:
      return 'Please sign in to analyze your form.';
    case 400:
      return 'Invalid video or unsupported exercise. Use a short squat clip.';
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

export async function getFormCoachHealth(): Promise<FormCoachHealthResponse> {
  const res = await fetch(`${SERVER_URL}/api/form-coach/health`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(parseApiError(data, res.status));
  }
  return data as FormCoachHealthResponse;
}

export async function analyzeFormVideo(
  videoUri: string,
  exercise = 'squat',
  allowRetry = true,
): Promise<AnalyzeFormResponse> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Please sign in to analyze your form.');
  }

  const { name, type } = videoMimeFromUri(videoUri);
  const formData = new FormData();
  formData.append('video', {
    uri: videoUri,
    name,
    type,
  } as unknown as Blob);
  formData.append('exercise', exercise);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const res = await fetch(`${SERVER_URL}/api/form-coach/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));

    if ((res.status === 502 || res.status === 503) && allowRetry) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return analyzeFormVideo(videoUri, exercise, false);
    }

    if (!res.ok) {
      throw new Error(parseApiError(data, res.status));
    }

    return data as AnalyzeFormResponse;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        'Analysis timed out. Use a shorter video (5–15 seconds).',
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
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
  return (data as { analyses?: FormCoachAnalysisRecord[] }).analyses ?? [];
}
