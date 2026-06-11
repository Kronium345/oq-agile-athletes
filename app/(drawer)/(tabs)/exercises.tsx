import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import api, { SERVER_URL } from '../../../api/axios';
import { AppBannerAd } from '../../../components/ads/AppBannerAd';
import BackgroundGradient from '../../../components/BackgroundGradient';
import { getTabBarBottomInset } from '../../../constants/layout';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../../constants/theme';
import { formatExerciseInstructions } from '../../../lib/formatExerciseText';
import {
  getCachedExercises,
  setCachedExercises,
} from '../../../services/exerciseCache';
import { useAuthContext } from '../../AuthProvider';
import { usePremium } from '../../PremiumProvider';
import { useWorkoutContext } from '../../WorkoutContext';

const { width } = Dimensions.get('window');
const EXERCISES_UI_PAGE_SIZE = 12;

interface RapidAPIExercise {
  id: string;
  name: string;
  target: string;
  bodyPart: string;
  equipment: string;
  gifUrl: string;
  instructions: string[];
  secondaryMuscles?: string[];
}

// Internal Exercise interface (maintained for compatibility with existing code)
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
  isFavorite?: boolean;
}

const CATEGORY_MATCH: Record<
  string,
  { targets: string[]; bodyParts: string[]; keywords: string[] }
> = {
  chest: {
    targets: ['pectorals', 'chest'],
    bodyParts: ['chest'],
    keywords: ['chest', 'pec', 'pectoral', 'press', 'fly', 'bench'],
  },
  shoulders: {
    targets: ['delts', 'shoulders', 'traps'],
    bodyParts: ['shoulders'],
    keywords: ['shoulder', 'delt', 'press', 'raise', 'lateral', 'front raise'],
  },
  back: {
    targets: [
      'lats',
      'traps',
      'spine',
      'levator scapulae',
      'rhomboids',
      'back',
    ],
    bodyParts: ['back'],
    keywords: [
      'back',
      'lat',
      'row',
      'pull',
      'pull-down',
      'pull-down',
      'chin-up',
      'pull-up',
    ],
  },
  arms: {
    targets: ['biceps', 'triceps', 'forearms'],
    bodyParts: ['upper arms', 'lower arms'],
    keywords: ['arm', 'bicep', 'tricep', 'curl', 'extension', 'forearm'],
  },
  core: {
    targets: ['abs', 'serratus anterior', 'core'],
    bodyParts: ['waist'],
    keywords: [
      'core',
      'ab',
      'plank',
      'crunch',
      'sit-up',
      'sit up',
      'oblique',
      'abdominal',
    ],
  },
  legs: {
    targets: ['quadriceps', 'hamstrings', 'calves', 'adductors', 'abductors'],
    bodyParts: ['upper legs', 'lower legs', 'legs'],
    keywords: [
      'leg',
      'quad',
      'hamstring',
      'calf',
      'calves',
      'thigh',
      'squat',
      'lunge',
      'leg press',
      'extension',
      'curl',
    ],
  },
  glutes: {
    targets: ['glutes'],
    bodyParts: [],
    keywords: ['glute', 'hip thrust', 'bridge', 'gluteus'],
  },
  conventionals: {
    targets: ['cardiovascular', 'full body'],
    bodyParts: [],
    keywords: [
      'conventional',
      'deadlift',
      'clean',
      'snatch',
      'full body',
      'compound',
      'olympic',
    ],
  },
};

function exerciseMatchesCategory(ex: Exercise, categoryKey: string): boolean {
  const major = Array.isArray(ex.fields['Major Muscle'])
    ? ex.fields['Major Muscle'][0]
    : ex.fields['Major Muscle'];
  const bodyPart = Array.isArray(ex.fields['Exercise Type'])
    ? ex.fields['Exercise Type'][0]
    : ex.fields['Exercise Type'];
  const minor = Array.isArray(ex.fields['Minor Muscle'])
    ? ex.fields['Minor Muscle'][0]
    : ex.fields['Minor Muscle'];

  const majorStr = (major ?? '').toString().toLowerCase();
  const bodyStr = (bodyPart ?? '').toString().toLowerCase();
  const minorStr = (minor ?? '').toString().toLowerCase();
  const nameStr = (ex.fields?.Exercise ?? '').toLowerCase();
  const notesStr = (ex.fields?.Notes ?? '').toLowerCase();
  const searchText = [nameStr, notesStr, majorStr, minorStr].join(' ');

  const key = categoryKey.toLowerCase();
  const config = CATEGORY_MATCH[key];
  if (!config) {
    return (
      majorStr === key ||
      bodyStr === key ||
      majorStr.includes(key) ||
      bodyStr.includes(key)
    );
  }

  const targets = config.targets.map((t) => t.toLowerCase());
  const bodyParts = config.bodyParts.map((b) => b.toLowerCase());
  const keywords = config.keywords.map((k) => k.toLowerCase());

  if (majorStr && (targets.includes(majorStr) || majorStr.includes(key)))
    return true;
  if (bodyStr && (bodyParts.includes(bodyStr) || bodyStr.includes(key)))
    return true;
  if (keywords.some((kw) => searchText.includes(kw))) return true;

  return majorStr === key || bodyStr === key;
}

