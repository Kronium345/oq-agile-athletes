// Primary Colors
export const COLORS = {
  // Primary Orange (replaces green)
  primary: '#F37021',
  primaryDark: 'rgba(243, 112, 33, 0.8)',
  primaryMedium: 'rgba(243, 112, 33, 0.75)',
  primaryLight: 'rgba(243, 112, 33, 0.15)',
  primaryOverlay: 'rgba(243, 112, 33, 0.4)',
  primaryShadow: 'rgba(243, 112, 33, 1)',

  // Background Colors (Light theme)
  background: '#FFFFFF',
  backgroundAlt: '#F5F5F5',
  backgroundCard: 'rgba(255, 255, 255, 0.9)',
  backgroundOverlay: 'rgba(0, 0, 0, 0.05)',

  // Text Colors
  textPrimary: '#1A1A1A',
  textSecondary: 'rgba(26, 26, 26, 0.7)',
  textTertiary: 'rgba(26, 26, 26, 0.85)',
  textButton: '#FFFFFF',
  textButtonSecondary: '#1A1A1A',

  // Accent Colors (for future use)
  accentGreen: 'rgb(31, 116, 31)',
  accentBrown: 'rgb(139, 45, 16)',
  accentPurple: 'rgb(159, 18, 187)',
  accentBlue: 'rgb(10, 107, 197)',
  accentBright: '#F37021',

  // Shadows
  shadowPrimary: 'rgba(0, 0, 0, 0.1)',
  shadowOrange: 'rgba(243, 112, 33, 0.3)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',
  shadowCard: 'rgba(0, 0, 0, 0.08)',

  // Borders
  borderLight: 'rgba(0, 0, 0, 0.1)',
  borderMedium: 'rgba(0, 0, 0, 0.2)',
  borderOrange: 'rgba(243, 112, 33, 0.2)',
  borderPeach: '#FFE3D3',

  // Error/Status
  error: '#dc2626',
  success: '#10b981',
  warning: '#f59e0b',
} as const;

// Typography
export const TYPOGRAPHY = {
  fontSize: {
    extraLarge: 26,
    large: 18,
    medium: 16,
    regular: 14,
    small: 12,
    extraSmall: 10,
  },
  fontWeight: {
    bold: '700' as const,
    semiBold: '600' as const,
    medium: '500' as const,
    regular: '400' as const,
  },
  lineHeight: {
    tight: 14,
    normal: 'auto' as const,
  },
} as const;

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// Border Radius
export const BORDER_RADIUS = {
  small: 12,
  medium: 16,
  large: 20,
  circle: 50,
} as const;

// Shadow Configurations
export const SHADOWS = {
  card: {
    shadowColor: COLORS.shadowCard,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardLarge: {
    shadowColor: COLORS.shadowPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  orange: {
    shadowColor: COLORS.primaryShadow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
} as const;

// Gradient Colors
export const GRADIENTS = {
  background: ['#FFFFFF', '#FFF5F0', '#FFE8DC'],
  card: ['rgba(255, 255, 255, 0.95)', 'rgba(255, 248, 245, 0.9)'],
  primary: ['rgba(243, 112, 33, 0.1)', 'rgba(243, 112, 33, 0.8)'],
  featured: ['rgba(255, 255, 255, 1)', 'rgba(243, 112, 33, 0.15)'],
} as const;

// Animation Durations
export const ANIMATION = {
  fadeIn: 300,
  spring: {
    mass: 1,
    damping: 15,
    stiffness: 120,
  },
  smoothSpring: {
    mass: 0.5,
    damping: 12,
    stiffness: 100,
  },
} as const;

