import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

type Props = {
  title: string;
  subtitle?: string;
  /** Clear the floating drawer menu button (drawer stack screens). */
  avoidDrawerMenu?: boolean;
  /** Hide back arrow (e.g. drawer root screens that use the menu button). */
  showBack?: boolean;
};

export function TrainerScreenHeader({
  title,
  subtitle,
  avoidDrawerMenu,
  showBack = true,
}: Props) {
  const router = useRouter();
  return (
    <View style={[styles.wrap, avoidDrawerMenu && styles.drawerWrap]}>
      {showBack ? (
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name='arrow-back' size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      ) : null}
      <View style={[styles.titles, !showBack && styles.titlesNoBack]}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    paddingTop: SPACING.xs,
    gap: SPACING.sm,
  },
  back: { padding: 4, marginTop: 2 },
  titles: { flex: 1, paddingTop: 2 },
  titlesNoBack: { paddingTop: 0 },
  title: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  subtitle: { fontSize: TYPOGRAPHY.fontSize.small, color: COLORS.textSecondary },
  drawerWrap: {
    marginTop: 4,
  },
});
