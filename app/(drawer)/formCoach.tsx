import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import BackgroundGradient from '../../components/BackgroundGradient';
import {
  BodyScanPanel,
  BodyScanPanelHandle,
} from '../../components/formCoach/BodyScanPanel';
import { TrainerScreenHeader } from '../../components/trainers/TrainerScreenHeader';
import { drawerScreenStyles } from '../../constants/drawerScreen';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../constants/theme';
import {
  AnalyzeFormResponse,
  FALLBACK_COACH_LAUNCH,
  FormCoachAnalysisRecord,
  FormCoachExercise,
  FormCoachIssue,
  analyzeFormVideo,
  buildExerciseNameMap,
  getFormCoachExercises,
  getFormCoachHealth,
  getFormCoachHistory,
  humanizeExerciseId,
  pickDefaultFormCoachExercise,
} from '../../services/formCoachApi';
import { usePremiumGate } from '../../hooks/usePremiumGate';
import { useAuthContext } from '../AuthProvider';

type CoachMode = 'form' | 'bodyScan';

const GENERAL_FILMING_TIPS = [
  'Use good lighting and a clear background.',
  'Keep clips short — 5 to 15 seconds works best.',
];

function resolveExerciseName(
  id: string,
  nameById: Map<string, string>,
): string {
  return nameById.get(id) ?? humanizeExerciseId(id);
}

function showFormCoachToast(
  type: 'success' | 'error' | 'info',
  text1: string,
  text2?: string,
) {
  Toast.show({
    type,
    text1,
    text2,
    position: 'top',
    visibilityTime: type === 'error' ? 5000 : 4000,
  });
}

function humanizeIssueKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function severityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'high':
      return COLORS.error;
    case 'medium':
      return COLORS.warning;
    case 'low':
      return '#ca8a04';
    default:
      return COLORS.textSecondary;
  }
}

function scoreColor(score: number): string {
  if (score >= 90) return COLORS.success;
  if (score >= 70) return COLORS.primary;
  if (score >= 50) return COLORS.warning;
  return COLORS.error;
}

function formatAnalyzedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function IssueCard({ issue }: { issue: FormCoachIssue }) {
  const color = severityColor(issue.severity);
  return (
    <View style={styles.issueCard}>
      <View style={styles.issueHeader}>
        <Text style={styles.issueTitle}>{humanizeIssueKey(issue.issue)}</Text>
        <View style={[styles.severityBadge, { backgroundColor: color }]}>
          <Text style={styles.severityText}>{issue.severity}</Text>
        </View>
      </View>
      <Text style={styles.issueFeedback}>{issue.feedback}</Text>
    </View>
  );
}

