import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import {
  acceptConnection,
  declineConnection,
} from '../../services/communityApi';
import type { PartnerConnection } from '../../types/trainer';
import { PartnerStatsChips } from './PartnerStatsChips';

type Props = {
  connection: PartnerConnection;
  onUpdated: () => void;
};

export function ConnectionRequestCard({ connection, onUpdated }: Props) {
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null);
  const { user } = connection;
  const isIncoming =
    connection.direction === 'incoming' && connection.status === 'pending';

  const handleAccept = async () => {
    setLoading('accept');
    try {
      const ok = await acceptConnection(connection.id);
      if (ok) {
        Toast.show({ type: 'success', text1: 'Connection accepted' });
        onUpdated();
        return;
      }
      Toast.show({ type: 'error', text1: 'Could not accept request' });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not accept request' });
    } finally {
      setLoading(null);
    }
  };

  const handleDecline = async () => {
    setLoading('decline');
    try {
      const ok = await declineConnection(connection.id);
      if (ok) {
        Toast.show({ type: 'info', text1: 'Request declined' });
        onUpdated();
        return;
      }
      Toast.show({ type: 'error', text1: 'Could not decline request' });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not decline request' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.letter}>{user.displayName.charAt(0)}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.name}>{user.displayName}</Text>
          <Text style={styles.meta}>
            {isIncoming ? 'Wants to train with you' : 'Request sent'}
          </Text>
          <PartnerStatsChips partner={user} />
        </View>
      </View>

      {isIncoming ? (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.declineBtn}
            onPress={handleDecline}
            disabled={loading != null}
          >
            {loading === 'decline' ? (
              <ActivityIndicator color={COLORS.textPrimary} size='small' />
            ) : (
              <Text style={styles.declineText}>Decline</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={handleAccept}
            disabled={loading != null}
          >
            {loading === 'accept' ? (
              <ActivityIndicator color={COLORS.textButton} size='small' />
            ) : (
              <Text style={styles.acceptText}>Accept</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.pendingNote}>Waiting for their response</Text>
      )}
    </View>
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
  header: {
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
  body: { flex: 1, minWidth: 0 },
  name: {
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
  meta: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  declineText: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  acceptBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  acceptText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  pendingNote: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});
