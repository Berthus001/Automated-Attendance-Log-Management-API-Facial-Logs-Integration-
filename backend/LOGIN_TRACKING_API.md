# Login Tracking API Documentation

## Overview
The Login Tracking System automatically logs all successful admin/superadmin logins and provides endpoints to query login history with filtering capabilities.

## Automatic Login Logging
Every successful login automatically creates a `LoginLog` entry with:
- User ID
- User role
- Login timestamp
- IP address (optional)
- User agent (optional)

---

## API Endpoints

### 1. Get Login Logs (with filtering)
**GET** `/api/login-logs`

Get all login logs with optional filtering by role and date range.

**Authorization**: Bearer Token (Admin/SuperAdmin)

**Access Control**:
- **Admin**: Only sees logs of users they created
- **Superadmin**: Sees all login logs

**Query Parameters**:
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `role` | String | Filter by user role (student, teacher, admin, superadmin) | `?role=student` |
| `startDate` | Date | Filter from this date (ISO 8601) | `?startDate=2026-04-01` |
| `endDate` | Date | Filter to this date (ISO 8601) | `?endDate=2026-04-30` |
| `page` | Number | Page number for pagination (default: 1) | `?page=2` |
| `limit` | Number | Items per page (default: 50) | `?limit=100` |

**Example Requests**:
```bash
# Get all login logs
GET /api/login-logs
Authorization: Bearer <token>

# Filter by role
GET /api/login-logs?role=student
Authorization: Bearer <token>

# Filter by date range
GET /api/login-logs?startDate=2026-04-01&endDate=2026-04-30
Authorization: Bearer <token>

# Combined filters with pagination
GET /api/login-logs?role=teacher&startDate=2026-04-01&page=1&limit=20
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "count": 20,
  "total": 156,
  "page": 1,
  "pages": 8,
  "data": [
    {
      "_id": "663abc123def456...",
      "userId": {
        "_id": "663abc789...",
        "name": "John Doe",
        "email": "john@example.com",
        "department": "Computer Science"
      },
      "role": "student",
      "loginTime": "2026-04-30T10:30:45.123Z",
      "logoutTime": null,
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2026-04-30T10:30:45.123Z",
      "updatedAt": "2026-04-30T10:30:45.123Z"
    }
  ]
}
```

---

### 2. Get Login Statistics
**GET** `/api/login-logs/stats`

Get aggregated login statistics by role.

**Authorization**: Bearer Token (Admin/SuperAdmin)

**Access Control**:
- **Admin**: Only stats for users they created
- **Superadmin**: Stats for all users

**Example Request**:
```bash
GET /api/login-logs/stats
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalLogins": 1543,
    "loginsToday": 47,
    "byRole": [
      {
        "role": "student",
        "count": 1203,
        "lastLogin": "2026-04-30T14:25:30.000Z"
      },
      {
        "role": "teacher",
        "count": 284,
        "lastLogin": "2026-04-30T13:15:20.000Z"
      },
      {
        "role": "admin",
        "count": 56,
        "lastLogin": "2026-04-30T14:30:45.000Z"
      }
    ]
  }
}
```

---

### 3. Get My Login History
**GET** `/api/login-logs/me`

Get the current user's own login history.

**Authorization**: Bearer Token (Any authenticated user)

**Query Parameters**:
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | Number | Page number | 1 |
| `limit` | Number | Items per page | 20 |

**Example Request**:
```bash
GET /api/login-logs/me?page=1&limit=10
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "count": 10,
  "total": 45,
  "page": 1,
  "pages": 5,
  "data": [
    {
      "_id": "663abc123...",
      "userId": "663def456...",
      "role": "admin",
      "loginTime": "2026-04-30T09:00:00.000Z",
      "logoutTime": null,
      "ipAddress": "192.168.1.50",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2026-04-30T09:00:00.000Z",
      "updatedAt": "2026-04-30T09:00:00.000Z"
    }
  ]
}
```

---

## Database Schema

### LoginLog Model
```javascript
{
  userId: ObjectId,           // Reference to User
  role: String,               // user role (enum)
  loginTime: Date,            // Login timestamp
  logoutTime: Date,           // Optional logout timestamp
  ipAddress: String,          // Client IP address
  userAgent: String,          // Browser/client info
  createdAt: Date,            // Auto-generated
  updatedAt: Date             // Auto-generated
}
```

### Indexes
- `userId + loginTime` (compound index for efficient queries)
- `role + loginTime` (compound index for role-based filtering)
- `userId`, `role`, `loginTime` (individual indexes)

---

## Use Cases

### 1. View Recent Logins
```bash
# Get last 50 logins
GET /api/login-logs?limit=50
```

### 2. Audit Student Logins
```bash
# Get all student logins this month
GET /api/login-logs?role=student&startDate=2026-04-01&endDate=2026-04-30
```

### 3. Track Teacher Activity
```bash
# Get teacher logins this week
GET /api/login-logs?role=teacher&startDate=2026-04-24
```

### 4. Security Audit
```bash
# Check your own login history
GET /api/login-logs/me
```

### 5. Dashboard Statistics
```bash
# Get overview statistics
GET /api/login-logs/stats
```

---

## Error Responses

### Invalid Role
```json
{
  "success": false,
  "message": "Invalid role. Must be one of: superadmin, admin, teacher, student"
}
```

### Invalid Date Format
```json
{
  "success": false,
  "message": "Invalid startDate format. Use ISO 8601 format (e.g., 2026-04-30)"
}
```

### Access Denied
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions"
}
```

---

## Security Features

✅ **Automatic logging** - No manual intervention required  
✅ **Ownership filtering** - Admins only see logs of their users  
✅ **Role-based access** - Superadmin has full visibility  
✅ **IP tracking** - Security audit trail  
✅ **Pagination** - Efficient data handling  
✅ **Date filtering** - Flexible querying  
✅ **Protected endpoints** - JWT authentication required  

---

## Integration Notes

1. **Login tracking is automatic** - No changes needed to login flow
2. **Existing logs route** (`/api/logs`) is for attendance logs
3. **New logs route** (`/api/login-logs`) is for login tracking
4. **Backward compatible** - Does not affect existing functionality
