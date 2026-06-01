import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../constants/theme';
import OutcomeMatrix from '../OutcomeMatrix/OutcomeMatrix';

type Prediction = {
  label: number;
  category: string;
  description: string;
  suggestion: string;
};

type Props = {
  prediction: Prediction;
  resetQuiz: () => void | Promise<void>;
};

export default function Result({ prediction, resetQuiz }: Props) {
  const router = useRouter();

  const onSuggestionPress = () => {
    if (prediction.suggestion === 'exercise') {
      router.push('/Exercise' as any);
    } else {
      router.push('/(drawer)/mental' as any);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.category}>{prediction.category}</Text>
          <Text style={styles.description}>{prediction.description}</Text>
        </View>

        <View style={styles.card}>
          <OutcomeMatrix activeLabel={prediction.label} />
        </View>

        <TouchableOpacity style={styles.suggestionBtn} onPress={onSuggestionPress}>
          <Text style={styles.suggestionText}>
            {prediction.suggestion === 'exercise'
              ? 'View wellness exercises'
              : 'Explore Mind Center resources'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => resetQuiz()}>
          <Text style={styles.buttonText}>Test again</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  category: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    paddingLeft: SPACING.sm,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  suggestionBtn: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderOrange,
  },
  suggestionText: {
    textAlign: 'center',
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
});
