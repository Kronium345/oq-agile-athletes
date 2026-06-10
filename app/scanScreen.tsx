import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
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
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../constants/theme';
import { usePremiumGate } from '../hooks/usePremiumGate';
import {
  analyzeFoodImage,
  normalizeNutrients,
  persistFoodScan,
  ScannedFoodItem,
  sumScanNutrients,
} from '../services/foodApi';
import { useAuthContext } from './AuthProvider';

export default function ScanScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const userId = user?._id || user?.userId || '';
  const { requirePremium } = usePremiumGate('Food Scan');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [foodItems, setFoodItems] = useState<ScannedFoodItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const scanLine = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      requirePremium();
    }, [requirePremium]),
  );

  useEffect(() => {
    scanLine.value = withRepeat(withTiming(1, { duration: 1800 }), -1, true);
  }, []);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLine.value * 180 }],
  }));

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({
        type: 'info',
        text1: 'Permission needed',
        text2: 'Allow photo library access to scan food.',
        position: 'bottom',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets?.[0]?.base64) return;

    const asset = result.assets[0];
    const base64 = asset.base64;
    if (!base64) return;

    setImageUri(asset.uri);
    setFoodItems([]);
    setErrorMessage(null);
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
      const token =
        (await AsyncStorage.getItem('session')) ||
        (await AsyncStorage.getItem('token'));

      const preview = await analyzeFoodImage(base64, token);

      if (!preview.isFood || !preview.foodItems?.length) {
        setErrorMessage(
          preview.joke || "Couldn't detect food. Try another photo.",
        );
        setFoodItems([]);
        return;
      }

      setFoodItems(preview.foodItems);
      setErrorMessage(null);

      await persistFoodScan(userId, base64).catch(() => {
        Toast.show({
          type: 'info',
          text1: 'Scan displayed',
          text2: 'Could not save scan to history yet.',
          position: 'bottom',
        });
      });

      Toast.show({
        type: 'success',
        text1: 'Food detected',
        text2: `${preview.foodItems.length} item(s) found.`,
        position: 'bottom',
      });
    } catch (e: any) {
      setErrorMessage(e?.message ?? 'Failed to analyze image.');
      setFoodItems([]);
    } finally {
      setScanning(false);
    }
  };

  const totals = sumScanNutrients(foodItems);

  const handleRetake = () => {
    setImageUri(null);
    setFoodItems([]);
    setErrorMessage(null);
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
          <Text style={styles.headerTitle}>Food Scan</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity
            style={styles.pickerCard}
            onPress={pickImage}
            disabled={scanning}
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

          {scanning ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.loadingText}>Analyzing meal...</Text>
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

          {foodItems.length > 0 ? (
            <>
              <View style={styles.totalsCard}>
                <Text style={styles.totalsTitle}>Total nutrition</Text>
                <Text style={styles.totalsValue}>
                  {Math.round(totals.calories)} kcal
                </Text>
                <Text style={styles.totalsMeta}>
                  P {Math.round(totals.protein)}g · C {Math.round(totals.carbs)}g
                  · F {Math.round(totals.fats)}g
                </Text>
              </View>

              {foodItems.map((item, index) => {
                const n = normalizeNutrients(item.nutrients);
                return (
                  <View key={`${item.name}-${index}`} style={styles.itemCard}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemConfidence}>
                      {(item.confidence * 100).toFixed(0)}% match
                    </Text>
                    <Text style={styles.itemMeta}>
                      {Math.round(n.calories)} kcal · P {Math.round(n.protein)}g
                      · C {Math.round(n.carbs)}g · F {Math.round(n.fats)}g
                    </Text>
                  </View>
                );
              })}

              <TouchableOpacity style={styles.doneButton} onPress={handleRetake}>
                <Text style={styles.doneText}>Scan another meal</Text>
              </TouchableOpacity>
            </>
          ) : null}

          <AppBannerAd />
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
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  placeholderText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  loadingText: { color: COLORS.textSecondary },
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
  retryText: { color: COLORS.textButton, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
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
