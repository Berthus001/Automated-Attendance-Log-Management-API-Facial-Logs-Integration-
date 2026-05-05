# Kiosk System Implementation

The kiosk system allows students and teachers to log attendance by showing their face to a webcam. No password is needed.

---

## Two Kiosk Modes

### Mode 1 — Server-Side Recognition (Legacy)

Uses the `/api/auth/face-login` endpoint. The frontend sends a captured image to the backend, which runs face recognition and returns the matched user.

**Flow:**
```
Webcam capture ? base64 image ? POST /api/auth/face-login ? backend runs faceDetection.js ? returns user + JWT ? logs attendance
```

**Endpoint:**
```
POST /api/auth/face-login
Body: { "image": "<base64-encoded-jpeg>" }
Response: { "success": true, "token": "...", "user": { ... } }
```

---

### Mode 2 — Client-Side Recognition (Current Default)

Uses the `/api/kiosk` endpoints. The frontend loads all enrolled face descriptors once, performs matching in the browser using face-api.js, then sends only the matched user ID to the backend.

**Flow:**
```
GET /api/kiosk/descriptors
  ? Frontend receives all user descriptors
  ? react-webcam captures video frames
  ? face-api.js detects face + extracts 128-point descriptor
  ? Browser computes Euclidean distance against all stored descriptors
  ? If distance < 0.6 ? match found
  ? POST /api/kiosk/attendance { userId, confidence }
  ? Backend creates attendance log
```

**Endpoints:**
```
GET  /api/kiosk/descriptors
Response: [ { userId, name, role, descriptor: [128 floats] }, ... ]

POST /api/kiosk/attendance
Body: { "userId": "<ObjectId>", "confidence": 0.85, "timestamp": "ISO string" }
Response: { "success": true, "log": { ... } }
```

---

## Components

### KioskPage.js

Location: `frontend/src/components/KioskPage.js`

Responsibilities:
- Mount react-webcam for video capture
- Load face-api.js models (TinyFaceDetector + FaceRecognitionNet)
- Fetch all descriptors from `GET /api/kiosk/descriptors` on mount
- Run detection loop on video frames (requestAnimationFrame)
- Draw bounding box overlay on `<canvas>` over the video
- On match: display name, role, call `POST /api/kiosk/attendance`
- Auto-refresh descriptors every 5 minutes

### AdminLoginPage.js

Location: `frontend/src/components/AdminLoginPage.js`

Handles the admin login flow:
1. Email + password ? `POST /api/auth/login`
2. If face 2FA required: webcam opens for `POST /api/auth/face-verify`
3. JWT stored in localStorage on success

---

## Face Matching Algorithm

```
distance = sqrt( sum( (a[i] - b[i])^2 ) for i in 0..127 )

if distance < 0.4 ? strong match (early exit)
if distance < 0.6 ? match
if distance >= 0.6 ? no match
```

Implemented in `backend/utils/faceDetection.js`:
- `extractFaceDescriptor(imageBuffer)` — returns Float32Array[128]
- `findBestMatch(queryDescriptor, storedDescriptors)` — returns `{ userId, distance, confidence }`

---

## Face-API Models

The following model files must exist in `backend/models/face-api/` for the backend to work:

| File | Purpose |
|---|---|
| `ssd_mobilenetv1_model-*` | Face detection (SSD + MobileNetV1) |
| `face_landmark_68_model-*` | 68-point facial landmark detection |
| `face_recognition_model-*` | 128-d face descriptor embedding |

The frontend loads the same models from the public CDN or from `public/models/`.

---

## Attendance Log Schema

Each kiosk scan creates an `AttendanceLog` document:

```js
{
  userId: ObjectId,         // Reference to User
  userName: String,
  userRole: String,         // 'student' | 'teacher'
  timestamp: Date,
  confidence: Number,       // 0–1 (inverse of distance)
  captureImage: String,     // Optional base64 or file path
  location: String,         // Optional
  deviceId: String          // Optional (for device sync)
}
```

---

## Security Notes

- The kiosk endpoints (`/api/kiosk/*`) are **public** — no JWT required
- This is intentional: kiosk devices are trusted hardware in a controlled environment
- The `POST /api/kiosk/attendance` endpoint only writes to `AttendanceLog`, not to `User`
- Brute force protection: client-side matching means no sensitive data traverses the network per-scan

---

## Device Sync

For offline kiosk devices that batch-sync attendance later:

```
POST /api/device-sync          - Sync single log
POST /api/device-sync/bulk     - Sync multiple logs at once
```

See [DEVICE_SYNC_API.md](backend/DEVICE_SYNC_API.md).
