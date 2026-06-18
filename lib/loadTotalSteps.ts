import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';
import { pickTotalSteps } from './dailySteps';
import { getUserStorageId, stepHistoryKey, totalStepsKey } from './stepStorageKeys';

type TotalStepsResponse = {
  success?: boolean;
  data?: { totalSteps?: number; stepCount?: number };
  totalSteps?: number;
};

/** Same total steps source as stepCount / Step History (API → local cache → history sum). */
export async function loadTotalStepsTracked(
  user?: { _id?: string; userId?: string } | null,
): Promise<number> {
  const userId = getUserStorageId(user);

  if (userId) {
    try {
      const response = (await api.get('/api/steps/total')) as TotalStepsResponse;
      const total = pickTotalSteps(response);

      if (total !== null) {
        await AsyncStorage.setItem(totalStepsKey(userId), String(total));
        return total;
      }
    } catch {
      // fall through to local
    }

    try {
      const cached = await AsyncStorage.getItem(totalStepsKey(userId));
      if (cached != null) {
        const parsed = parseInt(cached, 10);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }

    try {
      const historyRaw = await AsyncStorage.getItem(stepHistoryKey(userId));
      if (historyRaw) {
        const history = JSON.parse(historyRaw);
        if (Array.isArray(history)) {
          return history.reduce(
            (sum: number, entry: { steps?: number; stepCount?: number }) =>
              sum + (entry.steps ?? entry.stepCount ?? 0),
            0,
          );
        }
      }
    } catch {
      // ignore
    }
  }

  return 0;
}

export function formatTotalStepsShort(totalSteps: number): string {
  if (totalSteps >= 1000) {
    return `${(totalSteps / 1000).toFixed(1)}K`;
  }
  return totalSteps.toLocaleString();
}

export function getTotalStepsMilestone(totalSteps: number): {
  progress: number;
  milestoneLabel: string;
} {
  const nextMilestone = Math.max(
    Math.ceil(Math.max(totalSteps, 1) / 50000) * 50000,
    50000,
  );
  const progress = Math.min(totalSteps / nextMilestone, 1);
  return {
    progress,
    milestoneLabel: `${nextMilestone / 1000}K`,
  };
}
