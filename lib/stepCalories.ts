/** Default adult weight when profile weight is unavailable (kg). */
const DEFAULT_WEIGHT_KG = 70;

/**
 * kcal per step per kg — derived from walking MET ~3.5 at ~100 steps/min:
 * (MET × weightKg × 3.5 / 200) / 100 ≈ 0.00057
 */
const KCAL_PER_STEP_PER_KG = 0.00057;

export const DAILY_CALORIE_GOAL = 2000;

export function parseUserWeightKg(
  user: Record<string, unknown> | null | undefined,
): number | undefined {
  const raw = user?.weight;
  if (typeof raw === 'number' && raw > 0) return raw;
  if (typeof raw === 'string') {
    const parsed = parseFloat(raw);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  return undefined;
}

/** Estimate calories burned from walking/stepping today. */
export function estimateCaloriesFromSteps(
  steps: number,
  weightKg?: number | null,
): number {
  if (!Number.isFinite(steps) || steps <= 0) return 0;
  const weight =
    typeof weightKg === 'number' && weightKg > 0 ? weightKg : DEFAULT_WEIGHT_KG;
  return Math.round(steps * weight * KCAL_PER_STEP_PER_KG);
}
