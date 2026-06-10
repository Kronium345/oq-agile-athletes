import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const STORAGE_KEY = 'community_group_bookings';

export type GroupBooking = {
  id: string;
  groupId: string;
  groupName: string;
  scheduleLabel: string;
  startsAt: string;
  location?: string;
  invitedUserIds: string[];
  invitedNames: string[];
  notificationIds: string[];
  createdAt: string;
};

async function readAll(): Promise<GroupBooking[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GroupBooking[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(bookings: GroupBooking[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

export async function listGroupBookings(): Promise<GroupBooking[]> {
  const bookings = await readAll();
  return bookings.sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
}

export async function getGroupBookingForGroup(
  groupId: string,
): Promise<GroupBooking | undefined> {
  const now = Date.now();
  const bookings = await readAll();
  return bookings.find(
    (booking) =>
      booking.groupId === groupId &&
      new Date(booking.startsAt).getTime() > now,
  );
}

export async function getGroupBookingsOnDate(
  date: Date,
): Promise<GroupBooking[]> {
  const key = format(date, 'yyyy-MM-dd');
  const bookings = await readAll();
  return bookings.filter(
    (booking) => format(new Date(booking.startsAt), 'yyyy-MM-dd') === key,
  );
}

export async function getGroupBookingDateMap(): Promise<Record<string, true>> {
  const bookings = await readAll();
  const map: Record<string, true> = {};
  for (const booking of bookings) {
    const key = format(new Date(booking.startsAt), 'yyyy-MM-dd');
    map[key] = true;
  }
  return map;
}

async function cancelNotificationIds(ids: string[]): Promise<void> {
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  );
}

async function scheduleGroupBookingNotifications(
  booking: GroupBooking,
): Promise<string[]> {
  const startsAt = new Date(booking.startsAt);
  const dayBefore = new Date(startsAt);
  dayBefore.setDate(dayBefore.getDate() - 1);
  dayBefore.setHours(9, 0, 0, 0);

  const ids: string[] = [];
  const now = Date.now();

  if (dayBefore.getTime() > now) {
    const dayBeforeId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Group session tomorrow',
        body: `${booking.groupName} — ${booking.scheduleLabel}`,
        data: {
          type: 'community-group',
          groupId: booking.groupId,
          bookingId: booking.id,
        },
        ...(Platform.OS === 'android' && { channelId: 'community' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: dayBefore,
      },
    });
    ids.push(dayBeforeId);
  }

  const thirtyBefore = new Date(startsAt.getTime() - 30 * 60 * 1000);
  if (thirtyBefore.getTime() > now) {
    const soonId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Group session soon',
        body: `${booking.groupName} starts in 30 minutes`,
        data: {
          type: 'community-group',
          groupId: booking.groupId,
          bookingId: booking.id,
        },
        ...(Platform.OS === 'android' && { channelId: 'community' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: thirtyBefore,
      },
    });
    ids.push(soonId);
  }

  return ids;
}

export async function createGroupBooking(input: {
  groupId: string;
  groupName: string;
  scheduleLabel: string;
  startsAt: Date;
  location?: string;
  invitedUserIds?: string[];
  invitedNames?: string[];
}): Promise<GroupBooking> {
  const bookings = await readAll();
  const existing = bookings.find(
    (row) =>
      row.groupId === input.groupId &&
      new Date(row.startsAt).getTime() > Date.now(),
  );
  if (existing) {
    await cancelNotificationIds(existing.notificationIds);
    bookings.splice(bookings.indexOf(existing), 1);
  }

  const draft: GroupBooking = {
    id: `booking_${input.groupId}_${Date.now()}`,
    groupId: input.groupId,
    groupName: input.groupName,
    scheduleLabel: input.scheduleLabel,
    startsAt: input.startsAt.toISOString(),
    location: input.location,
    invitedUserIds: input.invitedUserIds ?? [],
    invitedNames: input.invitedNames ?? [],
    notificationIds: [],
    createdAt: new Date().toISOString(),
  };

  draft.notificationIds = await scheduleGroupBookingNotifications(draft);
  bookings.push(draft);
  await writeAll(bookings);
  return draft;
}

export async function cancelGroupBooking(bookingId: string): Promise<void> {
  const bookings = await readAll();
  const target = bookings.find((row) => row.id === bookingId);
  if (!target) return;
  await cancelNotificationIds(target.notificationIds);
  await writeAll(bookings.filter((row) => row.id !== bookingId));
}
