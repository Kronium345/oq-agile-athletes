import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserStorageId, type StepStorageUser } from '../stepStorageKeys';
import type { RecoverySessionRecord } from './types';

const VERSION = 'v1';
const INDEX_SUFFIX = 'index';

function sessionsKey(userId: string): string {
  return `recovery_sessions_${VERSION}_${userId}`;
}

function indexKey(userId: string): string {
  return `recovery_sessions_${VERSION}_${userId}_${INDEX_SUFFIX}`;
}

function localDateKey(isoOrDate = new Date()): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function saveRecoverySession(
  user: StepStorageUser,
  session: RecoverySessionRecord,
): Promise<boolean> {
  const userId = getUserStorageId(user);
  if (!userId) return false;

  const raw = await AsyncStorage.getItem(sessionsKey(userId));
  let list: RecoverySessionRecord[] = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      list = Array.isArray(parsed) ? parsed : [];
    } catch {
      list = [];
    }
  }
  const idx = list.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    list[idx] = session;
  } else {
    list.unshift(session);
  }
  // Cap local history
  const trimmed = list.slice(0, 200);
  await AsyncStorage.setItem(sessionsKey(userId), JSON.stringify(trimmed));

  const rawIndex = await AsyncStorage.getItem(indexKey(userId));
  let dates: string[] = [];
  if (rawIndex) {
    try {
      const parsed = JSON.parse(rawIndex);
      dates = Array.isArray(parsed) ? parsed : [];
    } catch {
      dates = [];
    }
  }
  if (session.status === 'completed' && !dates.includes(session.date)) {
    dates.push(session.date);
    dates.sort((a, b) => b.localeCompare(a));
    await AsyncStorage.setItem(indexKey(userId), JSON.stringify(dates));
  }
  return true;
}

export async function listRecoverySessions(
  user: StepStorageUser,
  limit = 50,
): Promise<RecoverySessionRecord[]> {
  const userId = getUserStorageId(user);
  if (!userId) return [];

  const raw = await AsyncStorage.getItem(sessionsKey(userId));
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as RecoverySessionRecord[];
    return Array.isArray(list) ? list.slice(0, limit) : [];
  } catch {
    return [];
  }
}

export async function listCompletedSessions(
  user: StepStorageUser,
  limit = 100,
): Promise<RecoverySessionRecord[]> {
  const all = await listRecoverySessions(user, limit);
  return all.filter((s) => s.status === 'completed');
}

export function getLocalDateKey(date = new Date()): string {
  return localDateKey(date);
}

/** Monday (local) of the week containing `date`. */
export function getWeekStartDateKey(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return localDateKey(d);
}

export function isDateInCurrentWeek(dateKey: string, now = new Date()): boolean {
  const start = getWeekStartDateKey(now);
  const endDate = new Date(now);
  // Include today through Sunday
  const day = endDate.getDay();
  const add = day === 0 ? 0 : 7 - day;
  endDate.setDate(endDate.getDate() + add);
  const end = localDateKey(endDate);
  return dateKey >= start && dateKey <= end;
}
