import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'exercises_catalog_v1';
/** Catalog changes infrequently; refresh from network after this TTL. */
export const EXERCISES_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export type CachedExerciseCatalog = {
  exercises: unknown[];
  nextOffset: number;
  cachedAt: number;
};

export async function getCachedExercises(): Promise<CachedExerciseCatalog | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedExerciseCatalog;
    if (!parsed?.cachedAt || !Array.isArray(parsed.exercises)) return null;
    if (parsed.exercises.length === 0) return null;
    if (Date.now() - parsed.cachedAt > EXERCISES_CACHE_TTL_MS) return null;

    return parsed;
  } catch {
    return null;
  }
}

export async function setCachedExercises(
  exercises: unknown[],
  nextOffset: number,
): Promise<void> {
  try {
    const payload: CachedExerciseCatalog = {
      exercises,
      nextOffset,
      cachedAt: Date.now(),
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Failed to write exercises cache:', error);
  }
}

export async function clearExercisesCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}
