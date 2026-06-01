import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import BackgroundGradient from '../components/BackgroundGradient';
import BlobBackground from '../components/BlobBackground';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../constants/theme';
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
  const { workout, calories, minutes } = useWorkoutContext();
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeAnnouncementIndex, setActiveAnnouncementIndex] = useState(0);
  const translateY = useSharedValue(0);
  const glowPosition = useSharedValue(0);

  // Announcement Messages
  const announcements = [
    {
      text: 'Welcome to Agile Athletes!',
      link: null,
    },
    {
      text: 'Track your workouts and progress',
      link: null,
    },
    {
      text: 'Join our fitness community',
      link: null,
    },
  ];

  useEffect(() => {
    const animateGlow = () => {
      glowPosition.value = 0;
      glowPosition.value = withRepeat(
        withTiming(1, { duration: 3000, easing: Easing.linear }),
        -1,
        false,
      );
    };

    animateGlow();

    const interval = setInterval(() => {
      if (!announcements || announcements.length === 0) return;

      translateY.value = withSpring(-40, {
        damping: 12,
        stiffness: 100,
        mass: 0.5,
      });

      setTimeout(() => {
        setActiveAnnouncementIndex((current) => {
          const nextIndex =
            current === announcements.length - 1 ? 0 : current + 1;
          translateY.value = 40;

          translateY.value = withSpring(0, {
            damping: 12,
            stiffness: 100,
            mass: 0.5,
          });

          return nextIndex;
        });
      }, 300);
    }, 6000);

    return () => clearInterval(interval);
  }, [announcements]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

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
      <View style={styles.carouselItem}>
        <Text style={styles.carouselTitle}>{item.title}</Text>
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
              <Text style={styles.detailLabel}>{detail.label}</Text>
              <Text style={styles.detailValue}>{detail.value}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Quick Action Cards
  const quickActionCards = [
    {
      quickActionCardTitle: 'Exercises',
      description: 'Browse exercise library',
      action: 'Explore',
      route: '/(drawer)/(tabs)/exercises',
      gradient: [COLORS.primaryLight, COLORS.primary],
      borderColor: COLORS.borderOrange,
    },
    {
      quickActionCardTitle: 'Steps',
      description: 'Track your daily steps',
      action: 'View',
      route: '/(drawer)/(tabs)/stepCount',
      gradient: [COLORS.primaryLight, COLORS.primary],
      borderColor: COLORS.borderOrange,
    },
    {
      quickActionCardTitle: 'History',
      description: 'View logged exercises',
      action: 'Open',
      route: '/(drawer)/workoutHistory',
      gradient: [COLORS.primaryLight, COLORS.primary],
      borderColor: COLORS.borderOrange,
    },
    {
      quickActionCardTitle: 'Mind Center',
      description: 'Assessment, resources & wellness',
      action: 'Open',
      route: '/(drawer)/mental',
      gradient: [COLORS.primaryLight, COLORS.primary],
      borderColor: COLORS.borderOrange,
    },
    {
      quickActionCardTitle: 'AI Coach',
      description: 'Chat about training & recovery',
      action: 'Chat',
      route: '/(drawer)/aiChat',
      gradient: [COLORS.primaryLight, COLORS.primary],
      borderColor: COLORS.borderOrange,
    },
    {
      quickActionCardTitle: 'Food Tracker',
      description: 'Log meals & scan nutrition',
      action: 'Open',
      route: '/(drawer)/foodScreen',
      gradient: [COLORS.primaryLight, COLORS.primary],
      borderColor: COLORS.borderOrange,
    },
  ];

  const renderQuickActionCard = ({ item }: { item: any }) => {
    if (!item) return null;
    return (
      <TouchableOpacity
        style={[styles.quickActionCard, { borderColor: item.borderColor }]}
        onPress={() => router.push(item.route as any)}
      >
        <LinearGradient
          colors={item.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.quickActionGradient}
        >
          <View style={styles.quickActionContent}>
            <Text style={styles.quickActionCardTitle}>
              {item.quickActionCardTitle}
            </Text>
            <Text style={styles.quickActionDescription}>
              {item.description}
            </Text>
            <View style={styles.quickActionButton}>
              <Text style={styles.quickActionButtonText}>{item.action}</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Quick Cards
  const quickCards = [
    {
      title: 'Steps',
      icon: 'footsteps',
      value: '0',
      goal: 'Daily Goal: 10,000',
      gradient: [COLORS.backgroundAlt, COLORS.primary] as const,
      route: '/(drawer)/(tabs)/stepCount',
    },
    {
      title: 'Exercises',
      icon: 'barbell',
      value: workout.toString(),
      time: `${minutes.toFixed(0)} minutes`,
      gradient: [COLORS.primary, COLORS.backgroundAlt] as const,
      route: '/(drawer)/(tabs)/exercises',
    },
  ];

  return (
    <BackgroundGradient>
      <BlobBackground variant='scale' />
      <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'left']}>
        {/* Featured Card */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.featuredCardContainer}
        >
          <LinearGradient
            colors={[COLORS.backgroundCard, COLORS.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.featuredCardBackground}
          />
          <View style={styles.featuredContent}>
            <View style={styles.featuredLeftContent}>
              <Text style={styles.featuredTitle}>Agile Athletes</Text>
              <Text style={styles.featuredSubtitle}>
                Your fitness journey starts here. Track workouts, monitor
                progress, and achieve your goals!
              </Text>
              <TouchableOpacity style={styles.featuredButton}>
                <Text style={styles.featuredButtonText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>Welcome</Text>
          </View>
        </Animated.View>

        <ScrollView style={styles.scrollView}>
          {/* Announcements */}
          <Animated.View
            entering={FadeInDown.delay(150).springify()}
            style={styles.announcementContainer}
          >
            <LinearGradient
              colors={[
                COLORS.primaryLight,
                COLORS.primaryMedium,
                COLORS.primaryMedium,
                COLORS.primaryLight,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.announcementGradient}
            >
              <Animated.View
                style={[styles.announcementMessage, animatedStyle]}
              >
                <Ionicons
                  name='information-circle'
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.announcementText}>
                  {announcements[activeAnnouncementIndex].text}
                </Text>
              </Animated.View>
            </LinearGradient>
          </Animated.View>

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
                  <View key={index} style={{ marginRight: SPACING.md }}>
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
                style={styles.quickCard}
                onPress={() => router.push(card.route as any)}
              >
                <LinearGradient
                  colors={card.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.quickCardGradient}
                >
                  <View style={styles.quickCardHeader}>
                    <Text style={styles.quickCardTitle}>{card.title}</Text>
                    <Ionicons
                      name='chevron-forward'
                      size={18}
                      color={COLORS.textButton}
                    />
                  </View>

                  <View style={styles.quickCardRow}>
                    <Ionicons
                      name={card.icon as any}
                      size={20}
                      color={COLORS.textButton}
                    />
                    <Text style={styles.quickCardValue}>{card.value}</Text>
                  </View>

                  {card.goal && (
                    <Text style={styles.quickCardGoal}>{card.goal}</Text>
                  )}

                  {card.time && (
                    <Text style={styles.quickCardTime}>{card.time}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
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
  announcementContainer: {
    height: 40,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.medium,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  announcementGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  announcementMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  announcementText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.regular,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  featuredCardContainer: {
    marginTop: 75,
    marginVertical: SPACING.lg,
    marginHorizontal: SPACING.xl,
    position: 'relative',
    overflow: 'visible',
    ...SHADOWS.cardLarge,
  },
  featuredCardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BORDER_RADIUS.large,
  },
  featuredBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.medium,
    zIndex: 10,
  },
  featuredBadgeText: {
    color: COLORS.textButton,
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  featuredContent: {
    padding: SPACING.xl,
    zIndex: 1,
    borderRadius: BORDER_RADIUS.large,
    overflow: 'hidden',
  },
  featuredLeftContent: {
    flex: 1,
  },
  featuredTitle: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  featuredSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 18,
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
  quickActionCard: {
    height: 140,
    width: '100%',
    borderRadius: BORDER_RADIUS.large,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderStyle: 'solid',
    ...SHADOWS.card,
  },
  quickActionGradient: {
    flex: 1,
    padding: SPACING.md,
  },
  quickActionContent: {
    flex: 1,
    justifyContent: 'space-between',
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
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: 50,
    alignSelf: 'center',
  },
  quickActionButtonText: {
    color: COLORS.textButton,
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  carouselContainer: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  carouselItem: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
    ...SHADOWS.cardLarge,
    margin: 4,
  },
  carouselTitle: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
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
    fontSize: TYPOGRAPHY.fontSize.extraLarge,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  circleLabel: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
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
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.small,
    marginBottom: 4,
  },
  detailValue: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.medium,
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
  quickCard: {
    width: '48%',
    borderRadius: BORDER_RADIUS.large,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  quickCardGradient: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    justifyContent: 'space-between',
  },
  quickCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  quickCardTitle: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textButton,
  },
  quickCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  quickCardValue: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textButton,
  },
  quickCardGoal: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: SPACING.md,
  },
  quickCardTime: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: SPACING.md,
  },
});
