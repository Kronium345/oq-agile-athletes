/** Display label for Food Tracker in marketing / premium copy */
export const FOOD_TRACKER_PREMIUM_LABEL = 'Food Tracker (coming soon)';

/** Subscription screen — what Premium includes */
export const PREMIUM_SUBSCRIPTION_BENEFITS =
  'Unlock favorites, workout history, Mind Center, Performance Hub, AI Coach, AI Form Coach, Food Tracker (coming soon), and an ad-free experience.';

/** Profile tab promo card */
export const PREMIUM_PROFILE_PROMO_SUBTITLE =
  'Unlock favorites, workout history, Mind Center, Performance Hub, AI Coach, AI Form Coach, Food Tracker (coming soon), and an ad-free experience.';

const FOOD_PREMIUM_FEATURE_LABELS = new Set([
  'Food Tracker',
  'Food Scan',
  'Food Insights',
]);

export function isFoodPremiumFeature(featureLabel: string): boolean {
  return FOOD_PREMIUM_FEATURE_LABELS.has(featureLabel);
}

export function premiumFeatureDisplayLabel(featureLabel: string): string {
  return isFoodPremiumFeature(featureLabel)
    ? FOOD_TRACKER_PREMIUM_LABEL
    : featureLabel;
}
