import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundGradient from '../../../components/BackgroundGradient';
import { TrainerScreenHeader } from '../../../components/trainers/TrainerScreenHeader';
import { drawerScreenStyles } from '../../../constants/drawerScreen';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../../constants/theme';

const LINKS = [
  {
    title: 'Training partners',
    subtitle: 'Find someone to train with at your gym',
    route: '/(drawer)/community/partners',
  },
  {
    title: 'Local groups',
    subtitle: 'Run clubs and gym communities',
    route: '/(drawer)/community/groups',
  },
  // PT / gym feature paused
  // {
  //   title: 'Personal trainers',
  //   subtitle: 'Browse verified PTs',
  //   route: '/(drawer)/trainers',
  // },
];

export default function CommunityHubScreen() {
  const router = useRouter();

  return (
    <BackgroundGradient>
      <SafeAreaView style={drawerScreenStyles.safe} edges={['top']}>
        <TrainerScreenHeader
          title='Fitness network'
          subtitle='UK community'
          avoidDrawerMenu
          showBack={false}
        />
        {LINKS.map((link) => (
          <TouchableOpacity
            key={link.route}
            style={styles.card}
            onPress={() => router.push(link.route as any)}
          >
            <Text style={styles.title}>{link.title}</Text>
            <Text style={styles.subtitle}>{link.subtitle}</Text>
          </TouchableOpacity>
        ))}
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
  title: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  subtitle: { fontSize: TYPOGRAPHY.fontSize.regular, color: COLORS.textSecondary },
});
