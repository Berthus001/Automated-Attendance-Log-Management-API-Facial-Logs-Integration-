# Documentation Overview

Index of all documentation files in this project.

---

## Getting Started

| File | Description |
|---|---|
| [README.md](README.md) | Project overview, features, quick setup |
| [QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md) | Step-by-step: clone ? configure ? run |
| [QUICK_START_KIOSK.md](QUICK_START_KIOSK.md) | Get the attendance kiosk running |

---

## Deployment

| File | Description |
|---|---|
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Full Render + Vercel deployment instructions |
| [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) | Pre/post-deployment validation checklist |
| [DEPLOYMENT_WITH_CONFIG_FILES.md](DEPLOYMENT_WITH_CONFIG_FILES.md) | render.yaml, vercel.json, .env templates |
| [DEPLOYMENT_TROUBLESHOOTING.md](DEPLOYMENT_TROUBLESHOOTING.md) | Common deployment errors and fixes |

---

## API Reference

| File | Description |
|---|---|
| [backend/README.md](backend/README.md) | Backend overview and all API modules |
| [backend/AUTHENTICATION_FLOW.md](backend/AUTHENTICATION_FLOW.md) | Auth flow, 2FA, session management |
| [backend/USER_MANAGEMENT_API.md](backend/USER_MANAGEMENT_API.md) | CRUD /api/users — roles, permissions |
| [backend/LOGS_API.md](backend/LOGS_API.md) | Attendance logs — /api/logs |
| [backend/FACE_LOGIN_API.md](backend/FACE_LOGIN_API.md) | Server-side face login — /api/auth/face-login |
| [backend/FACE_RECOGNITION_API.md](backend/FACE_RECOGNITION_API.md) | Face detection pipeline, thresholds |
| [backend/FACE_VERIFICATION_API.md](backend/FACE_VERIFICATION_API.md) | Admin face 2FA — enroll + verify |
| [backend/ENROLLMENT_API.md](backend/ENROLLMENT_API.md) | Legacy student enrollment — /api/enroll |
| [backend/SESSION_MANAGEMENT.md](backend/SESSION_MANAGEMENT.md) | Session lifecycle, 24-hour timeout |
| [backend/LOGIN_TRACKING_API.md](backend/LOGIN_TRACKING_API.md) | Login event logs — /api/login-logs |
| [backend/DEVICE_SYNC_API.md](backend/DEVICE_SYNC_API.md) | Offline device sync — /api/device-sync |
| [backend/ERROR_HANDLING.md](backend/ERROR_HANDLING.md) | Error codes, asyncHandler, errorHandler |
| [backend/MODELS_SETUP.md](backend/MODELS_SETUP.md) | Face-api ML model download and setup |
| [backend/USAGE_EXAMPLES.md](backend/USAGE_EXAMPLES.md) | curl examples for all endpoints |
| [backend/WORKFLOW_EXAMPLE.md](backend/WORKFLOW_EXAMPLE.md) | End-to-end workflow walkthroughs |

---

## System Architecture

| File | Description |
|---|---|
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | Full directory tree with inline descriptions |
| [KIOSK_SYSTEM_IMPLEMENTATION.md](KIOSK_SYSTEM_IMPLEMENTATION.md) | Kiosk modes, client-side vs server-side |
| [OPTIMIZED_WEBCAM_CAPTURE.md](OPTIMIZED_WEBCAM_CAPTURE.md) | Webcam capture, canvas overlay, react-webcam |
| [USER_FLOW_DIAGRAMS.md](USER_FLOW_DIAGRAMS.md) | ASCII flow diagrams for all user journeys |

---

## Frontend

| File | Description |
|---|---|
| [frontend/README.md](frontend/README.md) | Frontend overview, components, routes |
| [frontend/SUPERADMIN_DASHBOARD.md](frontend/SUPERADMIN_DASHBOARD.md) | Dashboard features, user management UI |
| [frontend/UPDATED_LOGIN_UI.md](frontend/UPDATED_LOGIN_UI.md) | Login page UI, face 2FA flow |
| [frontend/WEBPACK_WARNINGS_FIX.md](frontend/WEBPACK_WARNINGS_FIX.md) | CRACO config, source-map-loader fix |

---

## Testing

| File | Description |
|---|---|
| [FUNCTIONAL_TEST_CASES.md](FUNCTIONAL_TEST_CASES.md) | Functional test cases for all features |
| [TESTING_RBAC_ATTENDANCE.md](TESTING_RBAC_ATTENDANCE.md) | RBAC and attendance-specific test cases |
| [API_ENDPOINTS_TESTING.md](API_ENDPOINTS_TESTING.md) | API endpoint testing guide with curl |
| [Attendance_API.postman_collection.json](Attendance_API.postman_collection.json) | Postman collection for all endpoints |

---

## Security & Access Control

| File | Description |
|---|---|
| [ATTENDANCE_LOG_RBAC.md](ATTENDANCE_LOG_RBAC.md) | Role-based access rules per endpoint |

---

## Key Facts

| Item | Value |
|---|---|
| API prefix | `/api/` (all routes) |
| Backend port (local) | `5000` |
| Frontend port (local) | `3001` |
| Session timeout | 24 hours |
| JWT expiry | 7 days |
| Face match threshold | 0.6 (distance) |
| Strong match threshold | 0.4 |
| Superadmin email | `superadmin@attendance.com` |
| Superadmin password | `Admin@123456` (change after setup) |
