export type ShowRewardedAdResult =
  | { earned: true }
  | { earned: false; reason: 'not_loaded' | 'closed_early' | 'error' };
