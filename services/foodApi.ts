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

export type AnalyzeFoodResponse = {
  isFood: boolean;
  joke?: string;
  foodItems: ScannedFoodItem[];
  path?: string;
};

export type LastThreeDaysScan = {
  date: string;
  scans: FoodScanRecord[];
};

function authHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json' };
}

export async function analyzeFoodImage(
  imageBase64: string,
  token?: string | null,
): Promise<AnalyzeFoodResponse> {
  const headers: HeadersInit = { ...authHeaders() };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${SERVER_URL}/analyze-food`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ imageBase64 }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Scan failed' }));
    throw new Error(error.message || 'Scan failed');
  }

  return response.json();
}

export async function persistFoodScan(
  userId: string,
  imageBase64: string,
): Promise<FoodScanRecord> {
  const response = await api.post('/foodScan/analyze', {
    userId,
    imagePath: imageBase64.startsWith('data:')
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`,
  });
  return (response as FoodScanRecord) ?? (response as any)?.data;
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

export function sumScanNutrients(items: ScannedFoodItem[]) {
  return items.reduce(
    (acc, item) => {
      const n = normalizeNutrients(item.nutrients);
      return {
        calories: acc.calories + n.calories,
        protein: acc.protein + n.protein,
        carbs: acc.carbs + n.carbs,
        fats: acc.fats + n.fats,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  );
}
