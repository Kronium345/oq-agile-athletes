import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundGradient from '../../../components/BackgroundGradient';
import { MatchResultCard } from '../../../components/trainers/MatchResultCard';
import { TrainerScreenHeader } from '../../../components/trainers/TrainerScreenHeader';
import { drawerScreenStyles } from '../../../constants/drawerScreen';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import { matchTrainers } from '../../../services/trainerMatchApi';
import type { TrainerMatchResult } from '../../../types/trainer';

export default function TrainerMatchScreen() {
  const [goal, setGoal] = useState('');
  const [budget, setBudget] = useState('');
  const [postcode, setPostcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrainerMatchResult | null>(null);

  const handleMatch = async () => {
    if (goal.trim().length < 5) return;
    setLoading(true);
    try {
      const data = await matchTrainers({
        goal: goal.trim(),
        budget: budget.trim() || undefined,
        postcode: postcode.trim() || undefined,
      });
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundGradient>
      <SafeAreaView style={drawerScreenStyles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={drawerScreenStyles.scrollContent}>
          <TrainerScreenHeader
            title='AI trainer match'
            subtitle='We suggest trainers based on your goals'
            avoidDrawerMenu
          />
          <TextInput
            style={styles.input}
            placeholder='Your goal (e.g. lose 10kg, train 3x/week)'
            placeholderTextColor={COLORS.textSecondary}
            value={goal}
            onChangeText={setGoal}
          />
          <TextInput
            style={styles.input}
            placeholder='Budget (optional)'
            placeholderTextColor={COLORS.textSecondary}
            value={budget}
            onChangeText={setBudget}
          />
          <TextInput
            style={styles.input}
            placeholder='Postcode (optional)'
            placeholderTextColor={COLORS.textSecondary}
            value={postcode}
            onChangeText={setPostcode}
            autoCapitalize='characters'
          />
          <TouchableOpacity style={styles.btn} onPress={handleMatch} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Matching…' : 'Find my match'}</Text>
          </TouchableOpacity>
          {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 16 }} /> : null}
          {result?.trainers.map((t, i) => (
            <MatchResultCard
              key={t.id}
              trainer={t}
              explanation={result.explanations[i]}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    color: COLORS.textPrimary,
  },
  btn: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  btnText: { color: COLORS.textButton, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
});
