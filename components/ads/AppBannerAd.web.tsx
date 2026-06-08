import React from 'react';

type Props = {
  marginTop?: number;
};

/** AdMob banners are native-only; web deploy uses this no-op. */
export function AppBannerAd(_props: Props) {
  return null;
}
