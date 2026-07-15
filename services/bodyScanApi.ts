import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { SERVER_URL } from '../api/axios';

async function getAuthToken(): Promise<string | null> {
  const sessionToken = await AsyncStorage.getItem('session');
  const legacyToken = await AsyncStorage.getItem('token');
  return sessionToken || legacyToken;
}

export type BodyScanConfidence = 'low' | 'medium' | 'high' | string;

export type BodyScanMeasurementsCm = {
  neck?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  shoulders?: number;
  [key: string]: number | undefined;
};

export type BodyScanRecord = {
  id: string;
  createdAt: string;
  bodyFatPercent: number | null;
  bmi: number | null;
  leanMassKg: number | null;
  fatMassKg: number | null;
  measurementsCm: BodyScanMeasurementsCm;
  confidence: BodyScanConfidence;
  warnings: string[];
  disclaimer: string;
  usedSideView: boolean;
  heightCm: number | null;
  weightKg: number | null;
  age: number | null;
  sex: 'male' | 'female' | string | null;
};

export type BodyScanResult = {
  success: boolean;
  body_fat_percent: number | null;
  bmi: number | null;
  lean_mass_kg: number | null;
  fat_mass_kg: number | null;
  navy_bf_percent?: number | null;
  deurenberg_bf_percent?: number | null;
  method?: string | null;
  confidence: BodyScanConfidence;
  warnings: string[];
  measurements_cm: BodyScanMeasurementsCm;
  used_side_view: boolean;
  disclaimer: string;
  scan: BodyScanRecord | null;
  error?: string;
};

export type BodyScanHealthResponse = {
  success: boolean;
  enabled: boolean;
  ready: boolean;
  message?: string;
};

export type RunBodyScanParams = {
  frontUri: string;
  sideUri?: string;
  heightCm: number;
  weightKg: number;
  age: number;
  sex: 'male' | 'female';
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
      return 'Please sign in to run a body scan.';
    case 400:
      return 'Check your photos and stats, then try again. Full body must be visible.';
    case 413:
      return 'Image is too large (max 15MB). Try a smaller photo.';
    case 429:
      return 'Daily scan limit reached. Try again tomorrow.';
    case 502:
    case 503:
      return 'Body Scan is waking up. Please try again in a moment.';
    default:
      return 'Body scan failed. Please try again.';
  }
}

function imageMimeFromUri(uri: string): { name: string; type: string } {
  const rawName = uri.split('/').pop()?.split('?')[0] || 'photo.jpg';
  const name = rawName.includes('.') ? rawName : 'photo.jpg';
  const ext = name.split('.').pop()?.toLowerCase();

  const type =
    ext === 'png'
      ? 'image/png'
      : ext === 'webp'
        ? 'image/webp'
        : ext === 'heic' || ext === 'heif'
          ? 'image/heic'
          : 'image/jpeg';

  return { name, type };
}

async function resolveImageUriForUpload(
  uri: string,
  label: string,
): Promise<{ uri: string; cleanup: () => Promise<void> }> {
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

  const { name } = imageMimeFromUri(uri);
  const cacheDir = LegacyFileSystem.cacheDirectory;
  if (!cacheDir) {
    throw new Error('Could not access device storage for image upload.');
  }

  const dest = `${cacheDir}body-scan-${label}-${Date.now()}-${name}`;
  await LegacyFileSystem.copyAsync({ from: uri, to: dest });

  return {
    uri: dest,
    cleanup: () => LegacyFileSystem.deleteAsync(dest, { idempotent: true }),
  };
}

function appendImage(
  form: FormData,
  field: string,
  uri: string,
  fallbackName: string,
) {
  const { name, type } = imageMimeFromUri(uri);
  form.append(field, {
    uri,
    name: name.includes('.') ? name : fallbackName,
    type,
  } as unknown as Blob);
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).filter(Boolean);
}

function normalizeMeasurements(raw: unknown): BodyScanMeasurementsCm {
  if (!raw || typeof raw !== 'object') return {};
  const out: BodyScanMeasurementsCm = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const num = toNumberOrNull(value);
    if (num != null) out[key] = num;
  }
  return out;
}

function normalizeScanRecord(raw: unknown): BodyScanRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const id = record.id;
  if (id == null) return null;

  return {
    id: String(id),
    createdAt: String(record.createdAt ?? record.created_at ?? ''),
    bodyFatPercent: toNumberOrNull(
      record.bodyFatPercent ?? record.body_fat_percent,
    ),
    bmi: toNumberOrNull(record.bmi),
    leanMassKg: toNumberOrNull(record.leanMassKg ?? record.lean_mass_kg),
    fatMassKg: toNumberOrNull(record.fatMassKg ?? record.fat_mass_kg),
    measurementsCm: normalizeMeasurements(
      record.measurementsCm ?? record.measurements_cm,
    ),
    confidence: String(record.confidence ?? 'medium'),
    warnings: toStringArray(record.warnings),
    disclaimer: String(record.disclaimer ?? ''),
    usedSideView: Boolean(record.usedSideView ?? record.used_side_view),
    heightCm: toNumberOrNull(record.heightCm ?? record.height_cm),
    weightKg: toNumberOrNull(record.weightKg ?? record.weight_kg),
    age: toNumberOrNull(record.age),
    sex:
      record.sex == null
        ? null
        : (String(record.sex).toLowerCase() as BodyScanRecord['sex']),
  };
}

