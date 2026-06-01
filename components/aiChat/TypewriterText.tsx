import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';

type Props = {
  text: string;
  onComplete?: () => void;
  style?: TextStyle;
};

export function TypewriterText({ text, onComplete, style }: Props) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, 6);
      return () => clearTimeout(timeout);
    }
    onComplete?.();
  }, [currentIndex, text, onComplete]);

  return (
    <Text style={[styles.text, style]}>{displayedText}</Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.regular,
    lineHeight: 20,
  },
});
