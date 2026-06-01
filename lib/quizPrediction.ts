import { QuizCategory } from '../components/Quiz/questions';

const ANGER_KEYS = ['s12', 's13', 's14', 's15', 's16', 's17', 's18'];
const ANXIETY_KEYS = ['s19', 's20', 's21', 's22', 's23', 's24', 's25'];

export function scoreAngerHigh(features: Record<string, number>): boolean {
  const sum = ANGER_KEYS.reduce((acc, key) => acc + (features[key] ?? 0), 0);
  return sum / ANGER_KEYS.length >= 2.5;
}

export function scoreAnxietyHigh(features: Record<string, number>): boolean {
  const sum = ANXIETY_KEYS.reduce((acc, key) => acc + (features[key] ?? 0), 0);
  return sum / ANXIETY_KEYS.length >= 1.5;
}

/** 4-class anger × anxiety matrix label (0–3). */
export function getQuizLabel(features: Record<string, number>): number {
  const anger = scoreAngerHigh(features);
  const anxiety = scoreAnxietyHigh(features);
  if (!anger && !anxiety) return 0;
  if (anger && !anxiety) return 1;
  if (!anger && anxiety) return 2;
  return 3;
}

export type QuizPredictionResult = {
  msg: 'success';
  label: number;
  category: string;
  description: string;
  suggestion: string;
};

export function predictFromFeatures(
  features: Record<string, number>,
  categoryList: QuizCategory[],
): QuizPredictionResult {
  const label = getQuizLabel(features);
  const match =
    categoryList.find((c) => c.label === label) ?? categoryList[0];
  return {
    msg: 'success',
    label: match.label,
    category: match.category,
    description: match.description,
    suggestion: match.suggestion,
  };
}
