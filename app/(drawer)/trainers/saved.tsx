import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import BackgroundGradient from '../../../components/BackgroundGradient';
import { EmptyTrainersState } from '../../../components/trainers/EmptyTrainersState';
import { TrainerCard } from '../../../components/trainers/TrainerCard';
import { TrainerScreenHeader } from '../../../components/trainers/TrainerScreenHeader';
import { SPACING } from '../../../constants/theme';
import { COLORS } from '../../../constants/theme';
import { listSavedTrainers } from '../../../services/trainersApi';
import type { TrainerListItem } from '../../../types/trainer';

export default function SavedTrainersScreen() {
  const [trainers, setTrainers] = useState<TrainerListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try {
          setTrainers(await listSavedTrainers());
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TrainerScreenHeader title='Saved trainers' />
        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <FlatList
            data={trainers}
            keyExtractor={(t) => t.id}
            renderItem={({ item }) => <TrainerCard trainer={item} />}
            ListEmptyComponent={
              <EmptyTrainersState message='No saved trainers yet. Browse and save your favourites.' />
            }
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
});
