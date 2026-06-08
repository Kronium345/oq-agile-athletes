import { useEffect } from 'react';
import { Platform } from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import { preloadRewardedAd } from '../services/adService';

/** Initializes Google Mobile Ads once on native builds (not Expo Go / web). */
export function AppAdsBootstrap() {
  useEffect(() => {
    if (Platform.OS === 'web') return;

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
