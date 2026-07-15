import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { SERVER_URL } from '../api/axios';

export type FoodNutrients = {
  calories?: number;
  fats?: number;
  carbs?: number;
  protein?: number;
  proteins?: number;
  carbohydrates?: number;
  vitamins?: string[];
  minerals?: string[];
};

export type ScannedFoodItem = {
  name: string;
  confidence: number;
  nutrients?: FoodNutrients | null;
};

export type FoodLogEntry = {
  _id?: string;
  userId?: string;
  label: string;
  cal: number;
  carbohydrates: number;
  fats: number;
  proteins: number;
  sugars: number;
  imageUrl?: string;
  createdAt?: string;
  date?: string;
};

export type FoodScanRecord = {
  _id?: string;
  userId?: string;
  date: string;
  foodItems: ScannedFoodItem[];
};

export type FoodProviderMeta = {
  provider?: string;
  model?: string;
};

export type VisionSuggestion = {
  name: string;
  confidence?: number;
};

export type FoodAnalyzePayload = {
  success: boolean;
  saved?: boolean;
  isFood?: boolean;
  identificationQuality?: 'high' | 'low' | string;
  primary?: ScannedFoodItem | null;
  foodItems?: ScannedFoodItem[];
  alternates?: ScannedFoodItem[];
  visionSuggestion?: VisionSuggestion | null;
  needsManualSelection?: boolean;
  allowManualSearch?: boolean;
  confidenceWarning?: string;
  message?: string;
  joke?: string;
  vision?: FoodProviderMeta;
  nutrition?: FoodProviderMeta;
  path?: string;
};

export type AnalyzeFoodOutcome =
  | {
      kind: 'logged';
      primary: ScannedFoodItem;
      total: ReturnType<typeof normalizeNutrients>;
      providers?: { vision?: string; nutrition?: string };
      raw: FoodAnalyzePayload;
    }
  | {
      kind: 'needs_pick';
      suggestion: VisionSuggestion | null;
      alternates: ScannedFoodItem[];
      message?: string;
      allowManualSearch: boolean;
      providers?: { vision?: string; nutrition?: string };
      raw: FoodAnalyzePayload;
    }
  | {
      kind: 'not_food';
      message: string;
      raw: FoodAnalyzePayload;
    };

export type FoodSearchResult = {
  name: string;
  nutrients?: FoodNutrients | null;
};

export type LastThreeDaysScan = {
  date: string;
  scans: FoodScanRecord[];
};

async function getAuthToken(): Promise<string | null> {
  const sessionToken = await AsyncStorage.getItem('session');
  const legacyToken = await AsyncStorage.getItem('token');
  return sessionToken || legacyToken;
}

function toImagePayload(imageBase64: string): string {
  if (imageBase64.startsWith('data:')) return imageBase64;
  return `data:image/jpeg;base64,${imageBase64}`;
}

function parseApiError(data: unknown, status: number): string {
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (typeof record.message === 'string') return record.message;
    if (typeof record.error === 'string') return record.error;
  }

  switch (status) {
    case 401:
      return 'Please sign in to scan food.';
    case 422:
      return "Couldn't detect food. Try another photo.";
    case 429:
    case 502:
    case 503:
    case 504:
      return 'Food scanner is busy. Please try again in a moment.';
    default:
      return 'Food scan failed. Please try again.';
  }
}

function asFoodItem(raw: unknown): ScannedFoodItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const name = record.name;
  if (typeof name !== 'string' || !name.trim()) return null;
  return {
    name: name.trim(),
    confidence:
      typeof record.confidence === 'number' ? record.confidence : 0,
    nutrients:
      record.nutrients && typeof record.nutrients === 'object'
        ? (record.nutrients as FoodNutrients)
        : null,
  };
}

function asFoodItems(raw: unknown): ScannedFoodItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(asFoodItem)
    .filter((item): item is ScannedFoodItem => item != null);
}

