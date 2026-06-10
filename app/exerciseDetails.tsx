import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import api from '../api/axios';
import BackgroundGradient from '../components/BackgroundGradient';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../constants/theme';
import {
  formatExerciseDetailValue,
  formatExerciseTitle,
  getExerciseInstructionParagraphs,
} from '../lib/formatExerciseText';
import { useAuthContext } from './AuthProvider';


const { width: screenWidth } = Dimensions.get('window');

const YOUTUBE_DATA_API_SEARCH = 'https://www.googleapis.com/youtube/v3/search';

export type YouTubeVideo = {
  videoId: string;
  title: string;
  channelName: string;
  thumbnails: Array<{ url: string }>;
};

function parseYouTubeDataApiResponse(data: any): YouTubeVideo[] {
  const items = data?.items ?? [];
  const videos: YouTubeVideo[] = [];
  for (const item of items) {
    const id = item?.id?.videoId;
    const snippet = item?.snippet;
    if (!id || !snippet) continue;
    const thumb = snippet.thumbnails?.medium ?? snippet.thumbnails?.default;
    videos.push({
      videoId: id,
      title: snippet.title ?? 'Untitled',
      channelName: snippet.channelTitle ?? 'Unknown',
      thumbnails: thumb ? [{ url: thumb.url }] : [],
    });
  }
  return videos.slice(0, 3);
}

