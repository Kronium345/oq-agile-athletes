import {
  CalendarAccessLevel,
  createCalendar,
  EntityTypes,
  ExpoCalendarEvent,
  getCalendars,
  getDefaultCalendarSync,
  getSourcesSync,
  requestCalendarPermissions,
  SourceType,
} from 'expo-calendar';
import { Platform } from 'react-native';

const CALENDAR_TITLE = 'Agile Athletes';
const BRAND_COLOR = '#F37021';
const SESSION_DURATION_MS = 60 * 60 * 1000;

type WritableCalendar = {
  id: string;
  title: string;
  allowsModifications: boolean;
  isPrimary?: boolean;
  createEvent: (details: {
    title: string;
    startDate: Date;
    endDate: Date;
    location: string | null;
    notes: string;
    alarms: { relativeOffset: number }[];
  }) => Promise<{ id: string }>;
};

export type GroupCalendarInput = {
  groupName: string;
  scheduleLabel: string;
  startsAt: Date;
  location?: string;
  invitedNames?: string[];
};

export type GroupCalendarResult = {
  eventId: string | null;
  calendarGranted: boolean;
};

async function ensureCalendarPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status } = await requestCalendarPermissions(Platform.OS === 'ios');
  return status === 'granted';
}

async function getWritableCalendar(): Promise<WritableCalendar | null> {
  const calendars = (await getCalendars(
    EntityTypes.EVENT,
  )) as unknown as WritableCalendar[];

  const agileCalendar = calendars.find(
    (calendar) =>
      calendar.title === CALENDAR_TITLE && calendar.allowsModifications,
  );
  if (agileCalendar) return agileCalendar;

  if (Platform.OS === 'ios') {
    try {
      const defaultCalendar =
        getDefaultCalendarSync() as unknown as WritableCalendar;
      if (defaultCalendar.allowsModifications) {
        return defaultCalendar;
      }
    } catch {
      // fall through
    }
  }

  const primary = calendars.find(
    (calendar) => calendar.isPrimary && calendar.allowsModifications,
  );
  if (primary) return primary;

  const anyWritable = calendars.find((calendar) => calendar.allowsModifications);
  if (Platform.OS === 'ios') {
    return anyWritable ?? null;
  }

  const localSource = getSourcesSync().find(
    (source) => source.type === SourceType.LOCAL,
  );
  if (!localSource) {
    return anyWritable ?? null;
  }

  return (await createCalendar({
    title: CALENDAR_TITLE,
    color: BRAND_COLOR,
    entityType: EntityTypes.EVENT,
    source: localSource,
    sourceId: localSource.id,
    name: CALENDAR_TITLE,
    ownerAccount: 'personal',
    accessLevel: CalendarAccessLevel.OWNER,
  })) as unknown as WritableCalendar;
}

function buildEventNotes(input: GroupCalendarInput): string {
  return [
    input.scheduleLabel,
    input.invitedNames?.length
      ? `Bringing: ${input.invitedNames.join(', ')}`
      : null,
    'Booked via Agile Athletes',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Adds a 1-hour session to the device calendar (Google/Apple Calendar app). */
export async function addGroupSessionToDeviceCalendar(
  input: GroupCalendarInput,
): Promise<GroupCalendarResult> {
  if (Platform.OS === 'web') {
    return { eventId: null, calendarGranted: false };
  }

  const calendarGranted = await ensureCalendarPermission();
  if (!calendarGranted) {
    return { eventId: null, calendarGranted: false };
  }

  try {
    const calendar = await getWritableCalendar();
    if (!calendar) {
      return { eventId: null, calendarGranted: true };
    }

    const startDate = input.startsAt;
    const endDate = new Date(startDate.getTime() + SESSION_DURATION_MS);

    const event = await calendar.createEvent({
      title: input.groupName,
      startDate,
      endDate,
      location: input.location ?? null,
      notes: buildEventNotes(input),
      alarms: [{ relativeOffset: -1440 }, { relativeOffset: -30 }],
    });

    return { eventId: event.id, calendarGranted: true };
  } catch (error) {
    if (__DEV__) {
      console.warn('[groupCalendar] create event failed', error);
    }
    return { eventId: null, calendarGranted: true };
  }
}

export async function removeGroupSessionFromDeviceCalendar(
  eventId?: string,
): Promise<void> {
  if (Platform.OS === 'web' || !eventId) return;

  try {
    const event = await ExpoCalendarEvent.get(eventId);
    await event.delete();
  } catch (error) {
    if (__DEV__) {
      console.warn('[groupCalendar] delete event failed', error);
    }
  }
}
