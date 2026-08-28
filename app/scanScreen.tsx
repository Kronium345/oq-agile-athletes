import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { AppBannerAd } from '../components/ads/AppBannerAd';
import BackgroundGradient from '../components/BackgroundGradient';
import FoodThumbnail from '../components/FoodThumbnail';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../constants/theme';
import { usePremiumGate } from '../hooks/usePremiumGate';
import {
  analyzeFoodScan,
  confirmFoodPick,
  FoodSearchResult,
  normalizeNutrients,
  ScannedFoodItem,
  searchFoods,
  VisionSuggestion,
} from '../services/foodApi';
import { useAuthContext } from './AuthProvider';

export default function ScanScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const userId = user?._id || user?.userId || '';
  const { requirePremium } = usePremiumGate('Food Scan');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [primary, setPrimary] = useState<ScannedFoodItem | null>(null);
  const [needsPick, setNeedsPick] = useState(false);
  const [suggestion, setSuggestion] = useState<VisionSuggestion | null>(null);
  const [alternates, setAlternates] = useState<ScannedFoodItem[]>([]);
  const [pickMessage, setPickMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const scanLine = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      requirePremium();
    }, [requirePremium]),
  );

  useEffect(() => {
    scanLine.value = withRepeat(withTiming(1, { duration: 1800 }), -1, true);
  }, [scanLine]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLine.value * 180 }],
  }));

  const resetResults = () => {
    setPrimary(null);
    setNeedsPick(false);
    setSuggestion(null);
    setAlternates([]);
    setPickMessage(null);
    setErrorMessage(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const pickImage = async (source: 'library' | 'camera') => {
    const permission =
      source === 'library'
        ? await ImagePicker.requestMediaLibraryPermissionsAsync()
        : await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Toast.show({
        type: 'info',
        text1: 'Permission needed',
        text2:
          source === 'library'
            ? 'Allow photo library access to scan food.'
            : 'Allow camera access to scan food.',
        position: 'bottom',
      });
      return;
    }

    const picker =
      source === 'library'
        ? ImagePicker.launchImageLibraryAsync
        : ImagePicker.launchCameraAsync;

    const result = await picker({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets?.[0]?.base64) return;

    const asset = result.assets[0];
    const base64 = asset.base64;
    if (!base64) return;

    setImageUri(asset.uri);
    resetResults();
    await analyzeImage(base64);
  };

  const analyzeImage = async (base64: string) => {
    if (!userId) {
      Toast.show({
        type: 'error',
        text1: 'Not signed in',
        text2: 'Sign in to save scans.',
        position: 'bottom',
      });
      return;
    }

    setScanning(true);
    try {
      const outcome = await analyzeFoodScan({ userId, imageBase64: base64 });

      if (outcome.kind === 'not_food') {
        setErrorMessage(outcome.message);
        setPrimary(null);
        setNeedsPick(false);
        return;
      }

      if (outcome.kind === 'needs_pick') {
        setNeedsPick(true);
        setSuggestion(outcome.suggestion);
        setAlternates(outcome.alternates);
        setPickMessage(outcome.message ?? null);
        setPrimary(null);
        setErrorMessage(null);
        setSearchQuery(outcome.suggestion?.name ?? '');
        Toast.show({
          type: 'info',
          text1: 'Confirm your meal',
          text2: 'Pick a match or search to log nutrition.',
          position: 'bottom',
        });
        return;
      }

      setPrimary(outcome.primary);
      setNeedsPick(false);
      setErrorMessage(null);
      Toast.show({
        type: 'success',
        text1: 'Meal logged',
        text2: outcome.primary.name,
        position: 'bottom',
      });
    } catch (e: any) {
      setErrorMessage(e?.message ?? 'Failed to analyze image.');
      setPrimary(null);
      setNeedsPick(false);
    } finally {
      setScanning(false);
    }
  };

  const handleConfirm = async (foodName: string) => {
    if (!userId || !foodName.trim()) return;

    setConfirming(true);
    try {
      const confirmed = await confirmFoodPick({
        userId,
        foodName: foodName.trim(),
      });
      if (!confirmed.primary) {
        throw new Error('Could not save food');
      }
      setPrimary(confirmed.primary);
      setNeedsPick(false);
      setAlternates([]);
      setSuggestion(null);
      setPickMessage(null);
      setSearchResults([]);
      Toast.show({
        type: 'success',
        text1: 'Meal logged',
        text2: confirmed.primary.name,
        position: 'bottom',
      });
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not save food',
        text2: e?.message ?? 'Try again.',
        position: 'bottom',
      });
    } finally {
      setConfirming(false);
    }
  };

  const handleSearch = async () => {
    const term = searchQuery.trim();
    if (!term) return;

    setSearching(true);
    try {
      const results = await searchFoods(term, 8);
      setSearchResults(results);
      if (results.length === 0) {
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
      setSearching(false);
    }
  };

  const totals = useMemo(
    () => normalizeNutrients(primary?.nutrients),
    [primary],
  );

  const handleRetake = () => {
    setImageUri(null);
    resetResults();
  };

  const chipCandidates = useMemo(() => {
    const names = new Set<string>();
    const chips: { name: string; confidence?: number }[] = [];
    if (suggestion?.name) {
      names.add(suggestion.name.toLowerCase());
      chips.push(suggestion);
    }
    for (const item of alternates) {
      const key = item.name.toLowerCase();
      if (names.has(key)) continue;
      names.add(key);
      chips.push({ name: item.name, confidence: item.confidence });
    }
    return chips;
  }, [suggestion, alternates]);

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
          <Text style={styles.headerTitle}>Food Scan</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps='handled'
        >
          <View style={styles.pickerCard}>
            <TouchableOpacity
              onPress={() => pickImage('library')}
              disabled={scanning || confirming}
              activeOpacity={0.9}
            >
              {imageUri ? (
                <View style={styles.previewWrap}>
                  <Image source={{ uri: imageUri }} style={styles.preview} />
                  {scanning ? (
                    <Animated.View style={[styles.scanBar, scanLineStyle]} />
                  ) : null}
                </View>
              ) : (
                <View style={styles.placeholder}>
                  <Ionicons name='image' size={42} color={COLORS.primary} />
                  <Text style={styles.placeholderText}>
                    Tap to choose a meal photo
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.sourceRow}>
              <TouchableOpacity
                style={styles.sourceBtn}
                onPress={() => pickImage('camera')}
                disabled={scanning || confirming}
              >
                <Ionicons
                  name='camera-outline'
                  size={18}
                  color={COLORS.primary}
                />
                <Text style={styles.sourceBtnText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sourceBtn}
                onPress={() => pickImage('library')}
                disabled={scanning || confirming}
              >
                <Ionicons
                  name='images-outline'
                  size={18}
                  color={COLORS.primary}
                />
                <Text style={styles.sourceBtnText}>Library</Text>
              </TouchableOpacity>
            </View>
          </View>

          {scanning ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.loadingText}>
                Analyzing meal… (may take up to a minute)
              </Text>
            </View>
          ) : null}

          {errorMessage ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetake}>
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {needsPick && !primary ? (
            <View style={styles.pickCard}>
              <Text style={styles.pickTitle}>Confirm what you ate</Text>
              <Text style={styles.pickBody}>
                {pickMessage ||
                  'Not confident enough to auto-log. Pick a match or search — totals stay empty until you confirm.'}
              </Text>

              {chipCandidates.length > 0 ? (
                <View style={styles.chipWrap}>
                  {chipCandidates.map((chip) => (
                    <TouchableOpacity
                      key={chip.name}
                      style={styles.chip}
                      disabled={confirming}
                      onPress={() => handleConfirm(chip.name)}
                    >
                      <Text style={styles.chipText}>{chip.name}</Text>
                      {typeof chip.confidence === 'number' ? (
                        <Text style={styles.chipMeta}>
                          {(chip.confidence * 100).toFixed(0)}%
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}

              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder='Search foods…'
                  placeholderTextColor={COLORS.textSecondary}
                  editable={!confirming}
                  onSubmitEditing={handleSearch}
                  returnKeyType='search'
                />
                <TouchableOpacity
                  style={styles.searchBtn}
                  onPress={handleSearch}
                  disabled={searching || confirming}
                >
                  {searching ? (
                    <ActivityIndicator color={COLORS.textButton} />
                  ) : (
                    <Ionicons name='search' size={18} color={COLORS.textButton} />
                  )}
                </TouchableOpacity>
              </View>

              {searchResults.map((item) => {
                const n = normalizeNutrients(item.nutrients);
                return (
                  <TouchableOpacity
                    key={item.name}
                    style={styles.searchResult}
                    disabled={confirming}
                    onPress={() => handleConfirm(item.name)}
                  >
                    <FoodThumbnail uri={item.imageUrl} size={44} />
                    <View style={styles.searchResultText}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemMeta}>
                        {Math.round(n.calories)} kcal · P{' '}
                        {Math.round(n.protein)}g · C {Math.round(n.carbs)}g · F{' '}
                        {Math.round(n.fats)}g
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {confirming ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={COLORS.primary} />
                  <Text style={styles.loadingText}>Saving meal…</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {primary ? (
            <>
              <View style={styles.totalsCard}>
                <Text style={styles.totalsTitle}>Meal nutrition</Text>
                <Text style={styles.totalsValue}>
                  {Math.round(totals.calories)} kcal
                </Text>
                <Text style={styles.totalsMeta}>
                  P {Math.round(totals.protein)}g · C {Math.round(totals.carbs)}g
                  · F {Math.round(totals.fats)}g
                </Text>
              </View>

              <View style={styles.itemCard}>
                <Text style={styles.itemName}>{primary.name}</Text>
                {primary.confidence > 0 ? (
                  <Text style={styles.itemConfidence}>
                    {(primary.confidence * 100).toFixed(0)}% match
                  </Text>
                ) : null}
                <Text style={styles.itemMeta}>
                  {Math.round(totals.calories)} kcal · P{' '}
                  {Math.round(totals.protein)}g · C {Math.round(totals.carbs)}g ·
                  F {Math.round(totals.fats)}g
                </Text>
              </View>

              <TouchableOpacity style={styles.doneButton} onPress={handleRetake}>
                <Text style={styles.doneText}>Scan another meal</Text>
              </TouchableOpacity>
            </>
          ) : null}

          <AppBannerAd marginBottom={SPACING.xxl} />
        </ScrollView>
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
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  pickerCard: {
    borderRadius: BORDER_RADIUS.large,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundCard,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  previewWrap: { position: 'relative', height: 240 },
  preview: { width: '100%', height: 240 },
  scanBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.primary,
  },
  placeholder: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  placeholderText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  sourceRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  sourceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
  },
  sourceBtnText: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  loadingText: { color: COLORS.textSecondary, flex: 1 },
  errorCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.regular,
    marginBottom: SPACING.sm,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.small,
  },
  retryText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  pickCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  pickTitle: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  pickBody: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
    lineHeight: 20,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.medium,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
  },
  chipText: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.small,
  },
  chipMeta: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    marginTop: 2,
  },
  searchRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.medium,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  searchBtn: {
    width: 44,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    marginTop: SPACING.xs,
  },
  searchResultText: { flex: 1 },
  totalsCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  totalsTitle: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  totalsValue: {
    color: COLORS.primary,
    fontSize: 32,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginVertical: SPACING.xs,
  },
  totalsMeta: { color: COLORS.textSecondary },
  itemCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  itemName: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
  itemConfidence: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.small,
    marginTop: 2,
  },
  itemMeta: {
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.small,
  },
  doneButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.medium,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  doneText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
});
