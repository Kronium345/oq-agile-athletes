import type { BreathingProtocol } from './types';

export const BREATHING_PROTOCOLS: BreathingProtocol[] = [
  {
    id: 'stress_reset',
    name: 'Stress Reset',
    description:
      'A longer exhale to help you downshift when stress feels high.',
    intendedUse: ['stress', 'overwhelm', 'reset'],
    rhythm: { inhaleSec: 4, holdInSec: 0, exhaleSec: 6, holdOutSec: 0 },
    defaultDurationSec: 120,
    durationOptionsSec: [60, 120, 180],
    difficulty: 'beginner',
    evidenceStrength: 'moderate',
    contraindications: [
      'Stop if you feel dizzy, short of breath, or more distressed.',
    ],
    coachingTips: [
      'Sit or stand comfortably with a tall spine.',
      'Breathe through the nose if it feels comfortable.',
      'You can stop anytime — there is no wrong pace.',
    ],
    whyRecommended:
      'This slow-breathing session is designed to help you unwind and may support a calmer state. Individual experiences vary, and this tool is for general wellness — not medical treatment.',
  },
  {
    id: 'box_breathing',
    name: 'Box Breathing',
    description: 'Even rhythm to steady attention and encourage calm focus.',
    intendedUse: ['focus', 'stress', 'pre_workout'],
    rhythm: { inhaleSec: 4, holdInSec: 4, exhaleSec: 4, holdOutSec: 4 },
    defaultDurationSec: 120,
    durationOptionsSec: [60, 120, 180, 300],
    difficulty: 'beginner',
    evidenceStrength: 'moderate',
    contraindications: [
      'Skip long holds if you feel lightheaded; shorten the pause instead.',
    ],
    coachingTips: [
      'Imagine tracing a square with each phase.',
      'Keep the breath gentle — no forcing.',
      'Use before tasks when you want steadier focus.',
    ],
    whyRecommended:
      'Even, paced breathing may support calm and focus for some people. Experiences vary; this is a wellness tool, not a clinical intervention.',
  },
  {
    id: 'physiological_sigh',
    name: 'Physiological Sigh',
    description:
      'A double inhale and long exhale for a quick reset during acute stress.',
    intendedUse: ['acute_stress', 'reset'],
    rhythm: {
      inhaleSec: 2,
      inhale2Sec: 1,
      holdInSec: 0,
      exhaleSec: 6,
      holdOutSec: 0,
    },
    defaultDurationSec: 60,
    durationOptionsSec: [45, 60, 90],
    difficulty: 'beginner',
    evidenceStrength: 'emerging',
    contraindications: [
      'Avoid rapid or forced breathing if it increases anxiety.',
    ],
    coachingTips: [
      'Inhale gently, then a short second sip of air.',
      'Exhale slowly through the mouth or nose.',
      'A few cycles is enough — quality over quantity.',
    ],
    phaseLabels: {
      inhale: 'Inhale',
      inhale2: 'Sip',
      exhale: 'Long exhale',
    },
    whyRecommended:
      'Some research explores double-inhale / long-exhale patterns for short-term calm. Evidence is still emerging, and this is for general wellness only.',
  },
  {
    id: 'sleep_wind_down',
    name: 'Sleep Wind Down',
    description: 'Gentle longer exhales to help you settle before sleep.',
    intendedUse: ['sleep', 'evening'],
    rhythm: { inhaleSec: 4, holdInSec: 0, exhaleSec: 6, holdOutSec: 0 },
    defaultDurationSec: 180,
    durationOptionsSec: [120, 180, 300],
    difficulty: 'beginner',
    evidenceStrength: 'moderate',
    contraindications: [
      'If breathwork keeps you more awake, stop and try a quieter routine.',
    ],
    coachingTips: [
      'Dim the lights and put your phone face-down if you can.',
      'Keep breaths soft and quiet.',
      'No pressure to finish — rest is the goal.',
    ],
    whyRecommended:
      'Slow breathing with a longer exhale may support winding down for some people. It is not a treatment for sleep disorders.',
  },
  {
    id: 'post_workout_recovery',
    name: 'Post-Workout Recovery',
    description: 'A short cool-down breath after training.',
    intendedUse: ['after_training', 'recovery'],
    rhythm: { inhaleSec: 4, holdInSec: 0, exhaleSec: 6, holdOutSec: 0 },
    defaultDurationSec: 120,
    durationOptionsSec: [60, 120, 180],
    difficulty: 'beginner',
    evidenceStrength: 'limited',
    contraindications: [
      'Wait until your breathing has settled from intense effort.',
    ],
    coachingTips: [
      'Sit or walk slowly while you breathe.',
      'Use this as part of your cool-down habit.',
      'Hydrate after the session as usual.',
    ],
    whyRecommended:
      'Designed to encourage a recovery habit after training. Evidence for direct performance benefits is limited; use it as a wellness cool-down.',
  },
  {
    id: 'pre_workout_focus',
    name: 'Pre-Workout Focus',
    description: 'Short paced breathing to arrive focused before a session.',
    intendedUse: ['pre_workout', 'focus'],
    rhythm: { inhaleSec: 4, holdInSec: 2, exhaleSec: 4, holdOutSec: 0 },
    defaultDurationSec: 60,
    durationOptionsSec: [45, 60, 90],
    difficulty: 'beginner',
    evidenceStrength: 'limited',
    contraindications: [
      'Keep holds short if you feel tension building.',
    ],
    coachingTips: [
      'Use right before you warm up.',
      'Stay upright and alert — this is focus, not sleep.',
      'One minute is enough for most people.',
    ],
    whyRecommended:
      'Some athletes use paced breathing to support focus before sessions. Direct performance evidence is limited; treat this as a preparation habit.',
  },
];

export function getBreathingProtocol(
  id: string,
): BreathingProtocol | undefined {
  return BREATHING_PROTOCOLS.find((p) => p.id === id);
}

export function formatEvidenceLabel(
  strength: BreathingProtocol['evidenceStrength'],
): string {
  switch (strength) {
    case 'high':
      return 'Evidence: High';
    case 'moderate':
      return 'Evidence: Moderate';
    case 'emerging':
      return 'Evidence: Emerging';
    default:
      return 'Evidence: Limited';
  }
}

export function formatRhythmSummary(protocol: BreathingProtocol): string {
  const { rhythm } = protocol;
  if (rhythm.inhale2Sec) {
    return `In ${rhythm.inhaleSec} · sip ${rhythm.inhale2Sec} · out ${rhythm.exhaleSec}`;
  }
  const parts = [`In ${rhythm.inhaleSec}`];
  if (rhythm.holdInSec > 0) parts.push(`hold ${rhythm.holdInSec}`);
  parts.push(`out ${rhythm.exhaleSec}`);
  if (rhythm.holdOutSec > 0) parts.push(`hold ${rhythm.holdOutSec}`);
  return parts.join(' · ');
}
