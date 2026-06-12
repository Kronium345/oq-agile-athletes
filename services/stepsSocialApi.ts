import api from '../api/axios';

export type LeaderboardPeriod = 'streaks' | 'today' | 'week';
export type LeaderboardScope = 'friends' | 'all';

export type StepLeaderboardEntry = {
  userId: string;
  displayName: string;
  avatarLetter: string;
  avatar?: string | null;
  value: number;
  rank: number;
};

export type FriendSuggestion = {
  userId: string;
  displayName: string;
  avatarLetter: string;
  avatar?: string | null;
};

export function avatarLetterFromName(name: string): string {
  const letter = name?.trim().charAt(0);
  return letter ? letter.toUpperCase() : '?';
}

export function tabLabelToPeriod(tab: string): LeaderboardPeriod {
  switch (tab) {
    case 'Steps today':
      return 'today';
    case 'Steps this week':
      return 'week';
    default:
      return 'streaks';
  }
}

function normalizeEntry(raw: Record<string, unknown>): StepLeaderboardEntry {
  const displayName = String(
    raw.displayName ?? raw.name ?? raw.username ?? 'User',
  );
  return {
    userId: String(raw.userId ?? raw.id ?? ''),
    displayName,
    avatarLetter: String(
      raw.avatarLetter ?? avatarLetterFromName(displayName),
    ),
    avatar: (raw.avatar as string | null | undefined) ?? null,
    value: Number(raw.value ?? 0),
    rank: Number(raw.rank ?? 0),
  };
}

function normalizeSuggestion(raw: Record<string, unknown>): FriendSuggestion {
  const displayName = String(
    raw.displayName ?? raw.name ?? raw.username ?? 'User',
  );
  return {
    userId: String(raw.userId ?? raw.id ?? ''),
    displayName,
    avatarLetter: String(
      raw.avatarLetter ?? avatarLetterFromName(displayName),
    ),
    avatar: (raw.avatar as string | null | undefined) ?? null,
  };
}

export async function getUserSuggestions(
  limit = 20,
): Promise<FriendSuggestion[]> {
  const response = (await api.get(`/user/suggestions?limit=${limit}`)) as {
    success?: boolean;
    users?: Record<string, unknown>[];
  };
  if (!response?.success || !Array.isArray(response.users)) return [];
  return response.users.map(normalizeSuggestion).filter((u) => u.userId);
}

export async function getStepLeaderboard(
  period: LeaderboardPeriod,
  scope: LeaderboardScope,
  limit: number,
): Promise<StepLeaderboardEntry[]> {
  const response = (await api.get(
    `/api/steps/leaderboard?period=${period}&scope=${scope}&limit=${limit}`,
  )) as {
    success?: boolean;
    entries?: Record<string, unknown>[];
  };
  if (!response?.success || !Array.isArray(response.entries)) return [];
  return response.entries
    .map((entry, index) =>
      normalizeEntry({
        ...entry,
        rank: entry.rank ?? index + 1,
      }),
    )
    .filter((e) => e.userId);
}

export type StepFriendConnectResult = {
  ok: boolean;
  message?: string;
};

/** Same connection flow as Fitness Network partners (with friends API fallback). */
export async function requestStepFriendConnect(
  friendUserId: string,
): Promise<StepFriendConnectResult> {
  try {
    const response = (await api.post(
      `/community/partners/${friendUserId}/connect`,
      {},
    )) as { success?: boolean; message?: string };
    if (response?.success) {
      return {
        ok: true,
        message: response.message ?? 'Connection request sent',
      };
    }
  } catch (error) {
    if (__DEV__) {
      console.warn(
        '[Steps] /community/partners/connect unavailable, trying /user/friends',
        error,
      );
    }
  }

  try {
    const response = (await api.post(`/user/friends/${friendUserId}`)) as {
      success?: boolean;
      message?: string;
    };
    if (response?.success) {
      return {
        ok: true,
        message: response.message ?? 'Friend added',
      };
    }
    return {
      ok: false,
      message: response?.message ?? 'Could not add friend',
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : 'Could not add friend',
    };
  }
}

/** @deprecated Use requestStepFriendConnect for UI flows. */
export async function addFriend(friendUserId: string): Promise<boolean> {
  const result = await requestStepFriendConnect(friendUserId);
  return result.ok;
}

export async function updateStepSharing(
  shareStepsEnabled: boolean,
): Promise<boolean> {
  const response = (await api.put('/user/step-sharing', {
    shareStepsEnabled,
  })) as { success?: boolean };
  return Boolean(response?.success);
}

export async function getStepSharingPreference(): Promise<boolean | null> {
  try {
    const response = (await api.get('/auth/current-user')) as {
      success?: boolean;
      user?: { shareStepsEnabled?: boolean };
    };
    if (response?.user && typeof response.user.shareStepsEnabled === 'boolean') {
      return response.user.shareStepsEnabled;
    }
  } catch {
    // ignore
  }
  return null;
}

export function formatLeaderboardValue(
  period: LeaderboardPeriod,
  value: number,
): string {
  if (period === 'streaks') {
    return `${value} streak${value === 1 ? '' : 's'}`;
  }
  return `${value.toLocaleString()} steps`;
}
