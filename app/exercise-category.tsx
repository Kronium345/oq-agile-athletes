import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundGradient from '../components/BackgroundGradient';
import BlobBackground from '../components/BlobBackground';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';

interface Exercise {
  id: string;
  fields: {
    Exercise: string;
    Notes?: string;
    Example?: Array<{ url: string }>;
    Equipment?: string;
    'Exercise Type'?: string;
    'Major Muscle'?: string | string[];
    'Minor Muscle'?: string | string[];
    Modifications?: string;
  };
}

const CATEGORY_IMAGES: Record<string, any> = {
  chest: require('../assets/images/category/chest.webp'),
  shoulders: require('../assets/images/category/shoulders.webp'),
  back: require('../assets/images/category/back.webp'),
  arms: require('../assets/images/category/arms.webp'),
  core: require('../assets/images/category/core.webp'),
  legs: require('../assets/images/category/legs.webp'),
  glutes: require('../assets/images/category/glutes.webp'),
  conventionals: require('../assets/images/category/conventional.webp'),
};

function getCategoryImage(categoryName: string) {
  const key = (categoryName || '').toLowerCase();
  return CATEGORY_IMAGES[key] ?? null;
}

function formatCategoryLabel(category: string) {
  return (category || '').charAt(0).toUpperCase() + (category || '').slice(1).toLowerCase();
}

export default function ExerciseCategoryScreen() {
  const router = useRouter();
  const { category, cacheKey, data } = useLocalSearchParams<{
    category: string;
    cacheKey?: string;
    data?: string;
  }>();
  const [exerciseList, setExerciseList] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadExercises = async () => {
      setIsLoading(true);
      try {
        if (cacheKey) {
          const cached = await AsyncStorage.getItem(cacheKey);
          if (cached) {
            setExerciseList(JSON.parse(cached) as Exercise[]);
            await AsyncStorage.removeItem(cacheKey);
            return;
          }
        }

        if (data) {
          setExerciseList(JSON.parse(data) as Exercise[]);
        } else {
          setExerciseList([]);
        }
      } catch {
        setExerciseList([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadExercises();
  }, [cacheKey, data]);

  const categoryImage = category ? getCategoryImage(category) : null;
  const categoryLabel = formatCategoryLabel(category || '');

  const handleSelectExercise = (exercise: Exercise) => {
    const imageUrl = exercise.fields.Example?.[0]?.url ?? null;
    router.push({
      pathname: '/exerciseDetails',
      params: {
        id: exercise.id,
        name: exercise.fields.Exercise,
        description: exercise.fields.Notes || 'No description available',
        image: imageUrl,
        equipment: exercise.fields.Equipment || 'Not specified',
        exerciseType: exercise.fields['Exercise Type'] || 'Not specified',
        majorMuscle: Array.isArray(exercise.fields['Major Muscle'])
          ? exercise.fields['Major Muscle'][0]
          : exercise.fields['Major Muscle'] || 'Not specified',
        minorMuscle: Array.isArray(exercise.fields['Minor Muscle'])
          ? exercise.fields['Minor Muscle'][0]
          : exercise.fields['Minor Muscle'] || 'Not specified',
        modifications: exercise.fields.Modifications || 'No modifications available',
      },
    } as any);
  };

  return (
    <BackgroundGradient>
      <BlobBackground variant="scale" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'left']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
            <Text style={styles.backLabel}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {categoryLabel}
          </Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {categoryImage && (
            <View style={styles.categoryCardContainer}>
              <View style={styles.categoryCard}>
                <Image source={categoryImage} style={styles.categoryImage} resizeMode="cover" />
                <View style={styles.categoryOverlay}>
                  <Text style={styles.categoryLabel}>{categoryLabel.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Exercises</Text>
            <Text style={styles.listSubtitle}>
              {isLoading
                ? 'Loading...'
                : `${exerciseList.length} ${exerciseList.length === 1 ? 'exercise' : 'exercises'}`}
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading exercises...</Text>
            </View>
          ) : exerciseList.length > 0 ? (
            <View style={styles.list}>
              {exerciseList.map((exercise, index) => (
                <TouchableOpacity
                  key={exercise.id || index}
                  style={styles.exerciseItem}
                  onPress={() => handleSelectExercise(exercise)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.exerciseName} numberOfLines={2}>
                    {exercise.fields?.Exercise || 'Unnamed exercise'}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No exercises found for {categoryLabel}.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingRight: SPACING.sm,
  },
  backLabel: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    minWidth: 80,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  categoryCardContainer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  categoryCard: {
    width: '100%',
    height: 180,
    borderRadius: BORDER_RADIUS.large,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundAlt,
    ...SHADOWS.cardLarge,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryLabel: {
    color: COLORS.textButton,
    fontSize: TYPOGRAPHY.fontSize.extraLarge,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  listHeader: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  listTitle: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  listSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
  },
  list: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    ...SHADOWS.card,
  },
  exerciseName: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  emptyContainer: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    color: COLORS.textSecondary,
  },
});
