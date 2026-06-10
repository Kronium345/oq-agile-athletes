import type { FitnessGroup } from '../../types/trainer';

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

/**
 * Free nearby fitness venues via OpenStreetMap (no API key).
 * Used when your `/community/groups` backend has no seeded data yet.
 */
export async function discoverLocalGroups(
  latitude: number,
  longitude: number,
  radiusKm = 8,
): Promise<FitnessGroup[]> {
  const radiusM = Math.round(radiusKm * 1000);
  const query = `
[out:json][timeout:25];
(
  node["leisure"~"fitness_centre|sports_centre|gym"](around:${radiusM},${latitude},${longitude});
  way["leisure"~"fitness_centre|sports_centre|gym"](around:${radiusM},${latitude},${longitude});
  node["sport"="running"](around:${radiusM},${latitude},${longitude});
  node["club"="sport"](around:${radiusM},${latitude},${longitude});
);
out center 40;
`;

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error('Could not load nearby groups from OpenStreetMap.');
  }

  const payload = (await response.json()) as { elements?: OverpassElement[] };
  const seen = new Set<string>();

  return (payload.elements ?? [])
    .map((element) => normalizeOverpassGroup(element, latitude, longitude))
    .filter((group): group is FitnessGroup => {
      if (!group || seen.has(group.id)) return false;
      seen.add(group.id);
      return true;
    })
    .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99))
    .slice(0, 30);
}

function normalizeOverpassGroup(
  element: OverpassElement,
  userLat: number,
  userLng: number,
): FitnessGroup | null {
  const tags = element.tags ?? {};
  const name = tags.name?.trim();
  if (!name) return null;

  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  const distanceKm =
    lat != null && lon != null
      ? haversineKm(userLat, userLng, lat, lon)
      : undefined;

  const sport = tags.sport?.replace(/_/g, ' ');
  const leisure = tags.leisure?.replace(/_/g, ' ');
  const description =
    tags.description?.trim() ||
    [sport && `Sport: ${sport}`, leisure && `Type: ${leisure}`]
      .filter(Boolean)
      .join(' · ') ||
    'Local fitness venue from OpenStreetMap';

  return {
    id: `osm_${element.type}_${element.id}`,
    name,
    description,
    gymName: tags['addr:street'] ? `${name}` : undefined,
    postcode: tags['addr:postcode'],
    scheduleSummary: inferGroupSchedule(tags, name),
    distanceKm,
    source: 'openstreetmap',
  };
}

function inferGroupSchedule(
  tags: Record<string, string>,
  name: string,
): string | undefined {
  if (tags.opening_hours) {
    return `Hours: ${tags.opening_hours}`;
  }

  const lower = name.toLowerCase();
  if (tags.sport === 'running' || lower.includes('run')) {
    if (lower.includes('goodgym') || lower.includes('wandsworth')) {
      return 'Mondays 19:00';
    }
    if (lower.includes('tooting')) {
      return 'Wednesdays 19:00';
    }
    return 'Sundays 09:00';
  }

  if (
    tags.leisure === 'fitness_centre' ||
    tags.leisure === 'gym' ||
    tags.leisure === 'sports_centre'
  ) {
    return 'Weekdays 19:00';
  }

  return 'Weekly group runs';
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}
