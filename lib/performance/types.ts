export type TrainingLoadBand = 'Normal' | 'Building' | 'High' | 'Very High';

export type RecommendationSeverity = 'info' | 'warning';

export type PerformanceRecommendation = {
  type: 'sleep' | 'stress' | 'nutrition' | 'training' | 'lifestyle';
  severity: RecommendationSeverity;
  message: string;
  /** Optional in-app route for actionable tips (e.g. Recovery Toolkit). */
  actionRoute?: string;
};

export type PerformanceCheckInInput = {
  date: string;
  sleepHours: number;
  sleepQuality: number;
  stress: number;
  energy: number;
  muscleSoreness: number;
  proteinIntake?: number;
  waterIntakeLiters?: number;
  alcohol?: boolean;
};

export type PerformanceCheckInRecord = PerformanceCheckInInput & {
  recoveryScore: number;
  sleepScore: number;
  stressScore: number;
  energyScore: number;
  trainingLoad: TrainingLoadBand;
  recommendations: PerformanceRecommendation[];
  createdAt?: string;
  updatedAt?: string;
};

export type PerformanceTodayPayload = {
  date: string;
  hasCheckIn: boolean;
  checkIn?: PerformanceCheckInRecord;
  stepsToday?: number;
  dailyStepGoal?: number;
};

export type PerformanceTrendPoint = {
  date: string;
  recoveryScore: number;
  sleepScore: number;
  stressScore: number;
  energyScore: number;
  trainingLoad: TrainingLoadBand;
};

export type PerformanceTrendsPayload = {
  period: 30 | 90;
  averages: {
    recoveryScore: number;
    sleepScore: number;
    stressScore: number;
    energyScore: number;
  };
  series: PerformanceTrendPoint[];
  trainingLoadSummary: Record<TrainingLoadBand, number>;
};

export type PerformanceWeeklySummary = {
  weekStart: string;
  weekEnd: string;
  checkInCount: number;
  averages: {
    recoveryScore: number;
    sleepHours: number;
    energy: number;
    stress: number;
  };
  dominantTrainingLoad: TrainingLoadBand;
  topRecommendations: PerformanceRecommendation[];
  narrative: string;
};
