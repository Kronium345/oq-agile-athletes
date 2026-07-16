export type BreathingEvidenceStrength =
  | 'high'
  | 'moderate'
  | 'limited'
  | 'emerging';

export type BreathingDifficulty = 'beginner' | 'intermediate';

export type BreathingRhythm = {
  /** Seconds for first inhale (or primary inhale). */
  inhaleSec: number;
  /** Optional second inhale (physiological sigh). */
  inhale2Sec?: number;
  holdInSec: number;
  exhaleSec: number;
  holdOutSec: number;
};

export type BreathingProtocol = {
  id: string;
  name: string;
  description: string;
  intendedUse: string[];
  rhythm: BreathingRhythm;
  /** Default session length in seconds. */
  defaultDurationSec: number;
  durationOptionsSec: number[];
  difficulty: BreathingDifficulty;
  evidenceStrength: BreathingEvidenceStrength;
  contraindications: string[];
  coachingTips: string[];
  whyRecommended: string;
  /** Short label for the orb phase cycle when inhale2 is used. */
  phaseLabels?: {
    inhale?: string;
    inhale2?: string;
    holdIn?: string;
    exhale?: string;
    holdOut?: string;
  };
};

export type RecoverySessionStatus = 'started' | 'completed' | 'abandoned';

export type RecoverySessionRecord = {
  id: string;
  protocolId: string;
  status: RecoverySessionStatus;
  startedAt: string;
  completedAt?: string;
  durationSec: number;
  plannedDurationSec: number;
  context: 'mind_center' | 'performance_hub' | 'deep_link';
  date: string; // YYYY-MM-DD local
};

export type RecoveryBreathingSummary = {
  sessionsToday: number;
  sessionsWeek: number;
  streakDays: number;
  hasSessionToday: boolean;
};
