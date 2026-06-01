import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { categories } from '../Quiz/questions';
import {
  BORDER_RADIUS,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '../../constants/theme';

type Props = {
  activeLabel: number;
};

const CELLS = [
  { label: 0, row: 0, col: 0 },
  { label: 1, row: 1, col: 0 },
  { label: 2, row: 0, col: 1 },
  { label: 3, row: 1, col: 1 },
];

export default function OutcomeMatrix({ activeLabel }: Props) {
  const getCategory = (label: number) =>
    categories.find((c) => c.label === label);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Outcome matrix</Text>
      <Text style={styles.subtitle}>
        Anger × anxiety classification (wellness support, not a diagnosis).
      </Text>

      <View style={styles.axisRow}>
        <View style={styles.corner} />
        <Text style={[styles.axisLabel, styles.colAxis]}>Anxiety low</Text>
        <Text style={[styles.axisLabel, styles.colAxis]}>Anxiety high</Text>
      </View>

      <View style={styles.gridRow}>
        <Text style={styles.rowAxis}>Anger{'\n'}low</Text>
        <View style={styles.grid}>
          {CELLS.filter((c) => c.row === 0).map((cell) => {
            const cat = getCategory(cell.label);
            const active = cell.label === activeLabel;
            return (
              <View
                key={cell.label}
                style={[styles.cell, active && styles.cellActive]}
              >
                <Text style={[styles.cellTitle, active && styles.cellTitleActive]}>
                  {cat?.category ?? '—'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.gridRow}>
        <Text style={styles.rowAxis}>Anger{'\n'}high</Text>
        <View style={styles.grid}>
          {CELLS.filter((c) => c.row === 1).map((cell) => {
            const cat = getCategory(cell.label);
            const active = cell.label === activeLabel;
            return (
              <View
                key={cell.label}
                style={[styles.cell, active && styles.cellActive]}
              >
                <Text style={[styles.cellTitle, active && styles.cellTitleActive]}>
                  {cat?.category ?? '—'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  axisRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  corner: { width: 52 },
  colAxis: {
    flex: 1,
    textAlign: 'center',
  },
  axisLabel: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textSecondary,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  rowAxis: {
    width: 52,
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  cell: {
    flex: 1,
    minHeight: 72,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.backgroundAlt,
    padding: SPACING.sm,
    justifyContent: 'center',
  },
  cellActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  cellTitle: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  cellTitleActive: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});
