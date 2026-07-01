import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../constants/theme';
import { usePremiumGate } from '../../hooks/usePremiumGate';
import {
  canUseExerciseAiTeaser,
  generateSingleExerciseAiSession,
  markExerciseAiTeaserUsed,
} from '../../lib/exerciseWorkouts/aiSession';
import {
  findSimilarCatalogExercises,
  loadCatalogExercises,
} from '../../lib/exerciseWorkouts/catalog';
import { findFormCoachMatch } from '../../lib/exerciseWorkouts/formCoachLink';
import { buildFitScreenFromCatalog, buildFitScreenSession } from '../../lib/exerciseWorkouts/fitScreen';
import {
  fetchExerciseHistory,
  formatHistoryDate,
} from '../../lib/exerciseWorkouts/history';
import { setPendingWorkoutPreselect } from '../../lib/exerciseWorkouts/preselect';
import { WORKOUT_PRESETS } from '../../lib/exerciseWorkouts/presets';
import { getExerciseRecoveryHint } from '../../lib/exerciseWorkouts/recoveryHint';
import {
  buildTemplateName,
  deleteWorkoutTemplate,
  listWorkoutTemplates,
  saveWorkoutTemplate,
} from '../../lib/exerciseWorkouts/templates';
import type {
  CatalogExercise,
  ExerciseWorkoutContext,
  SavedWorkoutTemplate,
  WorkoutPresetId,
} from '../../lib/exerciseWorkouts/types';
import { getUserId } from '../../services/aiChatApi';
import { useAuthContext } from '../../app/AuthProvider';

type Props = {
  context: ExerciseWorkoutContext;
};

