import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import api from '../../api/axios';
import BackgroundGradient from '../../components/BackgroundGradient';
import BlobBackground from '../../components/BlobBackground';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useAuthContext } from '../AuthProvider';

const { width } = Dimensions.get('window');

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

export default function Exercises() {
  const router = useRouter();
  const authContext = useAuthContext() as any;
  const user = authContext?.user || null;
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [offset, setOffset] = useState<string | null>(null);
  const pageSize = 10;
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    fetchExercises();
  }, [page]);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const params: any = {
        pageSize: pageSize,
      };
      
      if (offset) {
        params.offset = offset;
      }

      // Fetching exercises data from Airtable
      const response = await fetch(
        `https://api.airtable.com/v0/${process.env.EXPO_PUBLIC_AIRTABLE_BASE_ID}/${process.env.EXPO_PUBLIC_AIRTABLE_TABLE_ID}?${new URLSearchParams(params).toString()}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_AIRTABLE_PAT}`,
          },
        }
      );

      const data = await response.json();

      console.log("API Response:", data);

      if (data.records) {
        console.log("Full Results:", data.records);

        // Set exercises directly without filtering
        setExercises(prevExercises => [...prevExercises, ...data.records]);

        // Update offset if available
        if (data.offset) {
          setOffset(data.offset);
        }
      } else {
        console.log("No results found in the API response.");
      }
    } catch (error) {
      console.error("Fetching exercises failed:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch exercises',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchTerm(text);
  };

  const showToast = (type: string, text1: string, text2?: string) => {
    Toast.show({
      type: type as any,
      text1: text1,
      text2: text2,
      position: 'bottom',
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
        image: exercise.fields.Example && exercise.fields.Example[0] ? exercise.fields.Example[0].url : null,
        equipment: exercise.fields.Equipment || 'Not specified',
        exerciseType: exercise.fields['Exercise Type'] || 'Not specified',
        majorMuscle: Array.isArray(exercise.fields['Major Muscle']) 
          ? exercise.fields['Major Muscle'][0] 
          : exercise.fields['Major Muscle'] || 'Not specified',
        minorMuscle: Array.isArray(exercise.fields['Minor Muscle'])
          ? exercise.fields['Minor Muscle'][0]
          : exercise.fields['Minor Muscle'] || 'Not specified',
        modifications: exercise.fields.Modifications || 'No modifications available',
      }
    } as any);
  };

  const handleToggleFavorite = async (exerciseId: string) => {
    if (!user || !exerciseId) {
      showToast('error', 'Favorite Toggle Failed', 'User not logged in or Invalid Exercise');
      return;
    }

    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) {
      showToast('error', 'Exercise not found', 'Unable to find exercise');
      return;
    }

    const exerciseName = exercise.fields?.Exercise;
    if (!exerciseName) {
      showToast('error', 'Exercise name not available', 'Unable to find exercise name');
      return;
    }

    const isCurrentlyFavorite = exercise.isFavorite || false;
    const logEntry = {
      userId: (user as any)?._id || (user as any)?.userId || '',
      exerciseName: exerciseName,
      isFavorite: !isCurrentlyFavorite,
    };

    try {
      // Post to server to toggle favorite status
      await api.post('/history/toggle', logEntry);

      // Update the favorite status locally
      setExercises(prevExercises => prevExercises.map(ex =>
        ex.id === exerciseId ? { ...ex, isFavorite: !isCurrentlyFavorite } : ex
      ));

      showToast('success', 'Favorite Status Updated', 'Exercise favorite status has been toggled.');
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      showToast('error', 'Favorite Toggle Failed', error.message || 'Error occurred while toggling favorite.');
    }
  };

  const handleCategoryPress = (category: string) => {
    // Navigate to category when implemented
    Toast.show({
      type: 'info',
      text1: 'Category',
      text2: `${category} exercises coming soon`,
    });
  };

  useEffect(() => {
    if (user && activeTab === 'Favorites') {
      const fetchFavorites = async () => {
        try {
          const userId = (user as any)?._id || (user as any)?.userId || '';
          const response = await api.get(`/history/${userId}`);
          const favoriteNames = response.data?.data?.map((fav: any) => fav.exerciseName) || [];

          // Update exercises based on the fetched favorites
          const updatedExercises = exercises.map(exercise => ({
            ...exercise,
            isFavorite: favoriteNames.includes(exercise.fields?.Exercise),
          }));
          setExercises(updatedExercises);
        } catch (error) {
          console.error('Error fetching favorites:', error);
        }
      };
      fetchFavorites();
    }
  }, [user, activeTab]);

  const searchFilteredExercises = exercises.filter(exercise =>
    exercise.fields.Exercise.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFilteredExercises = () => {
    switch (activeTab) {
      case 'Favorites':
        return searchFilteredExercises.filter(exercise => exercise.isFavorite);
      case 'Muscles':
        return [];
      default:
        return searchFilteredExercises;
    }
  };

  return (
    <BackgroundGradient>
      <BlobBackground variant="scale" />
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
              name="search"
              size={18}
              color={COLORS.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              placeholder="Search exercises..."
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
                <Feather
                  name="x"
                  size={18}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Tab Container */}
          <Animated.View
            entering={FadeInDown.delay(150).springify()}
            style={styles.tabContainer}
          >
            {['All', 'Favorites', 'Muscles'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText
                ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Main Content */}
          {activeTab === 'Muscles' ? (
            <Animated.View
              entering={FadeInDown.delay(200).springify()}
            >
              <ScrollView style={styles.recentContent}>
                <View style={styles.headerContainer}>
                  <Text style={styles.sectionHeaderTitle}>TARGET YOUR TRAINING</Text>
                  <Text style={styles.headerSubtitle}>
                    Browse exercises by muscle group and build workouts that focus on your specific training goals
                  </Text>
                </View>

                <View style={styles.muscleGrid}>
                  {/* First Row */}
                  <View style={styles.gridRow}>
                    <TouchableOpacity
                      style={styles.categoryCard}
                      onPress={() => handleCategoryPress('Chest')}
                    >
                      <View style={styles.categoryPlaceholder}>
                        <Text style={styles.categoryText}>CHEST</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.categoryCard}
                      onPress={() => handleCategoryPress('Shoulders')}
                    >
                      <View style={styles.categoryPlaceholder}>
                        <Text style={styles.categoryText}>SHOULDERS</Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Second Row */}
                  <View style={styles.gridRow}>
                    <TouchableOpacity
                      style={styles.categoryCard}
                      onPress={() => handleCategoryPress('Back')}
                    >
                      <View style={styles.categoryPlaceholder}>
                        <Text style={styles.categoryText}>BACK</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.categoryCard}
                      onPress={() => handleCategoryPress('Arms')}
                    >
                      <View style={styles.categoryPlaceholder}>
                        <Text style={styles.categoryText}>ARMS</Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Third Row */}
                  <View style={styles.gridRow}>
                    <TouchableOpacity
                      style={styles.categoryCard}
                      onPress={() => handleCategoryPress('Core')}
                    >
                      <View style={styles.categoryPlaceholder}>
                        <Text style={styles.categoryText}>CORE</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.categoryCard}
                      onPress={() => handleCategoryPress('Legs')}
                    >
                      <View style={styles.categoryPlaceholder}>
                        <Text style={styles.categoryText}>LEGS</Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Fourth Row */}
                  <View style={styles.gridRow}>
                    <TouchableOpacity
                      style={styles.categoryCard}
                      onPress={() => handleCategoryPress('Glutes')}
                    >
                      <View style={styles.categoryPlaceholder}>
                        <Text style={styles.categoryText}>GLUTES</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.categoryCard}
                      onPress={() => handleCategoryPress('Full Body')}
                    >
                      <View style={styles.categoryPlaceholder}>
                        <Text style={styles.categoryText}>FULL BODY</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </Animated.View>
          ) : (
            <Animated.View
              entering={FadeInDown.delay(200).springify()}
              style={styles.listContainer}
            >
              <FlatList
                data={getFilteredExercises()}
                keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
                renderItem={({ item }) => {
                  const imageUrl = item.fields.Example && item.fields.Example[0] ? item.fields.Example[0].url : null;

                  return (
                    <TouchableOpacity
                      style={styles.itemContainer}
                      onPress={() => handleSelectExercise(item)}
                    >
                      {imageUrl ? (
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.thumbnail}
                        />
                      ) : (
                        <View style={styles.thumbnailPlaceholder}>
                          <Text style={styles.thumbnailText}>No Image</Text>
                        </View>
                      )}
                      <Text style={styles.itemText}>{item.fields.Exercise}</Text>
                      <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={() => handleToggleFavorite(item.id)}
                      >
                        <Image
                          source={item.isFavorite
                            ? require('../../assets/icons/star-filled.png')
                            : require('../../assets/icons/star-outline.png')
                          }
                          style={styles.starIcon}
                        />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={() => (
                  <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateText}>
                      {activeTab === 'Favorites'
                        ? 'No favorite exercises yet'
                        : 'No exercises found'}
                    </Text>
                  </View>
                )}
              />
            </Animated.View>
          )}
        </View>
      </SafeAreaView>
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
    paddingBottom: 90, // Account for tab bar
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
    paddingBottom: SPACING.xl,
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
  starIcon: {
    width: 16,
    height: 16,
    tintColor: COLORS.primary,
  },
  itemText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.large,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  favoriteButton: {
    position: 'absolute',
    right: SPACING.sm,
    top: SPACING.sm,
    padding: SPACING.xs,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xxl,
    minHeight: 300,
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
  categoryPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: {
    color: COLORS.textButton,
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
  },
});
