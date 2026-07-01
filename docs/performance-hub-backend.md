# Performance Hub — backend requirements

Athlete Performance Hub tracks **subjective daily readiness** (sleep, stress, energy, soreness, lifestyle) and combines it with **existing workout + step data** to produce recovery scores, training load bands, and rule-based recommendations.

**API base:** `https://api-oq-agile-athletes.onrender.com`  
**Auth:** Bearer token (`Authorization: Bearer <session>`) — same as existing routes.  
**User scope:** All records keyed by authenticated `userId`.

---

## Overview

| Output | Description |
|--------|-------------|
| `recoveryScore` | Composite 0–100 |
| `sleepScore`, `stressScore`, `energyScore` | Sub-scores 0–100 |
| `trainingLoad` | `Normal` \| `Building` \| `High` \| `Very High` |
| `recommendations` | Rule-based tips (no AI in V1) |

**V1:** Weighted scoring on the server. No ML. No medical claims.  
**V2 (later):** HealthKit / Health Connect sleep import; AI Recovery Coach.

---

## Existing data to reuse

| Source | Routes | Use |
|--------|--------|-----|
| Workouts | `POST /history/history`, `GET /history/history?userId=` | Training load (7d vs 28d) |
| Steps | `PUT/GET /api/steps/:date`, `GET /api/steps/history` | 10% of recovery score; load context |
| User | `GET /auth/current-user` | Profile context |
| User stats | `GET /user-stats` | Aggregate totals (optional) |

**Separate from:** `POST /quiz/predict` (anger × anxiety matrix) — different product surface.

---

## Collection: `performance_checkins`

One document per **user per calendar day** (upsert on submit).

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "date": "2026-07-02",

  "sleepHours": 7.5,
  "sleepQuality": 8,
  "stress": 4,
  "energy": 8,
  "muscleSoreness": 3,
  "proteinIntake": 140,
  "waterIntakeLiters": 2.5,
  "alcohol": false,

  "recoveryScore": 82,
  "sleepScore": 75,
  "stressScore": 88,
  "energyScore": 80,
  "trainingLoad": "Normal",

  "recommendations": [
    {
      "type": "sleep",
      "severity": "info",
      "message": "Try going to bed 45 minutes earlier tonight."
    }
  ],

  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

**Indexes:**

- Unique: `{ userId: 1, date: 1 }`
- Query: `{ userId: 1, date: -1 }`

**Validation:**

| Field | Type | Rules |
|-------|------|-------|
| `date` | string | `YYYY-MM-DD` (client local calendar) |
| `sleepHours` | number | 0–14 |
| `sleepQuality` | number | 1–10 |
| `stress` | number | 1–10 (higher = more stressed) |
| `energy` | number | 1–10 |
| `muscleSoreness` | number | 1–10 |
| `proteinIntake` | number | optional, grams |
| `waterIntakeLiters` | number | optional |
| `alcohol` | boolean | optional |

Server computes all scores, `trainingLoad`, and `recommendations` on create/update.

---

## Score engine (V1)

### Sub-scores (0–100)

```text
sleepHoursScore   = clamp(sleepHours / 8 * 100, 0, 100)
sleepQualityScore = sleepQuality * 10
sleepScore        = sleepHoursScore * 0.55 + sleepQualityScore * 0.45

stressScore       = (10 - stress) * 10
energyScore       = energy * 10
sorenessScore     = (10 - muscleSoreness) * 10
stepsScore        = min(todaySteps / dailyGoal, 1) * 100   // default goal 10000
```

### Recovery score (composite)

```text
recoveryScore = round(
  sleepScore * 0.25 +
  stressScore * 0.15 +
  energyScore * 0.15 +
  sorenessScore * 0.10 +
  stepsScore * 0.10 +
  trainingLoadScore * 0.10 +
  lifestyleScore * 0.15
) - penalties

clamp(recoveryScore, 0, 100)
```

Lifestyle: bonuses for protein ≥ 80g, water ≥ 2L; penalties for alcohol.

### Training load (ACWR-lite)

```text
dailyLoad = workoutMinutes * 1.0 + (steps / 1000) * 0.3

acuteLoad   = sum(dailyLoad) over last 7 days
chronicLoad = sum(dailyLoad) over last 28 days / 4

ratio = acuteLoad / max(chronicLoad, 1)

ratio < 0.8   → "Building"
ratio < 1.3   → "Normal"
ratio < 1.5   → "High"
else          → "Very High"
```

