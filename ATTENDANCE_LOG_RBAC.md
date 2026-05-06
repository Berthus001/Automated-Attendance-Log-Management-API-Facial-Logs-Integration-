# Attendance Log RBAC (Role-Based Access Control)

Access control rules for all attendance-related endpoints.

---

## Roles

| Role | Description |
|---|---|
| `superadmin` | Full system access |
| `admin` | Manages own created users; limited to their scope |
| `teacher` | Face-only login; views own attendance |
| `student` | Face-only login; views own attendance |

---

## Auth Middleware

```js
protect          // Verifies JWT, attaches req.user, checks isActive
allowRoles(...roles)  // RBAC check � also exported as `authorize`
```

---

## Attendance Log Endpoints � Access Rules

### `/api/logs`

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/api/logs/log-attendance` | Protected (all roles) | Self-service log |
| GET | `/api/logs/my-attendance` | Protected (all roles) | Own records only |
| GET | `/api/logs/summary` | Protected (admin, superadmin) | Aggregated stats |
| GET | `/api/logs/by-date` | Protected (admin, superadmin) | Grouped by date |
| GET | `/api/logs` | Protected (admin, superadmin) | All logs |
| GET | `/api/logs/:id` | Protected (admin, superadmin) | Single log |
| DELETE | `/api/logs/:id` | Protected (admin, superadmin) | Delete log |

### `/api/attendance`

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/attendance` | Protected (admin, superadmin) | Attendance records |

### `/api/kiosk`

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/kiosk/descriptors` | Public | Face descriptors for client-side match |
| POST | `/api/kiosk/attendance` | Public | Record after client-side match |

### `/api/face-login` (Legacy)

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/api/face-login` | Public | Face login + attendance log (Student model) |
| POST | `/api/face-login/verify` | Public | Verify only, no log |
| GET | `/api/face-login/stats/:studentId` | Public | Student stats |

---

## Superadmin Permissions

| Action | Allowed |
|---|---|
| View all logs across all users | Yes |
| View all login logs | Yes |
| Create admins | Yes |
| Delete any non-superadmin user | Yes |
| View superadmin-created users only | No � views all users |

---

## Admin Permissions

| Action | Allowed | Restriction |
|---|---|---|
| View logs | Yes | Only logs for users they created |
| Create users | Yes | Teachers and students only |
| Delete users | Yes | Only users they created |
| View login logs | Yes | Only for users they created |
| Create another admin | No | 403 � role escalation blocked |

---

## Teacher / Student Permissions

| Action | Allowed |
|---|---|
| View own attendance (`/api/logs/my-attendance`) | Yes |
| Log own attendance (`/api/logs/log-attendance`) | Yes |
| View other users' logs | No |
| Access admin dashboard | No |
| Create users | No |

---

## RBAC Enforcement in Code

```js
// Example � admin+ only
router.get('/', protect, allowRoles('admin', 'superadmin'), asyncHandler(getAttendanceLogs));

// Example � all authenticated users
router.get('/my-attendance', protect, asyncHandler(getMyAttendance));

// Example � public
router.get('/descriptors', asyncHandler(getKioskDescriptors));
```

---

## Session Conflict Rule

Regardless of role, if `isLoggedIn = true` and `lastLoginAt` is within the last **24 hours**, login is blocked with HTTP 409. Use `forceLogin: true` to override.
