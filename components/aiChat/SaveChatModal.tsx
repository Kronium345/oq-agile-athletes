import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
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

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (title: string) => Promise<void>;
};

export function SaveChatModal({ visible, onClose, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setShowSuccess(false);
      setShowError(false);
      setSaving(false);
    }
  }, [visible]);

  const handleSave = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await onSave(title.trim());
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch {
      setShowError(true);
      setTimeout(() => {
        setShowError(false);
        onClose();
      }, 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          {showError ? (
            <View style={styles.feedback}>
              <View style={[styles.iconCircle, styles.errorCircle]}>
                <Feather name='x' size={28} color={COLORS.textButton} />
              </View>
              <Text style={styles.feedbackTitle}>Nothing to save</Text>
              <Text style={styles.feedbackSubtitle}>
                Start a conversation before saving
              </Text>
            </View>
          ) : showSuccess ? (
            <View style={styles.feedback}>
              <View style={[styles.iconCircle, styles.successCircle]}>
                <Feather name='check' size={28} color={COLORS.textButton} />
              </View>
              <Text style={styles.feedbackTitle}>Chat saved</Text>
              <Text style={styles.feedbackSubtitle}>
                Find it in chat history anytime
              </Text>
            </View>
          ) : (
            <>
              <TouchableOpacity style={styles.close} onPress={onClose}>
                <Feather name='x' size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.title}>Save chat</Text>
              <Text style={styles.subtitle}>
                Give this conversation a title to find it later
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder='Enter chat title'
                placeholderTextColor={COLORS.textSecondary}
                style={styles.input}
              />
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  (!title.trim() || saving) && styles.primaryBtnDisabled,
                ]}
                onPress={handleSave}
                disabled={!title.trim() || saving}
              >
                <Text style={styles.primaryBtnText}>
                  {saving ? 'Saving…' : 'Save chat'}
                </Text>
              </TouchableOpacity>
            </>
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
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.medium,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.medium,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
  feedback: { alignItems: 'center', paddingVertical: SPACING.lg },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  successCircle: { backgroundColor: COLORS.success },
  errorCircle: { backgroundColor: COLORS.error },
  feedbackTitle: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  feedbackSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});
