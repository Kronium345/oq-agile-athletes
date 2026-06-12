# Steps social & persistence — backend requirements

The mobile app now uses the **same connection flow as Fitness Network** for step friends (`POST /community/partners/:userId/connect` with fallback to `POST /user/friends/:userId`).

## Connection / friends

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/user/suggestions?limit=20` | Suggested users for Steps “Add” |
| `POST` | `/community/partners/:userId/connect` | Send connection request (preferred) |
| `POST` | `/user/friends/:userId` | Legacy immediate friend add (fallback) |
| `GET` | `/api/steps/leaderboard?period=today\|week\|streaks&scope=friends\|all&limit=5` | Friends leaderboard on Steps tab |
| `PUT` | `/user/step-sharing` | `{ shareStepsEnabled: boolean }` |
| `GET` | `/auth/current-user` | Include `shareStepsEnabled` on user |

### `POST /community/partners/:userId/connect`

```json
// Response 200
{ "success": true, "message": "Request sent" }
```

Create a pending connection (same model as Fitness Network). Recipient accepts via existing `/community/connections` routes.

### `POST /user/friends/:userId` (fallback)

```json
{ "success": true, "message": "Friend added" }
```

Use when community connect route is unavailable. On failure return `{ "success": false, "message": "..." }` with a useful message (not empty 404).

## Step persistence (fixes reset-to-zero)

| Method | Route | Body / response |
|--------|-------|-----------------|
| `PUT` | `/api/steps/:date` | Body: `{ "stepCount": number }` — `date` is `YYYY-MM-DD` **local user calendar** |
| `GET` | `/api/steps/date/:date` | `{ "success": true, "stepCount": 1234 }` **or** `{ "success": true, "data": { "stepCount": 1234 } }` |
| `GET` | `/api/steps/total` | `{ "success": true, "totalSteps": 50000 }` **or** `{ "success": true, "data": { "totalSteps": 50000 } }` |
| `GET` | `/api/steps/history?startDate=&endDate=` | Array of daily counts for charts |

### Important

1. **Upsert by user + date** on `PUT /api/steps/:date` — do not create duplicate rows.
2. **Return top-level `stepCount`** (or nested under `data`) so reload restores today’s count.
3. **`totalSteps`** = sum of all daily records for the user (lifetime), not “lifetime + today” on each save.
4. Persist per authenticated user (`req.user.id`).

## Prompt for backend implementation

```
Implement/verify steps API for Agile Athletes mobile:

1. PUT /api/steps/:date — upsert { stepCount } for authenticated user, date YYYY-MM-DD
2. GET /api/steps/date/:date — return { success: true, stepCount: number }
3. GET /api/steps/total — return { success: true, totalSteps: number }
4. GET /api/steps/history?startDate&endDate — daily rows for week chart
5. GET /api/steps/leaderboard?period=today|week|streaks&scope=friends|all&limit=N
6. POST /community/partners/:userId/connect — pending connection (same as Fitness Network)
7. POST /user/friends/:userId — fallback friend add with { success, message }
8. GET /user/suggestions?limit=20 — users not yet connected
9. PUT /user/step-sharing — { shareStepsEnabled }

Ensure GET responses work with either top-level or data.* fields. Without working PUT/GET for today's date, the app will reset steps on Android after reload.
```
