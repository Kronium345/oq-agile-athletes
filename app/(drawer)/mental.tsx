import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundGradient from '../../components/BackgroundGradient';
import { UkLocationModal } from '../../components/mindCenter/UkLocationModal';
import { TrainerScreenHeader } from '../../components/trainers/TrainerScreenHeader';
import { drawerScreenStyles } from '../../constants/drawerScreen';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../constants/theme';
import { useDrawerListPadding } from '../../hooks/useDrawerListPadding';
import { useMindCenterUkGate } from '../../hooks/useMindCenterUkGate';
import { usePremiumGate } from '../../hooks/usePremiumGate';

const TILES = [
  {
    nav: 'RecoveryToolkit',
    text: 'Recovery Toolkit — guided breathing for calm & recovery',
    image:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop',
    hubRoute: '/(drawer)/recovery',
  },
  {
    nav: 'PerformanceHub',
    text: 'Performance Hub — trends, education & weekly summary',
    image:
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop',
    hubRoute: '/(drawer)/performance/hub',
  },
  {
    nav: 'Assessment',
    text: 'Take a self test (anger & anxiety assessment)',
    image:
      'https://static.vecteezy.com/system/resources/previews/003/206/208/original/quiz-time-neon-signs-style-text-free-vector.jpg',
  },
  {
    nav: 'Exercise',
    text: 'Explore daily exercise for a healthy life',
    image:
      'https://plus.unsplash.com/premium_photo-1679938885972-180ed418f466?q=80&w=2070&auto=format&fit=crop',
  },
  {
    nav: 'Doctors',
    text: 'UK professional directories',
    image:
      'https://png.pngtree.com/thumb_back/fh260/background/20210827/pngtree-doctor-holding-stethoscope-in-hand-against-white-background-image_764536.jpg',
  },
  {
    nav: 'Hospitals',
    text: 'UK hospital listings',
    image:
      'https://images.unsplash.com/photo-1512678080530-7760d81faba6?q=80&w=2074&auto=format&fit=crop',
  },
  {
    nav: 'Readings',
    text: 'Read articles about anxiety, anger and symptoms',
    image:
      'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=774&q=80',
  },
  {
    nav: 'Emergency',
    text: 'UK emergency contacts',
    image:
      'https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?auto=format&fit=crop&w=800&q=80',
  },
  {
    nav: 'MindAssistant',
    text: 'Ask Mind Assistant (contacts & info)',
    image:
      'https://images.unsplash.com/photo-1573497019940-9c28cafe0e32?q=80&w=800&auto=format&fit=crop',
  },
];

export default function MentalHomePage() {
  const router = useRouter();
  const listPadding = useDrawerListPadding();
  const { isLoading: isPremiumLoading, requirePremium } =
    usePremiumGate('Mind Center');
  const {
    inUk,
    locationModalVisible,
    navigateMindCenterRoute,
    onSelectUk,
    onSelectNonUk,
    promptLocationIfUnset,
  } = useMindCenterUkGate();

  useFocusEffect(
    useCallback(() => {
      if (isPremiumLoading) return;
      requirePremium();
      promptLocationIfUnset();
    }, [isPremiumLoading, requirePremium, promptLocationIfUnset]),
  );

  return (
    <BackgroundGradient>
      <SafeAreaView style={drawerScreenStyles.safe} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={[drawerScreenStyles.scrollContent, listPadding]}
        >
          <TrainerScreenHeader
            title='Mind Center'
            subtitle={
              inUk === false
                ? 'UK-only contacts are hidden — use Assessment, Exercise, and Readings.'
                : 'Wellness support only — not medical advice, diagnosis, or treatment.'
            }
            avoidDrawerMenu
          />

          <TouchableOpacity
            style={styles.freeRecoveryLink}
            onPress={() => router.push('/(drawer)/performance' as any)}
          >
            <Text style={styles.freeRecoveryText}>
              Daily Recovery Check-In (free)
            </Text>
          </TouchableOpacity>

          <View style={styles.grid}>
            {TILES.map((tile) => (
              <TouchableOpacity
                key={tile.nav}
                style={styles.tile}
                onPress={() => {
                  if ('hubRoute' in tile && tile.hubRoute) {
                    router.push(tile.hubRoute as any);
                    return;
                  }
                  navigateMindCenterRoute(tile.nav);
                }}
              >
                <ImageBackground
                  source={{ uri: tile.image }}
                  style={styles.tileImage}
                >
                  <View style={styles.tileOverlay}>
                    <Text style={styles.tileText}>{tile.text}</Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      <UkLocationModal
        visible={locationModalVisible}
        onSelectUk={onSelectUk}
        onSelectNonUk={onSelectNonUk}
      />
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  freeRecoveryLink: {
    alignSelf: 'flex-start',
    marginBottom: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  freeRecoveryText: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.small,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: SPACING.xxl,
  },
  tile: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.medium,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  tileImage: { width: '100%', height: '100%', justifyContent: 'flex-end' },
  tileOverlay: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  tileText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
  },
});
