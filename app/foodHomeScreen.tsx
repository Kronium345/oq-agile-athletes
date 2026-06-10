import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import BackgroundGradient from '../components/BackgroundGradient';
import FoodListItem, { FoodSearchItem } from '../components/FoodListItem';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../constants/theme';
import { usePremiumGate } from '../hooks/usePremiumGate';
import { useAuthContext } from './AuthProvider';

type OpenFoodFactsProduct = {
  product_name?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    proteins_100g?: number;
    sugars_100g?: number;
  };
  image_url?: string;
  countries?: string;
};

function mapProduct(product: OpenFoodFactsProduct): FoodSearchItem | null {
  const label = product.product_name?.trim();
  if (!label) return null;

  const n = product.nutriments ?? {};
  return {
    label,
    cal: n['energy-kcal_100g'] ?? 0,
    carbohydrates: n.carbohydrates_100g ?? 0,
    fats: n.fat_100g ?? 0,
    proteins: n.proteins_100g ?? 0,
    sugars: n.sugars_100g ?? 0,
    imageUrl: product.image_url,
  };
}

export default function FoodHomeScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const userId = user?._id || user?.userId || '';
  const { requirePremium } = usePremiumGate('Food Tracker');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      requirePremium();
    }, [requirePremium]),
  );

  const handleSearch = async () => {
    const term = query.trim();
    if (!term) return;

    setLoading(true);
    try {
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(term)}&search_simple=1&action=process&json=1&page_size=20`;
      const response = await fetch(url);
      const data = await response.json();
      const mapped = (data.products ?? [])
        .map(mapProduct)
        .filter(Boolean) as FoodSearchItem[];
      setResults(mapped);
      if (mapped.length === 0) {
        Toast.show({
          type: 'info',
          text1: 'No results',
          text2: 'Try a different search term.',
          position: 'bottom',
        });
      }
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Search failed',
        text2: e?.message ?? 'Try again.',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name='chevron-back' size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search Food</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder='Search Open Food Facts...'
            placeholderTextColor={COLORS.textSecondary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType='search'
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            {loading ? (
              <ActivityIndicator color={COLORS.textButton} size='small' />
            ) : (
              <Ionicons name='search' size={20} color={COLORS.textButton} />
            )}
          </TouchableOpacity>
        </View>

        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.label}-${index}`}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <FoodListItem
              item={item}
              userId={userId}
              showAddButton
              onFoodAdded={() => setRefreshKey((k) => k + 1)}
            />
          )}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.emptyText}>
                Search for foods to log manually.
              </Text>
            ) : null
          }
          extraData={refreshKey}
        />
      </SafeAreaView>
      <Toast />
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundCard,
    ...SHADOWS.card,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  headerRight: { width: 36 },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.medium,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundCard,
    color: COLORS.textPrimary,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
});
