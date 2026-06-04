/** Push notification toggles (local + schedules on device). */
export type PushNotificationSettings = {
  follows: boolean;
  stepStreakReminders: boolean;
  leaderboardAlerts: boolean;
  runReminders: boolean;
  workoutDiscussions: boolean;
  restTimer: boolean;
};

/** Email toggles synced to the API for Upstash workflow delivery. */
export type EmailNotificationSettings = {
  emailSubscription: boolean;
  stepReminders: boolean;
  weeklyProgress: boolean;
  leaderboardAlerts: boolean;
  motivation: boolean;
};

export const DEFAULT_PUSH_SETTINGS: PushNotificationSettings = {
  follows: false,
  stepStreakReminders: false,
  leaderboardAlerts: false,
  runReminders: false,
  workoutDiscussions: false,
  restTimer: false,
};

export const DEFAULT_EMAIL_SETTINGS: EmailNotificationSettings = {
  emailSubscription: true,
  stepReminders: true,
  weeklyProgress: true,
  leaderboardAlerts: true,
  motivation: true,
};

export function emailSettingsFromUser(
  user: Record<string, unknown> | null | undefined,
): EmailNotificationSettings {
  if (!user) return { ...DEFAULT_EMAIL_SETTINGS };

  const nested = user.emailNotifications as Record<string, boolean> | undefined;
  return {
    emailSubscription:
      typeof user.emailSubscription === 'boolean'
        ? user.emailSubscription
        : nested?.emailSubscription ?? DEFAULT_EMAIL_SETTINGS.emailSubscription,
    stepReminders:
      nested?.stepReminders ?? DEFAULT_EMAIL_SETTINGS.stepReminders,
    weeklyProgress:
      nested?.weeklyProgress ?? DEFAULT_EMAIL_SETTINGS.weeklyProgress,
    leaderboardAlerts:
      nested?.leaderboardAlerts ?? DEFAULT_EMAIL_SETTINGS.leaderboardAlerts,
    motivation: nested?.motivation ?? DEFAULT_EMAIL_SETTINGS.motivation,
  };
}
