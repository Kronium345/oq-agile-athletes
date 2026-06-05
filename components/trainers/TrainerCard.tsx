import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import {
  formatDistanceKm,
  formatRating,
  formatTrainerPrice,
} from '../../lib/trainers/formatters';
import type { TrainerListItem } from '../../types/trainer';
import { VerifiedBadge } from './VerifiedBadge';

type Props = { trainer: TrainerListItem };

export function TrainerCard({ trainer }: Props) {
  const router = useRouter();
  const distance = formatDistanceKm(trainer.distanceKm);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push(`/trainer/${trainer.id}` as any)}
      activeOpacity={0.85}
    >
      <View style={styles.avatar}>
        {trainer.avatar ? (
          <Image source={{ uri: trainer.avatar }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarLetter}>
            {trainer.displayName.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {trainer.displayName}
          </Text>
          {trainer.verified ? <VerifiedBadge compact /> : null}
        </View>
        <Text style={styles.specialty} numberOfLines={1}>
          {trainer.specialties.join(' · ')}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name='location-outline' size={14} color={COLORS.textSecondary} />
          <Text style={styles.meta} numberOfLines={1}>
            {trainer.gymName}
            {distance ? ` · ${distance}` : ''}
          </Text>
        </View>
        <View style={styles.footerRow}>
          <Text style={styles.price}>
            {formatTrainerPrice(trainer.priceFrom, trainer.priceUnit)}
          </Text>
          <Text style={styles.rating}>{formatRating(trainer)}</Text>
        </View>
      </View>
      <Ionicons name='chevron-forward' size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarImage: { width: 56, height: 56, borderRadius: 28 },
  avatarLetter: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  body: { flex: 1, marginRight: SPACING.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  specialty: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  meta: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    flex: 1,
  },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  price: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.primary,
  },
  rating: { fontSize: TYPOGRAPHY.fontSize.small, color: COLORS.textSecondary },
});
