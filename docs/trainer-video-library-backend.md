# Trainer video library — backend requirements

Coaches upload short training clips under **Trainers** (`/trainer/library`). Clients watch assigned clips at **Profile → Videos from my coach** (`/trainer/assigned`). The mobile app proxies all uploads through the Node API (auth, storage URLs, assignment checks).

```
Expo app
   │  multipart upload + JSON metadata (Bearer token)
   ▼
Node API
   │  auth · validate trainer role · store file · persist metadata
   ▼
Object storage (S3 / R2 / GCS)
```

Set `EXPO_PUBLIC_USE_TRAINER_MOCKS=false` when these routes are live.

---

## Data model

`TrainerVideo` collection (or embedded on trainer profile):

| Field | Type | Notes |
|-------|------|--------|
| `_id` | ObjectId | |
| `trainerId` | ObjectId | Owner trainer profile |
| `title` | string | Required |
| `description` | string | Optional |
| `storageKey` | string | Private object key |
| `playUrl` | string | Signed HTTPS URL (short TTL) returned to clients |
| `thumbnailUrl` | string | Optional poster frame |
| `durationSec` | number | Optional, from ffprobe after upload |
| `assignedMemberIds` | ObjectId[] | Users who can play via `/assigned` |
| `createdAt` | ISO date | |

**Access rules**

1. Trainer CRUD only on their own videos (`trainerId` matches `req.user` trainer profile).
2. `GET /trainers/content/assigned` — videos where `assignedMemberIds` contains `req.user._id`.
3. `GET /trainers/:trainerId/content` — only videos assigned to the requester **or** public catalogue flag if you add one later (MVP: assigned-only).

---

## Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/trainers/me/content` | List coach's videos |
| `POST` | `/trainers/me/content` | Multipart upload (`video` field) + form fields |
| `PUT` | `/trainers/me/content/:videoId` | Update title, description, `assignedMemberIds` |
| `DELETE` | `/trainers/me/content/:videoId` | Delete video + storage object |
| `GET` | `/trainers/content/assigned` | Videos assigned to current user |
| `GET` | `/trainers/:trainerId/content` | Videos the requester may view from that trainer |

### `POST /trainers/me/content` (multipart)

**Fields**

- `video` — file (`video/mp4`, `video/quicktime`; max ~100MB recommended)
- `title` — string
- `description` — optional string
- `assignedMemberIds` — JSON string array of user `_id` values

**Response 201**

```json
{
  "success": true,
  "video": {
    "id": "…",
    "trainerId": "…",
    "title": "RDL cues",
    "description": "…",
    "playUrl": "https://…signed…",
    "thumbnailUrl": null,
    "durationSec": 42,
    "assignedMemberIds": ["64f…"],
    "createdAt": "2026-08-28T12:00:00.000Z"
  }
}
```

### `PUT /trainers/me/content/:videoId`

```json
{
  "title": "Updated title",
  "description": "Optional",
  "assignedMemberIds": ["64f…", "64a…"]
}
```

### `GET /trainers/content/assigned`

```json
{
  "success": true,
  "videos": [ { "id": "…", "title": "…", "playUrl": "https://…", … } ]
}
```

Regenerate **signed `playUrl`** on each GET (e.g. 1-hour expiry).

---

## Storage

1. Accept upload in Node (or presigned POST to R2/S3).
2. Store at `trainer-videos/{trainerId}/{videoId}.mp4`.
3. Optionally run ffmpeg for thumbnail + duration.
4. Never expose permanent public URLs; return signed URLs only to authorized users.

---

## Prompt for backend implementation

```
Implement trainer video library for Agile Athletes mobile:

1. Trainer-only POST /trainers/me/content — multipart video + title/description/assignedMemberIds
2. GET /trainers/me/content — list own videos
3. PUT /trainers/me/content/:videoId — update metadata and assignees
4. DELETE /trainers/me/content/:videoId — remove DB row and storage object
5. GET /trainers/content/assigned — videos where assignedMemberIds includes req.user._id
6. GET /trainers/:trainerId/content — videos assigned to requester from that trainer

Use Bearer auth. Verify user has trainer profile on /me/* routes.
Return playUrl as signed HTTPS links. Response shape must match mobile TrainerVideo type.
```

---

## Mobile files

| File | Role |
|------|------|
| `services/trainerContentApi.ts` | API client |
| `app/trainer/library.tsx` | Coach upload & manage |
| `app/trainer/assigned.tsx` | Client playback list |
| `app/trainer/[id].tsx` | Trainer profile video section |
