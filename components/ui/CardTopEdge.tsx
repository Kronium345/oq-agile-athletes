import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { ATHLETIC } from '../../constants/athleticDashboard';
import { COLORS, SHADOWS } from '../../constants/theme';

type CardTopEdgeProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  edgeHeight?: number;
};

export function CardTopEdge({
  children,
  style,
  contentStyle,
  edgeHeight = ATHLETIC.topEdgeHeight,
}: CardTopEdgeProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.topEdge, { height: edgeHeight }]} />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderRadius: ATHLETIC.cardRadius,
    borderWidth: 1,
    borderColor: ATHLETIC.borderPeach,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  topEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    zIndex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 20,
  },
});
