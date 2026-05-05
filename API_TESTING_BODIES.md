# API Testing Request & Response Bodies

Complete reference for all API endpoints with full request bodies, headers, query parameters, and response examples.

---

## How to Get Your Token

Call `POST /api/auth/login` first. Copy the `token` value from the response and replace `<YOUR_JWT_TOKEN>` in every protected endpoint below.

**Token header format:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

**Token expiry:** 7 days  
**Base URL (Local):** `http://localhost:5000`  
**Base URL (Production):** `https://your-api.onrender.com`

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [User Management](#2-user-management)
3. [Enrollment (Legacy Student Model)](#3-enrollment-legacy-student-model)
4. [Face Login (Legacy)](#4-face-login-legacy)
5. [Attendance Logs](#5-attendance-logs)
6. [Login Logs](#6-login-logs)
7. [Kiosk](#7-kiosk)
8. [Device Sync](#8-device-sync)
9. [Upload](#9-upload)
10. [Attendance (Admin View)](#10-attendance-admin-view)

---

## 1. Authentication

---

### 1.1 Admin / SuperAdmin Login

**`POST /api/auth/login`** — Public

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "superadmin@school.com",
  "password": "SuperAdmin123!"
}
```

> Optional: add `"forceLogin": true` to override an existing active session.

```json
{
  "email": "superadmin@school.com",
  "password": "SuperAdmin123!",
  "forceLogin": true
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MWY3YmNmODZjZDc5OTQzOTAxMSIsImVtYWlsIjoic3VwZXJhZG1pbkBzY2hvb2wuY29tIiwicm9sZSI6InN1cGVyYWRtaW4iLCJpYXQiOjE3NDY0NjI5NTAsImV4cCI6MTc0NzA2Nzc1MH0.SAMPLE_SIGNATURE",
  "user": {
    "id": "681f7bcf86cd799439011",
    "name": "Super Admin",
    "email": "superadmin@school.com",
    "role": "superadmin",
    "hasFaceEnrolled": true
  }
}
```

**Response 409 Conflict (already logged in):**
```json
{
  "success": false,
  "message": "User already logged in from another session"
}
```

**Response 403 Forbidden (students/teachers cannot use this endpoint):**
```json
{
  "success": false,
  "message": "Access denied. This login is for administrators only"
}
```

---

### 1.2 Face Login (Students & Teachers)

**`POST /api/auth/face-login`** — Public

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "deviceId": "kiosk-01",
  "location": "Main Entrance"
}
```

> `deviceId` and `location` are optional. `image` must be a valid base64-encoded JPEG/PNG.

**Response 200 OK (first login, attendance recorded):**
```json
{
  "success": true,
  "message": "Face login successful. Attendance recorded.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "681f7bcf86cd799439012",
    "name": "Juan dela Cruz",
    "email": "juan@school.com",
    "role": "student"
  },
  "attendance": {
    "id": "681f7bcf86cd799439013",
    "timestamp": "2026-05-05T08:30:15.000Z",
    "status": "present",
    "alreadyLogged": false
  },
  "confidence": {
    "distance": 0.32,
    "threshold": 0.6
  }
}
```

**Response 200 OK (already logged today):**
```json
{
  "success": true,
  "message": "Face recognized. You have already logged attendance today.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "681f7bcf86cd799439012",
    "name": "Juan dela Cruz",
    "email": "juan@school.com",
    "role": "student"
  },
  "attendance": {
    "id": "681f7bcf86cd799439013",
    "timestamp": "2026-05-05T08:30:15.000Z",
    "status": "present",
    "alreadyLogged": true
  },
  "confidence": {
    "distance": 0.32,
    "threshold": 0.6
  }
}
```

**Response 401 Unauthorized (face not recognized):**
```json
{
  "success": false,
  "message": "Face not recognized. No matching user found.",
  "confidence": {
    "distance": 0.75,
    "threshold": 0.6
  }
}
```

---

### 1.3 Get Current User Profile

**`GET /api/auth/me`** — 🔒 Requires Token

**Headers:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

**Request Body:** None

**Response 200 OK:**
```json
{
  "success": true,
  "user": {
    "id": "681f7bcf86cd799439011",
    "name": "Super Admin",
    "email": "superadmin@school.com",
    "role": "superadmin",
    "isActive": true,
    "hasFaceEnrolled": true
  }
}
```

---

### 1.4 Logout

**`POST /api/auth/logout`** — 🔒 Requires Token

**Headers:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
Content-Type: application/json
```

**Request Body:** None (empty body `{}` is fine)

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 1.5 Enroll Face for Current Admin User

**`POST /api/auth/enroll-face`** — 🔒 Requires Token (superadmin / admin only)

**Headers:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Face enrolled successfully",
  "user": {
    "id": "681f7bcf86cd799439011",
    "name": "Super Admin",
    "email": "superadmin@school.com",
    "role": "superadmin",
    "hasFaceEnrolled": true
  },
  "faceDetection": {
    "confidence": 0.97,
    "boundingBox": {
      "x": 120,
      "y": 80,
      "width": 200,
      "height": 220
    }
  }
}
```

---

### 1.6 Face Verify (2FA for Admins)

**`POST /api/auth/face-verify`** — 🔒 Requires Token

**Headers:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
}
```

**Response 200 OK (verified):**
```json
{
  "success": true,
  "message": "Face verified successfully",
  "verified": true,
  "confidence": {
    "distance": 0.28,
    "threshold": 0.6
  },
  "user": {
    "id": "681f7bcf86cd799439011",
    "name": "Super Admin",
    "email": "superadmin@school.com",
    "role": "superadmin"
  }
}
```

**Response 401 Unauthorized (no match):**
```json
{
  "success": false,
  "message": "Face verification failed. Face does not match.",
  "verified": false,
  "confidence": {
    "distance": 0.72,
    "threshold": 0.6
  }
}
```

---

## 2. User Management

> All routes require token. SuperAdmin can manage all users; Admin can only manage users they created.

---

### 2.1 Get All Users

**`GET /api/users`** — 🔒 Requires Token (superadmin / admin)

**Headers:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

**Request Body:** None

**Response 200 OK:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "681f7bcf86cd799439012",
      "name": "Juan dela Cruz",
      "email": "juan@school.com",
      "role": "student",
      "department": "Computer Science",
      "isActive": true,
      "hasFaceEnrolled": true,
      "createdBy": {
        "_id": "681f7bcf86cd799439011",
        "name": "Super Admin",
        "email": "superadmin@school.com",
        "role": "superadmin"
      },
      "createdAt": "2026-05-01T10:00:00.000Z"
    }
  ]
}
```

---

### 2.2 Get All Students

**`GET /api/users/students`** — 🔒 Requires Token (superadmin / admin)

**Headers:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

**Request Body:** None

**Response 200 OK:**
```json
{
  "success": true,
  "count": 2,
  "role": "student",
  "data": [
    {
      "_id": "681f7bcf86cd799439012",
      "name": "Juan dela Cruz",
      "email": "juan@school.com",
      "role": "student",
      "department": "Computer Science",
      "isActive": true,
      "createdAt": "2026-05-01T10:00:00.000Z"
    }
  ]
}
```

---

### 2.3 Get All Teachers

**`GET /api/users/teachers`** — 🔒 Requires Token (superadmin / admin)

**Headers:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

**Request Body:** None

**Response 200 OK:**
```json
{
  "success": true,
  "count": 1,
  "role": "teacher",
  "data": [
    {
      "_id": "681f7bcf86cd799439015",
      "name": "Maria Santos",
      "email": "maria@school.com",
      "role": "teacher",
      "department": "Mathematics",
      "isActive": true,
      "createdAt": "2026-04-28T09:00:00.000Z"
    }
  ]
}
```

---

### 2.4 Get Single User

**`GET /api/users/:id`** — 🔒 Requires Token

**Headers:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

**URL Example:** `GET /api/users/681f7bcf86cd799439012`

**Request Body:** None

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "_id": "681f7bcf86cd799439012",
    "name": "Juan dela Cruz",
    "email": "juan@school.com",
    "role": "student",
    "department": "Computer Science",
    "isActive": true,
    "createdBy": {
      "_id": "681f7bcf86cd799439011",
      "name": "Super Admin",
      "email": "superadmin@school.com",
      "role": "superadmin"
    },
    "createdAt": "2026-05-01T10:00:00.000Z"
  }
}
```

---

### 2.5 Create User (with Face Enrollment)

**`POST /api/users`** — 🔒 Requires Token (superadmin / admin)

**Headers:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Pedro Reyes",
  "email": "pedro@school.com",
  "password": "Student2026!",
  "role": "student",
  "department": "Information Technology",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
}
```

> Valid roles: `admin`, `teacher`, `student`  
> SuperAdmin cannot create another `superadmin`.  
> Admin can only create `teacher` or `student`.

**Response 201 Created:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "_id": "681f7bcf86cd799439020",
    "name": "Pedro Reyes",
    "email": "pedro@school.com",
    "role": "student",
    "department": "Information Technology",
    "isActive": true,
    "createdBy": "681f7bcf86cd799439011",
    "createdAt": "2026-05-05T10:30:00.000Z"
  }
}
```

---

### 2.6 Update User

**`PUT /api/users/:id`** — 🔒 Requires Token (superadmin / admin)

**Headers:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
Content-Type: application/json
```

**URL Example:** `PUT /api/users/681f7bcf86cd799439020`

**Request Body (update any combination of fields):**
```json
{
  "name": "Pedro Reyes Jr.",
  "department": "Computer Engineering",
  "isActive": true
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "_id": "681f7bcf86cd799439020",
    "name": "Pedro Reyes Jr.",
    "email": "pedro@school.com",
    "role": "student",
    "department": "Computer Engineering",
    "isActive": true,
    "updatedAt": "2026-05-05T11:00:00.000Z"
  }
}
```

---

### 2.7 Delete User

**`DELETE /api/users/:id`** — 🔒 Requires Token (superadmin / admin)

**Headers:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

**URL Example:** `DELETE /api/users/681f7bcf86cd799439020`

**Request Body:** None

**Response 200 OK:**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {}
}
```

---

## 3. Enrollment (Legacy Student Model)

> These endpoints use the legacy `Student` model (separate from the main `User` model). No token required.

---

### 3.1 Get All Enrolled Students

**`GET /api/enroll`** — Public

**Query Parameters (all optional):**
```
?course=BSIT&isActive=true&page=1&limit=50
```

**Response 200 OK:**
```json
{
  "success": true,
  "count": 2,
  "total": 2,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "681f7bcf86cd799439030",
      "studentId": "2026-0001",
      "name": "Ana Lim",
      "course": "BSIT",
      "email": "ana@school.com",
      "isActive": true,
      "createdAt": "2026-04-20T08:00:00.000Z"
    }
  ]
}
```

---

### 3.2 Enroll New Student

**`POST /api/enroll`** — Public

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentId": "2026-0002",
  "name": "Carlo Mendoza",
  "course": "BSCS",
  "email": "carlo@school.com",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
}
```

