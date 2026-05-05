# Automated Attendance Log Management System
### Facial Recognition Integration — Group 4

A full-stack attendance management system using facial recognition for automated check-in/check-out. Built with Node.js, Express, MongoDB Atlas, and React 18.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [First-Time Setup](#first-time-setup)
- [API Overview](#api-overview)
- [User Roles & Access Control](#user-roles--access-control)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributors](#contributors)

---

## Features

### Core
- **JWT Authentication** — Secure login with token-based sessions
- **Two-Factor Admin Login** — Password login + face recognition verification (2FA)
- **Face Recognition Attendance** — Automated check-in via webcam face matching
- **Student Enrollment** — Register students with face descriptor capture
- **Kiosk Mode** — Dedicated face-scan kiosk for students and teachers
- **Role-Based Dashboards** — Separate views for Superadmin, Admin, Teacher, and Student
- **User Management** — Full CRUD for users across all roles
- **Attendance Logs** — Filterable, paginated logs with date/student/status filters
- **Login Audit Logs** — Track all admin login activity
- **Device Sync API** — Ingest attendance from external hardware devices (bulk upload)

### Security
- Password hashing with bcrypt
- JWT token authentication on all protected routes
- Role-based access control (RBAC) on every endpoint
- Face descriptor data stored server-side (never exposed to client)
- CORS restricted to known origins in production

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js v20.x |
| Framework | Express.js 4.18 |
| Database | MongoDB Atlas |
| ODM | Mongoose 8.0 |
| Auth | JWT + bcrypt 6.0 |
| Face Recognition | @vladmandic/face-api 1.7.15 |
| ML Backend | @tensorflow/tfjs 4.22 + tfjs-backend-wasm |
| Image Processing | Sharp 0.34 + canvas 3.2 |
| Logging | Morgan + custom request logger |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18.2 |
| Routing | React Router v6 |
| HTTP Client | Axios 1.6 |
| Face Detection | @vladmandic/face-api 1.7.15 |
| Webcam | react-webcam 7.2 |
| Select Input | react-select 5.10 |
| Build Tool | CRACO 7.1 (CRA override) |

---

## Prerequisites

- **Node.js** v20.x or higher — [nodejs.org](https://nodejs.org/)
- **npm** v10.x or higher (bundled with Node.js)
- **MongoDB Atlas** account — [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- **Git** — [git-scm.com](https://git-scm.com/)
- A browser with webcam support (Chrome or Edge recommended)

---

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd "GROUP 4 - Automated Attendance Log Management API (Facial Logs Integration)"
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 4. Download face-api models (required)

Face recognition will not work without the model files. See [backend/MODELS_SETUP.md](backend/MODELS_SETUP.md) for instructions.

Download from: https://github.com/vladmandic/face-api/tree/master/model  
Place all files in: `backend/models/face-api/`

---

## Configuration

### Backend — `backend/.env`

Create a `.env` file in the `backend/` directory:

```env
# MongoDB Atlas connection string
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/attendance_db?retryWrites=true&w=majority

# JWT secret — use a long, random string (minimum 32 characters)
JWT_SECRET=your-super-secret-jwt-key-here

# Server settings
PORT=5000
NODE_ENV=development

# Production frontend URL (set after deploying frontend)
FRONTEND_URL=https://your-app.vercel.app
```

> **Important:** Never commit `.env` to version control. It is already included in `.gitignore`.

### Frontend — `frontend/.env`

For local development, the frontend connects to `http://localhost:5000` by default.  
To override, create `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000
```

For production, create `frontend/.env.production`:

```env
REACT_APP_API_URL=https://your-backend.onrender.com
```

---

## Running the Application

### Backend

```bash
cd backend

# Development (hot-reload via nodemon)
npm run dev

# Production
npm start
```

Server starts at: `http://localhost:5000`

### Frontend

Open a **new terminal**:

```bash
cd frontend
npm start
```

App opens at: `http://localhost:3001`

---

## First-Time Setup

Before logging in, create the initial superadmin account:

```bash
cd backend
node create-superadmin.js
```

**Default credentials:**
- Email: `superadmin@attendance.com`
- Password: `Admin@123456`
- Role: `superadmin`

> **Change the default password immediately after first login.**

---

## API Overview

All routes are prefixed with `/api`. Authentication requires a `Bearer <token>` header.

| Module | Base Path | Description |
|---|---|---|
| Auth | `/api/auth` | Login, logout, get current user |
| Users | `/api/users` | User CRUD + role management |
| Enrollment | `/api/enroll` | Student face enrollment |
| Face Login | `/api/face-login` | Facial recognition attendance |
| Attendance | `/api/attendance` | Attendance log CRUD |
| Logs | `/api/logs` | Query attendance records |
| Login Logs | `/api/login-logs` | Admin login audit trail |
| Upload | `/api/upload` | Base64 image upload & processing |
| Device Sync | `/api/device-sync` | Sync logs from external devices |
| Kiosk | `/api/kiosk` | Kiosk-specific endpoints |

### Key Endpoints

```http
POST   /api/auth/login              # Password login — returns JWT
POST   /api/auth/face-login         # Face 2FA for admins
GET    /api/auth/me                 # Current user info

POST   /api/enroll                  # Enroll new student with face image
GET    /api/enroll                  # List all enrolled students

POST   /api/face-login              # Log attendance via face scan
POST   /api/face-login/verify       # Verify face without logging

GET    /api/logs                    # Get attendance logs (filterable, paginated)
GET    /api/logs/summary            # Aggregated attendance statistics

GET    /api/users                   # List users (role-filtered)
POST   /api/users                   # Create user
PUT    /api/users/:id               # Update user
DELETE /api/users/:id               # Delete user

POST   /api/device-sync             # Sync single log from external device
POST   /api/device-sync/bulk        # Bulk sync from external device
```

For full endpoint documentation see the `backend/` folder:
- [AUTHENTICATION_FLOW.md](backend/AUTHENTICATION_FLOW.md)
- [USER_MANAGEMENT_API.md](backend/USER_MANAGEMENT_API.md)
- [ENROLLMENT_API.md](backend/ENROLLMENT_API.md)
- [FACE_LOGIN_API.md](backend/FACE_LOGIN_API.md)
- [LOGS_API.md](backend/LOGS_API.md)
- [DEVICE_SYNC_API.md](backend/DEVICE_SYNC_API.md)

---

## User Roles & Access Control

| Role | Description |
|---|---|
| **Superadmin** | Full access. Can create and manage admins, teachers, and students. |
| **Admin** | Can manage teachers and students. Cannot access other admin accounts. |
| **Teacher** | Can view and manage student attendance in their scope. |
| **Student** | Can view their own attendance history. Uses kiosk for check-in. |

### Login Flow

- **Students / Teachers** — Use the kiosk homepage (`/`) — face scan only
- **Admins / Superadmins** — Use the admin login page (`/admin-login`) — password + face 2FA

---

## Project Structure

```
project-root/
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js        # Auth logic (login, face 2FA)
│   │   ├── userController.js        # User CRUD
│   │   ├── enrollController.js      # Student enrollment
│   │   ├── faceLoginController.js   # Face recognition attendance
│   │   ├── attendanceController.js  # Attendance CRUD
│   │   ├── logsController.js        # Log querying
│   │   ├── loginLogsController.js   # Login audit logs
│   │   ├── uploadController.js      # Image upload and processing
│   │   ├── deviceSyncController.js  # External device sync
│   │   └── kioskController.js       # Kiosk operations
│   ├── middleware/
│   │   ├── auth.js                  # JWT verification + RBAC
│   │   ├── errorHandler.js          # Global error handler
│   │   ├── asyncHandler.js          # Async error wrapper
│   │   └── logger.js                # Request logger
│   ├── models/
│   │   ├── User.model.js
│   │   ├── Student.model.js
│   │   ├── AttendanceLog.model.js
│   │   ├── LoginLog.model.js
│   │   └── face-api/                # Face recognition model files (download required)
│   ├── routes/                      # Express route definitions
│   ├── utils/
│   │   ├── faceDetection.js         # Face recognition helpers
│   │   ├── imageHelpers.js          # Image utility functions
│   │   └── imageProcessor.js        # Sharp-based processing
│   ├── uploads/                     # Uploaded images (gitignored)
│   ├── server.js                    # Application entry point
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── KioskScanner.js              # Kiosk face-scan component
│   │   │   ├── WebcamCapture.js             # Generic webcam capture
│   │   │   ├── WebcamCaptureNative.js       # Native camera API variant
│   │   │   └── WebcamWithFaceDetection.js   # Webcam + live face overlay
│   │   ├── pages/
│   │   │   ├── HomePage.js           # Student/teacher kiosk (/)
│   │   │   ├── AdminLoginPage.js     # Admin login with face 2FA (/admin-login)
│   │   │   ├── DashboardPage.js      # Admin dashboard (/dashboard)
│   │   │   ├── SuperAdminDashboard.js# Superadmin dashboard
│   │   │   ├── EnrollPage.js         # Student enrollment (/enroll)
│   │   │   └── LoginPage.js          # Legacy login page
│   │   ├── services/
│   │   │   └── api.js                # Axios API service layer
│   │   ├── utils/
│   │   │   └── faceRecognitionService.js
│   │   ├── App.js                    # Router + route guards
│   │   └── index.js
│   ├── craco.config.js
│   └── package.json
│
├── render.yaml                      # Render deployment config
└── README.md
```

---

## Deployment

### Deploy Backend to Render

1. Push code to GitHub
2. Create a **Web Service** on [render.com](https://render.com)
3. Set **Root Directory** to `backend`
4. Set **Build Command** to `npm install` and **Start Command** to `node server.js`
5. Add environment variables: `MONGO_URI`, `JWT_SECRET`, `PORT=5000`, `NODE_ENV=production`, `FRONTEND_URL`
6. Allow `0.0.0.0/0` in MongoDB Atlas Network Access (required for Render dynamic IPs)

### Deploy Frontend to Vercel

1. Create a **Project** on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add environment variable: `REACT_APP_API_URL=https://your-backend.onrender.com`
4. Deploy — Vercel detects Create React App automatically

### After Deployment

- Update `FRONTEND_URL` in Render environment variables with your Vercel URL
- Create superadmin via Render Shell: `node create-superadmin.js`
- Webcam requires HTTPS — both platforms provide it automatically

For detailed step-by-step instructions:
- [QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md) — 15-minute fast track
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) — Complete guide with screenshots
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) — Printable checklist
- [DEPLOYMENT_TROUBLESHOOTING.md](DEPLOYMENT_TROUBLESHOOTING.md) — Common deployment issues

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `MongooseServerSelectionError` | Check `MONGO_URI` in `.env` and MongoDB Atlas IP whitelist |
| Face models not loading | Ensure all files are in `backend/models/face-api/` — see [MODELS_SETUP.md](backend/MODELS_SETUP.md) |
| CORS error in browser | Add frontend origin to `allowedOrigins` in `backend/server.js` |
| `Token is not valid` | Log out, clear localStorage, log back in. Verify `JWT_SECRET` matches |
| Camera not working | Grant browser permissions. Use HTTPS in production. Close other apps using camera |
| Canvas install fails (Windows) | Project uses WASM backend — native compilation is not required |
| Render service sleeping | Free tier sleeps after 15 min inactivity. Upgrade to Starter ($7/mo) for always-on |
| Frontend build fails | Try `npm install --legacy-peer-deps` in the `frontend/` directory |

---

## Contributors

**GROUP 4**
- [Add team member names]
- [Add team member names]
- [Add team member names]
- [Add team member names]

---

## Acknowledgments

- [face-api.js](https://github.com/vladmandic/face-api) by Vladimir Mandic
- TensorFlow.js team
- MongoDB Atlas
- React and the open-source community

---

**Version:** 1.0.0 | **Last Updated:** May 2026 | **Status:** Active Development
