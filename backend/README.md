# Attendance Management API — Backend

Node.js/Express REST API for the Automated Attendance Log Management System with facial recognition.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
- [Middleware & Error Handling](#middleware--error-handling)
- [Face Recognition Setup](#face-recognition-setup)
- [Quick Start Examples](#quick-start-examples)
- [Documentation Files](#documentation-files)

---

## Project Structure

```
backend/
├── config/
│   └── db.js                    # MongoDB Atlas connection
├── controllers/
│   ├── authController.js        # Login, face 2FA, token management
│   ├── userController.js        # User CRUD operations
│   ├── enrollController.js      # Student face enrollment
│   ├── faceLoginController.js   # Face recognition attendance logging
│   ├── attendanceController.js  # Attendance record management
│   ├── logsController.js        # Attendance log querying & aggregation
│   ├── loginLogsController.js   # Admin login audit trail
│   ├── uploadController.js      # Base64 image upload & processing
│   ├── deviceSyncController.js  # External device attendance sync
│   └── kioskController.js       # Kiosk-mode operations
├── middleware/
│   ├── auth.js                  # JWT verification + RBAC guards
│   ├── asyncHandler.js          # Wraps async route handlers
│   ├── errorHandler.js          # Global error response handler
│   ├── logger.js                # Per-request logging middleware
│   └── index.js                 # Middleware barrel export
├── models/
│   ├── User.model.js            # User schema (admin, teacher, student, superadmin)
│   ├── Student.model.js         # Student profile + face descriptor
│   ├── AttendanceLog.model.js   # Attendance event records
│   ├── LoginLog.model.js        # Admin login audit records
│   └── face-api/                # face-api model weights (download separately)
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── enrollRoutes.js
│   ├── faceLoginRoutes.js
│   ├── attendanceRoutes.js
│   ├── logsRoutes.js
│   ├── loginLogsRoutes.js
│   ├── uploadRoutes.js
│   ├── deviceSyncRoutes.js
│   └── kioskRoutes.js
├── utils/
│   ├── faceDetection.js         # Face descriptor extraction & matching
│   ├── imageHelpers.js          # Base64 / buffer conversion helpers
│   └── imageProcessor.js        # Sharp-based resize & compression
├── uploads/
│   ├── faces/                   # Stored face images
│   ├── students/                # Student profile images
│   └── attendance/              # Attendance capture images
├── create-superadmin.js         # One-time superadmin seed script
├── server.js                    # Application entry point
└── package.json
```

---

## Installation

```bash
npm install
```

### Face-api Model Files (Required)

Face recognition will not work without the model files.

1. Download from: https://github.com/vladmandic/face-api/tree/master/model
2. Place all files in `models/face-api/`

See [MODELS_SETUP.md](MODELS_SETUP.md) for the complete file list and instructions.

---

## Environment Variables

Create a `.env` file in this directory:

```env
# MongoDB Atlas connection string (SRV format)
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/attendance_db?retryWrites=true&w=majority

# JWT secret — minimum 32 characters, use a random string
JWT_SECRET=your-super-secret-jwt-key-here

# Server port
PORT=5000

# Environment
NODE_ENV=development

# Frontend URL for CORS (set in production)
FRONTEND_URL=https://your-app.vercel.app
```

> Never commit `.env` to version control.

---

## Running the Server

```bash
# Development — auto-reload with nodemon
npm run dev

# Production
npm start
```

Server starts at `http://localhost:5000`.

**First-time setup:** Create the superadmin account before first login:

```bash
node create-superadmin.js
```

Default credentials: `superadmin@attendance.com` / `Admin@123456` (change immediately).

---

## API Endpoints

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

### Authentication — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Email + password login, returns JWT |
| POST | `/api/auth/face-login` | Public | Face 2FA step for admins |
| GET | `/api/auth/me` | Required | Returns current user profile |
| POST | `/api/auth/logout` | Required | Invalidate session |

### Users — `/api/users`

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/users` | Admin+ | List users (filtered by role) |
| GET | `/api/users/:id` | Admin+ | Get single user |
| POST | `/api/users` | Admin+ | Create user |
| PUT | `/api/users/:id` | Admin+ | Update user |
| DELETE | `/api/users/:id` | Admin+ | Delete user |

### Enrollment — `/api/enroll`

| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/api/enroll` | Admin+ | Enroll student with face image |
| GET | `/api/enroll` | Admin+ | List all enrolled students |
| GET | `/api/enroll/:studentId` | Admin+ | Get single student |
| PUT | `/api/enroll/:studentId` | Admin+ | Update student info |
| DELETE | `/api/enroll/:studentId` | Admin+ | Remove student |

### Face Login / Attendance — `/api/face-login`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/face-login` | Public | Match face and log attendance |
| POST | `/api/face-login/verify` | Public | Verify face without logging |
| GET | `/api/face-login/stats/:studentId` | Required | Student attendance statistics |

### Attendance Logs — `/api/logs`

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/logs` | Required | Get logs (filter by student, date, status) |
| GET | `/api/logs/:id` | Required | Get single log |
| GET | `/api/logs/summary` | Required | Aggregated attendance stats |
| GET | `/api/logs/by-date` | Required | Logs grouped by date |
| DELETE | `/api/logs/:id` | Admin+ | Delete a log entry |

### Upload — `/api/upload`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/upload/image` | Required | Upload a single base64 image |
| POST | `/api/upload/images` | Required | Upload multiple base64 images |
| POST | `/api/upload/face` | Required | Upload and process a face image |

### Device Sync — `/api/device-sync`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/device-sync` | Required | Sync a single log from external device |
| POST | `/api/device-sync/bulk` | Required | Bulk sync multiple logs |

### Kiosk — `/api/kiosk`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/kiosk/scan` | Public | Kiosk face scan and check-in |
| GET | `/api/kiosk/status` | Public | Kiosk health/status |

### Login Logs — `/api/login-logs`

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/login-logs` | Admin+ | List admin login audit records |

---

## Middleware & Error Handling

### asyncHandler

Wraps async route handlers to forward thrown errors to the global error handler — no manual try/catch needed.

```js
router.get('/example', asyncHandler(async (req, res) => {
  const data = await SomeModel.find();
  res.json({ success: true, data });
}));
```

### errorHandler

Global error handler (`middleware/errorHandler.js`). Catches all unhandled errors and returns a consistent JSON response:

```json
{
  "success": false,
  "message": "Error description"
}
```

Handles:
- Mongoose validation errors → `400`
- Mongoose duplicate key errors → `400`
- Invalid ObjectId (cast errors) → `400`
- JWT errors → `401`
- File upload errors → `400`
- Custom `AppError` with status code → respective status

### auth Middleware

JWT verification + role-based access control:

```js
const { protect, authorize } = require('../middleware/auth');

// Require login
router.get('/protected', protect, handler);

// Require specific roles
router.delete('/admin-only', protect, authorize('admin', 'superadmin'), handler);
```

### requestLogger

Logs every request with timestamp, method, URL, and response time.

---

## Face Recognition Setup

The system uses `@vladmandic/face-api` with a TensorFlow.js WASM backend (no native compilation required on Windows).

**How enrollment works:**
1. Client sends a base64 face image to `POST /api/enroll`
2. Server extracts a 128-point face descriptor using `SsdMobilenetv1` + `FaceRecognitionNet`
3. Descriptor is stored in the `Student` document in MongoDB

**How face login works:**
1. Client sends a base64 face image to `POST /api/face-login`
2. Server extracts the descriptor from the incoming image
3. Descriptor is compared (Euclidean distance) against all enrolled students
4. If distance < threshold (0.5 default), attendance is logged
5. Returns matched student info + confidence score

---

## Quick Start Examples

### Enroll a Student

```bash
curl -X POST http://localhost:5000/api/enroll \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "studentId": "STU001",
    "name": "John Doe",
    "course": "Computer Science",
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }'
```

### Log Attendance via Face Scan

```bash
curl -X POST http://localhost:5000/api/face-login \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "deviceId": "KIOSK_001"
  }'
```

Response:

```json
{
  "success": true,
  "message": "Attendance logged successfully",
  "data": {
    "student": { "studentId": "STU001", "name": "John Doe" },
    "match": { "confidence": "0.8542", "distance": "0.1458" },
    "timestamp": "2026-05-05T08:30:00.000Z"
  }
}
```

### Query Attendance Logs

```bash
curl "http://localhost:5000/api/logs?studentId=STU001&startDate=2026-05-01&endDate=2026-05-31&page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

---

## Documentation Files

| File | Description |
|---|---|
| [AUTHENTICATION_FLOW.md](AUTHENTICATION_FLOW.md) | Login flow, JWT lifecycle, face 2FA |
| [USER_MANAGEMENT_API.md](USER_MANAGEMENT_API.md) | User CRUD, roles, RBAC |
| [ENROLLMENT_API.md](ENROLLMENT_API.md) | Student enrollment with face |
| [FACE_LOGIN_API.md](FACE_LOGIN_API.md) | Face recognition attendance API |
| [FACE_VERIFICATION_API.md](FACE_VERIFICATION_API.md) | Standalone face verification |
| [FACE_RECOGNITION_API.md](FACE_RECOGNITION_API.md) | Face recognition internals |
| [LOGS_API.md](LOGS_API.md) | Attendance log querying & filtering |
| [LOGIN_TRACKING_API.md](LOGIN_TRACKING_API.md) | Admin login audit API |
| [DEVICE_SYNC_API.md](DEVICE_SYNC_API.md) | External device sync |
| [MODELS_SETUP.md](MODELS_SETUP.md) | Face-api model files setup |
| [ERROR_HANDLING.md](ERROR_HANDLING.md) | Error handling reference |
| [SESSION_MANAGEMENT.md](SESSION_MANAGEMENT.md) | JWT session management |
| [WORKFLOW_EXAMPLE.md](WORKFLOW_EXAMPLE.md) | End-to-end workflow walkthrough |
| [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md) | Image processing examples |

---

**Version:** 1.0.0 | **Last Updated:** May 2026
