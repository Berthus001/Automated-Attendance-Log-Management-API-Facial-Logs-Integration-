# Session Management & Multi-Login Prevention

## Overview
The authentication system now prevents multiple simultaneous logins for all user roles and includes a logout feature to properly end sessions.

## Features

✅ **Multi-Session Prevention**: Users cannot log in from multiple devices/browsers simultaneously  
✅ **Automatic Session Timeout**: Stale sessions (>1 hour) are automatically cleared  
✅ **Logout Functionality**: Users can explicitly end their session  
✅ **All Roles Supported**: Works for superadmin, admin, teacher, and student  
✅ **Login Log Integration**: Logout times are recorded in login logs  
✅ **Error Handling**: Proper HTTP status codes and user-friendly messages  

---

## Database Changes

### User Model Updates

Two new fields added to the User schema:

```javascript
{
  isLoggedIn: {
    type: Boolean,
    default: false,
  },
  lastLoginAt: {
    type: Date,
    default: null,
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `isLoggedIn` | Boolean | Tracks if user is currently logged in |
| `lastLoginAt` | Date | Timestamp of last successful login |

---

## Authentication Flow

### 1. Login Process (POST /api/auth/login)

For **Admin** and **SuperAdmin** users (email + password):

```
1. Validate credentials (email, password)
2. Check if user is already logged in (isLoggedIn = true)
   ├─ If yes: Check if lastLoginAt is older than 1 hour
   │  ├─ If stale (>1 hour): Reset isLoggedIn = false, allow login
   │  └─ If active (<1 hour): Return 409 error "User already logged in"
   └─ If no: Proceed with login
3. Set isLoggedIn = true
4. Set lastLoginAt = current timestamp
5. Save user
6. Generate JWT token
7. Create LoginLog entry
8. Return token and user info
```

**Example Request**:
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "663abc123...",
    "name": "John Admin",
    "email": "admin@example.com",
    "role": "admin",
    "hasFaceEnrolled": true
  }
}
```

**Error Response - Already Logged In (409)**:
```json
{
  "success": false,
  "message": "User already logged in from another session"
}
```

---

### 2. Face Login Process (POST /api/auth/face-login)

For **Student** and **Teacher** users (face recognition):

```
1. Extract face descriptor from image
2. Find matching user from database
3. Check if user is already logged in (isLoggedIn = true)
   ├─ If yes: Check if lastLoginAt is older than 1 hour
   │  ├─ If stale (>1 hour): Reset isLoggedIn = false, allow login
   │  └─ If active (<1 hour): Return 409 error "User already logged in"
   └─ If no: Proceed with login
4. Set isLoggedIn = true
5. Set lastLoginAt = current timestamp
6. Save user
7. Generate JWT token
8. Create LoginLog entry
9. Return token and user info
```

**Example Request**:
```bash
POST /api/auth/face-login
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Face login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "663def456...",
    "name": "Jane Student",
    "email": "jane@example.com",
    "role": "student"
  },
  "confidence": {
    "distance": 0.35,
    "threshold": 0.6
  }
}
```

**Error Response - Already Logged In (409)**:
```json
{
  "success": false,
  "message": "User already logged in from another session"
}
```

---

### 3. Logout Process (POST /api/auth/logout)

Available for **all authenticated users**:

```
1. Authenticate user via JWT token (protect middleware)
2. Find user by ID
3. Set isLoggedIn = false
4. Save user
5. Update LoginLog with logoutTime
6. Return success message
```

