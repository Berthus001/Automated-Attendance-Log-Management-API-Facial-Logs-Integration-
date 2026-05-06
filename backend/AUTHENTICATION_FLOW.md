# Authentication System � Complete Flow

The system uses two distinct login paths depending on the user role.

---

## Login Method by Role

| Role | Method | 2FA | Endpoint |
|---|---|---|---|
| **Superadmin** | Email + Password | Face verification | `POST /api/auth/login` ? `POST /api/auth/face-verify` |
| **Admin** | Email + Password | Face verification | `POST /api/auth/login` ? `POST /api/auth/face-verify` |
| **Teacher** | Face scan only | None | `POST /api/auth/face-login` |
| **Student** | Face scan only | None | `POST /api/auth/face-login` |

---

## 1. Admin / Superadmin � Email + Password Login

### Step 1: Password Login

**`POST /api/auth/login`**

```json
{
  "email": "admin@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ec49f1b2c72b8c8e4f3a",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin",
    "hasFaceEnrolled": true
  }
}
```

**Already logged in (409):**
```json
{
  "success": false,
  "message": "User already logged in from another session"
}
```

Use `"forceLogin": true` in the request body to override an active session.

---

### Step 2: Face Verification (2FA)

Required for admin/superadmin after password login. The frontend stores a `pendingFace2FA` flag in localStorage until this step is complete.

**`POST /api/auth/face-verify`**

```
Authorization: Bearer <jwt-token>
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

---

## 2. Teacher / Student � Face-Only Login

**`POST /api/auth/face-login`** (Public)

```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "deviceId": "KIOSK_001"
}
```

**Success � attendance recorded (200):**
```json
{
  "success": true,
  "message": "Face login successful. Attendance recorded.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ec49f1b2c72b8c8e4f3c",
    "name": "Jane Doe",
    "email": "jane.doe@student.com",
    "role": "student"
  },
  "attendance": {
    "id": "662f9a3b5e8f4a001234abcd",
    "timestamp": "2026-05-05T08:30:00.000Z",
    "status": "present",
    "alreadyLogged": false
  },
  "confidence": { "distance": 0.21, "threshold": 0.6 }
}
```

**Already logged today (200):**
```json
{
  "success": true,
  "message": "Face recognized. You have already logged attendance today.",
  "attendance": { "alreadyLogged": true }
}
```

**Face not recognized (401):**
```json
{
  "success": false,
  "message": "Face not recognized. No matching user found.",
  "confidence": { "distance": 0.81, "threshold": 0.6 }
}
```

---

## 3. Face Enrollment (Admin/Superadmin only)

Enroll or update the current user's face descriptor for 2FA.

**`POST /api/auth/enroll-face`**

```
Authorization: Bearer <jwt-token>
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
  "message": "Face enrolled successfully",
  "user": {
    "id": "60d5ec49f1b2c72b8c8e4f3a",
    "name": "Admin User",
    "hasFaceEnrolled": true
  },
  "faceDetection": {
    "confidence": 0.9856,
    "boundingBox": { "x": 45, "y": 32, "width": 180, "height": 220 }
  }
}
```

---

## 4. Logout

**`POST /api/auth/logout`**

```
Authorization: Bearer <jwt-token>
```

**Success (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

Sets `isLoggedIn = false` on the user document and records `logoutTime` in the LoginLog.

---

## 5. Get Current User

**`GET /api/auth/me`**

```
Authorization: Bearer <jwt-token>
```

**Success (200):**
```json
{
  "success": true,
  "user": {
    "id": "60d5ec49f1b2c72b8c8e4f3a",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin",
    "isActive": true,
    "hasFaceEnrolled": true
  }
}
```

---

## Session Management

| Setting | Value |
|---|---|
| Token expiry | 7 days (configurable via `JWT_EXPIRE`) |
| Session timeout | 24 hours � stale sessions auto-cleared |
| Multi-session | Blocked (returns 409). Use `forceLogin: true` to override |

### Session Flow

```
Login request
  +- isLoggedIn = true?
       +- Yes + lastLoginAt < 24h ago ? 409 Already logged in
       +- Yes + lastLoginAt > 24h ago ? stale, clear session, allow login
       +- No ? proceed with login
```

---

## Frontend State

The frontend stores auth state in `localStorage`:

| Key | Value | Purpose |
|---|---|---|
| `token` | JWT string | Sent as `Authorization: Bearer <token>` on every request |
| `user` | JSON string `{role, ...}` | Read by route guards |
| `pendingFace2FA` | `"true"` | Set after password login, cleared after face-verify |

### Route Guards (`App.js`)

| Guard | Route | Behaviour |
|---|---|---|
| `KioskGuard` | `/` | Redirects fully-authenticated admins to `/dashboard` |
| `AdminLoginGuard` | `/admin-login` | Redirects fully-authenticated admins to `/dashboard` |
| `AdminRoute` | `/dashboard` | Requires valid token + admin role + no pending 2FA |

---

## Error Reference

| Code | Message | Cause |
|---|---|---|
| 400 | `Please provide email and password` | Missing fields |
| 400 | `No face detected in the image` | Invalid or blank image |
| 400 | `No face descriptor found` | User not enrolled |
| 401 | `Invalid credentials` | Wrong email/password |
| 401 | `Face verification failed` | Face mismatch |
| 401 | `Not authorized to access this route` | Missing/invalid JWT |
| 403 | `Access denied. This login is for administrators only` | Student/teacher tried password login |
| 403 | `Account is deactivated` | `isActive = false` |
| 409 | `User already logged in from another session` | Active session exists |
| 500 | Server error message | Unexpected server error |
