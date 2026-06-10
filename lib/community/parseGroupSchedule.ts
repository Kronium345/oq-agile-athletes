import { addDays, setHours, setMinutes, setSeconds } from 'date-fns';

export type GroupSessionOption = {
  id: string;
  label: string;
  startsAt: Date;
};

const WEEKDAY_INDEX: Record<string, number> = {
  sun: 0,
  sunday: 0,
  sundays: 0,
  mon: 1,
  monday: 1,
  mondays: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  tuesdays: 2,
  wed: 3,
  weds: 3,
  wednesday: 3,
  wednesdays: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  thursdays: 4,
  fri: 5,
  friday: 5,
  fridays: 5,
  sat: 6,
  saturday: 6,
  saturdays: 6,
};

function nextWeekdayOccurrence(
  weekday: number,
  hour: number,
  minute: number,
  from = new Date(),
): Date {
  const base = setSeconds(setMinutes(setHours(from, hour), minute), 0);
  const currentDay = base.getDay();
  let delta = (weekday - currentDay + 7) % 7;
  if (delta === 0 && base <= from) delta = 7;
  return addDays(base, delta);
}

function parseTimeToken(raw: string): { hour: number; minute: number } | null {
  const match = raw
    .trim()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  const meridiem = match[3]?.toLowerCase();

  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  if (!meridiem && hour <= 7) hour += 12;

  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

function parseSegment(segment: string, from: Date): GroupSessionOption[] {
  const text = segment.trim();
  if (!text) return [];

  const dayTime =
    text.match(
      /\b(sun(?:day)?s?|mon(?:day)?s?|tue(?:s(?:day)?)?s?|wed(?:nesday)?s?|thu(?:rs(?:day)?)?s?|fri(?:day)?s?|sat(?:urday)?s?)\b[^0-9]*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
    ) ?? text.match(
      /\b(sun(?:day)?s?|mon(?:day)?s?|tue(?:s(?:day)?)?s?|wed(?:nesday)?s?|thu(?:rs(?:day)?)?s?|fri(?:day)?s?|sat(?:urday)?s?)\b/i,
    );

  if (!dayTime) return [];

  const dayKey = dayTime[1].toLowerCase().slice(0, 3);
  const weekday = WEEKDAY_INDEX[dayKey];
  if (weekday == null) return [];

  const time = dayTime[2] ? parseTimeToken(dayTime[2]) : { hour: 10, minute: 0 };
  if (!time) return [];

  const startsAt = nextWeekdayOccurrence(weekday, time.hour, time.minute, from);
  const label = dayTime[2]
    ? `${dayTime[1]} ${dayTime[2].trim()}`
    : `${dayTime[1]} (default 10:00)`;

  return [
    {
      id: `${weekday}-${time.hour}-${time.minute}-${label}`,
      label,
      startsAt,
    },
  ];
}

/** Turn schedule text into upcoming session choices (next occurrence each). */
export function parseGroupScheduleOptions(
  scheduleSummary?: string,
  from = new Date(),
): GroupSessionOption[] {
  if (!scheduleSummary?.trim()) {
    const fallback = addDays(setSeconds(setMinutes(setHours(from, 10), 0), 0), 7);
    return [
      {
        id: 'fallback-week',
        label: 'Next week (10:00)',
        startsAt: fallback,
      },
    ];
  }

  const segments = scheduleSummary
    .split(/[,;]|\s+&\s+/i)
    .flatMap((part) => part.split(/\s+and\s+/i));

  const options: GroupSessionOption[] = [];
  const seen = new Set<string>();

  for (const segment of segments) {
    for (const option of parseSegment(segment, from)) {
      const key = option.startsAt.toISOString();
      if (seen.has(key)) continue;
      seen.add(key);
      options.push(option);
    }
  }

  if (options.length > 0) {
    return options.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  }

  const fallback = addDays(setSeconds(setMinutes(setHours(from, 10), 0), 0), 7);
  return [
    {
      id: 'fallback-week',
      label: scheduleSummary.trim(),
      startsAt: fallback,
    },
  ];
}
