/** Title-case each word: "barbell bench press" → "Barbell Bench Press" */
export function formatExerciseTitle(name: string): string {
  const trimmed = name?.trim();
  if (!trimmed) return 'Exercise Details';

  return trimmed
    .split(/\s+/)
    .map((word) => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function capitalizeSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function parseInstructionSteps(input: unknown): string[] {
  if (input == null) return [];

  let steps: string[] = [];

  if (Array.isArray(input)) {
    steps = input.map((step) => String(step));
  } else if (typeof input === 'string') {
    const trimmed = sanitizeExerciseDescription(input.trim());
    if (!trimmed || trimmed === 'No description available.') return [];
    steps = trimmed
      .split(/\.\s+/)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return steps
    .map((step) => step.replace(/\.+$/g, '').trim())
    .filter(Boolean)
    .map((step) => capitalizeSentence(step));
}

/** One instruction step per paragraph, with a single trailing period */
export function getExerciseInstructionParagraphs(input: unknown): string[] {
  const steps = parseInstructionSteps(input);
  if (!steps.length) return [];

  return steps.map((step) => {
    const body = step.replace(/\.+$/g, '').trim();
    if (!body) return '';
    return body.endsWith('.') ? body : `${body}.`;
  }).filter(Boolean);
}

/** Single string for list/cache fields */
export function formatExerciseInstructions(input: unknown): string {
  const paragraphs = getExerciseInstructionParagraphs(input);
  if (!paragraphs.length) return 'No description available.';
  return paragraphs.join(' ');
}

/** Safety net when description was stored with duplicate periods */
export function sanitizeExerciseDescription(text: string): string {
  return text
    .replace(/\.\.+/g, '.')
    .replace(/\s+\./g, '.')
    .trim();
}

/** Title-case metadata values for display (e.g. "pectoralis major") */
export function formatExerciseDetailValue(value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.toLowerCase() === 'not specified') {
    return 'Not specified';
  }
  return formatExerciseTitle(trimmed);
}
