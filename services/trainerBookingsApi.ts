import api from '../api/axios';
import { USE_TRAINER_MOCKS } from '../lib/trainers/config';
import { MOCK_BOOKINGS, MOCK_SLOTS } from '../lib/trainers/mocks';
import type {
  Booking,
  BookingSlot,
  StripeConnectStatus,
} from '../types/trainer';

export async function getStripeConnectStatus(): Promise<StripeConnectStatus> {
  if (USE_TRAINER_MOCKS) {
    return {
      onboarded: false,
      chargesEnabled: false,
      payoutsEnabled: false,
    };
  }
  const response = (await api.get('/trainers/stripe-connect/status')) as {
    success?: boolean;
  } & StripeConnectStatus;
  return {
    onboarded: Boolean(response.onboarded),
    chargesEnabled: Boolean(response.chargesEnabled),
    payoutsEnabled: Boolean(response.payoutsEnabled),
    dashboardUrl: response.dashboardUrl,
  };
}

/** Returns Stripe Connect onboarding URL (Express or Account Links). */
export async function startStripeConnectOnboarding(): Promise<string> {
  if (USE_TRAINER_MOCKS) {
    return 'https://connect.stripe.com/setup/mock';
  }
  const response = (await api.post('/trainers/stripe-connect/onboard')) as {
    success?: boolean;
    url?: string;
  };
  if (!response?.url) throw new Error('Could not start Stripe Connect onboarding');
  return response.url;
}

export async function listTrainerAvailability(
  trainerId: string,
): Promise<BookingSlot[]> {
  if (USE_TRAINER_MOCKS) {
    return MOCK_SLOTS.filter((s) => s.trainerId === trainerId);
  }
  const response = (await api.get(`/trainers/${trainerId}/availability`)) as {
    success?: boolean;
    slots?: BookingSlot[];
  };
  return response?.slots ?? [];
}

export async function setMyAvailability(
  slots: Omit<BookingSlot, 'id' | 'trainerId'>[],
): Promise<boolean> {
  if (USE_TRAINER_MOCKS) return true;
  const response = (await api.put('/trainers/availability', { slots })) as {
    success?: boolean;
  };
  return Boolean(response?.success);
}

export type CreateBookingResult = {
  booking: Booking;
  clientSecret?: string;
};

export async function createBooking(
  trainerId: string,
  slotId: string,
): Promise<CreateBookingResult> {
  if (USE_TRAINER_MOCKS) {
    const slot = MOCK_SLOTS.find((s) => s.id === slotId);
    return {
      booking: {
        id: 'book_new',
        trainerId,
        trainerName: 'Trainer',
        memberId: 'u_me',
        slotId,
        startsAt: slot?.startsAt ?? new Date().toISOString(),
        endsAt: slot?.endsAt ?? new Date().toISOString(),
        amountPence: 4000,
        currency: 'gbp',
        status: 'pending_payment',
      },
      clientSecret: 'mock_pi_secret',
    };
  }
  const response = (await api.post('/bookings', { trainerId, slotId })) as {
    success?: boolean;
    booking?: Booking;
    clientSecret?: string;
  };
  if (!response?.booking) throw new Error('Failed to create booking');
  return { booking: response.booking, clientSecret: response.clientSecret };
}

export async function confirmBookingPayment(bookingId: string): Promise<boolean> {
  if (USE_TRAINER_MOCKS) return true;
  const response = (await api.post(`/bookings/${bookingId}/confirm`)) as {
    success?: boolean;
  };
  return Boolean(response?.success);
}

export async function listMyBookings(): Promise<Booking[]> {
  if (USE_TRAINER_MOCKS) return MOCK_BOOKINGS;
  const response = (await api.get('/bookings/me')) as {
    success?: boolean;
    bookings?: Booking[];
  };
  return response?.bookings ?? [];
}

export async function cancelBooking(bookingId: string): Promise<boolean> {
  if (USE_TRAINER_MOCKS) return true;
  const response = (await api.post(`/bookings/${bookingId}/cancel`)) as {
    success?: boolean;
  };
  return Boolean(response?.success);
}
