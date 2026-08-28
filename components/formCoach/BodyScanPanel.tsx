import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
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
import {
  BodyScanRecord,
  BodyScanResult,
  BODY_SCAN_MEASUREMENT_KEYS,
  formatMeasurementSourceLabel,
  getBodyScanHealth,
  getBodyScanHistory,
  humanizeMeasurementKey,
  persistBodyScanPhoto,
  resolveSexFromProfile,
  resolveWeightKgFromProfile,
  runBodyScan,
  type BodyScanMeasurementSource,
  type BodyScanMeasurementSources,
} from '../../services/bodyScanApi';
import { useAuthContext } from '../../app/AuthProvider';

/** Stats first, then photos; analysis starts after side (skip/continue). */
type Step = 'intro' | 'stats' | 'front' | 'side' | 'analyzing' | 'results';

type StatsSnapshot = {
  heightCm: number;
  weightKg: number;
  age: number;
  sex: 'male' | 'female';
};

export type BodyScanPanelHandle = {
  refresh: () => Promise<void>;
};

const PHOTO_TIPS = [
  'Form-fitting clothes (avoid baggy hoodies)',
  'Plain background, bright even lighting',
  'Phone upright ~2–3 m away — head to feet in frame',
  'Arms slightly away from your torso',
];

function showToast(
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

function confidenceColor(confidence: string): string {
  switch (confidence.toLowerCase()) {
    case 'high':
      return COLORS.success;
    case 'medium':
      return COLORS.primary;
    case 'low':
      return COLORS.warning;
    default:
      return COLORS.textSecondary;
  }
}

function formatScanDate(iso: string): string {
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

function formatCm(value: number | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value.toFixed(1)} cm`;
}

function formatKg(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value.toFixed(1)} kg`;
}

function measurementSourceColor(source: BodyScanMeasurementSource | undefined): string {
  switch (source) {
    case 'photo':
      return COLORS.success;
    case 'blended':
      return COLORS.warning;
    case 'estimated':
      return COLORS.textSecondary;
    default:
      return COLORS.textSecondary;
  }
}

function orderedMeasurementEntries(
  measurements: Record<string, number | undefined>,
  sources: BodyScanMeasurementSources,
): Array<[string, number, BodyScanMeasurementSource | undefined]> {
  const seen = new Set<string>();
  const entries: Array<[string, number, BodyScanMeasurementSource | undefined]> =
    [];

  for (const key of BODY_SCAN_MEASUREMENT_KEYS) {
    const value = measurements[key];
    if (typeof value === 'number') {
      entries.push([key, value, sources[key]]);
      seen.add(key);
    }
  }

  for (const [key, value] of Object.entries(measurements)) {
    if (seen.has(key) || typeof value !== 'number') continue;
    entries.push([key, value, sources[key]]);
  }

  return entries;
}

function ResultsSummary({
  bodyFat,
  bmi,
  leanMass,
  fatMass,
  confidence,
  measurements,
  measurementSources,
  warnings,
  disclaimer,
  usedSideView,
}: {
  bodyFat: number | null;
  bmi: number | null;
  leanMass: number | null;
  fatMass: number | null;
  confidence: string;
  measurements: Record<string, number | undefined>;
  measurementSources: BodyScanMeasurementSources;
  warnings: string[];
  disclaimer: string;
  usedSideView: boolean;
}) {
  const measurementEntries = orderedMeasurementEntries(
    measurements,
    measurementSources,
  );

  return (
    <View style={styles.resultPanel}>
      <Text style={styles.resultLabel}>Estimated body fat</Text>
      <View style={styles.heroRow}>
        <Text style={styles.heroValue}>
          {bodyFat != null ? `${bodyFat.toFixed(1)}%` : '—'}
        </Text>
        <View
          style={[
            styles.confidenceBadge,
            { backgroundColor: confidenceColor(confidence) },
          ]}
        >
          <Text style={styles.confidenceText}>{confidence}</Text>
        </View>
      </View>

      <View style={styles.statGrid}>
        <View style={styles.statChip}>
          <Text style={styles.statValue}>
            {bmi != null ? bmi.toFixed(1) : '—'}
          </Text>
          <Text style={styles.statLabel}>BMI</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={styles.statValue}>{formatKg(leanMass)}</Text>
          <Text style={styles.statLabel}>Lean mass</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={styles.statValue}>{formatKg(fatMass)}</Text>
          <Text style={styles.statLabel}>Fat mass</Text>
        </View>
      </View>

      {measurementEntries.length > 0 ? (
        <View style={styles.measurementsSection}>
          <Text style={styles.sectionTitle}>Measurements</Text>
          <Text style={styles.measurementsLegend}>
            Photo = silhouette · Blended = photo + stats · Estimated = profile
          </Text>
          <View style={styles.measurementsGrid}>
            {measurementEntries.map(([key, value, source]) => {
              const sourceLabel = formatMeasurementSourceLabel(source);
              return (
                <View key={key} style={styles.measureChip}>
                  <Text style={styles.measureKey}>
                    {humanizeMeasurementKey(key)}
                  </Text>
                  <Text style={styles.measureValue}>{formatCm(value)}</Text>
                  {sourceLabel ? (
                    <Text
                      style={[
                        styles.measureSource,
                        { color: measurementSourceColor(source) },
                      ]}
                    >
                      {sourceLabel}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      <Text style={styles.sideHint}>
        {usedSideView
          ? 'Used front + side photos'
          : 'Front-only scan — add a side photo next time for better depth'}
      </Text>

      {warnings.length > 0 ? (
        <View style={styles.warningsBox}>
          <Text style={styles.warningsTitle}>Tips</Text>
          {warnings.map((warning) => (
            <Text key={warning} style={styles.warningLine}>
              • {warning}
            </Text>
          ))}
        </View>
      ) : null}

      {disclaimer ? (
        <Text style={styles.disclaimer}>{disclaimer}</Text>
      ) : (
        <Text style={styles.disclaimer}>
          Wellness estimate only — not a medical diagnosis.
        </Text>
      )}
    </View>
  );
}

function formatProfileStats(scan: BodyScanRecord): string | null {
  const parts: string[] = [];
  if (scan.heightCm != null) parts.push(`${Math.round(scan.heightCm)} cm`);
  if (scan.weightKg != null) parts.push(`${scan.weightKg.toFixed(1)} kg`);
  if (scan.age != null) parts.push(`age ${Math.round(scan.age)}`);
  if (scan.sex) parts.push(scan.sex);
  return parts.length > 0 ? parts.join(' · ') : null;
}

function ScanHistoryDetailModal({
  scan,
  visible,
  onClose,
}: {
  scan: BodyScanRecord | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!scan) return null;

  const profileStats = formatProfileStats(scan);

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
              <Text style={styles.modalTitle}>Body scan</Text>
              <Text style={styles.modalDate}>
                {formatScanDate(scan.createdAt)}
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
            {profileStats ? (
              <Text style={styles.modalProfileStats}>{profileStats}</Text>
            ) : null}
            <ResultsSummary
              bodyFat={scan.bodyFatPercent}
              bmi={scan.bmi}
              leanMass={scan.leanMassKg}
              fatMass={scan.fatMassKg}
              confidence={scan.confidence}
              measurements={scan.measurementsCm}
              measurementSources={scan.measurementSources ?? {}}
              warnings={scan.warnings}
              disclaimer={scan.disclaimer}
              usedSideView={scan.usedSideView}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ScanHistoryRow({
  scan,
  onPress,
}: {
  scan: BodyScanRecord;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.historyCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.historyTop}>
        <Text style={styles.historyBf}>
          {scan.bodyFatPercent != null
            ? `${scan.bodyFatPercent.toFixed(1)}% BF`
            : '—'}
        </Text>
        <View style={styles.historyRowTrailing}>
          <Text style={styles.historyDate}>{formatScanDate(scan.createdAt)}</Text>
          <Ionicons
            name='chevron-forward'
            size={18}
            color={COLORS.textSecondary}
          />
        </View>
      </View>
      <Text style={styles.historyMeta}>
        BMI {scan.bmi != null ? scan.bmi.toFixed(1) : '—'}
        {scan.measurementsCm.waist != null
          ? ` · Waist ${formatCm(scan.measurementsCm.waist)}${
              scan.measurementSources?.waist
                ? ` (${formatMeasurementSourceLabel(scan.measurementSources.waist)})`
                : ''
            }`
          : ''}
        {` · ${scan.confidence}`}
      </Text>
    </TouchableOpacity>
  );
}

export const BodyScanPanel = forwardRef<BodyScanPanelHandle>(
  function BodyScanPanel(_props, ref) {
    const router = useRouter();
    const { user } = useAuthContext();
    const userId = user?.userId ?? user?._id ?? null;

    const [step, setStep] = useState<Step>('intro');
    const [frontUri, setFrontUri] = useState<string | null>(null);
    const [sideUri, setSideUri] = useState<string | null>(null);
    const [heightCm, setHeightCm] = useState('');
    const [weightKg, setWeightKg] = useState('');
    const [age, setAge] = useState('');
    const [sex, setSex] = useState<'male' | 'female' | null>(null);
    const [scanning, setScanning] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [result, setResult] = useState<BodyScanResult | null>(null);
    const [history, setHistory] = useState<BodyScanRecord[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [serviceReady, setServiceReady] = useState<boolean | null>(null);
    const [warmingUp, setWarmingUp] = useState(false);
    const [featureDisabled, setFeatureDisabled] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [selectedHistory, setSelectedHistory] = useState<BodyScanRecord | null>(
      null,
    );

    const frontUriRef = useRef<string | null>(null);
    const sideUriRef = useRef<string | null>(null);
    const scanningRef = useRef(false);
    const statsSnapshotRef = useRef<StatsSnapshot | null>(null);

    useEffect(() => {
      frontUriRef.current = frontUri;
    }, [frontUri]);

    useEffect(() => {
      sideUriRef.current = sideUri;
    }, [sideUri]);

    useEffect(() => {
      const profile = (user ?? {}) as Record<string, unknown>;
      const prefilledSex = resolveSexFromProfile(profile);
      const prefilledWeight = resolveWeightKgFromProfile(profile);
      if (prefilledSex) setSex(prefilledSex);
      if (prefilledWeight != null) setWeightKg(String(prefilledWeight));
      const rawHeight = profile.height ?? profile.heightCm ?? profile.height_cm;
      if (typeof rawHeight === 'number' && rawHeight >= 120 && rawHeight <= 230) {
        setHeightCm(String(rawHeight));
      } else if (typeof rawHeight === 'string') {
        const parsed = Number(rawHeight);
        if (Number.isFinite(parsed) && parsed >= 120 && parsed <= 230) {
          setHeightCm(String(parsed));
        }
      }
      const rawAge = profile.age;
      if (typeof rawAge === 'number' && rawAge >= 16 && rawAge <= 90) {
        setAge(String(rawAge));
      } else if (typeof rawAge === 'string') {
        const parsed = Number(rawAge);
        if (Number.isFinite(parsed) && parsed >= 16 && parsed <= 90) {
          setAge(String(parsed));
        }
      }
    }, [user]);

    const loadHistory = useCallback(async () => {
      if (!userId) {
        setHistory([]);
        return;
      }
      setLoadingHistory(true);
      try {
        const scans = await getBodyScanHistory(12);
        setHistory(scans);
      } catch {
        setHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    }, [userId]);

    const checkService = useCallback(async () => {
      setWarmingUp(true);
      try {
        const health = await getBodyScanHealth();
        setFeatureDisabled(!health.enabled);
        setServiceReady(health.enabled && health.ready);
      } catch {
        setServiceReady(false);
      } finally {
        setWarmingUp(false);
      }
    }, []);

    useEffect(() => {
      void checkService();
      void loadHistory();
    }, [checkService, loadHistory]);

    useImperativeHandle(
      ref,
      () => ({
        refresh: async () => {
          await Promise.all([checkService(), loadHistory()]);
        },
      }),
      [checkService, loadHistory],
    );

    const ensurePermission = async (source: 'library' | 'camera') => {
      const request =
        source === 'library'
          ? ImagePicker.requestMediaLibraryPermissionsAsync
          : ImagePicker.requestCameraPermissionsAsync;
      const permission = await request();
      if (!permission.granted) {
        showToast(
          'info',
          'Permission needed',
          source === 'library'
            ? 'Allow photo library access to pick a photo.'
            : 'Allow camera access to take a photo.',
        );
        return false;
      }
      return true;
    };

    const pickPhoto = async (
      target: 'front' | 'side',
      source: 'library' | 'camera',
    ) => {
      if (!(await ensurePermission(source))) return;

      const picker =
        source === 'library'
          ? ImagePicker.launchImageLibraryAsync
          : ImagePicker.launchCameraAsync;

      const picked = await picker({
        mediaTypes: ['images'],
        quality: 0.85,
        base64: true,
        allowsEditing: false,
        // iOS: deliver JPEG/PNG instead of HEIC (no image-manipulator rebuild)
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });

      if (picked.canceled || !picked.assets?.[0]?.uri) return;
      const asset = picked.assets[0];

      try {
        const stableUri = await persistBodyScanPhoto(
          asset.uri,
          target,
          asset.base64,
        );
        if (target === 'front') {
          frontUriRef.current = stableUri;
          setFrontUri(stableUri);
          setResult(null);
          setScanError(null);
        } else {
          sideUriRef.current = stableUri;
          setSideUri(stableUri);
          setResult(null);
          setScanError(null);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Could not save photo. Try another image.';
        showToast('error', 'Photo error', message);
      }
    };

    const parseStatsInput = useCallback((): StatsSnapshot | null => {
      const h = Number(String(heightCm).trim().replace(',', '.'));
      const w = Number(String(weightKg).trim().replace(',', '.'));
      const a = Number(String(age).trim().replace(',', '.'));
      if (
        sex == null ||
        !Number.isFinite(h) ||
        h < 120 ||
        h > 230 ||
        !Number.isFinite(w) ||
        w < 30 ||
        w > 300 ||
        !Number.isFinite(a) ||
        a < 16 ||
        a > 90
      ) {
        return null;
      }
      return { heightCm: h, weightKg: w, age: Math.round(a), sex };
    }, [heightCm, weightKg, age, sex]);

    const statsValid = useMemo(() => parseStatsInput() != null, [parseStatsInput]);

    const continueToPhotos = () => {
      const snapshot = parseStatsInput();
      if (!snapshot) {
        showToast(
          'error',
          'Check your stats',
          'Height 120–230 cm, weight 30–300 kg, age 16–90, and sex are required.',
        );
        return;
      }
      statsSnapshotRef.current = snapshot;
      setScanError(null);
      setStep('front');
    };

    const submitScan = useCallback(async () => {
      if (scanningRef.current) return;

      if (!userId) {
        showToast(
          'error',
          'Sign in required',
          'Please sign in to run a body scan.',
        );
        router.push('/sign-in');
        return;
      }

      const front = frontUriRef.current ?? frontUri;
      if (!front) {
        showToast(
          'error',
          'Front photo needed',
          'Take or pick a front full-body photo.',
        );
        setScanError('Add a front photo before running the scan.');
        setStep('front');
        return;
      }
      frontUriRef.current = front;

      const snapshot = statsSnapshotRef.current ?? parseStatsInput();
      if (!snapshot) {
        showToast(
          'error',
          'Check your stats',
          'Height 120–230 cm, weight 30–300 kg, age 16–90, and sex are required.',
        );
        setScanError('Confirm your stats, then return here to run the scan.');
        setStep('stats');
        return;
      }
      statsSnapshotRef.current = snapshot;

      if (featureDisabled) {
        showToast('info', 'Unavailable', 'Body Scan is temporarily disabled.');
        return;
      }

      scanningRef.current = true;
      setScanning(true);
      setScanError(null);
      setStep('analyzing');
      setStatusMessage('Uploading photos and estimating…');
      try {
        const data = await runBodyScan({
          frontUri: front,
          sideUri: sideUriRef.current ?? sideUri ?? undefined,
          heightCm: snapshot.heightCm,
          weightKg: snapshot.weightKg,
          age: snapshot.age,
          sex: snapshot.sex,
        });
        setResult(data);
        setStep('results');
        setStatusMessage(null);
        await loadHistory();
        showToast(
          'success',
          'Scan complete',
          data.body_fat_percent != null
            ? `Estimated body fat: ${data.body_fat_percent.toFixed(1)}%`
            : 'Results ready',
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Body scan failed.';
        console.error('[BodyScan] submit failed', error);
        setStatusMessage(null);
        setScanError(message);
        setStep('side');
        showToast('error', 'Scan failed', message);
      } finally {
        scanningRef.current = false;
        setScanning(false);
      }
    }, [
      userId,
      router,
      frontUri,
      sideUri,
      parseStatsInput,
      featureDisabled,
      loadHistory,
    ]);

    const resetFlow = () => {
      scanningRef.current = false;
      setScanning(false);
      setStep('intro');
      setFrontUri(null);
      setSideUri(null);
      frontUriRef.current = null;
      sideUriRef.current = null;
      statsSnapshotRef.current = null;
      setResult(null);
      setStatusMessage(null);
      setScanError(null);
    };

    const stepIndex =
      step === 'intro'
        ? 0
        : step === 'stats'
          ? 1
          : step === 'front'
            ? 2
            : step === 'side' || step === 'analyzing'
              ? 3
              : 4;

    return (
      <View style={styles.wrap}>
        {warmingUp ? (
          <View style={styles.banner}>
            <ActivityIndicator size='small' color={COLORS.primary} />
            <Text style={styles.bannerText}>Checking Body Scan…</Text>
          </View>
        ) : featureDisabled ? (
          <View style={[styles.banner, styles.bannerWarn]}>
            <Ionicons
              name='pause-circle-outline'
              size={18}
              color={COLORS.warning}
            />
            <Text style={styles.bannerText}>
              Body Scan is temporarily unavailable.
            </Text>
          </View>
        ) : serviceReady === false ? (
          <View style={[styles.banner, styles.bannerWarn]}>
            <Ionicons
              name='cloud-offline-outline'
              size={18}
              color={COLORS.warning}
            />
            <Text style={styles.bannerText}>
              Service may be slow on first use — you can still try a scan.
            </Text>
          </View>
        ) : null}

        {scanning || statusMessage ? (
          <View style={styles.analyzingBanner}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.analyzingText}>
              {statusMessage ?? 'Running body scan…'}
            </Text>
          </View>
        ) : null}

        {step !== 'results' && step !== 'analyzing' ? (
          <View style={styles.progressRow}>
            {['Tips', 'Stats', 'Front', 'Side'].map((label, index) => (
              <View key={label} style={styles.progressItem}>
                <View
                  style={[
                    styles.progressDot,
                    index <= stepIndex && styles.progressDotActive,
                  ]}
                />
                <Text
                  style={[
                    styles.progressLabel,
                    index <= stepIndex && styles.progressLabelActive,
                  ]}
                >
                  {label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {step === 'intro' ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Before you start</Text>
            <Text style={styles.cardBody}>
              Good photos make better estimates. This is a wellness tool — not
              medical advice.
            </Text>
            {PHOTO_TIPS.map((tip) => (
              <Text key={tip} style={styles.tipLine}>
                • {tip}
              </Text>
            ))}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setStep('stats')}
              disabled={featureDisabled}
            >
              <Text style={styles.primaryBtnText}>Start scan</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {step === 'stats' ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Confirm your stats</Text>
            <Text style={styles.cardBody}>
              Prefill from your profile when available. Next you will add photos,
              then we run the scan.
            </Text>

            <Text style={styles.inputLabel}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              keyboardType='decimal-pad'
              value={heightCm}
              onChangeText={setHeightCm}
              placeholder='178'
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              keyboardType='decimal-pad'
              value={weightKg}
              onChangeText={setWeightKg}
              placeholder='75'
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={styles.inputLabel}>Age</Text>
            <TextInput
              style={styles.input}
              keyboardType='number-pad'
              value={age}
              onChangeText={setAge}
              placeholder='28'
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={styles.inputLabel}>Sex</Text>
            <View style={styles.sexRow}>
              {(['male', 'female'] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.sexChip,
                    sex === option && styles.sexChipActive,
                  ]}
                  onPress={() => setSex(option)}
                >
                  <Text
                    style={[
                      styles.sexChipText,
                      sex === option && styles.sexChipTextActive,
                    ]}
                  >
                    {option === 'male' ? 'Male' : 'Female'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, !statsValid && styles.btnDisabled]}
              disabled={!statsValid}
              onPress={continueToPhotos}
            >
              <Text style={styles.primaryBtnText}>Continue to photos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.textBtn}
              onPress={() => setStep('intro')}
            >
              <Text style={styles.textBtnLabel}>Back</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {step === 'front' ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Front photo</Text>
            <Text style={styles.cardBody}>
              Face the camera, feet together or shoulder-width, full body in
              frame.
            </Text>
            {frontUri ? (
              <Image source={{ uri: frontUri }} style={styles.preview} />
            ) : (
              <View style={styles.previewPlaceholder}>
                <Ionicons
                  name='body-outline'
                  size={40}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.previewPlaceholderText}>
                  Stand inside the frame
                </Text>
              </View>
            )}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => pickPhoto('front', 'camera')}
              >
                <Ionicons
                  name='camera-outline'
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.secondaryBtnText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => pickPhoto('front', 'library')}
              >
                <Ionicons
                  name='image-outline'
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.secondaryBtnText}>Library</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.primaryBtn, !frontUri && styles.btnDisabled]}
              disabled={!frontUri}
              onPress={() => setStep('side')}
            >
              <Text style={styles.primaryBtnText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.textBtn}
              onPress={() => setStep('stats')}
            >
              <Text style={styles.textBtnLabel}>Back to stats</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {step === 'side' ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Side photo (optional)</Text>
            <Text style={styles.cardBody}>
              90° profile improves depth and confidence. Arms slightly forward.
              Skip or continue to start the scan.
            </Text>
            {sideUri ? (
              <Image source={{ uri: sideUri }} style={styles.preview} />
            ) : (
              <View style={styles.previewPlaceholder}>
                <Ionicons
                  name='walk-outline'
                  size={40}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.previewPlaceholderText}>
                  Profile view recommended
                </Text>
              </View>
            )}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => pickPhoto('side', 'camera')}
                disabled={scanning}
              >
                <Ionicons
                  name='camera-outline'
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.secondaryBtnText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => pickPhoto('side', 'library')}
                disabled={scanning}
              >
                <Ionicons
                  name='image-outline'
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.secondaryBtnText}>Library</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.primaryBtn, scanning && styles.btnDisabled]}
              disabled={scanning || !frontUri}
              onPress={() => void submitScan()}
            >
              <Text style={styles.primaryBtnText}>
                {scanning
                  ? 'Scanning…'
                  : sideUri
                    ? 'Run body scan'
                    : 'Skip side & run scan'}
              </Text>
            </TouchableOpacity>
            {scanError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{scanError}</Text>
                <TouchableOpacity onPress={() => setStep('stats')}>
                  <Text style={styles.errorLink}>Edit stats</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <TouchableOpacity
              style={styles.textBtn}
              disabled={scanning}
              onPress={() => setStep('front')}
            >
              <Text style={styles.textBtnLabel}>Back to front photo</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {step === 'analyzing' ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Running body scan</Text>
            <Text style={styles.cardBody}>
              Uploading your photo and estimating body composition. This can
              take up to a minute.
            </Text>
            <View style={styles.analyzingInline}>
              <ActivityIndicator color={COLORS.primary} size='large' />
              <Text style={styles.analyzingInlineText}>
                {statusMessage ?? 'Analyzing…'}
              </Text>
            </View>
          </View>
        ) : null}

        {step === 'results' && result ? (
          <>
            <ResultsSummary
              bodyFat={result.body_fat_percent}
              bmi={result.bmi}
              leanMass={result.lean_mass_kg}
              fatMass={result.fat_mass_kg}
              confidence={result.confidence}
              measurements={result.measurements_cm}
              measurementSources={result.measurement_sources}
              warnings={result.warnings}
              disclaimer={result.disclaimer}
              usedSideView={result.used_side_view}
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={resetFlow}>
              <Text style={styles.primaryBtnText}>Scan again</Text>
            </TouchableOpacity>
          </>
        ) : null}

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent scans</Text>
          <Text style={styles.cardBody}>
            Track trends over time — a single scan is only an estimate.
          </Text>
          {loadingHistory ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : history.length === 0 ? (
            <Text style={styles.emptyHistory}>No scans yet.</Text>
          ) : (
            history.map((scan) => (
              <ScanHistoryRow
                key={scan.id}
                scan={scan}
                onPress={() => setSelectedHistory(scan)}
              />
            ))
          )}
        </View>

        <ScanHistoryDetailModal
          scan={selectedHistory}
          visible={selectedHistory != null}
          onClose={() => setSelectedHistory(null)}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrap: {
    gap: SPACING.md,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  bannerWarn: {
    borderWidth: 1,
    borderColor: COLORS.borderOrange,
  },
  bannerText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  analyzingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
  },
  analyzingText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.regular,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  analyzingInline: {
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.xl,
  },
  analyzingInlineText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  errorText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.small,
    lineHeight: 18,
  },
  errorLink: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.small,
    marginTop: 4,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  progressItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.borderLight,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
  },
  progressLabel: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.textSecondary,
  },
  progressLabelActive: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  cardBody: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  tipLine: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  preview: {
    width: '100%',
    height: 280,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.backgroundAlt,
    marginVertical: SPACING.sm,
  },
  previewPlaceholder: {
    width: '100%',
    height: 220,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.backgroundAlt,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginVertical: SPACING.sm,
  },
  previewPlaceholderText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.backgroundCard,
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  primaryBtn: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.medium,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
  textBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  textBtnLabel: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  inputLabel: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.medium,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: TYPOGRAPHY.fontSize.medium,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  sexRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  sexChip: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
  },
  sexChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  sexChipText: {
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  sexChipTextActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  photoSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  photoSummaryText: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
  },
  resultPanel: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  resultLabel: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  heroValue: {
    fontSize: 40,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  confidenceBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.small,
  },
  confidenceText: {
    color: COLORS.textButton,
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    textTransform: 'capitalize',
  },
  statGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  statChip: {
    flex: 1,
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  measurementsSection: {
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  measurementsLegend: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  measureChip: {
    width: '48%',
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
  },
  measureKey: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  measureValue: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  measureSource: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginTop: 4,
    textTransform: 'lowercase',
  },
  sideHint: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  warningsBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    gap: 4,
  },
  warningsTitle: {
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  warningLine: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textPrimary,
  },
  disclaimer: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginTop: SPACING.sm,
  },
  historySection: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  emptyHistory: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  historyCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.card,
  },
  historyRowTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyBf: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  historyDate: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.textSecondary,
  },
  historyMeta: {
    marginTop: 4,
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
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
  modalProfileStats: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
});
