import { COLORS } from './theme';

/** Shared “Athletic Dashboard” visual language for Home, Steps, Profile */
export const ATHLETIC = {
  cardRadius: 14,
  borderPeach: '#FFE3D3',
  topEdgeHeight: 4,
  categoryMarkerSize: 8,
  skewDeg: '-12deg',
} as const;

export const athleticStatNumber = {
  fontSize: 32,
  fontWeight: '900' as const,
  letterSpacing: -1,
  color: COLORS.textPrimary,
};

export const athleticStatLabel = {
  fontSize: 11,
  fontWeight: '600' as const,
  letterSpacing: 0.8,
  textTransform: 'uppercase' as const,
  color: COLORS.textSecondary,
};
