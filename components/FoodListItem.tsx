import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { logFoodItem } from '../services/foodApi';
import FoodThumbnail from './FoodThumbnail';

export type FoodSearchItem = {
  label: string;
  cal: number;
  carbohydrates: number;
  fats: number;
  proteins: number;
  sugars: number;
  imageUrl?: string;
};

type Props = {
  item: FoodSearchItem;
  userId: string;
  showAddButton?: boolean;
  onFoodAdded?: () => void;
};

export default function FoodListItem({
  item,
  userId,
  showAddButton = false,
  onFoodAdded,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    setLoading(true);
    try {
      await logFoodItem({
        userId,
        label: item.label,
        cal: item.cal,
        carbohydrates: item.carbohydrates,
        fats: item.fats,
        proteins: item.proteins,
        sugars: item.sugars,
        imageUrl: item.imageUrl,
      });
      Toast.show({
        type: 'success',
        text1: 'Food logged',
        text2: `${item.label} added to today.`,
        position: 'bottom',
      });
      onFoodAdded?.();
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Log failed',
        text2: e?.message ?? 'Try again.',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.row}>
      <FoodThumbnail uri={item.imageUrl} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.label} numberOfLines={2}>
          {item.label}
        </Text>
        <Text style={styles.meta}>
          {Math.round(item.cal)} kcal · P {Math.round(item.proteins)}g · C{' '}
          {Math.round(item.carbohydrates)}g · F {Math.round(item.fats)}g
        </Text>
        <Text style={styles.per100}>Per 100g</Text>
      </View>
      {showAddButton ? (
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAdd}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.textButton} size='small' />
          ) : (
            <Text style={styles.addText}>+</Text>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  image: {
    marginRight: SPACING.md,
  },
  content: { flex: 1 },
  label: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  meta: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
  },
  per100: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  addText: {
    color: COLORS.textButton,
    fontSize: 22,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    lineHeight: 24,
  },
});
