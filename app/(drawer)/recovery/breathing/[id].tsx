import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import BackgroundGradient from '../../../../components/BackgroundGradient';
import {
  BreathPhase,
  BreathingOrb,
} from '../../../../components/recovery/BreathingOrb';
import { TrainerScreenHeader } from '../../../../components/trainers/TrainerScreenHeader';
import { drawerScreenStyles } from '../../../../constants/drawerScreen';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../../../constants/theme';
import { useDrawerListPadding } from '../../../../hooks/useDrawerListPadding';
import {
  formatEvidenceLabel,
  formatRhythmSummary,
  getBreathingProtocol,
} from '../../../../lib/recovery/protocols';
import {
  getLocalDateKey,
  saveRecoverySession,
} from '../../../../lib/recovery/storage';
import type { RecoverySessionRecord } from '../../../../lib/recovery/types';
import { useAuthContext } from '../../../AuthProvider';

type PhaseStep = { phase: BreathPhase; seconds: number; label: string };

function buildPhaseCycle(
  protocol: NonNullable<ReturnType<typeof getBreathingProtocol>>,
): PhaseStep[] {
  const { rhythm, phaseLabels } = protocol;
  const steps: PhaseStep[] = [];
  if (rhythm.inhaleSec > 0) {
    steps.push({
      phase: 'inhale',
      seconds: rhythm.inhaleSec,
      label: phaseLabels?.inhale ?? 'Inhale',
    });
  }
  if (rhythm.inhale2Sec && rhythm.inhale2Sec > 0) {
    steps.push({
      phase: 'inhale2',
      seconds: rhythm.inhale2Sec,
      label: phaseLabels?.inhale2 ?? 'Sip',
    });
  }
  if (rhythm.holdInSec > 0) {
    steps.push({
      phase: 'holdIn',
      seconds: rhythm.holdInSec,
      label: phaseLabels?.holdIn ?? 'Hold',
    });
  }
  if (rhythm.exhaleSec > 0) {
    steps.push({
      phase: 'exhale',
      seconds: rhythm.exhaleSec,
      label: phaseLabels?.exhale ?? 'Exhale',
    });
  }
  if (rhythm.holdOutSec > 0) {
    steps.push({
      phase: 'holdOut',
      seconds: rhythm.holdOutSec,
      label: phaseLabels?.holdOut ?? 'Hold',
    });
  }
  return steps;
}

function formatClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function BreathingSessionScreen() {
  const router = useRouter();
  const listPadding = useDrawerListPadding();
  const { user } = useAuthContext();
  const { id, source } = useLocalSearchParams<{
    id: string;
    source?: string;
  }>();

  const protocol = useMemo(
    () => (id ? getBreathingProtocol(String(id)) : undefined),
    [id],
  );

  const [durationSec, setDurationSec] = useState(
    protocol?.defaultDurationSec ?? 120,
  );
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseRemaining, setPhaseRemaining] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const sessionIdRef = useRef(
    `breath_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  );
  const startedAtRef = useRef<string | null>(null);
  const savedRef = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cycle = useMemo(
    () => (protocol ? buildPhaseCycle(protocol) : []),
    [protocol],
  );

  const currentStep = cycle[phaseIndex] ?? null;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
  }, []);

  useEffect(() => {
    if (protocol) {
      setDurationSec(protocol.defaultDurationSec);
    }
  }, [protocol]);

  const clearTick = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const persistSession = useCallback(
    async (status: 'completed' | 'abandoned', duration: number) => {
      if (!user || savedRef.current) return;
      savedRef.current = true;
      const context =
        source === 'performance_hub'
          ? 'performance_hub'
          : source === 'deep_link'
            ? 'deep_link'
            : 'mind_center';
      const record: RecoverySessionRecord = {
        id: sessionIdRef.current,
        protocolId: protocol?.id ?? String(id),
        status,
        startedAt: startedAtRef.current ?? new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationSec: duration,
        plannedDurationSec: durationSec,
        context,
        date: getLocalDateKey(),
      };
      await saveRecoverySession(user, record);
    },
    [user, protocol?.id, id, source, durationSec],
  );

  const stopSession = useCallback(
    async (opts: { completed: boolean }) => {
      clearTick();
      setRunning(false);
      const duration = elapsedSec;
      if (opts.completed) {
        setFinished(true);
        await persistSession('completed', Math.max(duration, 1));
        Toast.show({
          type: 'success',
          text1: 'Session complete',
          text2: 'Nice work — recovery habit logged.',
          position: 'bottom',
        });
      } else {
        if (duration >= 10) {
          await persistSession('abandoned', duration);
        }
        router.back();
      }
    },
    [elapsedSec, persistSession, router],
  );

  const startSession = () => {
    if (!protocol || cycle.length === 0) return;
    savedRef.current = false;
    sessionIdRef.current = `breath_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    startedAtRef.current = new Date().toISOString();
    setFinished(false);
    setElapsedSec(0);
    setPhaseIndex(0);
    setPhaseRemaining(cycle[0].seconds);
    setRunning(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  useEffect(() => {
    if (!running) return;

    clearTick();
    tickRef.current = setInterval(() => {
      setElapsedSec((e) => e + 1);
      setPhaseRemaining((r) => {
        if (r > 1) return r - 1;
        void Haptics.selectionAsync().catch(() => {});
        setPhaseIndex((i) => {
          const next = cycle.length === 0 ? 0 : (i + 1) % cycle.length;
          const nextSeconds = cycle[next]?.seconds ?? 0;
          // Schedule next phase remaining after index update
          requestAnimationFrame(() => setPhaseRemaining(nextSeconds));
          return next;
        });
        return 0;
      });
    }, 1000);

    return clearTick;
  }, [running, cycle]);

  useEffect(() => {
    if (running && elapsedSec >= durationSec) {
      void stopSession({ completed: true });
    }
  }, [elapsedSec, durationSec, running, stopSession]);

  if (!protocol) {
    return (
      <BackgroundGradient>
        <SafeAreaView style={drawerScreenStyles.safe} edges={['top']}>
          <TrainerScreenHeader title='Session' avoidDrawerMenu />
          <Text style={styles.missing}>Protocol not found.</Text>
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  const remaining = Math.max(durationSec - elapsedSec, 0);

  return (
    <BackgroundGradient>
      <SafeAreaView style={drawerScreenStyles.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={[drawerScreenStyles.scrollContent, listPadding]}
          keyboardShouldPersistTaps='handled'
        >
          <TrainerScreenHeader
            title={protocol.name}
            subtitle={formatRhythmSummary(protocol)}
            avoidDrawerMenu
          />

          {!running && !finished ? (
            <>
              <Text style={styles.disclaimer}>
                Wellness support only — not medical advice. Stop anytime if you
                feel dizzy, short of breath, or more distressed.
              </Text>

              <View style={styles.whyCard}>
                <Text style={styles.whyTitle}>Why this is recommended</Text>
                <Text style={styles.whyBody}>{protocol.whyRecommended}</Text>
                <Text style={styles.evidence}>
                  {formatEvidenceLabel(protocol.evidenceStrength)}
                </Text>
              </View>

              <Text style={styles.label}>Duration</Text>
              <View style={styles.durationRow}>
                {protocol.durationOptionsSec.map((sec) => (
                  <TouchableOpacity
                    key={sec}
                    style={[
                      styles.durationChip,
                      durationSec === sec && styles.durationChipActive,
                    ]}
                    onPress={() => setDurationSec(sec)}
                  >
                    <Text
                      style={[
                        styles.durationText,
                        durationSec === sec && styles.durationTextActive,
                      ]}
                    >
                      {sec < 60 ? `${sec}s` : `${sec / 60} min`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Tips</Text>
              {protocol.coachingTips.map((tip) => (
                <Text key={tip} style={styles.tip}>
                  • {tip}
                </Text>
              ))}

              <TouchableOpacity style={styles.primaryBtn} onPress={startSession}>
                <Ionicons name='play' size={20} color={COLORS.textButton} />
                <Text style={styles.primaryBtnText}>Start session</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {running ? (
            <>
              <Text style={styles.timer}>{formatClock(remaining)}</Text>
              <BreathingOrb
                phase={currentStep?.phase ?? 'idle'}
                phaseSeconds={currentStep?.seconds ?? 0}
                label={
                  currentStep
                    ? `${currentStep.label}${phaseRemaining > 0 ? ` · ${phaseRemaining}` : ''}`
                    : 'Breathe'
                }
                reducedMotion={reducedMotion}
              />
              <Text style={styles.encouragement}>
                Follow the orb. You can pause or stop anytime.
              </Text>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => void stopSession({ completed: false })}
                >
                  <Text style={styles.secondaryBtnText}>Stop</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}

          {finished ? (
            <View style={styles.doneCard}>
              <Ionicons
                name='checkmark-circle'
                size={48}
                color={COLORS.success}
              />
              <Text style={styles.doneTitle}>Session complete</Text>
              <Text style={styles.doneBody}>
                You finished {protocol.name}. This counts toward your recovery
                habit for today — not a medical outcome.
              </Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.replace('/(drawer)/recovery' as any)}
              >
                <Text style={styles.primaryBtnText}>Back to toolkit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.textBtn}
                onPress={() => {
                  setFinished(false);
                  startSession();
                }}
              >
                <Text style={styles.textBtnLabel}>Do another</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
      <Toast />
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  missing: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  disclaimer: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  whyCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  whyTitle: {
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  whyBody: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
    lineHeight: 20,
  },
  evidence: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.textSecondary,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  durationChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.backgroundCard,
  },
  durationChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  durationText: {
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  durationTextActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  tip: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.regular,
    marginBottom: 4,
  },
  primaryBtn: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.medium,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  primaryBtnText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
  timer: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  encouragement: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  secondaryBtn: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
  },
  secondaryBtnText: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  doneCard: {
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.xl,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  doneTitle: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  doneBody: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  textBtn: { paddingVertical: SPACING.sm },
  textBtnLabel: { color: COLORS.textSecondary },
});