> `email` is optional. All other fields are required.

**Response 201 Created:**
```json
{
  "success": true,
  "message": "Student enrolled successfully",
  "data": {
    "studentId": "2026-0002",
    "name": "Carlo Mendoza",
    "course": "BSCS",
    "email": "carlo@school.com",
    "imagePath": "uploads/students/face_1746462950123.jpeg",
    "faceDetection": {
      "confidence": 0.98,
      "boundingBox": {
        "x": 100,
        "y": 90,
        "width": 180,
        "height": 200
      }
    },
    "enrolledAt": "2026-05-05T10:00:00.000Z"
  }
}
```

**Response 409 Conflict (duplicate studentId):**
```json
{
  "success": false,
  "message": "Student with ID 2026-0002 already exists",
  "data": {
    "studentId": "2026-0002",
    "name": "Carlo Mendoza",
    "course": "BSCS"
  }
}
```

---

### 3.3 Get Single Enrolled Student

**`GET /api/enroll/:studentId`** — Public

**URL Example:** `GET /api/enroll/2026-0002`

**Request Body:** None

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "_id": "681f7bcf86cd799439030",
    "studentId": "2026-0002",
    "name": "Carlo Mendoza",
    "course": "BSCS",
    "email": "carlo@school.com",
    "isActive": true,
    "createdAt": "2026-05-05T10:00:00.000Z"
  }
}
```

---

### 3.4 Update Enrolled Student

**`PUT /api/enroll/:studentId`** — Public

**Headers:**
```
Content-Type: application/json
```

**URL Example:** `PUT /api/enroll/2026-0002`

**Request Body:**
```json
{
  "name": "Carlos Mendoza",
  "course": "BSIT",
  "email": "carlos@school.com",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
}
```

> All fields are optional. Provide `image` only to re-enroll the face.

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Student information updated successfully",
  "data": {
    "studentId": "2026-0002",
    "name": "Carlos Mendoza",
    "course": "BSIT",
    "email": "carlos@school.com",
    "updatedAt": "2026-05-05T12:00:00.000Z"
  }
}
```

