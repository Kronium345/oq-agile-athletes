import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../constants/theme';
import { SavedChat } from '../../services/aiChatApi';

type Props = {
  visible: boolean;
  onClose: () => void;
  chats: SavedChat[];
  loading: boolean;
  onRefresh: () => void;
  onOpenChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => Promise<void>;
};

function ChatCard({
  chat,
  onOpen,
  onDelete,
}: {
  chat: SavedChat;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const dateLabel = chat.savedAt
    ? new Date(chat.savedAt).toLocaleDateString()
    : '—';

  return (
    <View style={styles.chatCard}>
      <TouchableOpacity
        style={styles.chatCardHeader}
        onPress={() => setExpanded((v) => !v)}
      >
        <View style={styles.chatCardText}>
          <Text style={styles.chatTitle} numberOfLines={1}>
            {chat.title}
          </Text>
          <Text style={styles.chatDate}>Saved {dateLabel}</Text>
        </View>
        <Feather
          name={expanded ? 'chevron-down' : 'chevron-right'}
          size={20}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.chatActions}>
          <TouchableOpacity style={styles.openBtn} onPress={onOpen}>
            <Feather name='message-square' size={16} color={COLORS.textButton} />
            <Text style={styles.openBtnText}>Open chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => {
              Alert.alert(
                'Delete chat',
                'Remove this saved conversation?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: onDelete },
                ],
              );
            }}
          >
            <Feather name='trash-2' size={16} color={COLORS.error} />
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export function ChatHistoryModal({
  visible,
  onClose,
  chats,
  loading,
  onRefresh,
  onOpenChat,
  onDeleteChat,
}: Props) {
  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.close} onPress={onClose}>
            <Feather name='x' size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Chat history</Text>
          <Text style={styles.subtitle}>Your saved AI coach conversations</Text>

          {loading ? (
            <ActivityIndicator
              color={COLORS.primary}
              style={{ marginVertical: SPACING.xxl }}
            />
          ) : (
            <ScrollView
              style={styles.list}
              showsVerticalScrollIndicator={false}
            >
              {chats.length === 0 ? (
                <Text style={styles.empty}>No saved chats yet</Text>
              ) : (
                chats.map((chat) => (
                  <ChatCard
                    key={chat._id}
                    chat={chat}
                    onOpen={() => {
                      onClose();
                      onOpenChat(chat._id);
                    }}
                    onDelete={async () => {
                      await onDeleteChat(chat._id);
                      onRefresh();
                    }}
                  />
                ))
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.xl,
    maxHeight: '80%',
    ...SHADOWS.cardLarge,
  },
  close: {
    position: 'absolute',
    right: SPACING.lg,
    top: SPACING.lg,
    zIndex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  list: { maxHeight: 360 },
  empty: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginVertical: SPACING.xxl,
  },
  chatCard: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.medium,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  chatCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  chatCardText: { flex: 1, marginRight: SPACING.sm },
  chatTitle: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  chatDate: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.small,
    marginTop: 2,
  },
  chatActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    paddingTop: 0,
  },
  openBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.medium,
  },
  openBtnText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    fontSize: TYPOGRAPHY.fontSize.small,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.medium,
  },
  deleteBtnText: {
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    fontSize: TYPOGRAPHY.fontSize.small,
  },
});
