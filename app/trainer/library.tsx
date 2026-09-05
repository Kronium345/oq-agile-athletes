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
  updateTrainerVideoAssignments,
  uploadTrainerVideo,
} from '../../services/trainerContentApi';
import { listMyTrainerClients } from '../../services/trainersApi';
import type { TrainerClient, TrainerVideo } from '../../types/trainer';

const MAX_COACH_VIDEO_SEC = 300;

function MemberPicker({
  clients,
  selectedIds,
  onToggle,
  onSelectBookings,
  onClear,
  emptyHint,
}: {
  clients: TrainerClient[];
  selectedIds: Set<string>;
  onToggle: (userId: string) => void;
  onSelectBookings: () => void;
  onClear: () => void;
  emptyHint: string;
}) {
  if (clients.length === 0) {
    return <Text style={styles.assigneeHint}>{emptyHint}</Text>;
  }

  return (
    <View>
      <View style={styles.assigneeActions}>
        <TouchableOpacity onPress={onSelectBookings}>
          <Text style={styles.link}>Select from bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClear}>
          <Text style={styles.clearVideo}>Clear</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.chipWrap}>
        {clients.map((client) => {
          const selected = selectedIds.has(client.userId);
          return (
            <TouchableOpacity
              key={client.userId}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => onToggle(client.userId)}
              activeOpacity={0.75}
            >
              <View style={[styles.avatarDot, selected && styles.avatarDotSelected]}>
                <Text style={[styles.avatarLetter, selected && styles.avatarLetterSelected]}>
                  {client.avatarLetter}
                </Text>
              </View>
              <View style={styles.chipTextCol}>
                <Text
                  style={[styles.chipLabel, selected && styles.chipLabelSelected]}
                  numberOfLines={1}
                >
                  {client.displayName}
                </Text>
                <Text style={styles.chipMeta}>
                  {client.sources.includes('booking') ? 'Booking' : 'Lead'}
                  {client.autoAssign ? ' · auto' : ''}
                </Text>
              </View>
              <Ionicons
                name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={selected ? COLORS.primary : COLORS.textSecondary}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.assigneeCount}>
        {selectedIds.size === 0
          ? 'No one selected — video stays private to you until assigned.'
          : `${selectedIds.size} member${selectedIds.size === 1 ? '' : 's'} will see this video.`}
      </Text>
    </View>
  );
}

