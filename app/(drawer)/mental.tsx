import { Ionicons } from '@expo/vector-icons';
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
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../constants/theme';
import { useMindCenterUkGate } from '../../hooks/useMindCenterUkGate';
import { usePremiumGate } from '../../hooks/usePremiumGate';

const TILES = [
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
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Ionicons
              name='chevron-back'
              size={22}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mind Center</Text>
          <View style={styles.back} />
        </View>

        <Text style={styles.disclaimer}>
          Wellness support only — not medical advice, diagnosis, or treatment.
          {inUk === false
            ? ' UK-only contacts and directories are hidden — use Assessment, Exercise, and Readings.'
            : ''}
        </Text>

        <TouchableOpacity
          style={styles.freeRecoveryLink}
          onPress={() => router.push('/(drawer)/performance' as any)}
        >
          <Text style={styles.freeRecoveryText}>
            Daily Recovery Check-In (free)
          </Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.grid}>
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
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  back: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    ...SHADOWS.card,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  freeRecoveryLink: {
    alignSelf: 'center',
    marginBottom: SPACING.md,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  freeRecoveryText: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.small,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  tile: {
    width: '44%',
    aspectRatio: 1,
    margin: SPACING.sm,
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
