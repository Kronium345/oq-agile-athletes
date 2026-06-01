import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import BackgroundGradient from '../../components/BackgroundGradient';
import BlobBackground from '../../components/BlobBackground';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../constants/theme';
import { usePremiumGate } from '../../hooks/usePremiumGate';
import {
  ChatMessage,
  createConversation,
  getMessages,
  listConversations,
  sendMessage,
} from '../../services/aiChatApi';

export default function AiChatScreen() {
  const router = useRouter();
  const { isPremium, isLoading: isPremiumLoading, requirePremium } =
    usePremiumGate('AI Coach');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const bootstrapChat = useCallback(async () => {
    if (isPremiumLoading || !isPremium) {
      if (!isPremiumLoading) setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const existing = await listConversations();
      const sorted = [...existing].sort((a, b) => {
        const aTime = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
        const bTime = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
        return bTime - aTime;
      });
      const conversation =
        sorted[0] ?? (await createConversation('AI Coach'));
      setConversationId(conversation._id);
      const history = await getMessages(conversation._id);
      setMessages(
        history.length > 0
          ? history
          : [
              {
                role: 'assistant',
                content:
                  'Hi — I am your Agile Athletes coach. Ask about workouts, recovery, habits, or staying motivated. I offer wellness guidance, not medical diagnosis.',
              },
            ],
      );
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'AI Coach unavailable',
        text2: e?.message ?? 'Try again later.',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  }, [isPremium, isPremiumLoading]);

  useFocusEffect(
    useCallback(() => {
      if (isPremiumLoading) return;
      if (!requirePremium()) return;
      bootstrapChat();
    }, [bootstrapChat, requirePremium, isPremiumLoading]),
  );

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !conversationId || sending) return;

    const optimisticUserMessage: ChatMessage = {
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setInput('');
    setMessages((prev) => [...prev, optimisticUserMessage]);
    setSending(true);

    try {
      const result = await sendMessage(conversationId, trimmed);
      setMessages((prev) => {
        const withoutOptimistic = prev.filter(
          (m) =>
            !(
              m.role === 'user' &&
              m.content === trimmed &&
              !m._id
            ),
        );
        return [
          ...withoutOptimistic,
          result.userMessage,
          result.assistantMessage,
        ];
      });
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    } catch (e: any) {
      setMessages((prev) =>
        prev.filter((m) => m !== optimisticUserMessage),
      );
      Toast.show({
        type: 'error',
        text1: 'Message failed',
        text2: e?.message ?? 'Try again later.',
        position: 'bottom',
      });
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.messageRowUser : styles.messageRowAssistant,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleAssistant,
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant,
            ]}
          >
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <BackgroundGradient>
      <BlobBackground variant='scale' />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name='chevron-back' size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Coach</Text>
          <View style={styles.headerRight} />
        </View>

        {loading || isPremiumLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
          >
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item, index) =>
                item._id ?? `${item.role}-${index}-${item.createdAt ?? ''}`
              }
              renderItem={renderMessage}
              contentContainerStyle={styles.messagesContent}
              onContentSizeChange={() =>
                listRef.current?.scrollToEnd({ animated: true })
              }
            />

            <View style={styles.composer}>
              <TextInput
                style={styles.input}
                placeholder='Ask your coach...'
                placeholderTextColor={COLORS.textSecondary}
                value={input}
                onChangeText={setInput}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!input.trim() || sending) && styles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={!input.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator color={COLORS.textButton} size='small' />
                ) : (
                  <Ionicons name='send' size={18} color={COLORS.textButton} />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
      <Toast />
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messagesContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  messageRow: {
    marginBottom: SPACING.sm,
    flexDirection: 'row',
  },
  messageRowUser: { justifyContent: 'flex-end' },
  messageRowAssistant: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '82%',
    borderRadius: BORDER_RADIUS.large,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
  },
  bubbleAssistant: {
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  bubbleText: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    lineHeight: 20,
  },
  bubbleTextUser: { color: COLORS.textButton },
  bubbleTextAssistant: { color: COLORS.textPrimary },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.backgroundCard,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.textPrimary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
});
