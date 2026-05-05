# API Endpoints Testing Guide

Complete reference for testing all API endpoints with organized categories, methods, descriptions, and response codes.

---

## Base URLs

| Environment | URL |
|---|---|
| Local | `http://localhost:5000` |
| Production | `https://your-api.onrender.com` |

---

## Authentication Endpoints

| # | Endpoint | Method | Description | Response | Status Code |
|---|---|---|---|---|---|
| 1 | `/api/auth/login` | POST | Authenticate admin/superadmin with email and password | User object + JWT token | 200 OK |
| 2 | `/api/auth/face-login` | POST | Authenticate student/teacher with face descriptor | User object + JWT token (optional 2FA) | 200 OK |
| 3 | `/api/auth/me` | GET | Get current authenticated user profile | User object (no password) | 200 OK |

---

## User Management Endpoints

| # | Endpoint | Method | Description | Response | Status Code |
|---|---|---|---|---|---|
| 4 | `/api/users` | GET | Fetch all registered users (filterable by role) | Array of user objects | 200 OK |
| 5 | `/api/users/:id` | GET | Get a single user by ID | User object | 200 OK |
| 6 | `/api/users` | POST | Create a new user account with face enrollment | Created user object | 201 Created |
| 7 | `/api/users/:id` | PUT | Update user profile or information | Updated user object | 200 OK |
| 8 | `/api/users/:id` | DELETE | Delete a user account | Deletion confirmation message | 200 OK |

---

## Enrollment Endpoints

| # | Endpoint | Method | Description | Response | Status Code |
|---|---|---|---|---|---|
| 9 | `/api/enroll/capture-face` | POST | Capture and store face descriptor for enrollment | Face descriptor + confidence score | 201 Created |
| 10 | `/api/enroll/re-enroll/:userId` | POST | Re-enroll a user with new face data | Updated user with new face descriptor | 200 OK |

---

## Attendance Tracking Endpoints

| # | Endpoint | Method | Description | Response | Status Code |
|---|---|---|---|---|---|
| 11 | `/api/attendance/kiosk/descriptors` | GET | Get all face descriptors for kiosk matching | Array of user face descriptors (students/teachers) | 200 OK |
| 12 | `/api/attendance/kiosk/record` | POST | Record attendance (time-in or time-out) | Attendance log entry with timestamp | 201 Created |
| 13 | `/api/attendance/logs` | GET | Get attendance logs (with filtering and pagination) | Array of attendance log objects | 200 OK |
| 14 | `/api/attendance/logs/:id` | GET | Get a single attendance log by ID | Attendance log object | 200 OK |
| 15 | `/api/attendance/logs/user/:userId` | GET | Get all attendance logs for a specific user | Array of attendance logs for that user | 200 OK |
| 16 | `/api/attendance/logs/date-range` | GET | Get attendance logs within a date range | Array of attendance logs | 200 OK |

---

## Face Recognition Endpoints

| # | Endpoint | Method | Description | Response | Status Code |
|---|---|---|---|---|---|
| 17 | `/api/face/detect` | POST | Detect faces in uploaded image | Array of detected faces with bounding boxes | 200 OK |
| 18 | `/api/face/verify` | POST | Verify face against stored descriptors | Match result with confidence score | 200 OK |

---

## Login Logs Endpoints

| # | Endpoint | Method | Description | Response | Status Code |
|---|---|---|---|---|---|
| 19 | `/api/login-logs` | GET | Get admin/superadmin login history | Array of login log objects | 200 OK |
| 20 | `/api/login-logs/stats` | GET | Get login statistics by role | Statistics object (counts, dates) | 200 OK |

---

## Device Sync Endpoints

| # | Endpoint | Method | Description | Response | Status Code |
|---|---|---|---|---|---|
| 21 | `/api/device-sync/users` | GET | Sync user list to kiosk device | Array of user objects | 200 OK |
| 22 | `/api/device-sync/descriptors` | GET | Sync face descriptors to kiosk device | Array of face descriptor objects | 200 OK |

---

## Upload Endpoints

| # | Endpoint | Method | Description | Response | Status Code |
|---|---|---|---|---|---|
| 23 | `/api/upload/face` | POST | Upload and process face image | Image path + processing status | 200 OK |
| 24 | `/api/upload/attendance-photo` | POST | Upload attendance capture photo | Image path + filename | 200 OK |

---

## Access Control Summary

