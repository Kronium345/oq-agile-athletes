import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundGradient from '../../../components/BackgroundGradient';
import { GroupCard } from '../../../components/community/GroupCard';
import { TrainerScreenHeader } from '../../../components/trainers/TrainerScreenHeader';
import { UseMyLocationButton } from '../../../components/trainers/UseMyLocationButton';
import { drawerScreenStyles } from '../../../constants/drawerScreen';
import { COLORS, SPACING } from '../../../constants/theme';
import { useDrawerListPadding } from '../../../hooks/useDrawerListPadding';
import { cacheFitnessGroups } from '../../../lib/community/groupCache';
import type { DeviceLocationResult } from '../../../lib/trainers/location';
import { listGroups } from '../../../services/communityApi';
import type { FitnessGroup } from '../../../types/trainer';
import { useAuthContext } from '../../AuthProvider';

export default function GroupsScreen() {
  const { user } = useAuthContext();
  const profilePostcode = (user as any)?.postcode as string | undefined;
  const [postcode, setPostcode] = useState<string | undefined>(profilePostcode);
  const [coords, setCoords] = useState<
    { latitude: number; longitude: number } | undefined
  >();
  const [groups, setGroups] = useState<FitnessGroup[]>([]);
  const [usingOpenData, setUsingOpenData] = useState(false);
  const [loading, setLoading] = useState(true);
  const listPadding = useDrawerListPadding();

  const loadGroups = useCallback(
    async (
      activePostcode?: string,
      activeCoords?: { latitude: number; longitude: number },
    ) => {
      setLoading(true);
      try {
        const pc = activePostcode?.trim().toUpperCase();
        const result = await listGroups({
          postcode: pc,
          latitude: activeCoords?.latitude,
          longitude: activeCoords?.longitude,
          discoverIfEmpty: true,
        });
        setGroups(result);
        cacheFitnessGroups(result);
        setUsingOpenData(result.some((g) => g.source === 'openstreetmap'));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      loadGroups(postcode, coords);
    }, [postcode, coords, loadGroups]),
  );

  const handleLocationResolved = (result: DeviceLocationResult) => {
    setPostcode(result.postcode);
    setCoords({ latitude: result.latitude, longitude: result.longitude });
  };

  const subtitle = postcode ? `Near ${postcode}` : 'Run clubs and gym communities';

  return (
    <BackgroundGradient>
      <SafeAreaView style={drawerScreenStyles.safe} edges={['top']}>
        <TrainerScreenHeader title='Recommended groups' subtitle={subtitle} avoidDrawerMenu />
        <View style={styles.locationRow}>
          <UseMyLocationButton
            onResolved={handleLocationResolved}
            label={postcode ? `Near ${postcode} — update` : 'Use my location'}
            variant='filled'
          />
          {usingOpenData ? (
            <Text style={styles.openDataNote}>
              Showing nearby gyms and sports venues from OpenStreetMap until your
              community groups API has local listings.
            </Text>
          ) : null}
        </View>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <FlatList
            data={groups}
            keyExtractor={(g) => g.id}
            renderItem={({ item }) => <GroupCard group={item} />}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {postcode
                  ? `No recommended groups found near ${postcode}. Try a different area or check back later.`
                  : 'No recommended groups found nearby. Use your location or set your gym postcode in settings.'}
              </Text>
            }
            contentContainerStyle={[
              drawerScreenStyles.listContent,
              listPadding,
            ]}
          />
        )}
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  locationRow: {
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  openDataNote: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  empty: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
});
