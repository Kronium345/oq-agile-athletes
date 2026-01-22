import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet } from 'react-native';
import { GRADIENTS } from '../constants/theme';

interface BackgroundGradientProps {
  children?: React.ReactNode;
  variant?: 'default' | 'card';
}

const BackgroundGradient: React.FC<BackgroundGradientProps> = ({
  children,
  variant = 'default',
}) => {
  const colors = variant === 'default' ? GRADIENTS.background : GRADIENTS.card;

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});

export default BackgroundGradient;

