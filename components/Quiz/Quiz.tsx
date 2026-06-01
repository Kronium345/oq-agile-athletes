import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../constants/theme';
import { usePremiumGate } from '../../hooks/usePremiumGate';
import { fetchQuizQuestions, predictQuiz } from '../../services/quizApi';
import Result from '../Result/Result';
import { QuizQuestion } from './questions';

export default function Quiz() {
  const router = useRouter();
  const { isPremiumLoading, requirePremium } = usePremiumGate('Assessment');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [prediction, setPrediction] = useState<{
    label: number;
    category: string;
    description: string;
    suggestion: string;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchQuizQuestions();
      setQuestions(data);
    } catch {
      setErr('Could not load assessment questions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isPremiumLoading) return;
      if (!requirePremium()) return;
      loadQuestions();
    }, [isPremiumLoading, requirePremium, loadQuestions]),
  );

  const handleOptionPress = (name: string, value: number) => {
    setQuestions((prev) =>
      prev.map((q) => (q.name === name ? { ...q, selected: value } : q)),
    );
  };

  const handleSubmit = async () => {
    const features: Record<string, number> = {};
    for (const question of questions) {
      if (question.selected === null) {
        setErr(`Please select an option for: "${question.text}"`);
        return;
      }
      features[question.name] = question.selected;
    }

    setSubmitting(true);
    setErr(null);
    try {
      const data = await predictQuiz(features);
      setPrediction({
        label: data.label,
        category: data.category,
        description: data.description,
        suggestion: data.suggestion,
      });
    } catch {
      setErr('Having trouble running the assessment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetQuiz = async () => {
    setPrediction(null);
    setErr(null);
    await loadQuestions();
  };

  if (loading || isPremiumLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (prediction) {
    return (
      <Result prediction={prediction} resetQuiz={resetQuiz} />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Anger & anxiety assessment</Text>
        <View style={styles.back} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>
          Answer all 23 questions. Results use a 4-outcome anger × anxiety matrix
          (wellness support only).
        </Text>

        {questions.map((question) => (
          <View key={question.name} style={styles.card}>
            <Text style={styles.question}>{question.text}</Text>
            {question.options.map((op) => {
              const selected = question.selected === op.value;
              return (
                <TouchableOpacity
                  key={`${question.name}-${op.value}`}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => handleOptionPress(question.name, op.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.optionTextSelected,
                    ]}
                  >
                    {op.text}
                  </Text>
                  {selected ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={COLORS.textButton}
                    />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {err ? <Text style={styles.errText}>{err}</Text> : null}

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.textButton} />
          ) : (
            <Text style={styles.submitText}>Submit assessment</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  back: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  scroll: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  intro: {
    fontSize: TYPOGRAPHY.fontSize.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  question: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    marginVertical: 4,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
  },
  optionSelected: {
    backgroundColor: COLORS.primaryDark,
  },
  optionText: {
    flex: 1,
    color: COLORS.textButton,
    fontSize: TYPOGRAPHY.fontSize.regular,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  optionTextSelected: {
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  errText: {
    color: COLORS.error,
    textAlign: 'center',
    marginVertical: SPACING.md,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  submitBtn: {
    backgroundColor: COLORS.accentGreen,
    borderRadius: BORDER_RADIUS.medium,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  submitText: {
    color: COLORS.textButton,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
});
