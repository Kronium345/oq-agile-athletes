import {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';
import { getRewardedAdUnitId } from '../constants/ads';

let rewardedAd: RewardedAd | null = null;
let listenersAttached = false;

function getRewardedAdInstance(): RewardedAd {
  if (!rewardedAd) {
    rewardedAd = RewardedAd.createForAdRequest(getRewardedAdUnitId());
  }
  return rewardedAd;
}

function attachRewardedListeners(ad: RewardedAd): void {
  if (listenersAttached) return;
  listenersAttached = true;

  ad.addAdEventListener(AdEventType.CLOSED, () => {
    ad.load();
  });

  ad.addAdEventListener(AdEventType.ERROR, () => {
    setTimeout(() => ad.load(), 5000);
  });
}

/** Preload a rewarded ad for optional unlock flows (e.g. extra Form Coach analyses). */
export function preloadRewardedAd(): void {
  const ad = getRewardedAdInstance();
  attachRewardedListeners(ad);
  if (!ad.loaded) {
    ad.load();
  }
}

export type ShowRewardedAdResult =
  | { earned: true }
  | { earned: false; reason: 'not_loaded' | 'closed_early' | 'error' };

/**
 * Show a rewarded ad. Resolves when the user earns the reward or dismisses early.
 * Call `preloadRewardedAd()` ahead of time for better UX.
 */
export function showRewardedAd(): Promise<ShowRewardedAdResult> {
  return new Promise((resolve) => {
    const ad = getRewardedAdInstance();
    attachRewardedListeners(ad);

    let earned = false;
    let settled = false;

    const finish = (result: ShowRewardedAdResult) => {
      if (settled) return;
      settled = true;
      unsubEarned();
      unsubClosed();
      unsubError();
      resolve(result);
    };

    const unsubEarned = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        earned = true;
      },
    );

    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      finish(earned ? { earned: true } : { earned: false, reason: 'closed_early' });
    });

    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      finish({ earned: false, reason: 'error' });
    });

    if (ad.loaded) {
      ad.show().catch(() => {
        finish({ earned: false, reason: 'error' });
      });
      return;
    }

    const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      unsubLoaded();
      ad.show().catch(() => {
        finish({ earned: false, reason: 'error' });
      });
    });

    ad.load();

    setTimeout(() => {
      if (!settled && !ad.loaded) {
        unsubLoaded();
        finish({ earned: false, reason: 'not_loaded' });
      }
    }, 15_000);
  });
}

export function isRewardedAdReady(): boolean {
  return getRewardedAdInstance().loaded;
}
