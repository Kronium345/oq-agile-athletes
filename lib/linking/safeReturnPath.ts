import { CONNECTIONS_ENTRY_PATH } from './appLinks';

const ALLOWED_PREFIXES = [
  CONNECTIONS_ENTRY_PATH,
  '/(drawer)/community/connections',
] as const;

/** Reject open redirects; only allow in-app connection entry paths. */
export function parseSafeReturnPath(
  value: string | string[] | undefined,
): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || typeof raw !== 'string') return undefined;

  let path: string;
  try {
    path = decodeURIComponent(raw);
  } catch {
    return undefined;
  }

  if (!path.startsWith('/') || path.includes('://')) return undefined;

  const allowed = ALLOWED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}?`),
  );
  return allowed ? path : undefined;
}
