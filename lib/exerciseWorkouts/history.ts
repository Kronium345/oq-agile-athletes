import api from '../../api/axios';
import type { ExerciseHistoryEntry, ExerciseHistoryStats } from './types';

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function pickHistoryRows(response: unknown): ExerciseHistoryEntry[] {
  if (!response || typeof response !== 'object') return [];
  const r = response as { success?: boolean; data?: unknown };
  if (Array.isArray(r.data)) return r.data as ExerciseHistoryEntry[];
  if (Array.isArray(response)) return response as ExerciseHistoryEntry[];
  return [];
}

export async function fetchExerciseHistory(
  userId: string,
  exerciseName: string,
): Promise<ExerciseHistoryStats> {
  const empty: ExerciseHistoryStats = {
    sessions: [],
    lastSession: null,
    sessionCount: 0,
    bestWeight: 0,
    bestVolume: 0,
    bestReps: 0,
  };

  if (!userId || !exerciseName.trim()) return empty;

  try {
    const response = await api.get(`/history/history?userId=${userId}`);
    const rows = pickHistoryRows(response);
    const target = normalizeName(exerciseName);

    const sessions = rows
      .filter((row) => normalizeName(row.exerciseName) === target)
      .sort(
        (a, b) =>
          new Date(b.timeStamp || b.createdAt).getTime() -
          new Date(a.timeStamp || a.createdAt).getTime(),
      );

    if (sessions.length === 0) return empty;

    const bestWeight = Math.max(...sessions.map((s) => s.weight ?? 0), 0);
    const bestReps = Math.max(...sessions.map((s) => s.reps ?? 0), 0);
    const bestVolume = Math.max(
      ...sessions.map((s) => (s.sets ?? 0) * (s.reps ?? 0) * (s.weight ?? 0)),
      0,
    );

    return {
      sessions,
      lastSession: sessions[0],
      sessionCount: sessions.length,
      bestWeight,
      bestVolume,
      bestReps,
    };
  } catch {
    return empty;
  }
}

export function formatHistoryDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
