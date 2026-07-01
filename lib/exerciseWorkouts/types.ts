export type WorkoutPresetId = 'beginner' | 'standard' | 'burnout';

export type WorkoutPreset = {
  id: WorkoutPresetId;
  label: string;
  description: string;
  sets: number;
  reps: number;
};

export type ExerciseWorkoutContext = {
  id: string;
  name: string;
  image?: string | null;
  equipment?: string;
  exerciseType?: string;
  majorMuscle?: string;
  minorMuscle?: string;
};

export type CatalogExercise = {
  id: string;
  name: string;
  gifUrl: string;
  equipment: string;
  bodyPart: string;
  target: string;
};

export type FitScreenExercise = {
  id: string;
  name: string;
  gifUrl: string;
  sets: number;
  reps: number;
  bodyPart: string;
  equipment: string;
  target: string;
};

export type ExerciseHistoryEntry = {
  exerciseName: string;
  sets: number;
  reps: number;
  weight: number;
  duration: number;
  calories: number;
  timeStamp: string;
  createdAt?: string;
  notes?: string;
};

export type ExerciseHistoryStats = {
  sessions: ExerciseHistoryEntry[];
  lastSession: ExerciseHistoryEntry | null;
  sessionCount: number;
  bestWeight: number;
  bestVolume: number;
  bestReps: number;
};

export type SavedWorkoutTemplate = {
  id: string;
  name: string;
  anchorExerciseId: string;
  anchorExerciseName: string;
  exerciseIds: string[];
  exerciseNames: string[];
  presetId: WorkoutPresetId;
  createdAt: string;
};