---

### 3.5 Delete Enrolled Student

**`DELETE /api/enroll/:studentId`** — Public

**URL Example:** `DELETE /api/enroll/2026-0002`

**Request Body:** None

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Student deleted successfully",
  "data": {
    "studentId": "2026-0002",
    "name": "Carlos Mendoza"
  }
}
```

---

## 4. Face Login (Legacy)

> Uses the legacy `Student` model for face matching and attendance logging.

---

### 4.1 Face Login & Log Attendance

**`POST /api/face-login`** — Public

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "deviceId": "device-001",
  "location": "Room 101"
}
```

> `deviceId` and `location` are optional.

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Attendance logged successfully",
  "data": {
    "student": {
      "studentId": "2026-0002",
      "name": "Carlos Mendoza",
      "course": "BSIT"
    },
    "attendance": {
      "id": "681f7bcf86cd799439040",
      "timestamp": "2026-05-05T08:30:00.000Z",
      "status": "present",
      "imagePath": "uploads/attendance/face_1746462950456.jpeg",
      "deviceId": "device-001"
    },
    "match": {
      "confidence": "0.7200",
      "distance": "0.2800",
      "threshold": 0.6
    },
    "faceDetection": {
      "confidence": 0.97,
      "boundingBox": {
        "x": 120,
        "y": 80,
        "width": 200,
        "height": 210
      }
    }
  }
}
```

**Response 401 Unauthorized (not recognized):**
```json
{
  "success": false,
  "message": "Face not recognized. Please enroll first.",
  "error": "FACE_NOT_RECOGNIZED",
  "confidence": "0.2500",
  "threshold": 0.6
}
```

---

### 4.2 Verify Face (No Attendance Logged)

**`POST /api/face-login/verify`** — Public

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
}
```