export function ExerciseWorkoutsTab({ context }: Props) {
  const router = useRouter();
  const authContext = useAuthContext() as { user?: { _id?: string; userId?: string } };
  const user = authContext?.user ?? null;
  const userId = getUserId(user);
  const { isPremium, requirePremium: requireWorkoutHistory } =
    usePremiumGate('Workout history');

  const requireSavedTemplates = usePremiumGate('Saved workout templates').requirePremium;

  const [selectedPreset, setSelectedPreset] = useState<WorkoutPresetId>('standard');
  const [companions, setCompanions] = useState<CatalogExercise[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sessionCount, setSessionCount] = useState(0);
  const [lastSessionLabel, setLastSessionLabel] = useState<string | null>(null);
  const [bestWeight, setBestWeight] = useState(0);
  const [bestReps, setBestReps] = useState(0);
  const [recentSessions, setRecentSessions] = useState<
    { id: string; label: string; detail: string }[]
  >([]);
  const [recoveryHint, setRecoveryHint] = useState<string | null>(null);
  const [templates, setTemplates] = useState<SavedWorkoutTemplate[]>([]);
  const [aiPlan, setAiPlan] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTeaserAvailable, setAiTeaserAvailable] = useState(true);
  const [catalogReady, setCatalogReady] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState('');

  const formCoachMatch = useMemo(
    () => findFormCoachMatch(context.name),
    [context.name],
  );

  const loadData = useCallback(async () => {
    const catalog = await loadCatalogExercises();
    setCompanions(findSimilarCatalogExercises(context, catalog, 2));
    setCatalogReady(true);

    if (userId && isPremium) {
      const stats = await fetchExerciseHistory(userId, context.name);
      setSessionCount(stats.sessionCount);
      setBestWeight(stats.bestWeight);
      setBestReps(stats.bestReps);
      setLastSessionLabel(
        stats.lastSession
          ? formatHistoryDate(
              stats.lastSession.timeStamp || stats.lastSession.createdAt || '',
            )
          : null,
      );
      setRecentSessions(
        stats.sessions.slice(0, 5).map((session, index) => ({
          id: `${session.timeStamp || session.createdAt || 'session'}-${index}`,
          label: formatHistoryDate(session.timeStamp || session.createdAt || ''),
          detail: `${session.sets ?? 0} × ${session.reps ?? 0}${session.weight ? ` @ ${session.weight}kg` : ''}`,
        })),
      );

      const saved = await listWorkoutTemplates(userId);
      setTemplates(
        saved.filter((t) => t.anchorExerciseId === context.id).slice(0, 5),
      );
    } else if (userId) {
      setSessionCount(0);
      setBestWeight(0);
      setBestReps(0);
      setLastSessionLabel(null);
      setRecentSessions([]);
      setTemplates([]);
    } else {
      setSessionCount(0);
      setRecentSessions([]);
      setTemplates([]);
    }

    if (userId) {
      const teaserOk = await canUseExerciseAiTeaser(
        userId,
        context.id,
        isPremium,
      );
      setAiTeaserAvailable(teaserOk);
    }

    const hint = await getExerciseRecoveryHint(user);
    setRecoveryHint(hint?.message ?? null);
    setHistoryLoading(false);
  }, [context, userId, isPremium, user]);

  useEffect(() => {
    setHistoryLoading(true);
    void loadData();
  }, [loadData]);

  const startSession = useCallback(
    (presetId: WorkoutPresetId, extraCompanions?: CatalogExercise[]) => {
      const session = buildFitScreenSession(
        context,
        extraCompanions ?? companions,
        presetId,
      );
      router.push({
        pathname: '/FitScreen',
        params: { exercises: JSON.stringify(session) },
      } as never);
    },
    [companions, context, router],
  );

  const handleQuickStart = () => {
    startSession(selectedPreset);
  };

  const handleAddToWorkout = async () => {
    await setPendingWorkoutPreselect(context.id);
    router.push('/(drawer)/(tabs)/exercises' as never);
    Toast.show({
      type: 'success',
      text1: 'Added to builder',
      text2: 'Select more exercises or start your workout from the Exercises tab.',
      position: 'bottom',
    });
  };

  const handleSaveTemplate = () => {
    if (!requireSavedTemplates()) return;
    if (!userId) {
      Toast.show({
        type: 'error',
        text1: 'Sign in required',
        text2: 'Log in to save workout templates.',
        position: 'bottom',
      });
      return;
    }

    setTemplateNameInput(buildTemplateName(context.name, selectedPreset));
    setShowSaveModal(true);
  };

  const confirmSaveTemplate = async () => {
    if (!userId) return;
    const templateName =
      templateNameInput.trim() ||
      buildTemplateName(context.name, selectedPreset);
    const exerciseIds = [context.id, ...companions.map((c) => c.id)];
    const exerciseNames = [context.name, ...companions.map((c) => c.name)];
    const saved = await saveWorkoutTemplate(userId, {
      name: templateName,
      anchorExerciseId: context.id,
      anchorExerciseName: context.name,
      exerciseIds,
      exerciseNames,
      presetId: selectedPreset,
    });
    setTemplates((prev) => [saved, ...prev].slice(0, 5));
    setShowSaveModal(false);
    Toast.show({
      type: 'success',
      text1: 'Template saved',
      position: 'bottom',
    });
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (!userId) return;
    Alert.alert('Delete template', 'Remove this saved template?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteWorkoutTemplate(userId, templateId);
          setTemplates((prev) => prev.filter((t) => t.id !== templateId));
        },
      },
    ]);
  };

  const handleStartTemplate = async (template: SavedWorkoutTemplate) => {
    const catalog = await loadCatalogExercises();
    const byId = new Map(catalog.map((ex) => [ex.id, ex]));
    const ordered = template.exerciseIds
      .map((id) => byId.get(id))
      .filter((ex): ex is CatalogExercise => ex != null);

    if (ordered.length === 0) {
      startSession(template.presetId);
      return;
    }

    const session = buildFitScreenFromCatalog(ordered, template.presetId);
    router.push({
      pathname: '/FitScreen',
      params: { exercises: JSON.stringify(session) },
    } as never);
  };

  const handleGenerateAi = async () => {
    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'Sign in required',
        text2: 'Log in to generate an AI session for this exercise.',
        position: 'bottom',
      });
      return;
    }

    if (!userId) return;

    if (!isPremium && !aiTeaserAvailable) {
      Toast.show({
        type: 'info',
        text1: 'Free teaser used',
        text2: 'You get one AI session per exercise per day. Upgrade for unlimited AI coaching.',
        position: 'bottom',
      });
      router.push('/subscription' as never);
      return;
    }

    setAiLoading(true);
    try {
      const plan = await generateSingleExerciseAiSession(context);
      setAiPlan(plan);
      if (!isPremium) {
        await markExerciseAiTeaserUsed(userId, context.id);
        setAiTeaserAvailable(false);
      }
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Could not generate session',
        text2: 'Please try again in a moment.',
        position: 'bottom',
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {recoveryHint ? (
        <View style={styles.hintCard}>
          <Ionicons name='pulse-outline' size={18} color={COLORS.primary} />
          <Text style={styles.hintText}>{recoveryHint}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick start</Text>
        <Text style={styles.sectionSubtitle}>
          Start a session with this exercise
          {companions.length > 0
            ? ` plus ${companions.length} similar move${companions.length > 1 ? 's' : ''}`
            : ''}
          .
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={handleQuickStart}>
          <Feather name='play' size={18} color={COLORS.textButton} />
          <Text style={styles.primaryButtonText}>Start session</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleAddToWorkout}>
          <Feather name='plus-circle' size={18} color={COLORS.primary} />
          <Text style={styles.secondaryButtonText}>Add to workout builder</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Presets</Text>
        <View style={styles.presetRow}>
          {WORKOUT_PRESETS.map((preset) => {
            const active = selectedPreset === preset.id;
            return (
              <TouchableOpacity
                key={preset.id}
                style={[styles.presetCard, active && styles.presetCardActive]}
                onPress={() => setSelectedPreset(preset.id)}
              >
                <Text
                  style={[styles.presetLabel, active && styles.presetLabelActive]}
                >
                  {preset.label}
                </Text>
                <Text style={styles.presetDescription}>{preset.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {companions.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggested circuit</Text>
          <Text style={styles.sectionSubtitle}>
            Complementary moves based on muscle group and type.
          </Text>
          {companions.map((exercise) => (
            <View key={exercise.id} style={styles.listRow}>
              <Text style={styles.listRowTitle}>{exercise.name}</Text>
              <Text style={styles.listRowMeta}>{exercise.target}</Text>
            </View>
          ))}
        </View>
      ) : !catalogReady ? (
        <ActivityIndicator color={COLORS.primary} style={styles.inlineLoader} />
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>AI session</Text>
          {!isPremium ? (
            <Text style={styles.teaserBadge}>Free teaser</Text>
          ) : null}
        </View>
        <Text style={styles.sectionSubtitle}>
          A plan built only for {context.name}
          {!isPremium ? ' · 1 free per exercise per day' : ''}.
        </Text>
        <TouchableOpacity
          style={[styles.secondaryButton, aiLoading && styles.buttonDisabled]}
          onPress={handleGenerateAi}
          disabled={aiLoading}
        >
          {aiLoading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <>
              <Feather name='zap' size={18} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>Generate session plan</Text>
            </>
          )}
        </TouchableOpacity>
        {aiPlan ? (
          <View style={styles.aiPlanCard}>
            <Text style={styles.aiPlanText}>{aiPlan}</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => startSession(selectedPreset)}
            >
              <Feather name='play' size={18} color={COLORS.textButton} />
              <Text style={styles.primaryButtonText}>Start recommended session</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Saved templates</Text>
          <View style={styles.premiumPill}>
            <Text style={styles.premiumPillText}>Premium</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleSaveTemplate}>
          <Feather name='bookmark' size={18} color={COLORS.primary} />
          <Text style={styles.secondaryButtonText}>Save current setup</Text>
        </TouchableOpacity>
        {templates.length === 0 ? (
          <Text style={styles.emptyText}>
            Save presets and circuit pairings to reuse later.
          </Text>
        ) : (
          templates.map((template) => (
            <View key={template.id} style={styles.templateRow}>
              <TouchableOpacity
                style={styles.templateMain}
                onPress={() => handleStartTemplate(template)}
              >
                <Text style={styles.listRowTitle}>{template.name}</Text>
                <Text style={styles.listRowMeta}>
                  {template.exerciseNames.join(' · ')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteTemplate(template.id)}
                hitSlop={8}
              >
                <Feather name='trash-2' size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {formCoachMatch ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Form check</Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(drawer)/formCoach' as never)}
          >
            <Feather name='video' size={18} color={COLORS.primary} />
            <Text style={styles.secondaryButtonText}>
              Check form · {formCoachMatch.name}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Your history</Text>
          <View style={styles.premiumPill}>
            <Text style={styles.premiumPillText}>Premium</Text>
          </View>
        </View>
        {historyLoading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : !userId ? (
          <Text style={styles.emptyText}>Sign in to see your exercise history.</Text>
        ) : !isPremium ? (
          <>
            <Text style={styles.emptyText}>
              Upgrade to Premium to view session stats and logs for this exercise.
            </Text>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => requireWorkoutHistory()}
            >
              <Feather name='unlock' size={18} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>Unlock workout history</Text>
            </TouchableOpacity>
          </>
        ) : sessionCount === 0 ? (
          <Text style={styles.emptyText}>
            No logged sessions yet. Use Track Your Sets on the Details tab or finish a
            FitScreen workout.
          </Text>
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{sessionCount}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{bestWeight > 0 ? `${bestWeight}kg` : '—'}</Text>
                <Text style={styles.statLabel}>Best weight</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{bestReps > 0 ? bestReps : '—'}</Text>
                <Text style={styles.statLabel}>Best reps</Text>
              </View>
            </View>
            {lastSessionLabel ? (
              <Text style={styles.lastSessionText}>Last session · {lastSessionLabel}</Text>
            ) : null}
            {recentSessions.map((session) => (
              <View key={session.id} style={styles.listRow}>
                <Text style={styles.listRowTitle}>{session.label}</Text>
                <Text style={styles.listRowMeta}>{session.detail}</Text>
              </View>
            ))}
          </>
        )}
      </View>

      <Modal
        visible={showSaveModal}
        transparent
        animationType='fade'
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Save template</Text>
            <Text style={styles.modalSubtitle}>Name this workout template</Text>
            <TextInput
              style={styles.modalInput}
              value={templateNameInput}
              onChangeText={setTemplateNameInput}
              placeholder='Template name'
              placeholderTextColor={COLORS.textSecondary}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowSaveModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={() => void confirmSaveTemplate()}
              >
                <Text style={styles.modalConfirmText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.lg,
  },
  section: {
    gap: SPACING.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  hintText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.regular,
    lineHeight: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.large,
    paddingVertical: SPACING.md,
    marginTop: SPACING.xs,
  },
  primaryButtonText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.large,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundCard,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  presetRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  presetCard: {
    flex: 1,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'transparent',
    ...SHADOWS.card,
  },
  presetCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}12`,
  },
  presetLabel: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.regular,
    marginBottom: 4,
  },
  presetLabelActive: {
    color: COLORS.primary,
  },
  presetDescription: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
  },
  listRow: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  listRowTitle: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  listRowMeta: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    marginTop: 2,
  },
  aiPlanCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    gap: SPACING.md,
    ...SHADOWS.card,
  },
  aiPlanText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.regular,
    lineHeight: 22,
  },
  teaserBadge: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  premiumPill: {
    backgroundColor: `${COLORS.primary}18`,
    borderRadius: BORDER_RADIUS.large,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  premiumPillText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  templateMain: {
    flex: 1,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
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
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    marginTop: 2,
    textAlign: 'center',
  },
  lastSessionText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
    lineHeight: 20,
  },
  inlineLoader: {
    marginVertical: SPACING.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.backgroundAlt,
    borderRadius: BORDER_RADIUS.medium,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  modalCancel: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  modalCancelText: {
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  modalConfirm: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.medium,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  modalConfirmText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
});
