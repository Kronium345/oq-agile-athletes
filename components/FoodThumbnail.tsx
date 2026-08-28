import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BORDER_RADIUS, COLORS } from '../constants/theme';
import { sanitizeImageUrl } from '../services/foodApi';

type Props = {
  uri?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Food image with a graceful fallback.
 *
 * Thumbnails are resolved from the food name server-side, so a URL can be absent
 * (uncommon food) or fail to load (remote host hiccup). Both cases fall back to
 * the icon tile rather than leaving an empty box.
 */
export default function FoodThumbnail({ uri, size = 52, style }: Props) {
  const source = sanitizeImageUrl(uri);
  const [failed, setFailed] = useState(false);

  // A recycled list row can receive a new URL, so clear the previous failure.
  useEffect(() => {
    setFailed(false);
  }, [source]);

  const box = { width: size, height: size, borderRadius: BORDER_RADIUS.small };

  return (
    <View style={[box, styles.container, style]}>
      {!source || failed ? (
        <Ionicons name='restaurant-outline' size={size * 0.45} color={COLORS.primary} />
      ) : (
        <Image
          source={{ uri: source }}
          style={styles.image}
          resizeMode='cover'
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
