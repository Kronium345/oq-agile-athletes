# Backend implementation prompt — PT Network (all phases)

> Copy this entire document into the **`api-oq-agile-athletes`** repo (or give to your API agent).  
> The Expo app (`oq-agile-athletes`) already has frontend scaffolds calling these routes with **mocks in `__DEV__`**. Flip the app with `EXPO_PUBLIC_USE_TRAINER_MOCKS=false` when routes are live.

---

## Context

**Agile Athletes** — Node API + MongoDB, JWT auth (`Authorization: Bearer`), existing `User` model with member onboarding (gender, experience, weight, avatar).

**Auth model (Plan A):** One account for everyone. Members and PTs use the same `/auth/signup` and `/auth/signin`. A user becomes a trainer by creating a `TrainerProfile` linked to their `userId` — no separate auth system.

**Payments split:**
- **RevenueCat** — consumer Premium only (already in app). Optional future **PT Pro listing** tier via RevenueCat — not session payments.
- **Stripe Connect** — PT session bookings, marketplace payments, platform commission (5–15%), payouts to PTs.

---

## Global conventions

### Authentication
- Protected routes: existing JWT middleware (`req.userId` or equivalent).
- Trainer-only routes: user must own a `TrainerProfile` with `published: true` (or any profile for edit routes).
- Admin-only: `verified` flag on trainers (manual or admin API).

### Response envelope (match existing API style)
```json
{ "success": true, "trainers": [], "trainer": {}, "message": "..." }
```
```json
{ "success": false, "error": "...", "details": "..." }
```