/** Trusted meal total = primary only (never sum alternates). */
export function getPrimaryFoodItem(
  payload: Pick<FoodAnalyzePayload, 'primary' | 'foodItems'>,
): ScannedFoodItem | null {
  return (
    asFoodItem(payload.primary) ??
    (Array.isArray(payload.foodItems) ? asFoodItem(payload.foodItems[0]) : null)
  );
}

export function normalizeNutrients(n?: FoodNutrients | null) {
  if (!n) {
    return { calories: 0, protein: 0, carbs: 0, fats: 0 };
  }
  return {
    calories: n.calories ?? 0,
    protein: n.protein ?? n.proteins ?? 0,
    carbs: n.carbs ?? n.carbohydrates ?? 0,
    fats: n.fats ?? 0,
  };
}

/** Prefer primary-only totals. Only sum when a scan stored a single logged item list. */
export function sumScanNutrients(items: ScannedFoodItem[]) {
  if (!items?.length) {
    return { calories: 0, protein: 0, carbs: 0, fats: 0 };
  }
  // History rows should already be primary-only; still prefer first item for safety.
  return normalizeNutrients(items[0]?.nutrients);
}

function toOutcome(json: FoodAnalyzePayload, status: number): AnalyzeFoodOutcome {
  if (status === 422 || json.isFood === false) {
    return {
      kind: 'not_food',
      message:
        json.message ||
        json.joke ||
        "Couldn't detect food. Try another photo.",
      raw: json,
    };
  }

  if (json.success === false) {
    throw new Error(json.message || 'Food scan failed');
  }

  if (json.needsManualSelection || json.saved === false) {
    const suggestion =
      json.visionSuggestion && typeof json.visionSuggestion.name === 'string'
        ? {
            name: json.visionSuggestion.name,
            confidence: json.visionSuggestion.confidence,
          }
        : null;

    return {
      kind: 'needs_pick',
      suggestion,
      alternates: asFoodItems(json.alternates),
      message: json.message || json.confidenceWarning,
      allowManualSearch: json.allowManualSearch !== false,
      providers: {
        vision: json.vision?.provider,
        nutrition: json.nutrition?.provider,
      },
      raw: json,
    };
  }

  const primary = getPrimaryFoodItem(json);
  if (!primary) {
    return {
      kind: 'needs_pick',
      suggestion: null,
      alternates: asFoodItems(json.alternates),
      message: json.message || 'Pick a food to log.',
      allowManualSearch: true,
      providers: {
        vision: json.vision?.provider,
        nutrition: json.nutrition?.provider,
      },
      raw: json,
    };
  }

  return {
    kind: 'logged',
    primary,
    total: normalizeNutrients(primary.nutrients),
    providers: {
      vision: json.vision?.provider,
      nutrition: json.nutrition?.provider,
    },
    raw: json,
  };
}

/**
 * Primary meal photo flow — Node proxy (Gemini + FitVete server-side).
 * Prefer this when you want history auto-save on high confidence.
 */
export async function analyzeFoodScan(params: {
  userId: string;
  imageBase64: string;
}): Promise<AnalyzeFoodOutcome> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Please sign in to scan food.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const res = await fetch(`${SERVER_URL}/foodScan/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: JSON.stringify({
        userId: params.userId,
        // Legacy field name — value is base64, not a filesystem path
        imagePath: toImagePayload(params.imageBase64),
      }),
      signal: controller.signal,
    });

    const json = (await res.json().catch(() => ({}))) as FoodAnalyzePayload;

    if (res.status === 422) {
      return toOutcome({ ...json, isFood: false, success: true }, 422);
    }

    if (!res.ok && json.success !== true) {
      throw new Error(parseApiError(json, res.status));
    }

    return toOutcome(json, res.status);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Food scan timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/** Preview-only analyze (no Mongo persist). Prefer analyzeFoodScan for logging. */
export async function analyzeFoodImage(
  imageBase64: string,
): Promise<AnalyzeFoodOutcome> {
  const token = await getAuthToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${SERVER_URL}/analyze-food`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ imageBase64: toImagePayload(imageBase64) }),
      signal: controller.signal,
    });

    const json = (await res.json().catch(() => ({}))) as FoodAnalyzePayload;

    if (res.status === 422) {
      return toOutcome({ ...json, isFood: false, success: true }, 422);
    }

    if (!res.ok && json.success !== true) {
      throw new Error(parseApiError(json, res.status));
    }

    return toOutcome(json, res.status);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Food scan timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/** Persist one confirmed food after low-confidence pick / search. */
