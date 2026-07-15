import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import Toast from 'react-native-toast-message';
import { usePremium } from '../app/PremiumProvider';
import { premiumFeatureDisplayLabel } from '../constants/premiumCopy';

export function usePremiumGate(featureLabel = 'Premium feature') {
  const router = useRouter();
  const { isPremium, isLoading } = usePremium();

  const requirePremium = useCallback(() => {
    if (isLoading) return false;
    if (isPremium) return true;

    Toast.show({
      type: 'info',
      text1: premiumFeatureDisplayLabel(featureLabel),
      text2: 'Upgrade to Premium to unlock this.',
      position: 'bottom',
    });
    router.replace('/subscription' as any);
    return false;
  }, [featureLabel, isPremium, isLoading, router]);

  return { isPremium, isLoading, requirePremium };
}
