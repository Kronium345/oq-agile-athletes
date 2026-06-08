import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
} from 'react-native-google-mobile-ads';
import { usePremium } from '../../app/PremiumProvider';
import { getBannerAdUnitId } from '../../constants/ads';
import { SPACING } from '../../constants/theme';

type Props = {
  /** Extra top margin before the banner. */
  marginTop?: number;
};

/**
 * Anchored adaptive banner for non-premium users on low-friction screens.
 * Premium subscribers see no ads.
 */
export function AppBannerAd({ marginTop = SPACING.md }: Props) {
  const { isPremium, isLoading } = usePremium();
  const [failed, setFailed] = useState(false);

  if (isLoading || isPremium || failed) {
    return null;
  }

  return (
    <View style={[styles.wrap, { marginTop }]}>
      <BannerAd
        unitId={getBannerAdUnitId()}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    overflow: 'hidden',
  },
});
