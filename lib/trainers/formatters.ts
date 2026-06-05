import type { PriceUnit, TrainerListItem } from '../../types/trainer';

export function formatTrainerPrice(
  priceFrom?: number,
  priceUnit?: PriceUnit,
): string {
  if (priceFrom == null) return 'Price on request';
  const unit =
    priceUnit === 'hour'
      ? '/hr'
      : priceUnit === 'month'
        ? '/mo'
        : '/session';
  return `From £${priceFrom}${unit}`;
}

export function formatDistanceKm(km?: number): string | null {
  if (km == null) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} mi`;
}

export function formatRating(item: TrainerListItem): string {
  if (!item.reviewCount) return 'No reviews yet';
  return `${item.ratingAvg?.toFixed(1) ?? '—'} (${item.reviewCount})`;
}

export function formatBookingAmount(pence: number, currency = 'gbp'): string {
  const symbol = currency.toLowerCase() === 'gbp' ? '£' : currency.toUpperCase();
  return `${symbol}${(pence / 100).toFixed(2)}`;
}
