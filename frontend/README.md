# Attendance Management System — React Frontend

React 18 single-page application for the Automated Attendance Log Management System with facial recognition.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the App](#running-the-app)
- [Pages & Routes](#pages--routes)
- [Components](#components)
- [API Integration](#api-integration)
- [Route Guards](#route-guards)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Features

- **Kiosk Face Scan** — Student/teacher check-in via webcam face recognition
- **Admin Login with Face 2FA** — Password login followed by face verification step
- **Role-Based Dashboards** — Separate dashboards for Superadmin and Admin
- **Student Enrollment** — Form + webcam capture to register a new student's face
- **Live Face Detection** — Real-time face overlay using `WebcamWithFaceDetection`
- **Optimized Webcam Capture** — High-performance capture with native camera API option
- **Responsive Design** — Works on desktop and tablet

---

## Tech Stack

| Library | Version | Purpose |
|---|---|---|
| React | 18.2 | UI framework |
| React Router | 6.20 | Client-side routing |
| Axios | 1.6 | HTTP client |
| react-webcam | 7.2 | Webcam access |
| @vladmandic/face-api | 1.7.15 | Client-side face detection |
| react-select | 5.10 | Enhanced select dropdowns |
| CRACO | 7.1 | Create React App config override |

---

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── KioskScanner.js              # Full-screen kiosk face-scan UI
│   │   ├── KioskScanner.css
│   │   ├── WebcamCapture.js             # Standard webcam capture component
│   │   ├── WebcamCapture.css
│   │   ├── WebcamCaptureNative.js       # Native MediaDevices API variant
│   │   ├── WebcamCaptureNative.css
│   │   ├── WebcamWithFaceDetection.js   # Webcam + live face detection overlay
│   │   └── WebcamWithFaceDetection.css
│   ├── pages/
│   │   ├── HomePage.js           # Kiosk face-scan entry point (/)
│   │   ├── HomePage.css
│   │   ├── AdminLoginPage.js     # Admin password + face 2FA (/admin-login)
│   │   ├── AdminLoginPage.css
│   │   ├── DashboardPage.js      # Admin dashboard (/dashboard)
│   │   ├── DashboardPage.css
│   │   ├── SuperAdminDashboard.js# Superadmin dashboard
│   │   ├── SuperAdminDashboard.css
│   │   ├── EnrollPage.js         # Student enrollment (/enroll)
│   │   ├── EnrollPage.css
│   │   └── LoginPage.js          # Legacy student login page
│   ├── services/
│   │   └── api.js                # Centralized Axios API calls
│   ├── utils/
│   │   └── faceRecognitionService.js    # Client-side face descriptor utilities
│   ├── App.js                    # Router configuration + route guards
│   ├── App.css
│   ├── index.js
│   └── index.css
├── craco.config.js               # Webpack overrides (resolve fallbacks, etc.)
├── vercel.json                   # Vercel SPA routing config
└── package.json
```

---

## Installation

```bash
cd frontend
npm install
```

If you encounter peer dependency conflicts:

```bash
npm install --legacy-peer-deps
```

---

## Configuration

Create a `.env` file in the `frontend/` directory:

```env
# Backend API base URL
REACT_APP_API_URL=http://localhost:5000
```

For production, create `frontend/.env.production`:

```env
REACT_APP_API_URL=https://your-backend.onrender.com
```

The API service (`src/services/api.js`) reads `REACT_APP_API_URL` automatically.

---

## Running the App

```bash
# Development server
npm start
```

Opens at `http://localhost:3001` (configured in `craco.config.js`).

```bash
# Production build
npm run build
```

Outputs optimized static files to `build/`.

---

## Pages & Routes

| Path | Page | Access | Description |
|---|---|---|---|
| `/` | `HomePage` | Public | Kiosk face-scan for students and teachers |
| `/admin-login` | `AdminLoginPage` | Public | Admin password login + face 2FA |
| `/dashboard` | `DashboardPage` | Admin+ | Admin management dashboard |
| `/enroll` | `EnrollPage` | Admin+ | Register a new student with face photo |

> Admins who are fully authenticated are automatically redirected from `/` and `/admin-login` to `/dashboard`.

---

## Components

### KioskScanner

Full-screen face-scan UI intended for dedicated kiosk hardware. Continuously monitors the webcam for a recognized face and logs attendance automatically.

### WebcamCapture

General-purpose webcam component used across enrollment and login pages.

**Props:**
- `onCapture(imageBase64)` — called when the user captures a photo
- `capturedImage` — currently captured image (base64 string or null)

```jsx
import WebcamCapture from '../components/WebcamCapture';

const [image, setImage] = useState(null);

<WebcamCapture onCapture={setImage} capturedImage={image} />
```

### WebcamCaptureNative

Alternate webcam component using the native `MediaDevices.getUserMedia` API directly, without react-webcam. Useful for environments where react-webcam has compatibility issues.

### WebcamWithFaceDetection

Extends the webcam view with a real-time face bounding-box overlay using `@vladmandic/face-api` running in the browser. Used to give visual feedback before capture.

---

## API Integration

All API calls are centralized in `src/services/api.js`. Import individual functions rather than calling Axios directly:

```js
import {
  login,
  enrollStudent,
  faceLogin,
  getAttendanceLogs,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../services/api';

// Admin password login
const { token, user } = await login({ email, password });

// Enroll student
await enrollStudent({ studentId: 'STU001', name: 'Jane Doe', course: 'CS', image: base64 });

// Face scan attendance
await faceLogin({ image: base64, deviceId: 'WEB_KIOSK' });

// Fetch logs with filters
const { data } = await getAttendanceLogs({ studentId: 'STU001', startDate: '2026-05-01' });
```

The JWT token is stored in `localStorage` and attached automatically to all authenticated requests via an Axios request interceptor.

---

## Route Guards

`App.js` defines three route guards:

| Guard | Protects | Behavior |
|---|---|---|
| `KioskGuard` | `/` | Redirects fully-authenticated admins to `/dashboard` |
| `AdminLoginGuard` | `/admin-login` | Redirects fully-authenticated admins to `/dashboard` |
| `AdminRoute` | `/dashboard` | Redirects unauthenticated users to `/admin-login`; non-admins to `/` |

Face 2FA state is tracked via `localStorage.getItem('pendingFace2FA')`. An admin is considered "fully logged in" only when the JWT is present **and** `pendingFace2FA` is not `'true'`.

---

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Set environment variable: `REACT_APP_API_URL=https://your-backend.onrender.com`
4. Vercel detects Create React App and configures build settings automatically

`vercel.json` is already configured to redirect all routes to `index.html` for client-side routing.

### Manual Static Deploy

```bash
npm run build
# Upload the build/ folder to any static host (Netlify, GitHub Pages, S3, etc.)
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Camera not working | Grant camera permissions in browser settings. Use HTTPS in production |
| `net::ERR_CONNECTION_REFUSED` | Ensure backend is running and `REACT_APP_API_URL` is correct |
| CORS error | Confirm backend `allowedOrigins` includes the frontend URL |
| Blank page after build | Ensure `homepage` in `package.json` is set correctly for your deploy path |
| `npm install` fails | Try `npm install --legacy-peer-deps` |
| Face detection slow on first load | face-api models are loaded once on startup — subsequent scans are faster |
| Webcam used by another app | Close other video conferencing apps before testing |

---

For complete documentation, deployment guides, and API references see the [root README](../README.md) and the `backend/` folder.

---

**Version:** 1.0.0 | **Last Updated:** May 2026
