import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';

export type BreathPhase =
  | 'inhale'
  | 'inhale2'
  | 'holdIn'
  | 'exhale'
  | 'holdOut'
  | 'idle';

type Props = {
  phase: BreathPhase;
  phaseSeconds: number;
  label: string;
  reducedMotion?: boolean;
};

function scaleForPhase(phase: BreathPhase): number {
  switch (phase) {
    case 'inhale':
    case 'inhale2':
      return 1.28;
    case 'holdIn':
      return 1.28;
    case 'exhale':
      return 0.82;
    case 'holdOut':
      return 0.82;
    default:
      return 1;
  }
}

export function BreathingOrb({
  phase,
  phaseSeconds,
  label,
  reducedMotion = false,
}: Props) {
  const scale = useSharedValue(1);

  useEffect(() => {
    const target = scaleForPhase(phase);
    if (reducedMotion || phase === 'idle' || phaseSeconds <= 0) {
      scale.value = withTiming(target, { duration: 200 });
      return;
    }
    scale.value = withTiming(target, {
      duration: Math.max(phaseSeconds, 0.2) * 1000,
      easing: Easing.inOut(Easing.ease),
    });
  }, [phase, phaseSeconds, reducedMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.orbOuter, animatedStyle]}>
        <View style={styles.orbInner}>
          <Text style={styles.label}>{label}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 260,
  },
  orbOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 3,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  label: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    textAlign: 'center',
  },
});
