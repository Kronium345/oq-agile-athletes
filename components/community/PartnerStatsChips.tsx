import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { getPartnerStatChips } from '../../lib/community/partnerStats';
import type { TrainingPartner } from '../../types/trainer';

type Props = { partner: TrainingPartner };

export function PartnerStatsChips({ partner }: Props) {
  const chips = getPartnerStatChips(partner);
  if (!chips.length) return null;

  return (
    <View style={styles.row}>
      {chips.map((chip) => (
        <View key={chip.key} style={styles.chip}>
          <Text style={styles.chipText} numberOfLines={1}>
            {chip.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: SPACING.xs,
  },
  chip: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.small,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  chipText: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});
