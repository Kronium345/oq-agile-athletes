import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserStorageId, type StepStorageUser } from '../stepStorageKeys';
import type { PerformanceCheckInRecord } from './types';

const VERSION = 'v1';
const INDEX_SUFFIX = 'index';

function checkInKey(userId: string, date: string): string {
  return `performance_checkin_${VERSION}_${userId}_${date}`;
}

function indexKey(userId: string): string {
  return `performance_checkins_${VERSION}_${userId}_${INDEX_SUFFIX}`;
}

export async function saveLocalCheckIn(
  user: StepStorageUser,
  record: PerformanceCheckInRecord,
): Promise<void> {
  const userId = getUserStorageId(user);
  if (!userId) return;

  const now = new Date().toISOString();
  const stored: PerformanceCheckInRecord = {
    ...record,
    createdAt: record.createdAt ?? now,
    updatedAt: now,
  };

  await AsyncStorage.setItem(
    checkInKey(userId, record.date),
    JSON.stringify(stored),
  );

  const rawIndex = await AsyncStorage.getItem(indexKey(userId));
  const dates: string[] = rawIndex ? JSON.parse(rawIndex) : [];
  if (!dates.includes(record.date)) {
    dates.push(record.date);
    dates.sort((a, b) => b.localeCompare(a));
    await AsyncStorage.setItem(indexKey(userId), JSON.stringify(dates));
  }
}

export async function loadLocalCheckIn(
  user: StepStorageUser,
  date: string,
): Promise<PerformanceCheckInRecord | null> {
  const userId = getUserStorageId(user);
  if (!userId) return null;

  const raw = await AsyncStorage.getItem(checkInKey(userId, date));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PerformanceCheckInRecord;
  } catch {
    return null;
  }
}

export async function listLocalCheckIns(
  user: StepStorageUser,
  limit = 7,
): Promise<PerformanceCheckInRecord[]> {
  const userId = getUserStorageId(user);
  if (!userId) return [];

  const rawIndex = await AsyncStorage.getItem(indexKey(userId));
  const dates: string[] = rawIndex ? JSON.parse(rawIndex) : [];
  const slice = dates.slice(0, limit);
  const records: PerformanceCheckInRecord[] = [];

  for (const date of slice) {
    const row = await loadLocalCheckIn(user, date);
    if (row) records.push(row);
  }

  return records;
}
