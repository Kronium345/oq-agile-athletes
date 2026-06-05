import * as Linking from 'expo-linking';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import BackgroundGradient from '../../components/BackgroundGradient';
import { TrainerScreenHeader } from '../../components/trainers/TrainerScreenHeader';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { PLATFORM_COMMISSION_PERCENT } from '../../lib/trainers/constants';
import {
  getStripeConnectStatus,
  startStripeConnectOnboarding,
} from '../../services/trainerBookingsApi';
import type { StripeConnectStatus } from '../../types/trainer';

export default function StripeConnectScreen() {
  const [status, setStatus] = useState<StripeConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try {
          setStatus(await getStripeConnectStatus());
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  const handleOnboard = async () => {
    try {
      const url = await startStripeConnectOnboarding();
      await Linking.openURL(url);
    } catch {
      // toast handled when API live
    }
  };

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TrainerScreenHeader
          title='Stripe Connect'
          subtitle='Session payments & payouts'
        />
        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <View style={styles.card}>
            <Text style={styles.body}>
              Clients pay for real-world PT sessions via Stripe. Agile Athletes keeps a{' '}
              {PLATFORM_COMMISSION_PERCENT}% platform fee; the rest goes to your connected
              account. Consumer Premium stays on RevenueCat — this is separate.
            </Text>
            <Text style={styles.row}>
              Onboarded: {status?.onboarded ? 'Yes' : 'No'}
            </Text>
            <Text style={styles.row}>
              Charges enabled: {status?.chargesEnabled ? 'Yes' : 'No'}
            </Text>
            <Text style={styles.row}>
              Payouts enabled: {status?.payoutsEnabled ? 'Yes' : 'No'}
            </Text>
            <TouchableOpacity style={styles.btn} onPress={handleOnboard}>
              <Text style={styles.btnText}>
                {status?.onboarded ? 'Update Stripe account' : 'Connect with Stripe'}
              </Text>
            </TouchableOpacity>
            {status?.dashboardUrl ? (
              <TouchableOpacity onPress={() => Linking.openURL(status.dashboardUrl!)}>
                <Text style={styles.link}>Open Stripe dashboard</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: SPACING.md },
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  body: { color: COLORS.textSecondary, lineHeight: 22, marginBottom: SPACING.md },
  row: { color: COLORS.textPrimary, marginBottom: 6 },
  btn: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  btnText: { color: COLORS.textButton, fontWeight: TYPOGRAPHY.fontWeight.bold },
  link: { color: COLORS.primary, marginTop: SPACING.md, textAlign: 'center' },
});
