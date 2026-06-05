import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import type { FitnessGroup } from '../../types/trainer';

type Props = { group: FitnessGroup };

export function GroupCard({ group }: Props) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push(`/(drawer)/community/group/${group.id}` as any)
      }
    >
      <Text style={styles.name}>{group.name}</Text>
      <Text style={styles.desc} numberOfLines={2}>
        {group.description}
      </Text>
      {group.scheduleSummary ? (
        <Text style={styles.meta}>{group.scheduleSummary}</Text>
      ) : null}
      {group.memberCount != null ? (
        <Text style={styles.meta}>{group.memberCount} members</Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  desc: { fontSize: TYPOGRAPHY.fontSize.regular, color: COLORS.textSecondary, marginBottom: 6 },
  meta: { fontSize: TYPOGRAPHY.fontSize.small, color: COLORS.primary },
});
