# Recovery Toolkit — Guided Breathing (Backend & Integration Spec)

**Audience:** Backend / mobile agents implementing Agile Athletes  
**Status:** Feasibility + integration design (not yet implemented)  
**Product surface:** Mind Center → **Recovery Toolkit** (guided breathing)  
**Feeds into:** Performance Hub (recovery trends, weekly summary, recommendations)

---

## Executive summary

Guided breathing is **highly feasible** as an addition to Agile Athletes. It fits the existing product story (train smarter, recover better, perform longer) without requiring a new backend service or medical claims.

The app **already has**:

- Mind Center hub (`app/(drawer)/mental.tsx`) — premium
- Performance Hub (`app/(drawer)/performance/*`) — daily check-in free; trends/education premium
- Client-side recovery scoring + recommendations (`lib/performance/scoring.ts`)
- A stress recommendation that already mentions breathing: *"Consider a light walk or breathing exercise."*
- Offline-first pattern: try API → fall back to local storage (`services/performanceApi.ts`, `lib/performance/storage.ts`)
- Orphan mood API client (`services/wellnessApi.ts`) — not wired to UI yet

The app **does not yet have**:

- Breathing session UI, timers, or protocols
- Completion / abandonment tracking
- Backend models for recovery sessions
- Performance Hub metrics for “breathing sessions this week”
- Mood-before/after on breathing (optional)

**Recommended approach:** Ship **MVP client-first** (local session log + Mind Center entry), then add **backend sync** and **Performance Hub rollups** in the same sprint or immediately after.

---

## Product constraints (non-negotiable)

This is a **consumer wellness** app. Copy and scoring must avoid medical claims.

| Do | Don't |
|----|--------|
| "May help support relaxation" | "Treats anxiety" |
| "Designed to encourage recovery habits" | "Improves HRV / testosterone" |
| "Some evidence suggests slow breathing can support calm" | "Guaranteed performance gains" |
| Show evidence-strength labels (High / Moderate / Limited) | Diagnose mental illness |

Include on every exercise:

- **Before session** disclaimer
- **Why this is recommended** card (evidence-informed, individual variation)
- **Stop anytime** + “if symptoms worsen, stop and seek support”

Example *Why this is recommended* card:

> This slow-breathing session is designed to help you unwind after training and may support relaxation and recovery. Individual experiences vary, and this tool is intended for general wellness rather than medical treatment.

---

## Evidence foundation (content design)

High-quality sources to ground protocols and education:

| Source type | Use |
|-------------|-----|
| Systematic review of breathing exercises for anxiety/stress (2024) | General stress-reduction framing; note need for larger trials |
| Slow breathing in healthy humans (comprehensive review) | Autonomic regulation, diaphragm, cardiorespiratory physiology — **do not** promise HRV changes in UI |
| Breathing strategies in sports performance (2023) | Focus/concentration support for athletes; limited direct performance evidence |
| Meta-analysis of breathing techniques in sport | Variable effects; use cautious language |

**Flag as overhyped / use carefully:** extreme breath holds, hyperventilation cycles, unsupervised Wim Hof-style protocols, aggressive “detox” breathwork for anxious users.

---

## Architecture fit (existing)

```text
Mind Center (premium)
  └── Recovery Toolkit [NEW]
        ├── Protocol list
        ├── Guided session (timer + animation)
        └── Completion → local log + optional API

Performance Hub
  ├── Free: daily check-in, today's dashboard
  └── Premium: trends, weekly summary, education
        └── [NEW] breathing session counts, streaks, suggested next action

AI Coach
  └── [NEW] contextual prompts → deep link to protocol
```

**UK gating:** Breathing should be **global** (like Assessment / Performance Hub), not UK-only.

**Premium gating (suggested):**

| Feature | Tier |
|---------|------|
| 2–3 core protocols (Stress Reset, Sleep Wind Down, Box Breathing) | Free or Mind Center |
| Full protocol library (8–12), athlete modes, streaks | Premium |
| Trends overlay + weekly narrative | Premium (Performance Hub) |

Exact gating is a product decision; backend should not enforce premium on session POST (app gates UI).

