import api from '../api/axios';

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  _id?: string;
  role: ChatRole;
  content: string;
  createdAt?: string;
};

export type ChatConversation = {
  _id: string;
  title?: string;
  updatedAt?: string;
  createdAt?: string;
};

export async function listConversations(): Promise<ChatConversation[]> {
  const response = await api.get('/ai-chat/conversations');
  return (response as any)?.data ?? (response as ChatConversation[]) ?? [];
}

export async function createConversation(title?: string): Promise<ChatConversation> {
  const response = await api.post('/ai-chat/conversations', { title });
  return (response as any)?.data ?? (response as ChatConversation);
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const response = await api.get(
    `/ai-chat/conversations/${conversationId}/messages`,
  );
  return (response as any)?.data ?? (response as ChatMessage[]) ?? [];
}

export async function sendMessage(
  conversationId: string,
  message: string,
): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
  const response = await api.post(
    `/ai-chat/conversations/${conversationId}/messages`,
    { message },
  );
  return (response as any)?.data ?? response;
}

export async function deleteConversation(conversationId: string): Promise<void> {
  await api.delete(`/ai-chat/conversations/${conversationId}`);
}
