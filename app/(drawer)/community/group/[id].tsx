import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import BackgroundGradient from '../../../../components/BackgroundGradient';
import { TrainerScreenHeader } from '../../../../components/trainers/TrainerScreenHeader';
import { drawerScreenStyles } from '../../../../constants/drawerScreen';
import { COLORS, SPACING, TYPOGRAPHY } from '../../../../constants/theme';
import { getGroupById } from '../../../../services/communityApi';
import type { FitnessGroup } from '../../../../types/trainer';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [group, setGroup] = useState<FitnessGroup | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!id) {
        setGroup(null);
        setLoading(false);
        return;
      }
      (async () => {
        setLoading(true);
        try {
          setGroup(await getGroupById(String(id)));
        } catch {
          setGroup(null);
        } finally {
          setLoading(false);
        }
      })();
    }, [id]),
  );

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
        <ScrollView contentContainerStyle={drawerScreenStyles.scrollContent}>
          <TrainerScreenHeader title={group.name} avoidDrawerMenu />
          <Text style={styles.body}>{group.description}</Text>
          {group.scheduleSummary ? (
            <Text style={styles.meta}>Schedule: {group.scheduleSummary}</Text>
          ) : null}
          {group.memberCount != null ? (
            <Text style={styles.meta}>{group.memberCount} members</Text>
          ) : null}
        </ScrollView>
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
  body: { fontSize: TYPOGRAPHY.fontSize.regular, color: COLORS.textSecondary, lineHeight: 22 },
  meta: { marginTop: SPACING.md, color: COLORS.primary },
});
