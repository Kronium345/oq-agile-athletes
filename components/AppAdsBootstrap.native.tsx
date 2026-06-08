import { useEffect } from 'react';
import mobileAds from 'react-native-google-mobile-ads';
import { preloadRewardedAd } from '../services/adService';

/** Initializes Google Mobile Ads once on native dev/production builds. */
export function AppAdsBootstrap() {
  useEffect(() => {
    mobileAds()
      .initialize()
      .then(() => {
        preloadRewardedAd();
      })
      .catch((error) => {
        if (__DEV__) {
          console.warn('[Ads] Mobile Ads init failed:', error);
        }
      });
  }, []);

  return null;
}
