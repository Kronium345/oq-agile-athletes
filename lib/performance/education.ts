export type EducationArticle = {
  slug: string;
  title: string;
  summary: string;
  readMinutes: number;
  body: string[];
};

export const PERFORMANCE_EDUCATION_ARTICLES: EducationArticle[] = [
  {
    slug: 'recovery-basics',
    title: 'Recovery basics for athletes',
    summary:
      'Why rest, sleep, and nutrition matter as much as your training sessions.',
    readMinutes: 4,
    body: [
      'Recovery is when your body adapts to training. Without adequate sleep and fuel, performance plateaus and injury risk rises.',
      'Aim for 7–9 hours of sleep when training hard. Consistency matters more than occasional long sleeps.',
      'Protein supports muscle repair; hydration supports circulation and temperature regulation.',
      'Use daily check-ins to spot patterns — low energy and high soreness often signal you need a lighter day.',
    ],
  },
  {
    slug: 'sleep-and-performance',
    title: 'Sleep and performance',
    summary: 'How sleep quality affects energy, soreness, and training readiness.',
    readMinutes: 5,
    body: [
      'Deep sleep supports hormone balance and tissue repair. Even one short night can reduce power and focus.',
      'Keep a regular bedtime, limit caffeine after midday, and dim screens before sleep.',
      'If you track sleep hours in your daily check-in, look for trends across the week rather than single nights.',
      'Poor sleep plus high training load is a common combo — consider scaling intensity when both are elevated.',
    ],
  },
  {
    slug: 'stress-and-cortisol',
    title: 'Stress, cortisol, and training',
    summary:
      'Educational overview of how life stress interacts with exercise — not medical advice.',
    readMinutes: 5,
    body: [
      'Physical training is a stressor. Life stress (work, travel, poor sleep) adds to your total load.',
      'Elevated perceived stress can coincide with feeling flat in workouts or slower recovery between sessions.',
      'Breathing exercises, easy walks, and deload weeks are common strategies athletes use to manage load.',
      'If stress feels overwhelming or persistent, speak with a qualified health professional.',
    ],
  },
  {
    slug: 'training-load-explained',
    title: 'Understanding training load',
    summary:
      'What Building, Normal, High, and Very High mean in your Performance Hub.',
    readMinutes: 4,
    body: [
      'Training load compares your recent week of activity to your typical month. It blends logged workouts and step volume.',
      'Building: you are doing less than usual — good for recovery blocks or return from time off.',
      'Normal: a sustainable balance for most athletes.',
      'High / Very High: acute load is well above your baseline — plan easier sessions or extra recovery.',
    ],
  },
  {
    slug: 'nutrition-recovery',
    title: 'Nutrition for recovery',
    summary: 'Protein, hydration, and alcohol — practical habits for active people.',
    readMinutes: 4,
    body: [
      'Protein needs vary by body size and goals; many active adults target roughly 1.6–2.2 g per kg body weight.',
      'Hydration supports every recovery process. Thirst and urine color are simple daily cues.',
      'Alcohol can disrupt sleep quality and hydration. Logging it in check-ins helps you see patterns.',
      'Food Tracker in Agile Athletes will expand meal logging in a future update.',
    ],
  },
];

export function getEducationArticle(slug: string): EducationArticle | undefined {
  return PERFORMANCE_EDUCATION_ARTICLES.find((a) => a.slug === slug);
}
