import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import BackgroundGradient from '../../components/BackgroundGradient';
import { TrainerScreenHeader } from '../../components/trainers/TrainerScreenHeader';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { formatBookingAmount } from '../../lib/trainers/formatters';
import { cancelBooking, listMyBookings } from '../../services/trainerBookingsApi';
import type { Booking } from '../../types/trainer';

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBookings(await listMyBookings());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleCancel = async (id: string) => {
    const ok = await cancelBooking(id);
    Toast.show({
      type: ok ? 'success' : 'error',
      text1: ok ? 'Booking cancelled' : 'Could not cancel',
    });
    if (ok) load();
  };

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TrainerScreenHeader title='My bookings' />
        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(b) => b.id}
            ListEmptyComponent={<Text style={styles.empty}>No bookings yet.</Text>}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.title}>{item.trainerName}</Text>
                <Text style={styles.meta}>
                  {new Date(item.startsAt).toLocaleString()} · {item.status}
                </Text>
                <Text style={styles.price}>
                  {formatBookingAmount(item.amountPence, item.currency)}
                </Text>
                {item.status === 'confirmed' ? (
                  <TouchableOpacity onPress={() => handleCancel(item.id)}>
                    <Text style={styles.cancel}>Cancel</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: SPACING.md },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 24 },
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  title: { fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.textPrimary },
  meta: { fontSize: TYPOGRAPHY.fontSize.small, color: COLORS.textSecondary, marginVertical: 4 },
  price: { color: COLORS.primary, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  cancel: { color: COLORS.error, marginTop: 8 },
});
