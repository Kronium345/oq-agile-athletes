import { qtn, categories, QuizQuestion } from '../components/Quiz/questions';
import { predictFromFeatures, QuizPredictionResult } from '../lib/quizPrediction';
import api from '../api/axios';

function normalizeQuestions(raw: unknown): QuizQuestion[] | null {
  const list = Array.isArray(raw)
    ? raw
    : (raw as { data?: QuizQuestion[] })?.data;
  if (!Array.isArray(list) || list.length === 0) return null;
  return list.map((q) => ({
    ...q,
    selected: q.selected ?? null,
  }));
}

export async function fetchQuizQuestions(): Promise<QuizQuestion[]> {
  try {
    const response = await api.get('/quiz/quiz');
    const parsed = normalizeQuestions(response);
    if (parsed) return parsed;
  } catch {
    // Backend may not expose /quiz yet — use bundled seed data.
  }
  return qtn.map((q) => ({ ...q, selected: null }));
}

export async function predictQuiz(
  features: Record<string, number>,
): Promise<QuizPredictionResult> {
  try {
    const response = (await api.post('/quiz/predict', features)) as
      | QuizPredictionResult
      | {
          msg?: string;
          category?: string;
          description?: string;
          suggestion?: string;
          label?: number;
        };
    if (response?.msg === 'success' && response.category && response.description) {
      const label =
        typeof response.label === 'number'
          ? response.label
          : categories.find((c) => c.category === response.category)?.label ?? 0;
      return {
        msg: 'success',
        label,
        category: response.category,
        description: response.description,
        suggestion: response.suggestion ?? 'all',
      };
    }
  } catch {
    // Fall through to client-side 4-class matrix.
  }
  return predictFromFeatures(features, categories);
}
