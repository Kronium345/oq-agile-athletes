/** Display gender from string, boolean, or other API shapes. */
export function formatGenderForDisplay(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'boolean') {
    return value ? 'Male' : 'Female';
  }
  return String(value).trim();
}

export function formatExperienceForDisplay(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

export function formatWeightForDisplay(value: unknown): string {
  if (value == null || value === '') return '';
  const n = Number(value);
  if (!Number.isNaN(n)) {
    return Number.isInteger(n) ? String(n) : String(n);
  }
  return String(value).trim();
}

export function formatProfileStatLabel(value: unknown): string {
  const s =
    typeof value === 'boolean'
      ? formatGenderForDisplay(value)
      : String(value ?? '').trim();
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1);
}
