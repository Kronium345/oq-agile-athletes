import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import BackgroundGradient from '../../../components/BackgroundGradient';
import { PartnerCard } from '../../../components/community/PartnerCard';
import { TrainerScreenHeader } from '../../../components/trainers/TrainerScreenHeader';
import { drawerScreenStyles } from '../../../constants/drawerScreen';
import { COLORS } from '../../../constants/theme';
import { listTrainingPartners } from '../../../services/communityApi';
import type { TrainingPartner } from '../../../types/trainer';
import { useAuthContext } from '../../AuthProvider';

export default function PartnersScreen() {
  const { user } = useAuthContext();
  const [partners, setPartners] = useState<TrainingPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const gymName = (user as any)?.gymName as string | undefined;

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try {
          setPartners(await listTrainingPartners({ gymName }));
        } finally {
          setLoading(false);
        }
      })();
    }, [gymName]),
  );

  return (
    <BackgroundGradient>
      <SafeAreaView style={drawerScreenStyles.safe} edges={['top']}>
        <TrainerScreenHeader
          title='Training partners'
          subtitle={gymName || 'Near you'}
          avoidDrawerMenu
        />
        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <FlatList
            data={partners}
            keyExtractor={(p) => p.userId}
            renderItem={({ item }) => <PartnerCard partner={item} />}
            ListEmptyComponent={<Text style={styles.empty}>No partners found yet.</Text>}
            contentContainerStyle={drawerScreenStyles.listContent}
          />
        )}
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 24 },
});