async function fetchYouTubeExerciseVideos(
  exerciseName: string,
): Promise<YouTubeVideo[]> {
  const apiKey = process.env.EXPO_PUBLIC_WEB_GOOGLE_API_KEY;
  if (!apiKey) {
    console.warn('YouTube Tutorial: EXPO_PUBLIC_WEB_GOOGLE_API_KEY is not set');
    return [];
  }
  const q = encodeURIComponent(`${exerciseName} exercise`);
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&type=video&maxResults=3&key=${apiKey}`;
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      const text = await res.text();
      console.warn('YouTube Tutorial: API responded with', res.status, text);
      return [];
    }
    const data = await res.json();
    const videos = parseYouTubeDataApiResponse(data);
    return videos;
  } catch (err) {
    console.error('Error fetching YouTube videos:', err);
    return [];
  }
}

// Set Tracker Component Start
interface SetData {
  [key: number]: { rest: string; weight: string; reps: string };
}

interface SetTrackerProps {
  onLogExercise: (
    sets: number,
    reps: number,
    weight: number,
    setDetails: SetData,
  ) => Promise<void>;
}

const SetTracker: React.FC<SetTrackerProps> = ({ onLogExercise }) => {
  const [sets, setSets] = useState<number[]>([1]);
  const [logStatus, setLogStatus] = useState<'idle' | 'success' | 'error'>(
    'idle',
  );
  const [setData, setSetData] = useState<SetData>({
    1: { rest: '0s', weight: '0', reps: '0' },
  });
  const [completedSets, setCompletedSets] = useState<Set<number>>(new Set());

  const addSet = () => {
    const newSetNumber = sets.length + 1;
    setSets([...sets, newSetNumber]);
    setSetData((prev) => ({
      ...prev,
      [newSetNumber]: { rest: '0s', weight: '0', reps: '0' },
    }));
  };

  const handleComplete = (setNumber: number) => {
    setCompletedSets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(setNumber)) {
        newSet.delete(setNumber);
      } else {
        newSet.add(setNumber);
      }
      return newSet;
    });
  };

  const removeLastSet = () => {
    if (sets.length > 1) {
      const newSets = sets.slice(0, -1);
      const lastSet = sets[sets.length - 1];
      setSets(newSets);
      const newSetData: SetData = { ...setData };
      delete newSetData[lastSet];
      setSetData(newSetData);
    }
  };

  const updateSetValue = (setNumber: number, field: string, value: string) => {
    setSetData((prev) => ({
      ...prev,
      [setNumber]: {
        ...(prev[setNumber] || { rest: '0s', weight: '0', reps: '0' }),
        [field]: value,
      },
    }));
  };

  const handleLogExercise = async () => {
    console.log('=== Set Tracker Log Process ===');
    console.log('Current sets:', sets);
    console.log('Current setData:', setData);
    console.log('Completed sets:', Array.from(completedSets));

    // Validate that all fields have values and setData exists
    if (!setData || Object.keys(setData).length === 0) {
      console.log('Validation failed: No set data available');
      Toast.show({
        type: 'error',
        text1: 'Invalid Input',
        text2: 'No set data available',
      });
      return;
    }

    const hasEmptyFields = Object.values(setData).some(
      (set) => !set || set.weight === '0' || set.reps === '0',
    );

    if (hasEmptyFields) {
      console.log('Validation failed: Empty fields detected');
      console.log(
        'Set data with empty fields:',
        Object.entries(setData).filter(
          ([_, set]) => !set || set.weight === '0' || set.reps === '0',
        ),
      );
      Toast.show({
        type: 'error',
        text1: 'Invalid Input',
        text2: 'Please fill in weight and reps for all sets',
      });
      return;
    }

    const totalSets = sets.length;
    const avgReps = Math.round(
      Object.values(setData).reduce(
        (sum, set) => sum + parseInt(String(set?.reps || 0), 10),
        0,
      ) / totalSets,
    );
    const avgWeight = parseFloat(
      (
        Object.values(setData).reduce(
          (sum, set) => sum + parseFloat(String(set?.weight || 0)),
          0,
        ) / totalSets
      ).toFixed(2),
    );

    console.log('Calculated values:', {
      totalSets,
      avgReps,
      avgWeight,
      setDetails: setData,
    });

    try {
      // Call the parent logging function and wait for it to complete
      await onLogExercise(totalSets, avgReps, avgWeight, setData);

      // Only show success message if the API call succeeded
      setLogStatus('success');
      setTimeout(() => setLogStatus('idle'), 3000);

      console.log('=== Set Tracker Log Process Completed Successfully ===\n');
    } catch (error) {
      console.log('=== Set Tracker Log Process Failed ===', error);
      // Don't show success status if there was an error
      setLogStatus('idle');
    }
  };

  return (
    <View style={styles.setTrackerContainer}>
      <View style={styles.headerRow}>
        <Text style={[styles.columnHeader, styles.setColumn]}>SET</Text>
        <Text style={[styles.columnHeader, styles.restColumn]}>REST</Text>
        <Text style={[styles.columnHeader, styles.kgColumn]}>KG</Text>
        <Text style={[styles.columnHeader, styles.repsColumn]}>REPS</Text>
        <Text style={styles.columnHeader}></Text>
      </View>

      {sets.map((setNumber) => (
        <View key={setNumber} style={styles.setRow}>
          <View style={styles.setColumn}>
            <TextInput
              style={styles.setInput}
              value={setNumber.toString()}
              onChangeText={(value) => {
                const newSetNumber = parseInt(value, 10);
                if (!isNaN(newSetNumber) && newSetNumber > 0) {
                  // Update the set data with the new set number
                  setSetData((prev) => {
                    const newData = { ...prev };
                    delete newData[setNumber];
                    newData[newSetNumber] = prev[setNumber] || {
                      rest: '0s',
                      weight: '0',
                      reps: '0',
                    };
                    return newData;
                  });
                  // Update the sets array
                  setSets((prev) =>
                    prev
                      .map((num) => (num === setNumber ? newSetNumber : num))
                      .sort((a, b) => a - b),
                  );
                }
              }}
              keyboardType='numeric'
              placeholder='1'
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>
          <View style={styles.restColumn}>
            <TextInput
              style={styles.setInput}
              value={setData[setNumber]?.rest}
              onChangeText={(value) => updateSetValue(setNumber, 'rest', value)}
              keyboardType='default'
              placeholder='0s'
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>
          <View style={styles.kgColumn}>
            <TextInput
              style={styles.setInput}
              value={setData[setNumber]?.weight}
              onChangeText={(value) =>
                updateSetValue(setNumber, 'weight', value)
              }
              keyboardType='numeric'
              placeholder='0'
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>
          <View style={styles.repsColumn}>
            <TextInput
              style={styles.setInput}
              value={setData[setNumber]?.reps}
              onChangeText={(value) => updateSetValue(setNumber, 'reps', value)}
              keyboardType='numeric'
              placeholder='0'
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.checkButton,
              completedSets.has(setNumber) && {
                backgroundColor: COLORS.primary,
              },
            ]}
            onPress={() => handleComplete(setNumber)}
          >
            <Feather
              name={completedSets.has(setNumber) ? 'check' : 'circle'}
              size={20}
              color={
                completedSets.has(setNumber)
                  ? COLORS.textButton
                  : COLORS.textSecondary
              }
            />
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.addButton]}
          onPress={addSet}
        >
          <Text style={styles.addSetButton}>+ Add Set</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={removeLastSet}
        >
          <Text style={styles.removeSetButton}>Remove Set</Text>
        </TouchableOpacity>
      </View>

      {logStatus === 'success' && (
        <Text style={{ color: '#00FF00', textAlign: 'center', marginTop: 10 }}>
          Exercise saved ✅
        </Text>
      )}

      <TouchableOpacity style={styles.logButton} onPress={handleLogExercise}>
        <Text style={styles.logButtonText}>Log Exercise</Text>
      </TouchableOpacity>
    </View>
  );
};
// Set Tracker Component End

const ExerciseDetail = () => {
  const router = useRouter();
  // Use useLocalSearchParams to access route parameters
  const {
    id,
    name,
    description,
    image,
    equipment,
    exerciseType,
    majorMuscle,
    minorMuscle,
    modifications,
  } = useLocalSearchParams();

  console.log('=== EXERCISE DETAIL COMPONENT DEBUG ===');
  console.log('Component rendered');

  const authContext = useAuthContext() as any;
  const user = authContext?.user || null;
  const [activeTab, setActiveTab] = useState('Details');
  const [exerciseVideos, setExerciseVideos] = useState<
    Array<{
      videoId: string;
      title: string;
      channelName: string;
      thumbnails: Array<{ url: string }>;
    }>
  >([]);
  const [tutorialLoading, setTutorialLoading] = useState(false);

  const exerciseName =
    typeof name === 'string'
      ? name
      : Array.isArray(name)
        ? name[0]
        : '';
  const displayTitle = formatExerciseTitle(exerciseName);
  const instructionParagraphs = getExerciseInstructionParagraphs(
    typeof description === 'string'
      ? description
      : Array.isArray(description)
        ? description[0] ?? ''
        : '',
  );

  const detailRows: { label: string; value: string | undefined }[] = [
    { label: 'Equipment', value: equipment as string | undefined },
    { label: 'Exercise type', value: exerciseType as string | undefined },
    { label: 'Major muscle', value: majorMuscle as string | undefined },
    { label: 'Minor muscle', value: minorMuscle as string | undefined },
    {
      label: 'Modifications',
      value: modifications as string | undefined,
    },
  ];

  useEffect(() => {
    const exerciseName =
      typeof name === 'string' ? name : (name as string[])?.[0];
    if (!exerciseName?.trim()) return;
    let cancelled = false;
    setTutorialLoading(true);
    (async () => {
      const videos = await fetchYouTubeExerciseVideos(exerciseName);
      if (!cancelled) {
        setExerciseVideos(videos);
        setTutorialLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      setTutorialLoading(false);
    };
  }, [name]);

  console.log('Auth context:', authContext);
  console.log('User from context:', user);
  console.log('User type:', typeof user);

  // Add effect to check AsyncStorage directly
  React.useEffect(() => {
    const checkAsyncStorage = async () => {
      console.log('=== CHECKING ASYNC STORAGE ===');
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('session'); // Check session token too
        const storedTokenOld = await AsyncStorage.getItem('token'); // Check old token key

        console.log('Stored user (raw):', storedUser);
        console.log('Stored session token:', storedToken);
        console.log('Stored token (old key):', storedTokenOld);

        if (storedUser) {
          console.log('Parsed stored user:', JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error checking AsyncStorage:', error);
      }
    };

    checkAsyncStorage();
  }, []);

  // Ensure the id exists before proceeding
  if (!id) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.titleNo}>Exercise details unavailable</Text>
      </ScrollView>
    );
  }

  // ExerciseId is passed through the URL from the exercises.jsx component
  const exerciseId = id;

  const showToast = (type: string, text1: string, text2?: string) => {
    Toast.show({
      type: type,
      text1: text1,
      text2: text2,
      position: 'bottom',
      visibilityTime: 4000,
    });
  };

  const handleLogExercise = async (
    sets: number,
    reps: number,
    weight: number,
    setDetails: SetData,
  ) => {
    // Suppress CSS-related errors on web during logging
    const originalConsoleError = console.error;
    if (Platform.OS === 'web') {
      console.error = (...args) => {
        const message = args[0];
        if (
          typeof message === 'string' &&
          (message.includes('CSSStyleDeclaration') ||
            message.includes('indexed property') ||
            message.includes('property setter is not supported') ||
            message.includes('Failed to set an indexed property'))
        ) {
          return; // Suppress CSS errors
        }
        originalConsoleError(...args);
      };
    }

    console.log('=== Starting Exercise Log Process ===');
    console.log('Initial data:', { sets, reps, weight });
    console.log('Set details:', setDetails);
    console.log('==== USER DEBUG INFO ====');
    console.log('User object:', user);
    console.log('User type:', typeof user);
    console.log('User keys:', user ? Object.keys(user) : 'no user');
    console.log('User._id:', user?._id);
    console.log('User.userId:', (user as any)?.userId);
    console.log('User.email:', user?.email);
    console.log('==== EXERCISE DEBUG INFO ====');
    console.log('Exercise name:', name);
    console.log('Name type:', typeof name);
    console.log('Name length:', name ? name.length : 'no name');

    if (!user || !name) {
      console.log('=== VALIDATION FAILED ===');
      console.log('Has user:', !!user);
      console.log('Has name:', !!name);
      console.log('User truthiness:', Boolean(user));
      console.log('Name truthiness:', Boolean(name));

      Toast.show({
        type: 'error',
        text1: 'Exercise Logging Failed',
        text2: !user ? 'User not logged in' : 'Exercise name is missing',
      });
      throw new Error(
        !user ? 'User not logged in' : 'Exercise name is missing',
      );
    }

    try {
      const resolvedExerciseName = String(name || '').trim();
      const notes = `Completed via set tracker: ${sets}x${reps} @ ${weight}kg`;
      const logEntry = {
        exerciseName: resolvedExerciseName,
        sets: Number(sets),
        reps: Number(reps),
        weight: Number(weight),
        duration: 30, // Default duration in minutes
        caloriesBurned: Math.round(weight * reps * sets * 0.5), // Rough calorie calculation
        notes,
      };

      console.log('Prepared log entry:', JSON.stringify(logEntry, null, 2));
      console.log('Sending request to server...');

      // Use template endpoint: POST /history/history
      const response = await api.post('/history/history', logEntry);
      console.log('Server response:', response);
      console.log('Exercise logged successfully!');

      // Success toast
      Toast.show({
        type: 'success',
        text1: 'Exercise Logged Successfully in History',
        text2: `${name}: ${sets} sets, ${reps} reps, ${weight}kg`,
      });
    } catch (error: any) {
      console.error('Error logging exercise:', error);

      // Show proper error toast instead of Alert
      Toast.show({
        type: 'error',
        text1: 'Exercise Logging Failed',
        text2: error?.message || 'Failed to log exercise. Please try again.',
      });

      // Re-throw the error so SetTracker knows it failed
      throw error;
    } finally {
      // Restore original console.error
      if (Platform.OS === 'web') {
        setTimeout(() => {
          console.error = originalConsoleError;
        }, 1000);
      }
    }
    console.log('=== End Exercise Log Process ===\n');
  };

  return (
    <BackgroundGradient>
      <View style={styles.container}>
        <SafeAreaView
          style={{ flex: 1, top: -10 }}
          edges={['top', 'right', 'left']}
        >
          {/* Header Start */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <BlurView
                intensity={20}
                tint='light'
                style={styles.blurContainer}
              >
                <Ionicons
                  name='chevron-back'
                  size={18}
                  color={COLORS.textPrimary}
                />
              </BlurView>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{displayTitle}</Text>
          </View>
          {/* Header End */}

          {/* Tabs Component Start */}
          <View style={styles.tabsContainer}>
            {['Details', 'Tutorial', 'Workouts'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && {
                      color: COLORS.textPrimary,
                      fontWeight: TYPOGRAPHY.fontWeight.semiBold,
                    },
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Tabs Component End */}

          {/* Main Component (Scrollable Content) Start */}
          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
          >
            {activeTab === 'Details' && (
              <>
                {image && typeof image === 'string' && (
                  <View style={styles.exerciseImageWrap}>
                    <Image
                      source={{ uri: image }}
                      style={styles.exercisePreview}
                      resizeMode='contain'
                    />
                  </View>
                )}
                <View style={styles.instructionsSection}>
                  <Text style={styles.sectionHeading}>How to perform</Text>
                  {instructionParagraphs.length > 0 ? (
                    instructionParagraphs.map((paragraph, index) => (
                      <View
                        key={`instruction-${index}`}
                        style={styles.instructionRow}
                      >
                        <View style={styles.stepBadge}>
                          <Text style={styles.stepBadgeText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.instructionParagraph}>
                          {paragraph}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.instructionFallback}>
                      No description available.
                    </Text>
                  )}
                </View>

                {/* Exercise Details Start */}
                <View style={styles.detailsCard}>
                  <View style={styles.detailsTitleRow}>
                    <Ionicons
                      name='information-circle-outline'
                      size={22}
                      color={COLORS.primary}
                    />
                    <Text style={styles.detailsTitle}>{displayTitle}</Text>
                  </View>
                  {detailRows.map((row, index) => (
                    <View
                      key={row.label}
                      style={[
                        styles.detailRow,
                        index === detailRows.length - 1 && styles.detailRowLast,
                      ]}
                    >
                      <Text style={styles.detailLabel}>{row.label}</Text>
                      <Text style={styles.detailValue}>
                        {formatExerciseDetailValue(row.value)}
                      </Text>
                    </View>
                  ))}
                </View>
                {/* Exercise Details End */}

                {/* Set Tracker Component Start */}
                <View style={styles.setTrackerWrapper}>
                  <Text style={styles.sectionTitle}>Track Your Sets</Text>
                  <SetTracker onLogExercise={handleLogExercise} />
                </View>
                {/* Set Tracker Component End */}
              </>
            )}

            {activeTab === 'Tutorial' && (
              <View style={styles.tutorialContainer}>
                <Text style={styles.tutorialTitle}>
                  Watch{' '}
                  <Text style={styles.tutorialTitleAccent}>
                    {typeof name === 'string'
                      ? name
                      : (name as string[])?.[0] || 'this'}
                  </Text>{' '}
                  exercise videos
                </Text>
                {tutorialLoading ? (
                  <View style={styles.tutorialLoadingContainer}>
                    <ActivityIndicator size='large' color={COLORS.primary} />
                    <Text style={styles.tutorialLoadingText}>
                      Loading tutorials...
                    </Text>
                  </View>
                ) : exerciseVideos.length === 0 ? (
                  <Text style={styles.emptyTabText}>
                    No tutorial videos found for this exercise.
                  </Text>
                ) : (
                  <View style={styles.videoList}>
                    {exerciseVideos.map((item, index) => (
                      <TouchableOpacity
                        key={item.videoId || index}
                        style={styles.videoCard}
                        onPress={() =>
                          Linking.openURL(
                            `https://www.youtube.com/watch?v=${item.videoId}`,
                          )
                        }
                        activeOpacity={0.8}
                      >
                        <Image
                          source={{ uri: item.thumbnails?.[0]?.url }}
                          style={styles.videoThumbnail}
                          resizeMode='cover'
                        />
                        <View style={styles.videoInfo}>
                          <Text style={styles.videoTitle} numberOfLines={2}>
                            {item.title}
                          </Text>
                          <Text style={styles.videoChannel}>
                            {item.channelName}
                          </Text>
                        </View>
                        <Ionicons
                          name='play-circle'
                          size={28}
                          color={COLORS.primary}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {activeTab === 'Workouts' && (
              <View style={styles.emptyTabContainer}>
                {/* TODO: Add Workouts Content
              Suggested content:
              - List of workouts featuring this exercise
              - Recommended workout combinations
              - Training programs
              - User-created workouts
            */}
                <Text style={styles.emptyTabText}>
                  Workouts content coming soon
                </Text>
              </View>
            )}
          </ScrollView>
          {/* Main Component (Scrollable Content) End */}

          <Toast />
        </SafeAreaView>
      </View>
    </BackgroundGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  // Header Start
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    position: 'relative',
    backgroundColor: COLORS.background,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    letterSpacing: 0.5,
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  blurContainer: {
    borderRadius: BORDER_RADIUS.medium,
    overflow: 'hidden',
    paddingVertical: SPACING.sm,
    paddingRight: SPACING.md,
    paddingLeft: SPACING.sm,
    backgroundColor: COLORS.backgroundOverlay,
  },
  // Header End

  // Tabs Component Start
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.xs,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.large,
  },
  activeTab: {
    backgroundColor: COLORS.background,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  emptyTabContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    marginTop: SPACING.xxxl,
  },
  emptyTabText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.medium,
    textAlign: 'center',
  },
  tutorialContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  tutorialTitle: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  tutorialTitleAccent: {
    color: COLORS.primary,
    textTransform: 'capitalize',
  },
  tutorialLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
    gap: SPACING.md,
  },
  tutorialLoadingText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
  videoList: {
    gap: SPACING.lg,
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    overflow: 'hidden',
    ...SHADOWS.card,
    paddingRight: SPACING.sm,
  },
  videoThumbnail: {
    width: 120,
    height: 68,
    borderTopLeftRadius: BORDER_RADIUS.medium,
    borderBottomLeftRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.backgroundAlt,
  },
  videoInfo: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  videoTitle: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  videoChannel: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
  },
  // Tabs Component End

  // Exercise Details Start
  titleNo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  exerciseImageWrap: {
    marginTop: SPACING.xl,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  exercisePreview: {
    width: screenWidth - 56,
    height: screenWidth * 0.52,
  },
  instructionsSection: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  sectionHeading: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.background,
  },
  instructionParagraph: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.medium,
    lineHeight: 24,
    color: COLORS.textPrimary,
  },
  instructionFallback: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    lineHeight: 24,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  detailsCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  detailsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  detailsTitle: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderLight,
  },
  detailLabel: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    flex: 1.2,
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  detailRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  // Exercise Details End

  // Set Tracker Component Start
  setTrackerWrapper: {
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    backgroundColor: COLORS.backgroundCard,
    ...SHADOWS.card,
    borderRadius: BORDER_RADIUS.large,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  logButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    width: '60%',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: SPACING.xl,
  },
  logButtonText: {
    color: COLORS.textButton,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  setTrackerContainer: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  columnHeader: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    width: 40,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: BORDER_RADIUS.medium,
  },
  setColumn: {
    width: 40,
  },
  restColumn: {
    width: 60,
  },
  kgColumn: {
    width: 60,
  },
  repsColumn: {
    width: 60,
  },
  checkButton: {
    width: 40,
  },
  setText: {
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  setInput: {
    color: COLORS.textPrimary,
    textAlign: 'center',
    padding: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.medium,
    backgroundColor: 'transparent',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  actionButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
  },
  addButton: {
    backgroundColor: COLORS.primary,
  },
  removeButton: {
    backgroundColor: COLORS.error,
    opacity: 0.2,
  },
  addSetButton: {
    color: COLORS.textButton,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
  removeSetButton: {
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
});

export default ExerciseDetail;
