import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import {
  DeviceLocationResult,
  getDevicePostcode,
} from '../../lib/trainers/location';

type Props = {
  onResolved: (result: DeviceLocationResult) => void;
  label?: string;
  variant?: 'outline' | 'filled';
};

export function UseMyLocationButton({
  onResolved,
  label = 'Use my location',
  variant = 'outline',
}: Props) {
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    setLoading(true);
    try {
      const result = await getDevicePostcode();
      onResolved(result);
      Toast.show({
        type: 'success',
        text1: 'Location set',
        text2: result.postcode,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not get location';
      Toast.show({ type: 'error', text1: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        variant === 'filled' ? styles.filled : styles.outline,
        loading && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator
          size='small'
          color={variant === 'filled' ? COLORS.textButton : COLORS.primary}
        />
      ) : (
        <Ionicons
          name='locate'
          size={18}
          color={variant === 'filled' ? COLORS.textButton : COLORS.primary}
        />
      )}
      <Text
        style={[
          styles.text,
          variant === 'filled' ? styles.textFilled : styles.textOutline,
        ]}
      >
        {loading ? 'Getting location…' : label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
  },
  outline: {
    borderWidth: 1,
    borderColor: COLORS.borderOrange,
    backgroundColor: COLORS.primaryLight,
  },
  filled: {
    backgroundColor: COLORS.primary,
  },
  disabled: { opacity: 0.7 },
  text: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  textOutline: { color: COLORS.primary },
  textFilled: { color: COLORS.textButton },
});
