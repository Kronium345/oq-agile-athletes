import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';
import { getLocalTodayKey } from './dailySteps';

const STORAGE_PREFIX = '@app_activity_dates:';

export type ActivityDateMap = Record<string, boolean>;

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

/** Parse API / stored activity values without timezone drift on YYYY-MM-DD strings. */
export function parseActivityDateKey(value: unknown): string | null {
  if (value == null) return null;

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return getLocalTodayKey(parsed);
    }
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return getLocalTodayKey(value);
  }

  return null;
}

function mergeMaps(...maps: ActivityDateMap[]): ActivityDateMap {
  return maps.reduce((acc, map) => ({ ...acc, ...map }), {});
}

export async function loadLocalActivityDates(
  userId: string,
): Promise<ActivityDateMap> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return {};

    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.reduce((acc: ActivityDateMap, entry) => {
        const key = parseActivityDateKey(entry);
        if (key) acc[key] = true;
        return acc;
      }, {});
    }

    if (parsed && typeof parsed === 'object') {
      const result: ActivityDateMap = {};
      for (const [key, value] of Object.entries(
        parsed as Record<string, unknown>,
      )) {
        const dateKey = parseActivityDateKey(key);
        if (dateKey && value) result[dateKey] = true;
      }
      return result;
    }
  } catch {
    // Ignore corrupt local cache.
  }
  return {};
}

async function saveLocalActivityDates(userId: string, dates: ActivityDateMap) {
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(dates));
}

function responseToActivityMap(response: unknown): ActivityDateMap {
  if (!response) return {};

  if (Array.isArray(response)) {
    return response.reduce((acc: ActivityDateMap, item) => {
      if (typeof item === 'string') {
        const key = parseActivityDateKey(item);
        if (key) acc[key] = true;
        return acc;
      }
      if (item && typeof item === 'object') {
        const row = item as Record<string, unknown>;
        const key = parseActivityDateKey(
          row.date ?? row.activityDate ?? row.day ?? row.activeDate,
        );
        if (key) acc[key] = true;
      }
      return acc;
    }, {});
  }

  if (typeof response !== 'object') return {};

  const obj = response as Record<string, unknown>;
  const rows = obj.data ?? obj.activities ?? obj.activity;
  if (Array.isArray(rows)) {
    return responseToActivityMap(rows);
  }

  if (rows && typeof rows === 'object' && !Array.isArray(rows)) {
    const result: ActivityDateMap = {};
    for (const [key, value] of Object.entries(rows as Record<string, unknown>)) {
      const dateKey = parseActivityDateKey(key);
      if (dateKey && value) result[dateKey] = true;
    }
    return result;
  }

  return {};
}

async function syncActivityToServer(userId: string, dateKey: string) {
  try {
    await api.post(`/activity/${userId}`, { date: dateKey });
  } catch {
    try {
      await api.post('/activity', { userId, date: dateKey });
    } catch {
      // Server may not support writes yet; local tracking still works.
    }
  }
}

/** Mark today as an active day for this user (local + best-effort server sync). */
export async function recordAppActivity(userId: string) {
  const todayKey = getLocalTodayKey();
  const local = await loadLocalActivityDates(userId);
  if (local[todayKey]) return;

  const updated = { ...local, [todayKey]: true };
  await saveLocalActivityDates(userId, updated);
  void syncActivityToServer(userId, todayKey);
}

export async function fetchActivityDates(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<ActivityDateMap> {
  const local = await loadLocalActivityDates(userId);
  let remote: ActivityDateMap = {};

  try {
    const response = await api.get(
      `/activity/${userId}/${startDate}/${endDate}`,
    );
    remote = responseToActivityMap(response);
  } catch (error) {
    console.error('Error fetching activity data:', error);
  }

  return mergeMaps(remote, local);
}
