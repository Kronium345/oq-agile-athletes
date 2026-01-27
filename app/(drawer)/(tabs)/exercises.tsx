import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import api from '../../../api/axios';
import BackgroundGradient from '../../../components/BackgroundGradient';
import BlobBackground from '../../../components/BlobBackground';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import { useAuthContext } from '../../AuthProvider';
import { useWorkoutContext } from '../../WorkoutContext';

const { width } = Dimensions.get('window');

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

export default function Exercises() {
  const router = useRouter();
  const authContext = useAuthContext() as any;
  const user = authContext?.user || null;
  const { completed, setCompleted } = useWorkoutContext();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [offset, setOffset] = useState<number>(0);
  const pageSize = 10;
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    fetchExercises();
    loadFavorites();
  }, [page]);


  const loadFavorites = async () => {
    if (!user) return;
    
    try {
      console.log('📡 Loading favorites for initial load...');
      const response = await api.get(`/history/favorites/${(user as any)?._id}`);
      console.log('📥 Initial favorites response:', response.data);
      
      const favoriteNames = response.data.map((fav: any) => fav.exerciseName);
      console.log('⭐ Initial favorite names:', favoriteNames);
      
      if (favoriteNames.length > 0) {
        setExercises(prevExercises => prevExercises.map(ex => ({
          ...ex,
          isFavorite: favoriteNames.includes(ex.fields?.Exercise || ex.id)
        })));
        console.log('✅ Initial favorites loaded from server');
      } else {
        console.log('⚠️ No initial favorites found on server - exercises will start unfavorited');
      }
    } catch (error) {
      console.error('❌ Error loading initial favorites:', error);
      setExercises(prevExercises => prevExercises.map(ex => ({
        ...ex,
        isFavorite: false
      })));
    }
  };

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const params: any = {
        pageSize: pageSize,
      };
      
      if (offset) {
        params.offset = offset;
      }

      // OPTION 1: Direct fetch from Exercises11 (FAST)
      // Commented out - using Clarifai-enhanced data instead
      /*
      console.log('🔑 RapidAPI Key exists:', !!process.env.EXPO_PUBLIC_RAPID_API_KEY);
      console.log('🔗 Fetching exercises from Exercises11...');
      console.log(`📄 Request: limit=${pageSize}, offset=${offset}`);
      
      const response = await fetch(
        `https://exercises11.p.rapidapi.com/exercises?limit=${pageSize}&offset=${offset}`,
        {
          headers: {
            'X-RapidAPI-Key': process.env.EXPO_PUBLIC_RAPID_API_KEY!,
            'X-RapidAPI-Host': 'exercises11.p.rapidapi.com'
          },
        }
      );

      console.log('📡 Exercises11 Response status:', response.status);
      
      const data = await response.json();
      console.log("✅ Exercises11 data fetched:", Array.isArray(data) ? data.length : 0, "exercises");
      */

      // Enhanced fetch with Clarifai analysis
      console.log('🤖 Fetching Clarifai-enhanced exercises from backend...');
      const enhancedResponse = await api.post('/api/exercise-recognition/enhance', {
        limit: pageSize,
        offset: offset,
        apiKey: process.env.EXPO_PUBLIC_RAPID_API_KEY
      });
      
      const data = enhancedResponse.exercises;
      console.log("✅ Clarifai-enhanced data fetched:", data.length, "exercises");

      if (Array.isArray(data) && data.length > 0) {
        console.log("\n🔀 Transforming Clarifai-enhanced data to app format...");

        const transformedExercises = data.map((exercise: any) => {
          let imageUrl = exercise.gifUrl;
          if (imageUrl && imageUrl.startsWith('/api/')) {
            // TEMP: Hard-coded dev server URL for mobile
            imageUrl = `http://192.168.1.205:4000${imageUrl}`;
          } else if (!imageUrl) {
            // TEMP: Hard-coded dev server URL for mobile
            imageUrl = `http://192.168.1.205:4000/api/exercise-recognition/image/${exercise.id}`;
          }
          
          const instructionsText = Array.isArray(exercise.instructions) 
            ? exercise.instructions.join('. ')
            : exercise.instructions || 'No description available';
          
          console.log(`\n🔍 EXERCISE: ${exercise.name}`);
          console.log(`  ID: ${exercise.id}`);
          console.log(`  🖼️ Proxied Image URL: ${imageUrl}`);
          console.log(`  🏋️ Body Part: ${exercise.bodyPart}`);
          console.log(`  🎯 Target: ${exercise.target}`);
          
          const transformedExercise = {
            id: exercise.id,
            fields: {
              Exercise: exercise.name || 'Unnamed Exercise',
              Notes: instructionsText,
              Example: [{ url: imageUrl }], 
              Equipment: exercise.equipment || 'Not specified',
              'Exercise Type': exercise.bodyPart || 'Not specified', 
              'Major Muscle': exercise.target || 'Not specified',
              'Minor Muscle': Array.isArray(exercise.secondaryMuscles) 
                ? exercise.secondaryMuscles[0] 
                : (exercise.secondaryMuscles || 'Not specified'),
              Modifications: 'Standard form. Focus on proper technique.'
            },
            isFavorite: false
          };
          
          return transformedExercise;
        });

        console.log(`\n✅ Total transformed exercises: ${transformedExercises.length}`);

        setExercises(prevExercises => {
          const newExercises = [...prevExercises, ...transformedExercises];
          console.log(`📊 Total exercises after update: ${newExercises.length}`);
          return newExercises;
        });

        setOffset(offset + pageSize);
      } else {
        console.log("⚠️ No results found in the API response.");
      }
    } catch (error: any) {
      console.error("❌ Dual-API fetch failed:", error);
      console.error("Error details:", error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to fetch exercises data',
        position: 'bottom',
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

  const handleStartWorkout = () => {
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

    // Transform exercises to workout format
    const transformedExercises = workoutExercises.map(ex => ({
      id: ex.id,
      name: ex.fields.Exercise,
      gifUrl: ex.fields.Example && ex.fields.Example[0] ? ex.fields.Example[0].url : '',
      sets: 10, // Default sets
      bodyPart: ex.fields['Exercise Type'] || 'Not specified',
      equipment: ex.fields.Equipment || 'Not specified',
      target: Array.isArray(ex.fields['Major Muscle']) 
        ? ex.fields['Major Muscle'][0] 
        : ex.fields['Major Muscle'] || 'Not specified',
    }));

    // Reset completed exercises for new workout
    setCompleted([]);

    // Navigate to FitScreen with exercises
    router.push({
      pathname: '/FitScreen',
      params: {
        exercises: JSON.stringify(transformedExercises)
      }
    } as any);
  };

  const handleToggleFavorite = async (exerciseId: string) => {
    // Suppress CSS-related errors on web during icon interaction
    if (Platform.OS === 'web') {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        const message = args[0];
        if (typeof message === 'string' && (
          message.includes('CSSStyleDeclaration') || 
          message.includes('indexed property') || 
          message.includes('property setter is not supported')
        )) {
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

    const exercise = exercises.find(ex => ex.id === exerciseId);
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
      console.log('✅ Server response:', response.data);

      setExercises(prevExercises => prevExercises.map(ex =>
        ex.id === exerciseId ? { ...ex, isFavorite: !ex.isFavorite } : ex
      ));

      console.log('🔄 Local state updated after server confirmation');
      Toast.show({
        type: 'success', 
        text1: 'Favorite Status Updated', 
        text2: 'Exercise favorite status has been toggled.',
        position: 'bottom',
      });
      
    } catch (error: any) {
      console.error('❌ Error toggling favorite:', error.response ? error.response.data : error.message);
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

  const handleCategoryPress = (category: string) => {
    // Navigate to category when implemented
    Toast.show({
      type: 'info',
      text1: 'Category',
      text2: `${category} exercises coming soon`,
    });
  };

  useEffect(() => {
    console.log('📋 TAB CHANGED:', activeTab);
    
    if (user && activeTab === 'Favorites') {
      console.log('⭐ Loading Favorites tab for user:', (user as any)?._id);
      const fetchFavorites = async () => {
        try {
          console.log('📡 Fetching favorites from server...');
          
          const response = await api.get(`/history/favorites/${(user as any)?._id}`);
          console.log('📥 Server response:', response.data);
          
          const favoriteNames = response.data.map((fav: any) => fav.exerciseName);
          console.log('⭐ Favorite exercise names:', favoriteNames);

          if (favoriteNames.length > 0) {
            const updatedExercises = exercises.map(exercise => {
              const isFavorite = favoriteNames.includes(exercise.fields?.Exercise);
              return {
                ...exercise,
                isFavorite: isFavorite
              };
            });
            
            console.log('🔄 Updated exercises with favorite status from server');
            setExercises(updatedExercises);
            console.log('✅ Favorites loaded successfully');
          } else {
            console.log('⚠️ Server returned no favorites - preserving local state to avoid overwriting optimistic updates');
            console.log('✅ Preserving local favorites state');
          }
          
        } catch (error) {
          console.error('❌ Error fetching favorites:', error);
          console.log('⚠️ Server error - preserving local state to avoid overwriting optimistic updates');
        }
      };
      
      fetchFavorites();
    }
  }, [user, activeTab]);

  const searchFilteredExercises = exercises.filter(exercise =>
    exercise.fields.Exercise.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFilteredExercises = () => {
    console.log('🔍 Filtering exercises for tab:', activeTab);
    
    switch (activeTab) {
      case 'Favorites':
        const favoriteExercises = searchFilteredExercises.filter(exercise => exercise.isFavorite);
        console.log(`📋 Showing ${favoriteExercises.length} favorite exercises`);
        return favoriteExercises;
        
      case 'Muscles':
        return [];
        
      default:
        console.log(`📋 Showing ${searchFilteredExercises.length} total exercises`);
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
                            console.log(`✅ Image loaded successfully: ${item.fields.Exercise}`);
                          }}
                          onError={(error) => {
                            console.error(`❌ Image failed to load for ${item.fields.Exercise}:`, error.nativeEvent?.error || 'Unknown error');
                            console.error(`   Failed URL: ${imageUrl}`);
                          }}
                        />
                      ) : (
                        <View style={styles.thumbnailPlaceholder}>
                          <Text style={styles.thumbnailText}>No Image</Text>
                        </View>
                      )}
                      <Text style={styles.itemText}>{item.fields.Exercise}</Text>
                      
                      {/* Completed Checkmark */}
                      {isCompleted && (
                        <View style={styles.completedBadge}>
                          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
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
                            <View style={[styles.starIconWeb, { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }]}>
                              <Ionicons
                                name={item.isFavorite ? "star" : "star-outline"}
                                size={20}
                                color={item.isFavorite ? COLORS.primary : COLORS.textSecondary}
                              />
                            </View>
                          ) : (
                            <Ionicons
                              name={item.isFavorite ? "star" : "star-outline"}
                              size={20}
                              color={item.isFavorite ? COLORS.primary : COLORS.textSecondary}
                              style={styles.starIcon}
                            />
                          )}
                        </View>
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

        {/* Floating Start Workout Button - Only show on All/Favorites tab */}
        {activeTab !== 'Muscles' && exercises.length > 0 && (
          <TouchableOpacity
            style={styles.startWorkoutButton}
            onPress={handleStartWorkout}
            activeOpacity={0.8}
          >
            <Ionicons name="play-circle" size={24} color={COLORS.textButton} />
            <Text style={styles.startWorkoutText}>START WORKOUT</Text>
          </TouchableOpacity>
        )}
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
  startWorkoutButton: {
    position: 'absolute',
    bottom: 20,
    left: SPACING.xl,
    right: SPACING.xl,
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
  startWorkoutText: {
    color: COLORS.textButton,
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
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
