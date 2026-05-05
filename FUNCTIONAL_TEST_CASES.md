# Functional Test Cases

Functional test cases covering all major system features.

---

## Authentication

### TC-AUTH-001: Superadmin Login (Email + Password)
- **Precondition:** Superadmin account exists
- **Input:** `POST /api/auth/login` `{ email: "superadmin@attendance.com", password: "Admin@123456" }`
- **Expected:** 200, returns `token` and `user` object with `role: "superadmin"`

### TC-AUTH-002: Invalid Password
- **Input:** Correct email, wrong password
- **Expected:** 401 `{ success: false, message: "Invalid credentials" }`

### TC-AUTH-003: Inactive Account Login
- **Precondition:** User with `isActive: false`
- **Expected:** 401 `{ success: false, message: "Account is deactivated" }`

### TC-AUTH-004: Session Conflict (Already Logged In)
- **Precondition:** User is already logged in (within 24-hour window)
- **Input:** Login again without `forceLogin`
- **Expected:** 409 `{ success: false, message: "User already logged in" }`

### TC-AUTH-005: Force Login
- **Input:** Same login + `{ forceLogin: true }`
- **Expected:** 200, new token issued, old session invalidated

### TC-AUTH-006: Get Current User
- **Input:** `GET /api/auth/me` with valid Bearer token
- **Expected:** 200, returns user profile

### TC-AUTH-007: Logout
- **Input:** `POST /api/auth/logout` with valid Bearer token
- **Expected:** 200, `isLoggedIn` set to false

---

## Face Login (Server-Side)

### TC-FACE-001: Valid Face Login
- **Precondition:** User enrolled with face image
- **Input:** `POST /api/auth/face-login` with base64 image of enrolled user
- **Expected:** 200, returns token + user, attendance logged

### TC-FACE-002: Unknown Face
- **Input:** Image of a face not in the system
- **Expected:** 404 `{ success: false, message: "No match found" }`

### TC-FACE-003: No Face in Image
- **Input:** Image without a detectable face
- **Expected:** 400 `{ success: false, message: "No face detected" }`

---

## Admin 2FA (Face Verification)

### TC-2FA-001: Enroll Admin Face
- **Input:** `POST /api/auth/enroll-face` with base64 image, admin token
- **Expected:** 200, face descriptor stored on admin user

### TC-2FA-002: Face Verify Step
- **Input:** `POST /api/auth/face-verify` with base64 image, partial-auth token
- **Expected:** 200, full JWT returned

### TC-2FA-003: Wrong Face in 2FA
- **Input:** Different person's face during verify step
- **Expected:** 401 `{ success: false }`

---

## User Management

### TC-USER-001: Create Student
- **Input:** `POST /api/users` with admin token, `{ name, email, role: "student", password, faceImage }`
- **Expected:** 201, user created with face descriptor stored

### TC-USER-002: Create User Without Face
- **Input:** `POST /api/users` without `faceImage`
- **Expected:** 201, user created (face enrollment optional)

### TC-USER-003: Admin Gets All Users
- **Input:** `GET /api/users` with admin token
- **Expected:** 200, returns only users created by this admin

### TC-USER-004: Superadmin Gets All Users
- **Input:** `GET /api/users` with superadmin token
- **Expected:** 200, returns all users in the system

### TC-USER-005: Delete Another Admin's User
- **Precondition:** Admin A and Admin B each created a user
- **Input:** Admin A tries to delete Admin B's user
- **Expected:** 403 `{ success: false, message: "Not authorized" }`

### TC-USER-006: Get Students Only
- **Input:** `GET /api/users/students` with admin token
- **Expected:** 200, returns only users with `role: "student"`

---

## Kiosk Attendance (Client-Side)

### TC-KIOSK-001: Load Descriptors
- **Input:** `GET /api/kiosk/descriptors` (no auth)
- **Expected:** 200, array of `{ userId, name, role, descriptor }` for all enrolled users

### TC-KIOSK-002: Record Attendance
- **Input:** `POST /api/kiosk/attendance` `{ userId: "<id>", confidence: 0.85 }`
- **Expected:** 201, attendance log created

### TC-KIOSK-003: Invalid User ID
- **Input:** `POST /api/kiosk/attendance` with non-existent userId
- **Expected:** 404

---

## Attendance Logs

### TC-LOG-001: Admin Gets All Logs
- **Input:** `GET /api/logs` with admin token
- **Expected:** 200, array of attendance logs

### TC-LOG-002: Student Gets Own Attendance
- **Input:** `GET /api/logs/my-attendance` with student token
- **Expected:** 200, only logs for this student

### TC-LOG-003: Attendance Summary
- **Input:** `GET /api/logs/summary` with admin token
- **Expected:** 200, aggregated stats by user

### TC-LOG-004: Logs By Date
- **Input:** `GET /api/logs/by-date?date=2024-01-15` with admin token
- **Expected:** 200, logs grouped by date

### TC-LOG-005: Delete Log
- **Input:** `DELETE /api/logs/:id` with admin token
- **Expected:** 200

### TC-LOG-006: Student Cannot Delete Log
- **Input:** `DELETE /api/logs/:id` with student token
- **Expected:** 403

---

## Login Logs

### TC-LOGINLOG-001: Get All Login Logs (Admin)
- **Input:** `GET /api/login-logs` with admin token
- **Expected:** 200, all login events

### TC-LOGINLOG-002: Get Own Login History
- **Input:** `GET /api/login-logs/me` with any authenticated user token
- **Expected:** 200, only own login events

### TC-LOGINLOG-003: Get Login Stats
- **Input:** `GET /api/login-logs/stats` with admin token
- **Expected:** 200, login count statistics

---

## Device Sync

### TC-SYNC-001: Sync Single Log
- **Input:** `POST /api/device-sync` `{ userId, timestamp, deviceId }`
- **Expected:** 201, log created

### TC-SYNC-002: Bulk Sync
- **Input:** `POST /api/device-sync/bulk` `{ logs: [ {...}, {...} ] }`
- **Expected:** 201, all logs created

---

## RBAC Enforcement

### TC-RBAC-001: Student Accesses Admin Route
- **Input:** `GET /api/users` with student token
- **Expected:** 403 `{ success: false, message: "Forbidden" }`

### TC-RBAC-002: No Token on Protected Route
- **Input:** `GET /api/auth/me` with no Authorization header
- **Expected:** 401 `{ success: false, message: "Not authorized" }`

### TC-RBAC-003: Expired Token
- **Input:** `GET /api/auth/me` with expired JWT
- **Expected:** 401

---

## Upload

### TC-UPLOAD-001: Upload Single Image
- **Input:** `POST /api/upload/image` `{ image: "<base64>" }`
- **Expected:** 200, file saved, URL returned

### TC-UPLOAD-002: Upload Face Image
- **Input:** `POST /api/upload/face` `{ image: "<base64>", userId: "<id>" }`
- **Expected:** 200, face image saved
