# API Endpoints Testing Guide

Complete reference for testing all API endpoints with curl, Postman, or similar tools.

---

## Base URLs

| Environment | URL |
|---|---|
| Local | `http://localhost:5000` |
| Production | `https://your-api.onrender.com` |

Set a `BASE_URL` variable to switch between environments.

---

## Auth Header

Protected routes require:
```
Authorization: Bearer <TOKEN>
```

---

## 1. Authentication (`/api/auth`)

### POST /api/auth/login — Admin Password Login
```bash
curl -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"SecurePass123"}'
```

| Field | Value |
|---|---|
| Access | Public |
| Roles | admin, superadmin |

**200 OK**
```json
{ "success": true, "token": "eyJ...", "user": { "role": "admin", "hasFaceEnrolled": true } }
```

**401 — wrong credentials**
```json
{ "success": false, "message": "Invalid credentials" }
```

**409 — already logged in**
```json
{ "success": false, "message": "User already logged in from another session" }
```

---

### POST /api/auth/face-login — Student/Teacher Face Login + Attendance
```bash
curl -X POST $BASE_URL/api/auth/face-login \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/jpeg;base64,<DATA>","deviceId":"KIOSK_001"}'
```

| Field | Value |
|---|---|
| Access | Public |
| Roles | student, teacher |

---

### POST /api/auth/face-verify — Admin Face 2FA
```bash
curl -X POST $BASE_URL/api/auth/face-verify \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/jpeg;base64,<DATA>"}'
```

| Field | Value |
|---|---|
| Access | Protected (admin, superadmin) |

---

### POST /api/auth/enroll-face — Enroll Admin Face
```bash
curl -X POST $BASE_URL/api/auth/enroll-face \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/jpeg;base64,<DATA>"}'
```

| Field | Value |
|---|---|
| Access | Protected (admin, superadmin) |

---

### GET /api/auth/me — Current User
```bash
curl $BASE_URL/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

| Field | Value |
|---|---|
| Access | Protected (all roles) |

---

### POST /api/auth/logout — Logout
```bash
curl -X POST $BASE_URL/api/auth/logout \
  -H "Authorization: Bearer <TOKEN>"
```

| Field | Value |
|---|---|
| Access | Protected (all roles) |

---

## 2. User Management (`/api/users`)

### GET /api/users — List All Users
```bash
curl $BASE_URL/api/users \
  -H "Authorization: Bearer <TOKEN>"
```

| Field | Value |
|---|---|
| Access | Protected (admin, superadmin) |

---

### GET /api/users/students — List Students
```bash
curl $BASE_URL/api/users/students \
  -H "Authorization: Bearer <TOKEN>"
```

---

### GET /api/users/teachers — List Teachers
```bash
curl $BASE_URL/api/users/teachers \
  -H "Authorization: Bearer <TOKEN>"
```

---

### POST /api/users — Create User
```bash
curl -X POST $BASE_URL/api/users \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Student",
    "email": "test@example.com",
    "password": "Pass123!",
    "role": "student",
    "department": "Computer Science",
    "image": "data:image/jpeg;base64,<DATA>"
  }'
```

| Field | Value |
|---|---|
| Access | Protected (admin, superadmin) |

---

### GET /api/users/:id — Get Single User
```bash
curl $BASE_URL/api/users/<USER_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

---

### PUT /api/users/:id — Update User
```bash
curl -X PUT $BASE_URL/api/users/<USER_ID> \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name","department":"IT"}'
```

---

### DELETE /api/users/:id — Delete User
```bash
curl -X DELETE $BASE_URL/api/users/<USER_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 3. Attendance Logs (`/api/logs`)

### GET /api/logs — All Logs
```bash
curl "$BASE_URL/api/logs?page=1&limit=20" \
  -H "Authorization: Bearer <TOKEN>"
```

**Supported query params:** `userId`, `userRole`, `status`, `startDate`, `endDate`, `page`, `limit`

---

### GET /api/logs/my-attendance — Own Attendance
```bash
curl $BASE_URL/api/logs/my-attendance \
  -H "Authorization: Bearer <TOKEN>"
```

| Field | Value |
|---|---|
| Access | Protected (all roles) |

---

### GET /api/logs/summary — Stats Summary
```bash
curl $BASE_URL/api/logs/summary \
  -H "Authorization: Bearer <TOKEN>"
```

---

### GET /api/logs/by-date — Grouped by Date
```bash
curl "$BASE_URL/api/logs/by-date?startDate=2026-05-01&endDate=2026-05-31" \
  -H "Authorization: Bearer <TOKEN>"
