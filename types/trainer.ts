export type TrainerSpecialty =
  | 'Weight loss'
  | 'Strength & hypertrophy'
  | 'Powerlifting'
  | 'Bodybuilding'
  | 'Running'
  | "Women's fitness"
  | 'Sports performance'
  | 'Rehab & mobility';

export type PriceUnit = 'session' | 'hour' | 'month';

export type TrainerListItem = {
  id: string;
  userId: string;
  displayName: string;
  avatar?: string | null;
  specialties: TrainerSpecialty[];
  gymName: string;
  postcode: string;
  priceFrom?: number;
  priceUnit?: PriceUnit;
  verified: boolean;
  featured?: boolean;
  distanceKm?: number;
  ratingAvg?: number;
  reviewCount?: number;
  latitude?: number;
  longitude?: number;
};

export type TrainerProfile = TrainerListItem & {
  bio: string;
  qualifications: string[];
  instagram?: string;
  availabilityNotes?: string;
  stripeConnectOnboarded?: boolean;
  published: boolean;
};

export type TrainerProfileInput = {
  displayName: string;
  bio: string;
  qualifications: string[];
  specialties: TrainerSpecialty[];
  gymName: string;
  postcode: string;
  priceFrom?: number;
  priceUnit?: PriceUnit;
  instagram?: string;
  availabilityNotes?: string;
  published?: boolean;
};

export type MemberGymProfile = {
  gymName: string;
  postcode: string;
};

export type TrainerReview = {
  id: string;
  trainerId: string;
  userId: string;
  displayName: string;
  rating: number;
  text: string;
  createdAt: string;
};

export type TrainerLead = {
  id: string;
  trainerId: string;
  memberName: string;
  message: string;
  goal?: string;
  budget?: string;
  status: 'pending' | 'read' | 'replied';
  createdAt: string;
};

export type ContactRequestInput = {
  message: string;
  goal?: string;
  budget?: string;
};

export type TrainerMatchInput = {
  goal: string;
  budget?: string;
  postcode?: string;
  trainingStyle?: string;
  experience?: string;
};

export type TrainerMatchResult = {
  trainers: TrainerListItem[];
  explanations: string[];
};

export type TrainingPartner = {
  userId: string;
  displayName: string;
  avatar?: string | null;
  gymName?: string;
  postcode?: string;
  goal?: string;
  experience?: string;
  gender?: string;
  weight?: number;
  unit?: string;
};

export type PartnerConnectionStatus = 'pending' | 'accepted' | 'declined';

export type PartnerConnection = {
  id: string;
  status: PartnerConnectionStatus;
  direction: 'incoming' | 'outgoing';
  user: TrainingPartner;
  createdAt?: string;
};

export type FitnessGroup = {
  id: string;
  name: string;
  description: string;
  gymName?: string;
  postcode?: string;
  scheduleSummary?: string;
  memberCount?: number;
  distanceKm?: number;
  /** `api` = your backend; `openstreetmap` = Overpass discovery fallback */
  source?: 'api' | 'openstreetmap';
};

export type BookingSlot = {
  id: string;
  trainerId: string;
  startsAt: string;
  endsAt: string;
  available: boolean;
};

export type Booking = {
  id: string;
  trainerId: string;
  trainerName: string;
  memberId: string;
  slotId: string;
  startsAt: string;
  endsAt: string;
  amountPence: number;
  currency: string;
  status: 'pending_payment' | 'confirmed' | 'cancelled' | 'completed';
  stripePaymentIntentId?: string;
};

export type StripeConnectStatus = {
  onboarded: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  dashboardUrl?: string;
};
