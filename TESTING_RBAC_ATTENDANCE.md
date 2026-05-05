# RBAC & Attendance — Test Cases

Role-Based Access Control and attendance-specific test cases.

---

## Roles

| Role | Can Do |
|---|---|
| `superadmin` | Full access — all users, all logs, all settings |
| `admin` | Manage own users, view own users' logs |
| `teacher` | View own attendance, log own attendance |
| `student` | View own attendance, log own attendance |

---

## RBAC Test Cases

### User Endpoints

| Test | Role | Endpoint | Expected |
|---|---|---|---|
| Superadmin lists all users | superadmin | GET /api/users | 200 — all users |
| Admin lists own users | admin | GET /api/users | 200 — only admin's users |
| Student lists users | student | GET /api/users | 403 Forbidden |
| Admin creates student | admin | POST /api/users | 201 |
| Admin creates another admin | admin | POST /api/users { role: "admin" } | 403 |
| Superadmin creates admin | superadmin | POST /api/users { role: "admin" } | 201 |
| Admin deletes own user | admin | DELETE /api/users/:id (own) | 200 |
| Admin deletes other admin's user | admin | DELETE /api/users/:id (other) | 403 |
| Superadmin deletes any user | superadmin | DELETE /api/users/:id | 200 |
| Student deletes user | student | DELETE /api/users/:id | 403 |

---

### Attendance Log Endpoints

| Test | Role | Endpoint | Expected |
|---|---|---|---|
| Admin views all logs | admin | GET /api/logs | 200 |
| Superadmin views all logs | superadmin | GET /api/logs | 200 |
| Student views own logs | student | GET /api/logs/my-attendance | 200 |
| Student views all logs | student | GET /api/logs | 403 |
| Student logs own attendance | student | POST /api/logs/log-attendance | 201 |
| Admin deletes log | admin | DELETE /api/logs/:id | 200 |
| Student deletes log | student | DELETE /api/logs/:id | 403 |
| Admin views summary | admin | GET /api/logs/summary | 200 |
| Student views summary | student | GET /api/logs/summary | 403 |

---

### Login Logs Endpoints

| Test | Role | Endpoint | Expected |
|---|---|---|---|
| Admin views all login logs | admin | GET /api/login-logs | 200 |
| Student views all login logs | student | GET /api/login-logs | 403 |
| Any role views own login history | any | GET /api/login-logs/me | 200 |
| Admin views login stats | admin | GET /api/login-logs/stats | 200 |
| Student views login stats | student | GET /api/login-logs/stats | 403 |

---

### Auth Endpoints

| Test | Role | Endpoint | Expected |
|---|---|---|---|
| Any authenticated user gets own profile | any | GET /api/auth/me | 200 |
| Unauthenticated gets profile | none | GET /api/auth/me | 401 |
| Admin enrolls face | admin | POST /api/auth/enroll-face | 200 |
| Student enrolls face via admin route | student | POST /api/auth/enroll-face | 403 |
| Any role logs out | any | POST /api/auth/logout | 200 |

---

### Kiosk Endpoints (Public)

| Test | Auth | Endpoint | Expected |
|---|---|---|---|
| Load descriptors without token | none | GET /api/kiosk/descriptors | 200 |
| Record attendance without token | none | POST /api/kiosk/attendance | 201 |

---

## Attendance-Specific Test Cases

### Duplicate Attendance Prevention

The system does **not** prevent multiple attendance logs per user per day by default. This is intentional (check-in/check-out support).

| Test | Expected |
|---|---|
| Same user scans twice in 1 hour | Two separate logs created |
| Device sends duplicate timestamp on sync | Deduplication logic in device sync controller |

---

### Confidence Threshold

| Test | Input | Expected |
|---|---|---|
| High-confidence match | distance = 0.3 | Match accepted, confidence = 0.7 |
| Borderline match | distance = 0.58 | Match accepted |
| Low-confidence match | distance = 0.65 | Match rejected, 404 |

---

### Device Sync RBAC

Device sync endpoints are **public** — they are designed for kiosk hardware that cannot authenticate.

| Test | Auth | Expected |
|---|---|---|
| Single sync without token | none | 201 |
| Bulk sync without token | none | 201 |

---

## Token and Session Tests

| Test | Expected |
|---|---|
| Login with valid credentials | 200, token returned |
| Login with wrong password | 401 |
| Login while already logged in | 409 |
| Login with forceLogin: true | 200, session reset |
| Session expires after 24 hours | Auto-cleared on next login attempt |
| JWT expires after 7 days | 401 on next request, requires re-login |
| Logout | 200, isLoggedIn = false |
| Request after logout with same token | 401 |
