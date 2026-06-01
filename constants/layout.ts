import { Platform } from 'react-native';

/** Matches `app/(drawer)/(tabs)/_layout.tsx` tab bar `height`. */
export const TAB_BAR_HEIGHT = 70;

/** Android tab bar `bottom` offset (gesture nav area). */
export const TAB_BAR_ANDROID_BOTTOM_OFFSET = 40;

/** Extra space so toasts / buttons clear the tab bar comfortably. */
export const TAB_BAR_CLEARANCE = 16;

export function getTabBarBottomInset(
  safeAreaBottom: number,
  tabBarHeight = TAB_BAR_HEIGHT,
): number {
  const androidLift =
    Platform.OS === 'android' ? TAB_BAR_ANDROID_BOTTOM_OFFSET : 0;
  return tabBarHeight + androidLift + Math.max(safeAreaBottom, 0) + TAB_BAR_CLEARANCE;
}
