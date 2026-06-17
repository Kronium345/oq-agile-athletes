import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { COLORS } from '../../constants/theme';

type FrostedPanelProps = {
  style?: ViewStyle;
  children?: React.ReactNode;
  intensity?: number;
};

/** iOS blur; solid card on Android to avoid navigation flicker. */
export function FrostedPanel({
  style,
  children,
  intensity = 8,
}: FrostedPanelProps) {
  if (Platform.OS === 'android') {
    return (
      <View style={[styles.androidFill, style]}>
        {children}
      </View>
    );
  }

  return (
    <BlurView intensity={intensity} tint='light' style={style}>
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  androidFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.backgroundCard,
  },
});
