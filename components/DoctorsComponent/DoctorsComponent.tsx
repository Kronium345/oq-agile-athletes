import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../constants/theme';
import { professionalResources } from './doctorsData';

export default function DoctorsComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Find professional help (UK)</Text>
      <Text style={styles.subHeaderText}>
        Official directories and NHS services — not individual doctor
        recommendations. Always verify credentials and consult your GP for
        referrals.
      </Text>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {professionalResources.map((resource) => (
          <View key={resource.url} style={styles.card}>
            <View style={styles.cardHeader}>
              <Feather name='book-open' size={22} color={COLORS.primary} />
              <View style={styles.cardTitles}>
                <Text style={styles.name}>{resource.name}</Text>
                <Text style={styles.specialist}>{resource.specialist}</Text>
              </View>
            </View>
            <Text style={styles.description}>{resource.description}</Text>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => Linking.openURL(resource.url)}
            >
              <Text style={styles.linkText}>Open official directory</Text>
              <Feather name='external-link' size={16} color={COLORS.textButton} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    lineHeight: 20,
    paddingHorizontal: SPACING.sm,
  },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingBottom: SPACING.xxxl },
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cardTitles: { flex: 1 },
  name: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  specialist: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.accentGreen,
    marginTop: 2,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
  },
  linkText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.regular,
  },
});