| Role | Accessible Endpoints |
|---|---|
| Public | Login endpoints only |
| Superadmin | All endpoints (full system access) |
| Admin | User CRUD (filtered), Attendance logs (filtered), Login logs (own), Enrollment (manage assigned users) |
| Teacher | Attendance logs (view own), Kiosk recording (time-in/time-out only) |
| Student | Attendance logs (view own), Kiosk recording (time-in/time-out only) |

---

## HTTP Status Codes

| Status Code | Meaning |
|---|---|
| 200 OK | Request succeeded |
| 201 Created | Resource created successfully |
| 400 Bad Request | Invalid input data or missing required fields |
| 401 Unauthorized | Missing or invalid JWT token |
| 403 Forbidden | Insufficient permissions for this action |
| 404 Not Found | Resource does not exist |
| 409 Conflict | Duplicate enrollment or duplicate user |
| 500 Internal Server Error | Server-side error or face detection failure |

---

## Authentication & Security

| Field | Value |
|---|---|
| Authentication Type | Bearer Token (JWT) |
| Token Format | Authorization: Bearer `<JWT_TOKEN>` |
| Token Expiration | 7 days |
| Required for All Endpoints Except | `/api/auth/login`, `/api/auth/face-login` |
| Password Hashing | bcrypt (10 rounds) |
| Face Verification Threshold | 0.45 (strict matching) |

---

## Request/Response Examples

### Example 1: Admin Login
**Request:**
```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "admin@example.com",
    "role": "admin",
    "department": "IT",
    "hasFaceEnrolled": true
  }
}
```

---

### Example 2: Create New User (with Face Enrollment)
**Request:**
```json
POST /api/users
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "email": "john.doe@school.com",
  "password": "UserPass123",
  "role": "student",
  "department": "Computer Science",
  "faceImage": "<base64_image_data>"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439012",
    "email": "john.doe@school.com",
    "role": "student",
    "department": "Computer Science",
    "hasFaceEnrolled": true,
    "faceDescriptor": [0.123, -0.456, ...],
    "createdAt": "2026-05-05T10:30:00Z"
  }
}
```

---

### Example 3: Get Attendance Logs (with Filtering)
**Request:**
```
GET /api/attendance/logs?userId=507f1f77bcf86cd799439012&page=1&limit=50&sortBy=-createdAt
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "userId": "507f1f77bcf86cd799439012",
      "userRole": "student",
      "timeIn": "2026-05-05T08:30:15Z",
      "timeOut": "2026-05-05T16:45:30Z",
      "scanCount": 2,
      "confidenceScore": 0.92,
      "imagePath": "/uploads/attendance/image_12345.jpg",
      "createdAt": "2026-05-05T08:30:15Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 125
  }
}
```

---

### Example 4: Kiosk Record Attendance
**Request:**
```json
POST /api/attendance/kiosk/record
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439012",
  "faceDescriptor": [0.123, -0.456, ...],
  "confidenceScore": 0.94,
  "imagePath": "/uploads/attendance/kiosk_capture.jpg"
}
```

**Response (201 Created - Time-In):**
```json
{
  "success": true,
  "message": "Attendance recorded - Time In",
  "attendance": {
    "_id": "507f1f77bcf86cd799439014",
    "userId": "507f1f77bcf86cd799439012",
    "timeIn": "2026-05-05T08:30:15Z",
    "timeOut": null,
    "scanCount": 1,
    "confidenceScore": 0.94
  }
}
```

---

### Example 5: Error Response (401 Unauthorized)
**Response:**
```json
{
  "success": false,
  "message": "Unauthorized: Invalid or expired token",
  "statusCode": 401
}
```

---

## Total Endpoints: 24

**Breakdown by Category:**
- Authentication: 3
- User Management: 5
- Enrollment: 2
- Attendance Tracking: 6
- Face Recognition: 2
- Login Logs: 2
- Device Sync: 2
- Upload: 2

---

## Testing Checklist

- [ ] Test all endpoints with valid JWT token
- [ ] Test all endpoints without token (should return 401)
- [ ] Test role-based access control (superadmin vs admin vs student)
- [ ] Test face verification at 0.45 threshold
- [ ] Test time-in (scanCount=1) and time-out (scanCount=2) flows
- [ ] Test pagination in logs endpoints
- [ ] Test date filtering in attendance logs
- [ ] Test error responses (400, 403, 404, 500)
- [ ] Test image upload and processing
- [ ] Test kiosk rejection of admin/superadmin roles
- [ ] Test concurrent login session handling
- [ ] Test JWT token expiration (7 days)
