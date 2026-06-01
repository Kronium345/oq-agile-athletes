import { buildMindCenterChatPrompt } from '../lib/mindCenterKnowledge';
import { generateChatResponse, sanitizeCoachResponse } from './aiChatApi';

export async function generateMindCenterChatResponse(
  userMessage: string,
): Promise<string> {
  const prompt = buildMindCenterChatPrompt(userMessage);
  const raw = await generateChatResponse(prompt);
  return sanitizeCoachResponse(raw);
}
