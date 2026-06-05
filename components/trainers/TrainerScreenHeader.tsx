import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

type Props = { title: string; subtitle?: string };

export function TrainerScreenHeader({ title, subtitle }: Props) {
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Ionicons name='arrow-back' size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>
      <View style={styles.titles}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  back: { padding: 4 },
  titles: { flex: 1 },
  title: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  subtitle: { fontSize: TYPOGRAPHY.fontSize.small, color: COLORS.textSecondary },
});