export async function confirmFoodPick(params: {
  userId: string;
  foodName: string;
}): Promise<{
  primary: ScannedFoodItem | null;
  total: ReturnType<typeof normalizeNutrients>;
  raw: FoodAnalyzePayload;
}> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Please sign in to save food.');
  }

  const res = await fetch(`${SERVER_URL}/foodScan/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: JSON.stringify({
      userId: params.userId,
      foodName: params.foodName,
    }),
  });

  const json = (await res.json().catch(() => ({}))) as FoodAnalyzePayload;
  if (!res.ok || json.success === false) {
    throw new Error(parseApiError(json, res.status));
  }

  const primary = getPrimaryFoodItem(json);
  return {
    primary,
    total: normalizeNutrients(primary?.nutrients),
    raw: json,
  };
}

/** Manual search via Node (FitVete/USDA on server). */
export async function searchFoods(
  query: string,
  limit = 8,
): Promise<FoodSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const token = await getAuthToken();
  const headers: HeadersInit = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(
    `${SERVER_URL}/foodScan/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    { headers },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(parseApiError(json, res.status));
  }

  const results = Array.isArray(json?.results) ? json.results : [];
  return results
    .map((item: unknown) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const name = record.name;
      if (typeof name !== 'string' || !name.trim()) return null;
      return {
        name: name.trim(),
        nutrients:
          record.nutrients && typeof record.nutrients === 'object'
            ? (record.nutrients as FoodNutrients)
            : null,
      } satisfies FoodSearchResult;
    })
    .filter((item: FoodSearchResult | null): item is FoodSearchResult => item != null);
}

export async function getFoodLogs(userId: string): Promise<FoodLogEntry[]> {
  const response = await api.get(`/food/log/${userId}`);
  return (response as FoodLogEntry[]) ?? (response as any)?.data ?? [];
}

export async function logFoodItem(payload: {
  userId: string;
  label: string;
  cal: number;
  carbohydrates: number;
  fats: number;
  proteins: number;
  sugars: number;
  imageUrl?: string;
}): Promise<FoodLogEntry> {
  const response = await api.post('/food/log', payload);
  return (response as FoodLogEntry) ?? (response as any)?.data;
}

export async function getLastThreeDaysScans(): Promise<LastThreeDaysScan[]> {
  const response = await api.get('/foodScan/scans/last-three-days');
  if (Array.isArray(response)) return response as LastThreeDaysScan[];
  return (response as any)?.data ?? [];
}

export async function getScansForMonth(
  year: number,
  month: number,
): Promise<{ totalScans: number; scans: FoodScanRecord[] }> {
  const response = await api.get(`/foodScan/scans/month/${year}/${month}`);
  return (response as any) ?? { totalScans: 0, scans: [] };
}

export async function getScansForWeek(): Promise<{
  totalScans: number;
  scans: FoodScanRecord[];
}> {
  const response = await api.get('/foodScan/scans/week');
  return (response as any) ?? { totalScans: 0, scans: [] };
}

export async function getScansForToday(): Promise<{
  totalScans: number;
  scans: FoodScanRecord[];
}> {
  const response = await api.get('/foodScan/scans/today');
  return (response as any) ?? { totalScans: 0, scans: [] };
}

export async function getScansForDate(
  date: string,
): Promise<{ scans: FoodScanRecord | FoodScanRecord[] | null }> {
  const response = await api.get(`/foodScan/scans/date/${date}`);
  return (response as any) ?? { scans: null };
}
