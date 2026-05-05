# End-to-End Workflow Examples

Step-by-step walkthroughs for the most common use cases.

---

## 1. Superadmin First-Time Setup

### Step 1: Create superadmin account

```bash
cd backend
node create-superadmin.js
```

This creates the initial superadmin with the credentials:
- Email: `superadmin@attendance.com`
- Password: `Admin@123456`

### Step 2: Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@attendance.com","password":"Admin@123456"}'
```

Save the `token` from the response.

### Step 3: Enroll face for 2FA

```bash
curl -X POST http://localhost:5000/api/auth/enroll-face \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/jpeg;base64,<BASE64_FACE_PHOTO>"}'
```

---

## 2. Admin Login Flow (with 2FA)

### Step 1: Password login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"AdminPass123"}'
```

Response: `{ "token": "...", "user": { "hasFaceEnrolled": true } }`

### Step 2: Face verification

```bash
curl -X POST http://localhost:5000/api/auth/face-verify \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/jpeg;base64,<BASE64_FACE>"}'
```

Response: `{ "verified": true }` ? dashboard access granted.

---

## 3. Create Users

### Create a teacher

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Prof. Maria Santos",
    "email": "maria.santos@school.com",
    "password": "TeacherPass123",
    "role": "teacher",
    "department": "Mathematics",
    "image": "data:image/jpeg;base64,<BASE64_FACE>"
  }'
```

### Create a student

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan dela Cruz",
    "email": "juan@school.com",
    "password": "StudentPass123",
    "role": "student",
    "department": "Computer Science",
    "image": "data:image/jpeg;base64,<BASE64_FACE>"
  }'
```

---

## 4. Student/Teacher Kiosk Attendance

### Student faces the kiosk camera

```bash
curl -X POST http://localhost:5000/api/auth/face-login \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,<CAMERA_CAPTURE>",
    "deviceId": "KIOSK_MAIN_ENTRANCE"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Face login successful. Attendance recorded.",
  "user": { "name": "Juan dela Cruz", "role": "student" },
  "attendance": {
    "timestamp": "2026-05-05T08:15:00.000Z",
    "status": "present",
    "alreadyLogged": false
  }
}
```

---

## 5. Client-Side Kiosk (Optimised)

For high-traffic kiosks, use the two-step kiosk API:

### Step 1: Pre-load all face descriptors

```bash
curl http://localhost:5000/api/kiosk/descriptors
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "userId": "60d5ec49f1b2c72b8c8e4f3c",
      "userName": "Juan dela Cruz",
      "userRole": "student",
      "faceDescriptor": [0.0234, -0.1023, ...]
    }
  ]
}
```

### Step 2: Perform face matching in the browser

The frontend (`src/components/KioskPage.js`) loads these descriptors and uses face-api.js to match the webcam feed locally.

### Step 3: Record attendance after match

```bash
curl -X POST http://localhost:5000/api/kiosk/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "60d5ec49f1b2c72b8c8e4f3c",
    "userName": "Juan dela Cruz",
    "userRole": "student",
    "deviceId": "KIOSK_MAIN_ENTRANCE",
    "confidenceScore": 0.89,
    "timestamp": "2026-05-05T08:15:00.000Z"
  }'
```

---

## 6. Viewing Attendance Reports

### All logs for May 2026

```bash
curl "http://localhost:5000/api/logs?startDate=2026-05-01&endDate=2026-05-31&page=1&limit=50" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Daily summary

```bash
curl "http://localhost:5000/api/logs/by-date?startDate=2026-05-01&endDate=2026-05-31" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Attendance stats summary

```bash
curl http://localhost:5000/api/logs/summary \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

## 7. Offline Device Sync

For kiosks that operated without internet:

```bash
curl -X POST http://localhost:5000/api/device-sync/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "logs": [
      {
        "userId": "60d5ec49f1b2c72b8c8e4f3c",
        "userName": "Juan dela Cruz",
        "userRole": "student",
        "timestamp": "2026-05-05T07:58:00.000Z",
        "status": "present",
        "deviceId": "KIOSK_OFFLINE_01"
      }
    ]
  }'
```
