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
  parseMemberIdsInput,
  updateTrainerVideoAssignments,
  uploadTrainerVideo,
} from '../../services/trainerContentApi';
import type { TrainerVideo } from '../../types/trainer';

export default function TrainerLibraryScreen() {
  const [videos, setVideos] = useState<TrainerVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignees, setAssignees] = useState('');
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAssignees, setEditingAssignees] = useState('');

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

  const pickVideo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Toast.show({ type: 'error', text1: 'Allow photo library access' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: 300,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setPickedUri(result.assets[0].uri);
      Toast.show({ type: 'success', text1: 'Video selected' });
    }
  };

  const handleUpload = async () => {
    if (!pickedUri) {
      Toast.show({ type: 'error', text1: 'Pick a video first' });
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
        assignedMemberIds: parseMemberIdsInput(assignees),
      });
      setTitle('');
      setDescription('');
      setAssignees('');
      setPickedUri(null);
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

  const startAssign = (video: TrainerVideo) => {
    setEditingId(video.id);
    setEditingAssignees(video.assignedMemberIds.join(', '));
  };

  const saveAssign = async (videoId: string) => {
    try {
      await updateTrainerVideoAssignments(
        videoId,
        parseMemberIdsInput(editingAssignees),
      );
      setEditingId(null);
      Toast.show({ type: 'success', text1: 'Assignments updated' });
      load();
    } catch {
      Toast.show({ type: 'error', text1: 'Could not update' });
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
          <Text style={styles.cardMeta}>
            {item.assignedMemberIds.length} client
            {item.assignedMemberIds.length === 1 ? '' : 's'} assigned
            {item.durationSec
              ? ` · ${formatVideoDuration(item.durationSec)}`
              : ''}
          </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => Linking.openURL(item.playUrl)}>
          <Text style={styles.link}>Preview</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => startAssign(item)}>
          <Text style={styles.link}>Assign</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)}>
          <Text style={styles.danger}>Delete</Text>
        </TouchableOpacity>
      </View>
      {editingId === item.id ? (
        <View style={styles.assignBox}>
          <Text style={styles.label}>Client user IDs</Text>
          <TextInput
            style={styles.input}
            value={editingAssignees}
            onChangeText={setEditingAssignees}
            placeholder='Comma-separated MongoDB _id values'
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize='none'
          />
          <View style={styles.uploadRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => setEditingId(null)}
            >
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => saveAssign(item.id)}
            >
              <Text style={styles.primaryBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
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
          <Text style={styles.label}>Assign to user IDs (optional)</Text>
          <TextInput
            style={styles.input}
            value={assignees}
            onChangeText={setAssignees}
            placeholder='MongoDB user _id values, comma-separated'
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize='none'
          />
          <View style={styles.uploadRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={pickVideo}>
              <Ionicons name='folder-open-outline' size={18} color={COLORS.primary} />
              <Text style={styles.secondaryBtnText}>
                {pickedUri ? 'Change video' : 'Pick video'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, uploading && styles.disabled]}
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
  primaryBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  assignBox: { marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
});
