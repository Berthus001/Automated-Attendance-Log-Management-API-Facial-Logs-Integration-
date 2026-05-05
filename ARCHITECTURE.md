# System Architecture

## 3-Tier Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT TIER                        │   PRESENTATION
│                                                         │      LAYER
│         React SPA (CRACO) – Port 3001                   │  (User Interface)
│   Role-based routing, Axios HTTP client, JWT auth       │
│     @vladmandic/face-api (client-side detection)        │
└────────────────────────┬────────────────────────────────┘
                         │
                         │  HTTP/REST (JSON)
                         │  Authorization: Bearer <token>
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   APPLICATION TIER                      │  BUSINESS LOGIC
│                                                         │      LAYER
│          Express.js REST API – Port 5000                │  (Server Side)
│   JWT middleware, RBAC, Controllers, Business Logic,    │
│         Face Recognition (@vladmandic/face-api)         │
└────────────────────────┬────────────────────────────────┘
                         │
                         │  Mongoose ODM
                         ▼
┌─────────────────────────────────────────────────────────┐
│                      DATA TIER                          │
│                                                         │    DATA LAYER
│            MongoDB Atlas (Cloud Database)               │   (Database)
│                                                         │
│   Collections: Users, Students, AttendanceLogs,         │
│                LoginLogs                                │
└─────────────────────────────────────────────────────────┘
```

---

## Tier Breakdown

### CLIENT TIER — Presentation Layer (User Interface)

| Property | Details |
|---|---|
| Framework | React 18.2 |
| Build Tool | CRACO 7.1 (CRA override) |
| Port | 3001 |
| Routing | React Router v6 (role-based) |
| HTTP Client | Axios 1.6 |
| Auth | JWT stored client-side |
| Face Detection | @vladmandic/face-api 1.7.15 |
| Camera | react-webcam 7.2 |

**Responsibilities:**
- Login UI (email/password and face-only flows)
- Role-based dashboard routing (superadmin / admin / student / teacher)
- Webcam capture and face descriptor extraction
- Attendance and log visualization

---

### APPLICATION TIER — Business Logic Layer (Server Side)

| Property | Details |
|---|---|
| Framework | Express.js 4.18 |
| Port | 5000 |
| Entry Point | `backend/server.js` |
| Auth | JWT 9.0 + bcrypt 6.0 (7-day expiry) |
| Middleware | JWT auth, RBAC, asyncHandler, Morgan logger |
| Face Recognition | @vladmandic/face-api + TensorFlow.js (WASM) |
| Image Processing | Sharp 0.34 + canvas 3.2 |

**Responsibilities:**
- REST API endpoint handling (`/api/` prefix)
- JWT issuance and verification
- Role-based access control (superadmin → admin → student/teacher)
- Face descriptor matching (Euclidean distance, threshold: 0.6)
- Attendance logging and kiosk sync

**API Route Groups:**

| Route Group | Prefix |
|---|---|
| Authentication | `/api/auth` |
| User Management | `/api/users` |
| Attendance Logs | `/api/logs`, `/api/attendance` |
| Login Logs | `/api/login-logs` |
| Enrollment | `/api/enroll` |
| Kiosk Sync | `/api/kiosk` |
| Device Sync | `/api/device-sync` |
| File Upload | `/api/upload` |

---

### DATA TIER — Data Layer (Database)

| Property | Details |
|---|---|
| Database | MongoDB Atlas (cloud) |
| ODM | Mongoose 8.0 |
| Cluster | `mqs3i0j.mongodb.net` |
| Database Name | `attendance_db` |

**Collections:**

| Collection | Model File | Purpose |
|---|---|---|
| `users` | `User.model.js` | Admins, superadmins, teachers, students |
| `students` | `Student.model.js` | Legacy enrolled student records |
| `attendancelogs` | `AttendanceLog.model.js` | Face-login attendance records |
| `loginlogs` | `LoginLog.model.js` | Auth session tracking |

---

## Authentication & Authorization Flow

```
Superadmin / Admin
        │
        ▼
  Email + Password ──► JWT Token
        │
        ▼ (optional 2FA)
  Face Verification ──► Confirmed JWT

Student / Teacher
        │
        ▼
  Face Scan ──► Match against stored descriptors ──► JWT + Attendance Logged
```

**RBAC Role Hierarchy:**

```
superadmin
    └── admin (scoped to own created users)
            └── student / teacher
```

---

## Deployment Architecture

```
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│    Vercel    │        │    Render    │        │ MongoDB Atlas│
│  (Frontend)  │◄──────►│  (Backend)   │◄──────►│   (Cloud DB) │
│  React SPA   │  REST  │  Express API │  ODM   │  attendance  │
│  Port: 443   │  JSON  │  Port: 5000  │        │     _db      │
└──────────────┘        └──────────────┘        └──────────────┘
```

| Component | Platform | Config File |
|---|---|---|
| Frontend | Vercel | `frontend/vercel.json` |
| Backend | Render | `render.yaml` |
| Database | MongoDB Atlas | `backend/config/db.js` |
