import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundGradient from '../../components/BackgroundGradient';
import { TrainerScreenHeader } from '../../components/trainers/TrainerScreenHeader';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import {
  formatVideoDuration,
  listAssignedTrainerVideos,
} from '../../services/trainerContentApi';
import type { TrainerVideo } from '../../types/trainer';

export default function AssignedTrainerVideosScreen() {
  const [videos, setVideos] = useState<TrainerVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setVideos(await listAssignedTrainerVideos());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const renderItem = ({ item }: { item: TrainerVideo }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => Linking.openURL(item.playUrl)}
      activeOpacity={0.85}
    >
      <View style={styles.playIcon}>
        <Ionicons name='play' size={22} color={COLORS.textButton} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.description ? (
          <Text style={styles.cardMeta} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        {item.durationSec ? (
          <Text style={styles.cardMeta}>
            {formatVideoDuration(item.durationSec)}
          </Text>
        ) : null}
      </View>
      <Ionicons name='chevron-forward' size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TrainerScreenHeader
          title='Videos from my coach'
          subtitle='Clips your trainer shared with you'
        />
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={videos}
            keyExtractor={(v) => v.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.empty}>
                No videos assigned yet. When your coach shares a clip, it will
                appear here.
              </Text>
            }
          />
        )}
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: SPACING.md },
  loader: { marginTop: 24 },
  list: { paddingBottom: SPACING.xl },
  empty: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 22,
    paddingHorizontal: SPACING.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 12,
  },
  playIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.textPrimary },
  cardMeta: { fontSize: TYPOGRAPHY.fontSize.small, color: COLORS.textSecondary, marginTop: 4 },
});
