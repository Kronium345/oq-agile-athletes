import { Ionicons } from '@expo/vector-icons';
import { format, isSameDay, parseISO } from 'date-fns';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import BackgroundGradient from '../../components/BackgroundGradient';
import FoodListItem from '../../components/FoodListItem';
import FoodThumbnail from '../../components/FoodThumbnail';
import { TrainerScreenHeader } from '../../components/trainers/TrainerScreenHeader';
import { drawerScreenStyles } from '../../constants/drawerScreen';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../constants/theme';
import { useDrawerListPadding } from '../../hooks/useDrawerListPadding';
import { usePremiumGate } from '../../hooks/usePremiumGate';
import {
  FoodLogEntry,
  getFoodLogs,
  getLastThreeDaysScans,
  LastThreeDaysScan,
  sumScanNutrients,
} from '../../services/foodApi';
import { useAuthContext } from '../AuthProvider';

function getUserId(user: any) {
  return user?._id || user?.userId || '';
}

function isTodayLog(entry: FoodLogEntry) {
  const raw = entry.createdAt || entry.date;
  if (!raw) return true;
  try {
    return isSameDay(typeof raw === 'string' ? parseISO(raw) : new Date(raw), new Date());
  } catch {
    return true;
  }
}

export default function FoodScreen() {
  const router = useRouter();
  const listPadding = useDrawerListPadding();
  const { user } = useAuthContext();
  const userId = getUserId(user);
  const { isPremium, requirePremium } = usePremiumGate('Food Tracker');
  const [loading, setLoading] = useState(true);
  const [foodLogs, setFoodLogs] = useState<FoodLogEntry[]>([]);
  const [lastThreeDays, setLastThreeDays] = useState<LastThreeDaysScan[]>([]);

  const loadData = useCallback(async () => {
    if (!isPremium || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [logs, scans] = await Promise.all([
        getFoodLogs(userId),
        getLastThreeDaysScans().catch(() => []),
      ]);
      setFoodLogs(Array.isArray(logs) ? logs : []);
      setLastThreeDays(Array.isArray(scans) ? scans : []);
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not load food tracker',
        text2: e?.message ?? 'Try again later.',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  }, [isPremium, userId]);

  useFocusEffect(
    useCallback(() => {
      if (!requirePremium()) return;
      loadData();
    }, [loadData, requirePremium]),
  );

  const todaysLogs = useMemo(
    () => foodLogs.filter(isTodayLog),
    [foodLogs],
  );

  const totalCalories = useMemo(
    () => todaysLogs.reduce((sum, item) => sum + (item.cal || 0), 0),
    [todaysLogs],
  );

  return (
    <BackgroundGradient>
      <SafeAreaView style={drawerScreenStyles.safe} edges={['top', 'left', 'right']}>
        <TrainerScreenHeader title='Food Tracker' avoidDrawerMenu />

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[
              drawerScreenStyles.scrollContent,
              listPadding,
              styles.scrollPad,
            ]}
          >
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Today&apos;s calories</Text>
              <Text style={styles.summaryValue}>{Math.round(totalCalories)}</Text>
              <Text style={styles.summaryHint}>From manually logged foods</Text>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/foodHomeScreen' as any)}
              >
                <Ionicons name='search' size={18} color={COLORS.textButton} />
                <Text style={styles.actionText}>Add Food</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButtonOutline}
                onPress={() => router.push('/foodCalendarScreen' as any)}
              >
                <Ionicons name='calendar' size={18} color={COLORS.primary} />
                <Text style={styles.actionTextOutline}>Insights</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today&apos;s food</Text>
              {todaysLogs.length === 0 ? (
                <Text style={styles.emptyText}>
                  No foods logged yet. Search or scan a meal.
                </Text>
              ) : (
                todaysLogs.map((item, index) => (
                  <FoodListItem
                    key={item._id ?? `${item.label}-${index}`}
                    item={{
                      label: item.label,
                      cal: item.cal,
                      carbohydrates: item.carbohydrates,
                      fats: item.fats,
                      proteins: item.proteins,
                      sugars: item.sugars,
                      imageUrl: item.imageUrl,
                    }}
                    userId={userId}
                  />
                ))
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Last 3 days (AI scans)</Text>
              {lastThreeDays.length === 0 ? (
                <Text style={styles.emptyText}>No scans yet.</Text>
              ) : (
                lastThreeDays.map((day) => {
                  const scanCount = day.scans?.length ?? 0;
                  const scannedItems = (day.scans ?? []).flatMap(
                    (scan) => scan.foodItems ?? [],
                  );
                  const totals = (day.scans ?? []).reduce(
                    (acc, scan) => {
                      const t = sumScanNutrients(scan.foodItems ?? []);
                      return {
                        calories: acc.calories + t.calories,
                        protein: acc.protein + t.protein,
                        carbs: acc.carbs + t.carbs,
                        fats: acc.fats + t.fats,
                      };
                    },
                    { calories: 0, protein: 0, carbs: 0, fats: 0 },
                  );
                  return (
                    <View key={day.date} style={styles.dayCard}>
                      <Text style={styles.dayTitle}>
                        {format(new Date(day.date), 'EEE, d MMM')}
                      </Text>
                      <Text style={styles.dayMeta}>
                        {scanCount} scan{scanCount === 1 ? '' : 's'} ·{' '}
                        {Math.round(totals.calories)} kcal
                      </Text>
                      <Text style={styles.dayMacros}>
                        P {Math.round(totals.protein)}g · C{' '}
                        {Math.round(totals.carbs)}g · F {Math.round(totals.fats)}g
                      </Text>
                      {scannedItems.length > 0 ? (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.dayItems}
                        >
                          {scannedItems.map((item, index) => (
                            <View
                              key={`${day.date}-${item.name}-${index}`}
                              style={styles.dayItem}
                            >
                              <FoodThumbnail uri={item.imageUrl} size={48} />
                              <Text style={styles.dayItemName} numberOfLines={2}>
                                {item.name}
                              </Text>
                            </View>
                          ))}
                        </ScrollView>
                      ) : null}
                    </View>
                  );
                })
              )}
            </View>

            <Text style={styles.citation}>
              Meal scans managed by Agile Athletes. Manual search uses the same food
              database.
            </Text>
          </ScrollView>
        )}

        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/scanScreen' as any)}
          activeOpacity={0.9}
        >
          <Ionicons name='camera' size={26} color={COLORS.textButton} />
        </TouchableOpacity>
      </SafeAreaView>
      <Toast />
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollPad: { paddingBottom: 120 },
  summaryCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  summaryValue: {
    color: COLORS.primary,
    fontSize: 40,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginVertical: SPACING.xs,
  },
  summaryHint: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.small,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.medium,
    paddingVertical: SPACING.md,
  },
  actionText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  actionButtonOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.medium,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundCard,
  },
  actionTextOutline: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  section: { marginBottom: SPACING.lg },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  dayCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  dayTitle: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  dayMeta: {
    color: COLORS.textSecondary,
    marginTop: 2,
    fontSize: TYPOGRAPHY.fontSize.small,
  },
  dayMacros: {
    color: COLORS.textSecondary,
    marginTop: 2,
    fontSize: TYPOGRAPHY.fontSize.small,
  },
  dayItems: {
    gap: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  dayItem: {
    width: 60,
    alignItems: 'center',
  },
  dayItemName: {
    marginTop: 4,
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    textAlign: 'center',
  },
  citation: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    lineHeight: 16,
    marginTop: SPACING.sm,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.xl,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
});
