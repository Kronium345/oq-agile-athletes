import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import BackgroundGradient from '../../components/BackgroundGradient';
import { TrainerScreenHeader } from '../../components/trainers/TrainerScreenHeader';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { listMyLeads } from '../../services/trainerLeadsApi';
import type { TrainerLead } from '../../types/trainer';

export default function TrainerLeadsScreen() {
  const [leads, setLeads] = useState<TrainerLead[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try {
          setLeads(await listMyLeads());
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TrainerScreenHeader title='Client leads' subtitle='Intro requests' />
        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <FlatList
            data={leads}
            keyExtractor={(l) => l.id}
            ListEmptyComponent={<Text style={styles.empty}>No leads yet.</Text>}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.name}>{item.memberName}</Text>
                <Text style={styles.meta}>{item.goal} · {item.budget}</Text>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.status}>{item.status}</Text>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: SPACING.md },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 24 },
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  name: { fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.textPrimary },
  meta: { fontSize: TYPOGRAPHY.fontSize.small, color: COLORS.textSecondary, marginVertical: 4 },
  message: { color: COLORS.textPrimary, lineHeight: 20 },
  status: { marginTop: 8, fontSize: 12, color: COLORS.primary },
});
