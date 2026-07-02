export type EducationSection = {
  heading: string;
  paragraphs: string[];
};

export type EducationSource = {
  label: string;
  url: string;
};

export type EducationArticle = {
  slug: string;
  title: string;
  summary: string;
  readMinutes: number;
  /** Intro paragraphs shown before the sectioned content. */
  body: string[];
  /** Structured sections with sub-headings for a fuller read. */
  sections: EducationSection[];
  keyTakeaways: string[];
  sources: EducationSource[];
};

export const PERFORMANCE_EDUCATION_ARTICLES: EducationArticle[] = [
  {
    slug: 'recovery-basics',
    title: 'Recovery basics for athletes',
    summary:
      'Why rest, sleep, and nutrition matter as much as your training sessions.',
    readMinutes: 5,
    body: [
      'Training is only half of the equation. The gains you are chasing — more strength, endurance, and resilience — are built during recovery, not during the session itself. When you train, you create controlled stress and small amounts of muscle damage. When you recover, your body repairs that tissue and adapts so it can handle more next time.',
      'If recovery consistently falls short of the stress you apply, adaptation stalls. You may feel flat, notice lingering soreness, sleep poorly, or plateau despite working hard. Treating recovery as a skill — something you plan and monitor — is one of the most reliable ways to keep progressing.',
    ],
    sections: [
      {
        heading: 'The stress–recovery–adaptation cycle',
        paragraphs: [
          'Every hard session is a stressor. Your body responds by repairing and reinforcing the systems you challenged, a process often called supercompensation. Adaptation happens in the hours and days after training, which is why what you do between sessions matters so much.',
          'Problems appear when stress repeatedly outpaces recovery. This can look like reduced performance, disrupted sleep, low motivation, and elevated resting heart rate. Planning easier days and full rest days is not lost progress — it is when the progress is actually made.',
        ],
      },
      {
        heading: 'Sleep is the foundation',
        paragraphs: [
          'Sleep is the single most powerful recovery tool available, and it is free. Most adults need 7–9 hours per night, and athletes in heavy training often sit at the higher end of that range. Consistency — going to bed and waking at similar times — tends to matter more than the occasional long lie-in.',
          'During deep sleep your body releases growth hormone and carries out much of its tissue repair. Skimping on sleep blunts these processes and is linked with slower reaction time, reduced power output, and impaired decision-making.',
        ],
      },
      {
        heading: 'Fuel and hydration',
        paragraphs: [
          'Protein provides the building blocks for muscle repair. Many active adults do well aiming for roughly 1.6–2.2 g of protein per kilogram of body weight per day, spread across meals. Carbohydrate replenishes the glycogen you burn in training and supports harder sessions.',
          'Hydration underpins nearly every recovery process, from circulation to temperature regulation. Simple daily cues — thirst and urine colour — are enough for most people to stay on track without overthinking it.',
        ],
      },
      {
        heading: 'Use your check-ins',
        paragraphs: [
          'Your daily recovery check-in turns vague feelings into a trend you can act on. A single rough day is noise; a run of low energy and high soreness is a signal. When both climb together, that is usually the moment to insert a lighter day or extra sleep.',
          'Over time, the patterns in your check-ins become a personal recovery playbook — showing which habits leave you feeling ready and which leave you drained.',
        ],
      },
    ],
    keyTakeaways: [
      'Adaptation happens during recovery, not during the workout.',
      'Aim for 7–9 hours of consistent sleep, especially in hard training blocks.',
      'Target roughly 1.6–2.2 g of protein per kg of body weight and stay hydrated.',
      'Watch for combined low energy and high soreness — that is your cue to back off.',
    ],
    sources: [
      {
        label: 'Sleep Foundation — Sleep and athletic performance',
        url: 'https://www.sleepfoundation.org/physical-activity/athletic-performance-and-sleep',
      },
      {
        label: 'International Society of Sports Nutrition — Protein position stand',
        url: 'https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8',
      },
      {
        label: 'NHS — Physical activity guidelines for adults',
        url: 'https://www.nhs.uk/live-well/exercise/exercise-guidelines/physical-activity-guidelines-for-adults-aged-19-to-64/',
      },
    ],
  },
  {
    slug: 'sleep-and-performance',
    title: 'Sleep and performance',
    summary: 'How sleep quality affects energy, soreness, and training readiness.',
    readMinutes: 6,
    body: [
      'Sleep is where a huge share of your recovery happens. It is when hormones rebalance, memories and motor skills consolidate, and damaged tissue is repaired. For anyone training regularly, sleep quality often predicts how good the next session will feel.',
      'The encouraging part is that sleep is highly trainable. Small, repeatable habits usually deliver bigger results than any supplement or gadget.',
    ],
    sections: [
      {
        heading: 'What happens while you sleep',
        paragraphs: [
          'Sleep cycles through light sleep, deep (slow-wave) sleep, and REM sleep. Deep sleep is strongly associated with physical restoration and the release of growth hormone, while REM supports learning, mood, and coordination.',
          'Even one short night can measurably reduce power, endurance, focus, and reaction time. Chronic short sleep also raises perceived effort, so the same training load simply feels harder.',
        ],
      },
      {
        heading: 'Build a wind-down routine',
        paragraphs: [
          'Keep a regular bedtime and wake time, including on weekends where possible. A stable schedule strengthens your circadian rhythm, making it easier to fall asleep and wake feeling rested.',
          'Limit caffeine after midday — it has a long half-life and can linger for hours. Dim bright and blue light in the last hour before bed, keep the bedroom cool and dark, and give yourself a genuine buffer to switch off from screens and work.',
        ],
      },
      {
        heading: 'Read the trend, not the night',
        paragraphs: [
          'If you log sleep hours in your daily check-in, resist reacting to a single bad night. Look for patterns across the week. A one-off late night is normal life; several in a row is a load you should account for.',
          'Poor sleep combined with high training load is a common recipe for feeling run-down. When both are elevated at once, scaling back intensity for a day or two is a sensible, low-risk choice.',
        ],
      },
      {
        heading: 'When to seek help',
        paragraphs: [
          'Occasional restless nights are normal. But persistent trouble falling asleep, staying asleep, or waking unrefreshed despite good habits is worth discussing with a qualified health professional. This content is educational and is not a substitute for medical advice.',
        ],
      },
    ],
    keyTakeaways: [
      'Deep sleep drives physical repair; REM supports coordination and mood.',
      'A consistent sleep and wake time is more powerful than occasional catch-up sleep.',
      'Cut caffeine after midday and dim screens before bed.',
      'Track weekly sleep trends and ease off when poor sleep meets high load.',
    ],
    sources: [
      {
        label: 'Sleep Foundation — Athletic performance and sleep',
        url: 'https://www.sleepfoundation.org/physical-activity/athletic-performance-and-sleep',
      },
      {
        label: 'CDC — About sleep and how much you need',
        url: 'https://www.cdc.gov/sleep/about/index.html',
      },
      {
        label: 'NHS — How to get to sleep',
        url: 'https://www.nhs.uk/live-well/sleep-and-tiredness/how-to-get-to-sleep/',
      },
    ],
  },
  {
    slug: 'stress-and-cortisol',
    title: 'Stress, cortisol, and training',
    summary:
      'Educational overview of how life stress interacts with exercise — not medical advice.',
    readMinutes: 6,
    body: [
      'Your body does not neatly separate "training stress" from "life stress." Work pressure, poor sleep, travel, and emotional strain all draw on the same recovery capacity that your workouts do. Understanding this helps explain why some sessions feel great and others feel impossible for no obvious physical reason.',
      'Cortisol, often called the stress hormone, is a normal and useful part of this system. The goal is not to eliminate stress but to manage your total load so recovery can keep up.',
    ],
    sections: [
      {
        heading: 'Total load is cumulative',
        paragraphs: [
          'Think of your recovery capacity as a single bank account. Training withdraws from it, but so do a stressful week at work, a red-eye flight, and a string of late nights. When total withdrawals exceed deposits, everything suffers — including your workouts.',
          'This is why a moderate session can feel brutal during a stressful period. The training did not change; your available recovery did.',
        ],
      },
      {
        heading: 'How stress shows up in training',
        paragraphs: [
          'Elevated or prolonged stress can coincide with feeling flat in workouts, slower recovery between sessions, disrupted sleep, irritability, and reduced motivation. None of these are character flaws — they are signals that load is high.',
          'Your check-ins can help you connect the dots. A spike in perceived stress alongside dropping energy is a useful early-warning sign.',
        ],
      },
      {
        heading: 'Practical ways to manage load',
        paragraphs: [
          'Common, evidence-informed strategies include slow breathing exercises, easy walks and time outdoors, protecting sleep, and building planned deload weeks into your training. Lowering intensity temporarily is a legitimate tool, not a setback.',
          'Gentle movement and low-intensity aerobic exercise can themselves help regulate stress for many people, provided they are not simply adding more load on top of an already full plate.',
        ],
      },
      {
        heading: 'Know your limits',
        paragraphs: [
          'If stress feels overwhelming, persistent, or is affecting your daily functioning, please speak with a qualified health professional. This article is for general education only and does not diagnose or treat any condition.',
        ],
      },
    ],
    keyTakeaways: [
      'Training stress and life stress share one recovery budget.',
      'A hard-feeling session often reflects high life stress, not lost fitness.',
      'Breathing, easy walks, sleep, and deload weeks help manage total load.',
      'Seek professional support if stress is persistent or overwhelming.',
    ],
    sources: [
      {
        label: 'American Psychological Association — Stress effects on the body',
        url: 'https://www.apa.org/topics/stress/body',
      },
      {
        label: 'NHS — Exercise for depression and stress',
        url: 'https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/exercise-for-depression/',
      },
      {
        label: 'Mind — Managing stress',
        url: 'https://www.mind.org.uk/information-support/types-of-mental-health-problems/stress/',
      },
    ],
  },
  {
    slug: 'training-load-explained',
    title: 'Understanding training load',
    summary:
      'What Building, Normal, High, and Very High mean in your Performance Hub.',
    readMinutes: 5,
    body: [
      'Training load is a way of describing how much work you have done recently relative to what your body is used to. It is one of the most useful concepts in managing progress and reducing injury risk, because sudden jumps in load are a well-documented risk factor.',
      'In your Performance Hub, load blends your logged workouts and step volume, then compares your recent week against your typical month to place you in a band.',
    ],
    sections: [
      {
        heading: 'Acute vs chronic load',
        paragraphs: [
          'Acute load is roughly your most recent week of activity. Chronic load is your longer-term average — think of it as your current fitness base. The relationship between the two is what matters: doing a bit more than usual drives adaptation, while doing far more than usual raises risk.',
          'This idea is often expressed as the acute-to-chronic workload ratio. You do not need to calculate it manually; the bands in your hub translate the same principle into plain language.',
        ],
      },
      {
        heading: 'What each band means',
        paragraphs: [
          'Building: you are doing less than your usual baseline. This is ideal for recovery blocks, deloads, or returning after time off. It is not "falling behind" — it is often exactly what a fatigued body needs.',
          'Normal: a sustainable balance where recent work is close to your baseline. This is where most consistent progress happens.',
          'High and Very High: recent load is well above your baseline. This can be appropriate for short, planned pushes, but back-to-back high-load periods without recovery are where overuse problems tend to appear. Plan easier sessions or extra rest to bring things back into balance.',
        ],
      },
      {
        heading: 'Using load with your check-ins',
        paragraphs: [
          'Load is most powerful when read alongside how you feel. High load plus good recovery scores can be a productive overload. High load plus poor sleep, low energy, and rising soreness is a clearer signal to ease off.',
          'The aim is not to keep load low, but to make increases gradual and intentional rather than accidental spikes.',
        ],
      },
    ],
    keyTakeaways: [
      'Load compares your recent week to your typical month.',
      'Gradual increases drive adaptation; sudden spikes raise injury risk.',
      'Building supports recovery; Normal is sustainable; High/Very High needs planned rest.',
      'Read load together with your recovery check-ins, not in isolation.',
    ],
    sources: [
      {
        label: 'British Journal of Sports Medicine — Training load and injury',
        url: 'https://bjsm.bmj.com/content/50/5/273',
      },
      {
        label: 'NSCA — Monitoring training load',
        url: 'https://www.nsca.com/education/articles/kinetic-select/monitoring-training-load/',
      },
      {
        label: 'NHS — Exercise guidelines for adults',
        url: 'https://www.nhs.uk/live-well/exercise/exercise-guidelines/physical-activity-guidelines-for-adults-aged-19-to-64/',
      },
    ],
  },
  {
    slug: 'nutrition-recovery',
    title: 'Nutrition for recovery',
    summary: 'Protein, hydration, and alcohol — practical habits for active people.',
    readMinutes: 5,
    body: [
      'Nutrition gives your body the raw materials to repair and refuel after training. You do not need a perfect or complicated diet to recover well — a few consistent habits around protein, carbohydrate, hydration, and alcohol cover most of what matters for active people.',
      'Think of these as flexible guidelines rather than strict rules. Consistency over weeks beats perfection on any single day.',
    ],
    sections: [
      {
        heading: 'Protein for repair',
        paragraphs: [
          'Protein supplies the amino acids used to rebuild muscle after training. Needs vary with body size, training, and goals, but many active adults do well targeting roughly 1.6–2.2 g per kilogram of body weight per day.',
          'Spreading protein across the day — a portion at each meal — tends to support repair better than saving it all for one meal. Whole-food sources such as dairy, eggs, meat, fish, legumes, and soy all work well.',
        ],
      },
      {
        heading: 'Carbohydrate to refuel',
        paragraphs: [
          'Carbohydrate replenishes glycogen, your muscles’ main fuel for moderate and hard efforts. If you train frequently or intensely, under-fuelling on carbs can leave sessions feeling sluggish and recovery incomplete.',
          'Timing carbohydrate around your hardest sessions — before and after — can help, but total daily intake matters most for most recreational athletes.',
        ],
      },
      {
        heading: 'Hydration',
        paragraphs: [
          'Water supports circulation, temperature regulation, joint lubrication, and nutrient transport — all central to recovery. You rarely need to overthink it: drink to thirst across the day and use urine colour as a rough guide, aiming for a pale straw colour.',
          'For long or very sweaty sessions, replacing some electrolytes (particularly sodium) alongside fluid can help you rehydrate more effectively.',
        ],
      },
      {
        heading: 'Alcohol and logging',
        paragraphs: [
          'Alcohol can disrupt sleep quality and hydration and may blunt the muscle-repair response after training. You do not have to be perfect, but being aware of the trade-offs helps you make informed choices around key sessions.',
          'Logging alcohol and water in your check-ins helps you see genuine patterns — for example, whether nights out consistently precede your worst-feeling training days. Food Tracker in Agile Athletes will expand meal logging in a future update.',
        ],
      },
    ],
    keyTakeaways: [
      'Aim for ~1.6–2.2 g protein per kg body weight, spread across meals.',
      'Carbohydrate refuels glycogen — do not under-fuel frequent hard training.',
      'Drink to thirst; use urine colour as a simple hydration cue.',
      'Alcohol can impair sleep and recovery — log it to spot patterns.',
    ],
    sources: [
      {
        label: 'International Society of Sports Nutrition — Protein position stand',
        url: 'https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8',
      },
      {
        label: 'Academy of Nutrition and Dietetics — Nutrition and athletic performance',
        url: 'https://www.eatright.org/fitness/sports-and-performance/fueling-your-workout',
      },
      {
        label: 'NHS — Water, drinks and hydration',
        url: 'https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/water-drinks-nutrition/',
      },
    ],
  },
];

export function getEducationArticle(slug: string): EducationArticle | undefined {
  return PERFORMANCE_EDUCATION_ARTICLES.find((a) => a.slug === slug);
}

/** Recommendation categories used by the scoring engine. */
export type RecommendationTopic =
  | 'sleep'
  | 'stress'
  | 'nutrition'
  | 'training'
  | 'lifestyle';

/** Maps a recommendation category to the most relevant education article. */
const RECOMMENDATION_ARTICLE_MAP: Record<RecommendationTopic, string> = {
  sleep: 'sleep-and-performance',
  stress: 'stress-and-cortisol',
  nutrition: 'nutrition-recovery',
  training: 'training-load-explained',
  lifestyle: 'recovery-basics',
};

/** Returns the education article that best supports a recommendation type. */
export function getArticleForRecommendationType(
  type: string,
): EducationArticle | undefined {
  const slug = RECOMMENDATION_ARTICLE_MAP[type as RecommendationTopic];
  return slug ? getEducationArticle(slug) : undefined;
}
