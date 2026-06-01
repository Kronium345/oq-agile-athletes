/**
 * Strip common markdown from AI replies so the app can show plain, readable text.
 */
export function sanitizeBotMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\r\n/g, '\n')
    .trim();
}

export const AI_COACH_FORMAT_INSTRUCTIONS = `
Format your reply in plain text only. Do not use markdown, asterisks, hashtags, or bold. Use short paragraphs and line breaks. For lists, use simple numbered lines (1. 2. 3.) or dashes (- item) without special symbols.
`.trim();
