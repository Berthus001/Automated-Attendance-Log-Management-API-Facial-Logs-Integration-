# Face Login API

Handles face-recognition-based attendance logging via the `/api/face-login` route.

> **Note:** For the primary authentication flow (kiosk login that issues a JWT), use `POST /api/auth/face-login`. The `/api/face-login` endpoints below are the legacy student-model endpoints. See [AUTHENTICATION_FLOW.md](AUTHENTICATION_FLOW.md) for the current unified auth flow.

---

## Base Path: `/api/face-login`

---

## How It Works

1. Client sends a base64 face image
2. Server extracts a 128-point face descriptor using face-api.js
3. Descriptor is compared (Euclidean distance) against all enrolled students in the **Student** model
4. Best match below threshold (0.6) is selected — early exit at 0.4 for strong matches
5. Attendance log is created for the matched student
6. Returns student info + confidence scores

---

## Endpoints

### POST /api/face-login — Log Attendance

```
POST /api/face-login
Content-Type: application/json
```

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "deviceId": "KIOSK_001",
  "location": {
    "type": "Point",
    "coordinates": [121.0244, 14.5547]
  }
}
```

**Success (200):**
```json
{
  "success": true,
  "message": "Attendance logged successfully",
  "data": {
    "student": {
      "studentId": "STU001",
      "name": "John Doe",
      "course": "Computer Science"
    },
    "attendance": {
      "id": "662f9a3b5e8f4a001234abcd",
      "timestamp": "2026-05-05T08:30:00.000Z",
      "status": "present",
      "imagePath": "uploads/attendance/img_1746433800000.jpeg",
      "deviceId": "KIOSK_001"
    },
    "match": {
      "confidence": "0.8542",
      "distance": "0.1458",
      "threshold": 0.6
    }
  }
}
```

**Error Responses:**

| Code | Condition |
|---|---|
| 400 | No image provided |
| 400 | No face detected in image |
| 404 | No enrolled students found |
| 404 | No matching student found |

---

### POST /api/face-login/verify — Verify Face (No Log)

Same request format as above. Returns match result without creating an attendance record.

```
POST /api/face-login/verify
```

**Response (200):**
```json
{
  "success": true,
  "verified": true,
  "student": {
    "studentId": "STU001",
    "name": "John Doe"
  },
  "confidence": {
    "distance": "0.1458",
    "threshold": 0.6
  }
}
```

---

### GET /api/face-login/stats/:studentId — Student Stats

```
GET /api/face-login/stats/STU001
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "studentId": "STU001",
    "totalAttendance": 18,
    "presentCount": 16,
    "lateCount": 2,
    "absentCount": 0,
    "attendanceRate": "88.89%"
  }
}
```

---

## Match Thresholds

| Distance | Meaning |
|---|---|
| < 0.4 | Strong match — early termination |
| < 0.6 | Match — attendance logged |
| = 0.6 | No match — face not recognized |
