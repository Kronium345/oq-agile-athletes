import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ATHLETIC } from '../../constants/athleticDashboard';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';

type SkewedBadgeProps = {
  label: string;
  style?: ViewStyle;
};

export function SkewedBadge({ label, style }: SkewedBadgeProps) {
  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.badge}>
        <Text style={styles.text}>{label.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-start',
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    transform: [{ skewX: ATHLETIC.skewDeg }],
  },
  text: {
    color: COLORS.textButton,
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.2,
    transform: [{ skewX: '12deg' }],
  },
});
