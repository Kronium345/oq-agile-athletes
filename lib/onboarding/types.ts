export type Gender = 'Male' | 'Female';

export type WeightUnit = 'kg' | 'lbs';

export type OnboardingProfile = {
  gender?: Gender;
  experience?: string;
  avatar?: string;
  weight?: number;
  unit?: WeightUnit;
};

export const EXPERIENCE_LEVELS = [
  { label: 'Beginner', description: '<6 months', icon: 'leaf' as const, color: '#22c55e' },
  { label: 'Intermediate', description: '6+ months', icon: 'flower' as const, color: '#10b981' },
  { label: 'Advanced', description: '1.5+ years', icon: 'tree' as const, color: '#eab308' },
  { label: 'Pro', description: '4+ years', icon: 'image-filter-hdr' as const, color: '#F37021' },
  { label: 'Elite', description: '8+ years', icon: 'white-balance-sunny' as const, color: '#ea580c' },
] as const;

export const AVATAR_PRESETS = [
  'https://img.icons8.com/?size=100&id=FDI4JxAMODWm&format=png&color=F37021',
  'https://img.icons8.com/?size=100&id=er5nhhO0Sb3Q&format=png&color=F37021',
  'https://img.icons8.com/?size=100&id=gaokY6HiHgpc&format=png&color=F37021',
  'https://img.icons8.com/?size=100&id=60Qzo3vVev1m&format=png&color=F37021',
  'https://img.icons8.com/?size=100&id=0DmH6dXqUej1&format=png&color=F37021',
] as const;
