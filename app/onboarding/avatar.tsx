import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import OnboardingScreen, {
  OnboardingPrimaryButton,
} from '../../components/onboarding/OnboardingScreen';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../constants/theme';
import { saveOnboardingProfile } from '../../lib/onboarding/storage';
import { AVATAR_PRESETS } from '../../lib/onboarding/types';

export default function AvatarScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [customUri, setCustomUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Allow photo access to upload a profile picture.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCustomUri(result.assets[0].uri);
      setSelected(result.assets[0].uri);
    }
  };

  const continueFlow = async () => {
    const avatar = selected ?? customUri;
    if (!avatar) {
      Toast.show({
        type: 'error',
        text1: 'Choose an avatar or upload a photo',
        position: 'bottom',
      });
      return;
    }

    setSaving(true);
    try {
      await saveOnboardingProfile({ avatar });
      router.push('/onboarding/weight' as any);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Could not save your avatar',
        position: 'bottom',
      });
    } finally {
      setSaving(false);
    }
  };

  const previewUri = customUri ?? selected;

  return (
    <OnboardingScreen
      step={3}
      title="Choose your avatar"
      subtitle="Pick a preset or upload your own photo. Saved on this device until your profile syncs."
      footer={
        <OnboardingPrimaryButton
          label={saving ? 'Saving…' : 'Continue'}
          onPress={continueFlow}
          disabled={saving || !previewUri}
        />
      }
    >
      <View style={styles.grid}>
        {AVATAR_PRESETS.map((uri) => (
          <TouchableOpacity
            key={uri}
            onPress={() => {
              setSelected(uri);
              setCustomUri(null);
            }}
            style={[
              styles.avatarWrap,
              selected === uri && !customUri && styles.avatarWrapSelected,
            ]}
          >
            <Image source={{ uri }} style={styles.avatar} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
        <Ionicons name="cloud-upload-outline" size={22} color={COLORS.primary} />
        <Text style={styles.uploadText}>Upload your own</Text>
      </TouchableOpacity>

      {previewUri ? (
        <View style={styles.previewBlock}>
          <Image source={{ uri: previewUri }} style={styles.previewImage} />
        </View>
      ) : null}

      {saving ? (
        <ActivityIndicator color={COLORS.primary} style={styles.loader} />
      ) : null}
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  avatarWrap: {
    borderRadius: BORDER_RADIUS.circle,
    padding: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarWrapSelected: {
    borderColor: COLORS.primary,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.backgroundAlt,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 2,
    borderColor: COLORS.borderOrange,
    borderStyle: 'dashed',
    marginBottom: SPACING.sm,
  },
  uploadText: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
  previewBlock: {
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  previewImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.card,
  },
  loader: {
    marginTop: SPACING.sm,
  },
});
