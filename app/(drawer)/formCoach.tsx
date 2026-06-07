import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { TrainerScreenHeader } from '../../components/trainers/TrainerScreenHeader';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../constants/theme';
import {
  AnalyzeFormResponse,
  FormCoachAnalysisRecord,
  FormCoachIssue,
  analyzeFormVideo,
  getFormCoachHealth,
  getFormCoachHistory,
} from '../../services/formCoachApi';
import { useAuthContext } from '../AuthProvider';

const TIPS = [
  'Film your full body in frame (side or front angle).',
  'Use good lighting and a clear background.',
  'Keep clips short — 5 to 15 seconds works best.',
];

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

function ResultPanel({ result }: { result: AnalyzeFormResponse }) {
  const issues = result.issues ?? [];
  const jointAngles = result.joint_angles ?? {};
  const positive = result.score >= 90 && issues.length === 0;

  return (
    <View style={styles.resultPanel}>
      <Text style={styles.resultLabel}>Form score</Text>
      <Text
        style={[styles.scoreValue, { color: scoreColor(result.score) }]}
      >
        {result.score}
      </Text>
      {positive ? (
        <Text style={styles.positiveText}>
          Excellent squat form — keep it up!
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

      {Object.keys(jointAngles).length > 0 ? (
        <View style={styles.anglesSection}>
          <Text style={styles.sectionTitle}>Joint angles</Text>
          <View style={styles.anglesGrid}>
            {Object.entries(jointAngles).map(([key, value]) => (
              <View key={key} style={styles.angleChip}>
                <Text style={styles.angleKey}>{humanizeIssueKey(key)}</Text>
                <Text style={styles.angleValue}>{Math.round(value)}°</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function HistoryRow({ item }: { item: FormCoachAnalysisRecord }) {
  return (
    <View style={styles.historyRow}>
      <View style={styles.historyMeta}>
        <Text style={styles.historyExercise}>
          {humanizeIssueKey(item.exercise)}
        </Text>
        <Text style={styles.historyDate}>
          {formatAnalyzedAt(item.analyzedAt)}
        </Text>
      </View>
      <Text
        style={[styles.historyScore, { color: scoreColor(item.score) }]}
      >
        {item.score}
      </Text>
    </View>
  );
}

export default function FormCoachScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { user } = useAuthContext();
  const userId = user?.userId ?? user?._id ?? null;
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

  const checkService = useCallback(async () => {
    setWarmingUp(true);
    try {
      const health = await getFormCoachHealth();
      setServiceReady(
        health.status === 'ok' && health.exercises.includes('squat'),
      );
    } catch {
      setServiceReady(false);
    } finally {
      setWarmingUp(false);
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
  }, [checkService]);

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
    await Promise.all([checkService(), loadHistory()]);
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
    if (!(await ensureVideoPermission('library'))) return;

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: 15,
      quality: 0.8,
    });

    if (pickerResult.canceled || !pickerResult.assets?.[0]?.uri) return;
    handleVideoPicked(pickerResult.assets[0].uri, 'Video selected');
    showFormCoachToast('success', 'Video ready', 'Tap Analyze squat when ready.');
  };

  const recordVideo = async () => {
    if (!(await ensureVideoPermission('camera'))) return;

    const cameraResult = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: 15,
      quality: 0.8,
    });

    if (cameraResult.canceled || !cameraResult.assets?.[0]?.uri) return;
    handleVideoPicked(cameraResult.assets[0].uri, 'Video recorded');
    showFormCoachToast('success', 'Video ready', 'Tap Analyze squat when ready.');
  };

  const runAnalysis = async () => {
    if (!userId) {
      showFormCoachToast(
        'error',
        'Sign in required',
        'Please sign in to analyze your squat form.',
      );
      router.push('/sign-in');
      return;
    }

    if (!videoUri) {
      showFormCoachToast(
        'info',
        'No video',
        'Record or pick a squat video first.',
      );
      return;
    }

    setAnalyzing(true);
    setResult(null);
    setStatusMessage('Uploading video and analyzing your squat…');
    showFormCoachToast(
      'info',
      'Analyzing…',
      'This can take up to 2 minutes. Please wait.',
    );

    try {
      const data = await analyzeFormVideo(videoUri, 'squat');
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
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <TrainerScreenHeader
            title='AI Form Coach'
            subtitle='Squat form analysis'
            avoidDrawerMenu
          />

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

          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>Filming tips</Text>
            {TIPS.map((tip) => (
              <Text key={tip} style={styles.tipLine}>
                • {tip}
              </Text>
            ))}
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={pickVideo}>
              <Ionicons name='folder-open-outline' size={20} color={COLORS.primary} />
              <Text style={styles.secondaryBtnText}>Pick video</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={recordVideo}>
              <Ionicons name='videocam-outline' size={20} color={COLORS.primary} />
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

          <TouchableOpacity
            style={[styles.primaryBtn, analyzing && styles.primaryBtnDisabled]}
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
                <Ionicons name='analytics' size={20} color={COLORS.textButton} />
                <Text style={styles.primaryBtnText}>Analyze squat</Text>
              </>
            )}
          </TouchableOpacity>

          {result ? <ResultPanel result={result} /> : null}

          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Recent analyses</Text>
            {loadingHistory && history.length === 0 ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : historyError ? (
              <Text style={styles.historyError}>{historyError}</Text>
            ) : history.length === 0 ? (
              <Text style={styles.emptyHistory}>
                Your past squat analyses will appear here.
              </Text>
            ) : (
              history.map((item, index) => (
                <HistoryRow
                  key={item.id || `history-${index}`}
                  item={item}
                />
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxxl,
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
    textAlign: 'center',
    fontSize: 56,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.sm,
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
});
