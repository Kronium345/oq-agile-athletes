import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import type { TrainerReview } from '../../types/trainer';

type Props = { reviews: TrainerReview[] };

export function ReviewList({ reviews }: Props) {
  if (!reviews.length) {
    return <Text style={styles.empty}>No reviews yet.</Text>;
  }
  return (
    <View>
      {reviews.map((r) => (
        <View key={r.id} style={styles.item}>
          <View style={styles.header}>
            <Text style={styles.name}>{r.displayName}</Text>
            <View style={styles.stars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < r.rating ? 'star' : 'star-outline'}
                  size={14}
                  color={COLORS.warning}
                />
              ))}
            </View>
          </View>
          <Text style={styles.text}>{r.text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.regular },
  item: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  name: { fontWeight: TYPOGRAPHY.fontWeight.semiBold, color: COLORS.textPrimary },
  stars: { flexDirection: 'row', gap: 2 },
  text: { fontSize: TYPOGRAPHY.fontSize.regular, color: COLORS.textSecondary, lineHeight: 20 },
});
