/** Use mock data when API routes are not live yet. Set EXPO_PUBLIC_USE_TRAINER_MOCKS=false when backend is ready. */
export const USE_TRAINER_MOCKS =
  process.env.EXPO_PUBLIC_USE_TRAINER_MOCKS === 'true' ||
  (__DEV__ && process.env.EXPO_PUBLIC_USE_TRAINER_MOCKS !== 'false');
