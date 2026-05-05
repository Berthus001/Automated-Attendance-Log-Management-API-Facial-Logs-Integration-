# 👥 Role-Based Attendance Log Management System

## 📋 Overview

This system implements a hierarchical role-based access control for attendance logging with three distinct user levels:

- **👑 SuperAdmin**: Full system access - see ALL users and attendance
- **🛠️ Admin**: Scoped access - see ONLY users they created
- **👨‍🎓 Student / 👨‍🏫 Teacher**: Self-service - log their own attendance only

---

## 🎯 Access Control Matrix

| Feature | SuperAdmin | Admin | Student/Teacher |
|---------|------------|-------|-----------------|
| **View ALL attendance logs** | ✅ YES | ❌ NO | ❌ NO |
| **View created users' attendance** | ✅ YES | ✅ YES | ❌ NO |
| **Log own attendance** | ✅ YES | ✅ YES | ✅ YES |
| **View own attendance history** | ✅ YES | ✅ YES | ✅ YES |
| **Delete attendance logs** | ✅ YES | ✅ YES | ❌ NO |
| **View statistics** | ✅ YES | ✅ YES (own users only) | ❌ NO |

---

## 🔧 Updated Database Schema

### AttendanceLog Model

```javascript
{
  userId: ObjectId,              // Universal user reference (NEW)
  userRole: String,              // 'student', 'teacher', 'admin' (NEW)
  studentId: String,             // Legacy field (backward compatibility)
  course: String,
  timestamp: Date,
  imagePath: String,
  deviceId: String,
  status: String,                // 'present', 'late', 'absent'
  confidenceScore: Number,
  location: Object,
  createdBy: ObjectId,           // Who created this user (NEW - for admin filtering)
  timestamps: { createdAt, updatedAt }
}
```

**Key Changes:**
- ✅ Added `userId` - universal reference to User model
- ✅ Added `userRole` - for quick role-based filtering
- ✅ Added `createdBy` - tracks who created the user (enables admin filtering)
- ✅ Kept `studentId` for backward compatibility

---

## 📡 API Endpoints

### Base URL: `/api/logs`

---

## 🔐 Admin/SuperAdmin Endpoints

### 1. Get All Attendance Logs (Filtered by Role)

```http
GET /api/logs
Authorization: Bearer <token>
```

**Access:** SuperAdmin, Admin

**Query Parameters:**
```
userId         - Filter by specific user ID
userRole       - Filter by role: student, teacher, admin
studentId      - Filter by legacy student ID
course         - Filter by course name
status         - Filter by status: present, late, absent
deviceId       - Filter by device ID
startDate      - Filter from date (YYYY-MM-DD)
endDate        - Filter to date (YYYY-MM-DD)
page           - Page number (default: 1)
limit          - Items per page (default: 20)
```

**Response:**
```json
{
  "success": true,
  "count": 15,
  "total": 150,
  "page": 1,
  "totalPages": 8,
  "hasNextPage": true,
  "hasPrevPage": false,
  "data": [
    {
      "_id": "667a1b2c3d4e5f6789012345",
      "userId": {
        "_id": "667a1b2c3d4e5f6789012340",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "student",
        "department": "Computer Science"
      },
      "userRole": "student",
      "course": "CS101",
      "timestamp": "2026-05-04T08:30:00.000Z",
      "status": "present",
      "confidenceScore": 0.95,
      "createdBy": {
        "_id": "667a1b2c3d4e5f6789012341",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "createdAt": "2026-05-04T08:30:00.000Z"
    }
  ]
}
```

**Behavior:**
- **SuperAdmin**: Returns ALL attendance logs in the system
- **Admin**: Returns ONLY logs for users they created (filtered by `createdBy`)

---

### 2. Get Attendance Statistics

```http
GET /api/logs/summary
Authorization: Bearer <token>
```

**Access:** SuperAdmin, Admin

**Query Parameters:**
```
startDate  - Start date (YYYY-MM-DD)
endDate    - End date (YYYY-MM-DD)
course     - Filter by course
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLogs": 1250,
    "uniqueUsers": 85,
    "statusBreakdown": {
      "present": 1100,
      "late": 120,
      "absent": 30
    },
    "roleBreakdown": [
      { "_id": "student", "count": 1000 },
      { "_id": "teacher", "count": 200 },
      { "_id": "admin", "count": 50 }
    ],
    "courseBreakdown": [
      { "_id": "CS101", "count": 300 },
      { "_id": "MATH201", "count": 250 }
    ],
    "dateRange": {
      "startDate": "2026-04-01",
      "endDate": "2026-05-04"
    }
  }
}
```

