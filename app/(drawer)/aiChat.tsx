import { Feather, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import BackgroundGradient from '../../components/BackgroundGradient';
import BlobBackground from '../../components/BlobBackground';
import { ChatHistoryModal } from '../../components/aiChat/ChatHistoryModal';
import { ClearChatModal } from '../../components/aiChat/ClearChatModal';
import { SaveChatModal } from '../../components/aiChat/SaveChatModal';
import { TypewriterText } from '../../components/aiChat/TypewriterText';
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
  deleteChat,
  generateChatResponse,
  getUserId,
  listUserChats,
  saveChat,
  SavedChat,
} from '../../services/aiChatApi';
import { useAuthContext } from '../AuthProvider';

const QUICK_PROMPTS = [
  {
    label: 'Exercises',
    prompt: 'Suggest a balanced full-body exercise routine for beginners.',
    icon: require('../../assets/icons/exercises-ai.png'),
    tint: 'rgba(212, 0, 0, 0.85)',
  },
  {
    label: 'Safety',
    prompt: 'What safety tips should I follow when starting a new workout program?',
    icon: require('../../assets/icons/safety-ai.png'),
    tint: 'rgba(230, 0, 238, 0.85)',
  },
  {
    label: 'Routines',
    prompt: 'Build a 3-day weekly workout routine I can do at home.',
    icon: require('../../assets/icons/routine-ai.png'),
    tint: 'rgba(230, 92, 0, 0.85)',
  },
  {
    label: 'Recovery',
    prompt: 'What are the best recovery practices after intense training?',
    icon: require('../../assets/icons/recovery-ai.png'),
    tint: 'rgba(0, 160, 35, 0.85)',
  },
  {
    label: 'Nutrition',
    prompt: 'Give practical nutrition tips to support my fitness goals.',
    icon: require('../../assets/icons/nutrition-ai.png'),
    tint: 'rgba(0, 123, 224, 0.85)',
  },
] as const;

function WelcomeSection({
  visible,
  onPrompt,
}: {
  visible: boolean;
  onPrompt: (text: string) => void;
}) {
  const animation = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    animation.value = withTiming(visible ? 1 : 0, { duration: 400 });
  }, [visible, animation]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: animation.value,
    transform: [
      {
        scale: interpolate(animation.value, [0, 1], [0.92, 1], Extrapolate.CLAMP),
      },
      {
        translateY: interpolate(
          animation.value,
          [0, 1],
          [-16, 0],
          Extrapolate.CLAMP,
        ),
      },
    ],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.welcomeSection, animatedStyle]} pointerEvents='box-none'>
      <Text style={styles.welcomeTitle}>How can I help?</Text>
      <View style={styles.welcomeGrid}>
        {QUICK_PROMPTS.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.welcomeChip}
            onPress={() => onPrompt(item.prompt)}
          >
            <Image
              source={item.icon}
              style={[styles.welcomeChipIcon, { tintColor: item.tint }]}
            />
            <Text style={styles.welcomeChipText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
}

