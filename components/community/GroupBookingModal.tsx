import { format } from 'date-fns';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { createGroupBooking } from '../../lib/community/groupBookings';
import { parseGroupScheduleOptions } from '../../lib/community/parseGroupSchedule';
import { listAcceptedConnections } from '../../services/communityApi';
import type { FitnessGroup } from '../../types/trainer';

type Props = {
  visible: boolean;
  group: FitnessGroup;
  onClose: () => void;
  onBooked: () => void;
};

export function GroupBookingModal({
  visible,
  group,
  onClose,
  onBooked,
}: Props) {
  const insets = useSafeAreaInsets();
  const sessions = useMemo(
    () => parseGroupScheduleOptions(group.scheduleSummary),
    [group.scheduleSummary],
  );
  const [selectedSessionId, setSelectedSessionId] = useState(sessions[0]?.id);
  const [connections, setConnections] = useState<
    { userId: string; displayName: string }[]
  >([]);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ?? sessions[0];

  useEffect(() => {
    if (!visible) return;
    setSelectedSessionId(sessions[0]?.id);
    setInvitedIds(new Set());
    (async () => {
      setLoadingConnections(true);
      try {
        const rows = await listAcceptedConnections();
        setConnections(
          rows.map((row) => ({
            userId: row.user.userId,
            displayName: row.user.displayName,
          })),
        );
      } finally {
        setLoadingConnections(false);
      }
    })();
  }, [visible, sessions]);

  const toggleInvite = (userId: string) => {
    setInvitedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!selectedSession) return;
    setSubmitting(true);
    try {
      const invitedNames = connections
        .filter((row) => invitedIds.has(row.userId))
        .map((row) => row.displayName);

      await createGroupBooking({
        groupId: group.id,
        groupName: group.name,
        scheduleLabel: selectedSession.label,
        startsAt: selectedSession.startsAt,
        location: group.gymName ?? group.postcode,
        invitedUserIds: [...invitedIds],
        invitedNames,
      });

      Toast.show({
        type: 'success',
        text1: 'Session booked',
        text2: 'Reminder set for the day before. See your calendar in the drawer.',
      });
      onBooked();
      onClose();
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Could not book session',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const sheetBottomPad = Math.max(insets.bottom, SPACING.md) + SPACING.sm;

  return (
    <Modal visible={visible} transparent animationType='slide' onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: sheetBottomPad }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Book {group.name}</Text>
          <Text style={styles.subtitle}>
            Pick a session. We&apos;ll remind you the day before and 30 minutes
            before it starts.
          </Text>

          <ScrollView style={styles.scroll} keyboardShouldPersistTaps='handled'>
            <Text style={styles.sectionLabel}>Session</Text>
            {sessions.map((session) => {
              const active = session.id === selectedSession?.id;
              return (
                <TouchableOpacity
                  key={session.id}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => setSelectedSessionId(session.id)}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {session.label}
                  </Text>
                  <Text style={styles.optionMeta}>
                    {format(session.startsAt, 'EEE d MMM · HH:mm')}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <Text style={styles.sectionLabel}>Bring a connection (optional)</Text>
            {loadingConnections ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : connections.length === 0 ? (
              <Text style={styles.hint}>
                No connections yet. Accept partner requests to invite friends.
              </Text>
            ) : (
              connections.map((row) => {
                const checked = invitedIds.has(row.userId);
                return (
                  <TouchableOpacity
                    key={row.userId}
                    style={styles.inviteRow}
                    onPress={() => toggleInvite(row.userId)}
                  >
                    <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                      {checked ? <Text style={styles.checkMark}>✓</Text> : null}
                    </View>
                    <Text style={styles.inviteName}>{row.displayName}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirm}
              disabled={submitting || !selectedSession}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.textButton} size='small' />
              ) : (
                <Text style={styles.confirmText}>Confirm</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    maxHeight: '82%',
    backgroundColor: COLORS.backgroundCard,
    borderTopLeftRadius: BORDER_RADIUS.large,
    borderTopRightRadius: BORDER_RADIUS.large,
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderLight,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    marginTop: SPACING.xs,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  scroll: { maxHeight: 360 },
  sectionLabel: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  option: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  optionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  optionText: {
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  optionTextActive: { color: COLORS.primary },
  optionMeta: {
    marginTop: 4,
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
  },
  hint: {
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  checkboxOn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkMark: { color: COLORS.textButton, fontSize: 12, fontWeight: '700' },
  inviteName: { color: COLORS.textPrimary },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
  },
  cancelText: { color: COLORS.textPrimary, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  confirmBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  confirmText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});
