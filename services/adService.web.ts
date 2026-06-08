import type { ShowRewardedAdResult } from './adService.types';

export type { ShowRewardedAdResult } from './adService.types';

/** AdMob is native-only; no-op on web. */
export function preloadRewardedAd(): void {}

export function showRewardedAd(): Promise<ShowRewardedAdResult> {
  return Promise.resolve({ earned: false, reason: 'not_loaded' });
}

export function isRewardedAdReady(): boolean {
  return false;
}