```

---

### GET /api/logs/:id — Single Log
```bash
curl $BASE_URL/api/logs/<LOG_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

---

### DELETE /api/logs/:id — Delete Log
```bash
curl -X DELETE $BASE_URL/api/logs/<LOG_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 4. Kiosk (`/api/kiosk`)

### GET /api/kiosk/descriptors — All Face Descriptors (Public)
```bash
curl $BASE_URL/api/kiosk/descriptors
```

Returns face descriptors for all enrolled users (students + teachers) for client-side matching.

---

### POST /api/kiosk/attendance — Record Attendance (Public)
```bash
curl -X POST $BASE_URL/api/kiosk/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<USER_ID>",
    "userName": "Test Student",
    "userRole": "student",
    "deviceId": "KIOSK_001",
    "confidenceScore": 0.88
  }'
```

---

## 5. Login Logs (`/api/login-logs`)

### GET /api/login-logs — All Login Logs
```bash
curl "$BASE_URL/api/login-logs?role=student&page=1&limit=20" \
  -H "Authorization: Bearer <TOKEN>"
```

---

### GET /api/login-logs/stats — Statistics
```bash
curl $BASE_URL/api/login-logs/stats \
  -H "Authorization: Bearer <TOKEN>"
```

---

### GET /api/login-logs/me — Own Login History
```bash
curl $BASE_URL/api/login-logs/me \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 6. Legacy Enrollment (`/api/enroll`)

### GET /api/enroll — All Students (Public)
```bash
curl $BASE_URL/api/enroll
```

### POST /api/enroll — Enroll Student (Public)
```bash
curl -X POST $BASE_URL/api/enroll \
  -H "Content-Type: application/json" \
  -d '{"studentId":"STU001","name":"John Doe","course":"CS","image":"data:image/jpeg;base64,<DATA>"}'
```

### GET /api/enroll/:studentId — Get Student (Public)
```bash
curl $BASE_URL/api/enroll/STU001
```

### PUT /api/enroll/:studentId — Update Student (Public)
```bash
curl -X PUT $BASE_URL/api/enroll/STU001 \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}'
```

### DELETE /api/enroll/:studentId — Delete Student (Public)
```bash
curl -X DELETE $BASE_URL/api/enroll/STU001
```

---

## 7. Legacy Face Login (`/api/face-login`)

### POST /api/face-login — Student Face Login (Public)
```bash
curl -X POST $BASE_URL/api/face-login \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/jpeg;base64,<DATA>","deviceId":"KIOSK_001"}'
```

### POST /api/face-login/verify — Verify Without Logging (Public)
```bash
curl -X POST $BASE_URL/api/face-login/verify \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/jpeg;base64,<DATA>"}'
```

### GET /api/face-login/stats/:studentId — Student Stats (Public)
```bash
curl $BASE_URL/api/face-login/stats/STU001
```

---

## 8. Attendance (`/api/attendance`)

### GET /api/attendance — Attendance Records
```bash
curl $BASE_URL/api/attendance \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 9. Upload (`/api/upload`)

### POST /api/upload/image — Upload Single Image (Public)
```bash
curl -X POST $BASE_URL/api/upload/image \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/jpeg;base64,<DATA>"}'
```

### POST /api/upload/images — Upload Multiple Images (Public)
```bash
curl -X POST $BASE_URL/api/upload/images \
  -H "Content-Type: application/json" \
  -d '{"images":["data:image/jpeg;base64,<DATA1>","data:image/jpeg;base64,<DATA2>"]}'
```

---

## 10. Device Sync (`/api/device-sync`)

### POST /api/device-sync — Sync Single Log (Public)
```bash
curl -X POST $BASE_URL/api/device-sync \
  -H "Content-Type: application/json" \
  -d '{"userId":"<USER_ID>","userName":"Test","userRole":"student","timestamp":"2026-05-05T08:00:00.000Z","status":"present","deviceId":"KIOSK_001"}'
```

### POST /api/device-sync/bulk — Bulk Sync (Public)
```bash
curl -X POST $BASE_URL/api/device-sync/bulk \
  -H "Content-Type: application/json" \
  -d '{"logs":[{"userId":"<ID>","userName":"Test","userRole":"student","timestamp":"2026-05-05T08:00:00.000Z","status":"present","deviceId":"KIOSK_001"}]}'
```

---

## Quick Health Check

```bash
curl $BASE_URL/api/auth/me -H "Authorization: Bearer <TOKEN>"
```

Returns 200 if server is up and token is valid.
