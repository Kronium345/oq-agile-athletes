import { BlurView } from 'expo-blur';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../constants/theme';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

interface BlobBackgroundProps {
  variant?: 'scale' | 'translate';
}

const BlobBackground: React.FC<BlobBackgroundProps> = ({ variant = 'scale' }) => {
  const animation1 = useSharedValue(0);
  const animation2 = useSharedValue(0);
  const animation3 = useSharedValue(0);

  useEffect(() => {
    if (variant === 'scale') {
      // Scale and rotate animation
      animation1.value = withRepeat(
        withTiming(1, {
          duration: 15000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
      animation2.value = withRepeat(
        withTiming(1, {
          duration: 25000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
      animation3.value = withRepeat(
        withTiming(1, {
          duration: 20000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    } else {
      // Translate animation
      animation1.value = withRepeat(
        withTiming(1, {
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
      animation2.value = withRepeat(
        withTiming(1, {
          duration: 12000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
      animation3.value = withRepeat(
        withTiming(1, {
          duration: 10000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    }
  }, [variant]);

  const createBlobStyle = (animation: SharedValue<number>, index: number) => {
    'worklet';
    if (variant === 'scale') {
      const scale = 1 + animation.value * 0.2;
      const rotate = animation.value * 360;
      return {
        transform: [{ scale }, { rotate: `${rotate}deg` }],
        opacity: 0.7 + animation.value * 0.2,
      };
    } else {
      const translateX = (animation.value - 0.5) * 40;
      const translateY = (animation.value - 0.5) * 40;
      return {
        transform: [{ translateX }, { translateY }],
      };
    }
  };

  const blob1Style = useAnimatedStyle(() => createBlobStyle(animation1, 0));
  const blob2Style = useAnimatedStyle(() => createBlobStyle(animation2, 1));
  const blob3Style = useAnimatedStyle(() => createBlobStyle(animation3, 2));

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 0 }]}>
      <View style={styles.backgroundContainer}>
        {/* Blob 1 - Primary Orange */}
        <AnimatedSvg
          style={[
            styles.blob,
            {
              left: '10%',
              top: '20%',
            },
            blob1Style,
          ]}
          width={200}
          height={200}
        >
          <Circle r={100} cx={100} cy={100} fill={COLORS.primaryOverlay} />
        </AnimatedSvg>

        {/* Blob 2 - Light Orange */}
        <AnimatedSvg
          style={[
            styles.blob,
            {
              left: '60%',
              top: '45%',
            },
            blob2Style,
          ]}
          width={200}
          height={200}
        >
          <Circle r={110} cx={100} cy={100} fill={COLORS.primaryLight} />
        </AnimatedSvg>

        {/* Blob 3 - Subtle Overlay */}
        <AnimatedSvg
          style={[
            styles.blob,
            {
              left: '30%',
              top: '70%',
            },
            blob3Style,
          ]}
          width={200}
          height={200}
        >
          <Circle r={90} cx={100} cy={100} fill={COLORS.backgroundOverlay} />
        </AnimatedSvg>
      </View>
      <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    position: 'absolute',
  },
});

export default BlobBackground;

