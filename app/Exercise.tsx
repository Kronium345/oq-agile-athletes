import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ImageBackground,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

const exercises = [
  {
    text: 'Running',
    image:
      'https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&w=600&q=60',
    url: 'https://www.webmd.com/fitness-exercise/how-running-affects-mental-health',
  },
  {
    text: 'Meditation',
    image:
      'https://images.unsplash.com/photo-1579126038374-6064e9370f0f?auto=format&fit=crop&w=600&q=60',
    url: 'https://www.mayoclinic.org/tests-procedures/meditation/in-depth/meditation/art-20045858',
  },
  {
    text: 'Swimming',
    image:
      'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=600&q=60',
    url: 'https://www.swimmingworldmagazine.com/news/feeling-blue-go-for-a-swim-for-these-6-mental-health-benefits/',
  },
  {
    text: 'Cycling',
    image:
      'https://images.unsplash.com/photo-1523815378073-a43ae3fbf36a?auto=format&fit=crop&w=600&q=60',
    url: 'https://mensline.org.au/mens-mental-health/cycling-the-exercise-for-positive-mental-health/',
  },
  {
    text: 'Yoga',
    image:
      'https://images.unsplash.com/photo-1603988363607-e1e4a66962c6?auto=format&fit=crop&w=600&q=60',
    url: 'https://www.health.harvard.edu/staying-healthy/yoga-for-better-mental-health',
  },
  {
    text: 'Workout',
    image:
      'https://plus.unsplash.com/premium_photo-1670505059783-806c0708bb31?auto=format&fit=crop&w=600&q=60',
    url: 'https://www.helpguide.org/articles/healthy-living/the-mental-health-benefits-of-exercise.htm',
  },
];

export default function Exercise() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Wellness exercise</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.grid}>
          {exercises.map((box) => (
            <TouchableOpacity
              key={box.text}
              style={styles.box}
              onPress={() => Linking.openURL(box.url)}
            >
              <ImageBackground source={{ uri: box.image }} style={styles.boxImage}>
                <Text style={styles.boxText}>{box.text}</Text>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Weekly summary</Text>
          <Text style={styles.footerSub}>Keep moving for mind and body wellness.</Text>
        </View>
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
  },
  scroll: { paddingBottom: SPACING.xxxl },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  box: {
    width: '44%',
    aspectRatio: 1,
    margin: SPACING.sm,
    borderRadius: 10,
    overflow: 'hidden',
  },
  boxImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  boxText: {
    color: '#fff',
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  footer: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    borderRadius: 10,
  },
  footerTitle: {
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.medium,
    color: COLORS.textButton,
  },
  footerSub: {
    color: COLORS.textButton,
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.small,
  },
});
