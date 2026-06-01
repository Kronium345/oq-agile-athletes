import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { COLORS } from '../../constants/theme';

type Props = {
  role: 'user' | 'bot';
  userAvatarUri?: string;
};

export function ChatAvatar({ role, userAvatarUri }: Props) {
  if (role === 'user' && userAvatarUri) {
    return (
      <View style={styles.wrap}>
        <Image source={{ uri: userAvatarUri }} style={styles.image} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: 36, height: 36 },
  logo: { width: 36, height: 36, resizeMode: 'contain' },
});
