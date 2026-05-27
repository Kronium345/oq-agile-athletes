import api from '../api/axios';

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export type WellnessCheckIn = {
  _id: string;
  mood: MoodLevel;
  note?: string;
  createdAt: string;
};

export type WellnessInsight = {
  summary: string;
  suggestion?: string;
};

export async function listCheckIns(limit = 14): Promise<WellnessCheckIn[]> {
  const response = await api.get(`/wellness/check-ins?limit=${limit}`);
  return (response as any)?.data ?? (response as WellnessCheckIn[]) ?? [];
}

export async function createCheckIn(payload: {
  mood: MoodLevel;
  note?: string;
}): Promise<WellnessCheckIn> {
  const response = await api.post('/wellness/check-ins', payload);
  return (response as any)?.data ?? (response as WellnessCheckIn);
}

export async function getWellnessInsight(): Promise<WellnessInsight | null> {
  const response = await api.get('/wellness/insight');
  return (response as any)?.data ?? (response as WellnessInsight) ?? null;
}
