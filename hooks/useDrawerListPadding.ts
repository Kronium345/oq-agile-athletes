import { useMemo } from 'react';
import { ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING } from '../constants/theme';

/** Extra bottom padding so list rows clear the Android nav bar. */
export function useDrawerListPadding(): ViewStyle {
  const insets = useSafeAreaInsets();
  return useMemo(
    () => ({
      paddingBottom: Math.max(insets.bottom, SPACING.md) + SPACING.xl + 8,
    }),
    [insets.bottom],
  );
}
