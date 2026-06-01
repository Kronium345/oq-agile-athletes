import AsyncStorage from '@react-native-async-storage/async-storage';

export const MIND_CENTER_IN_UK_KEY = 'mind_center_in_uk';

/** Routes that show UK-specific contacts, hospitals, or directories. */
export const UK_ONLY_MIND_CENTER_ROUTES = new Set([
  'Doctors',
  'Hospitals',
  'Emergency',
  'MindAssistant',
]);

export function isUkOnlyMindCenterRoute(route: string): boolean {
  return UK_ONLY_MIND_CENTER_ROUTES.has(route);
}

export type MindCenterUkPreference = boolean | null;

export async function getMindCenterInUk(): Promise<MindCenterUkPreference> {
  try {
    const value = await AsyncStorage.getItem(MIND_CENTER_IN_UK_KEY);
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
  } catch {
    return null;
  }
}

export async function setMindCenterInUk(inUk: boolean): Promise<void> {
  await AsyncStorage.setItem(MIND_CENTER_IN_UK_KEY, inUk ? 'true' : 'false');
}

export const NON_UK_MIND_CENTER_MESSAGE = {
  text1: 'UK resources only',
  text2:
    'Emergency numbers, hospitals, and professional directories in Mind Center are for the United Kingdom. Please use mental health services and emergency numbers in your own country.',
};
