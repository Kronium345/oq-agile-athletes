import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import BackgroundGradient from '../../../components/BackgroundGradient';
import { EmptyTrainersState } from '../../../components/trainers/EmptyTrainersState';
import { TrainerCard } from '../../../components/trainers/TrainerCard';
import { TrainerFilters } from '../../../components/trainers/TrainerFilters';
import { TrainerScreenHeader } from '../../../components/trainers/TrainerScreenHeader';
import { UseMyLocationButton } from '../../../components/trainers/UseMyLocationButton';
import { TrainersMap } from '../../../components/trainers/TrainersMap';
import { DRAWER_MENU_TOP_OFFSET } from '../../../constants/layout';
import { COLORS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import { DEFAULT_SEARCH_RADIUS_KM } from '../../../lib/trainers/constants';
import { listTrainers } from '../../../services/trainersApi';
import type { TrainerListItem } from '../../../types/trainer';
import { useAuthContext } from '../../AuthProvider';

export default function TrainersBrowseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthContext();
  const listBottomPad = insets.bottom + SPACING.xl + 24;
  const [trainers, setTrainers] = useState<TrainerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState<string | undefined>();
  const [filterMode, setFilterMode] = useState<'all' | 'gym' | 'near'>('all');
  const [nearPostcode, setNearPostcode] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userMapLocation, setUserMapLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const memberGym = (user as any)?.gymName as string | undefined;
  const memberPostcode = (user as any)?.postcode as string | undefined;
  const activeNearPostcode = nearPostcode ?? memberPostcode;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listTrainers({
        q: search || undefined,
        specialty,
        gymName: filterMode === 'gym' ? memberGym : undefined,
        postcode: filterMode === 'near' ? activeNearPostcode : undefined,
        radiusKm: filterMode === 'near' ? DEFAULT_SEARCH_RADIUS_KM : undefined,
      });
      setTrainers(data);
    } catch {
      setTrainers([]);
    } finally {
      setLoading(false);
    }
  }, [search, specialty, filterMode, memberGym, activeNearPostcode]);

  const handleUseMyLocation = (loc: {
    postcode: string;
    latitude: number;
    longitude: number;
  }) => {
    setNearPostcode(loc.postcode);
    setFilterMode('near');
    setUserMapLocation({
      latitude: loc.latitude,
      longitude: loc.longitude,
    });
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    if (nearPostcode) {
      load();
    }
  }, [nearPostcode, load]);

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TrainerScreenHeader
          title='Find a trainer'
          subtitle='UK personal trainers'
          avoidDrawerMenu
          showBack={false}
        />
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons
              name='list'
              size={16}
              color={viewMode === 'list' ? COLORS.textButton : COLORS.primary}
            />
            <Text
              style={[
                styles.toggleText,
                viewMode === 'list' && styles.toggleTextActive,
              ]}
            >
              List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'map' && styles.toggleActive]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons
              name='map'
              size={16}
              color={viewMode === 'map' ? COLORS.textButton : COLORS.primary}
            />
            <Text
              style={[
                styles.toggleText,
                viewMode === 'map' && styles.toggleTextActive,
              ]}
            >
              Map
            </Text>
          </TouchableOpacity>
        </View>
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
        {filterMode === 'near' ? (
          <View style={styles.nearRow}>
            <UseMyLocationButton
              onResolved={handleUseMyLocation}
              label={
                activeNearPostcode
                  ? `Near ${activeNearPostcode} — update`
                  : 'Use my location'
              }
              variant='filled'
            />
          </View>
        ) : null}
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
        ) : viewMode === 'map' ? (
          <TrainersMap
            trainers={trainers}
            userLocation={userMapLocation}
            bottomInset={listBottomPad}
          />
        ) : (
          <FlatList
            style={styles.listView}
            data={trainers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TrainerCard trainer={item} />}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
            ListEmptyComponent={<EmptyTrainersState />}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: listBottomPad },
            ]}
          />
        )}
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingTop: DRAWER_MENU_TOP_OFFSET,
    paddingHorizontal: SPACING.md,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderOrange,
    backgroundColor: COLORS.primaryLight,
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  toggleText: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.primary,
  },
  toggleTextActive: {
    color: COLORS.textButton,
  },
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
  nearRow: {
    marginBottom: SPACING.sm,
  },
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: SPACING.md,
  },
  link: { color: COLORS.primary, fontSize: TYPOGRAPHY.fontSize.small },
  listView: { flex: 1 },
  list: { flexGrow: 1 },
});
