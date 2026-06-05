import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { DEFAULT_SEARCH_RADIUS_KM } from '../../lib/trainers/constants';
import { listTrainers } from '../../services/trainersApi';

type Props = {
  gymName?: string;
  postcode?: string;
};

export function GymMatchBanner({ gymName, postcode }: Props) {
  const router = useRouter();
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const trainers = await listTrainers({
          gymName: gymName || undefined,
          postcode: postcode || undefined,
          radiusKm: DEFAULT_SEARCH_RADIUS_KM,
          limit: 50,
        });
        if (!cancelled) setCount(trainers.length);
      } catch {
        if (!cancelled) setCount(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gymName, postcode]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push('/(drawer)/trainers' as any)}
      activeOpacity={0.9}
    >
      <View style={styles.iconWrap}>
        <Ionicons name='fitness' size={24} color={COLORS.primary} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Find a personal trainer</Text>
        {loading ? (
          <ActivityIndicator size='small' color={COLORS.primary} />
        ) : (
          <Text style={styles.subtitle}>
            {gymName
              ? `${count ?? 0} trainer${count === 1 ? '' : 's'} at ${gymName}`
              : `${count ?? 0} trainers near you`}
          </Text>
        )}
      </View>
      <Ionicons name='chevron-forward' size={22} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderOrange,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  body: { flex: 1 },
  title: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: { fontSize: TYPOGRAPHY.fontSize.small, color: COLORS.textSecondary },
});
