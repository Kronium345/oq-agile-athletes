import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import {
  regionForTrainers,
  trainersWithCoordinates,
} from '../../lib/trainers/coordinates';
import type { TrainerListItem } from '../../types/trainer';

type Props = {
  trainers: TrainerListItem[];
  userLocation?: { latitude: number; longitude: number } | null;
  bottomInset?: number;
};

export function TrainersMap({ trainers, userLocation, bottomInset = 0 }: Props) {
  const router = useRouter();
  const mappable = useMemo(() => trainersWithCoordinates(trainers), [trainers]);
  const region = useMemo(
    () => regionForTrainers(trainers, userLocation),
    [trainers, userLocation],
  );

  if (mappable.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          No map locations for these trainers yet. Try List view or another filter.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { marginBottom: bottomInset }]}>
      <MapView
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        showsUserLocation={Boolean(userLocation)}
        showsMyLocationButton
      >
        {mappable.map((trainer) => (
          <Marker
            key={trainer.id}
            coordinate={{
              latitude: trainer.latitude,
              longitude: trainer.longitude,
            }}
            title={trainer.displayName}
            description={trainer.gymName}
            pinColor={COLORS.primary}
            onCalloutPress={() => router.push(`/trainer/${trainer.id}` as any)}
          />
        ))}
      </MapView>
      <View style={styles.hint}>
        <Text style={styles.hintText}>
          Tap a pin, then the callout to open a trainer profile
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    borderRadius: BORDER_RADIUS.large,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  map: {
    flex: 1,
    minHeight: 280,
  },
  hint: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: BORDER_RADIUS.medium,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  hintText: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  empty: {
    flex: 1,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