---

## Breathing protocols (MVP content pack)

Launch with **6 protocols**; expand to 8–12 in v1.1. Full coaching scripts live in mobile content JSON; backend stores `protocolId` only.

| ID | Name | Rhythm | Default duration | Primary use | Evidence |
|----|------|--------|------------------|-------------|----------|
| `stress_reset` | Stress Reset | In 4 · Out 6 (no hold) | 2 min | High stress / overwhelm | Moderate |
| `box_breathing` | Box Breathing | In 4 · Hold 4 · Out 4 · Hold 4 | 2 min | Focus, pre-task calm | Moderate |
| `physiological_sigh` | Physiological Sigh | Double inhale · long exhale | 1 min (3–5 cycles) | Acute stress spike | Moderate–Emerging |
| `sleep_wind_down` | Sleep Wind Down | In 4 · Out 6 | 3 min | Evening / pre-sleep | Moderate |
| `post_workout_recovery` | Post-Workout Recovery | In 4 · Out 6 | 2 min | After training | Limited–Moderate |
| `pre_workout_focus` | Pre-Workout Focus | In 4 · Hold 2 · Out 4 | 1 min | Before session | Limited (sport context) |

**v1.1 additions:** Resonance (~5.5/min), Diaphragmatic, Competition Calm, Energy Reset, Recovery Reset, 4-6 Relaxation.

Each protocol record (static catalog, can be bundled in app or served from API):

```json
{
  "id": "box_breathing",
  "name": "Box Breathing",
  "description": "Even rhythm to steady attention and calm.",
  "intendedUse": ["focus", "stress", "pre_workout"],
  "rhythm": { "inhaleSec": 4, "holdInSec": 4, "exhaleSec": 4, "holdOutSec": 4 },
  "durationOptionsSec": [60, 120, 180, 300],
  "difficulty": "beginner",
  "evidenceStrength": "moderate",
  "contraindications": ["Uncontrolled breathing discomfort", "Recent respiratory distress"],
  "coachingTips": ["Sit tall", "Breathe through the nose if comfortable", "Stop if dizzy"],
  "whyRecommended": "Slow, even breathing may support calm and focus. Experiences vary."
}
```

---

## Athlete modes (routing logic — app-side)

| Context | Suggested protocols | Rationale |
|---------|---------------------|-----------|
| Before lifting | `pre_workout_focus`, `box_breathing` | Short focus without sedation |
| Before cardio | `box_breathing`, `stress_reset` | Steady arousal regulation |
| Before competition | `box_breathing`, `competition_calm` | Familiar rhythm under pressure |
| After training | `post_workout_recovery`, `stress_reset` | Downshift autonomic load |
| Recovery day | `post_workout_recovery`, `4_6_relaxation` | Low intensity |
| High stress check-in | `physiological_sigh`, `stress_reset` | Fast + sustained options |
| Sleep | `sleep_wind_down` | Longer exhale bias |
| Morning routine | `energy_reset`, `box_breathing` | Light activation + focus |

Modes are **recommendations**, not prescriptions. AI Coach and Performance recommendations can deep-link with `?protocol=stress_reset`.

---

## Performance Hub integration

### What breathing should **not** do (V1)

- Do **not** auto-inflate `recoveryScore` in a way that implies measured physiological recovery.
- Do **not** claim breathing “fixed” stress; optional self-reported mood/stress delta only.

### What breathing **should** do (V1)

1. **Activity log:** count completed sessions per day/week.
2. **Recommendations:** if `stress >= 7` and no breathing today → suggest Stress Reset (deep link).
3. **Weekly summary narrative:** e.g. *"You completed 5 recovery breathing sessions this week."*
4. **Streaks (premium):** consecutive days with ≥1 completion (habit, not health outcome).
5. **Optional micro-check:** 1-tap mood before/after (1–5) stored on session — feeds **mood trend** chart, not diagnosis.

### Suggested contribution model (conservative)

Breathing completions are a **separate metric**, not a large weight on `recoveryScore`:

