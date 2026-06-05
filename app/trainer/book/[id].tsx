import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import BackgroundGradient from '../../../components/BackgroundGradient';
import { TrainerScreenHeader } from '../../../components/trainers/TrainerScreenHeader';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import { formatBookingAmount } from '../../../lib/trainers/formatters';
import { USE_TRAINER_MOCKS } from '../../../lib/trainers/config';
import {
  confirmBookingPayment,
  createBooking,
  listTrainerAvailability,
} from '../../../services/trainerBookingsApi';
import type { BookingSlot } from '../../../types/trainer';

export default function BookTrainerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      (async () => {
        setLoading(true);
        try {
          setSlots(await listTrainerAvailability(String(id)));
        } finally {
          setLoading(false);
        }
      })();
    }, [id]),
  );

  const handleBook = async (slotId: string) => {
    if (!id) return;
    setPaying(true);
    try {
      const { booking, clientSecret } = await createBooking(String(id), slotId);
      if (USE_TRAINER_MOCKS) {
        await confirmBookingPayment(booking.id);
        Toast.show({ type: 'success', text1: 'Booking confirmed (mock)' });
        router.push('/trainer/bookings' as any);
        return;
      }
      // When @stripe/stripe-react-native is installed:
      // initPaymentSheet({ paymentIntentClientSecret: clientSecret })
      Toast.show({
        type: 'info',
        text1: 'Stripe PaymentSheet',
        text2: clientSecret ? 'Wire @stripe/stripe-react-native here' : 'Awaiting API',
      });
    } catch {
      Toast.show({ type: 'error', text1: 'Booking failed' });
    } finally {
      setPaying(false);
    }
  };

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TrainerScreenHeader title='Book session' subtitle='Stripe Connect checkout' />
        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <FlatList
            data={slots.filter((s) => s.available)}
            keyExtractor={(s) => s.id}
            ListEmptyComponent={<Text style={styles.empty}>No slots available.</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.slot}
                onPress={() => handleBook(item.id)}
                disabled={paying}
              >
                <Text style={styles.slotTime}>
                  {new Date(item.startsAt).toLocaleString()} –{' '}
                  {new Date(item.endsAt).toLocaleTimeString()}
                </Text>
                <Text style={styles.price}>{formatBookingAmount(4000)}</Text>
              </TouchableOpacity>
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
  slot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  slotTime: { color: COLORS.textPrimary, flex: 1 },
  price: { fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.primary },
});
