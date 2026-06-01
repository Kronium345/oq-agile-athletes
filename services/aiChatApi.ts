import api from '../api/axios';

export type ChatMessageType = 'user' | 'bot';

export type ChatUiMessage = {
  type: ChatMessageType;
  text: string;
};

export type SavedChat = {
  _id: string;
  userId: string;
  title: string;
  messages: ChatUiMessage[];
  savedAt?: string;
};

const WELCOME_TEXT =
  "Hello! I'm your Agile Athletes AI coach. Tell me your fitness goals, and I'll help with workouts, recovery, and staying motivated. I offer wellness guidance, not medical diagnosis.";

export const AI_COACH_WELCOME = WELCOME_TEXT;

export function normalizeMessages(raw: unknown[]): ChatUiMessage[] {
  return raw.map((item, index) => {
    if (typeof item === 'string') {
      return { type: index === 0 ? 'bot' : 'bot', text: item };
    }
    const record = item as { type?: string; text?: string };
    const text = record.text ?? '';
    const type: ChatMessageType =
      record.type === 'user' ? 'user' : 'bot';
    return { type, text };
  });
}

export async function generateChatResponse(
  prompt: string,
  options?: { wrapAsWorkoutPlan?: boolean },
): Promise<string> {
  const body = {
    prompt: options?.wrapAsWorkoutPlan
      ? `Generate a workout plan for the following fitness goal: ${prompt}`
      : prompt,
  };

  const response = (await api.post('/chat/generate', body)) as {
    generations?: { text?: string }[];
    error?: string;
    details?: string;
  };

  const text = response?.generations?.[0]?.text;
  if (!text) {
    throw new Error(
      response?.details || response?.error || 'No response from AI coach',
    );
  }
  return text;
}

export async function saveChat(
  userId: string,
  title: string,
  messages: ChatUiMessage[],
): Promise<void> {
  await api.post('/chat/save-chat', {
    userId,
    title: title.trim(),
    messages,
  });
}

export async function listUserChats(userId: string): Promise<SavedChat[]> {
  const response = await api.get(`/chat/get-chat/${userId}`);
  if (!Array.isArray(response)) {
    return [];
  }
  return response.map((chat: SavedChat) => ({
    _id: chat._id,
    userId: chat.userId,
    title: chat.title || 'Untitled Chat',
    messages: normalizeMessages(chat.messages ?? []),
    savedAt: chat.savedAt,
  }));
}

export async function getChatById(chatId: string): Promise<SavedChat> {
  const response = (await api.get(`/chat/get-chat-by-id/${chatId}`)) as SavedChat;
  return {
    ...response,
    messages: normalizeMessages(response.messages ?? []),
  };
}

export async function deleteChat(chatId: string): Promise<void> {
  await api.delete(`/chat/delete-chat/${chatId}`);
}

export function getUserId(user: {
  _id?: string;
  userId?: string;
} | null): string | null {
  if (!user) return null;
  return user._id ?? user.userId ?? null;
}
