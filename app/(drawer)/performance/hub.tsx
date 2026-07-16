import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundGradient from '../../../components/BackgroundGradient';
import { TrainerScreenHeader } from '../../../components/trainers/TrainerScreenHeader';
import { drawerScreenStyles } from '../../../constants/drawerScreen';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../../constants/theme';
import { useDrawerListPadding } from '../../../hooks/useDrawerListPadding';
import { usePremiumGate } from '../../../hooks/usePremiumGate';

const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?w=800&auto=format&fit=crop`;

const TILES = [
  {
    title: '30 & 90-day trends',
    subtitle: 'Recovery, sleep, stress & energy over time',
    route: '/(drawer)/performance/trends',
    icon: 'trending-up' as const,
    image: IMG('photo-1551288049-bebda4e38f71'),
  },
  {
    title: 'Recommendations',
    subtitle: 'Personalized recovery tips from your check-ins',
    route: '/(drawer)/performance/recommendations',
    icon: 'bulb' as const,
    image: IMG('photo-1517838277536-f5f99be501cd'),
  },
  {
    title: 'Education',
    subtitle: 'Sleep, stress, training load & nutrition articles',
    route: '/(drawer)/performance/education',
    icon: 'book' as const,
    image: IMG('photo-1481627834876-b7833e8f5570'),
  },
  {
    title: 'Weekly summary',
    subtitle: 'Your week at a glance',
    route: '/(drawer)/performance/weekly-summary',
    icon: 'calendar' as const,
    image: IMG('photo-1506784983877-45594efa4cbe'),
  },
  {
    title: "Today's dashboard",
    subtitle: 'Free daily recovery view',
    route: '/(drawer)/performance',
    icon: 'speedometer' as const,
    free: true,
    image: IMG('photo-1544367567-0f2fcb009e0b'),
  },
  {
    title: 'Recovery Toolkit',
    subtitle: 'Guided breathing sessions',
    route: '/(drawer)/recovery',
    icon: 'leaf' as const,
    image: IMG('photo-1506126613408-eca07ce68773'),
  },
];

export default function PerformanceHubScreen() {
  const router = useRouter();
  const listPadding = useDrawerListPadding();
  const { isLoading: isPremiumLoading, requirePremium } =
    usePremiumGate('Performance Hub');

  useFocusEffect(
    useCallback(() => {
      if (isPremiumLoading) return;
      requirePremium();
    }, [isPremiumLoading, requirePremium]),
  );

  return (
    <BackgroundGradient>
      <SafeAreaView style={drawerScreenStyles.safe} edges={['top']}>
        <TrainerScreenHeader
          title='Performance Hub'
          subtitle='Trends, education & weekly summary'
          avoidDrawerMenu
        />

        <Text style={styles.disclaimer}>
          Wellness support only — not medical advice. Premium depth for training
          readiness and recovery patterns.
        </Text>

        <ScrollView
          contentContainerStyle={[
            drawerScreenStyles.scrollContent,
            styles.grid,
            listPadding,
          ]}
        >
          {TILES.map((tile) => (
            <TouchableOpacity
              key={tile.route}
              style={styles.tile}
              onPress={() => router.push(tile.route as any)}
            >
              <ImageBackground
                source={{ uri: tile.image }}
                style={styles.tileBg}
                imageStyle={styles.tileImage}
              >
                <View style={styles.tileOverlay}>
                  <Ionicons name={tile.icon} size={22} color='#fff' />
                  <Text style={styles.tileTitle}>{tile.title}</Text>
                  <Text style={styles.tileSubtitle}>{tile.subtitle}</Text>
                  {tile.free ? (
                    <Text style={styles.freeBadge}>Also on free tier</Text>
                  ) : null}
                </View>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  disclaimer: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  grid: {
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  tile: {
    borderRadius: BORDER_RADIUS.large,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  tileBg: { minHeight: 120 },
  tileImage: { borderRadius: BORDER_RADIUS.large },
  tileOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: SPACING.md,
    justifyContent: 'flex-end',
    gap: 4,
  },
  tileTitle: {
    color: '#fff',
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
  tileSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: TYPOGRAPHY.fontSize.small,
  },
  freeBadge: {
    marginTop: 4,
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
});