**Response 200 OK (recognized):**
```json
{
  "success": true,
  "message": "Face recognized",
  "data": {
    "student": {
      "studentId": "2026-0002",
      "name": "Carlos Mendoza",
      "course": "BSIT"
    },
    "match": {
      "confidence": "0.7200",
      "distance": "0.2800",
      "threshold": 0.6,
      "recognized": true
    }
  }
}
```

**Response 401 Unauthorized (not recognized):**
```json
{
  "success": false,
  "message": "Face not recognized",
  "error": "FACE_NOT_RECOGNIZED",
  "data": {
    "match": {
      "confidence": "0.2500",
      "distance": "0.7500",
      "threshold": 0.6,
      "recognized": false
    }
  }
}
```

---

### 4.3 Get Attendance Statistics for a Student

**`GET /api/face-login/stats/:studentId`** — Public

**URL Example:** `GET /api/face-login/stats/2026-0002`

**Query Parameters (optional):**
```
?startDate=2026-05-01&endDate=2026-05-05
```

**Request Body:** None

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "student": {
      "studentId": "2026-0002",
      "name": "Carlos Mendoza",
      "course": "BSIT"
    },
    "statistics": {
      "totalAttendance": 5,
      "presentCount": 4,
      "lateCount": 1,
      "attendanceRate": "80.00"
    },
    "recentLogs": [
      {
        "_id": "681f7bcf86cd799439040",
        "studentId": "2026-0002",
        "timestamp": "2026-05-05T08:30:00.000Z",
        "status": "present",
        "confidenceScore": 0.72
      }
    ]
  }
}
```

---

## 5. Attendance Logs

---

### 5.1 Get All Attendance Logs (Admin/SuperAdmin)

**`GET /api/logs`** — 🔒 Requires Token (superadmin / admin)

**Headers:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

**Query Parameters (all optional):**
```
?userId=681f7bcf86cd799439012
&userRole=student
&status=present
&deviceId=kiosk-01
&startDate=2026-05-01
&endDate=2026-05-05
&page=1
&limit=20
```

**Request Body:** None

**Response 200 OK:**
```json
{
  "success": true,
  "count": 2,
  "total": 2,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "hasNextPage": false,
  "hasPrevPage": false,
  "data": [
    {
      "_id": "681f7bcf86cd799439040",
      "userId": {
        "_id": "681f7bcf86cd799439012",
        "name": "Juan dela Cruz",
        "email": "juan@school.com",
        "role": "student",
        "department": "Computer Science"
      },
      "userRole": "student",
      "userName": "Juan dela Cruz",
      "timestamp": "2026-05-05T08:30:00.000Z",
      "timeIn": "2026-05-05T08:30:00.000Z",
      "timeOut": "2026-05-05T17:00:00.000Z",
      "scanCount": 2,
      "status": "present",
      "confidenceScore": 0.72,
      "imagePath": "uploads/attendance/face_1746462950456.jpeg",
      "deviceId": "kiosk-01"
    }
  ]
}
```

---

### 5.2 Get Single Attendance Log

**`GET /api/logs/:id`** — 🔒 Requires Token (superadmin / admin)

**Headers:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

**URL Example:** `GET /api/logs/681f7bcf86cd799439040`

**Request Body:** None

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "_id": "681f7bcf86cd799439040",
    "userId": "681f7bcf86cd799439012",
    "userRole": "student",
    "userName": "Juan dela Cruz",
    "timestamp": "2026-05-05T08:30:00.000Z",
    "timeIn": "2026-05-05T08:30:00.000Z",
    "timeOut": "2026-05-05T17:00:00.000Z",
    "scanCount": 2,
    "status": "present",
    "confidenceScore": 0.72,
    "imagePath": "uploads/attendance/face_1746462950456.jpeg"
  }
}
```