function normalizeBodyScanResult(data: unknown): BodyScanResult {
  const record =
    data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const scan = normalizeScanRecord(record.scan);

  return {
    success: record.success !== false,
    body_fat_percent: toNumberOrNull(
      record.body_fat_percent ?? scan?.bodyFatPercent,
    ),
    bmi: toNumberOrNull(record.bmi ?? scan?.bmi),
    lean_mass_kg: toNumberOrNull(record.lean_mass_kg ?? scan?.leanMassKg),
    fat_mass_kg: toNumberOrNull(record.fat_mass_kg ?? scan?.fatMassKg),
    navy_bf_percent: toNumberOrNull(record.navy_bf_percent),
    deurenberg_bf_percent: toNumberOrNull(record.deurenberg_bf_percent),
    method: record.method == null ? null : String(record.method),
    confidence: String(
      record.confidence ?? scan?.confidence ?? 'medium',
    ) as BodyScanConfidence,
    warnings: toStringArray(record.warnings ?? scan?.warnings),
    measurements_cm: normalizeMeasurements(
      record.measurements_cm ?? scan?.measurementsCm,
    ),
    used_side_view: Boolean(
      record.used_side_view ?? scan?.usedSideView ?? false,
    ),
    disclaimer: String(record.disclaimer ?? scan?.disclaimer ?? ''),
    scan,
  };
}

export async function getBodyScanHealth(): Promise<BodyScanHealthResponse> {
  const res = await fetch(`${SERVER_URL}/api/body-scan/health`);
  const data = (await res.json().catch(() => ({}))) as BodyScanHealthResponse;
  if (!res.ok) {
    throw new Error(parseApiError(data, res.status));
  }
  return {
    success: data.success !== false,
    enabled: Boolean(data.enabled),
    ready: Boolean(data.ready),
    message: data.message,
  };
}

export async function runBodyScan(
  params: RunBodyScanParams,
  allowRetry = true,
): Promise<BodyScanResult> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Please sign in to run a body scan.');
  }

  const frontResolved = await resolveImageUriForUpload(params.frontUri, 'front');
  const sideResolved = params.sideUri
    ? await resolveImageUriForUpload(params.sideUri, 'side')
    : null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);

  if (__DEV__) {
    console.log('[BodyScan] Uploading', {
      platform: Platform.OS,
      server: `${SERVER_URL}/api/body-scan`,
      hasSide: Boolean(params.sideUri),
    });
  }

  try {
    const form = new FormData();
    appendImage(form, 'front_image', frontResolved.uri, 'front.jpg');
    if (sideResolved) {
      appendImage(form, 'side_image', sideResolved.uri, 'side.jpg');
    }
    form.append('height_cm', String(params.heightCm));
    form.append('weight_kg', String(params.weightKg));
    form.append('age', String(params.age));
    form.append('sex', params.sex);

    const res = await fetch(`${SERVER_URL}/api/body-scan`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: form,
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));

    if ((res.status === 502 || res.status === 503) && allowRetry) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return runBodyScan(params, false);
    }

    if (!res.ok || (data && typeof data === 'object' && data.success === false)) {
      throw new Error(parseApiError(data, res.status));
    }

    return normalizeBodyScanResult(data);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Body scan timed out. Check your connection and try again.');
    }
    if (error instanceof TypeError && error.message.includes('Network')) {
      throw new Error(
        'Network error — check your connection and that the API server is running.',
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    await frontResolved.cleanup().catch(() => {});
    await sideResolved?.cleanup().catch(() => {});
  }
}

export async function getBodyScanHistory(limit = 20): Promise<BodyScanRecord[]> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Please sign in to view scan history.');
  }

  const res = await fetch(
    `${SERVER_URL}/api/body-scan/history?limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(parseApiError(data, res.status));
  }

  const scans = Array.isArray(data?.scans) ? data.scans : [];
  return scans
    .map(normalizeScanRecord)
    .filter((item: BodyScanRecord | null): item is BodyScanRecord => item != null);
}

export async function getLatestBodyScan(): Promise<BodyScanRecord | null> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Please sign in to view your latest scan.');
  }

  const res = await fetch(`${SERVER_URL}/api/body-scan/latest`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(parseApiError(data, res.status));
  }

  return normalizeScanRecord(data?.scan);
}

/** Prefill helpers from profile / onboarding fields. */
export function resolveSexFromProfile(
  user: Record<string, unknown> | null | undefined,
): 'male' | 'female' | null {
  const raw = user?.gender ?? user?.sex;
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim().toLowerCase();
  if (normalized === 'male' || normalized === 'm') return 'male';
  if (normalized === 'female' || normalized === 'f') return 'female';
  return null;
}

export function resolveWeightKgFromProfile(
  user: Record<string, unknown> | null | undefined,
): number | undefined {
  const raw = user?.weight ?? user?.weightKg ?? user?.weight_kg;
  let value: number | undefined;
  if (typeof raw === 'number' && raw > 0) value = raw;
  if (typeof raw === 'string') {
    const parsed = parseFloat(raw);
    if (!Number.isNaN(parsed) && parsed > 0) value = parsed;
  }
  if (value == null) return undefined;

  const unit = String(user?.unit ?? 'kg').toLowerCase();
  if (unit === 'lbs' || unit === 'lb' || unit === 'pounds') {
    return Math.round(value * 0.453592 * 10) / 10;
  }
  return value;
}
