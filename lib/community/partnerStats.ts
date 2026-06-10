import {
  formatGenderForDisplay,
  formatProfileStatLabel,
  formatWeightForDisplay,
} from '../profile/display';
import type { TrainingPartner } from '../../types/trainer';

export type PartnerStatChip = {
  key: string;
  label: string;
};

export function getPartnerStatChips(partner: TrainingPartner): PartnerStatChip[] {
  const chips: PartnerStatChip[] = [];

  const gender = formatGenderForDisplay(partner.gender);
  if (gender) {
    chips.push({ key: 'gender', label: formatProfileStatLabel(gender) });
  }

  const experience = String(partner.experience ?? '').trim();
  if (experience) {
    chips.push({
      key: 'experience',
      label: formatProfileStatLabel(experience),
    });
  }

  const weightStr = formatWeightForDisplay(partner.weight);
  if (weightStr) {
    chips.push({
      key: 'weight',
      label: `${weightStr} ${partner.unit ?? 'kg'}`,
    });
  }

  const goal = String(partner.goal ?? '').trim();
  if (goal) {
    chips.push({ key: 'goal', label: `Goal: ${goal}` });
  }

  return chips;
}
