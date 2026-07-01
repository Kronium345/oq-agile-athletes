import { getWorkoutPreset } from './presets';
import type {
  CatalogExercise,
  ExerciseWorkoutContext,
  FitScreenExercise,
  WorkoutPresetId,
} from './types';

export function toFitScreenExercise(
  exercise: CatalogExercise,
  presetId: WorkoutPresetId,
): FitScreenExercise {
  const preset = getWorkoutPreset(presetId);
  return {
    id: exercise.id,
    name: exercise.name,
    gifUrl: exercise.gifUrl,
    sets: preset.sets,
    reps: preset.reps,
    bodyPart: exercise.bodyPart,
    equipment: exercise.equipment,
    target: exercise.target,
  };
}

export function buildFitScreenFromCatalog(
  exercises: CatalogExercise[],
  presetId: WorkoutPresetId,
): FitScreenExercise[] {
  return exercises.map((exercise) => toFitScreenExercise(exercise, presetId));
}

export function buildFitScreenSession(
  primary: ExerciseWorkoutContext,
  companions: CatalogExercise[],
  presetId: WorkoutPresetId,
): FitScreenExercise[] {
  const primaryCatalog: CatalogExercise = {
    id: primary.id,
    name: primary.name,
    gifUrl: primary.image ?? '',
    equipment: primary.equipment ?? 'Not specified',
    bodyPart: primary.exerciseType ?? 'Not specified',
    target: primary.majorMuscle ?? 'Not specified',
  };

  return buildFitScreenFromCatalog(
    [primaryCatalog, ...companions],
    presetId,
  );
}
