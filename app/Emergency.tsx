import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

const CONTACTS = [
  {
    name: 'Emergency Services',
    number: '999',
    description: 'For immediate danger to life',
    href: 'tel:999',
  },
  {
    name: 'NHS Non-Emergency',
    number: '111',
    description: 'For urgent medical advice',
    href: 'tel:111',
  },
  {
    name: 'Samaritans 24/7',
    number: '116 123',
    description: 'Free confidential support',
    href: 'tel:116123',
  },
  {
    name: 'Mind Infoline',
    number: '0300 123 3393',
    description: 'Mental health information (9am–6pm Mon–Fri)',
    href: 'tel:03001233393',
  },
  {
    name: 'CALM',
    number: '0800 58 58 58',
    description: 'For men in crisis (5pm–midnight)',
    href: 'tel:0800585858',
  },
  {
    name: 'Shout Crisis Text Line',
    number: 'Text SHOUT to 85258',
    description: '24/7 text support',
    href: 'sms:85258&body=SHOUT',
  },
];

export default function Emergency() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Emergency</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>UK mental health emergency contacts</Text>
        {CONTACTS.map((c) => (
          <View key={c.name} style={styles.card}>
            <Text style={styles.name}>{c.name}</Text>
            <TouchableOpacity onPress={() => Linking.openURL(c.href)}>
              <Text style={styles.number}>{c.number}</Text>
            </TouchableOpacity>
            <Text style={styles.description}>{c.description}</Text>
          </View>
        ))}
        <Text style={styles.disclaimer}>
          In case of immediate danger to life, always call 999.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  pageTitle: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.accentGreen,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.lg,
    borderRadius: 8,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  number: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.accentGreen,
    textDecorationLine: 'underline',
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
});