---

### 5.3 Get Logs Summary / Statistics

**`GET /api/logs/summary`** — 🔒 Requires Token (superadmin / admin)

**Headers:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

**Query Parameters (optional):**
```
?startDate=2026-05-01&endDate=2026-05-05&course=BSIT
```

**Request Body:** None

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "totalLogs": 25,
    "uniqueUsers": 10,
    "statusBreakdown": {
      "present": 22,
      "late": 2,
      "absent": 1
    },
    "roleBreakdown": [
      { "_id": "student", "count": 20 },
      { "_id": "teacher", "count": 5 }
    ],
    "courseBreakdown": [
      { "_id": "BSIT", "count": 15 },
      { "_id": "BSCS", "count": 10 }
    ],
    "dateRange": {
      "startDate": "2026-05-01",
      "endDate": "2026-05-05"
    }
  }
}
```

---

### 5.4 Get Logs Grouped by Date

**`GET /api/logs/by-date`** — 🔒 Requires Token (superadmin / admin)

**Headers:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

**Query Parameters (optional):**
```
?startDate=2026-05-01&endDate=2026-05-05&course=BSIT
```

**Request Body:** None

**Response 200 OK:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "date": "2026-05-05",
      "count": 18,
      "uniqueStudents": 15
    },
    {
      "date": "2026-05-04",
      "count": 16,
      "uniqueStudents": 14
    }
  ]
}
```

---

### 5.5 Log My Attendance (Self-Service)

**`POST /api/logs/log-attendance`** — 🔒 Requires Token (student / teacher / admin)

**Headers:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "course": "BSIT",
  "status": "present",
  "deviceId": "kiosk-01",
  "imagePath": "uploads/attendance/face_1746462950456.jpeg",
  "confidenceScore": 0.72,
  "location": "Main Hall"
}
```

> All fields are optional. `status` defaults to `"present"` if not provided.

**Response 201 Created:**
```json
{
  "success": true,
  "message": "Attendance logged successfully",
  "data": {
    "_id": "681f7bcf86cd799439050",
    "userId": {
      "_id": "681f7bcf86cd799439012",
      "name": "Juan dela Cruz",
      "email": "juan@school.com",
      "role": "student",
      "department": "Computer Science"
    },
    "userRole": "student",
    "userName": "Juan dela Cruz",
    "course": "BSIT",
    "timestamp": "2026-05-05T08:30:00.000Z",
    "status": "present",
    "deviceId": "kiosk-01",
    "confidenceScore": 0.72,
    "location": "Main Hall"
  }
}
```

**Response 409 Conflict (duplicate within 1 minute):**
```json
{
  "success": false,
  "message": "Attendance already logged within the last minute",
  "existingLog": {
    "_id": "681f7bcf86cd799439050",
    "timestamp": "2026-05-05T08:30:00.000Z"
  }
}
```

---

### 5.6 Get My Attendance History

**`GET /api/logs/my-attendance`** — 🔒 Requires Token

**Headers:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

**Query Parameters (optional):**
```
?startDate=2026-05-01&endDate=2026-05-05&page=1&limit=20
```

**Request Body:** None

**Response 200 OK:**
```json
{
  "success": true,
  "count": 5,
  "total": 5,
  "page": 1,
  "totalPages": 1,
  "hasNextPage": false,
  "hasPrevPage": false,
  "data": [
    {
      "_id": "681f7bcf86cd799439050",
      "userId": {
        "_id": "681f7bcf86cd799439012",
        "name": "Juan dela Cruz",
        "email": "juan@school.com",
        "role": "student",
        "department": "Computer Science"
      },
      "course": "BSIT",
      "timestamp": "2026-05-05T08:30:00.000Z",
      "status": "present",
      "confidenceScore": 0.72
    }
  ]
}
```

---

### 5.7 Delete Attendance Log

**`DELETE /api/logs/:id`** — 🔒 Requires Token (superadmin / admin)

**Headers:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

**URL Example:** `DELETE /api/logs/681f7bcf86cd799439040`

**Request Body:** None

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Attendance log deleted successfully",
  "data": {
    "_id": "681f7bcf86cd799439040",
    "userId": "681f7bcf86cd799439012",
    "timestamp": "2026-05-05T08:30:00.000Z",
    "status": "present"
  }
}
```

---

## 6. Login Logs

---

### 6.1 Get All Login Logs

**`GET /api/login-logs`** — 🔒 Requires Token (superadmin / admin)

