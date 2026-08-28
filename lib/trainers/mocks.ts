import type {
  Booking,
  BookingSlot,
  FitnessGroup,
  TrainerLead,
  TrainerListItem,
  TrainerMatchResult,
  TrainerProfile,
  TrainerReview,
  TrainerVideo,
  TrainingPartner,
} from '../../types/trainer';

export const MOCK_TRAINERS: TrainerProfile[] = [
  {
    id: 'tr_1',
    userId: 'u_tr1',
    displayName: 'Karl Mitchell',
    avatar: null,
    bio: 'Level 3 PT with 8 years coaching strength and hypertrophy. CIMSPA registered. I train clients at PureGym Aldgate and offer online check-ins.',
    qualifications: ['Level 3 Personal Trainer', 'CIMSPA Registered'],
    specialties: ['Strength & hypertrophy', 'Bodybuilding'],
    gymName: 'PureGym Aldgate',
    postcode: 'E1 6AN',
    latitude: 51.5154,
    longitude: -0.0722,
    priceFrom: 40,
    priceUnit: 'session',
    instagram: 'karlmitchell_pt',
    availabilityNotes: 'Mon, Wed, Fri evenings',
    verified: true,
    featured: true,
    distanceKm: 0.8,
    ratingAvg: 4.8,
    reviewCount: 12,
    published: true,
    stripeConnectOnboarded: true,
  },
  {
    id: 'tr_2',
    userId: 'u_tr2',
    displayName: 'Sarah Chen',
    avatar: null,
    bio: "Women's fitness specialist focusing on sustainable fat loss and confidence in the gym.",
    qualifications: ['Level 3 PT', 'Pre/post-natal'],
    specialties: ["Women's fitness", 'Weight loss'],
    gymName: 'The Gym Group Liverpool Street',
    postcode: 'EC2M 7PY',
    latitude: 51.5186,
    longitude: -0.083,
    priceFrom: 35,
    priceUnit: 'session',
    verified: true,
    distanceKm: 1.2,
    ratingAvg: 4.9,
    reviewCount: 8,
    published: true,
    stripeConnectOnboarded: false,
  },
  {
    id: 'tr_3',
    userId: 'u_tr3',
    displayName: 'James Okafor',
    avatar: null,
    bio: 'Powerlifting coach. Competed nationally. Technique-first programming for squat, bench, and deadlift.',
    qualifications: ['Level 3 PT', 'UK Powerlifting Coach'],
    specialties: ['Powerlifting', 'Strength & hypertrophy'],
    gymName: 'PureGym Aldgate',
    postcode: 'E1 6AN',
    latitude: 51.5154,
    longitude: -0.0722,
    priceFrom: 50,
    priceUnit: 'session',
    verified: false,
    distanceKm: 0.8,
    reviewCount: 0,
    published: true,
  },
];

export const MOCK_REVIEWS: TrainerReview[] = [
  {
    id: 'rev_1',
    trainerId: 'tr_1',
    userId: 'u_m1',
    displayName: 'Alex',
    rating: 5,
    text: 'Great programming and form cues. Hit a PB on deadlift in 6 weeks.',
    createdAt: '2026-05-01T10:00:00Z',
  },
];

export const MOCK_LEADS: TrainerLead[] = [
  {
    id: 'lead_1',
    trainerId: 'tr_1',
    memberName: 'Jamie',
    message: 'Looking for 2 sessions per week to build muscle.',
    goal: 'Hypertrophy',
    budget: '£35-45/session',
    status: 'pending',
    createdAt: '2026-06-01T14:00:00Z',
  },
];

export const MOCK_MATCH_RESULT: TrainerMatchResult = {
  trainers: MOCK_TRAINERS.slice(0, 2),
  explanations: [
    'Karl trains at your gym and specialises in strength & hypertrophy.',
    'Sarah matches your budget and focuses on sustainable weight loss.',
  ],
};