function AnalysisResultsBody({
  score,
  issues,
  joint_angles,
  exerciseName,
}: {
  score: number;
  issues: FormCoachIssue[];
  joint_angles: Record<string, number>;
  exerciseName?: string;
}) {
  const positive = score >= 90 && issues.length === 0;

  return (
    <>
      <Text style={styles.resultLabel}>Form score (out of 100)</Text>
      <View style={styles.scoreRow}>
        <Text style={[styles.scoreValue, { color: scoreColor(score) }]}>
          {score}
        </Text>
        <Text style={styles.scoreOutOf}>/100</Text>
      </View>
      {positive ? (
        <Text style={styles.positiveText}>
          Excellent {exerciseName ?? 'form'} — keep it up!
        </Text>
      ) : null}

      {issues.length > 0 ? (
        <View style={styles.issuesSection}>
          <Text style={styles.sectionTitle}>Coaching feedback</Text>
          {issues.map((item, index) => (
            <IssueCard key={`${item.issue}-${index}`} issue={item} />
          ))}
        </View>
      ) : null}

      {Object.keys(joint_angles).length > 0 ? (
        <View style={styles.anglesSection}>
          <Text style={styles.sectionTitle}>Joint angles</Text>
          <View style={styles.anglesGrid}>
            {Object.entries(joint_angles).map(([key, value]) => (
              <View key={key} style={styles.angleChip}>
                <Text style={styles.angleKey}>{humanizeIssueKey(key)}</Text>
                <Text style={styles.angleValue}>{Math.round(value)}°</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </>
  );
}

function ResultPanel({
  result,
  exerciseName,
}: {
  result: AnalyzeFormResponse;
  exerciseName?: string;
}) {
  return (
    <View style={styles.resultPanel}>
      <AnalysisResultsBody
        score={result.score}
        issues={result.issues ?? []}
        joint_angles={result.joint_angles ?? {}}
        exerciseName={exerciseName}
      />
    </View>
  );
}

function HistoryDetailModal({
  item,
  visible,
  onClose,
  exerciseName,
}: {
  item: FormCoachAnalysisRecord | null;
  visible: boolean;
  onClose: () => void;
  exerciseName?: string;
}) {
  if (!item) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType='slide'
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderText}>
              <Text style={styles.modalTitle}>
                {exerciseName ?? humanizeExerciseId(item.exercise)}
              </Text>
              <Text style={styles.modalDate}>
                {formatAnalyzedAt(item.analyzedAt)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={12}
              style={styles.modalCloseBtn}
            >
              <Ionicons name='close' size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScroll}
          >
            <AnalysisResultsBody
              score={item.score}
              issues={item.issues ?? []}
              joint_angles={item.joint_angles ?? {}}
              exerciseName={exerciseName}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function HistoryRow({
  item,
  onPress,
  exerciseName,
}: {
  item: FormCoachAnalysisRecord;
  onPress: () => void;
  exerciseName: string;
}) {
  return (
    <TouchableOpacity
      style={styles.historyRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.historyMeta}>
        <Text style={styles.historyExercise}>{exerciseName}</Text>
        <Text style={styles.historyDate}>
          {formatAnalyzedAt(item.analyzedAt)}
        </Text>
      </View>
      <View style={styles.historyScoreWrap}>
        <Text
          style={[styles.historyScore, { color: scoreColor(item.score) }]}
        >
          {item.score}
        </Text>
        <Ionicons
          name='chevron-forward'
          size={18}
          color={COLORS.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );
}

function ExercisePickerCard({
  exercise,
  selected,
  onSelect,
}: {
  exercise: FormCoachExercise;
  selected: boolean;
  onSelect: (exercise: FormCoachExercise) => void;
}) {
  const locked = !exercise.available;

  return (
    <TouchableOpacity
      style={[
        styles.exerciseCard,
        selected && !locked && styles.exerciseCardSelected,
        locked && styles.exerciseCardLocked,
      ]}
      onPress={() => onSelect(exercise)}
      activeOpacity={locked ? 1 : 0.7}
    >
      <View style={styles.exerciseCardMain}>
        <Text
          style={[styles.exerciseName, locked && styles.exerciseNameLocked]}
        >
          {exercise.name}
        </Text>
        {exercise.muscle_groups.length > 0 ? (
          <Text
            style={[
              styles.exerciseMuscles,
              locked && styles.exerciseMusclesLocked,
            ]}
          >
            {exercise.muscle_groups.join(' · ')}
          </Text>
        ) : null}
        {locked ? (
          <Text style={styles.comingSoonLabel}>Coming soon to Form Coach</Text>
        ) : null}
      </View>
      {locked ? (
        <Ionicons name='lock-closed' size={20} color={COLORS.textSecondary} />
      ) : selected ? (
        <Ionicons name='checkmark-circle' size={22} color={COLORS.primary} />
      ) : (
        <Ionicons name='ellipse-outline' size={22} color={COLORS.borderLight} />
      )}
    </TouchableOpacity>
  );
}

export default function FormCoachScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const bodyScanRef = useRef<BodyScanPanelHandle>(null);
  const { user } = useAuthContext();
  const { isLoading: isPremiumLoading, requirePremium } =
    usePremiumGate('AI Form Coach');
  const userId = user?.userId ?? user?._id ?? null;
  const [coachMode, setCoachMode] = useState<CoachMode>('form');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoLabel, setVideoLabel] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [warmingUp, setWarmingUp] = useState(false);
  const [serviceReady, setServiceReady] = useState<boolean | null>(null);
  const [result, setResult] = useState<AnalyzeFormResponse | null>(null);
  const [history, setHistory] = useState<FormCoachAnalysisRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedHistory, setSelectedHistory] =
    useState<FormCoachAnalysisRecord | null>(null);
  const [catalogExercises, setCatalogExercises] = useState<FormCoachExercise[]>(
    FALLBACK_COACH_LAUNCH,
  );
  const [exerciseNameById, setExerciseNameById] = useState(() =>
    buildExerciseNameMap(FALLBACK_COACH_LAUNCH),
  );
  const [selectedExercise, setSelectedExercise] =
    useState<FormCoachExercise | null>(
      pickDefaultFormCoachExercise(FALLBACK_COACH_LAUNCH),
    );
  const [loadingExercises, setLoadingExercises] = useState(true);

  const availableExerciseCount = useMemo(
    () => catalogExercises.filter((item) => item.available).length,
    [catalogExercises],
  );

  const canAnalyze = Boolean(
    selectedExercise?.available && videoUri && userId && !analyzing,
  );

  const handleExerciseSelect = useCallback((exercise: FormCoachExercise) => {
    if (!exercise.available) {
      showFormCoachToast(
        'info',
        'Coming soon',
        `${exercise.name} is not available for analysis yet.`,
      );
      return;
    }
    setSelectedExercise(exercise);
    setVideoUri(null);
    setVideoLabel(null);
    setResult(null);
  }, []);

  const checkService = useCallback(async () => {
    setWarmingUp(true);
    try {
      const health = await getFormCoachHealth();
      setServiceReady(
        health.status === 'ok' && (health.exercises?.length ?? 0) > 0,
      );
    } catch {
      setServiceReady(false);
    } finally {
      setWarmingUp(false);
    }
  }, []);

  const loadExercises = useCallback(async () => {
    setLoadingExercises(true);
    try {
      const { catalogExercises: catalog, nameById } =
        await getFormCoachExercises();
      setCatalogExercises(catalog);
      setExerciseNameById(nameById);
      setSelectedExercise((current) => {
        const preferredId = current?.id;
        if (preferredId) {
          const match = catalog.find(
            (item) => item.id === preferredId && item.available,
          );
          if (match) return match;
        }
        return pickDefaultFormCoachExercise(catalog);
      });
    } catch {
      setCatalogExercises(FALLBACK_COACH_LAUNCH);
      setExerciseNameById(buildExerciseNameMap(FALLBACK_COACH_LAUNCH));
      setSelectedExercise(pickDefaultFormCoachExercise(FALLBACK_COACH_LAUNCH));
    } finally {
      setLoadingExercises(false);
    }
  }, []);

  const loadHistory = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!userId) {
        setHistory([]);
        setHistoryError(null);
        return;
      }
      if (!options?.silent) {
        setLoadingHistory(true);
      }
      setHistoryError(null);
      try {
        const items = await getFormCoachHistory(20);
        setHistory(items);
      } catch (error) {
        if (!options?.silent) {
          setHistory([]);
        }
        const message =
          error instanceof Error ? error.message : 'Could not load history.';
        setHistoryError(message);
      } finally {
        if (!options?.silent) {
          setLoadingHistory(false);
        }
      }
    },
    [userId],
  );

  useEffect(() => {
    void checkService();
    void loadExercises();
  }, [checkService, loadExercises]);

  useFocusEffect(
    useCallback(() => {
      if (isPremiumLoading) return;
      requirePremium();
    }, [requirePremium, isPremiumLoading]),
  );

  useEffect(() => {
    if (userId) {
      void loadHistory();
    } else {
      setHistory([]);
      setHistoryError(null);
    }
  }, [userId, loadHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (coachMode === 'bodyScan') {
      await bodyScanRef.current?.refresh();
    } else {
      await Promise.all([checkService(), loadExercises(), loadHistory()]);
    }
    setRefreshing(false);
  };

  const ensureVideoPermission = async (source: 'library' | 'camera') => {
    const request =
      source === 'library'
        ? ImagePicker.requestMediaLibraryPermissionsAsync
        : ImagePicker.requestCameraPermissionsAsync;
    const permission = await request();
    if (!permission.granted) {
      showFormCoachToast(
        'info',
        'Permission needed',
        source === 'library'
          ? 'Allow photo library access to pick a video.'
          : 'Allow camera access to record a video.',
      );
      return false;
    }
    return true;
  };

  const handleVideoPicked = (uri: string, label: string) => {
    setVideoUri(uri);
    setVideoLabel(label);
    setResult(null);
  };

  const pickVideo = async () => {
    if (!selectedExercise?.available) {
      showFormCoachToast(
        'info',
        'Choose exercise',
        'Select an exercise that is ready to analyze.',
      );
      return;
    }
    if (!(await ensureVideoPermission('library'))) return;

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: 15,
      quality: 0.8,
    });

    if (pickerResult.canceled || !pickerResult.assets?.[0]?.uri) return;
    handleVideoPicked(pickerResult.assets[0].uri, 'Video selected');
    showFormCoachToast('success', 'Video ready', 'Tap Analyze when ready.');
  };

  const recordVideo = async () => {
    if (!selectedExercise?.available) {
      showFormCoachToast(
        'info',
        'Choose exercise',
        'Select an exercise that is ready to analyze.',
      );
      return;
    }
    if (!(await ensureVideoPermission('camera'))) return;

    const cameraResult = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: 15,
      quality: 0.8,
    });

    if (cameraResult.canceled || !cameraResult.assets?.[0]?.uri) return;
    handleVideoPicked(cameraResult.assets[0].uri, 'Video recorded');
    showFormCoachToast('success', 'Video ready', 'Tap Analyze when ready.');
  };

  const runAnalysis = async () => {
    console.log('[FormCoach] Analyze tapped', {
      userId: userId ?? null,
      exerciseId: selectedExercise?.id ?? null,
      exerciseAvailable: selectedExercise?.available ?? false,
      hasVideo: Boolean(videoUri),
    });

    if (!userId) {
      showFormCoachToast(
        'error',
        'Sign in required',
        'Please sign in to analyze your form.',
      );
      router.push('/sign-in');
      return;
    }

    if (!selectedExercise?.available) {
      showFormCoachToast(
        'info',
        'Choose exercise',
        'Select an exercise that is ready to analyze.',
      );
      return;
    }

    if (!videoUri) {
      showFormCoachToast(
        'info',
        'No video',
        'Record or pick a video first.',
      );
      return;
    }

    setAnalyzing(true);
    setResult(null);
    setStatusMessage(
      `Uploading video and analyzing ${selectedExercise.name}…`,
    );
    showFormCoachToast(
      'info',
      'Analyzing…',
      'This can take up to 2 minutes. Please wait.',
    );

    try {
      const data = await analyzeFormVideo(videoUri, selectedExercise.id);
      setResult(data);
      setStatusMessage(null);
      await loadHistory({ silent: true });
      showFormCoachToast(
        'success',
        'Analysis complete',
        `Score: ${data.score}/100`,
      );
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 320, animated: true });
      }, 100);
    } catch (error) {
      setStatusMessage(null);
      const message =
        error instanceof Error ? error.message : 'Form analysis failed.';
      showFormCoachToast('error', 'Analysis failed', message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <BackgroundGradient>
      <SafeAreaView style={drawerScreenStyles.safe} edges={['top', 'bottom']}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps='handled'
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <TrainerScreenHeader
            title='AI Form Coach'
            subtitle={
              coachMode === 'form'
                ? 'Record, analyze, and improve your form'
                : 'Estimate body fat & measurements from photos'
            }
            avoidDrawerMenu
          />

          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[
                styles.modeTab,
                coachMode === 'form' && styles.modeTabActive,
              ]}
              onPress={() => setCoachMode('form')}
            >
              <Ionicons
                name='videocam-outline'
                size={16}
                color={
                  coachMode === 'form' ? COLORS.textButton : COLORS.textSecondary
                }
              />
              <Text
                style={[
                  styles.modeTabText,
                  coachMode === 'form' && styles.modeTabTextActive,
                ]}
              >
                Form analysis
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeTab,
                coachMode === 'bodyScan' && styles.modeTabActive,
              ]}
              onPress={() => setCoachMode('bodyScan')}
            >
              <Ionicons
                name='scan-outline'
                size={16}
                color={
                  coachMode === 'bodyScan'
                    ? COLORS.textButton
                    : COLORS.textSecondary
                }
              />
              <Text
                style={[
                  styles.modeTabText,
                  coachMode === 'bodyScan' && styles.modeTabTextActive,
                ]}
              >
                Body scan
              </Text>
            </TouchableOpacity>
          </View>

          {coachMode === 'form' ? (
            <>
              {warmingUp ? (
                <View style={styles.banner}>
                  <ActivityIndicator size='small' color={COLORS.primary} />
                  <Text style={styles.bannerText}>Waking up coach…</Text>
                </View>
              ) : serviceReady === false ? (
                <View style={[styles.banner, styles.bannerWarn]}>
                  <Ionicons
                    name='cloud-offline-outline'
                    size={18}
                    color={COLORS.warning}
                  />
                  <Text style={styles.bannerText}>
                    Coach may be slow on first use. You can still try analyzing.
                  </Text>
                </View>
              ) : null}

              {analyzing || statusMessage ? (
                <View style={styles.analyzingBanner}>
                  <ActivityIndicator color={COLORS.primary} />
                  <Text style={styles.analyzingText}>
                    {statusMessage ?? 'Analyzing form…'}
                  </Text>
                </View>
              ) : null}

              <View style={styles.exerciseSection}>
                <Text style={styles.sectionTitle}>Choose exercise</Text>
                <Text style={styles.exerciseCatalogMeta}>
                  {catalogExercises.length} exercises · {availableExerciseCount}{' '}
                  ready to analyze
                </Text>
                {loadingExercises ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : (
                  catalogExercises.map((exercise, index) => {
                    const showReadyHeader =
                      exercise.available &&
                      (index === 0 ||
                        !catalogExercises[index - 1]?.available);
                    const showSoonHeader =
                      !exercise.available &&
                      (index === 0 ||
                        catalogExercises[index - 1]?.available);

                    return (
                      <React.Fragment key={exercise.id}>
                        {showReadyHeader ? (
                          <Text style={styles.exerciseGroupLabel}>
                            Ready to analyze
                          </Text>
                        ) : null}
                        {showSoonHeader ? (
                          <Text style={styles.exerciseGroupLabel}>
                            Coming soon
                          </Text>
                        ) : null}
                        <ExercisePickerCard
                          exercise={exercise}
                          selected={selectedExercise?.id === exercise.id}
                          onSelect={handleExerciseSelect}
                        />
                      </React.Fragment>
                    );
                  })
                )}
              </View>

              <View style={styles.tipsCard}>
                <Text style={styles.tipsTitle}>Filming tips</Text>
                {selectedExercise?.filming_tip ? (
                  <Text style={styles.tipLine}>
                    • {selectedExercise.filming_tip}
                  </Text>
                ) : null}
                {GENERAL_FILMING_TIPS.map((tip) => (
                  <Text key={tip} style={styles.tipLine}>
                    • {tip}
                  </Text>
                ))}
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={pickVideo}
                >
                  <Ionicons
                    name='folder-open-outline'
                    size={20}
                    color={COLORS.primary}
                  />
                  <Text style={styles.secondaryBtnText}>Pick video</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={recordVideo}
                >
                  <Ionicons
                    name='videocam-outline'
                    size={20}
                    color={COLORS.primary}
                  />
                  <Text style={styles.secondaryBtnText}>Record</Text>
                </TouchableOpacity>
              </View>

              {videoLabel ? (
                <View style={styles.videoStatus}>
                  <Ionicons
                    name='checkmark-circle'
                    size={18}
                    color={COLORS.success}
                  />
                  <Text style={styles.videoStatusText}>{videoLabel}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setVideoUri(null);
                      setVideoLabel(null);
                      setResult(null);
                    }}
                  >
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <View style={styles.selectionHint}>
                <Ionicons
                  name={
                    selectedExercise?.available
                      ? 'checkmark-circle'
                      : 'alert-circle-outline'
                  }
                  size={18}
                  color={
                    selectedExercise?.available
                      ? COLORS.primary
                      : COLORS.error
                  }
                />
                <Text style={styles.selectionHintText}>
                  {selectedExercise?.available
                    ? `Selected: ${selectedExercise.name}`
                    : availableExerciseCount > 0
                      ? 'Tap an exercise above before analyzing'
                      : 'No exercises available for analysis right now'}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  (analyzing || !canAnalyze) && styles.primaryBtnDisabled,
                ]}
                onPress={runAnalysis}
                disabled={analyzing}
              >
                {analyzing ? (
                  <>
                    <ActivityIndicator color={COLORS.textButton} />
                    <Text style={styles.primaryBtnText}>
                      Analyzing form… (up to 2 min)
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons
                      name='analytics'
                      size={20}
                      color={COLORS.textButton}
                    />
                    <Text style={styles.primaryBtnText}>Analyze</Text>
                  </>
                )}
              </TouchableOpacity>

              {result ? (
                <ResultPanel
                  result={result}
                  exerciseName={resolveExerciseName(
                    result.exercise,
                    exerciseNameById,
                  )}
                />
              ) : null}

              <View style={styles.historySection}>
                <Text style={styles.sectionTitle}>Recent analyses</Text>
                {loadingHistory && history.length === 0 ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : historyError ? (
                  <Text style={styles.historyError}>{historyError}</Text>
                ) : history.length === 0 ? (
                  <Text style={styles.emptyHistory}>
                    Your past form analyses will appear here.
                  </Text>
                ) : (
                  history.map((item, index) => (
                    <HistoryRow
                      key={item.id || `history-${index}`}
                      item={item}
                      exerciseName={resolveExerciseName(
                        item.exercise,
                        exerciseNameById,
                      )}
                      onPress={() => setSelectedHistory(item)}
                    />
                  ))
                )}
              </View>
            </>
          ) : null}

          {/* Keep mounted so photo/stats state survives tab switches */}
          <View
            style={coachMode === 'bodyScan' ? undefined : styles.hiddenMode}
            pointerEvents={coachMode === 'bodyScan' ? 'auto' : 'none'}
          >
            <BodyScanPanel ref={bodyScanRef} />
          </View>
        </ScrollView>

        <HistoryDetailModal
          item={selectedHistory}
          visible={selectedHistory != null}
          onClose={() => setSelectedHistory(null)}
          exerciseName={
            selectedHistory
              ? resolveExerciseName(
                  selectedHistory.exercise,
                  exerciseNameById,
                )
              : undefined
          }
        />
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: SPACING.xxxl,
  },
  hiddenMode: {
    display: 'none',
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    padding: 4,
    marginBottom: SPACING.lg,
    gap: 4,
    ...SHADOWS.card,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.medium,
  },
  modeTabActive: {
    backgroundColor: COLORS.primary,
  },
  modeTabText: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
  },
  modeTabTextActive: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  scoreOutOf: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textSecondary,
    marginBottom: 10,
    marginLeft: 2,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  bannerWarn: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  bannerText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.small,
  },
  analyzingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderOrange,
    ...SHADOWS.card,
  },
  analyzingText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.regular,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  exerciseSection: {
    marginBottom: SPACING.lg,
  },
  exerciseCatalogMeta: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  exerciseGroupLabel: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  exerciseCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  exerciseCardLocked: {
    opacity: 0.72,
    backgroundColor: COLORS.background,
  },
  exerciseCardMain: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  exerciseName: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  exerciseNameLocked: {
    color: COLORS.textSecondary,
  },
  exerciseMuscles: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  exerciseMusclesLocked: {
    color: COLORS.textSecondary,
  },
  comingSoonLabel: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  tipsCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  tipsTitle: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  tipLine: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.borderOrange,
    borderRadius: BORDER_RADIUS.medium,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  videoStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  videoStatusText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  clearText: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  selectionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  selectionHintText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.medium,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.orange,
  },
  primaryBtnDisabled: {
    opacity: 0.85,
  },
  primaryBtnText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
  resultPanel: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.cardLarge,
  },
  resultLabel: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
    marginBottom: SPACING.xs,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  positiveText: {
    textAlign: 'center',
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    marginBottom: SPACING.md,
  },
  issuesSection: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  issueCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  issueTitle: {
    flex: 1,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  severityBadge: {
    borderRadius: BORDER_RADIUS.small,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  severityText: {
    color: COLORS.textButton,
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textTransform: 'capitalize',
  },
  issueFeedback: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
    lineHeight: 20,
  },
  anglesSection: {
    marginTop: SPACING.md,
  },
  anglesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  angleChip: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.small,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minWidth: '45%',
  },
  angleKey: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
  },
  angleValue: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  historySection: {
    marginTop: SPACING.sm,
  },
  emptyHistory: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  historyError: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.card,
  },
  historyMeta: {
    flex: 1,
  },
  historyExercise: {
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    textTransform: 'capitalize',
  },
  historyDate: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.small,
    marginTop: 2,
  },
  historyScore: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  historyScoreWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalSheet: {
    backgroundColor: COLORS.backgroundCard,
    borderTopLeftRadius: BORDER_RADIUS.large,
    borderTopRightRadius: BORDER_RADIUS.large,
    maxHeight: '85%',
    paddingTop: SPACING.lg,
    ...SHADOWS.cardLarge,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalHeaderText: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    textTransform: 'capitalize',
  },
  modalDate: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
});
