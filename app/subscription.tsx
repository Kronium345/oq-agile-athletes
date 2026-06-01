import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { PURCHASES_ERROR_CODE } from 'react-native-purchases';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import BackgroundGradient from '../components/BackgroundGradient';
import BlobBackground from '../components/BlobBackground';
import { PREMIUM_SUBSCRIPTION_BENEFITS } from '../constants/premiumCopy';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../constants/theme';
import { usePremium } from './PremiumProvider';

type PlanKey = 'monthly' | 'yearly';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { offerings, isLoading, isPremium, purchasePackage, restorePurchases } =
    usePremium();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('yearly');

  const availablePackages = useMemo(() => {
    const current = offerings?.current;
    const monthly =
      current?.monthly ??
      current?.availablePackages?.find(
        (p: any) => p.identifier === '$rc_monthly',
      ) ??
      null;
    const yearly =
      current?.annual ??
      current?.availablePackages?.find(
        (p: any) => p.identifier === '$rc_annual',
      ) ??
      null;

    return { monthly, yearly };
  }, [offerings]);

  const selectedPackage =
    selectedPlan === 'yearly'
      ? availablePackages.yearly
      : availablePackages.monthly;

  const handleBack = useCallback(() => {
    router.replace('/(drawer)/(tabs)/home' as any);
  }, [router]);

  const isPurchaseCancelled = (e: unknown): boolean => {
    const err = e as { code?: string; userCancelled?: boolean | null };
    return (
      err?.userCancelled === true ||
      err?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
    );
  };

  const handlePurchase = async () => {
    if (!selectedPackage) {
      Toast.show({
        type: 'info',
        text1: 'Plans not available yet',
        text2: 'Please try again later.',
        position: 'bottom',
      });
      return;
    }

    try {
      await purchasePackage(selectedPackage);
      Toast.show({
        type: 'success',
        text1: 'Premium unlocked',
        text2: 'Thanks for subscribing!',
        position: 'bottom',
      });
      handleBack();
    } catch (e: unknown) {
      if (isPurchaseCancelled(e)) {
        Toast.show({
          type: 'info',
          text1: 'Purchase cancelled',
          text2: 'No charge was made.',
          position: 'bottom',
        });
        return;
      }
      const msg =
        (e as { message?: string })?.message ??
        'Purchase failed. Please try again.';
      Alert.alert('Purchase failed', msg);
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchases();
      Toast.show({
        type: 'success',
        text1: 'Purchases restored',
        text2: 'Your subscription status has been updated.',
        position: 'bottom',
      });
    } catch (e: any) {
      Alert.alert('Restore failed', e?.message ?? 'Please try again.');
    }
  };

  return (
    <BackgroundGradient>
      <BlobBackground variant='scale' />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <Ionicons
              name='chevron-back'
              size={22}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Premium</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {isPremium ? 'You are Premium' : 'Upgrade to Premium'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {PREMIUM_SUBSCRIPTION_BENEFITS}
            </Text>
          </View>

          <View style={styles.planRow}>
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'yearly' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('yearly')}
              activeOpacity={0.85}
              disabled={!availablePackages.yearly}
            >
              <Text style={styles.planTitle}>Yearly</Text>
              <Text style={styles.planPrice}>
                {availablePackages.yearly?.product?.priceString ??
                  'Unavailable'}
              </Text>
              <Text style={styles.planHint}>Best value</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('monthly')}
              activeOpacity={0.85}
              disabled={!availablePackages.monthly}
            >
              <Text style={styles.planTitle}>Monthly</Text>
              <Text style={styles.planPrice}>
                {availablePackages.monthly?.product?.priceString ??
                  'Unavailable'}
              </Text>
              <Text style={styles.planHint}>Cancel anytime</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handlePurchase}
            activeOpacity={0.9}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.textButton} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isPremium ? 'Manage subscription' : 'Continue'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleRestore}
            activeOpacity={0.9}
          >
            <Text style={styles.secondaryButtonText}>Restore purchases</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Payment will be charged to your App Store / Google Play account.
            Subscriptions auto-renew unless cancelled at least 24 hours before
            the end of the current period.
          </Text>
        </ScrollView>
      </SafeAreaView>
      <Toast />
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.circle,
    backgroundColor: COLORS.backgroundCard,
    ...SHADOWS.card,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  headerRight: { width: 44 },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderOrange,
    ...SHADOWS.card,
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  cardSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
  },
  planRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
  planCard: {
    flex: 1,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  planCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  planTitle: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  planPrice: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  planHint: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.large,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.orange,
    marginBottom: SPACING.md,
  },
  primaryButtonText: {
    color: COLORS.textButton,
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  secondaryButton: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
    marginBottom: SPACING.lg,
  },
  secondaryButtonText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.regular,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  disclaimer: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    lineHeight: 16,
    textAlign: 'center',
  },
});