**Example Request**:
```bash
POST /api/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Error Response - User Not Found (404)**:
```json
{
  "success": false,
  "message": "User not found"
}
```

**Error Response - Unauthorized (401)**:
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

---

## Session Timeout Logic

### Stale Session Detection

A session is considered **stale** if:
- `lastLoginAt` is older than **1 hour** (3600000 milliseconds)

### Automatic Cleanup

When a user attempts to login:
1. System checks `isLoggedIn` flag
2. If `true`, compares `lastLoginAt` with current time
3. If difference > 1 hour:
   - Automatically resets `isLoggedIn = false`
   - Allows new login to proceed
4. If difference ≤ 1 hour:
   - Rejects login with 409 error

### Configuration

The session timeout is defined in the controller:

```javascript
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds
```

To modify the timeout, change this constant in:
- [authController.js](backend/controllers/authController.js#L53) (line 53 for login)
- [authController.js](backend/controllers/authController.js#L383) (line 383 for faceLogin)

**Common timeout values**:
- 30 minutes: `30 * 60 * 1000`
- 1 hour: `60 * 60 * 1000` (default)
- 2 hours: `2 * 60 * 60 * 1000`
- 24 hours: `24 * 60 * 60 * 1000`

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Scenario |
|------|---------|----------|
| 200 | Success | Login/logout successful |
| 401 | Unauthorized | Invalid credentials or missing token |
| 403 | Forbidden | Account deactivated or role not allowed |
| 404 | Not Found | User does not exist |
| 409 | Conflict | **User already logged in from another session** |
| 500 | Server Error | Database or internal server error |

### Critical Error Code: 409 Conflict

The **409 status code** is specifically used for the multi-login prevention feature:

```json
{
  "success": false,
  "message": "User already logged in from another session"
}
```

**When to expect 409**:
- User A logs in on Device 1 ✅
- User A tries to log in on Device 2 (within 1 hour) ❌ 409 Error
- User A must logout on Device 1 or wait >1 hour

---

## Security Features

### 1. Token-Based Authentication
- JWT tokens required for logout endpoint
- Token expiration independent of session state
- Tokens contain user ID, email, and role

### 2. Session State Tracking
- `isLoggedIn` flag prevents concurrent sessions
- `lastLoginAt` enables automatic timeout
- Login logs track all authentication events

### 3. Fail-Safe Mechanisms
- Login succeeds even if LoginLog creation fails
- Logout succeeds even if log update fails
- Database errors don't block authentication

### 4. Role-Based Access
- **Admin/SuperAdmin**: Email + password login
- **Teacher/Student**: Face recognition login
- **All roles**: Can logout

---

## Use Cases

### Scenario 1: Normal Login/Logout Flow

```
1. User logs in on Laptop ✅
   - isLoggedIn = true
   - lastLoginAt = 10:00 AM

2. User works for 30 minutes

3. User logs out ✅
   - isLoggedIn = false
   - LoginLog updated with logoutTime

4. User can login again immediately ✅
```

### Scenario 2: Attempted Multi-Login (Rejected)

```
1. Student logs in via face on Device A ✅
   - isLoggedIn = true
   - lastLoginAt = 10:00 AM

2. Student tries to login on Device B at 10:15 AM ❌
   - Response: 409 "User already logged in from another session"

3. Student must logout from Device A first
```

### Scenario 3: Stale Session Cleanup

```
1. Admin logs in at 9:00 AM ✅
   - isLoggedIn = true
   - lastLoginAt = 9:00 AM

2. Admin closes browser without logout (forgot to logout)

3. Admin tries to login again at 11:00 AM ✅
   - Session is stale (>1 hour old)
   - System auto-resets isLoggedIn = false
   - Login proceeds successfully
```

### Scenario 4: Force Logout by SuperAdmin (Future Enhancement)

*Not currently implemented, but schema supports it:*

```
SuperAdmin can manually set any user's isLoggedIn = false
to force logout from all sessions
```

---

## Frontend Integration

### Login Implementation

```javascript
// Admin/SuperAdmin Login
async function adminLogin(email, password) {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.status === 409) {
      // Handle already logged in error
      alert('You are already logged in from another device. Please logout first.');
      return;
    }

    if (data.success) {
      localStorage.setItem('token', data.token);
      // Redirect to dashboard
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
}

// Student/Teacher Face Login
async function faceLogin(imageBase64) {
  try {
    const response = await fetch('http://localhost:5000/api/auth/face-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64 })
    });

    const data = await response.json();

    if (response.status === 409) {
      alert('You are already logged in from another device. Please logout first.');
      return;
    }

    if (data.success) {
      localStorage.setItem('token', data.token);
      // Redirect to dashboard
    }
  } catch (error) {
    console.error('Face login failed:', error);
  }
}
```

### Logout Implementation

```javascript
async function logout() {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch('http://localhost:5000/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (data.success) {
      localStorage.removeItem('token');
      // Redirect to login page
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Logout failed:', error);
  }
}
```

### React Hook Example

```javascript
import { useState } from 'react';

function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.status === 409) {
        setError('Already logged in from another device');
        return { success: false };
      }

      if (data.success) {
        localStorage.setItem('token', data.token);
        return { success: true, user: data.user };
      } else {
        setError(data.message);
        return { success: false };
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const token = localStorage.getItem('token');
    
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
      // Still clear local token even if request fails
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  };

  return { login, logout, isLoading, error };
}
```

---

## Testing

### Test Case 1: Prevent Duplicate Login

```bash
# Step 1: Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Expected: 200 OK, returns token

# Step 2: Try to login again (same user)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Expected: 409 Conflict, "User already logged in from another session"
```

### Test Case 2: Successful Logout

```bash
# Step 1: Login
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}' \
  | jq -r '.token')

# Step 2: Logout
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK, "Logout successful"

# Step 3: Login again immediately
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Expected: 200 OK (login succeeds after logout)
```

### Test Case 3: Stale Session Override

```bash
# Step 1: Manually set lastLoginAt to 2 hours ago in MongoDB
db.users.updateOne(
  { email: "admin@example.com" },
  { 
    $set: { 
      isLoggedIn: true,
      lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    }
  }
)

