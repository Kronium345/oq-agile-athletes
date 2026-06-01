import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DoctorsComponent from '../components/DoctorsComponent/DoctorsComponent';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

export default function Doctors() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Doctors</Text>
        <View style={{ width: 22 }} />
      </View>
      <DoctorsComponent />
      <Text style={styles.citation}>
        Source: Royal College of Psychiatrists, British Psychological Society, and NHS UK
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.backgroundAlt },
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
  citation: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: SPACING.sm,
  },
});