---

### 3. Get Logs by Date

```http
GET /api/logs/by-date
Authorization: Bearer <token>
```

**Access:** SuperAdmin, Admin

**Response:**
```json
{
  "success": true,
  "count": 30,
  "data": [
    {
      "date": "2026-05-04",
      "count": 125,
      "uniqueStudents": 85
    },
    {
      "date": "2026-05-03",
      "count": 120,
      "uniqueStudents": 82
    }
  ]
}
```

---

### 4. Get Single Attendance Log

```http
GET /api/logs/:id
Authorization: Bearer <token>
```

**Access:** SuperAdmin, Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "667a1b2c3d4e5f6789012345",
    "userId": "667a1b2c3d4e5f6789012340",
    "userRole": "student",
    "course": "CS101",
    "timestamp": "2026-05-04T08:30:00.000Z",
    "status": "present"
  }
}
```

---

### 5. Delete Attendance Log

```http
DELETE /api/logs/:id
Authorization: Bearer <token>
```

**Access:** SuperAdmin, Admin

**Response:**
```json
{
  "success": true,
  "message": "Attendance log deleted successfully",
  "data": { /* deleted log */ }
}
```

---

## 👤 User Self-Service Endpoints

### 6. Log My Attendance (Student/Teacher)

```http
POST /api/logs/log-attendance
Authorization: Bearer <token>
Content-Type: application/json
```

**Access:** ALL authenticated users (student, teacher, admin, superadmin)

**Request Body:**
```json
{
  "course": "CS101",
  "status": "present",
  "deviceId": "device-123",
  "imagePath": "/uploads/attendance/image.jpg",
  "confidenceScore": 0.95,
  "location": {
    "type": "Point",
    "coordinates": [121.0244, 14.5547]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance logged successfully",
  "data": {
    "_id": "667a1b2c3d4e5f6789012345",
    "userId": {
      "_id": "667a1b2c3d4e5f6789012340",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "department": "Computer Science"
    },
    "userRole": "student",
    "course": "CS101",
    "timestamp": "2026-05-04T08:30:00.000Z",
    "status": "present",
    "confidenceScore": 0.95
  }
}
```

**Features:**
- ✅ Automatically uses logged-in user's ID
- ✅ Prevents duplicate logging within 1 minute
- ✅ Tracks `createdBy` for admin filtering
- ✅ Supports all user roles (student, teacher, admin)

**Error (Duplicate):**
```json
{
  "success": false,
  "message": "Attendance already logged within the last minute",
  "existingLog": { /* existing log details */ }
}
```

---

### 7. Get My Attendance History

```http
GET /api/logs/my-attendance
Authorization: Bearer <token>
```

**Access:** ALL authenticated users

**Query Parameters:**
```
startDate  - Start date (YYYY-MM-DD)
endDate    - End date (YYYY-MM-DD)
page       - Page number (default: 1)
limit      - Items per page (default: 20)
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 45,
  "page": 1,
  "totalPages": 5,
  "hasNextPage": true,
  "hasPrevPage": false,
  "data": [
    {
      "_id": "667a1b2c3d4e5f6789012345",
      "userId": {
        "name": "John Doe",
        "email": "john@example.com",
        "role": "student"
      },
      "course": "CS101",
      "timestamp": "2026-05-04T08:30:00.000Z",
      "status": "present"
    }
  ]
}
```

**Features:**
- ✅ Only shows the authenticated user's own attendance
- ✅ Cannot view other users' attendance
- ✅ Supports date filtering and pagination

---

## 🔒 Authentication

All endpoints require JWT authentication via Bearer token:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Getting a Token

Login via `/api/auth/login`:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "667a1b2c3d4e5f6789012340",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "student"
  }
}
```

---

## 🧪 Testing Examples

### Example 1: SuperAdmin Views All Attendance

```bash
curl -X GET "http://localhost:5000/api/logs?page=1&limit=20" \
  -H "Authorization: Bearer <superadmin-token>"
```

**Result:** Returns ALL attendance logs from all users

---

### Example 2: Admin Views Their Users' Attendance

```bash
curl -X GET "http://localhost:5000/api/logs?userRole=student" \
  -H "Authorization: Bearer <admin-token>"
```