### Anti-spoof
- Ignore client-sent `userId` on member actions; use JWT.
- Ignore client-sent profile stats on trainer listings; server is source of truth.
- Geocode `postcode` on server (UK: [postcodes.io](https://postcodes.io)) → store `lat`, `lng` on user and trainer profile.

### Env vars (new)
```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...          # if using OAuth
PLATFORM_COMMISSION_PERCENT=10
POSTCODES_IO_ENABLED=true
FRONTEND_URL=https://...                   # Stripe return URLs
```

---

## Data models (MongoDB)

### Extend `User`
```ts
{
  // existing fields...
  roles: ('member' | 'trainer')[],       // default ['member']; add 'trainer' on profile create
  gymName?: string,
  postcode?: string,
  location?: { type: 'Point', coordinates: [lng, lat] },
  savedTrainerIds: ObjectId[],
}
```

### `TrainerProfile` collection
```ts
{
  _id: ObjectId,
  userId: ObjectId,                      // unique index
  displayName: string,
  bio: string,
  qualifications: string[],
  specialties: string[],                 // enum list from app
  gymName: string,
  postcode: string,
  location: { type: 'Point', coordinates: [lng, lat] },
  priceFrom?: number,
  priceUnit: 'session' | 'hour' | 'month',
  instagram?: string,
  availabilityNotes?: string,
  verified: boolean,                     // default false
  featured: boolean,                     // default false
  published: boolean,                    // default false
  stripeConnectAccountId?: string,       // acct_...
  stripeConnectOnboarded: boolean,
  ratingAvg?: number,
  reviewCount: number,
  createdAt, updatedAt,
}
```
Indexes: `2dsphere` on `location`, text on `displayName`, `gymName`, `specialties`.

### `TrainerLead` collection
```ts
{
  trainerId: ObjectId,
  memberId: ObjectId,
  memberName: string,
  message: string,
  goal?: string,
  budget?: string,
  status: 'pending' | 'read' | 'replied',
  createdAt,
}
```

### `TrainerReview` collection
```ts
{
  trainerId: ObjectId,
  memberId: ObjectId,
  displayName: string,
  rating: number,                        // 1-5
  text: string,
  createdAt,
}
```
Unique compound index: `{ trainerId, memberId }` (one review per member per trainer).

### `BookingSlot` collection
```ts
{
  trainerId: ObjectId,
  startsAt: Date,
  endsAt: Date,
  available: boolean,
}
```

### `Booking` collection
```ts
{
  trainerId: ObjectId,
  memberId: ObjectId,
  slotId: ObjectId,
  startsAt: Date,
  endsAt: Date,
  amountPence: number,
  currency: 'gbp',
  platformFeePence: number,
  trainerPayoutPence: number,
  status: 'pending_payment' | 'confirmed' | 'cancelled' | 'completed',
  stripePaymentIntentId?: string,
  createdAt, updatedAt,
}
```

### `FitnessGroup` collection (Phase 5)
```ts
{
  name: string,
  description: string,
  gymName?: string,
  postcode?: string,
  location?: GeoJSON Point,
  scheduleSummary?: string,
  memberCount: number,
  createdBy?: ObjectId,
}
```

### `PartnerConnectRequest` (optional, or reuse friends)
```ts
{
  fromUserId: ObjectId,
  toUserId: ObjectId,
  status: 'pending' | 'accepted',
  createdAt,
}
```

---

## Phase 1 — PT directory

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/trainers` | optional | List published trainers. Query: `specialty`, `q`, `postcode`, `radiusKm`, `gymName`, `limit` |
| GET | `/trainers/:id` | optional | Public profile |
| GET | `/trainers/me` | required | Own trainer profile (404 if none) |
| POST | `/trainers/profile` | required | Create profile; set `roles` += `trainer` |
| PUT | `/trainers/profile` | required | Update own profile |

**GET `/trainers` logic:**
- Filter `published: true`.
- If `gymName`: case-insensitive match.
- If `postcode` + `radiusKm`: geocode or use stored member location; `$near` query.
- If `specialty`: `$in` specialties.
- If `q`: text search.
- Sort: `featured` desc, `ratingAvg` desc, `createdAt` desc.
- Include `distanceKm` when geo filter used.

---

## Phase 2 — Member gym & location

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| PUT | `/user/me/gym` | required | Body: `{ gymName, postcode }` — geocode, save on User |

Alternatively extend existing `PUT /user/:id` with same fields (enforce `req.userId === :id`).

---

## Phase 3 — Saves, leads, reviews

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/trainers/saved` | required | List saved trainers |
| POST | `/trainers/:id/save` | required | Add to `savedTrainerIds` |
| DELETE | `/trainers/:id/save` | required | Remove save |
| POST | `/trainers/:id/contact-request` | required | Create `TrainerLead`; optional email to PT |
| GET | `/trainers/leads` | trainer | List leads for authenticated trainer |
| PUT | `/trainers/leads/:leadId` | trainer | Update status `read` / `replied` |
| GET | `/trainers/:id/reviews` | optional | List reviews |
| POST | `/trainers/:id/reviews` | required | Submit review; recompute `ratingAvg`, `reviewCount` |

---

## Phase 4 — AI trainer matching

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/trainers/match` | required | Body: `{ goal, budget?, postcode?, trainingStyle?, experience? }` |

**Logic:**
1. Load member profile + gym from DB.
2. Query trainers (geo, specialties heuristic from goal keywords).
3. Optional: LLM ranks top 3 and returns `explanations[]` (mirror `/chat/generate` coach context).
4. Response:
```json
{
  "success": true,
  "trainers": [ /* TrainerListItem[] */ ],
  "explanations": ["...", "..."]
}
```

---

## Phase 5 — Community

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/community/partners` | required | Query: `gymName`, `goal`. Users with same gym / goals (exclude self) |
| POST | `/community/partners/:userId/connect` | required | Partner request (or wrap existing `/user/friends/:id`) |
| GET | `/community/groups` | optional | Query: `postcode`, `radiusKm` |
| GET | `/community/groups/:id` | optional | Group detail |

---

## Phase 6 — Stripe Connect & bookings

### Stripe Connect (Express recommended)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/trainers/stripe-connect/status` | trainer | `{ onboarded, chargesEnabled, payoutsEnabled, dashboardUrl? }` |
| POST | `/trainers/stripe-connect/onboard` | trainer | Create Connect account if needed; return Account Link URL |
| GET | `/trainers/stripe-connect/callback` | — | Return URL after onboarding (redirect to app deep link) |

**Onboard flow:**
1. `stripe.accounts.create({ type: 'express', country: 'GB', ... })`
2. Store `stripeConnectAccountId` on `TrainerProfile`
3. `stripe.accountLinks.create({ account, refresh_url, return_url, type: 'account_onboarding' })`
4. Webhook `account.updated` → set `stripeConnectOnboarded`, `chargesEnabled`, `payoutsEnabled`

### Availability & bookings

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/trainers/:id/availability` | optional | List available slots |
| PUT | `/trainers/availability` | trainer | Replace trainer's slots |
| POST | `/bookings` | required | Body: `{ trainerId, slotId }` — create booking, PaymentIntent with **application_fee_amount** |
| POST | `/bookings/:id/confirm` | required | After client confirms payment (or webhook) |
| GET | `/bookings/me` | required | Member + trainer bookings |
| POST | `/bookings/:id/cancel` | required | Cancel; refund policy TBD |

**POST `/bookings` payment logic:**
```ts
const fee = Math.round(amountPence * PLATFORM_COMMISSION_PERCENT / 100);
stripe.paymentIntents.create({
  amount: amountPence,
  currency: 'gbp',
  application_fee_amount: fee,
  transfer_data: { destination: trainer.stripeConnectAccountId },
  metadata: { bookingId, trainerId, memberId },
});
```
Return `{ booking, clientSecret: paymentIntent.client_secret }` for `@stripe/stripe-react-native` PaymentSheet on mobile.

### Webhooks

`POST /webhooks/stripe` (raw body):
- `payment_intent.succeeded` → `booking.status = confirmed`
- `payment_intent.payment_failed` → cancel / notify
- `account.updated` → sync Connect status

---

## Middleware

```ts
requireAuth
requireTrainer        // TrainerProfile exists for req.userId
requireTrainerStripe  // stripeConnectOnboarded && chargesEnabled (for accepting bookings)
```

---

## Seed data (dev)

Insert 3–5 `TrainerProfile` docs in London (E1, EC2) for frontend QA.

---

## Implementation order

1. Models + Phase 1 routes  
2. `PUT /user/me/gym` + geo index  
3. Saves, leads, reviews  
4. `/trainers/match`  
5. Community routes  
6. Stripe Connect + bookings + webhooks  

---

## Frontend coordination

| App env | Behavior |
|---------|----------|
| `EXPO_PUBLIC_USE_TRAINER_MOCKS=true` | Mock data (default in dev) |
| `EXPO_PUBLIC_USE_TRAINER_MOCKS=false` | Live API |

App service files: `services/trainersApi.ts`, `trainerLeadsApi.ts`, `trainerMatchApi.ts`, `communityApi.ts`, `trainerBookingsApi.ts`.

When Phase 6 is live, install in Expo: `npx expo install @stripe/stripe-react-native` and wire PaymentSheet in `app/trainer/book/[id].tsx`.

---

## Acceptance checklist

- [ ] Same JWT works for member and trainer flows  
- [ ] `POST /trainers/profile` idempotent per user (one profile per userId)  
- [ ] Published trainers appear in `GET /trainers`; drafts do not  
- [ ] Geo search returns `distanceKm`  
- [ ] Saves/leads/reviews scoped to authenticated user  
- [ ] Match endpoint returns ≤3 trainers + explanations  
- [ ] Stripe Connect onboarding completes for test PT  
- [ ] Test booking creates PaymentIntent with application fee  
- [ ] Webhook confirms booking on successful payment  
- [ ] RevenueCat unchanged for consumer Premium  

---

*Generated for api-oq-agile-athletes — PT Network full backend spec.*
