import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';
import { getUserStorageId, type StepStorageUser } from './stepStorageKeys';

const VERSION = 'v1';

function storageKey(userId: string): string {
  return `completedExercises_${VERSION}_${userId}`;
}

function normalizeExerciseName(name: string): string {
  return name.trim().toLowerCase();
}

function mergeUniqueNames(...lists: string[][]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const list of lists) {
    for (const name of list) {
      const trimmed = name.trim();
      if (!trimmed) continue;
      const key = normalizeExerciseName(trimmed);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(trimmed);
    }
  }
  return merged;
}

async function loadLocalCompleted(userId: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((n): n is string => typeof n === 'string')
      : [];
  } catch {
    return [];
  }
}

async function saveLocalCompleted(
  userId: string,
  names: string[],
): Promise<void> {
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(names));
}

async function fetchCompletedFromHistory(userId: string): Promise<string[]> {
  try {
    const response = await api.get(`/history/history?userId=${userId}`);
    const rows = Array.isArray((response as { data?: unknown })?.data)
      ? ((response as { data: { exerciseName?: string }[] }).data ?? [])
      : Array.isArray(response)
        ? (response as { exerciseName?: string }[])
        : [];

    return rows
      .map((row) => row.exerciseName?.trim())
      .filter((name): name is string => Boolean(name));
  } catch {
    return [];
  }
}

export async function loadCompletedExerciseNames(
  user: StepStorageUser,
): Promise<string[]> {
  const userId = getUserStorageId(user);
  if (!userId) return [];

  const [local, fromHistory] = await Promise.all([
    loadLocalCompleted(userId),
    fetchCompletedFromHistory(userId),
  ]);

  const merged = mergeUniqueNames(local, fromHistory);
  await saveLocalCompleted(userId, merged);
  return merged;
}

export async function addCompletedExerciseName(
  user: StepStorageUser,
  exerciseName: string,
): Promise<string[]> {
  const userId = getUserStorageId(user);
  const trimmed = exerciseName.trim();
  if (!userId || !trimmed) return [];

  const current = await loadCompletedExerciseNames(user);
  const next = mergeUniqueNames(current, [trimmed]);
  await saveLocalCompleted(userId, next);
  return next;
}

export function isExerciseCompleted(
  completedNames: string[],
  exerciseName: string,
): boolean {
  const target = normalizeExerciseName(exerciseName);
  return completedNames.some((name) => normalizeExerciseName(name) === target);
}
