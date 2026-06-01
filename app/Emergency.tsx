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
import { UkGatedMindScreen } from '../components/mindCenter/UkGatedMindScreen';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { EMERGENCY_CONTACTS } from '../lib/mindCenterKnowledge';

export default function Emergency() {
  const router = useRouter();

  return (
    <UkGatedMindScreen style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Emergency</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>UK mental health emergency contacts</Text>
        {EMERGENCY_CONTACTS.map((c) => (
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
    </UkGatedMindScreen>
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
