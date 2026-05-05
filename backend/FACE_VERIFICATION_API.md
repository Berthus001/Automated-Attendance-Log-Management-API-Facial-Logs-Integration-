# Face Verification API

Admin two-factor authentication (2FA) using face recognition.

---

## Overview

After a successful email+password login, admin and superadmin users must complete face verification before accessing the dashboard. This is a mandatory second factor.

**Endpoints involved:**

| Step | Endpoint | Purpose |
|---|---|---|
| 1 | `POST /api/auth/login` | Password login — returns JWT |
| 2 | `POST /api/auth/enroll-face` | Enroll face (one-time setup) |
| 3 | `POST /api/auth/face-verify` | Verify face (every login) |

---

## Step 1: Enroll Face (one-time setup)

Admins must enroll their face before face verification is required.

```
POST /api/auth/enroll-face
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Face enrolled successfully",
  "user": {
    "id": "60d5ec49f1b2c72b8c8e4f3a",
    "name": "Admin User",
    "hasFaceEnrolled": true
  }
}
```

The 128-point face descriptor is extracted and stored in the `faceDescriptor` field of the User document.

---

## Step 2: Verify Face (every login)

After the JWT is received from `POST /api/auth/login`, send a face image to complete 2FA.

```
POST /api/auth/face-verify
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Success (200):**
```json
{
  "success": true,
  "message": "Face verified successfully",
  "verified": true,
  "confidence": {
    "distance": 0.3245,
    "threshold": 0.6
  },
  "user": {
    "id": "60d5ec49f1b2c72b8c8e4f3a",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

**Face mismatch (401):**
```json
{
  "success": false,
  "message": "Face verification failed. Face does not match.",
  "verified": false,
  "confidence": { "distance": 0.72, "threshold": 0.6 }
}
```

**Face not enrolled (400):**
```json
{
  "success": false,
  "message": "No face descriptor found. Please enroll your face first."
}
```

---

## Frontend Flow

```
User submits email + password
  ? POST /api/auth/login
  ? Success: store token, set pendingFace2FA = "true" in localStorage

User submits face photo
  ? POST /api/auth/face-verify (with Bearer token)
  ? Success: clear pendingFace2FA, redirect to /dashboard
  ? Failure: show "Face not matched" error, remain on verification page
```

The `AdminRoute` guard checks that `pendingFace2FA` is not set. If it is, the user is redirected back to the face verification step.

---

## Match Thresholds

| Distance | Meaning |
|---|---|
| < 0.4 | Strong match |
| 0.4 – 0.59 | Match |
| = 0.6 | No match |

---

## Error Reference

| Code | Message | Cause |
|---|---|---|
| 400 | `No image provided` | Missing `image` field |
| 400 | `No face detected in the image` | Blank or invalid image |
| 400 | `No face descriptor found. Please enroll your face first.` | Not enrolled |
| 401 | `Face verification failed. Face does not match.` | Distance = 0.6 |
| 401 | `Not authorized to access this route` | Invalid/missing JWT |
| 403 | `Access denied` | Teacher/student tried to access admin-only route |
