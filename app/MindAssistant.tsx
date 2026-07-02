import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
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
import { UkLocationModal } from '../components/mindCenter/UkLocationModal';
import { BotThinkingBubble } from '../components/aiChat/BotThinkingBubble';
import { ChatAvatar } from '../components/aiChat/ChatAvatar';
import { TypewriterText } from '../components/aiChat/TypewriterText';
import BackgroundGradient from '../components/BackgroundGradient';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../constants/theme';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';
import { useUserAvatar } from '../hooks/useUserAvatar';
import { useMindCenterUkScreenGuard } from '../hooks/useMindCenterUkGate';
import { usePremiumGate } from '../hooks/usePremiumGate';
import { ChatUiMessage } from '../services/aiChatApi';
import { generateMindCenterChatResponse } from '../services/mindCenterChatApi';

const INTRO =
  'Ask about UK crisis contacts, hospitals, doctors listed in the app, or Mind Center resources. I use verified in-app data only — not medical advice.';

export default function MindAssistant() {
  const router = useRouter();
  const userAvatarUri = useUserAvatar();
  const { isLoading: isPremiumLoading, requirePremium } =
    usePremiumGate('Mind Center');
  const { checking, allowed, showModal, onSelectUk, onSelectNonUk } =
    useMindCenterUkScreenGuard();

  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const scrollRef = useRef<ScrollView>(null);
  const keyboardHeight = useKeyboardHeight();

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    if (!requirePremium()) return;

    setShowIntro(false);
    setMessages((prev) => [...prev, { type: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);

    try {
      const reply = await generateMindCenterChatResponse(trimmed);
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
              ? 'Mind Assistant needs /chat routes on the server. Use the Emergency, Doctors, and Hospitals screens for verified contacts.'
              : 'Sorry, I could not answer that. Please try again or use the Mind Center menus.',
        },
      ]);
    } finally {
      setLoading(false);
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  };

  if (isPremiumLoading || checking) {
    return (
      <BackgroundGradient>
        <View style={{ flex: 1 }} />
      </BackgroundGradient>
    );
  }

  if (!allowed) {
    return (
      <BackgroundGradient>
        <UkLocationModal
          visible={showModal}
          onSelectUk={onSelectUk}
          onSelectNonUk={onSelectNonUk}
        />
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Ionicons name='chevron-back' size={22} color={COLORS.textButton} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mind Assistant</Text>
          <View style={styles.back} />
        </View>

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
            contentContainerStyle={[
              styles.scroll,
              showIntro && messages.length === 0 && styles.scrollCentered,
            ]}
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd({ animated: true })
            }
          >
            {showIntro && messages.length === 0 ? (
              <View style={styles.introBox}>
                <Text style={styles.introTitle}>How can I help?</Text>
                <Text style={styles.introText}>{INTRO}</Text>
              </View>
            ) : null}
            {messages.map((m, i) => (
              <View
                key={`${m.type}-${i}`}
                style={[
                  styles.row,
                  m.type === 'user' ? styles.rowUser : styles.rowBot,
                ]}
              >
                <ChatAvatar
                  role={m.type === 'user' ? 'user' : 'bot'}
                  userAvatarUri={userAvatarUri}
                />
                <View
                  style={[
                    styles.bubble,
                    m.type === 'user' ? styles.bubbleUser : styles.bubbleBot,
                  ]}
                >
                  {m.type === 'user' ? (
                    <Text style={styles.userText}>{m.text}</Text>
                  ) : (
                    <TypewriterText text={m.text} style={styles.botText} />
                  )}
                </View>
              </View>
            ))}
            {loading ? (
              <View style={[styles.row, styles.rowBot]}>
                <ChatAvatar role='bot' />
                <BotThinkingBubble />
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder='Ask about contacts or resources…'
              placeholderTextColor={COLORS.textSecondary}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.send,
                (!input.trim() || loading) && styles.sendDisabled,
              ]}
              onPress={send}
              disabled={!input.trim() || loading}
            >
              <Ionicons name='send' size={18} color={COLORS.textButton} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Toast />
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  scroll: {
    flexGrow: 1,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  scrollCentered: { justifyContent: 'center' },
  introBox: { alignItems: 'center', paddingVertical: SPACING.xl },
  introTitle: {
    fontSize: TYPOGRAPHY.fontSize.extraLarge,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  introText: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    alignItems: 'flex-start',
  },
  rowUser: { flexDirection: 'row-reverse' },
  rowBot: { flexDirection: 'row' },
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
  userText: { color: COLORS.textButton, lineHeight: 20 },
  botText: { color: COLORS.textPrimary },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.backgroundCard,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.textPrimary,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.45 },
});
