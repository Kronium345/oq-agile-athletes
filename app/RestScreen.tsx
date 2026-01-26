import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundGradient from '../components/BackgroundGradient';
import { COLORS, SPACING } from '../constants/theme';

export default function RestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [timeLeft, setTimeLeft] = useState(3);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (params.exercises) {
        const nextIndex = params.nextIndex ? (params.nextIndex as string) : undefined;
        router.replace({
          pathname: '/FitScreen',
          params: {
            exercises: params.exercises as string,
            ...(nextIndex && { nextIndex }),
          },
        } as any);
      } else {
        // Fallback: try to go back, or navigate to home if that fails
        try {
          router.back();
        } catch (error) {
          router.replace('/home' as any);
        }
      }
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, params.exercises, params.nextIndex]);

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Image
            source={{
              uri: 'https://cdn-images.cure.fit/www-curefit-com/image/upload/fl_progressive,f_auto,q_auto:eco,w_500,ar_500:300,c_fit/dpr_2/image/carefit/bundle/CF01032_magazine_2.png',
            }}
            style={styles.image}
          />
          <Text style={styles.title}>TAKE A BREAK!</Text>
          <Text style={styles.countdown}>{timeLeft}</Text>
        </View>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: 420,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: SPACING.xl,
    textAlign: 'center',
  },
  countdown: {
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: SPACING.xl,
    textAlign: 'center',
  },
});

