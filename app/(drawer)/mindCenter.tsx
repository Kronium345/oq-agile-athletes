import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import BackgroundGradient from '../../components/BackgroundGradient';
import BlobBackground from '../../components/BlobBackground';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../constants/theme';
import { usePremiumGate } from '../../hooks/usePremiumGate';
import {
  createCheckIn,
  getWellnessInsight,
  listCheckIns,
  MoodLevel,
  WellnessCheckIn,
  WellnessInsight,
} from '../../services/wellnessApi';

const MOOD_OPTIONS: { value: MoodLevel; label: string; emoji: string }[] = [
  { value: 1, label: 'Low', emoji: '😔' },
  { value: 2, label: 'Down', emoji: '😕' },
  { value: 3, label: 'Okay', emoji: '😐' },
  { value: 4, label: 'Good', emoji: '🙂' },
  { value: 5, label: 'Great', emoji: '😄' },
];

export default function MindCenterScreen() {
  const router = useRouter();
  const { isPremium, isLoading: isPremiumLoading, requirePremium } =
    usePremiumGate('Mind Center');
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [note, setNote] = useState('');
  const [checkIns, setCheckIns] = useState<WellnessCheckIn[]>([]);
  const [insight, setInsight] = useState<WellnessInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (isPremiumLoading || !isPremium) {
      if (!isPremiumLoading) setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [entries, wellnessInsight] = await Promise.all([
        listCheckIns(),
        getWellnessInsight().catch(() => null),
      ]);
      setCheckIns(entries);
      setInsight(wellnessInsight);
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not load Mind Center',
        text2: e?.message ?? 'Try again later.',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  }, [isPremium, isPremiumLoading]);

  useFocusEffect(
    useCallback(() => {
      if (isPremiumLoading) return;
      if (!requirePremium()) return;
      loadData();
    }, [loadData, requirePremium, isPremiumLoading]),
  );

  const handleSaveCheckIn = async () => {
    if (!selectedMood) {
      Toast.show({
        type: 'info',
        text1: 'Select a mood',
        text2: 'Choose how you feel today.',
        position: 'bottom',
      });
      return;
    }

    setSaving(true);
    try {
      await createCheckIn({
        mood: selectedMood,
        note: note.trim() || undefined,
      });
      setNote('');
      setSelectedMood(null);
      await loadData();
      Toast.show({
        type: 'success',
        text1: 'Check-in saved',
        text2: 'Your wellness entry was recorded.',
        position: 'bottom',
      });
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Save failed',
        text2: e?.message ?? 'Try again later.',
        position: 'bottom',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <BackgroundGradient>
      <BlobBackground variant='scale' />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name='chevron-back' size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mind Center</Text>
          <View style={styles.headerRight} />
        </View>

        {loading || isPremiumLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Daily check-in</Text>
              <Text style={styles.cardSubtitle}>
                Track how you feel. This is wellness support, not medical advice.
              </Text>

              <View style={styles.moodRow}>
                {MOOD_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.moodChip,
                      selectedMood === option.value && styles.moodChipSelected,
                    ]}
                    onPress={() => setSelectedMood(option.value)}
                  >
                    <Text style={styles.moodEmoji}>{option.emoji}</Text>
                    <Text style={styles.moodLabel}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.noteInput}
                placeholder='Optional note (stress, sleep, training...)'
                placeholderTextColor={COLORS.textSecondary}
                value={note}
                onChangeText={setNote}
                multiline
              />

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSaveCheckIn}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.textButton} />
                ) : (
                  <Text style={styles.primaryButtonText}>Save check-in</Text>
                )}
              </TouchableOpacity>
            </View>

            {insight?.summary ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Insight</Text>
                <Text style={styles.insightText}>{insight.summary}</Text>
                {insight.suggestion ? (
                  <Text style={styles.insightSuggestion}>{insight.suggestion}</Text>
                ) : null}
              </View>
            ) : null}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recent check-ins</Text>
              {checkIns.length === 0 ? (
                <Text style={styles.emptyText}>No check-ins yet.</Text>
              ) : (
                checkIns.map((entry) => {
                  const mood = MOOD_OPTIONS.find((m) => m.value === entry.mood);
                  return (
                    <View key={entry._id} style={styles.historyRow}>
                      <Text style={styles.historyEmoji}>{mood?.emoji ?? '😐'}</Text>
                      <View style={styles.historyTextWrap}>
                        <Text style={styles.historyTitle}>
                          {mood?.label ?? 'Mood'} ·{' '}
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </Text>
                        {entry.note ? (
                          <Text style={styles.historyNote}>{entry.note}</Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        )}
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
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  cardSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  moodChip: {
    width: '18%',
    minWidth: 58,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.backgroundAlt,
  },
  moodChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  moodEmoji: { fontSize: 20, marginBottom: 2 },
  moodLabel: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.textSecondary,
  },
  noteInput: {
    minHeight: 88,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.background,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.medium,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  insightText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.regular,
    marginBottom: SPACING.sm,
  },
  insightSuggestion: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  historyEmoji: { fontSize: 22, marginRight: SPACING.md },
  historyTextWrap: { flex: 1 },
  historyTitle: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  historyNote: {
    color: COLORS.textSecondary,
    marginTop: 2,
    fontSize: TYPOGRAPHY.fontSize.small,
  },
});
