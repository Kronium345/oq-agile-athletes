import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundGradient from '../../components/BackgroundGradient';
import { TrainerScreenHeader } from '../../components/trainers/TrainerScreenHeader';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

export default function BecomeTrainerScreen() {
  const router = useRouter();

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <TrainerScreenHeader title='Become a trainer' />
          <Text style={styles.body}>
            List your profile on Agile Athletes. Use the same account as members — no
            separate login. Add your qualifications, gym, and specialties so local
            clients can find you.
          </Text>
          <View style={styles.bullet}>
            <Text style={styles.bulletText}>• Free basic listing (Phase 1)</Text>
            <Text style={styles.bulletText}>• Verified badge after review</Text>
            <Text style={styles.bulletText}>• Stripe Connect for paid bookings (later)</Text>
          </View>
          <TouchableOpacity
            style={styles.primary}
            onPress={() => router.push('/trainer/setup' as any)}
          >
            <Text style={styles.primaryText}>Set up trainer profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondary}
            onPress={() => router.push('/trainer/stripe-connect' as any)}
          >
            <Text style={styles.secondaryText}>Stripe Connect (payments)</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: SPACING.md },
  body: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  bullet: { marginBottom: SPACING.xl, gap: 8 },
  bulletText: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.regular },
  primary: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  primaryText: { color: COLORS.textButton, fontWeight: TYPOGRAPHY.fontWeight.bold },
  secondary: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderOrange,
  },
  secondaryText: { color: COLORS.primary, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
});
