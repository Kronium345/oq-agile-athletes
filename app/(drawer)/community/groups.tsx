import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import BackgroundGradient from '../../../components/BackgroundGradient';
import { GroupCard } from '../../../components/community/GroupCard';
import { TrainerScreenHeader } from '../../../components/trainers/TrainerScreenHeader';
import { COLORS, SPACING } from '../../../constants/theme';
import { listGroups } from '../../../services/communityApi';
import type { FitnessGroup } from '../../../types/trainer';

export default function GroupsScreen() {
  const [groups, setGroups] = useState<FitnessGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try {
          setGroups(await listGroups());
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TrainerScreenHeader title='Local groups' />
        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <FlatList
            data={groups}
            keyExtractor={(g) => g.id}
            renderItem={({ item }) => <GroupCard group={item} />}
            ListEmptyComponent={<Text style={styles.empty}>No groups listed yet.</Text>}
            contentContainerStyle={styles.list}
          />
        )}
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: SPACING.md },
  list: { paddingBottom: SPACING.xl },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 24 },
});
