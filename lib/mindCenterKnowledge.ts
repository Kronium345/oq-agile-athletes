/** Canonical Mind Center facts — used in UI screens and AI reference prompts. */

export type EmergencyContact = {
  name: string;
  number: string;
  description: string;
  href: string;
};

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    name: 'Emergency Services',
    number: '999',
    description: 'For immediate danger to life',
    href: 'tel:999',
  },
  {
    name: 'NHS Non-Emergency',
    number: '111',
    description: 'For urgent medical advice',
    href: 'tel:111',
  },
  {
    name: 'Samaritans 24/7',
    number: '116 123',
    description: 'Free confidential support',
    href: 'tel:116123',
  },
  {
    name: 'Mind Infoline',
    number: '0300 123 3393',
    description: 'Mental health information (9am–6pm Mon–Fri)',
    href: 'tel:03001233393',
  },
  {
    name: 'CALM',
    number: '0800 58 58 58',
    description: 'For men in crisis (5pm–midnight)',
    href: 'tel:0800585858',
  },
  {
    name: 'Shout Crisis Text Line',
    number: 'Text SHOUT to 85258',
    description: '24/7 text support',
    href: 'sms:85258&body=SHOUT',
  },
];

export type ProfessionalResource = {
  name: string;
  specialist: string;
  description: string;
  url: string;
};

/** Official UK directories — not individual clinician profiles. */
export const MIND_CENTER_PROFESSIONAL_RESOURCES: ProfessionalResource[] = [
  {
    name: 'Royal College of Psychiatrists',
    specialist: 'Find a Psychiatrist',
    description:
      'Directory of psychiatrists and psychiatric trainees in the UK.',
    url: 'https://www.rcpsych.ac.uk/members/public-members-list',
  },
  {
    name: 'British Psychological Society',
    specialist: 'Find a Psychologist',
    description:
      'Search for Chartered Psychologists by location and speciality.',
    url: 'https://www.bps.org.uk/find-psychologist',
  },
  {
    name: 'HCPC Register',
    specialist: 'Verify a Psychologist',
    description:
      'Check whether a psychologist is professionally registered.',
    url: 'https://www.hcpc-uk.org/check-the-register/',
  },
  {
    name: 'NHS Talking Therapies',
    specialist: 'Free NHS Mental Health Support',
    description:
      'Access NHS therapy services for anxiety and depression.',
    url: 'https://www.nhs.uk/nhs-services/mental-health-services/find-nhs-talking-therapies-for-anxiety-and-depression/',
  },
];

export const MIND_CENTER_HOSPITALS = [
  {
    name: 'Maudsley Hospital',
    address: 'Denmark Hill, London SE5 8AZ',
    contactNumber: '020 3228 6000',
    mapsUrl: 'https://www.google.com/maps/place/Maudsley+Hospital',
  },
  {
    name: 'Bethlem Royal Hospital',
    address: 'Monks Orchard Road, Beckenham BR3 3BX',
    contactNumber: '020 3228 6000',
    mapsUrl: 'https://www.google.com/maps/place/Bethlem+Royal+Hospital',
  },
  {
    name: 'Priory Hospital Roehampton',
    address: 'Priory Ln, London SW15 5JJ',
    contactNumber: '0208 876 8261',
    mapsUrl: 'https://www.google.com/maps/place/Priory+Hospital+Roehampton',
  },
  {
    name: 'The Nightingale Hospital',
    address: '11-19 Lisson Grove, Marylebone, London NW1 6SH',
    contactNumber: '020 7535 7700',
    mapsUrl: 'https://www.google.com/maps/place/The+Nightingale+Hospital',
  },
];

export const MIND_CENTER_READINGS = [
  {
    title: 'What Happens When Anxiety Turns to Anger',
    author: 'Naomi Weinshenker',
    url: 'https://www.discovermagazine.com/mind/what-happens-when-anxiety-turns-to-anger',
  },
  {
    title: '50 of Our All-Time Best Mental Health Tips',
    author: 'Hannah Dylan Pasternak',
    url: 'https://www.self.com/story/best-mental-health-tips',
  },
  {
    title: 'Best Anger Management Tips To Help You Keep Your Cool',
    author: 'Heather Hanks',
    url: 'https://www.allthingshealth.com/en-us/mental-health/stress-anxiety-relief/anger-management/',
  },
  {
    title: 'Anger - how it affects people',
    author: 'Department of Health (Better Health Victoria)',
    url: 'https://www.betterhealth.vic.gov.au/health/healthyliving/anger-how-it-affects-people',
  },
  {
    title: '10 Things You Can Do for Your Mental Health',
    author: 'University of Michigan',
    url: 'https://uhs.umich.edu/tenthings',
  },
];

export const MIND_CENTER_GENERAL_INFO = `
Mind Center (Agile Athletes) provides wellness education only — not medical advice, diagnosis, or treatment.
Features: self-assessment (anger & anxiety quiz), exercise articles for mental wellness, links to official UK professional directories (not individual doctor recommendations), UK hospital listings, curated readings, and UK emergency contacts.
Professional help: use official directories (Royal College of Psychiatrists, British Psychological Society, HCPC, NHS Talking Therapies) — the app does not recommend individual clinicians.
In immediate danger in the UK, always call 999.
For urgent non-emergency medical advice in the UK, call 111.
`.trim();

function formatReferenceBlock(): string {
  const emergency = EMERGENCY_CONTACTS.map(
    (c) =>
      `- ${c.name}: ${c.number}. ${c.description}`,
  ).join('\n');

  const directories = MIND_CENTER_PROFESSIONAL_RESOURCES.map(
    (r) =>
      `- ${r.name} (${r.specialist}): ${r.description} URL: ${r.url}`,
  ).join('\n');

  const hospitals = MIND_CENTER_HOSPITALS.map(
    (h) =>
      `- ${h.name}, ${h.address}, Phone: ${h.contactNumber}`,
  ).join('\n');

  const readings = MIND_CENTER_READINGS.map(
    (r) => `- "${r.title}" by ${r.author} (${r.url})`,
  ).join('\n');

  return `
GENERAL INFORMATION:
${MIND_CENTER_GENERAL_INFO}

UK EMERGENCY & CRISIS CONTACTS:
${emergency}

UK PROFESSIONAL DIRECTORIES (OFFICIAL SOURCES ONLY):
${directories}

MENTAL HEALTH HOSPITALS (UK):
${hospitals}

CURATED READINGS:
${readings}
`.trim();
}

/**
 * Full prompt sent to /chat/generate for Mind Center questions.
 * Instructs the model to use only the embedded reference for contacts and listings.
 */
export function buildMindCenterChatPrompt(userMessage: string): string {
  return `You are the Mind Center assistant for Agile Athletes (UK-focused mental wellness app).

RULES:
1. For emergency contacts, phone numbers, hospital names, addresses, doctor listings, and app feature descriptions — use ONLY the VERIFIED REFERENCE DATA below. Do not invent numbers, names, or URLs.
2. If the user asks for information not in the reference, say you do not have it in the app database and suggest they open the relevant Mind Center screen (Emergency, Doctors, Hospitals, or Readings) or call NHS 111 / 999 if urgent.
3. Respond in plain English. Do not use markdown, asterisks, hashtags, or bold formatting. Use short paragraphs and simple line breaks.
4. This is wellness support only — not medical diagnosis or treatment. Encourage professional help when appropriate.

VERIFIED REFERENCE DATA:
${formatReferenceBlock()}

USER QUESTION:
${userMessage}`;
}