export default function AiChatScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { isPremium, isLoading: isPremiumLoading, requirePremium } =
    usePremiumGate('AI Coach');

  const [messages, setMessages] = useState<ChatUiMessage[]>([
    { type: 'bot', text: AI_COACH_WELCOME },
  ]);
  const [input, setInput] = useState('');
  const [inputHeight, setInputHeight] = useState(44);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [clearModalVisible, setClearModalVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);

  const scrollRef = useRef<ScrollView>(null);
  const menuAnim1 = useSharedValue(0);
  const menuAnim2 = useSharedValue(0);
  const menuAnim3 = useSharedValue(0);

  const conversationCount = messages.filter((m) => m.type === 'user').length;

  useFocusEffect(
    useCallback(() => {
      if (isPremiumLoading) return;
      requirePremium();
    }, [requirePremium, isPremiumLoading]),
  );

  const scrollToEnd = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  const toggleMenu = () => {
    if (!isMenuExpanded) {
      menuAnim3.value = withDelay(0, withSpring(1, { damping: 12 }));
      menuAnim2.value = withDelay(80, withSpring(1, { damping: 12 }));
      menuAnim1.value = withDelay(160, withSpring(1, { damping: 12 }));
      setIsMenuExpanded(true);
    } else {
      menuAnim1.value = withSpring(0);
      menuAnim2.value = withDelay(40, withSpring(0));
      menuAnim3.value = withDelay(80, withSpring(0));
      setIsMenuExpanded(false);
    }
  };

  const closeMenu = () => {
    menuAnim1.value = withSpring(0);
    menuAnim2.value = withSpring(0);
    menuAnim3.value = withSpring(0);
    setIsMenuExpanded(false);
  };

  const menuStyle1 = useAnimatedStyle(() => ({
    opacity: menuAnim1.value,
    transform: [{ scale: menuAnim1.value }],
  }));
  const menuStyle2 = useAnimatedStyle(() => ({
    opacity: menuAnim2.value,
    transform: [{ scale: menuAnim2.value }],
  }));
  const menuStyle3 = useAnimatedStyle(() => ({
    opacity: menuAnim3.value,
    transform: [{ scale: menuAnim3.value }],
  }));

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    if (!isPremium && !isPremiumLoading) {
      requirePremium();
      return;
    }

    setShowWelcome(false);
    Keyboard.dismiss();
    setMessages((prev) => [...prev, { type: 'user', text: trimmed }]);
    setInput('');
    setInputHeight(44);
    setLoading(true);
    setIsTyping(true);
    scrollToEnd();

    try {
      const reply = await generateChatResponse(trimmed, {
        wrapAsWorkoutPlan: true,
      });
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
              ? 'AI Coach is not available on the server yet. Your team needs to enable /chat routes on the API.'
              : 'Sorry, I could not generate a response. Please try again.',
        },
      ]);
      setIsTyping(false);
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  };

  const loadHistory = async () => {
    const userId = getUserId(user);
    if (!userId) return;
    setHistoryLoading(true);
    try {
      const chats = await listUserChats(userId);
      setSavedChats(chats);
    } catch (e: unknown) {
      const err = e as Error;
      Toast.show({
        type: 'error',
        text1: 'Could not load history',
        text2: err?.message ?? 'Try again later.',
        position: 'bottom',
      });
      setSavedChats([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistory = () => {
    setHistoryVisible(true);
    loadHistory();
  };

  const handleSaveChat = async (title: string) => {
    const userId = getUserId(user);
    if (!userId) {
      throw new Error('Sign in to save chats');
    }
    if (conversationCount === 0) {
      throw new Error('No conversation');
    }
    await saveChat(userId, title, messages);
  };

  const startNewChat = () => {
    setMessages([{ type: 'bot', text: AI_COACH_WELCOME }]);
    setShowWelcome(true);
    setIsTyping(false);
    setLoading(false);
  };

  if (isPremiumLoading) {
    return (
      <BackgroundGradient>
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient>
      <BlobBackground variant='scale' />
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
          <Text style={styles.headerTitle}>AI Coach</Text>
          <TouchableOpacity style={styles.historyButton} onPress={openHistory}>
            <Feather name='clock' size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <View style={styles.chatArea}>
            <WelcomeSection
              visible={showWelcome}
              onPrompt={(prompt) => {
                setInput(prompt);
                sendMessage(prompt);
              }}
            />
            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps='handled'
              onContentSizeChange={scrollToEnd}
            >
              {messages.map((message, index) => (
                <View
                  key={`${message.type}-${index}-${message.text.slice(0, 12)}`}
                  style={[
                    styles.messageRow,
                    message.type === 'user'
                      ? styles.messageRowUser
                      : styles.messageRowBot,
                  ]}
                >
                  <View style={styles.avatarWrap}>
                    <Image
                      source={require('../../assets/images/logo.png')}
                      style={styles.avatar}
                    />
                  </View>
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
              {isTyping && loading && (
                <View style={[styles.messageRow, styles.messageRowBot]}>
                  <View style={styles.avatarWrap}>
                    <Image
                      source={require('../../assets/images/logo.png')}
                      style={styles.avatar}
                    />
                  </View>
                  <View style={[styles.bubble, styles.bubbleBot]}>
                    <Text style={styles.typingText}>AI is thinking…</Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              AI Coach can make mistakes. Not medical advice.
            </Text>
          </View>

          <View style={styles.composerRow}>
            <View style={styles.menuWrap}>
              <TouchableOpacity
                style={[
                  styles.menuTrigger,
                  isMenuExpanded && styles.menuTriggerActive,
                ]}
                onPress={toggleMenu}
              >
                <Image
                  source={require('../../assets/icons/ai-more.png')}
                  style={styles.menuTriggerIcon}
                />
              </TouchableOpacity>
              {isMenuExpanded && (
                <View style={styles.menuFlyout}>
                  <Animated.View style={menuStyle1}>
                    <TouchableOpacity
                      style={styles.menuFlyoutBtn}
                      onPress={() => {
                        closeMenu();
                        setClearModalVisible(true);
                      }}
                    >
                      <Image
                        source={require('../../assets/icons/broom.png')}
                        style={styles.menuFlyoutIcon}
                      />
                    </TouchableOpacity>
                  </Animated.View>
                  <Animated.View style={menuStyle2}>
                    <TouchableOpacity
                      style={styles.menuFlyoutBtn}
                      onPress={() => {
                        closeMenu();
                        startNewChat();
                      }}
                    >
                      <Image
                        source={require('../../assets/icons/new-chat.png')}
                        style={styles.menuFlyoutIcon}
                      />
                    </TouchableOpacity>
                  </Animated.View>
                  <Animated.View style={menuStyle3}>
                    <TouchableOpacity
                      style={styles.menuFlyoutBtn}
                      onPress={() => {
                        closeMenu();
                        setSaveModalVisible(true);
                      }}
                    >
                      <Image
                        source={require('../../assets/icons/save-chat.png')}
                        style={[styles.menuFlyoutIcon, { width: 18, height: 18 }]}
                      />
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              )}
            </View>

            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder='How can I help?'
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
                (!input.trim() || loading) && styles.sendButtonDisabled,
              ]}
              onPress={() => sendMessage(input)}
              disabled={!input.trim() || loading}
            >
              <Image
                source={require('../../assets/icons/send.png')}
                style={styles.sendIcon}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <SaveChatModal
        visible={saveModalVisible}
        onClose={() => setSaveModalVisible(false)}
        onSave={handleSaveChat}
      />
      <ClearChatModal
        visible={clearModalVisible}
        onClose={() => setClearModalVisible(false)}
        onConfirm={startNewChat}
      />
      <ChatHistoryModal
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
        chats={savedChats}
        loading={historyLoading}
        onRefresh={loadHistory}
        onOpenChat={(chatId) =>
          router.push({
            pathname: '/(drawer)/viewChat' as any,
            params: { chatId },
          })
        }
        onDeleteChat={deleteChat}
      />
      <Toast />
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
    ...SHADOWS.card,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundCard,
    ...SHADOWS.card,
  },
  chatArea: { flex: 1, position: 'relative' },
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
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  avatar: { width: 36, height: 36, resizeMode: 'contain' },
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
  typingText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
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
  menuWrap: { position: 'relative' },
  menuTrigger: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTriggerActive: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 18,
  },
  menuTriggerIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.primary,
  },
  menuFlyout: {
    position: 'absolute',
    bottom: 44,
    left: 0,
    gap: SPACING.sm,
    zIndex: 20,
  },
  menuFlyoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  menuFlyoutIcon: {
    width: 22,
    height: 22,
    tintColor: COLORS.primary,
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
  welcomeSection: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    top: '30%',
    zIndex: 5,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: TYPOGRAPHY.fontSize.extraLarge,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  welcomeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  welcomeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.circle,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.borderOrange,
    ...SHADOWS.card,
  },
  welcomeChipIcon: { width: 18, height: 18 },
  welcomeChipText: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});
