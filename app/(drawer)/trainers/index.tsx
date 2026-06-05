import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import BackgroundGradient from '../../../components/BackgroundGradient';
import { EmptyTrainersState } from '../../../components/trainers/EmptyTrainersState';
import { TrainerCard } from '../../../components/trainers/TrainerCard';
import { TrainerFilters } from '../../../components/trainers/TrainerFilters';
import { TrainerScreenHeader } from '../../../components/trainers/TrainerScreenHeader';
import { COLORS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import { DEFAULT_SEARCH_RADIUS_KM } from '../../../lib/trainers/constants';
import { listTrainers } from '../../../services/trainersApi';
import type { TrainerListItem } from '../../../types/trainer';
import { useAuthContext } from '../../AuthProvider';

export default function TrainersBrowseScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [trainers, setTrainers] = useState<TrainerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState<string | undefined>();
  const [filterMode, setFilterMode] = useState<'all' | 'gym' | 'near'>('all');

  const memberGym = (user as any)?.gymName as string | undefined;
  const memberPostcode = (user as any)?.postcode as string | undefined;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listTrainers({
        q: search || undefined,
        specialty,
        gymName: filterMode === 'gym' ? memberGym : undefined,
        postcode: filterMode === 'near' ? memberPostcode : undefined,
        radiusKm: filterMode === 'near' ? DEFAULT_SEARCH_RADIUS_KM : undefined,
      });
      setTrainers(data);
    } catch {
      setTrainers([]);
    } finally {
      setLoading(false);
    }
  }, [search, specialty, filterMode, memberGym, memberPostcode]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TrainerScreenHeader title='Find a trainer' subtitle='UK personal trainers' />
        <View style={styles.toolbar}>
          <TextInput
            style={styles.search}
            placeholder='Search name, gym, specialty…'
            placeholderTextColor={COLORS.textSecondary}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={load}
          />
          <TouchableOpacity onPress={() => router.push('/(drawer)/trainers/match' as any)}>
            <Ionicons name='sparkles' size={26} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <TrainerFilters
          selectedSpecialty={specialty}
          onSelectSpecialty={setSpecialty}
          filterMode={filterMode}
          onFilterModeChange={setFilterMode}
        />
        <View style={styles.links}>
          <TouchableOpacity onPress={() => router.push('/(drawer)/trainers/saved' as any)}>
            <Text style={styles.link}>Saved</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/trainer/become' as any)}>
            <Text style={styles.link}>Become a trainer</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/settings/gym' as any)}>
            <Text style={styles.link}>My gym</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={trainers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TrainerCard trainer={item} />}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
            ListEmptyComponent={<EmptyTrainersState />}
            contentContainerStyle={styles.list}
          />
        )}
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: SPACING.md },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.sm },
  search: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    color: COLORS.textPrimary,
  },
  links: { flexDirection: 'row', gap: 16, marginBottom: SPACING.sm },
  link: { color: COLORS.primary, fontSize: TYPOGRAPHY.fontSize.small },
  list: { paddingBottom: SPACING.xl },
});
