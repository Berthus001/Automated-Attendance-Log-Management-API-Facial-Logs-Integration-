# Session Management

The system enforces single-active-session per user and automatically clears stale sessions.

---

## Session Settings

| Setting | Value |
|---|---|
| JWT token expiry | 7 days (set via `JWT_EXPIRE` env var) |
| Session timeout (stale session threshold) | **24 hours** |
| Multi-session allowed | No — blocked with HTTP 409 |
| Force override | `forceLogin: true` in request body |

---

## Session Lifecycle

### Login

```
POST /api/auth/login  { email, password }
```

Login logic:

```
1. Find user by email
2. Check isActive = true
3. Verify password (bcrypt compare)
4. Check isLoggedIn flag:
   a. isLoggedIn = false ? proceed
   b. isLoggedIn = true + lastLoginAt < 24h ? 409 "User already logged in"
   c. isLoggedIn = true + lastLoginAt > 24h ? stale session, auto-clear, proceed
5. Set isLoggedIn = true, lastLoginAt = now
6. Create LoginLog entry
7. Issue JWT
```

### Logout

```
POST /api/auth/logout
Authorization: Bearer <token>
```

```
1. Decode JWT ? get userId
2. Set isLoggedIn = false on User document
3. Update LoginLog entry: set logoutTime = now
4. Return 200
```

---

## Handling "Already Logged In"

If a user is already logged in and tries to log in again within 24 hours:

**Response (409):**
```json
{
  "success": false,
  "message": "User already logged in from another session",
  "code": "SESSION_CONFLICT"
}
```

### Option 1: Force Login

To override the existing session, include `forceLogin: true`:

```json
{
  "email": "admin@example.com",
  "password": "SecurePass123",
  "forceLogin": true
}
```

This immediately terminates the existing session and starts a new one.

### Option 2: Wait for Auto-Expiry

Sessions older than 24 hours are automatically cleared on the next login attempt. No action required.

---

## Multi-Device Behaviour

| Scenario | Behaviour |
|---|---|
| Login from same device | Blocked — 409 if within 24h |
| Login from new device | Blocked — 409 if within 24h |
| forceLogin from any device | Clears previous session, allows new login |

---

## Frontend Session Handling

The frontend stores auth state in `localStorage`:

| Key | Description |
|---|---|
| `token` | JWT bearer token — sent with every API request |
| `user` | JSON string with `id`, `name`, `email`, `role`, `hasFaceEnrolled` |
| `pendingFace2FA` | Set to `"true"` after password login; cleared after `/api/auth/face-verify` |

### Token Expiry

When the token expires (7 days), all protected API calls return 401. The frontend should catch this and redirect to `/admin-login`, clearing localStorage.

---

## isLoggedIn Flag

The `isLoggedIn` flag on the `User` model tracks active sessions.

| Event | isLoggedIn |
|---|---|
| Successful login | `true` |
| Successful logout | `false` |
| forceLogin override | `false` (old) ? `true` (new) |
| Token expired | Not automatically cleared — cleared on next login attempt |

---

## LoginLog Integration

Every login and logout is recorded in `LoginLog`:

```json
{
  "userId": "60d5ec49f1b2c72b8c8e4f3a",
  "role": "admin",
  "loginTime": "2026-05-05T08:00:00.000Z",
  "logoutTime": "2026-05-05T16:30:00.000Z",
  "ipAddress": "192.168.1.10",
  "userAgent": "Mozilla/5.0..."
}
```

---

## Error Reference

| Code | Message | Cause |
|---|---|---|
| 409 | `User already logged in from another session` | Active session within 24h |
| 401 | `Not authorized to access this route` | JWT invalid/expired/missing |
| 403 | `Account is deactivated` | `isActive = false` |
