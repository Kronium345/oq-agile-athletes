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
  onSelectUk: () => void;
  onSelectNonUk: () => void;
};

export function UkLocationModal({
  visible,
  onSelectUk,
  onSelectNonUk,
}: Props) {
  return (
    <Modal transparent visible={visible} animationType='fade'>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} />
        <View style={styles.card}>
          <Feather
            name='globe'
            size={32}
            color={COLORS.primary}
            style={styles.icon}
          />
          <Text style={styles.title}>Are you in the United Kingdom?</Text>
          <Text style={styles.subtitle}>
            Emergency contacts, hospital listings, and professional directories
            in Mind Center are verified for the UK. Other features (assessment,
            articles, exercises) are available worldwide.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={onSelectUk}>
            <Text style={styles.primaryBtnText}>Yes, I&apos;m in the UK</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onSelectNonUk}>
            <Text style={styles.secondaryBtnText}>No, I&apos;m elsewhere</Text>
          </TouchableOpacity>
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
    padding: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.cardLarge,
  },
  icon: { marginBottom: SPACING.md },
  title: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  primaryBtnText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
  secondaryBtn: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  secondaryBtnText: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
});
