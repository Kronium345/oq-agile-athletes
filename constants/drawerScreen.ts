import { StyleSheet, ViewStyle } from 'react-native';
import { DRAWER_MENU_TOP_OFFSET } from './layout';
import { SPACING } from './theme';

/** Standard inset for screens under the floating drawer menu button. */
export const drawerScreenStyles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingTop: DRAWER_MENU_TOP_OFFSET,
    paddingHorizontal: SPACING.md,
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
});

export function drawerListBottomPad(insetsBottom: number): ViewStyle {
  return { paddingBottom: insetsBottom + SPACING.xl + 16 };
}
