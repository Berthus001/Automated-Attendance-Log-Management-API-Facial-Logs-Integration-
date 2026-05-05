# Project Structure

```
GROUP 4 - Automated Attendance Log Management API (Facial Logs Integration)/
+-- README.md
+-- render.yaml                        # Render deployment config (backend)
+-- API_ENDPOINTS_TESTING.md
+-- ATTENDANCE_LOG_RBAC.md
+-- DEPLOYMENT_CHECKLIST.md
+-- DEPLOYMENT_GUIDE.md
+-- DEPLOYMENT_TROUBLESHOOTING.md
+-- DEPLOYMENT_WITH_CONFIG_FILES.md
+-- DOCUMENTATION_OVERVIEW.md
+-- FILES_CHANGED.md
+-- FUNCTIONAL_TEST_CASES.md
+-- KIOSK_SYSTEM_IMPLEMENTATION.md
+-- OPTIMIZED_WEBCAM_CAPTURE.md
+-- QUICK_START_DEPLOYMENT.md
+-- QUICK_START_KIOSK.md
+-- TESTING_RBAC_ATTENDANCE.md
+-- USER_FLOW_DIAGRAMS.md
¦
+-- backend/                           # Node.js + Express API server
¦   +-- package.json
¦   +-- server.js                      # Express app entry point, route mounts
¦   +-- create-superadmin.js           # CLI script to create superadmin
¦   +-- diagnose-connection.js         # MongoDB connection diagnostics
¦   +-- fix-superadmin-role.js         # Fix corrupted superadmin role
¦   +-- list-all-users.js              # CLI script to list all users
¦   +-- test-atlas-connection.js       # Test MongoDB Atlas connection
¦   ¦
¦   +-- config/
¦   ¦   +-- db.js                      # Mongoose connection setup
¦   ¦
¦   +-- controllers/
¦   ¦   +-- attendanceController.js    # GET /api/attendance
¦   ¦   +-- authController.js          # login, face-login, face-verify, enroll-face, logout, me
¦   ¦   +-- deviceSyncController.js    # POST /api/device-sync (single + bulk)
¦   ¦   +-- enrollController.js        # CRUD /api/enroll (legacy Student model)
¦   ¦   +-- faceLoginController.js     # POST /api/face-login (legacy)
¦   ¦   +-- faceVerificationExamples.js # Example file (not a route handler)
¦   ¦   +-- kioskController.js         # GET /api/kiosk/descriptors, POST /api/kiosk/attendance
¦   ¦   +-- loginLogsController.js     # GET /api/login-logs
¦   ¦   +-- logsController.js          # CRUD /api/logs
¦   ¦   +-- uploadController.js        # POST /api/upload
¦   ¦   +-- userController.js          # CRUD /api/users
¦   ¦   +-- userManagementExamples.js  # Example file (not a route handler)
¦   ¦
¦   +-- middleware/
¦   ¦   +-- asyncHandler.js            # Wraps async handlers, forwards errors
¦   ¦   +-- auth.js                    # protect + allowRoles()/authorize middleware
¦   ¦   +-- errorHandler.js            # Global Express error handler
¦   ¦   +-- index.js                   # Middleware barrel export
¦   ¦   +-- logger.js                  # Morgan request logging
¦   ¦
¦   +-- models/
¦   ¦   +-- index.js                   # Model barrel export
¦   ¦   +-- AttendanceLog.model.js     # Attendance log schema
¦   ¦   +-- LoginLog.model.js          # Login/logout tracking schema
¦   ¦   +-- Student.model.js           # Legacy student schema (enrollment)
¦   ¦   +-- User.model.js              # Primary user schema (all roles)
¦   ¦   +-- face-api/                  # ML model weight files (not in repo)
¦   ¦
¦   +-- routes/
¦   ¦   +-- attendanceRoutes.js        # /api/attendance
¦   ¦   +-- authRoutes.js              # /api/auth
¦   ¦   +-- deviceSyncRoutes.js        # /api/device-sync
¦   ¦   +-- enrollRoutes.js            # /api/enroll
¦   ¦   +-- exampleAuthRoutes.js       # Examples (not mounted in server.js)
¦   ¦   +-- faceLoginRoutes.js         # /api/face-login
¦   ¦   +-- kioskRoutes.js             # /api/kiosk
¦   ¦   +-- loginLogsRoutes.js         # /api/login-logs
¦   ¦   +-- logsRoutes.js              # /api/logs
¦   ¦   +-- uploadRoutes.js            # /api/upload
¦   ¦   +-- userRoutes.js              # /api/users
¦   ¦
¦   +-- uploads/
¦   ¦   +-- attendance/                # Attendance capture images
¦   ¦   +-- faces/                     # Enrolled face images
¦   ¦   +-- students/                  # Student images (legacy)
¦   ¦
¦   +-- utils/
¦       +-- faceDetection.js           # Face descriptor extraction + matching
¦       +-- faceRecognitionExamples.js # Example code (not used in routes)
¦       +-- imageHelpers.js            # Base64 decode/save helpers
¦       +-- imageProcessor.js          # Sharp image preprocessing
¦       +-- logger.js                  # Winston logger
¦
+-- frontend/                          # React 18 SPA
    +-- package.json
    +-- craco.config.js                # CRA override (CRACO)
    +-- vercel.json                    # Vercel deployment config
    ¦
    +-- public/                        # Static assets
    ¦
    +-- src/
        +-- App.js                     # Router, route guards (KioskGuard, AdminLoginGuard, AdminRoute)
        +-- index.js                   # React DOM entry point
        ¦
        +-- services/
        ¦   +-- api.js                 # Axios instance + all API call functions
        ¦
        +-- components/
        ¦   +-- KioskPage.js           # Webcam face kiosk (student/teacher)
        ¦   +-- AdminLoginPage.js      # Admin email+password + face 2FA login
        ¦   +-- SuperAdminDashboard.js # Admin/superadmin user management dashboard
        ¦   +-- HomePage.js            # Kiosk landing page
        ¦   +-- ...                    # Other UI components
        ¦
        +-- build/                     # Production build output (auto-generated)
```

---

## Key Entry Points

| File | Purpose |
|---|---|
| `backend/server.js` | Starts Express server on `PORT` (default 5000), mounts all routes |
| `frontend/src/App.js` | Defines React routes: `/` (kiosk), `/admin-login`, `/dashboard` |
| `frontend/src/services/api.js` | Single Axios instance used for all API calls |
| `backend/create-superadmin.js` | Run once to create the initial superadmin account |
