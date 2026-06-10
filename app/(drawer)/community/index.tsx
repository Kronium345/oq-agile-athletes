import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundGradient from '../../../components/BackgroundGradient';
import { TrainerScreenHeader } from '../../../components/trainers/TrainerScreenHeader';
import { drawerScreenStyles } from '../../../constants/drawerScreen';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import { getPendingConnectionCount } from '../../../services/communityApi';

const LINKS = [
  {
    title: 'Training partners',
    subtitle: 'Find someone to train with at your gym',
    route: '/(drawer)/community/partners',
  },
  {
    title: 'Connection requests',
    subtitle: 'Pending invites and your training buddies',
    route: '/(drawer)/community/connections',
    showBadge: true,
  },
  {
    title: 'Recommended groups',
    subtitle: 'Run clubs and gym communities - book these online to join',
    route: '/(drawer)/community/groups',
  },
];

export default function CommunityHubScreen() {
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getPendingConnectionCount().then(setPendingCount).catch(() => setPendingCount(0));
    }, []),
  );

  return (
    <BackgroundGradient>
      <SafeAreaView style={drawerScreenStyles.safe} edges={['top']}>
        <TrainerScreenHeader
          title='Fitness network'
          subtitle='UK community'
          avoidDrawerMenu
        />
        {LINKS.map((link) => {
          const badge =
            link.showBadge && pendingCount > 0 ? pendingCount : 0;
          return (
            <TouchableOpacity
              key={link.route}
              style={styles.card}
              onPress={() => router.push(link.route as any)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.title}>{link.title}</Text>
                {badge > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.subtitle}>{link.subtitle}</Text>
            </TouchableOpacity>
          );
        })}
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: SPACING.sm,
  },
  badgeText: {
    color: COLORS.textButton,
    fontSize: 12,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  subtitle: { fontSize: TYPOGRAPHY.fontSize.regular, color: COLORS.textSecondary },
});