`trainingLoadScore`: Normal=100, Building=85, High=65, Very High=40.

### Recommendations (rules)

| Condition | Message |
|-----------|---------|
| `sleepHours < 7` | Try going to bed 45 minutes earlier. |
| `sleepQuality <= 5` | Reduce screen time 1 hour before bed. |
| `stress >= 7` | Consider a light walk or breathing exercise. |
| `energy <= 4` | Prioritize recovery; keep intensity moderate. |
| `muscleSoreness >= 7` | High soreness — mobility or rest day. |
| `alcohol === true` | Alcohol can affect recovery — hydrate well. |
| `proteinIntake < 80` | Consider increasing protein for recovery. |
| `trainingLoad` High/Very High | Training load elevated — plan a lighter session. |

```json
{ "type": "sleep|stress|nutrition|training|lifestyle", "severity": "info|warning", "message": "..." }
```

---

## API endpoints

### `POST /performance/check-ins`

Upsert by `userId + date`. Body: raw inputs only. Response includes computed scores.

```json
{
  "date": "2026-07-02",
  "sleepHours": 7.5,
  "sleepQuality": 8,
  "stress": 4,
  "energy": 8,
  "muscleSoreness": 3,
  "proteinIntake": 140,
  "waterIntakeLiters": 2.5,
  "alcohol": false
}
```

```json
{
  "success": true,
  "data": {
    "date": "2026-07-02",
    "recoveryScore": 82,
    "sleepScore": 75,
    "stressScore": 88,
    "energyScore": 80,
    "trainingLoad": "Normal",
    "recommendations": []
  }
}
```

### `GET /performance/today?date=YYYY-MM-DD`

Today's dashboard. `hasCheckIn: false` when no row exists.

### `GET /performance/check-ins?limit=7`

Or `?startDate=&endDate=` for history. App uses limit 7 free; 30/90 premium.

### `GET /performance/trends?period=30|90`

Premium in app. Returns `averages`, `series[]`, `trainingLoadSummary`.

### `GET /performance/weekly-summary?weekStart=YYYY-MM-DD`

Premium in app. Weekly rollup + template `narrative`.

### Errors

```json
{ "success": false, "message": "..." }
```

401 unauthorized · 400 validation · 500 server error

---

## Mobile app behavior (premium split)

| Tier | Features |
|------|----------|
| **Free** | Daily check-in, today's dashboard, last 7 days list |
| **Premium** | Full Performance Hub in Mind Center: 30/90-day trends, recommendation detail, education articles, weekly summary, AI Recovery Coach (V2) |

Premium gating is enforced in the **app** for trends/history beyond 7 days. Backend may return full data; app truncates or gates UI.

Until API is live, the mobile app falls back to **client-side scoring** + local AsyncStorage cache per user.

---

## Implementation checklist

```
[ ] MongoDB collection performance_checkins + unique index (userId, date)
[ ] POST /performance/check-ins — upsert + score engine + recommendations
[ ] GET /performance/today?date=
[ ] GET /performance/check-ins?limit=7 and ?startDate=&endDate=
[ ] GET /performance/trends?period=30|90
[ ] GET /performance/weekly-summary?weekStart=
[ ] Training load from history + steps (7d / 28d)
[ ] Unit tests for score edge cases
[ ] Scope all queries to req.user.id
```

## Copy-paste prompt

```
Implement Performance Hub API for Agile Athletes:

1. Collection performance_checkins — one row per user per date (YYYY-MM-DD), upsert on POST
2. POST /performance/check-ins — subjective inputs; server computes recoveryScore (0-100), sleepScore, stressScore, energyScore, trainingLoad (Normal|Building|High|VeryHigh), recommendations[]
3. GET /performance/today?date= — today's dashboard payload
4. GET /performance/check-ins?limit=7 or startDate/endDate — history
5. GET /performance/trends?period=30|90 — averages + daily series
6. GET /performance/weekly-summary?weekStart= — weekly rollup
7. Training load: acute 7d vs chronic 28d from /history/history + /api/steps/history
8. Weighted recovery score — no AI in V1; rule-based recommendations only
9. Auth: Bearer token; scope to req.user.id
10. Keep separate from POST /quiz/predict (anger/anxiety matrix)
```
