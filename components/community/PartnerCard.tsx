import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import type { TrainingPartner } from '../../types/trainer';
import { ConnectPartnerModal } from './ConnectPartnerModal';
import { PartnerStatsChips } from './PartnerStatsChips';

type Props = { partner: TrainingPartner };

export function PartnerCard({ partner }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.avatar}>
            <Text style={styles.letter}>{partner.displayName.charAt(0)}</Text>
          </View>
          <View style={styles.body}>
            <Text style={styles.name} numberOfLines={1}>
              {partner.displayName}
            </Text>
            <PartnerStatsChips partner={partner} />
          </View>
          <TouchableOpacity
            style={[styles.btn, sent && styles.btnDisabled]}
            onPress={() => setModalVisible(true)}
            disabled={sent}
          >
            <Text style={styles.btnText}>{sent ? 'Sent' : 'Connect'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ConnectPartnerModal
        visible={modalVisible}
        partner={partner}
        onClose={() => setModalVisible(false)}
        onSent={() => setSent(true)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  letter: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  body: { flex: 1, minWidth: 0, marginRight: SPACING.sm },
  name: {
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  btn: {
    flexShrink: 0,
    minWidth: 76,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.medium,
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  btnText: { color: COLORS.textButton, fontSize: TYPOGRAPHY.fontSize.small },
});
