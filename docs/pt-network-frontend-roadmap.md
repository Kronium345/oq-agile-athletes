# PT Network — Frontend roadmap (implemented scaffold)

> **Status:** Initial scaffold in repo. Uses **Plan A auth** (same login; "Become a trainer" flow).  
> **Mocks:** Default on in `__DEV__` via `lib/trainers/config.ts`. Set `EXPO_PUBLIC_USE_TRAINER_MOCKS=false` when API is ready.

## Routes

| Phase | Screen |
|-------|--------|
| 1 | `app/(drawer)/trainers/index.tsx`, `app/trainer/[id].tsx`, `app/trainer/setup.tsx`, `app/trainer/become.tsx` |
| 2 | `app/settings/gym.tsx`, filters on trainers index |
| 3 | `app/(drawer)/trainers/saved.tsx`, contact sheet on profile, `app/trainer/leads.tsx` |
| 4 | `app/(drawer)/trainers/match.tsx` |
| 5 | `app/(drawer)/community/*` |
| 6 | `app/trainer/stripe-connect.tsx`, `availability.tsx`, `book/[id].tsx`, `bookings.tsx` |

## Services

- `services/trainersApi.ts`
- `services/trainerLeadsApi.ts`
- `services/trainerMatchApi.ts`
- `services/communityApi.ts`
- `services/trainerBookingsApi.ts`

## Packages

Phases 1–5: **no new installs.**  
Phase 6 (live payments): `npx expo install @stripe/stripe-react-native`

## Backend

See **[pt-network-backend-prompt.md](./pt-network-backend-prompt.md)** for full API spec.