| Metric | Source | Performance Hub display |
|--------|--------|-------------------------|
| `recoveryScore` | Existing check-in formula | Today card (unchanged) |
| `breathingSessionsToday` | Session log | "Recovery sessions today: 1" |
| `breathingSessionsWeek` | Rollup | Weekly summary |
| `breathingStreakDays` | Rollup | Badge / insight (premium) |
| `suggestedNextAction` | Rules | "Take a 2-minute Stress Reset" |

Optional **soft** check-in nudge (v1.1): if user completes breathing + reports lower stress (optional 1–5), show encouraging copy only — **do not** recalculate `stressScore` retroactively unless product explicitly wants that.

### Dashboard example (premium weekly / today extension)

```text
Recovery Score: 84/100
Recovery sessions today: 1
Suggested next action: "Take a 2-minute Stress Reset."
```

---

## Data model (MongoDB)

### Collection: `recovery_sessions`

One document per completed (or abandoned) session.

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "protocolId": "stress_reset",
  "status": "completed",
  "startedAt": "ISO8601",
  "completedAt": "ISO8601",
  "durationSec": 120,
  "plannedDurationSec": 120,
  "context": "mind_center",
  "athleteMode": "after_training",
  "moodBefore": 2,
  "moodAfter": 4,
  "stressBefore": 8,
  "stressAfter": 5,
  "device": { "platform": "ios", "appVersion": "1.0.0" },
  "createdAt": "ISO8601"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `status` | string | `started` \| `completed` \| `abandoned` |
| `protocolId` | string | Catalog key |
| `context` | string | `mind_center` \| `performance_hub` \| `ai_coach` \| `notification` |
| `moodBefore` / `moodAfter` | number | Optional 1–5 |
| `stressBefore` / `stressAfter` | number | Optional 1–10 (self-report) |

**Indexes:**

- `{ userId: 1, completedAt: -1 }`
- `{ userId: 1, protocolId: 1, completedAt: -1 }`
- `{ userId: 1, status: 1, completedAt: -1 }`

### Collection: `breathing_protocols` (optional)

Static catalog served from API for remote updates. **MVP can ship protocols in the app bundle**; backend only stores session events.

### Extend `performance_checkins` (optional v1.1)

Add denormalized fields for fast dashboard reads:

```json
{
  "breathingSessionsCount": 1,
  "lastBreathingAt": "ISO8601"
}
```

Updated by cron or on session POST — avoids joining on every `GET /performance/today`.

### Reuse `wellness_checkins` (optional)

Existing client: `POST /wellness/check-ins` with `mood`. Breathing session can **also** create a mood entry when user opts in — or keep mood on session document only.

---

## API endpoints (new)

Base: same host + Bearer auth as Performance Hub.

### `GET /recovery/protocols`

Returns protocol catalog (or 404 if app-bundled only in MVP).

### `POST /recovery/sessions`

Create or update session.

```json
{
  "protocolId": "stress_reset",
  "status": "completed",
  "startedAt": "2026-07-16T10:00:00.000Z",
  "completedAt": "2026-07-16T10:02:00.000Z",
  "durationSec": 120,
  "plannedDurationSec": 120,
  "context": "mind_center",
  "athleteMode": "stressful_day",
  "moodBefore": 2,
  "moodAfter": 4
}
```

Response: `{ "success": true, "data": { ...session } }`

### `GET /recovery/sessions?limit=20&from=&to=`

History for trends and debugging.

### `GET /recovery/summary?period=7|30`

```json
{
  "success": true,
  "data": {
    "completedCount": 5,
    "streakDays": 3,
    "topProtocols": [{ "protocolId": "stress_reset", "count": 3 }],
  "suggestedProtocolId": "sleep_wind_down"
  }
}
```

### Extend existing Performance Hub routes (v1.1)

| Route | Addition |
|-------|----------|
| `GET /performance/today` | `breathingSessionsToday`, `suggestedBreathingProtocolId` |
| `GET /performance/weekly-summary` | `breathingSessionsWeek`, narrative line |
| `GET /performance/trends` | Optional series: `breathingSessionsPerDay[]` |

---

## Analytics events (mobile → PostHog / internal)

