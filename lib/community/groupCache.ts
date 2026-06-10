import type { FitnessGroup } from '../../types/trainer';

const byId = new Map<string, FitnessGroup>();

export function cacheFitnessGroups(groups: FitnessGroup[]): void {
  for (const group of groups) {
    byId.set(group.id, group);
  }
}

export function getCachedFitnessGroup(id: string): FitnessGroup | undefined {
  return byId.get(id);
}
