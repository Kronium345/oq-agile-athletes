import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import BackgroundGradient from '../../../components/BackgroundGradient';
import { GroupCard } from '../../../components/community/GroupCard';
import { TrainerScreenHeader } from '../../../components/trainers/TrainerScreenHeader';
import { UseMyLocationButton } from '../../../components/trainers/UseMyLocationButton';
import { drawerScreenStyles } from '../../../constants/drawerScreen';
import { COLORS, SPACING } from '../../../constants/theme';
import type { DeviceLocationResult } from '../../../lib/trainers/location';
import { listGroups } from '../../../services/communityApi';
import type { FitnessGroup } from '../../../types/trainer';
import { useAuthContext } from '../../AuthProvider';

export default function GroupsScreen() {
  const { user } = useAuthContext();
  const profilePostcode = (user as any)?.postcode as string | undefined;
  const [postcode, setPostcode] = useState<string | undefined>(profilePostcode);
  const [groups, setGroups] = useState<FitnessGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGroups = useCallback(async (activePostcode?: string) => {
    setLoading(true);
    try {
      const pc = activePostcode?.trim().toUpperCase();
      setGroups(await listGroups(pc ? { postcode: pc } : undefined));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGroups(postcode);
    }, [postcode, loadGroups]),
  );

  const handleLocationResolved = (result: DeviceLocationResult) => {
    setPostcode(result.postcode);
  };

  const subtitle = postcode ? `Near ${postcode}` : 'Run clubs and gym communities';

  return (
    <BackgroundGradient>
      <SafeAreaView style={drawerScreenStyles.safe} edges={['top']}>
        <TrainerScreenHeader title='Local groups' subtitle={subtitle} avoidDrawerMenu />
        <View style={styles.locationRow}>
          <UseMyLocationButton
            onResolved={handleLocationResolved}
            label={postcode ? `Near ${postcode} — update` : 'Use my location'}
            variant='filled'
          />
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
                  ? `No local groups found near ${postcode}. Try a different area or check back later.`
                  : 'No local groups found nearby. Use your location or set your gym postcode in settings.'}
              </Text>
            }
            contentContainerStyle={drawerScreenStyles.listContent}
          />
        )}
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  locationRow: {
    marginBottom: SPACING.md,
  },
  empty: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
});
