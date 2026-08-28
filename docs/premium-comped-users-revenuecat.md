# Comped Premium via RevenueCat (by user ID)

Give a **small group** free Premium without promo codes or email allowlists. RevenueCat **promotional entitlements** grant the `premium` entitlement to a specific App User ID. The app already uses that ID and entitlement — no code change required for the happy path.

---

## How the app identifies users

On login, `PremiumProvider` calls:

```ts
Purchases.logIn(appUserID);
```

`appUserID` is the MongoDB user id: `user._id` (fallback `user.userId` / `user.id`).

Premium unlock checks:

```ts
customerInfo?.entitlements?.active?.premium
```

Your RevenueCat entitlement identifier must stay **`premium`** (match the dashboard).

---

## Workflow (recommended)

### 1. Friend signs up in the app

They create an account normally. Premium stays locked until you grant access.

### 2. Get their user ID

You need the same string passed to `Purchases.logIn`:

- **MongoDB:** `users` collection → `_id` as string (e.g. `674a1b2c3d4e5f6789012345`)
- **Admin / API:** `GET /auth/current-user` while logged in as them (dev only)
- **Support:** temporary “copy user ID” in profile settings (optional future)

### 3. Grant promotional entitlement in RevenueCat

**Dashboard (manual, good for &lt;20 people)**

1. [RevenueCat](https://app.revenuecat.com) → **Customers**
2. Search or paste **App User ID** = MongoDB `_id`
3. If no customer exists, they appear after first app open with RC configured
4. Open customer → **Grant promotional entitlement**
5. Select entitlement **`premium`**
6. Choose duration:
   - **Lifetime** — friends / founders
   - **Fixed end date** — beta testers
   - **Custom** — e.g. 90 days

**REST API (scriptable)**

```http
POST https://api.revenuecat.com/v1/subscribers/{app_user_id}/entitlements/premium/promotional
Authorization: Bearer <REVENUECAT_SECRET_API_KEY>
Content-Type: application/json

{
  "duration": "lifetime"
}
```

Other `duration` values: `daily`, `weekly`, `monthly`, `two_month`, `three_month`, `six_month`, `yearly`, or ISO end time depending on RC API version — see [RevenueCat promotional entitlements docs](https://www.revenuecat.com/docs/dashboard-and-metrics/customer-history/promotional-entitlements).

### 4. User refreshes Premium state

- Force-quit and reopen the app, or
- Pull to refresh on subscription screen (`usePremium().refresh()`)

`isPremium` becomes `true`; paywalls and ads gate accordingly.

---

## Revoking access

Dashboard: remove promotional entitlement from the customer, or let it expire.

API: use RevenueCat revoke endpoints for that subscriber + entitlement.

---

## Environments

| Environment | RC project | App User ID |
|-------------|------------|-------------|
| Sandbox / TestFlight | Sandbox project keys | Same Mongo `_id` |
| Production | Production project keys | Same Mongo `_id` |

Grant in **both** projects if testers use sandbox builds and production builds with different RC API keys (`EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` / `ANDROID`).

---

## What not to do

- **Email allowlist in app** — easy to spoof; RC promotional by ID is authoritative.
- **Hard-coded user IDs in the app** — grants belong in RevenueCat only.
- **Separate “comp” entitlement** — unnecessary unless you want different features; `premium` is enough.

---

## Checklist for each comped user

- [ ] User signed up; you have their MongoDB `_id`
- [ ] User opened app once (so RC customer exists) or you created via API
- [ ] Granted `premium` promotional entitlement in correct RC project
- [ ] Confirmed `isPremium` in app after refresh

---

## Related code

| File | Role |
|------|------|
| `app/PremiumProvider.tsx` | `logIn`, entitlement check |
| `hooks/usePremiumGate.ts` | Feature gating |

No app release needed to add or remove comped users — dashboard/API only.
