type AthleteStatusInput = {
  experience?: string | null;
  workouts?: number;
  minutes?: number;
  totalSteps?: number;
};

/** Short identity line shown under the profile name */
export function resolveAthleteStatusLabel({
  experience,
  workouts = 0,
  minutes = 0,
  totalSteps = 0,
}: AthleteStatusInput): string {
  const exp = String(experience ?? '')
    .trim()
    .toLowerCase();

  if (exp.includes('power')) return 'POWERLIFTER';
  if (exp.includes('endurance') || exp.includes('cardio')) {
    return 'ENDURANCE ATHLETE';
  }
  if (exp.includes('advanced')) return 'ADVANCED ATHLETE';
  if (exp.includes('intermediate')) return 'INTERMEDIATE ATHLETE';
  if (exp.includes('beginner')) return 'DEVELOPING ATHLETE';

  if (minutes >= 300 || totalSteps >= 500_000) return 'ENDURANCE ATHLETE';
  if (workouts >= 40) return 'CONSISTENT ATHLETE';
  if (workouts >= 10) return 'ACTIVE ATHLETE';

  return 'AGILE ATHLETE';
}
