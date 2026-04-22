import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/axios';
import BackgroundGradient from '../components/BackgroundGradient';
import BlobBackground from '../components/BlobBackground';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useAuthContext } from './AuthProvider';
import { useWorkoutContext } from './WorkoutContext';

interface Exercise {
  id: string;
  name: string;
  gifUrl: string;
  sets?: number;
  bodyPart?: string;
  equipment?: string;
  target?: string;
}

export default function FitScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const authContext = useAuthContext() as any;
  const user = authContext?.user || null;
  const { completed, setCompleted, workout, setWorkout, calories, setCalories, minutes, setMinutes } = useWorkoutContext();
  
  const [index, setIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  const exercises: Exercise[] = params.exercises 
    ? JSON.parse(params.exercises as string) 
    : [];

  useEffect(() => {
    if (params.nextIndex) {
      const newIndex = parseInt(params.nextIndex as string, 10);
      if (!isNaN(newIndex) && newIndex !== index) {
        setIndex(newIndex);
      }
    }
  }, [params.nextIndex]);

  const current = exercises[index];

  // Timer effect - counts up to show elapsed time
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    
    if (isTimerRunning) {
      timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTimerRunning]);

  // Reset timer when exercise changes
  useEffect(() => {
    setElapsedTime(0);
    setIsTimerRunning(true);
  }, [index]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const saveExerciseToBackend = async (exerciseName: string, duration: number) => {
    if (!user) return;

    try {
      const userId = (user as any)?._id || (user as any)?.userId || '';
      
      // Save exercise to history
      await api.post('/history/history', {
        exerciseName,
        duration: Math.round(duration), // Convert to seconds
        caloriesBurned: 6.3,
        sets: current.sets || 1,
        reps: current.sets || 10,
        weight: 0,
        notes: `Completed via workout session`,
      });

      // Update aggregated stats
      await api.post('/user-stats/update', {
        workouts: 1,
        calories: 6.3,
        minutes: 2.5,
      });
    } catch (error: any) {
      console.error('Error saving exercise to backend:', error);
    }
  };

  const handleDone = async () => {
    if (index + 1 >= exercises.length) {
      if (user) {
        await saveExerciseToBackend(current.name, elapsedTime);
      }
      setCompleted([...completed, current.name]);
      setWorkout(workout + 1);
      setMinutes(minutes + 2.5);
      setCalories(calories + 6.3);
      router.replace('/(drawer)/(tabs)/home' as any);
    } else {
      // Not last exercise - mark as completed and go to rest
      if (user) {
        await saveExerciseToBackend(current.name, elapsedTime);
      }
      setCompleted([...completed, current.name]);
      setWorkout(workout + 1);
      setMinutes(minutes + 2.5);
      setCalories(calories + 6.3);
      
      // Calculate next index (don't update state yet - pass as param)
      const nextIndex = index + 1;
      
      router.push({
        pathname: '/RestScreen',
        params: {
          exercises: JSON.stringify(exercises),
          nextIndex: nextIndex.toString(),
        },
      } as any);
    }
  };

  const handlePrev = () => {
    if (index === 0) return;
    
    const prevIndex = index - 1;
    
    router.push({
      pathname: '/RestScreen',
      params: {
        exercises: JSON.stringify(exercises),
        nextIndex: prevIndex.toString(),
      },
    } as any);
  };

  const handleSkip = () => {
    if (index + 1 >= exercises.length) {
      // Last exercise - navigate home
      router.replace('/(drawer)/(tabs)/home' as any);
    } else {
      const nextIndex = index + 1;
      
      router.push({
        pathname: '/RestScreen',
        params: {
          exercises: JSON.stringify(exercises),
          nextIndex: nextIndex.toString(),
        },
      } as any);
    }
  };

  if (!current) {
    return (
      <BackgroundGradient>
        <SafeAreaView style={styles.container}>
          <Text style={styles.errorText}>No exercises found</Text>
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient>
      <BlobBackground variant="scale" />
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <Pressable 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </Pressable>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Exercise {index + 1} of {exercises.length}
            </Text>
          </View>

          {/* Exercise GIF */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: current.gifUrl }}
              style={styles.exerciseImage}
              resizeMode="contain"
            />
          </View>

          {/* Timer Display */}
          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={24} color={COLORS.primary} />
            <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
          </View>

          {/* Exercise Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.exerciseName}>{current.name}</Text>
            {current.sets && (
              <View style={styles.setsContainer}>
                <Text style={styles.setsText}>x{current.sets}</Text>
                <Text style={styles.setsLabel}>reps</Text>
              </View>
            )}
            {current.bodyPart && (
              <View style={styles.metadataRow}>
                <View style={styles.metadataBadge}>
                  <Text style={styles.metadataText}>{current.bodyPart}</Text>
                </View>
                {current.equipment && (
                  <View style={styles.metadataBadge}>
                    <Text style={styles.metadataText}>{current.equipment}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {/* DONE Button */}
            <Pressable
              style={[styles.doneButton, styles.mainButton]}
              onPress={handleDone}
            >
              <Text style={styles.doneButtonText}>
                {index + 1 >= exercises.length ? 'FINISH' : 'DONE'}
              </Text>
            </Pressable>

            {/* PREV and SKIP Buttons */}
            <View style={styles.navigationButtons}>
              <Pressable
                style={[
                  styles.navButton,
                  index === 0 && styles.navButtonDisabled,
                ]}
                onPress={handlePrev}
                disabled={index === 0}
              >
                <Text
                  style={[
                    styles.navButtonText,
                    index === 0 && styles.navButtonTextDisabled,
                  ]}
                >
                  PREV
                </Text>
              </Pressable>

              <Pressable
                style={styles.navButton}
                onPress={handleSkip}
              >
                <Text style={styles.navButtonText}>SKIP</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xxl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  progressText: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  imageContainer: {
    width: '100%',
    height: 320,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.cardLarge,
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  timerText: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  exerciseName: {
    fontSize: 30,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  setsContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  setsText: {
    fontSize: 38,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  setsLabel: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  metadataRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  metadataBadge: {
    backgroundColor: COLORS.backgroundCard,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
  },
  metadataText: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  actionsContainer: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  mainButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.large,
    ...SHADOWS.card,
  },
  doneButton: {
    width: 150,
    paddingVertical: SPACING.md,
    alignSelf: 'center',
    marginBottom: SPACING.xl,
  },
  doneButtonText: {
    color: COLORS.textButton,
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
  },
  navButton: {
    width: 100,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.card,
  },
  navButtonDisabled: {
    backgroundColor: COLORS.backgroundCard,
    borderColor: COLORS.borderLight,
    opacity: 0.5,
  },
  navButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.regular,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
  },
  navButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.large,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: SPACING.xxl,
  },
});

