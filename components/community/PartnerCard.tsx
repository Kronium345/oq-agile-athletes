import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { requestPartnerConnect } from '../../services/communityApi';
import type { TrainingPartner } from '../../types/trainer';

type Props = { partner: TrainingPartner };

export function PartnerCard({ partner }: Props) {
  const handleConnect = async () => {
    try {
      const ok = await requestPartnerConnect(partner.userId);
      Toast.show({
        type: ok ? 'success' : 'error',
        text1: ok ? 'Connect request sent' : 'Could not connect',
      });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not connect' });
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.letter}>{partner.displayName.charAt(0)}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.name}>{partner.displayName}</Text>
        {partner.gymName ? <Text style={styles.meta}>{partner.gymName}</Text> : null}
        {partner.goal ? <Text style={styles.meta}>Goal: {partner.goal}</Text> : null}
        {partner.experience ? (
          <Text style={styles.meta}>Level: {partner.experience}</Text>
        ) : null}
      </View>
      <TouchableOpacity style={styles.btn} onPress={handleConnect}>
        <Text style={styles.btnText}>Connect</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
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
  body: { flex: 1 },
  name: { fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.textPrimary },
  meta: { fontSize: TYPOGRAPHY.fontSize.small, color: COLORS.textSecondary },
  btn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.medium,
  },
  btnText: { color: COLORS.textButton, fontSize: TYPOGRAPHY.fontSize.small },
});
