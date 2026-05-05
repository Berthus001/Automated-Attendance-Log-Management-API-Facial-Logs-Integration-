# API Usage Examples

Quick-reference curl examples for all major API operations.

---

## Authentication

### Admin login (email + password)
```bash
curl -X POST https://your-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"SecurePass123"}'
```

### Force login (override active session)
```bash
curl -X POST https://your-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"SecurePass123","forceLogin":true}'
```

### Face login (student/teacher — also logs attendance)
```bash
curl -X POST https://your-api.onrender.com/api/auth/face-login \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/jpeg;base64,<BASE64_DATA>","deviceId":"KIOSK_001"}'
```

### Admin face 2FA verification
```bash
curl -X POST https://your-api.onrender.com/api/auth/face-verify \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/jpeg;base64,<BASE64_DATA>"}'
```

### Get current user
```bash
curl https://your-api.onrender.com/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

### Logout
```bash
curl -X POST https://your-api.onrender.com/api/auth/logout \
  -H "Authorization: Bearer <TOKEN>"
```

---

## User Management

### List all users
```bash
curl https://your-api.onrender.com/api/users \
  -H "Authorization: Bearer <TOKEN>"
```

### List students only
```bash
curl https://your-api.onrender.com/api/users/students \
  -H "Authorization: Bearer <TOKEN>"
```

### Create a student
```bash
curl -X POST https://your-api.onrender.com/api/users \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Pass123!",
    "role": "student",
    "department": "Computer Science",
    "image": "data:image/jpeg;base64,<BASE64_DATA>"
  }'
```

### Update a user
```bash
curl -X PUT https://your-api.onrender.com/api/users/<USER_ID> \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe Updated","department":"IT"}'
```

### Delete a user
```bash
curl -X DELETE https://your-api.onrender.com/api/users/<USER_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Attendance Logs

### Get all logs (admin)
```bash
curl "https://your-api.onrender.com/api/logs?page=1&limit=20" \
  -H "Authorization: Bearer <TOKEN>"
```

### Filter logs by date and status
```bash
curl "https://your-api.onrender.com/api/logs?startDate=2026-05-01&endDate=2026-05-31&status=present" \
  -H "Authorization: Bearer <TOKEN>"
```

### Get own attendance (any user)
```bash
curl https://your-api.onrender.com/api/logs/my-attendance \
  -H "Authorization: Bearer <TOKEN>"
```

### Get attendance summary
```bash
curl https://your-api.onrender.com/api/logs/summary \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Kiosk

### Get all enrolled user descriptors
```bash
curl https://your-api.onrender.com/api/kiosk/descriptors
```

### Record kiosk attendance (after client-side face match)
```bash
curl -X POST https://your-api.onrender.com/api/kiosk/attendance \
  -H "Content-Type: application/json" \
  -d '{"userId":"<USER_ID>","userName":"Jane Doe","userRole":"student","deviceId":"KIOSK_001","confidenceScore":0.85}'
```

---

## Legacy Enrollment (Student Model)

### Enroll student
```bash
curl -X POST https://your-api.onrender.com/api/enroll \
  -H "Content-Type: application/json" \
  -d '{"studentId":"STU001","name":"John Doe","course":"CS","image":"data:image/jpeg;base64,<DATA>"}'
```

### List enrolled students
```bash
curl https://your-api.onrender.com/api/enroll
```

---

## Login Logs

### Get all login history (admin)
```bash
curl https://your-api.onrender.com/api/login-logs \
  -H "Authorization: Bearer <TOKEN>"
```

### Get own login history
```bash
curl https://your-api.onrender.com/api/login-logs/me \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Device Sync

### Sync offline attendance record
```bash
curl -X POST https://your-api.onrender.com/api/device-sync \
  -H "Content-Type: application/json" \
  -d '{"userId":"<USER_ID>","userName":"Jane Doe","userRole":"student","timestamp":"2026-05-05T08:30:00.000Z","status":"present","deviceId":"KIOSK_001"}'
```
