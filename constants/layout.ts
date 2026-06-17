/** Matches `app/(drawer)/(tabs)/_layout.tsx` tab bar `height`. */
export const TAB_BAR_HEIGHT = 70;

/** Extra space so toasts / buttons clear the tab bar comfortably. */
export const TAB_BAR_CLEARANCE = 16;

export function getTabBarBottomInset(
  safeAreaBottom: number,
  tabBarHeight = TAB_BAR_HEIGHT,
): number {
  return tabBarHeight + Math.max(safeAreaBottom, 0) + TAB_BAR_CLEARANCE;
}

/** Floating drawer menu (`app/(drawer)/_layout.tsx`) — keep content clear of it. */
export const DRAWER_MENU_BUTTON_SIZE = 40;
export const DRAWER_MENU_BUTTON_LEFT = 12;
export const DRAWER_MENU_TOP_OFFSET = 50;
export const DRAWER_MENU_LEFT_OFFSET =
  DRAWER_MENU_BUTTON_LEFT + DRAWER_MENU_BUTTON_SIZE + 8;