export const MOCK_PARTNERS: TrainingPartner[] = [
  {
    userId: 'u_p1',
    displayName: 'Morgan Lee',
    gymName: 'PureGym Aldgate',
    postcode: 'E1 6AN',
    goal: 'Build muscle',
    experience: 'Intermediate',
    gender: 'Male',
    weight: 82,
    unit: 'kg',
  },
  {
    userId: 'u_p2',
    displayName: 'Taylor Brooks',
    gymName: 'PureGym Aldgate',
    postcode: 'E1 6AN',
    goal: 'Weight loss',
    experience: 'Beginner',
    gender: 'Female',
    weight: 68,
    unit: 'kg',
  },
];

export const MOCK_CONNECTIONS = {
  pending: [
    {
      id: 'req_in_1',
      status: 'pending' as const,
      direction: 'incoming' as const,
      createdAt: new Date().toISOString(),
      user: {
        userId: 'u_p3',
        displayName: 'Alex Rivera',
        gymName: 'PureGym Aldgate',
        postcode: 'E1 6AN',
        experience: 'Advanced',
        gender: 'Male',
        weight: 90,
        unit: 'kg',
        goal: 'Strength',
      },
    },
  ],
  accepted: [
    {
      id: 'conn_1',
      status: 'accepted' as const,
      direction: 'incoming' as const,
      user: MOCK_PARTNERS[0],
    },
  ],
};

export const MOCK_GROUPS: FitnessGroup[] = [
  {
    id: 'grp_1',
    name: 'Aldgate Morning Run Club',
    description: 'Easy 5k Tuesdays and Thursdays before work.',
    postcode: 'E1 6AN',
    scheduleSummary: 'Tue & Thu 6:30am',
    memberCount: 24,
  },
  {
    id: 'grp_2',
    name: 'PureGym Aldgate Lifting Crew',
    description: 'Informal squat bench deadlift crew. All levels welcome.',
    gymName: 'PureGym Aldgate',
    scheduleSummary: 'Wed 7pm',
    memberCount: 18,
  },
];

export const MOCK_SLOTS: BookingSlot[] = [
  {
    id: 'slot_1',
    trainerId: 'tr_1',
    startsAt: '2026-06-10T18:00:00Z',
    endsAt: '2026-06-10T19:00:00Z',
    available: true,
  },
  {
    id: 'slot_2',
    trainerId: 'tr_1',
    startsAt: '2026-06-11T18:00:00Z',
    endsAt: '2026-06-11T19:00:00Z',
    available: true,
  },
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'book_1',
    trainerId: 'tr_1',
    trainerName: 'Karl Mitchell',
    memberId: 'u_me',
    slotId: 'slot_1',
    startsAt: '2026-06-10T18:00:00Z',
    endsAt: '2026-06-10T19:00:00Z',
    amountPence: 4000,
    currency: 'gbp',
    status: 'confirmed',
  },
];

export function filterMockTrainers(params: {
  specialty?: string;
  q?: string;
  gymName?: string;
}): TrainerListItem[] {
  let list = MOCK_TRAINERS.filter((t) => t.published);
  if (params.specialty) {
    list = list.filter((t) => t.specialties.includes(params.specialty as any));
  }
  if (params.gymName) {
    const g = params.gymName.toLowerCase();
    list = list.filter((t) => t.gymName.toLowerCase().includes(g));
  }
  if (params.q) {
    const q = params.q.toLowerCase();
    list = list.filter(
      (t) =>
        t.displayName.toLowerCase().includes(q) ||
        t.gymName.toLowerCase().includes(q) ||
        t.specialties.some((s) => s.toLowerCase().includes(q)),
    );
  }
  return list;
}

/** Sample coach videos for dev when `EXPO_PUBLIC_USE_TRAINER_MOCKS=true`. */
export const MOCK_TRAINER_VIDEOS: TrainerVideo[] = [
  {
    id: 'tv_1',
    trainerId: 'tr_1',
    title: 'RDL technique cues',
    description: 'Hip hinge, neutral spine, slow eccentric.',
    playUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    durationSec: 15,
    assignedMemberIds: [],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'tv_2',
    trainerId: 'tr_1',
    title: 'Warm-up flow',
    description: '5-minute prep before lower body day.',
    playUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    durationSec: 30,
    assignedMemberIds: [],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];
