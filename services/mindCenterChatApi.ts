import { buildMindCenterChatPrompt } from '../lib/mindCenterKnowledge';
import { requestChatGeneration } from './aiChatApi';

export async function generateMindCenterChatResponse(
  userMessage: string,
): Promise<string> {
  const prompt = buildMindCenterChatPrompt(userMessage);
  return requestChatGeneration(prompt, 'mind');
}