**Headers:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

**Query Parameters (optional):**
```
?role=admin&startDate=2026-05-01&endDate=2026-05-05&page=1&limit=50
```

> Valid roles for filter: `superadmin`, `admin`, `teacher`, `student`

**Request Body:** None

**Response 200 OK:**
```json
{
  "success": true,
  "count": 3,
  "total": 3,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "681f7bcf86cd799439060",
      "userId": {
        "_id": "681f7bcf86cd799439011",
        "name": "Super Admin",
        "email": "superadmin@school.com",
        "department": ""
      },
      "role": "superadmin",
      "loginTime": "2026-05-05T07:00:00.000Z",
      "logoutTime": "2026-05-05T18:00:00.000Z",
      "ipAddress": "::1",
      "userAgent": "Mozilla/5.0..."
    }
  ]
}
```

---

### 6.2 Get Login Statistics

**`GET /api/login-logs/stats`** — 🔒 Requires Token (superadmin / admin)

**Headers:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

**Request Body:** None

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "totalLogins": 42,
    "loginsToday": 7,
    "byRole": [
      {
        "role": "student",
        "count": 30,
        "lastLogin": "2026-05-05T08:30:00.000Z"
      },
      {
        "role": "teacher",
        "count": 8,
        "lastLogin": "2026-05-05T07:45:00.000Z"
      },
      {
        "role": "admin",
        "count": 3,
        "lastLogin": "2026-05-05T07:00:00.000Z"
      },
      {
        "role": "superadmin",
        "count": 1,
        "lastLogin": "2026-05-05T07:00:00.000Z"
      }
    ]
  }
}
```

---

### 6.3 Get My Login History

**`GET /api/login-logs/me`** — 🔒 Requires Token

**Headers:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

**Query Parameters (optional):**
```
?page=1&limit=20
```

**Request Body:** None

**Response 200 OK:**
```json
{
  "success": true,
  "count": 2,
  "total": 2,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "681f7bcf86cd799439060",
      "userId": "681f7bcf86cd799439011",
      "role": "superadmin",
      "loginTime": "2026-05-05T07:00:00.000Z",
      "logoutTime": "2026-05-05T18:00:00.000Z",
      "ipAddress": "::1"
    }
  ]
}
```

---

## 7. Kiosk

> No token required. Kiosk device uses public endpoints.

---

### 7.1 Get All Face Descriptors for Kiosk

**`GET /api/kiosk/descriptors`** — Public

**Request Body:** None

**Response 200 OK:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "681f7bcf86cd799439012",
      "name": "Juan dela Cruz",
      "role": "student",
      "department": "Computer Science",
      "faceDescriptor": [0.123, -0.456, 0.789, "...128 values total..."],
      "createdBy": "681f7bcf86cd799439011"
    },
    {
      "_id": "681f7bcf86cd799439015",
      "name": "Maria Santos",
      "role": "teacher",
      "department": "Mathematics",
      "faceDescriptor": [0.234, -0.567, 0.890, "...128 values total..."],
      "createdBy": "681f7bcf86cd799439011"
    }
  ]
}
```

---

### 7.2 Record Kiosk Attendance

**`POST /api/kiosk/attendance`** — Public

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "681f7bcf86cd799439012",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "confidenceScore": 0.92,
  "deviceId": "kiosk-01",
  "location": "Main Entrance"
}
```

> `confidenceScore`, `deviceId`, and `location` are optional. `userId` and `image` are required.

**Response 201 Created (first scan — time-in):**
```json
{
  "success": true,
  "scanType": "time-in",
  "message": "Time In recorded for Juan dela Cruz",
  "data": {
    "userId": "681f7bcf86cd799439012",
    "name": "Juan dela Cruz",
    "role": "student",
    "department": "Computer Science",
    "timeIn": "2026-05-05T08:30:00.000Z",
    "timeOut": null,
    "timestamp": "2026-05-05T08:30:00.000Z"
  }
}
```

**Response 200 OK (second scan — time-out):**
```json
{
  "success": true,
  "scanType": "time-out",
  "message": "Time Out recorded for Juan dela Cruz",
  "data": {
    "userId": "681f7bcf86cd799439012",
    "name": "Juan dela Cruz",
    "role": "student",
    "department": "Computer Science",
    "timeIn": "2026-05-05T08:30:00.000Z",
    "timeOut": "2026-05-05T17:00:00.000Z",
    "timestamp": "2026-05-05T08:30:00.000Z"
  }
}
```

**Response 400 Bad Request (third scan — already completed):**
```json
{
  "success": false,
  "scanType": "completed",
  "message": "Attendance already completed for today",
  "data": {
    "userId": "681f7bcf86cd799439012",
    "name": "Juan dela Cruz",
    "role": "student",
    "department": "Computer Science",
    "timeIn": "2026-05-05T08:30:00.000Z",
    "timeOut": "2026-05-05T17:00:00.000Z"
  }
}
```

**Response 401 Unauthorized (face mismatch):**
```json
{
  "success": false,
  "message": "Face not recognized. No matching user found.",
  "confidence": {
    "distance": 0.68,
    "threshold": 0.45
  }
}
```

---

## 8. Device Sync

> For syncing attendance logs from offline devices. Uses the legacy `Student` model.

---

### 8.1 Sync Single Attendance Log

**`POST /api/device-sync`** — Public

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentId": "2026-0002",
  "timestamp": "2026-05-05T08:30:00Z",
  "deviceId": "device-001",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
}
```

