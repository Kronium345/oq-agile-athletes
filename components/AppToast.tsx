import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {
  getTabBarBottomInset,
  TAB_BAR_HEIGHT,
} from '../constants/layout';

/**
 * Single app-wide toast host, positioned above the bottom tab bar.
 */
export default function AppToast() {
  const insets = useSafeAreaInsets();
  const bottomOffset = getTabBarBottomInset(insets.bottom, TAB_BAR_HEIGHT);

  return (
    <Toast
      bottomOffset={bottomOffset}
      visibilityTime={3500}
      topOffset={Platform.OS === 'ios' ? insets.top + 8 : 48}
    />
  );
}
