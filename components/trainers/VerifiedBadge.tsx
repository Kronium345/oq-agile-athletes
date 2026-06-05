import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';

type Props = { compact?: boolean };

export function VerifiedBadge({ compact }: Props) {
  return (
    <View style={[styles.badge, compact && styles.compact]}>
      <Ionicons name='shield-checkmark' size={compact ? 12 : 14} color={COLORS.success} />
      <Text style={[styles.text, compact && styles.compactText]}>Verified</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compact: { paddingHorizontal: 6, paddingVertical: 2 },
  text: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.success,
  },
  compactText: { fontSize: 10 },
});
