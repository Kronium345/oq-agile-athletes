// Home Page - Commit for new repo
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { AppBannerAd } from '../components/ads/AppBannerAd';
import BackgroundGradient from '../components/BackgroundGradient';
// PT / gym feature paused — re-enable when trainer directory launches
// import { GymMatchBanner } from '../components/trainers/GymMatchBanner';
import { CardTopEdge } from '../components/ui/CardTopEdge';
import { SkewedBadge } from '../components/ui/SkewedBadge';
import {
  ATHLETIC,
  athleticStatLabel,
  athleticStatNumber,
} from '../constants/athleticDashboard';
import { getTabBarBottomInset } from '../constants/layout';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../constants/theme';
import { useAuthContext } from './AuthProvider';
import { useDailySteps } from '../hooks/useDailySteps';
import { useWorkoutContext } from './WorkoutContext';

const { width } = Dimensions.get('window');

// Main Carousel Dot Pagination
const PaginationDot = ({ isActive }: { isActive: boolean }) => {
  const widthValue = useSharedValue(isActive ? 24 : 8);
  const opacityValue = useSharedValue(isActive ? 1 : 0.3);

  useEffect(() => {
    widthValue.value = withSpring(isActive ? 24 : 8, {
      mass: 1,
      damping: 15,
      stiffness: 120,
    });
    opacityValue.value = withSpring(isActive ? 1 : 0.3, {
      mass: 1,
      damping: 15,
      stiffness: 120,
    });
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: widthValue.value,
      opacity: opacityValue.value,
      backgroundColor: COLORS.primary,
      height: 8,
      borderRadius: 4,
    };
  });

  return <Animated.View style={animatedStyle} />;
};

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const scrollBottomInset = getTabBarBottomInset(insets.bottom, tabBarHeight);
  const { user } = useAuthContext();
  const { workout, calories, minutes } = useWorkoutContext();
  const { todaySteps, dailyGoal } = useDailySteps();
  // const memberGym = (user as Record<string, unknown> | null)?.gymName as
  //   | string
  //   | undefined;
  // const memberPostcode = (user as Record<string, unknown> | null)?.postcode as
  //   | string
  //   | undefined;
  const [activeSlide, setActiveSlide] = useState(0);
  const [foodTrackerComingSoonVisible, setFoodTrackerComingSoonVisible] =
    useState(false);

  // Carousel Data
  const carouselData = [
    {
      title: 'Calories',
      value: calories.toFixed(1),
      subtitle: 'Total calories burned',
      details: [
        { label: 'Burned', value: calories.toFixed(0) },
        {
          label: 'Per Workout',
          value: workout > 0 ? (calories / workout).toFixed(1) : '0',
        },
        { label: 'Goal', value: '2000' },
      ],
      circleColor: COLORS.primary,
      progress: Math.min(calories / 2000, 1),
    },
    {
      title: 'Workouts',
      value: workout.toString(),
      subtitle: 'Exercises completed',
      details: [
        { label: 'Completed', value: workout.toString() },
        { label: 'Minutes', value: minutes.toFixed(0) },
        {
          label: 'Avg Time',
          value: workout > 0 ? (minutes / workout).toFixed(1) + 'm' : '0m',
        },
      ],
      circleColor: COLORS.primary,
    },
    {
      title: 'Minutes',
      value: minutes.toFixed(0),
      subtitle: 'Time exercised',
      details: [
        { label: 'Total', value: minutes.toFixed(0) + 'm' },
        { label: 'Goal', value: '150m' },
        {
          label: 'Progress',
          value: (Math.min(minutes / 150, 1) * 100).toFixed(0) + '%',
        },
      ],
      circleColor: COLORS.primary,
    },
  ];

  const renderCarouselItem = ({ item }: { item: any }) => {
    if (!item) return null;
    const circleColor = item.circleColor || COLORS.primary;

    return (
      <CardTopEdge style={styles.carouselItem} contentStyle={styles.carouselContent}>
        <Text style={styles.carouselTitle}>{item.title.toUpperCase()}</Text>
        <Text style={styles.carouselSubtitle}>{item.subtitle}</Text>

        <View style={styles.circleContainer}>
          <View
            style={[
              styles.glowRing1,
              {
                shadowColor: circleColor,
                borderColor: circleColor,
              },
            ]}
          />
          <View
            style={[
              styles.glowRing2,
              {
                shadowColor: circleColor,
                borderColor: `${circleColor}99`,
              },
            ]}
          />
          <View
            style={[
              styles.glowRing3,
              {
                shadowColor: circleColor,
                borderColor: `${circleColor}66`,
              },
            ]}
          />

          <View
            style={[
              styles.circleMain,
              {
                borderColor: circleColor,
                shadowColor: circleColor,
              },
            ]}
          >
            <View
              style={[styles.circleInner, { borderColor: `${circleColor}33` }]}
            >
              <Text style={styles.circleValue}>{item.value}</Text>
              <Text style={styles.circleLabel}>{item.title}</Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          {item.details.map((detail: any, index: number) => (
            <View key={index} style={styles.detailColumn}>
              <Text style={styles.detailValue}>{detail.value}</Text>
              <Text style={styles.detailLabel}>
                {detail.label.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
      </CardTopEdge>
    );
  };

  // Quick Action Cards
  const quickActionCards = [
    {
      quickActionCardTitle: 'Exercises',
      description: 'Browse exercise library',
      action: 'Explore',
      route: '/(drawer)/(tabs)/exercises',
    },
    {
      quickActionCardTitle: 'Steps',
      description: 'Track your daily steps',
      action: 'View',
      route: '/(drawer)/(tabs)/stepCount',
    },
    {
      quickActionCardTitle: 'Fitness Network',
      description: 'Partners & recommended groups',
      action: 'Open',
      route: '/(drawer)/community',
    },
    {
      quickActionCardTitle: 'History',
      description: 'View logged exercises',
      action: 'Open',
      route: '/(drawer)/workoutHistory',
    },
    {
      quickActionCardTitle: 'Mind Center',
      description: 'Assessment, resources & wellness',
      action: 'Open',
      route: '/(drawer)/mental',
    },
    {
      quickActionCardTitle: 'AI Coach',
      description: 'Chat about training & recovery',
      action: 'Chat',
      route: '/(drawer)/aiChat',
    },
    {
      quickActionCardTitle: 'AI Form Coach',
      description: 'Analyze your form',
      action: 'Analyze',
      route: '/(drawer)/formCoach',
    },
    {
      quickActionCardTitle: 'Food Tracker',
      description: 'Log meals & scan nutrition',
      action: 'Soon',
      route: '/(drawer)/foodScreen',
      locked: true,
    },
    // {
    //   quickActionCardTitle: 'Find a Trainer',
    //   description: 'PTs at your gym & nearby',
    //   action: 'Browse',
    //   route: '/(drawer)/trainers',
    // },
  ];

  const renderQuickActionCard = ({ item }: { item: any }) => {
    if (!item) return null;
    return (
      <TouchableOpacity
        style={styles.quickActionTouchable}
        activeOpacity={item.locked ? 0.85 : 0.7}
        onPress={() => {
          if (item.locked) {
            setFoodTrackerComingSoonVisible(true);
            return;
          }
          router.push(item.route as any);
        }}
      >
        <CardTopEdge
          style={styles.quickActionCard}
          contentStyle={styles.quickActionContent}
        >
          <View style={styles.categoryMarker} />
          <Text style={styles.quickActionCardTitle}>
            {item.quickActionCardTitle}
          </Text>
          <Text style={styles.quickActionDescription}>{item.description}</Text>
          <View style={styles.quickActionButton}>
            <Text style={styles.quickActionButtonText}>{item.action}</Text>
          </View>
        </CardTopEdge>
        {item.locked ? (
          <View style={styles.quickActionLockOverlay}>
            <View style={styles.quickActionLockBadge}>
              <Ionicons
                name='lock-closed'
                size={28}
                color={COLORS.textPrimary}
              />
            </View>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  // Quick Cards
  const quickCards = [
    {
      title: 'Steps',
      icon: 'footsteps',
      value: todaySteps.toLocaleString(),
      goal: dailyGoal.toLocaleString(),
      goalLabel: 'DAILY GOAL',
      route: '/(drawer)/(tabs)/stepCount',
    },
    {
      title: 'Exercises',
      icon: 'barbell',
      value: workout.toString(),
      time: `${minutes.toFixed(0)}`,
      timeLabel: 'MINUTES',
      route: '/(drawer)/(tabs)/exercises',
    },
  ];

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'left']}>
        {/* Featured Card */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.featuredCardContainer}
        >
          <CardTopEdge contentStyle={styles.featuredContent}>
            <SkewedBadge label='Welcome' style={styles.featuredBadge} />
            <Text style={styles.featuredTitle}>AGILE ATHLETES</Text>
            <Text style={styles.featuredSubtitle}>
              Train smarter.{'\n'}Recover better.{'\n'}Perform longer.
            </Text>
            <TouchableOpacity
              style={styles.featuredButton}
              onPress={() => router.push('/(drawer)/(tabs)/exercises' as any)}
            >
              <Text style={styles.featuredButtonText}>Get Started</Text>
            </TouchableOpacity>
          </CardTopEdge>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: scrollBottomInset }}
        >
          {/* PT / gym feature paused
          <Animated.View entering={FadeInDown.delay(175).springify()}>
            <GymMatchBanner gymName={memberGym} postcode={memberPostcode} />
          </Animated.View>
          */}

          {/* Carousel - Replaced with simple list */}
          {carouselData && carouselData.length > 0 ? (
            <Animated.View
              entering={FadeInDown.delay(200).springify()}
              style={styles.carouselContainer}
            >
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  const slideIndex = Math.round(
                    event.nativeEvent.contentOffset.x / (width - 40),
                  );
                  setActiveSlide(slideIndex);
                }}
              >
                {carouselData.map((item, index) => (
                  <View key={index} style={{ width: width - 40 }}>
                    {renderCarouselItem({ item })}
                  </View>
                ))}
              </ScrollView>
              <View style={styles.paginationContainer}>
                {carouselData.map((_, index) => (
                  <PaginationDot key={index} isActive={index === activeSlide} />
                ))}
              </View>
            </Animated.View>
          ) : null}

          {quickActionCards && quickActionCards.length > 0 ? (
            <Animated.View
              entering={FadeInDown.delay(250).springify()}
              style={styles.quickActionsSection}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: SPACING.md }}
              >
                {quickActionCards.map((item, index) => (
                  <View key={index} style={styles.quickActionCardWrap}>
                    {renderQuickActionCard({ item })}
                  </View>
                ))}
              </ScrollView>
            </Animated.View>
          ) : null}

          {/* Quick Cards */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={styles.quickCardsContainer}
          >
            {quickCards.map((card, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickCardTouchable}
                onPress={() => router.push(card.route as any)}
              >
                <CardTopEdge
                  style={styles.quickCard}
                  contentStyle={styles.quickCardContent}
                >
                  <View style={styles.quickCardHeader}>
                    <Text style={styles.quickCardTitle}>
                      {card.title.toUpperCase()}
                    </Text>
                    <Ionicons
                      name='chevron-forward'
                      size={18}
                      color={COLORS.textSecondary}
                    />
                  </View>

                  <View style={styles.quickCardRow}>
                    <Ionicons
                      name={card.icon as any}
                      size={20}
                      color={COLORS.primary}
                    />
                    <Text style={styles.quickCardValue}>{card.value}</Text>
                  </View>

                  {card.goal ? (
                    <>
                      <Text style={styles.quickCardMetaValue}>{card.goal}</Text>
                      <Text style={styles.quickCardMetaLabel}>
                        {card.goalLabel}
                      </Text>
                    </>
                  ) : null}

                  {card.time ? (
                    <>
                      <Text style={styles.quickCardMetaValue}>{card.time}</Text>
                      <Text style={styles.quickCardMetaLabel}>
                        {card.timeLabel}
                      </Text>
                    </>
                  ) : null}
                </CardTopEdge>
              </TouchableOpacity>
            ))}
          </Animated.View>

          <AppBannerAd />
        </ScrollView>
      </SafeAreaView>

      <Modal
        transparent
        visible={foodTrackerComingSoonVisible}
        animationType='fade'
        onRequestClose={() => setFoodTrackerComingSoonVisible(false)}
      >
        <View style={styles.comingSoonOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setFoodTrackerComingSoonVisible(false)}
          />
          <View style={styles.comingSoonCard}>
            <View style={styles.comingSoonIconWrap}>
              <Ionicons name='lock-closed' size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.comingSoonTitle}>Food Tracker</Text>
            <Text style={styles.comingSoonMessage}>
              Food Tracker will be available for the next update, stay tuned.
            </Text>
            <TouchableOpacity
              style={styles.comingSoonButton}
              onPress={() => setFoodTrackerComingSoonVisible(false)}
            >
              <Text style={styles.comingSoonButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Toast />
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    marginTop: 0,
  },
  featuredCardContainer: {
    marginTop: 75,
    marginVertical: SPACING.lg,
    marginHorizontal: SPACING.xl,
  },
  featuredBadge: {
    marginBottom: SPACING.md,
  },
  featuredContent: {
    padding: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  featuredTitle: {
    fontSize: TYPOGRAPHY.fontSize.extraLarge,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  featuredSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  featuredButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.medium,
    alignSelf: 'flex-start',
  },
  featuredButtonText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.small,
  },
  quickActionsSection: {
    marginVertical: SPACING.md,
    marginHorizontal: SPACING.xl,
    overflow: 'hidden',
  },
  quickActionsCarousel: {},
  quickActionsCarouselContent: {
    paddingRight: 0,
  },
  quickActionCardWrap: {
    width: 168,
    marginRight: SPACING.md,
  },
  quickActionTouchable: {
    width: '100%',
  },
  quickActionCard: {
    minHeight: 140,
    width: '100%',
  },
  quickActionContent: {
    minHeight: 120,
    justifyContent: 'space-between',
    paddingTop: 18,
  },
  categoryMarker: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: ATHLETIC.categoryMarkerSize,
    height: ATHLETIC.categoryMarkerSize,
    backgroundColor: COLORS.primary,
  },
  quickActionCardTitle: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  quickActionDescription: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 16,
  },
  quickActionButton: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.borderPeach,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: ATHLETIC.cardRadius,
    alignSelf: 'flex-start',
  },
  quickActionButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  quickActionLockOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLockBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  comingSoonOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  comingSoonCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.cardLarge,
  },
  comingSoonIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  comingSoonTitle: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  comingSoonMessage: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  comingSoonButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    borderRadius: BORDER_RADIUS.large,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  comingSoonButtonText: {
    color: COLORS.textButton,
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  carouselContainer: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  carouselItem: {
    margin: 4,
  },
  carouselContent: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  carouselTitle: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  carouselSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    position: 'relative',
    height: 150,
    width: 150,
    alignSelf: 'center',
  },
  glowRing1: {
    position: 'absolute',
    width: 135,
    height: 135,
    borderRadius: 70,
    borderWidth: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 15,
  },
  glowRing2: {
    position: 'absolute',
    width: 138,
    height: 138,
    borderRadius: 70,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 15,
    elevation: 12,
  },
  glowRing3: {
    position: 'absolute',
    width: 142,
    height: 142,
    borderRadius: 71,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  circleMain: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
  },
  circleInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  circleValue: {
    ...athleticStatNumber,
    fontSize: 28,
    marginBottom: 2,
  },
  circleLabel: {
    ...athleticStatLabel,
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  detailColumn: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    ...athleticStatLabel,
    marginTop: 4,
  },
  detailValue: {
    ...athleticStatNumber,
    fontSize: 24,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  quickCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.xl,
    marginVertical: SPACING.md,
    paddingBottom: 100,
  },
  quickCardTouchable: {
    width: '48%',
  },
  quickCard: {
    width: '100%',
  },
  quickCardContent: {
    minHeight: 130,
    justifyContent: 'space-between',
  },
  quickCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  quickCardTitle: {
    ...athleticStatLabel,
    fontSize: TYPOGRAPHY.fontSize.small,
  },
  quickCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  quickCardValue: {
    ...athleticStatNumber,
    fontSize: 28,
  },
  quickCardMetaValue: {
    ...athleticStatNumber,
    fontSize: 20,
    marginTop: SPACING.sm,
  },
  quickCardMetaLabel: {
    ...athleticStatLabel,
    marginTop: 2,
  },
});
