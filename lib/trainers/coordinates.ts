import type { TrainerListItem } from '../../types/trainer';

const UK_POSTCODE_APPROX: Record<string, { lat: number; lng: number }> = {
  'E1 6AN': { lat: 51.5154, lng: -0.0722 },
  'EC2M 7PY': { lat: 51.5186, lng: -0.083 },
};

const LONDON_CENTER = { latitude: 51.5074, longitude: -0.1278 };

function hashOffset(id: string): { lat: number; lng: number } {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const n = (hash % 1000) / 1000;
  return { lat: (n - 0.5) * 0.008, lng: ((hash >> 3) % 1000) / 1000 - 0.5 * 0.012 };
}

export function coordsForTrainer(
  trainer: TrainerListItem,
): { latitude: number; longitude: number } | null {
  if (trainer.latitude != null && trainer.longitude != null) {
    return { latitude: trainer.latitude, longitude: trainer.longitude };
  }

  const key = trainer.postcode?.toUpperCase().trim();
  const base = key ? UK_POSTCODE_APPROX[key] : null;
  if (!base) return null;

  const jitter = hashOffset(trainer.id);
  return {
    latitude: base.lat + jitter.lat,
    longitude: base.lng + jitter.lng,
  };
}

export function trainersWithCoordinates(
  trainers: TrainerListItem[],
): Array<TrainerListItem & { latitude: number; longitude: number }> {
  return trainers
    .map((trainer) => {
      const coords = coordsForTrainer(trainer);
      if (!coords) return null;
      return { ...trainer, ...coords };
    })
    .filter(Boolean) as Array<
    TrainerListItem & { latitude: number; longitude: number }
  >;
}

export function regionForTrainers(
  trainers: TrainerListItem[],
  userLocation?: { latitude: number; longitude: number } | null,
) {
  const points = trainersWithCoordinates(trainers);
  const all = userLocation ? [userLocation, ...points] : points;

  if (all.length === 0) {
    return {
      ...LONDON_CENTER,
      latitudeDelta: 0.12,
      longitudeDelta: 0.12,
    };
  }

  if (all.length === 1) {
    const p = all[0];
    return {
      latitude: p.latitude,
      longitude: p.longitude,
      latitudeDelta: 0.06,
      longitudeDelta: 0.06,
    };
  }

  const lats = all.map((p) => p.latitude);
  const lngs = all.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const pad = 0.02;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(maxLat - minLat + pad, 0.06),
    longitudeDelta: Math.max(maxLng - minLng + pad, 0.06),
  };
}