> `image` is optional. `studentId`, `timestamp`, and `deviceId` are required.

**Response 201 Created:**
```json
{
  "success": true,
  "message": "Attendance log synced successfully",
  "data": {
    "logId": "681f7bcf86cd799439070",
    "student": {
      "studentId": "2026-0002",
      "name": "Carlos Mendoza",
      "course": "BSIT"
    },
    "attendance": {
      "timestamp": "2026-05-05T08:30:00.000Z",
      "deviceId": "device-001",
      "status": "present",
      "imagePath": "uploads/attendance/face_1746462950789.jpeg"
    }
  }
}
```

**Response 409 Conflict (duplicate within 1 minute):**
```json
{
  "success": false,
  "message": "Duplicate attendance log detected within 1-minute window",
  "existingLog": {
    "id": "681f7bcf86cd799439070",
    "timestamp": "2026-05-05T08:30:00.000Z",
    "deviceId": "device-001"
  }
}
```

---

### 8.2 Bulk Sync Multiple Attendance Logs

**`POST /api/device-sync/bulk`** — Public

**Headers:**
```
Content-Type: application/json
```

**Request Body (max 100 logs per request):**
```json
{
  "logs": [
    {
      "studentId": "2026-0001",
      "timestamp": "2026-05-05T08:00:00Z",
      "deviceId": "device-001",
      "status": "present",
      "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
    },
    {
      "studentId": "2026-0002",
      "timestamp": "2026-05-05T08:05:00Z",
      "deviceId": "device-001",
      "status": "late"
    }
  ]
}
```

> `image` and `status` are optional per log. `studentId`, `timestamp`, and `deviceId` are required per log.

**Response 201 Created (at least one success):**
```json
{
  "success": true,
  "message": "Processed 2 logs: 2 success, 0 failed, 0 duplicates",
  "summary": {
    "total": 2,
    "success": 2,
    "failed": 0,
    "duplicate": 0
  },
  "results": {
    "success": [
      {
        "index": 0,
        "logId": "681f7bcf86cd799439071",
        "studentId": "2026-0001",
        "timestamp": "2026-05-05T08:00:00.000Z"
      },
      {
        "index": 1,
        "logId": "681f7bcf86cd799439072",
        "studentId": "2026-0002",
        "timestamp": "2026-05-05T08:05:00.000Z"
      }
    ],
    "failed": [],
    "duplicate": []
  }
}
```

---

## 9. Upload

---

### 9.1 Upload Single Image

**`POST /api/upload/image`** — Public

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "subfolder": "general"
}
```

> `subfolder` is optional. Leave empty for root uploads folder.

**Response 201 Created:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "filePath": "uploads/general/img_1746462950123.jpeg",
    "fileName": "img_1746462950123.jpeg",
    "size": 24576
  }
}
```

---

### 9.2 Upload Multiple Images

**`POST /api/upload/images`** — Public

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  ],
  "subfolder": "batch"
}
```

**Response 201 Created:**
```json
{
  "success": true,
  "message": "2 image(s) uploaded successfully",
  "data": [
    {
      "filePath": "uploads/batch/img_1746462950124.jpeg",
      "fileName": "img_1746462950124.jpeg",
      "size": 24576
    },
    {
      "filePath": "uploads/batch/img_1746462950125.jpeg",
      "fileName": "img_1746462950125.jpeg",
      "size": 18432
    }
  ]
}
```

---

### 9.3 Upload Face Image

**`POST /api/upload/face`** — Public

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "studentId": "2026-0002"
}
```

> Both fields are required.

**Response 201 Created:**
```json
{
  "success": true,
  "message": "Face image uploaded successfully",
  "data": {
    "filePath": "uploads/faces/img_1746462950126.jpeg",
    "fileName": "img_1746462950126.jpeg",
    "size": 22016,
    "studentId": "2026-0002"
  }
}
```

