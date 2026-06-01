import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  FlatList,
  ImageBackground,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { UkGatedMindScreen } from '../components/mindCenter/UkGatedMindScreen';
import RatingStar from '../components/RatingStar/RatingStar';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

const hospitalData = [
  {
    id: '1',
    url: 'https://www.google.com/maps/place/Maudsley+Hospital',
    name: 'Maudsley Hospital',
    image:
      'https://www.slam.nhs.uk/media/1028/download/maudsley-hospital-denmark-hill-entrance.jpg',
    address: 'Denmark Hill, London SE5 8AZ',
    contactNumber: '020 3228 6000',
    rating: '4.2',
    review: [
      {
        name: 'NHS Patient',
        comment: 'Excellent mental health services and supportive staff',
      },
    ],
  },
  {
    id: '2',
    url: 'https://www.google.com/maps/place/Bethlem+Royal+Hospital',
    name: 'Bethlem Royal Hospital',
    image:
      'https://www.slam.nhs.uk/media/1027/download/bethlem-royal-hospital-entrance.jpg',
    address: 'Monks Orchard Road, Beckenham BR3 3BX',
    contactNumber: '020 3228 6000',
    rating: '4.0',
    review: [
      {
        name: 'Mental Health Advocate',
        comment:
          'Historic mental health hospital with modern facilities and excellent care',
      },
    ],
  },
  {
    id: '3',
    url: 'https://www.google.com/maps/place/Priory+Hospital+Roehampton',
    name: 'Priory Hospital Roehampton',
    image:
      'https://www.priorygroup.com/media/3723/roehampton-hospital-exterior.jpg',
    address: 'Priory Ln, London SW15 5JJ',
    contactNumber: '0208 876 8261',
    rating: '4.5',
    review: [
      {
        name: 'Former Patient',
        comment: 'Professional mental health care in a supportive environment',
      },
    ],
  },
  {
    id: '4',
    url: 'https://www.google.com/maps/place/The+Nightingale+Hospital',
    name: 'The Nightingale Hospital',
    image:
      'https://www.nightingalehospital.co.uk/wp-content/uploads/2019/10/Nightingale-Hospital-London-Exterior-1.jpg',
    address: '11-19 Lisson Grove, Marylebone, London NW1 6SH',
    contactNumber: '020 7535 7700',
    rating: '4.3',
    review: [
      {
        name: 'Mental Health Professional',
        comment: 'Leading private mental health hospital with specialist care',
      },
    ],
  },
];

export default function Hospitals() {
  const router = useRouter();

  const renderItem = ({ item }: { item: (typeof hospitalData)[0] }) => (
    <View style={styles.hospitalItem}>
      <ImageBackground source={{ uri: item.image }} style={styles.img}>
        <TouchableOpacity
          style={styles.shadowBox}
          onPress={() => Linking.openURL(item.url)}
        >
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.address}>{item.address}</Text>
        </TouchableOpacity>
      </ImageBackground>
      <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.contactNumber}`)}>
        <Text style={styles.contactNumber}>{item.contactNumber}</Text>
      </TouchableOpacity>
      {item.review.map((r) => (
        <View key={r.name} style={styles.reviewSection}>
          <Text style={styles.reviewer}>{r.name}</Text>
          <Text style={styles.review}>"{r.comment}"</Text>
        </View>
      ))}
      <RatingStar rating={item.rating} />
      <Text style={styles.citation}>Source: NHS UK and hospital websites</Text>
    </View>
  );

  return (
    <UkGatedMindScreen style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Hospitals (UK)</Text>
        <View style={{ width: 22 }} />
      </View>
      <FlatList
        data={hospitalData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </UkGatedMindScreen>
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
  },
  list: { padding: SPACING.md, paddingBottom: SPACING.xxxl },
  hospitalItem: {
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundCard,
  },
  img: { width: '100%', height: 180, borderRadius: 8, overflow: 'hidden' },
  shadowBox: {
    backgroundColor: 'rgba(26, 36, 33, 0.75)',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    paddingBottom: SPACING.md,
  },
  name: {
    color: '#fff',
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.medium,
    textAlign: 'center',
  },
  address: { color: '#fff', textAlign: 'center' },
  contactNumber: {
    marginTop: SPACING.sm,
    textDecorationLine: 'underline',
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  reviewSection: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 8,
  },
  reviewer: { fontWeight: TYPOGRAPHY.fontWeight.bold, fontStyle: 'italic' },
  review: { fontStyle: 'italic', color: COLORS.textSecondary },
  citation: {
    fontSize: TYPOGRAPHY.fontSize.extraSmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});
