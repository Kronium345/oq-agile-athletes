import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import BackgroundGradient from '../../components/BackgroundGradient';
import { ContactTrainerSheet } from '../../components/trainers/ContactTrainerSheet';
import { ReviewList } from '../../components/trainers/ReviewList';
import { TrainerScreenHeader } from '../../components/trainers/TrainerScreenHeader';
import { VerifiedBadge } from '../../components/trainers/VerifiedBadge';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { formatTrainerPrice } from '../../lib/trainers/formatters';
import {
  getTrainerById,
  listTrainerReviews,
  saveTrainer,
} from '../../services/trainersApi';
import {
  formatVideoDuration,
  listTrainerVideos,
} from '../../services/trainerContentApi';
import type { TrainerProfile, TrainerReview, TrainerVideo } from '../../types/trainer';

export default function TrainerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [trainer, setTrainer] = useState<TrainerProfile | null>(null);
  const [reviews, setReviews] = useState<TrainerReview[]>([]);
  const [videos, setVideos] = useState<TrainerVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactOpen, setContactOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      (async () => {
        setLoading(true);
        try {
          const [t, r, v] = await Promise.all([
            getTrainerById(String(id)),
            listTrainerReviews(String(id)),
            listTrainerVideos(String(id)),
          ]);
          setTrainer(t);
          setReviews(r);
          setVideos(v);
        } finally {
          setLoading(false);
        }
      })();
    }, [id]),
  );

  if (loading || !trainer) {
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
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              flexGrow: 1,
              paddingBottom: insets.bottom + SPACING.xl + 16,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <TrainerScreenHeader title={trainer.displayName} />
          <View style={styles.row}>
            {trainer.verified ? <VerifiedBadge /> : null}
            <Text style={styles.price}>
              {formatTrainerPrice(trainer.priceFrom, trainer.priceUnit)}
            </Text>
          </View>
          <Text style={styles.section}>About</Text>
          <Text style={styles.body}>{trainer.bio}</Text>
          <Text style={styles.section}>Gym</Text>
          <Text style={styles.body}>
            {trainer.gymName} · {trainer.postcode}
          </Text>
          <Text style={styles.section}>Specialties</Text>
          <Text style={styles.body}>{trainer.specialties.join(', ')}</Text>
          {trainer.qualifications.length ? (
            <>
              <Text style={styles.section}>Qualifications</Text>
              <Text style={styles.body}>{trainer.qualifications.join(', ')}</Text>
            </>
          ) : null}
          {videos.length > 0 ? (
            <>
              <Text style={styles.section}>Coach videos</Text>
              {videos.map((video) => (
                <TouchableOpacity
                  key={video.id}
                  style={styles.videoRow}
                  onPress={() => Linking.openURL(video.playUrl)}
                >
                  <Ionicons name='play-circle' size={28} color={COLORS.primary} />
                  <View style={styles.videoInfo}>
                    <Text style={styles.videoTitle}>{video.title}</Text>
                    {video.durationSec ? (
                      <Text style={styles.videoMeta}>
                        {formatVideoDuration(video.durationSec)}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}
            </>
          ) : null}
          <Text style={styles.section}>Reviews</Text>
          <ReviewList reviews={reviews} />
          <View style={styles.actionsSpacer} />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.primary} onPress={() => setContactOpen(true)}>
              <Text style={styles.primaryText}>Request intro</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondary}
              onPress={() => router.push(`/trainer/book/${trainer.id}` as any)}
            >
              <Text style={styles.secondaryText}>Book session</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => saveTrainer(trainer.id)}>
              <Ionicons name='bookmark-outline' size={22} color={COLORS.primary} />
            </TouchableOpacity>
            {trainer.instagram ? (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() =>
                  Linking.openURL(`https://instagram.com/${trainer.instagram}`)
                }
              >
                <Ionicons name='logo-instagram' size={22} color={COLORS.primary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
        <ContactTrainerSheet
          visible={contactOpen}
          trainerId={trainer.id}
          trainerName={trainer.displayName}
          onClose={() => setContactOpen(false)}
        />
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: SPACING.md },
  scroll: { paddingTop: SPACING.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: SPACING.md },
  actionsSpacer: { flexGrow: 1, minHeight: SPACING.xl },
  price: { fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.primary },
  section: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: 6,
  },
  body: { fontSize: TYPOGRAPHY.fontSize.regular, color: COLORS.textSecondary, lineHeight: 22 },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: SPACING.sm,
  },
  videoInfo: { flex: 1 },
  videoTitle: { color: COLORS.textPrimary, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  videoMeta: { fontSize: TYPOGRAPHY.fontSize.small, color: COLORS.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: SPACING.md },
  primary: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
  },
  primaryText: { color: COLORS.textButton, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  secondary: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderColor: COLORS.borderOrange,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
  },
  secondaryText: { color: COLORS.primary, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  iconBtn: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.primaryLight,
  },
});