---

## 10. Attendance (Admin View)

---

### 10.1 Get All Attendance Records

**`GET /api/attendance`** — 🔒 Requires Token (superadmin / admin)

**Headers:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

**Request Body:** None

**Response 200 OK:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "681f7bcf86cd799439040",
      "userId": "681f7bcf86cd799439012",
      "userRole": "student",
      "userName": "Juan dela Cruz",
      "timestamp": "2026-05-05T08:30:00.000Z",
      "timeIn": "2026-05-05T08:30:00.000Z",
      "timeOut": "2026-05-05T17:00:00.000Z",
      "scanCount": 2,
      "status": "present",
      "confidenceScore": 0.72
    }
  ]
}
```

---

## Common Error Responses

| Status Code | Example Response |
|---|---|
| 400 Bad Request | `{ "success": false, "message": "Please provide email and password" }` |
| 401 Unauthorized | `{ "success": false, "message": "Unauthorized: Invalid or expired token" }` |
| 403 Forbidden | `{ "success": false, "message": "Access denied. Insufficient permissions." }` |
| 404 Not Found | `{ "success": false, "message": "User not found" }` |
| 409 Conflict | `{ "success": false, "message": "Email already registered" }` |
| 500 Server Error | `{ "success": false, "message": "Internal server error" }` |

---

## Quick Token Workflow

```
Step 1: POST /api/auth/login
        → Copy the "token" from the response

Step 2: Use the token in all protected endpoints:
        Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Step 3: Token expires in 7 days. Repeat Step 1 to refresh.
```

---

## Endpoint Summary Table

| # | Method | Endpoint | Auth Required | Role |
|---|---|---|---|---|
| 1 | POST | `/api/auth/login` | ❌ | — |
| 2 | POST | `/api/auth/face-login` | ❌ | — |
| 3 | GET | `/api/auth/me` | ✅ | All |
| 4 | POST | `/api/auth/logout` | ✅ | All |
| 5 | POST | `/api/auth/enroll-face` | ✅ | superadmin, admin |
| 6 | POST | `/api/auth/face-verify` | ✅ | All |
| 7 | GET | `/api/users` | ✅ | superadmin, admin |
| 8 | GET | `/api/users/students` | ✅ | superadmin, admin |
| 9 | GET | `/api/users/teachers` | ✅ | superadmin, admin |
| 10 | GET | `/api/users/:id` | ✅ | All |
| 11 | POST | `/api/users` | ✅ | superadmin, admin |
| 12 | PUT | `/api/users/:id` | ✅ | superadmin, admin |
| 13 | DELETE | `/api/users/:id` | ✅ | superadmin, admin |
| 14 | GET | `/api/enroll` | ❌ | — |
| 15 | POST | `/api/enroll` | ❌ | — |
| 16 | GET | `/api/enroll/:studentId` | ❌ | — |
| 17 | PUT | `/api/enroll/:studentId` | ❌ | — |
| 18 | DELETE | `/api/enroll/:studentId` | ❌ | — |
| 19 | POST | `/api/face-login` | ❌ | — |
| 20 | POST | `/api/face-login/verify` | ❌ | — |
| 21 | GET | `/api/face-login/stats/:studentId` | ❌ | — |
| 22 | GET | `/api/logs` | ✅ | superadmin, admin |
| 23 | GET | `/api/logs/:id` | ✅ | superadmin, admin |
| 24 | DELETE | `/api/logs/:id` | ✅ | superadmin, admin |
| 25 | GET | `/api/logs/summary` | ✅ | superadmin, admin |
| 26 | GET | `/api/logs/by-date` | ✅ | superadmin, admin |
| 27 | POST | `/api/logs/log-attendance` | ✅ | All |
| 28 | GET | `/api/logs/my-attendance` | ✅ | All |
| 29 | GET | `/api/login-logs` | ✅ | superadmin, admin |
| 30 | GET | `/api/login-logs/stats` | ✅ | superadmin, admin |
| 31 | GET | `/api/login-logs/me` | ✅ | All |
| 32 | GET | `/api/kiosk/descriptors` | ❌ | — |
| 33 | POST | `/api/kiosk/attendance` | ❌ | — |
| 34 | POST | `/api/device-sync` | ❌ | — |
| 35 | POST | `/api/device-sync/bulk` | ❌ | — |
| 36 | POST | `/api/upload/image` | ❌ | — |
| 37 | POST | `/api/upload/images` | ❌ | — |
| 38 | POST | `/api/upload/face` | ❌ | — |
| 39 | GET | `/api/attendance` | ✅ | superadmin, admin |
