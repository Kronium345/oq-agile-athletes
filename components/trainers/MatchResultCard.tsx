import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import type { TrainerListItem } from '../../types/trainer';
import { TrainerCard } from './TrainerCard';

type Props = {
  trainer: TrainerListItem;
  explanation?: string;
};

export function MatchResultCard({ trainer, explanation }: Props) {
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      <TrainerCard trainer={trainer} />
      {explanation ? <Text style={styles.reason}>{explanation}</Text> : null}
      <TouchableOpacity
        style={styles.cta}
        onPress={() => router.push(`/trainer/${trainer.id}` as any)}
      >
        <Text style={styles.ctaText}>View profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: SPACING.lg },
  reason: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    marginTop: -4,
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
    lineHeight: 20,
  },
  cta: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.medium,
  },
  ctaText: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.small,
  },
});
