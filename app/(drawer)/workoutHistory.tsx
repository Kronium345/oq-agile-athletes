import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import api from '../../api/axios';
import BackgroundGradient from '../../components/BackgroundGradient';
import BlobBackground from '../../components/BlobBackground';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../constants/theme';
import { useAuthContext } from '../AuthProvider';
import { usePremium } from '../PremiumProvider';

interface ExerciseHistoryItem {
  exerciseId: string;
  exerciseName: string;
  duration: number;
  calories: number;
  sets: number;
  reps: number;
  weight: number;
  timeStamp: string;
  createdAt: string;
  notes?: string;
}

export default function WorkoutHistory() {
  const router = useRouter();
  const authContext = useAuthContext() as any;
  const user = authContext?.user || null;
  const { isPremium, isLoading: isPremiumLoading } = usePremium();
  const [history, setHistory] = useState<ExerciseHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPremiumLoading) return;
    if (user) {
      fetchWorkoutHistory();
    }
  }, [user, isPremium, isPremiumLoading]);

  const fetchWorkoutHistory = async () => {
    if (isPremiumLoading) return;

    if (!isPremium) {
      setLoading(false);
      Toast.show({
        type: 'info',
        text1: 'Premium feature',
        text2: 'Upgrade to Premium to view your workout history.',
        position: 'bottom',
      });
      router.replace('/subscription' as any);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userId = (user as any)?._id || (user as any)?.userId || '';

      console.log('📊 Fetching workout history for user:', userId);

      const response = await api.get(`/history/history?userId=${userId}`);

      if ((response as any).success && Array.isArray((response as any).data)) {
        // Sort by most recent first
        const sortedHistory = (response as any).data.sort(
          (a: ExerciseHistoryItem, b: ExerciseHistoryItem) => {
            return (
              new Date(b.timeStamp).getTime() - new Date(a.timeStamp).getTime()
            );
          },
        );
        setHistory(sortedHistory);
      } else {
        setHistory([]);
      }
    } catch (error: any) {
      console.error('Error fetching workout history:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load workout history',
        position: 'bottom',
      });
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const renderHistoryItem = ({ item }: { item: ExerciseHistoryItem }) => {
    return (
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <TouchableOpacity style={styles.historyCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name='barbell' size={20} color={COLORS.primary} />
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{item.exerciseName}</Text>
                <Text style={styles.exerciseDate}>
                  {formatDate(item.timeStamp)}
                </Text>
              </View>
            </View>
            <View style={styles.checkmarkContainer}>
              <Ionicons name='checkmark-circle' size={24} color='#4CAF50' />
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons
                name='time-outline'
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.statValue}>
                {formatDuration(item.duration)}
              </Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons
                name='flame-outline'
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.statValue}>{item.calories.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            {item.sets > 0 && (
              <View style={styles.statItem}>
                <Ionicons
                  name='repeat-outline'
                  size={16}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.statValue}>{item.sets}</Text>
                <Text style={styles.statLabel}>Sets</Text>
              </View>
            )}
            {item.reps > 0 && (
              <View style={styles.statItem}>
                <Ionicons
                  name='fitness-outline'
                  size={16}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.statValue}>{item.reps}</Text>
                <Text style={styles.statLabel}>Reps</Text>
              </View>
            )}
            {item.weight > 0 && (
              <View style={styles.statItem}>
                <Ionicons
                  name='resize-outline'
                  size={16}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.statValue}>{item.weight}kg</Text>
                <Text style={styles.statLabel}>Weight</Text>
              </View>
            )}
          </View>

          {item.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <BackgroundGradient>
      <BlobBackground variant='scale' />
      <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name='arrow-back' size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Workout History</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading workout history...</Text>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name='barbell-outline'
              size={64}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyTitle}>No Workout History</Text>
            <Text style={styles.emptyText}>
              Complete some exercises to see your workout history here
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(drawer)/(tabs)/exercises')}
            >
              <Text style={styles.emptyButtonText}>Browse Exercises</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.exerciseId || item.timeStamp}
            renderItem={renderHistoryItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Last 30 Days</Text>
                <View style={styles.summaryStats}>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryValue}>{history.length}</Text>
                    <Text style={styles.summaryLabel}>Exercises</Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryValue}>
                      {history
                        .reduce((sum, item) => sum + item.calories, 0)
                        .toFixed(0)}
                    </Text>
                    <Text style={styles.summaryLabel}>Total Calories</Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryValue}>
                      {formatDuration(
                        history.reduce((sum, item) => sum + item.duration, 0),
                      )}
                    </Text>
                    <Text style={styles.summaryLabel}>Total Time</Text>
                  </View>
                </View>
              </View>
            }
          />
        )}
      </SafeAreaView>
      <Toast />
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.card,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.large,
    ...SHADOWS.card,
  },
  emptyButtonText: {
    color: COLORS.textButton,
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  summaryContainer: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.cardLarge,
  },
  summaryTitle: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.fontSize.extraLarge,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
  },
  historyCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  exerciseDate: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
  },
  checkmarkContainer: {
    marginLeft: SPACING.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.backgroundAlt,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.small,
    minWidth: 80,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.textSecondary,
  },
  notesContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  notesLabel: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  notesText: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
});
