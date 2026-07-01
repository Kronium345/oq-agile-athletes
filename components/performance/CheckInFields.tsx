import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

const CHIP_GAP = 4;

type ScaleProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  lowLabel?: string;
  highLabel?: string;
};

export function RatingScale({
  label,
  value,
  min = 1,
  max = 10,
  onChange,
  lowLabel,
  highLabel,
}: ScaleProps) {
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {values.map((n) => {
          const selected = n === value;
          return (
            <TouchableOpacity
              key={n}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => onChange(n)}
            >
              <Text
                style={[styles.chipText, selected && styles.chipTextSelected]}
              >
                {n}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {lowLabel || highLabel ? (
        <View style={styles.hintRow}>
          <Text style={styles.hint}>{lowLabel ?? ''}</Text>
          <Text style={styles.hint}>{highLabel ?? ''}</Text>
        </View>
      ) : null}
    </View>
  );
}

type NumberFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  unit?: string;
  keyboardType?: 'decimal-pad' | 'number-pad';
};

export function NumberField({
  label,
  value,
  onChange,
  placeholder,
  unit,
  keyboardType = 'decimal-pad',
}: NumberFieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          keyboardType={keyboardType}
        />
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

type ToggleRowProps = {
  label: string;
  value: boolean;
  onToggle: () => void;
};

export function ToggleRow({ label, value, onToggle }: ToggleRowProps) {
  return (
    <TouchableOpacity style={styles.toggleRow} onPress={onToggle}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.toggle, value && styles.toggleOn]}>
        <Ionicons
          name={value ? 'checkmark' : 'close'}
          size={16}
          color={value ? '#fff' : COLORS.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: SPACING.lg, alignSelf: 'stretch', width: '100%' },
  fieldWrap: { marginBottom: SPACING.lg },
  label: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    width: '100%',
    gap: CHIP_GAP,
  },
  chip: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  chipTextSelected: {
    color: '#fff',
  },
  hintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
    alignSelf: 'stretch',
    width: '100%',
  },
  hint: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.textSecondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.medium,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.backgroundCard,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.medium,
    color: COLORS.textPrimary,
  },
  unit: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  toggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundAlt,
  },
  toggleOn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
});
