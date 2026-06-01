import React, { useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import Doctor from './Doctor';
import DoctorDetails from './DoctorDetails';
import { Doctor as DoctorType, doctors } from './doctorsData';

function openProfessionalLink(organization: string) {
  let url = 'https://www.nhs.uk/mental-health/';
  switch (organization) {
    case 'Royal College of Psychiatrists':
      url = 'https://www.rcpsych.ac.uk/';
      break;
    case 'British Psychological Society':
      url = 'https://www.bps.org.uk/';
      break;
    case 'Mental Health Foundation':
      url = 'https://www.mentalhealth.org.uk/';
      break;
    case 'Mind Charity':
      url = 'https://www.mind.org.uk/';
      break;
    case 'NHS Mental Health Services':
      url = 'https://www.nhs.uk/mental-health/';
      break;
    default:
      break;
  }
  Linking.openURL(url);
}

export default function DoctorsComponent() {
  const [viewDoctor, setViewDoctor] = useState<DoctorType | null>(null);

  if (viewDoctor) {
    const org = viewDoctor.location.split(',')[0].trim();
    return (
      <View style={styles.mainContainer}>
        <DoctorDetails doctor={viewDoctor} setViewDoctor={setViewDoctor} />
        <TouchableOpacity
          style={styles.organizationLink}
          onPress={() => openProfessionalLink(org)}
        >
          <Text style={styles.linkText}>Visit {org} website</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>UK mental health professionals</Text>
      <Text style={styles.subHeaderText}>
        Qualified specialists registered with UK professional bodies
      </Text>
      <ScrollView style={styles.scrollContainer}>
        {doctors.map((doctor, index) => (
          <Doctor key={index} doctor={doctor} setViewDoctor={setViewDoctor} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  container: { flex: 1, paddingHorizontal: SPACING.md },
  headerText: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
    marginTop: SPACING.md,
    color: COLORS.accentGreen,
  },
  subHeaderText: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    textAlign: 'center',
    marginBottom: SPACING.md,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  scrollContainer: { paddingBottom: SPACING.xl },
  organizationLink: {
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    margin: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  linkText: {
    color: COLORS.accentGreen,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    textDecorationLine: 'underline',
  },
});
