import { StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { recoveryScoreColor, formatRecoveryPercent } from '../../lib/performance/scoring';

type Props = {
  label: string;
  score: number;
  subtitle?: string;
  compact?: boolean;
  /** Show score as 0–100 percentage (e.g. 58%). */
  asPercent?: boolean;
};

export function ScoreCard({ label, score, subtitle, compact, asPercent }: Props) {
  const color = recoveryScoreColor(score);
  const display = asPercent ? formatRecoveryPercent(score) : String(score);
  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={[styles.ring, { borderColor: color }]}>
        <Text style={[styles.score, { color }]}>{display}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    flex: 1,
    minWidth: 72,
    padding: SPACING.sm,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardCompact: {
    minWidth: 64,
    padding: SPACING.xs,
  },
  ring: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  score: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
});
