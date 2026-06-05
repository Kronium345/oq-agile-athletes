import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { TRAINER_SPECIALTIES } from '../../lib/trainers/constants';

type Props = {
  selectedSpecialty?: string;
  onSelectSpecialty: (value?: string) => void;
  filterMode: 'all' | 'gym' | 'near';
  onFilterModeChange: (mode: 'all' | 'gym' | 'near') => void;
};

export function TrainerFilters({
  selectedSpecialty,
  onSelectSpecialty,
  filterMode,
  onFilterModeChange,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.tabs}>
        {(['all', 'gym', 'near'] as const).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.tab, filterMode === mode && styles.tabActive]}
            onPress={() => onFilterModeChange(mode)}
          >
            <Text style={[styles.tabText, filterMode === mode && styles.tabTextActive]}>
              {mode === 'all' ? 'All' : mode === 'gym' ? 'My gym' : 'Near me'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        <TouchableOpacity
          style={[styles.chip, !selectedSpecialty && styles.chipActive]}
          onPress={() => onSelectSpecialty(undefined)}
        >
          <Text style={[styles.chipText, !selectedSpecialty && styles.chipTextActive]}>
            All specialties
          </Text>
        </TouchableOpacity>
        {TRAINER_SPECIALTIES.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, selectedSpecialty === s && styles.chipActive]}
            onPress={() => onSelectSpecialty(s)}
          >
            <Text
              style={[styles.chipText, selectedSpecialty === s && styles.chipTextActive]}
            >
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: SPACING.md },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: SPACING.sm },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.backgroundAlt,
  },
  tabActive: { backgroundColor: COLORS.primaryLight },
  tabText: { fontSize: TYPOGRAPHY.fontSize.small, color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  chips: { flexGrow: 0 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.large,
    backgroundColor: COLORS.backgroundAlt,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  chipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.borderOrange,
  },
  chipText: { fontSize: TYPOGRAPHY.fontSize.small, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.primary, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
});
