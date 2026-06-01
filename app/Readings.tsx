import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  FlatList,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

const articlesData = [
  {
    id: '4',
    title: 'What Happens When Anxiety Turns to Anger',
    image:
      'https://images.ctfassets.net/cnu0m8re1exe/5fX7TliX2wYAPHZdl6SIs5/e760944e98288d53d9dc7d4ce1691b7f/shutterstock_2167253405.jpg',
    author: 'Naomi Weinshenker',
    date: 'Mar 2, 2023',
    url: 'https://www.discovermagazine.com/mind/what-happens-when-anxiety-turns-to-anger',
  },
  {
    id: '5',
    title: '50 of Our All-Time Best Mental Health Tips',
    image:
      'https://media.self.com/photos/6149e1495c7426d5aa080597/4:3/w_2560%2Cc_limit/Kibele%2520Yarman%2520-%25203.jpg',
    author: 'Hannah Dylan Pasternak',
    date: 'October 5, 2021',
    url: 'https://www.self.com/story/best-mental-health-tips',
  },
  {
    id: '3',
    title: 'Best Anger Management Tips To Help You Keep Your Cool',
    image:
      'https://www.allthingshealth.com/en-us/_next/image/?url=https%3A%2F%2Fallthingshealth.b-cdn.net%2Fen-us%2Fwp-content%2Fuploads%2Fsites%2F3%2F2022%2F03%2Fanger-management-min-768x512.jpg&w=1920&q=75',
    author: 'Heather Hanks',
    date: 'March 21, 2022',
    url: 'https://www.allthingshealth.com/en-us/mental-health/stress-anxiety-relief/anger-management/',
  },
  {
    id: '2',
    title: 'Anger - how it affects people',
    image:
      'https://img.freepik.com/free-vector/abstract-medical-wallpaper-template-design_53876-61802.jpg',
    author: 'Department of Health',
    date: '',
    url: 'https://www.betterhealth.vic.gov.au/health/healthyliving/anger-how-it-affects-people',
  },
  {
    id: '1',
    title: '10 Things You Can Do for Your Mental Health',
    image:
      'https://uhs.umich.edu/files/uhs/styles/large/public/field/image/man-playing-basketball.jpg',
    author: 'University of Michigan',
    date: '',
    url: 'https://uhs.umich.edu/tenthings',
  },
];

export default function Readings() {
  const router = useRouter();

  const renderItem = ({ item }: { item: (typeof articlesData)[0] }) => (
    <TouchableOpacity
      style={styles.articleItem}
      onPress={() => Linking.openURL(item.url)}
    >
      <Image source={{ uri: item.image }} style={styles.img} />
      <Text style={styles.titleText}>{item.title}</Text>
      <Text style={styles.author}>
        By {item.author}
        {item.date ? ` | ${item.date}` : ''}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Readings</Text>
        <View style={{ width: 22 }} />
      </View>
      <FlatList
        data={articlesData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
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
  },
  list: { padding: SPACING.md, paddingBottom: SPACING.xxxl },
  articleItem: {
    backgroundColor: COLORS.backgroundCard,
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    borderRadius: 8,
  },
  img: { width: '100%', height: 180, borderRadius: 8 },
  titleText: {
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.medium,
    marginTop: SPACING.sm,
    color: COLORS.textPrimary,
  },
  author: {
    color: COLORS.textSecondary,
    marginTop: 4,
    fontSize: TYPOGRAPHY.fontSize.small,
  },
});
