import type { WorkoutPreset, WorkoutPresetId } from './types';

export const WORKOUT_PRESETS: WorkoutPreset[] = [
  {
    id: 'beginner',
    label: 'Beginner',
    description: '3 × 10 · 60s rest',
    sets: 3,
    reps: 10,
  },
  {
    id: 'standard',
    label: 'Standard',
    description: '3 × 15 · 45s rest',
    sets: 3,
    reps: 15,
  },
  {
    id: 'burnout',
    label: 'Burnout',
    description: '2 × AMRAP · 30s rest',
    sets: 2,
    reps: 20,
  },
];

export function getWorkoutPreset(id: WorkoutPresetId): WorkoutPreset {
  return WORKOUT_PRESETS.find((p) => p.id === id) ?? WORKOUT_PRESETS[1];
}
