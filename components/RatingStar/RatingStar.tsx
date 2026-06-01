import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';

type Props = { rating: string };

export default function RatingStar({ rating }: Props) {
  const value = Math.min(5, Math.max(0, Math.round(parseFloat(rating) || 0)));
  return (
    <View style={styles.row}>
      <Text style={styles.stars}>{'★'.repeat(value)}{'☆'.repeat(5 - value)}</Text>
      <Text style={styles.rating}>{rating}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  stars: {
    color: COLORS.warning,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  rating: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
});
