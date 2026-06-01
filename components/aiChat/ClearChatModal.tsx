import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  Pressable,
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

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ClearChatModal({ visible, onClose, onConfirm }: Props) {
  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <TouchableOpacity style={styles.close} onPress={onClose}>
            <Feather name='x' size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Clear chat?</Text>
          <Text style={styles.subtitle}>
            This removes the current conversation from the screen. Saved chats
            in history are not affected.
          </Text>
          <View style={styles.row}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
              <Text style={styles.secondaryBtnText}>Go back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dangerBtn}
              onPress={() => {
                onConfirm();
                onClose();
              }}
            >
              <Text style={styles.dangerBtnText}>Clear</Text>
            </TouchableOpacity>
          </View>
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
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
  row: { flexDirection: 'row', gap: SPACING.sm },
  secondaryBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.backgroundAlt,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  dangerBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.error,
    alignItems: 'center',
  },
  dangerBtnText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
});
