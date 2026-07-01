import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SavedWorkoutTemplate, WorkoutPresetId } from './types';

const VERSION = 'v1';

function storageKey(userId: string): string {
  return `exercise_workout_templates_${VERSION}_${userId}`;
}

export async function listWorkoutTemplates(
  userId: string,
): Promise<SavedWorkoutTemplate[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedWorkoutTemplate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveWorkoutTemplate(
  userId: string,
  template: Omit<SavedWorkoutTemplate, 'id' | 'createdAt'>,
): Promise<SavedWorkoutTemplate> {
  const existing = await listWorkoutTemplates(userId);
  const created: SavedWorkoutTemplate = {
    ...template,
    id: `tpl_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const next = [created, ...existing].slice(0, 20);
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(next));
  return created;
}

export async function deleteWorkoutTemplate(
  userId: string,
  templateId: string,
): Promise<void> {
  const existing = await listWorkoutTemplates(userId);
  const next = existing.filter((t) => t.id !== templateId);
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(next));
}

export function buildTemplateName(
  exerciseName: string,
  presetId: WorkoutPresetId,
): string {
  const presetLabel =
    presetId === 'beginner'
      ? 'Beginner'
      : presetId === 'burnout'
        ? 'Burnout'
        : 'Standard';
  return `${exerciseName} · ${presetLabel}`;
}
