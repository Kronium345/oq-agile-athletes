import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { Doctor } from './doctorsData';

type Props = {
  doctor: Doctor;
  setViewDoctor: (doctor: Doctor | null) => void;
};

export default function DoctorDetails({ doctor, setViewDoctor }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => setViewDoctor(null)}>
        <Ionicons name="arrow-back" size={24} color={COLORS.accentGreen} />
        <Text style={styles.backText}>Back to list</Text>
      </TouchableOpacity>

      <View style={styles.profileContainer}>
        <Image source={{ uri: doctor.uri }} style={styles.image} resizeMode="cover" />
        <Text style={styles.name}>{doctor.name}</Text>
        <Text style={styles.specialist}>{doctor.specialist}</Text>
        <Text style={styles.experience}>{doctor.epxperience}</Text>
        <Text style={styles.location}>{doctor.location}</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Professional information</Text>
        <Text style={styles.infoText}>
          {doctor.name} is a registered {doctor.specialist.toLowerCase()} with{' '}
          {doctor.epxperience.toLowerCase()} in the UK, affiliated with {doctor.location}.
        </Text>
        <Text style={styles.disclaimer}>
          For educational purposes only. Consult your GP for referrals to mental health services.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.md },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  backText: { marginLeft: 5, fontSize: TYPOGRAPHY.fontSize.regular, color: COLORS.accentGreen },
  profileContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  image: { width: 120, height: 120, borderRadius: 60, marginBottom: SPACING.md },
  name: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.accentGreen,
  },
  specialist: { fontSize: TYPOGRAPHY.fontSize.regular, color: COLORS.textPrimary },
  experience: { fontSize: TYPOGRAPHY.fontSize.regular, color: COLORS.textSecondary },
  location: { fontSize: TYPOGRAPHY.fontSize.regular, color: COLORS.textSecondary },
  infoContainer: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.lg,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.accentGreen,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    lineHeight: 22,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  disclaimer: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