**Result:** Returns ONLY attendance for students created by this admin

---

### Example 3: Student Logs Attendance

```bash
curl -X POST "http://localhost:5000/api/logs/log-attendance" \
  -H "Authorization: Bearer <student-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "course": "CS101",
    "status": "present"
  }'
```

**Result:** Creates attendance log for the authenticated student

---

### Example 4: Student Views Own Attendance

```bash
curl -X GET "http://localhost:5000/api/logs/my-attendance?startDate=2026-05-01" \
  -H "Authorization: Bearer <student-token>"
```

**Result:** Returns ONLY the student's own attendance history

---

### Example 5: Teacher Logs Attendance

```bash
curl -X POST "http://localhost:5000/api/logs/log-attendance" \
  -H "Authorization: Bearer <teacher-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "course": "MATH201",
    "status": "present"
  }'
```

**Result:** Creates attendance log for the authenticated teacher

---

## 🚨 Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Required role(s): superadmin, admin"
}
```

### 409 Conflict (Duplicate Attendance)
```json
{
  "success": false,
  "message": "Attendance already logged within the last minute",
  "existingLog": { /* log details */ }
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Attendance log not found"
}
```

---

## 📊 Data Flow Examples

### Scenario 1: Admin Creates Students

```
1. SuperAdmin creates Admin A (email: admin-a@example.com)
2. Admin A logs in and creates:
   - Student 1 (email: student1@example.com)
   - Student 2 (email: student2@example.com)
   - Teacher 1 (email: teacher1@example.com)

Result: User documents have createdBy: <Admin A's ID>
```

### Scenario 2: Students Log Attendance

```
3. Student 1 logs attendance:
   POST /api/logs/log-attendance
   {
     "course": "CS101",
     "status": "present"
   }

Result: AttendanceLog created with:
   - userId: <Student 1's ID>
   - userRole: "student"
   - createdBy: <Admin A's ID> (inherited from user)
```

### Scenario 3: Admin Views Attendance

```
4. Admin A requests attendance logs:
   GET /api/logs

System automatically filters to show ONLY:
   - Student 1's attendance
   - Student 2's attendance
   - Teacher 1's attendance

Admin A CANNOT see:
   - Other admins' students' attendance
```

### Scenario 4: SuperAdmin Views Everything

```
5. SuperAdmin requests attendance logs:
   GET /api/logs

Result: Returns ALL attendance logs from ALL users
```

---

## 🔄 Migration from Old System

If you have existing attendance data with only `studentId`:

1. **Data is preserved**: Legacy `studentId` field still exists
2. **New logs use `userId`**: All new logs track by universal userId
3. **Both work**: System supports both old and new format
4. **Gradual migration**: Update old logs to include userId/userRole as needed

---

## 🎯 Best Practices

### For Students/Teachers:
✅ Use `/api/logs/log-attendance` to check in  
✅ Use `/api/logs/my-attendance` to view your history  
❌ Don't try to access admin endpoints (will get 403 Forbidden)

### For Admins:
✅ Use `/api/logs` to view all your users' attendance  
✅ Use `/api/logs/summary` for statistics  
✅ Filter by `userRole` to see specific user types  
❌ You cannot see other admins' users

### For SuperAdmins:
✅ Full access to all endpoints  
✅ View system-wide statistics  
✅ Manage all users and attendance  

---

## 🔗 Related Documentation

- [User Management API](./USER_MANAGEMENT_API.md)
- [Login Logs API](./LOGIN_TRACKING_API.md)
- [Authentication Flow](./AUTHENTICATION_FLOW.md)
- [Face Recognition API](./FACE_RECOGNITION_API.md)

---

## 💡 Summary

**Key Benefits:**
- ✅ **Secure**: Role-based access control at every layer
- ✅ **Scalable**: Multiple admins can manage separate user groups
- ✅ **Privacy**: Admins cannot access each other's data
- ✅ **Simple**: Students/teachers just log attendance, no complexity
- ✅ **Tracked**: Every log includes who created the user (accountability)
- ✅ **Flexible**: Supports all user types (student, teacher, admin)

**Access Summary:**
- 👑 **SuperAdmin** → See EVERYTHING
- 🛠️ **Admin** → See ONLY their users
- 👨‍🎓 **Student/Teacher** → Log attendance + see own history

---

**Last Updated:** May 4, 2026  
**API Version:** 2.0  
**Base URL:** `http://localhost:5000/api` (development)