| Event | Properties |
|-------|------------|
| `breathing_session_started` | `protocolId`, `plannedDurationSec`, `context` |
| `breathing_session_completed` | `protocolId`, `durationSec`, `moodBefore`, `moodAfter` |
| `breathing_session_abandoned` | `protocolId`, `elapsedSec` |
| `breathing_protocol_selected` | `protocolId`, `source` |
| `breathing_recommendation_tapped` | `protocolId`, `source` (performance_hub, ai_coach) |

---

## AI Coach integration

AI Coach should recommend breathing via **rules + natural language**, not diagnosis.

| Signal | Example prompt to user |
|--------|-------------------------|
| High stress check-in | "Stress looks elevated today. A 2-minute Stress Reset may help you downshift before your next session." |
| Poor sleep | "Sleep was short last night. Try Sleep Wind Down tonight — 3 minutes." |
| Heavy training load | "Load is high this week. Post-Workout Recovery breathing after today's session may support your cool-down routine." |
| Recovery day | "Recovery day — a gentle breathing session counts toward your recovery habits." |

Deep link: `/(drawer)/recovery/breathing?protocol=stress_reset&source=ai_coach`

Backend: optional `GET /chat/context` fields `suggestedBreathingProtocolId` — or compute client-side from latest check-in.

---

## Mobile implementation notes (for alignment)

**Folder sketch (Expo):**

```text
app/(drawer)/recovery/
  index.tsx          # Toolkit home
  breathing/[id].tsx # Active session
lib/recovery/
  protocols.ts       # Static catalog
  breathingEngine.ts # Phase timer
  storage.ts         # AsyncStorage sessions
services/recoveryApi.ts
components/recovery/
  BreathingOrb.tsx
  ProtocolCard.tsx
  WhyRecommendedCard.tsx
```

**MVP media:** animated circle/orb + haptics on phase change + text cues. **Defer:** voiceover, gamification badges, 20 education cards.

**Accessibility:** reduced motion, silent mode, pause/stop always visible, no forced full-screen lock.

---

## Phased roadmap

### MVP (launch first)

- 6 protocols, text + animation timer
- Mind Center → Recovery Toolkit entry
- Local session log + optional `POST /recovery/sessions`
- Completion toast + "session saved"
- Deep link from stress recommendation
- Disclaimers + Why Recommended card
- `breathingSessionsWeek` in weekly summary (local or API)

### v1.1

- Full 8–12 protocols + athlete modes
- Backend sync + `GET /recovery/summary`
- Performance Hub today card + trends series
- Optional mood before/after
- 5–10 education cards (not 20)

### v2

- AI Coach deep links + contextual suggestions
- Streaks + light badges (no competitive leaderboard)
- Voice guidance (optional)
- Protocol catalog from API

### v3+

- Expanded questionnaire / performance score (only if distinct from recovery check-in)
- Notifications / reminders
- Personalization from history (still rule-based, not medical ML)

---

## Backend implementation checklist

```
[ ] Collection recovery_sessions + indexes
[ ] POST /recovery/sessions
[ ] GET /recovery/sessions?limit=&from=&to=
[ ] GET /recovery/summary?period=7|30
[ ] (Optional) GET /recovery/protocols
[ ] Extend GET /performance/today with breathingSessionsToday
[ ] Extend GET /performance/weekly-summary with breathing count + narrative
[ ] Scope all queries to req.user.id
[ ] Unit tests: session validation, summary rollups
[ ] No medical claims in API messages
```

---

## Open questions for product owner

1. **Free vs premium:** Which protocols are free vs Mind Center premium?
2. **Mood capture:** Required, optional, or skip in MVP?
3. **Score coupling:** Should breathing affect `recoveryScore` at all in v1? (Recommend: **no**, separate activity metric.)
4. **Voice:** v1 or v2?
5. **Content approval:** Who signs off coaching scripts and disclaimers?

---

## Related docs

- `docs/performance-hub-backend.md` — existing check-in API and scoring
- Mobile: `lib/performance/scoring.ts`, `services/wellnessApi.ts`, `app/(drawer)/mental.tsx`
