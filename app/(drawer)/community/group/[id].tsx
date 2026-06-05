import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import BackgroundGradient from '../../../../components/BackgroundGradient';
import { TrainerScreenHeader } from '../../../../components/trainers/TrainerScreenHeader';
import { COLORS, SPACING, TYPOGRAPHY } from '../../../../constants/theme';
import { getGroupById } from '../../../../services/communityApi';
import type { FitnessGroup } from '../../../../types/trainer';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [group, setGroup] = useState<FitnessGroup | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      (async () => {
        setLoading(true);
        try {
          setGroup(await getGroupById(String(id)));
        } finally {
          setLoading(false);
        }
      })();
    }, [id]),
  );

  if (loading || !group) {
    return (
      <BackgroundGradient>
        <SafeAreaView style={styles.safe}>
          <ActivityIndicator color={COLORS.primary} />
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <TrainerScreenHeader title={group.name} />
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
  safe: { flex: 1, paddingHorizontal: SPACING.md },
  scroll: { paddingBottom: SPACING.xl },
  body: { fontSize: TYPOGRAPHY.fontSize.regular, color: COLORS.textSecondary, lineHeight: 22 },
  meta: { marginTop: SPACING.md, color: COLORS.primary },
});
