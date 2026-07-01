import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'pending_workout_preselect_v1';

export async function setPendingWorkoutPreselect(
  exerciseId: string,
): Promise<void> {
  await AsyncStorage.setItem(KEY, exerciseId);
}

export async function consumePendingWorkoutPreselect(): Promise<string | null> {
  const id = await AsyncStorage.getItem(KEY);
  if (!id) return null;
  await AsyncStorage.removeItem(KEY);
  return id;
}
