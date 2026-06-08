import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

function platformUnitId(iosEnv?: string, androidEnv?: string): string {
  if (__DEV__) {
    return TestIds.ADAPTIVE_BANNER;
  }
  if (Platform.OS === 'ios' && iosEnv) return iosEnv;
  if (Platform.OS === 'android' && androidEnv) return androidEnv;
  return TestIds.ADAPTIVE_BANNER;
}

/** Banner ad unit — set production IDs in EAS env / .env.production. */
export function getBannerAdUnitId(): string {
  return platformUnitId(
    process.env.EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID_IOS,
    process.env.EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID_ANDROID,
  );
}

/** Rewarded ad unit — for optional Form Coach credits later. */
export function getRewardedAdUnitId(): string {
  if (__DEV__) {
    return TestIds.REWARDED;
  }
  const ios = process.env.EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID_IOS;
  const android = process.env.EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID_ANDROID;
  if (Platform.OS === 'ios' && ios) return ios;
  if (Platform.OS === 'android' && android) return android;
  return TestIds.REWARDED;
}
