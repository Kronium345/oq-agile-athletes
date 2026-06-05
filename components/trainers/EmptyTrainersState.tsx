import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

type Props = { message?: string };

export function EmptyTrainersState({
  message = 'No trainers found. Try adjusting your filters or check back soon.',
}: Props) {
  return (
    <View style={styles.wrap}>
      <Ionicons name='people-outline' size={48} color={COLORS.textSecondary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  text: {
    marginTop: SPACING.md,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});