export default function TrainerLibraryScreen() {
  const [videos, setVideos] = useState<TrainerVideo[]>([]);
  const [clients, setClients] = useState<TrainerClient[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingAssignId, setSavingAssignId] = useState<string | null>(null);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editSelectedIds, setEditSelectedIds] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [videoLabel, setVideoLabel] = useState<string | null>(null);

  const applyAutoAssign = useCallback((list: TrainerClient[]) => {
    setSelectedIds(new Set(list.filter((c) => c.autoAssign).map((c) => c.userId)));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [videoList, clientList] = await Promise.all([
        listMyTrainerVideos(),
        listMyTrainerClients(),
      ]);
      setVideos(videoList);
      setClients(clientList);
      applyAutoAssign(clientList);
    } finally {
      setLoading(false);
    }
  }, [applyAutoAssign]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const toggleSelected = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleEditSelected = (userId: string) => {
    setEditSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

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
        assignedMemberIds: [...selectedIds],
      });
      setTitle('');
      setDescription('');
      setPickedUri(null);
      setVideoLabel(null);
      applyAutoAssign(clients);
      Toast.show({
        type: 'success',
        text1: 'Video uploaded',
        text2:
          selectedIds.size > 0
            ? `Shared with ${selectedIds.size} member${selectedIds.size === 1 ? '' : 's'}.`
            : 'Assign members anytime from the list below.',
      });
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

  const openAssignEditor = (video: TrainerVideo) => {
    setEditingVideoId(video.id);
    setEditSelectedIds(new Set(video.assignedMemberIds));
  };

  const saveAssignments = async (videoId: string) => {
    setSavingAssignId(videoId);
    try {
      const updated = await updateTrainerVideoAssignments(videoId, [...editSelectedIds]);
      setVideos((prev) => prev.map((v) => (v.id === videoId ? updated : v)));
      setEditingVideoId(null);
      Toast.show({ type: 'success', text1: 'Assignments updated' });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'Could not update assignments',
      });
    } finally {
      setSavingAssignId(null);
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
          if (ok) {
            if (editingVideoId === video.id) setEditingVideoId(null);
            load();
          }
        },
      },
    ]);
  };

  const assigneeLabel = (ids: string[]) => {
    if (ids.length === 0) return 'Not assigned';
    const names = ids
      .map((id) => clients.find((c) => c.userId === id)?.displayName)
      .filter(Boolean) as string[];
    if (names.length === 0) return `${ids.length} member${ids.length === 1 ? '' : 's'}`;
    if (names.length <= 2) return names.join(', ');
    return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  };

  const renderItem = ({ item }: { item: TrainerVideo }) => {
    const isEditing = editingVideoId === item.id;
    const saving = savingAssignId === item.id;

    return (
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
            <Text style={styles.cardMeta}>Assigned: {assigneeLabel(item.assignedMemberIds)}</Text>
          </View>
        </View>

        {isEditing ? (
          <View style={styles.editAssignBox}>
            <Text style={styles.label}>Who can watch this?</Text>
            <MemberPicker
              clients={clients}
              selectedIds={editSelectedIds}
              onToggle={toggleEditSelected}
              onSelectBookings={() =>
                setEditSelectedIds(
                  new Set(clients.filter((c) => c.autoAssign).map((c) => c.userId)),
                )
              }
              onClear={() => setEditSelectedIds(new Set())}
              emptyHint='No clients from bookings or leads yet.'
            />
            <View style={styles.editAssignActions}>
              <TouchableOpacity onPress={() => setEditingVideoId(null)}>
                <Text style={styles.clearVideo}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveAssignBtn, saving && styles.disabled]}
                onPress={() => saveAssignments(item.id)}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.textButton} size='small' />
                ) : (
                  <Text style={styles.primaryBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => Linking.openURL(item.playUrl)}>
            <Text style={styles.link}>Preview</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openAssignEditor(item)}>
            <Text style={styles.link}>{isEditing ? 'Editing…' : 'Assign'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)}>
            <Text style={styles.danger}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TrainerScreenHeader
          title='Coach video library'
          subtitle='Upload clips and choose who can watch them'
        />
        <FlatList
          data={videos}
          keyExtractor={(v) => v.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
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
              <Text style={styles.label}>Share with</Text>
              <Text style={styles.assigneeHint}>
                Members with a booking are selected automatically. Tap to change.
              </Text>
              <MemberPicker
                clients={clients}
                selectedIds={selectedIds}
                onToggle={toggleSelected}
                onSelectBookings={() => applyAutoAssign(clients)}
                onClear={() => setSelectedIds(new Set())}
                emptyHint='No clients yet — once someone books you (or sends a lead), they appear here.'
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
          }
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color={COLORS.primary} style={styles.loader} />
            ) : (
              <Text style={styles.empty}>No videos yet. Upload your first clip.</Text>
            )
          }
        />
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
  assigneeHint: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  assigneeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  assigneeCount: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: SPACING.sm,
  },
  chipWrap: { gap: 8, marginBottom: SPACING.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.medium,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: COLORS.background,
  },
  chipSelected: {
    borderColor: COLORS.borderOrange,
    backgroundColor: COLORS.primaryLight,
  },
  avatarDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarDotSelected: { backgroundColor: COLORS.primary },
  avatarLetter: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textSecondary,
  },
  avatarLetterSelected: { color: COLORS.textButton },
  chipTextCol: { flex: 1 },
  chipLabel: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.small,
  },
  chipLabelSelected: { color: COLORS.textPrimary },
  chipMeta: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
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
  editAssignBox: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  editAssignActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: SPACING.sm,
  },
  saveAssignBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.medium,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minWidth: 72,
    alignItems: 'center',
  },
  link: { color: COLORS.primary, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  danger: { color: COLORS.error },
});
