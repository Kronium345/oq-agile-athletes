import type {
  PerformanceCheckInInput,
  PerformanceCheckInRecord,
  PerformanceRecommendation,
  TrainingLoadBand,
} from './types';

export type TrainingLoadContext = {
  todaySteps: number;
  dailyStepGoal: number;
  trainingLoad: TrainingLoadBand;
};

const DEFAULT_STEP_GOAL = 10000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function trainingLoadScoreForBand(band: TrainingLoadBand): number {
  switch (band) {
    case 'Normal':
      return 100;
    case 'Building':
      return 85;
    case 'High':
      return 65;
    case 'Very High':
      return 40;
    default:
      return 85;
  }
}

export function computeTrainingLoadBand(
  acuteLoad: number,
  chronicLoad: number,
): TrainingLoadBand {
  const ratio = acuteLoad / Math.max(chronicLoad, 1);
  if (ratio < 0.8) return 'Building';
  if (ratio < 1.3) return 'Normal';
  if (ratio < 1.5) return 'High';
  return 'Very High';
}

export function dailyLoadFromWorkoutAndSteps(
  workoutMinutes: number,
  steps: number,
): number {
  return workoutMinutes * 1.0 + (steps / 1000) * 0.3;
}

function lifestyleScore(input: PerformanceCheckInInput): number {
  let score = 70;
  if ((input.proteinIntake ?? 0) >= 80) score += 15;
  if ((input.waterIntakeLiters ?? 0) >= 2) score += 15;
  if (input.alcohol) score -= 20;
  return clamp(score, 0, 100);
}

function alcoholPenalty(input: PerformanceCheckInInput): number {
  return input.alcohol ? 5 : 0;
}

export function generateRecommendations(
  input: PerformanceCheckInInput,
  trainingLoad: TrainingLoadBand,
): PerformanceRecommendation[] {
  const recs: PerformanceRecommendation[] = [];

  if (input.sleepHours < 7) {
    recs.push({
      type: 'sleep',
      severity: 'info',
      message: 'Try going to bed 45 minutes earlier tonight.',
    });
  }
  if (input.sleepQuality <= 5) {
    recs.push({
      type: 'sleep',
      severity: 'info',
      message: 'Reduce screen time 1 hour before bed.',
    });
  }
  if (input.stress >= 7) {
    recs.push({
      type: 'stress',
      severity: 'warning',
      message: 'Consider a light walk or breathing exercise.',
    });
  }
  if (input.energy <= 4) {
    recs.push({
      type: 'lifestyle',
      severity: 'warning',
      message: 'Prioritize recovery; keep intensity moderate today.',
    });
  }
  if (input.muscleSoreness >= 7) {
    recs.push({
      type: 'training',
      severity: 'warning',
      message: 'High soreness — consider mobility work or a rest day.',
    });
  }
  if (input.alcohol) {
    recs.push({
      type: 'lifestyle',
      severity: 'info',
      message: 'Alcohol can affect recovery — hydrate well today.',
    });
  }
  if ((input.proteinIntake ?? 0) > 0 && (input.proteinIntake ?? 0) < 80) {
    recs.push({
      type: 'nutrition',
      severity: 'info',
      message: 'Consider increasing protein intake to support recovery.',
    });
  }
  if (trainingLoad === 'High' || trainingLoad === 'Very High') {
    recs.push({
      type: 'training',
      severity: 'warning',
      message: 'Training load is elevated — plan a lighter session.',
    });
  }

  return recs;
}

export function computePerformanceScores(
  input: PerformanceCheckInInput,
  context: TrainingLoadContext,
): Omit<
  PerformanceCheckInRecord,
  'createdAt' | 'updatedAt'
> {
  const sleepHoursScore = clamp((input.sleepHours / 8) * 100, 0, 100);
  const sleepQualityScore = input.sleepQuality * 10;
  const sleepScore = Math.round(
    sleepHoursScore * 0.55 + sleepQualityScore * 0.45,
  );

  const stressScore = (10 - input.stress) * 10;
  const energyScore = input.energy * 10;
  const sorenessScore = (10 - input.muscleSoreness) * 10;

  const goal = context.dailyStepGoal || DEFAULT_STEP_GOAL;
  const stepsScore = clamp(
    Math.min(context.todaySteps / goal, 1) * 100,
    0,
    100,
  );

  const loadScore = trainingLoadScoreForBand(context.trainingLoad);
  const lifestyle = lifestyleScore(input);

  const recoveryScore = clamp(
    Math.round(
      sleepScore * 0.25 +
        stressScore * 0.15 +
        energyScore * 0.15 +
        sorenessScore * 0.1 +
        stepsScore * 0.1 +
        loadScore * 0.1 +
        lifestyle * 0.15 -
        alcoholPenalty(input),
    ),
    0,
    100,
  );

  const recommendations = generateRecommendations(
    input,
    context.trainingLoad,
  );

  return {
    ...input,
    recoveryScore,
    sleepScore,
    stressScore,
    energyScore,
    trainingLoad: context.trainingLoad,
    recommendations,
  };
}

export function recoveryScoreColor(score: number): string {
  if (score >= 75) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#dc2626';
}

/** Recovery and sub-scores are 0–100; display as a percentage in the UI. */
export function formatRecoveryPercent(score: number): string {
  return `${Math.round(score)}%`;
}

export function trainingLoadColor(band: TrainingLoadBand): string {
  switch (band) {
    case 'Normal':
      return '#10b981';
    case 'Building':
      return '#3b82f6';
    case 'High':
      return '#f59e0b';
    case 'Very High':
      return '#dc2626';
    default:
      return '#6b7280';
  }
}
