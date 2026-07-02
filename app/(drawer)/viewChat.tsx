import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import BackgroundGradient from '../../components/BackgroundGradient';
import { BotThinkingBubble } from '../../components/aiChat/BotThinkingBubble';
import { ChatAvatar } from '../../components/aiChat/ChatAvatar';
import { TypewriterText } from '../../components/aiChat/TypewriterText';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';
import { useUserAvatar } from '../../hooks/useUserAvatar';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../constants/theme';
import { usePremiumGate } from '../../hooks/usePremiumGate';
import {
  AI_COACH_WELCOME,
  ChatUiMessage,
  generateChatResponse,
  getChatById,
} from '../../services/aiChatApi';

export default function ViewChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ chatId?: string }>();
  const chatId = params.chatId;
  const userAvatarUri = useUserAvatar();
  const { requirePremium, isLoading: isPremiumLoading } =
    usePremiumGate('AI Coach');

  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [input, setInput] = useState('');
  const [inputHeight, setInputHeight] = useState(44);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const keyboardHeight = useKeyboardHeight();

  const loadChat = useCallback(async () => {
    if (!chatId) {
      router.back();
      return;
    }
    setLoading(true);
    try {
      const chat = await getChatById(chatId);
      const filtered = chat.messages.filter(
        (m) => m.text !== AI_COACH_WELCOME,
      );
      setMessages(filtered.length > 0 ? filtered : chat.messages);
    } catch (e: unknown) {
      const err = e as Error;
      Toast.show({
        type: 'error',
        text1: 'Could not load chat',
        text2: err?.message ?? 'Try again later.',
        position: 'bottom',
      });
      setMessages([
        {
          type: 'bot',
          text: 'There was an error loading this chat. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [chatId, router]);

  useEffect(() => {
    if (isPremiumLoading) return;
    if (!requirePremium()) return;
    loadChat();
  }, [loadChat, requirePremium, isPremiumLoading]);

  const scrollToEnd = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setMessages((prev) => [...prev, { type: 'user', text: trimmed }]);
    setInput('');
    setInputHeight(44);
    setSending(true);
    setIsTyping(true);
    scrollToEnd();

    try {
      const reply = await generateChatResponse(trimmed);
      setMessages((prev) => [...prev, { type: 'bot', text: reply }]);
    } catch (e: unknown) {
      const err = e as Error;
      setMessages((prev) => [
        ...prev,
        {
          type: 'bot',
          text:
            err?.message?.includes('Route not found') ||
            err?.message?.includes('404')
              ? 'AI Coach is not available on the server yet.'
              : 'Sorry, I encountered an error. Please try again.',
        },
      ]);
      setIsTyping(false);
    } finally {
      setSending(false);
      scrollToEnd();
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
            <Ionicons
              name='chevron-back'
              size={22}
              color={COLORS.textButton}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Saved chat</Text>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading chat…</Text>
          </View>
        ) : (
          <KeyboardAvoidingView
            style={[
              styles.flex,
              Platform.OS === 'android' && keyboardHeight > 0
                ? { paddingBottom: keyboardHeight }
                : null,
            ]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
          >
            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              onContentSizeChange={scrollToEnd}
            >
              {messages.map((message, index) => (
                <View
                  key={`${message.type}-${index}`}
                  style={[
                    styles.messageRow,
                    message.type === 'user'
                      ? styles.messageRowUser
                      : styles.messageRowBot,
                  ]}
                >
                  <ChatAvatar
                    role={message.type === 'user' ? 'user' : 'bot'}
                    userAvatarUri={userAvatarUri}
                  />
                  <View
                    style={[
                      styles.bubble,
                      message.type === 'user'
                        ? styles.bubbleUser
                        : styles.bubbleBot,
                    ]}
                  >
                    {message.type === 'user' ? (
                      <Text style={styles.bubbleTextUser}>{message.text}</Text>
                    ) : (
                      <TypewriterText
                        text={message.text}
                        onComplete={() => setIsTyping(false)}
                        style={styles.bubbleTextBot}
                      />
                    )}
                  </View>
                </View>
              ))}
              {sending && (
                <View style={[styles.messageRow, styles.messageRowBot]}>
                  <ChatAvatar role='bot' />
                  <BotThinkingBubble />
                </View>
              )}
            </ScrollView>

            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>
                AI Coach can make mistakes. Not medical advice.
              </Text>
            </View>

            <View style={styles.composerRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder='Send a message…'
                placeholderTextColor={COLORS.textSecondary}
                style={[styles.input, { height: Math.min(80, inputHeight) }]}
                multiline
                onContentSizeChange={(e) => {
                  const h = e.nativeEvent.contentSize.height;
                  setInputHeight(Math.min(80, Math.max(44, h)));
                }}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!input.trim() || sending) && styles.sendButtonDisabled,
                ]}
                onPress={sendMessage}
                disabled={!input.trim() || sending}
              >
                <Image
                  source={require('../../assets/icons/send.png')}
                  style={styles.sendIcon}
                />
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    ...SHADOWS.card,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  headerSpacer: { width: 40 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    alignItems: 'flex-start',
  },
  messageRowUser: { flexDirection: 'row-reverse' },
  messageRowBot: { flexDirection: 'row' },
  bubble: {
    maxWidth: '78%',
    borderRadius: BORDER_RADIUS.large,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.sm,
  },
  bubbleUser: { backgroundColor: COLORS.primary },
  bubbleBot: {
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  bubbleTextUser: {
    color: COLORS.textButton,
    fontSize: TYPOGRAPHY.fontSize.regular,
    lineHeight: 20,
  },
  bubbleTextBot: { color: COLORS.textPrimary },
  disclaimer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xs,
  },
  disclaimerText: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 80,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.backgroundCard,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.45 },
  sendIcon: { width: 22, height: 22, tintColor: COLORS.textButton },
});