# Step 2: Try to login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Expected: 200 OK (stale session auto-cleared)
```

---

## Database Queries

### Check User Login Status

```javascript
// Find all currently logged-in users
db.users.find({ isLoggedIn: true })

// Find users with stale sessions (>1 hour old)
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
db.users.find({
  isLoggedIn: true,
  lastLoginAt: { $lt: oneHourAgo }
})
```

### Manual Session Reset

```javascript
// Force logout a specific user
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { isLoggedIn: false } }
)

// Force logout all users (emergency)
db.users.updateMany(
  { isLoggedIn: true },
  { $set: { isLoggedIn: false } }
)
```

### Session Analytics

```javascript
// Count active sessions
db.users.countDocuments({ isLoggedIn: true })

// Active sessions by role
db.users.aggregate([
  { $match: { isLoggedIn: true } },
  { $group: { _id: "$role", count: { $sum: 1 } } }
])

// Recent logins (last hour)
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
db.users.find({
  lastLoginAt: { $gte: oneHourAgo }
}).sort({ lastLoginAt: -1 })
```

---

## Troubleshooting

### Issue: User can't login (409 error) but they're sure they logged out

**Possible Causes**:
1. Logout request failed silently
2. Browser closed without logout
3. Database update didn't complete

**Solution**:
```javascript
// Check user's current state
db.users.findOne({ email: "user@example.com" })

// If isLoggedIn is true, manually reset:
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { isLoggedIn: false } }
)
```

### Issue: Session timeout not working

**Diagnosis**:
```javascript
// Check lastLoginAt timestamp
db.users.findOne({ email: "user@example.com" }, { lastLoginAt: 1 })

// Verify server timezone matches database timezone
console.log(new Date()); // Server time
```

**Solution**: Ensure server and database use consistent timezone (UTC recommended)

### Issue: Multiple users logged in with same account

**Prevention**: This should not be possible with the current implementation

**Investigation**:
```javascript
// Check if user has multiple active sessions
db.loginlogs.find({
  userId: ObjectId("..."),
  logoutTime: null
}).sort({ loginTime: -1 })
```

---

## Migration Notes

### For Existing Users

All existing users will have:
- `isLoggedIn: false` (default)
- `lastLoginAt: null` (default)

No migration script needed - defaults handle existing users automatically.

### Database Schema Version

Before:
```javascript
{
  name: String,
  email: String,
  password: String,
  role: String,
  isActive: Boolean
}
```

After:
```javascript
{
  name: String,
  email: String,
  password: String,
  role: String,
  isActive: Boolean,
  isLoggedIn: Boolean,      // NEW
  lastLoginAt: Date         // NEW
}
```

---

## Future Enhancements

### Potential Features

1. **Multi-Device Management**
   - Allow specific number of concurrent sessions (e.g., 2 devices)
   - Track device fingerprints
   - View/revoke active sessions

2. **Admin Session Control**
   - SuperAdmin can force logout any user
   - View all active sessions in dashboard
   - Set custom timeout per user/role

3. **Session Analytics**
   - Average session duration
   - Peak usage times
   - Device/browser statistics

4. **Advanced Security**
   - IP-based session validation
   - Anomaly detection (unusual login locations)
   - Two-factor authentication integration

---

## API Reference Summary

| Endpoint | Method | Auth | Description | Status Codes |
|----------|--------|------|-------------|--------------|
| `/api/auth/login` | POST | Public | Admin/SuperAdmin login | 200, 401, 403, 409, 500 |
| `/api/auth/face-login` | POST | Public | Student/Teacher face login | 200, 401, 403, 409, 500 |
| `/api/auth/logout` | POST | Private | Logout current user | 200, 401, 404, 500 |
| `/api/auth/me` | GET | Private | Get current user info | 200, 401, 500 |

---

## Configuration

### Environment Variables

No new environment variables required. Existing JWT configuration still applies:

```env
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
```

### Session Timeout Configuration

Edit [authController.js](backend/controllers/authController.js):

```javascript
// Line 53 and 383
const SESSION_TIMEOUT = 60 * 60 * 1000; // Change this value
```

---

## Support

For issues or questions:
- Check troubleshooting section above
- Review login logs: `GET /api/login-logs/me`
- Verify database state using MongoDB queries
- Contact system administrator for manual session reset

---

## Changelog

### Version 1.0 (April 30, 2026)
- ✅ Added `isLoggedIn` and `lastLoginAt` fields to User model
- ✅ Implemented multi-session prevention (409 error)
- ✅ Added 1-hour stale session timeout
- ✅ Created `POST /api/auth/logout` endpoint
- ✅ Updated both login methods (email+password and face recognition)
- ✅ Integrated logout time tracking in LoginLog
- ✅ Applied to all roles: superadmin, admin, teacher, student
- ✅ Comprehensive error handling and security features
