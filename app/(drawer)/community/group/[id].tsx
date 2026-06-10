import { format } from 'date-fns';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundGradient from '../../../../components/BackgroundGradient';
import { GroupBookingModal } from '../../../../components/community/GroupBookingModal';
import { TrainerScreenHeader } from '../../../../components/trainers/TrainerScreenHeader';
import { drawerScreenStyles } from '../../../../constants/drawerScreen';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../../../constants/theme';
import { useDrawerListPadding } from '../../../../hooks/useDrawerListPadding';
import {
  cancelGroupBooking,
  getGroupBookingForGroup,
  type GroupBooking,
} from '../../../../lib/community/groupBookings';
import { getGroupById } from '../../../../services/communityApi';
import type { FitnessGroup } from '../../../../types/trainer';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const listPadding = useDrawerListPadding();
  const [group, setGroup] = useState<FitnessGroup | null>(null);
  const [booking, setBooking] = useState<GroupBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setGroup(null);
      setBooking(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const groupId = String(id);
      const [groupRow, activeBooking] = await Promise.all([
        getGroupById(groupId),
        getGroupBookingForGroup(groupId),
      ]);
      setGroup(groupRow);
      setBooking(activeBooking ?? null);
    } catch {
      setGroup(null);
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleCancelBooking = async () => {
    if (!booking) return;
    await cancelGroupBooking(booking.id);
    setBooking(null);
  };

  if (loading) {
    return (
      <BackgroundGradient>
        <SafeAreaView style={drawerScreenStyles.safe} edges={['top']}>
          <ActivityIndicator color={COLORS.primary} style={styles.loader} />
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  if (!group) {
    return (
      <BackgroundGradient>
        <SafeAreaView style={drawerScreenStyles.safe} edges={['top']}>
          <TrainerScreenHeader title='Group' avoidDrawerMenu />
          <Text style={styles.fallback}>
            This group could not be found. It may have been removed or is no longer
            available.
          </Text>
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient>
      <SafeAreaView style={drawerScreenStyles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={[
            drawerScreenStyles.scrollContent,
            listPadding,
          ]}
        >
          <TrainerScreenHeader title={group.name} avoidDrawerMenu />
          <Text style={styles.body}>{group.description}</Text>
          {group.scheduleSummary ? (
            <Text style={styles.meta}>Schedule: {group.scheduleSummary}</Text>
          ) : null}
          {group.distanceKm != null ? (
            <Text style={styles.meta}>{group.distanceKm} km away</Text>
          ) : null}
          {group.memberCount != null ? (
            <Text style={styles.meta}>{group.memberCount} members</Text>
          ) : null}

          {booking ? (
            <View style={styles.bookingCard}>
              <Text style={styles.bookingTitle}>You&apos;re booked</Text>
              <Text style={styles.bookingMeta}>
                {format(new Date(booking.startsAt), 'EEE d MMM · HH:mm')} —{' '}
                {booking.scheduleLabel}
              </Text>
              {booking.invitedNames.length > 0 ? (
                <Text style={styles.bookingInvite}>
                  Bringing: {booking.invitedNames.join(', ')}
                </Text>
              ) : null}
              <Text style={styles.bookingHint}>
                Reminder the day before at 9:00, plus 30 minutes before start.
                Shown on your Activity Calendar in the drawer.
              </Text>
              <TouchableOpacity
                style={styles.cancelBookingBtn}
                onPress={handleCancelBooking}
              >
                <Text style={styles.cancelBookingText}>Cancel booking</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.bookBtn}
              onPress={() => setBookingModalVisible(true)}
            >
              <Text style={styles.bookBtnText}>Book & set reminder</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <GroupBookingModal
          visible={bookingModalVisible}
          group={group}
          onClose={() => setBookingModalVisible(false)}
          onBooked={load}
        />
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: SPACING.xl },
  fallback: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  body: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  meta: { marginTop: SPACING.md, color: COLORS.primary },
  bookBtn: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.large,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  bookBtnText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
  bookingCard: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  bookingTitle: {
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
  bookingMeta: {
    marginTop: SPACING.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  bookingInvite: {
    marginTop: SPACING.sm,
    color: COLORS.textSecondary,
  },
  bookingHint: {
    marginTop: SPACING.sm,
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.small,
    lineHeight: 18,
  },
  cancelBookingBtn: {
    marginTop: SPACING.md,
    alignSelf: 'flex-start',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cancelBookingText: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
});
