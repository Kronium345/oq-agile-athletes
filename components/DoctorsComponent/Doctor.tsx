import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { Doctor as DoctorType } from './doctorsData';

type Props = {
  doctor: DoctorType;
  setViewDoctor: (doctor: DoctorType) => void;
};

export default function Doctor({ doctor, setViewDoctor }: Props) {
  return (
    <TouchableOpacity style={styles.container} onPress={() => setViewDoctor(doctor)}>
      <Image source={{ uri: doctor.uri }} style={styles.image} resizeMode="cover" />
      <View style={styles.details}>
        <Text style={styles.name}>{doctor.name}</Text>
        <Text style={styles.specialist}>{doctor.specialist}</Text>
        <Text style={styles.experience}>{doctor.epxperience}</Text>
        <Text style={styles.location}>{doctor.location}</Text>
        <Text style={styles.note}>Registered UK mental health professional</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    marginVertical: SPACING.sm,
    padding: SPACING.md,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: SPACING.md,
  },
  details: { flex: 1, justifyContent: 'center' },
  name: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: 4,
    color: COLORS.accentGreen,
  },
  specialist: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textPrimary,
  },
  experience: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
  },
  location: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.textSecondary,
  },
  note: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