function transformApiExercises(data: unknown[]): Exercise[] {
  if (!Array.isArray(data)) return [];

  return data.map((raw: any) => {
    let imageUrl = raw.gifUrl;
    if (imageUrl && imageUrl.startsWith('/api/')) {
      imageUrl = `${SERVER_URL}${imageUrl}`;
    } else if (!imageUrl && raw.id) {
      imageUrl = `${SERVER_URL}/api/exercise-recognition/image/${raw.id}`;
    }

    const instructionsText = formatExerciseInstructions(
      raw.instructions ?? 'No description available',
    );

    return {
      id: raw.id,
      fields: {
        Exercise: raw.name || 'Unnamed Exercise',
        Notes: instructionsText,
        Example: imageUrl ? [{ url: imageUrl }] : [],
        Equipment: raw.equipment || 'Not specified',
        'Exercise Type': raw.bodyPart || 'Not specified',
        'Major Muscle': raw.target || 'Not specified',
        'Minor Muscle': Array.isArray(raw.secondaryMuscles)
          ? raw.secondaryMuscles[0]
          : raw.secondaryMuscles || 'Not specified',
        Modifications: 'Standard form. Focus on proper technique.',
      },
      isFavorite: false,
    };
  });
}

export default function Exercises() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const listBottomInset = getTabBarBottomInset(insets.bottom, tabBarHeight);
  const authContext = useAuthContext() as any;
  const user = authContext?.user || null;
  const { isPremium, isLoading: isPremiumLoading } = usePremium();
  const { completed, setCompleted } = useWorkoutContext();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offset, setOffset] = useState<number>(0);
  const [listPage, setListPage] = useState(0);
  const [hasMoreFromApi, setHasMoreFromApi] = useState(true);
  const pageSize = 100;
  const listRef = useRef<FlatList>(null);
  const [activeTab, setActiveTab] = useState('All');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<string>>(
    new Set(),
  );
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    setListPage(0);
  }, [searchTerm, activeTab]);

  // Debug: Log exercises count whenever it changes
  useEffect(() => {
    console.log(
      `📊 Exercises state updated: ${exercises.length} exercises in state`,
    );
    if (exercises.length > 0) {
      console.log(
        `   First exercise: ${exercises[0]?.fields?.Exercise || 'N/A'}`,
      );
      console.log(
        `   Last exercise: ${exercises[exercises.length - 1]?.fields?.Exercise || 'N/A'}`,
      );
    }
  }, [exercises]);

  const loadFavorites = useCallback(async () => {
    if (!user) return;

    try {
      const response = await api.get(
        `/history/favorites/${(user as any)?._id}`,
      );
      const favoritesList = Array.isArray(response)
        ? response
        : ((response as any)?.data ?? (response as any)?.favorites ?? []);
      const favoriteNames = Array.isArray(favoritesList)
        ? favoritesList.map((fav: any) => fav.exerciseName ?? fav.name ?? fav)
        : [];

      setExercises((prevExercises) =>
        prevExercises.map((ex) => ({
          ...ex,
          isFavorite: favoriteNames.includes(ex.fields?.Exercise || ex.id),
        })),
      );
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }, [user]);

  const fetchExercises = useCallback(async () => {
    const requestOffset = offset;
    const isInitialLoad = requestOffset === 0;
    let usedCache = false;

    if (isInitialLoad) {
      const cached = await getCachedExercises();
      if (cached?.exercises?.length) {
        setExercises(cached.exercises as Exercise[]);
        setOffset(cached.nextOffset);
        usedCache = true;
        setLoading(false);
        setRefreshing(true);
        await loadFavorites();
      } else {
        setLoading(true);
      }
    } else {
      setLoading(true);
    }

    try {
      const enhancedResponse = await api.post(
        '/api/exercise-recognition/enhance',
        {
          limit: pageSize,
          offset: requestOffset,
          apiKey: process.env.EXPO_PUBLIC_RAPID_API_KEY,
        },
      );

      const data = (enhancedResponse as any)?.exercises;

      if (Array.isArray(data) && data.length > 0) {
        const transformedExercises = transformApiExercises(data);
        const nextOffset = requestOffset + pageSize;

        if (requestOffset === 0) {
          setExercises(transformedExercises);
          await setCachedExercises(transformedExercises, nextOffset);
        } else {
          setExercises((prevExercises) => [
            ...prevExercises,
            ...transformedExercises,
          ]);
        }

        setOffset(nextOffset);
        setHasMoreFromApi(data.length >= pageSize);
      } else if (!usedCache && requestOffset === 0) {
        setExercises([]);
        setHasMoreFromApi(false);
      } else {
        setHasMoreFromApi(false);
      }
    } catch (error: any) {
      console.error('Exercise fetch failed:', error);
      if (!usedCache) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message || 'Failed to fetch exercises data',
          position: 'bottom',
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      await loadFavorites();
    }
  }, [offset, pageSize, loadFavorites]);

  const handleSearch = (text: string) => {
    setSearchTerm(text);
  };

  const showToast = (type: string, text1: string, text2?: string) => {
    Toast.show({
      type: type as any,
      text1: text1,
      text2: text2,
      visibilityTime: 4000,
    });
  };

  const handleSelectExercise = (exercise: Exercise) => {
    router.push({
      pathname: '/exerciseDetails',
      params: {
        id: exercise.id,
        name: exercise.fields.Exercise,
        description: exercise.fields.Notes || 'No description available',
        image:
          exercise.fields.Example && exercise.fields.Example[0]
            ? exercise.fields.Example[0].url
            : null,
        equipment: exercise.fields.Equipment || 'Not specified',
        exerciseType: exercise.fields['Exercise Type'] || 'Not specified',
        majorMuscle: Array.isArray(exercise.fields['Major Muscle'])
          ? exercise.fields['Major Muscle'][0]
          : exercise.fields['Major Muscle'] || 'Not specified',
        minorMuscle: Array.isArray(exercise.fields['Minor Muscle'])
          ? exercise.fields['Minor Muscle'][0]
          : exercise.fields['Minor Muscle'] || 'Not specified',
        modifications:
          exercise.fields.Modifications || 'No modifications available',
      },
    } as any);
  };

  const handleStartWorkout = () => {
    if (isSelectionMode) {
      if (selectedExerciseIds.size === 0) {
        Toast.show({
          type: 'info',
          text1: 'No exercises selected',
          text2: 'Please select at least one exercise',
          position: 'bottom',
        });
        return;
      }

      const workoutExercises = getFilteredExercises().filter((ex) =>
        selectedExerciseIds.has(ex.id),
      );

      startWorkoutWithExercises(workoutExercises);
      setIsSelectionMode(false);
      setSelectedExerciseIds(new Set());
      return;
    }

    // First time - show selection prompt
    const workoutExercises = getFilteredExercises();

    if (workoutExercises.length === 0) {
      Toast.show({
        type: 'info',
        text1: 'No exercises available',
        text2: 'Please select some exercises first',
        position: 'bottom',
      });
      return;
    }

    // Show custom modal for selection prompt
    console.log('📱 Showing workout selection modal...');
    setShowWorkoutModal(true);
  };

  const startWorkoutWithExercises = (workoutExercises: Exercise[]) => {
    console.log(
      '🚀 Starting workout with',
      workoutExercises.length,
      'exercises',
    );

    try {
      // Transform exercises to workout format
      const transformedExercises = workoutExercises.map((ex) => ({
        id: ex.id,
        name: ex.fields.Exercise,
        gifUrl:
          ex.fields.Example && ex.fields.Example[0]
            ? ex.fields.Example[0].url
            : '',
        sets: 3,
        reps: 10,
        bodyPart: ex.fields['Exercise Type'] || 'Not specified',
        equipment: ex.fields.Equipment || 'Not specified',
        target: Array.isArray(ex.fields['Major Muscle'])
          ? ex.fields['Major Muscle'][0]
          : ex.fields['Major Muscle'] || 'Not specified',
      }));

      console.log('✅ Transformed exercises:', transformedExercises.length);

      // Reset completed exercises for new workout
      setCompleted([]);

      // Navigate to FitScreen with exercises
      console.log('🧭 Navigating to FitScreen...');
      router.push({
        pathname: '/FitScreen',
        params: {
          exercises: JSON.stringify(transformedExercises),
        },
      } as any);
    } catch (error) {
      console.error('❌ Error in startWorkoutWithExercises:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to start workout. Please try again.',
        position: 'bottom',
      });
    }
  };

  const handleToggleExerciseSelection = (exerciseId: string) => {
    setSelectedExerciseIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
      } else {
        newSet.add(exerciseId);
      }
      return newSet;
    });
  };

  const handleToggleFavorite = async (exerciseId: string) => {
    if (isPremiumLoading) return;

    if (!isPremium) {
      Toast.show({
        type: 'info',
        text1: 'Premium feature',
        text2: 'Upgrade to Premium to save favorites.',
        position: 'bottom',
      });
      router.replace('/subscription' as any);
      return;
    }

    // Suppress CSS-related errors on web during icon interaction
    if (Platform.OS === 'web') {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        const message = args[0];
        if (
          typeof message === 'string' &&
          (message.includes('CSSStyleDeclaration') ||
            message.includes('indexed property') ||
            message.includes('property setter is not supported'))
        ) {
          return; // Suppress CSS errors
        }
        originalConsoleError(...args);
      };

      setTimeout(() => {
        console.error = originalConsoleError;
      }, 1000);
    }

    console.log('🌟 FAVORITE TOGGLE STARTED');
    console.log('Exercise ID:', exerciseId);
    console.log('User ID:', (user as any)?._id);

    if (!user || !exerciseId) {
      Toast.show({
        type: 'error',
        text1: 'Favorite Toggle Failed',
        text2: 'User not logged in or Invalid Exercise',
        position: 'bottom',
      });
      return;
    }

    const exercise = exercises.find((ex) => ex.id === exerciseId);
    if (!exercise) {
      Toast.show({
        type: 'error',
        text1: 'Exercise not found',
        text2: 'Unable to find exercise',
        position: 'bottom',
      });
      return;
    }

    const exerciseName = exercise.fields?.Exercise;
    if (!exerciseName) {
      Toast.show({
        type: 'error',
        text1: 'Exercise name not available',
        text2: 'Unable to find exercise name',
        position: 'bottom',
      });
      return;
    }

    console.log('Exercise Name:', exerciseName);
    console.log('Current Favorite Status:', exercise.isFavorite);
    console.log('Will toggle to:', !exercise.isFavorite);

    const logEntry = {
      userId: (user as any)?._id,
      exerciseName: exerciseName,
      isFavorite: !(exercise.isFavorite || false),
    };

    console.log('Payload to server:', logEntry);

    try {
      console.log('📡 Sending request to /history/toggle-favorite');
      const response = await api.post('/history/toggle-favorite', logEntry);
      console.log('✅ Server response:', (response as any).data);

      setExercises((prevExercises) =>
        prevExercises.map((ex) =>
          ex.id === exerciseId ? { ...ex, isFavorite: !ex.isFavorite } : ex,
        ),
      );

      console.log('🔄 Local state updated after server confirmation');
      Toast.show({
        type: 'success',
        text1: 'Favorite Status Updated',
        text2: 'Exercise favorite status has been toggled.',
        position: 'bottom',
      });
    } catch (error: any) {
      console.error(
        '❌ Error toggling favorite:',
        error.response ? error.response.data : error.message,
      );
      console.log('❌ Local state NOT updated due to server error');
      Toast.show({
        type: 'error',
        text1: 'Favorite Toggle Failed',
        text2: 'Error occurred while toggling favorite.',
        position: 'bottom',
      });
    }

    console.log('🌟 FAVORITE TOGGLE COMPLETED\n');
  };

  const handleCategoryPress = async (category: string) => {
    const key = category.toLowerCase();
    const filtered = exercises.filter((ex) => exerciseMatchesCategory(ex, key));
    const cacheKey = `exercise_category_${key}_${Date.now()}`;

    try {
      // Avoid passing large JSON in route params; use storage-backed handoff instead.
      await AsyncStorage.setItem(cacheKey, JSON.stringify(filtered));
      router.push({
        pathname: '/exercise-category',
        params: {
          category: key,
          cacheKey,
        },
      } as any);
    } catch (error) {
      console.error('Failed to cache category exercises:', error);
      Toast.show({
        type: 'error',
        text1: 'Unable to open category',
        text2: 'Please try again.',
      });
    }
  };

  useEffect(() => {
    console.log('📋 TAB CHANGED:', activeTab);

    if (isPremiumLoading) return;

    if (activeTab === 'Favorites' && !isPremium) {
      Toast.show({
        type: 'info',
        text1: 'Premium feature',
        text2: 'Upgrade to Premium to view favorites.',
        position: 'bottom',
      });
      setActiveTab('All');
      router.replace('/subscription' as any);
      return;
    }

    if (user && activeTab === 'Favorites') {
      console.log('⭐ Loading Favorites tab for user:', (user as any)?._id);
      const fetchFavorites = async () => {
        try {
          console.log('📡 Fetching favorites from server...');

          const response = await api.get(
            `/history/favorites/${(user as any)?._id}`,
          );
          const favoritesList = Array.isArray(response)
            ? response
            : ((response as any)?.data ?? (response as any)?.favorites ?? []);
          const favoriteNames = Array.isArray(favoritesList)
            ? favoritesList.map(
                (fav: any) => fav.exerciseName ?? fav.name ?? fav,
              )
            : [];
          console.log(
            '📥 Server response:',
            favoritesList?.length ?? 0,
            'favorites',
          );
          console.log('⭐ Favorite exercise names:', favoriteNames);

          if (favoriteNames.length > 0) {
            const updatedExercises = exercises.map((exercise) => {
              const isFavorite = favoriteNames.includes(
                exercise.fields?.Exercise,
              );
              return {
                ...exercise,
                isFavorite: isFavorite,
              };
            });

            console.log(
              '🔄 Updated exercises with favorite status from server',
            );
            setExercises(updatedExercises);
            console.log('✅ Favorites loaded successfully');
          } else {
            console.log(
              '⚠️ Server returned no favorites - preserving local state to avoid overwriting optimistic updates',
            );
            console.log('✅ Preserving local favorites state');
          }
        } catch (error) {
          console.error('❌ Error fetching favorites:', error);
          console.log(
            '⚠️ Server error - preserving local state to avoid overwriting optimistic updates',
          );
        }
      };

      fetchFavorites();
    }
  }, [user, activeTab, isPremium, isPremiumLoading]);

  const searchFilteredExercises = exercises.filter((exercise) =>
    exercise.fields.Exercise.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getFilteredExercises = () => {
    console.log('🔍 Filtering exercises for tab:', activeTab);
    console.log('   Total exercises in state:', exercises.length);
    console.log('   Search term:', searchTerm);

    switch (activeTab) {
      case 'Favorites':
        const favoriteExercises = searchFilteredExercises.filter(
          (exercise) => exercise.isFavorite,
        );
        console.log(
          `📋 Showing ${favoriteExercises.length} favorite exercises`,
        );
        return favoriteExercises;

      case 'Muscles':
        return [];

      default:
        console.log(
          `📋 Showing ${searchFilteredExercises.length} total exercises`,
        );
        return searchFilteredExercises;
    }
  };

  const filteredExercisesList = getFilteredExercises();
  const totalFiltered = filteredExercisesList.length;
  const totalUiPages = Math.max(
    1,
    Math.ceil(totalFiltered / EXERCISES_UI_PAGE_SIZE),
  );
  const safeListPage = Math.min(listPage, totalUiPages - 1);
  const paginatedExercises = filteredExercisesList.slice(
    safeListPage * EXERCISES_UI_PAGE_SIZE,
    (safeListPage + 1) * EXERCISES_UI_PAGE_SIZE,
  );
  const rangeStart =
    totalFiltered === 0 ? 0 : safeListPage * EXERCISES_UI_PAGE_SIZE + 1;
  const rangeEnd = Math.min(
    (safeListPage + 1) * EXERCISES_UI_PAGE_SIZE,
    totalFiltered,
  );
  const showPagination = totalFiltered > EXERCISES_UI_PAGE_SIZE;
  const onLastUiPage = safeListPage >= totalUiPages - 1;

  const scrollListToTop = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const goToListPage = (nextPage: number) => {
    setListPage(Math.max(0, Math.min(nextPage, totalUiPages - 1)));
    scrollListToTop();
  };

  const handleNextPage = () => {
    if (safeListPage < totalUiPages - 1) {
      goToListPage(safeListPage + 1);
    } else if (hasMoreFromApi && !loading && !refreshing) {
      fetchExercises();
    }
  };

  const handlePrevPage = () => {
    if (safeListPage > 0) {
      goToListPage(safeListPage - 1);
    }
  };

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'left']}>
        {/* Screen Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <Text style={styles.headerTitle}>Exercises</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.contentContainer}>
          {/* Search Bar */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={styles.searchBarContainer}
          >
            <Feather
              name='search'
              size={18}
              color={COLORS.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              placeholder='Search exercises...'
              placeholderTextColor={COLORS.textSecondary}
              style={styles.searchBar}
              onChangeText={handleSearch}
              value={searchTerm}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchTerm('')}
                style={styles.clearButton}
              >
                <Feather name='x' size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Tab Container */}
          <Animated.View
            entering={FadeInDown.delay(150).springify()}
            style={styles.tabContainer}
          >
            {/* Muscles tab temporarily disabled */}
            {['All', 'Favorites'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.activeTabText,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {activeTab !== 'Muscles' && exercises.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(200).springify()}
              style={styles.startWorkoutButtonContainer}
            >
              {isSelectionMode && (
                <View style={styles.selectionModeHeader}>
                  <TouchableOpacity
                    style={styles.cancelSelectionButton}
                    onPress={() => {
                      setIsSelectionMode(false);
                      setSelectedExerciseIds(new Set());
                    }}
                  >
                    <Ionicons
                      name='close'
                      size={20}
                      color={COLORS.textPrimary}
                    />
                    <Text style={styles.cancelSelectionText}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.selectionCountText}>
                    {selectedExerciseIds.size} selected
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[
                  styles.startWorkoutButton,
                  isSelectionMode &&
                    selectedExerciseIds.size > 0 &&
                    styles.startWorkoutButtonActive,
                  isSelectionMode &&
                    selectedExerciseIds.size === 0 &&
                    styles.startWorkoutButtonDisabled,
                ]}
                onPress={() => {
                  console.log(
                    '🔘 Button pressed - isSelectionMode:',
                    isSelectionMode,
                    'selectedCount:',
                    selectedExerciseIds.size,
                  );
                  handleStartWorkout();
                }}
                activeOpacity={0.8}
                disabled={isSelectionMode && selectedExerciseIds.size === 0}
              >
                <Ionicons
                  name='play-circle'
                  size={24}
                  color={COLORS.textButton}
                />
                <Text style={styles.startWorkoutText}>
                  {isSelectionMode
                    ? `START WORKOUT (${selectedExerciseIds.size})`
                    : 'START WORKOUT'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Main Content */}
          {activeTab === 'Muscles' ? (
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <ScrollView style={styles.recentContent}>
                <View style={styles.headerContainer}>
                  <Text style={styles.sectionHeaderTitle}>
                    TARGET YOUR TRAINING
                  </Text>
                  <Text style={styles.headerSubtitle}>
                    Browse exercises by muscle group and build workouts that
                    focus on your specific training goals
                  </Text>
                </View>

                <View style={styles.muscleGrid}>
                  {/* First Row */}
                  <View style={styles.gridRow}>
                    <TouchableOpacity
                      style={styles.categoryCard}
                      onPress={() => handleCategoryPress('chest')}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={require('../../../assets/images/category/chest.webp')}
                        style={styles.categoryImage}
                      />
                      <View style={styles.categoryOverlay}>
                        <Text style={styles.categoryText}>CHEST</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.categoryCard}
                      onPress={() => handleCategoryPress('shoulders')}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={require('../../../assets/images/category/shoulders.webp')}
                        style={styles.categoryImage}
                      />
                      <View style={styles.categoryOverlay}>
                        <Text style={styles.categoryText}>SHOULDERS</Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Second Row */}
                  <View style={styles.gridRow}>
                    <TouchableOpacity
                      style={styles.categoryCard}
                      onPress={() => handleCategoryPress('back')}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={require('../../../assets/images/category/back.webp')}
                        style={styles.categoryImage}
                      />
                      <View style={styles.categoryOverlay}>
                        <Text style={styles.categoryText}>BACK</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.categoryCard}
                      onPress={() => handleCategoryPress('arms')}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={require('../../../assets/images/category/arms.webp')}
                        style={styles.categoryImage}
                      />
                      <View style={styles.categoryOverlay}>
                        <Text style={styles.categoryText}>ARMS</Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Third Row */}
                  <View style={styles.gridRow}>
                    <TouchableOpacity
                      style={styles.categoryCard}
                      onPress={() => handleCategoryPress('core')}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={require('../../../assets/images/category/core.webp')}
                        style={styles.categoryImage}
                      />
                      <View style={styles.categoryOverlay}>
                        <Text style={styles.categoryText}>CORE</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.categoryCard}
                      onPress={() => handleCategoryPress('legs')}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={require('../../../assets/images/category/legs.webp')}
                        style={styles.categoryImage}
                      />
                      <View style={styles.categoryOverlay}>
                        <Text style={styles.categoryText}>LEGS</Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Fourth Row */}
                  <View style={styles.gridRow}>
                    <TouchableOpacity
                      style={styles.categoryCard}
                      onPress={() => handleCategoryPress('glutes')}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={require('../../../assets/images/category/glutes.webp')}
                        style={styles.categoryImage}
                      />
                      <View style={styles.categoryOverlay}>
                        <Text style={styles.categoryText}>GLUTES</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.categoryCard}
                      onPress={() => handleCategoryPress('conventionals')}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={require('../../../assets/images/category/conventional.webp')}
                        style={styles.categoryImage}
                      />
                      <View style={styles.categoryOverlay}>
                        <Text style={styles.categoryText}>CONVENTIONALS</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </Animated.View>
          ) : loading && exercises.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size='large' color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading exercises...</Text>
            </View>
          ) : (
            <Animated.View
              entering={FadeInDown.delay(200).springify()}
              style={styles.listContainer}
            >
              <FlatList
                ref={listRef}
                data={paginatedExercises}
                keyExtractor={(item, index) =>
                  item?.id?.toString() || index.toString()
                }
                renderItem={({ item }) => {
                  const imageUrl =
                    item.fields.Example && item.fields.Example[0]
                      ? item.fields.Example[0].url
                      : null;
                  const isCompleted = completed.includes(item.fields.Exercise);

                  return (
                    <TouchableOpacity
                      style={styles.itemContainer}
                      onPress={() => handleSelectExercise(item)}
                    >
                      {imageUrl ? (
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.thumbnail}
                          onLoad={() => {
                            console.log(
                              `✅ Image loaded successfully: ${item.fields.Exercise}`,
                            );
                          }}
                          onError={(error) => {
                            console.error(
                              `❌ Image failed to load for ${item.fields.Exercise}:`,
                              error.nativeEvent?.error || 'Unknown error',
                            );
                            console.error(`   Failed URL: ${imageUrl}`);
                          }}
                        />
                      ) : (
                        <View style={styles.thumbnailPlaceholder}>
                          <Text style={styles.thumbnailText}>No Image</Text>
                        </View>
                      )}
                      <Text style={styles.itemText}>
                        {item.fields.Exercise}
                      </Text>

                      {/* Selection Checkbox - Show when in selection mode */}
                      {isSelectionMode && (
                        <TouchableOpacity
                          style={styles.selectionCheckbox}
                          onPress={() => handleToggleExerciseSelection(item.id)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.checkbox,
                              selectedExerciseIds.has(item.id) &&
                                styles.checkboxSelected,
                            ]}
                          >
                            {selectedExerciseIds.has(item.id) && (
                              <Ionicons
                                name='checkmark'
                                size={16}
                                color={COLORS.textButton}
                              />
                            )}
                          </View>
                        </TouchableOpacity>
                      )}

                      {/* Completed Checkmark */}
                      {isCompleted && !isSelectionMode && (
                        <View style={styles.completedBadge}>
                          <Ionicons
                            name='checkmark-circle'
                            size={24}
                            color='#4CAF50'
                          />
                        </View>
                      )}

                      {/* Favorite Star */}
                      <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={() => handleToggleFavorite(item.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.starIconWrapper}>
                          {Platform.OS === 'web' ? (
                            <View
                              style={[
                                styles.starIconWeb,
                                {
                                  width: 20,
                                  height: 20,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                },
                              ]}
                            >
                              <Ionicons
                                name={item.isFavorite ? 'star' : 'star-outline'}
                                size={20}
                                color={
                                  item.isFavorite
                                    ? COLORS.primary
                                    : COLORS.textSecondary
                                }
                              />
                            </View>
                          ) : (
                            <Ionicons
                              name={item.isFavorite ? 'star' : 'star-outline'}
                              size={20}
                              color={
                                item.isFavorite
                                  ? COLORS.primary
                                  : COLORS.textSecondary
                              }
                              style={styles.starIcon}
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={[
                  styles.listContent,
                  { paddingBottom: listBottomInset },
                ]}
                ListEmptyComponent={
                  !loading && !refreshing
                    ? () => (
                        <View style={styles.emptyStateContainer}>
                          <Text style={styles.emptyStateText}>
                            {activeTab === 'Favorites'
                              ? 'No favorite exercises yet'
                              : 'No exercises found'}
                          </Text>
                        </View>
                      )
                    : null
                }
                ListFooterComponent={() => (
                  <View style={styles.listFooter}>
                    {showPagination ? (
                      <View style={styles.paginationBar}>
                        <TouchableOpacity
                          style={[
                            styles.paginationButton,
                            safeListPage === 0 && styles.paginationButtonDisabled,
                          ]}
                          onPress={handlePrevPage}
                          disabled={safeListPage === 0}
                        >
                          <Feather
                            name='chevron-left'
                            size={20}
                            color={
                              safeListPage === 0
                                ? COLORS.textSecondary
                                : COLORS.textPrimary
                            }
                          />
                          <Text
                            style={[
                              styles.paginationButtonText,
                              safeListPage === 0 &&
                                styles.paginationButtonTextDisabled,
                            ]}
                          >
                            Previous
                          </Text>
                        </TouchableOpacity>

                        <View style={styles.paginationMeta}>
                          <Text style={styles.paginationRange}>
                            {rangeStart}–{rangeEnd} of {totalFiltered}
                          </Text>
                          <Text style={styles.paginationPages}>
                            Page {safeListPage + 1} of {totalUiPages}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={[
                            styles.paginationButton,
                            (onLastUiPage && !hasMoreFromApi) ||
                            (loading && onLastUiPage)
                              ? styles.paginationButtonDisabled
                              : null,
                          ]}
                          onPress={handleNextPage}
                          disabled={
                            (onLastUiPage && !hasMoreFromApi) ||
                            (loading && onLastUiPage)
                          }
                        >
                          <Text
                            style={[
                              styles.paginationButtonText,
                              onLastUiPage &&
                                !hasMoreFromApi &&
                                styles.paginationButtonTextDisabled,
                            ]}
                          >
                            {onLastUiPage && hasMoreFromApi && loading
                              ? 'Loading…'
                              : 'Next'}
                          </Text>
                          <Feather
                            name='chevron-right'
                            size={20}
                            color={
                              onLastUiPage && !hasMoreFromApi
                                ? COLORS.textSecondary
                                : COLORS.textPrimary
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    ) : null}
                    {refreshing && exercises.length > 0 ? (
                      <View style={styles.refreshingFooter}>
                        <ActivityIndicator
                          size='small'
                          color={COLORS.primary}
                        />
                        <Text style={styles.refreshingText}>
                          Updating exercises...
                        </Text>
                      </View>
                    ) : null}
                    <AppBannerAd marginTop={SPACING.lg} />
                  </View>
                )}
              />
            </Animated.View>
          )}
        </View>
      </SafeAreaView>

      <Modal
        visible={showWorkoutModal}
        transparent={true}
        animationType='fade'
        onRequestClose={() => setShowWorkoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Start Workout</Text>
              <TouchableOpacity
                onPress={() => {
                  console.log('❌ User closed modal');
                  setShowWorkoutModal(false);
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name='close' size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalMessage}>
              Would you like to select specific exercises or use all available
              exercises?
            </Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => {
                  console.log('✅ User chose: Select Exercises');
                  setShowWorkoutModal(false);
                  setIsSelectionMode(true);
                  Toast.show({
                    type: 'info',
                    text1: 'Selection Mode',
                    text2:
                      'Tap exercises to select them, then press Start Workout',
                    position: 'bottom',
                  });
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name='checkbox-outline'
                  size={20}
                  color={COLORS.textButton}
                />
                <Text style={styles.modalButtonTextPrimary}>
                  Select Exercises
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  console.log('✅ User chose: Use All Exercises');
                  const exercises = getFilteredExercises();
                  setShowWorkoutModal(false);
                  startWorkoutWithExercises(exercises);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name='play-circle' size={20} color={COLORS.primary} />
                <Text style={styles.modalButtonTextSecondary}>
                  Use All Exercises
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  console.log('❌ User cancelled');
                  setShowWorkoutModal(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  headerLeft: {
    width: 40,
    height: 40,
  },
  headerRight: {
    width: 40,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    letterSpacing: 0.5,
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 0,
    paddingBottom: 20,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    ...SHADOWS.card,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchBar: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingRight: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.medium,
    color: COLORS.textPrimary,
  },
  clearButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    padding: 4,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.card,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.medium,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  activeTabText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
  },
  listFooter: {
    paddingTop: SPACING.xs,
  },
  paginationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    minWidth: 72,
  },
  paginationButtonDisabled: {
    opacity: 0.45,
  },
  paginationButtonText: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  paginationButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  paginationMeta: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  paginationRange: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  paginationPages: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  itemContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    overflow: 'hidden',
    padding: SPACING.sm,
    position: 'relative',
    ...SHADOWS.card,
  },
  thumbnail: {
    width: 65,
    height: 65,
    marginRight: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
  },
  thumbnailPlaceholder: {
    width: 65,
    height: 65,
    marginRight: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailText: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
  },
  itemText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.large,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  selectionCheckbox: {
    position: 'absolute',
    right: 50,
    top: SPACING.sm,
    padding: SPACING.xs,
    zIndex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    backgroundColor: COLORS.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  favoriteButton: {
    position: 'absolute',
    right: SPACING.sm,
    top: SPACING.sm,
    padding: SPACING.xs,
    zIndex: 1,
  },
  starIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  starIcon: {
    alignSelf: 'center',
  },
  starIconWeb: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBadge: {
    position: 'absolute',
    right: 50,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  startWorkoutButtonContainer: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  selectionModeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  cancelSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  cancelSelectionText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  selectionCountText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  startWorkoutButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.large,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.cardLarge,
    elevation: 10,
  },
  startWorkoutButtonActive: {
    opacity: 1,
  },
  startWorkoutButtonDisabled: {
    opacity: 0.5,
  },
  startWorkoutText: {
    color: COLORS.textButton,
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xxl,
    minHeight: 280,
    gap: SPACING.md,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
  refreshingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
  },
  refreshingText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xxl,
    minHeight: 300,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    width: '100%',
    maxWidth: 400,
    padding: SPACING.xl,
    ...SHADOWS.cardLarge,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  modalCloseButton: {
    padding: SPACING.xs,
  },
  modalMessage: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  modalButtonContainer: {
    gap: SPACING.md,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.medium,
    gap: SPACING.sm,
  },
  modalButtonPrimary: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.card,
  },
  modalButtonSecondary: {
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  modalButtonCancel: {
    backgroundColor: 'transparent',
    marginTop: SPACING.sm,
  },
  modalButtonTextPrimary: {
    color: COLORS.textButton,
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  modalButtonTextSecondary: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  modalButtonTextCancel: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  emptyStateText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.medium,
    textAlign: 'center',
  },
  recentContent: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  headerContainer: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  sectionHeaderTitle: {
    fontSize: TYPOGRAPHY.fontSize.extraLarge,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    width: '90%',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
    alignSelf: 'center',
  },
  muscleGrid: {
    padding: SPACING.md,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  categoryCard: {
    width: '48%',
    height: 120,
    borderRadius: BORDER_RADIUS.medium,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: {
    color: COLORS.textButton,
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
});
