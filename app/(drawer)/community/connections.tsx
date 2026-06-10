import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundGradient from '../../../components/BackgroundGradient';
import { ConnectionRequestCard } from '../../../components/community/ConnectionRequestCard';
import { PartnerStatsChips } from '../../../components/community/PartnerStatsChips';
import { TrainerScreenHeader } from '../../../components/trainers/TrainerScreenHeader';
import { drawerScreenStyles } from '../../../constants/drawerScreen';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import {
  listAcceptedConnections,
  listPendingConnections,
} from '../../../services/communityApi';
import type { PartnerConnection } from '../../../types/trainer';

type TabKey = 'pending' | 'connected';

export default function ConnectionsScreen() {
  const { requestId } = useLocalSearchParams<{ requestId?: string }>();
  const [tab, setTab] = useState<TabKey>('pending');
  const [pending, setPending] = useState<PartnerConnection[]>([]);
  const [connected, setConnected] = useState<PartnerConnection[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRows, connectedRows] = await Promise.all([
        listPendingConnections(),
        listAcceptedConnections(),
      ]);
      setPending(pendingRows);
      setConnected(connectedRows);

      if (requestId && pendingRows.some((row) => row.id === requestId)) {
        setTab('pending');
      }
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const incoming = pending.filter((row) => row.direction === 'incoming');
  const outgoing = pending.filter((row) => row.direction === 'outgoing');
  const pendingSections = [
    ...(incoming.length
      ? [{ title: 'Requests for you', data: incoming }]
      : []),
    ...(outgoing.length ? [{ title: 'Sent requests', data: outgoing }] : []),
  ];

  return (
    <BackgroundGradient>
      <SafeAreaView style={drawerScreenStyles.safe} edges={['top']}>
        <TrainerScreenHeader
          title='Connections'
          subtitle='Partner requests & training buddies'
          avoidDrawerMenu
        />

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'pending' && styles.tabActive]}
            onPress={() => setTab('pending')}
          >
            <Text style={[styles.tabText, tab === 'pending' && styles.tabTextActive]}>
              Pending{incoming.length ? ` (${incoming.length})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'connected' && styles.tabActive]}
            onPress={() => setTab('connected')}
          >
            <Text
              style={[styles.tabText, tab === 'connected' && styles.tabTextActive]}
            >
              Connected{connected.length ? ` (${connected.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={styles.loader} />
        ) : tab === 'pending' ? (
          <SectionList
            sections={pendingSections}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ConnectionRequestCard connection={item} onUpdated={load} />
            )}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={styles.sectionLabel}>{title}</Text>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>
                No pending requests. When someone connects with you, it will appear
                here (and you&apos;ll get an email if notifications are enabled).
              </Text>
            }
            contentContainerStyle={drawerScreenStyles.listContent}
            stickySectionHeadersEnabled={false}
          />
        ) : (
          <FlatList
            data={connected}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.connectedCard}>
                <View style={styles.connectedHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.letter}>
                      {item.user.displayName.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.connectedBody}>
                    <Text style={styles.connectedName}>{item.user.displayName}</Text>
                    <Text style={styles.connectedMeta}>Training partner</Text>
                  </View>
                </View>
                <PartnerStatsChips partner={item.user} />
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>
                No connections yet. Browse training partners and send a request.
              </Text>
            }
            contentContainerStyle={drawerScreenStyles.listContent}
          />
        )}
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
  },
  tabActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  tabText: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  loader: { marginTop: SPACING.xl },
  sectionLabel: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  empty: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  connectedCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  connectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  connectedBody: { flex: 1 },
  connectedName: {
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  connectedMeta: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
  },
});
