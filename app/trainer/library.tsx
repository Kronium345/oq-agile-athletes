import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import BackgroundGradient from '../../components/BackgroundGradient';
import { TrainerScreenHeader } from '../../components/trainers/TrainerScreenHeader';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import {
  deleteTrainerVideo,
  formatVideoDuration,
  listMyTrainerVideos,
  uploadTrainerVideo,
} from '../../services/trainerContentApi';
import type { TrainerVideo } from '../../types/trainer';

const MAX_COACH_VIDEO_SEC = 300;

export default function TrainerLibraryScreen() {
  const [videos, setVideos] = useState<TrainerVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [videoLabel, setVideoLabel] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setVideos(await listMyTrainerVideos());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const ensureVideoPermission = async (source: 'library' | 'camera') => {
    const request =
      source === 'library'
        ? ImagePicker.requestMediaLibraryPermissionsAsync
        : ImagePicker.requestCameraPermissionsAsync;
    const permission = await request();
    if (!permission.granted) {
      Toast.show({
        type: 'error',
        text1: 'Permission needed',
        text2:
          source === 'library'
            ? 'Allow photo library access to pick a video.'
            : 'Allow camera access to record a video.',
      });
      return false;
    }
    return true;
  };

  const handleVideoReady = (uri: string, label: string) => {
    setPickedUri(uri);
    setVideoLabel(label);
    Toast.show({ type: 'success', text1: label, text2: 'Tap Upload when ready.' });
  };

  const pickVideo = async () => {
    if (!(await ensureVideoPermission('library'))) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: MAX_COACH_VIDEO_SEC,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      handleVideoReady(result.assets[0].uri, 'Video selected');
    }
  };

  const recordVideo = async () => {
    if (!(await ensureVideoPermission('camera'))) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: MAX_COACH_VIDEO_SEC,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      handleVideoReady(result.assets[0].uri, 'Video recorded');
    }
  };

  const handleUpload = async () => {
    if (!pickedUri) {
      Toast.show({
        type: 'error',
        text1: 'No video yet',
        text2: 'Record or pick a video first.',
      });
      return;
    }
    if (!title.trim()) {
      Toast.show({ type: 'error', text1: 'Add a title' });
      return;
    }
    setUploading(true);
    try {
      await uploadTrainerVideo(pickedUri, {
        title: title.trim(),
        description: description.trim() || undefined,
      });
      setTitle('');
      setDescription('');
      setPickedUri(null);
      setVideoLabel(null);
      Toast.show({ type: 'success', text1: 'Video uploaded' });
      load();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'Upload failed',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (video: TrainerVideo) => {
    Alert.alert('Delete video?', video.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const ok = await deleteTrainerVideo(video.id);
          Toast.show({
            type: ok ? 'success' : 'error',
            text1: ok ? 'Deleted' : 'Could not delete',
          });
          if (ok) load();
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: TrainerVideo }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Ionicons name='videocam' size={22} color={COLORS.primary} />
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {item.description ? (
            <Text style={styles.cardMeta} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          {item.durationSec ? (
            <Text style={styles.cardMeta}>
              {formatVideoDuration(item.durationSec)}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => Linking.openURL(item.playUrl)}>
          <Text style={styles.link}>Preview</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)}>
          <Text style={styles.danger}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TrainerScreenHeader
          title='Coach video library'
          subtitle='Upload clips for your clients'
        />
        <View style={styles.uploadBox}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder='e.g. Squat depth check'
            placeholderTextColor={COLORS.textSecondary}
          />
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={description}
            onChangeText={setDescription}
            placeholder='Coaching cues for your client'
            placeholderTextColor={COLORS.textSecondary}
            multiline
          />
          <View style={styles.uploadRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={pickVideo}>
              <Ionicons name='folder-open-outline' size={18} color={COLORS.primary} />
              <Text style={styles.secondaryBtnText}>
                {pickedUri ? 'Change' : 'Pick video'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={recordVideo}>
              <Ionicons name='videocam-outline' size={18} color={COLORS.primary} />
              <Text style={styles.secondaryBtnText}>Record video</Text>
            </TouchableOpacity>
          </View>
          {videoLabel ? (
            <View style={styles.videoStatus}>
              <Ionicons name='checkmark-circle' size={18} color={COLORS.primary} />
              <Text style={styles.videoStatusText}>{videoLabel}</Text>
              <TouchableOpacity
                onPress={() => {
                  setPickedUri(null);
                  setVideoLabel(null);
                }}
              >
                <Text style={styles.clearVideo}>Clear</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <TouchableOpacity
            style={[styles.uploadBtn, uploading && styles.disabled]}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color={COLORS.textButton} />
            ) : (
              <Text style={styles.primaryBtnText}>Upload</Text>
            )}
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={videos}
            keyExtractor={(v) => v.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.empty}>No videos yet. Upload your first clip.</Text>
            }
          />
        )}
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: SPACING.md },
  uploadBox: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.sm,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  uploadRow: { flexDirection: 'row', gap: 8, marginTop: SPACING.sm },
  videoStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.primaryLight,
  },
  videoStatusText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.small,
  },
  clearVideo: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  uploadBtn: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.borderOrange,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
  },
  secondaryBtnText: { color: COLORS.primary, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  primaryBtnText: { color: COLORS.textButton, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  disabled: { opacity: 0.6 },
  loader: { marginTop: 24 },
  list: { paddingBottom: SPACING.xl },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 24 },
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardRow: { flexDirection: 'row', gap: 12 },
  cardBody: { flex: 1 },
  cardTitle: { fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.textPrimary },
  cardMeta: { fontSize: TYPOGRAPHY.fontSize.small, color: COLORS.textSecondary, marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: 16, marginTop: SPACING.sm },
  link: { color: COLORS.primary, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  danger: { color: COLORS.error },
});
