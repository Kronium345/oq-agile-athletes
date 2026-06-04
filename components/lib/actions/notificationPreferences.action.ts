import api from '../../../api/axios';
import {
  DEFAULT_EMAIL_SETTINGS,
  type EmailNotificationSettings,
  emailSettingsFromUser,
} from '../../../lib/notifications/types';

export async function fetchEmailNotificationSettings(
  userId: string,
): Promise<EmailNotificationSettings> {
  try {
    const data = (await api.get(`/user/${userId}`)) as Record<string, unknown>;
    return emailSettingsFromUser(data);
  } catch {
    return { ...DEFAULT_EMAIL_SETTINGS };
  }
}

/** Persists email prefs for workflow gating on the server. */
export async function syncEmailNotificationSettings(
  userId: string,
  settings: EmailNotificationSettings,
): Promise<{ success: boolean; message?: string }> {
  try {
    await api.put(`/user/${userId}/email-notifications`, {
      emailSubscription: settings.emailSubscription,
      emailNotifications: {
        stepReminders: settings.stepReminders,
        weeklyProgress: settings.weeklyProgress,
        leaderboardAlerts: settings.leaderboardAlerts,
        motivation: settings.motivation,
      },
    });
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to save email settings';
    return { success: false, message };
  }
}
