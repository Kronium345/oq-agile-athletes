import { Ionicons } from '@expo/vector-icons';
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfMonth,
} from 'date-fns';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import BackgroundGradient from '../components/BackgroundGradient';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../constants/theme';
import { usePremiumGate } from '../hooks/usePremiumGate';
import {
  FoodScanRecord,
  getScansForDate,
  getScansForMonth,
  getScansForToday,
  getScansForWeek,
  sumScanNutrients,
} from '../services/foodApi';

function scansOnDate(scans: FoodScanRecord[], dateStr: string) {
  return scans.filter((scan) => {
    const d = format(new Date(scan.date), 'yyyy-MM-dd');
    return d === dateStr;
  });
}

export default function FoodCalendarScreen() {
  const router = useRouter();
  const { requirePremium } = usePremiumGate('Food Insights');
  const [loading, setLoading] = useState(true);
  const [monthScans, setMonthScans] = useState<FoodScanRecord[]>([]);
  const [weekCount, setWeekCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedScans, setSelectedScans] = useState<FoodScanRecord[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [monthData, weekData, todayData] = await Promise.all([
        getScansForMonth(year, month),
        getScansForWeek(),
        getScansForToday(),
      ]);
      setMonthScans(monthData.scans ?? []);
      setWeekCount(weekData.totalScans ?? 0);
      setTodayCount(todayData.totalScans ?? 0);
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not load insights',
        text2: e?.message ?? 'Try again later.',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useFocusEffect(
    useCallback(() => {
      if (!requirePremium()) return;
      loadData();
    }, [loadData, requirePremium]),
  );

  const calendarDays = useMemo(() => {
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    return eachDayOfInterval({ start, end });
  }, [today]);

  const handleDayPress = async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setSelectedDate(dateStr);
    try {
      const response = await getScansForDate(dateStr);
      const raw = response.scans;
      const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
      const fromMonth = scansOnDate(monthScans, dateStr);
      const merged = list.length > 0 ? list : fromMonth;
      setSelectedScans(merged);
      setModalVisible(true);
    } catch {
      setSelectedScans(scansOnDate(monthScans, dateStr));
      setModalVisible(true);
    }
  };

  const selectedTotals = selectedScans.reduce(
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
    <BackgroundGradient>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name='chevron-back' size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Food Insights</Text>
          <View style={styles.headerRight} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{todayCount}</Text>
                <Text style={styles.statLabel}>Today</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{weekCount}</Text>
                <Text style={styles.statLabel}>This week</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{monthScans.length}</Text>
                <Text style={styles.statLabel}>This month</Text>
              </View>
            </View>

            <Text style={styles.monthTitle}>{format(today, 'MMMM yyyy')}</Text>
            <View style={styles.calendarGrid}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <Text key={`${d}-${i}`} style={styles.dayHeader}>
                  {d}
                </Text>
              ))}
              {Array.from({
                length: startOfMonth(today).getDay(),
              }).map((_, i) => (
                <View key={`pad-${i}`} style={styles.dayCell} />
              ))}
              {calendarDays.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const count = scansOnDate(monthScans, dateStr).length;
                const isToday =
                  format(new Date(), 'yyyy-MM-dd') === dateStr;
                return (
                  <TouchableOpacity
                    key={dateStr}
                    style={styles.dayCell}
                    onPress={() => handleDayPress(day)}
                  >
                    <View
                      style={[
                        styles.dayBubble,
                        count > 0 && styles.dayBubbleActive,
                        isToday && styles.dayBubbleToday,
                      ]}
                    >
                      <Text style={styles.dayText}>{format(day, 'd')}</Text>
                      {count > 0 ? (
                        <Text style={styles.scanDot}>{count}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}

        <Modal visible={modalVisible} transparent animationType='slide'>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {selectedDate
                  ? format(new Date(selectedDate), 'EEEE, d MMM yyyy')
                  : 'Day details'}
              </Text>
              {selectedScans.length === 0 ? (
                <Text style={styles.modalEmpty}>No scans on this day.</Text>
              ) : (
                <>
                  <Text style={styles.modalTotals}>
                    {Math.round(selectedTotals.calories)} kcal · P{' '}
                    {Math.round(selectedTotals.protein)}g · C{' '}
                    {Math.round(selectedTotals.carbs)}g · F{' '}
                    {Math.round(selectedTotals.fats)}g
                  </Text>
                  {selectedScans.map((scan, idx) => (
                    <View key={scan._id ?? idx} style={styles.scanBlock}>
                      <Text style={styles.scanTime}>
                        {format(new Date(scan.date), 'HH:mm')}
                      </Text>
                      {(scan.foodItems ?? []).map((item, i) => (
                        <Text key={`${item.name}-${i}`} style={styles.scanItem}>
                          • {item.name}
                        </Text>
                      ))}
                    </View>
                  ))}
                </>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
      <Toast />
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundCard,
    ...SHADOWS.card,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  headerRight: { width: 36 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  statValue: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.small,
    marginTop: 2,
  },
  monthTitle: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayHeader: {
    width: '14.28%',
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.small,
    marginBottom: SPACING.sm,
  },
  dayCell: {
    width: '14.28%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundAlt,
  },
  dayBubbleActive: { backgroundColor: COLORS.primaryLight },
  dayBubbleToday: { borderWidth: 1, borderColor: COLORS.primary },
  dayText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.small,
  },
  scanDot: {
    position: 'absolute',
    bottom: 2,
    fontSize: 8,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.large,
    borderTopRightRadius: BORDER_RADIUS.large,
    padding: SPACING.lg,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  modalEmpty: { color: COLORS.textSecondary, marginBottom: SPACING.md },
  modalTotals: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  scanBlock: {
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  scanTime: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  scanItem: {
    color: COLORS.textSecondary,
    marginTop: 2,
    fontSize: TYPOGRAPHY.fontSize.small,
  },
  closeButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.medium,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  closeText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
});
