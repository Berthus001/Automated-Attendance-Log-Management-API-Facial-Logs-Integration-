# API Endpoints for Testing

**Base URL:** `http://localhost:5000`

**Authentication:** Bearer Token in Authorization header
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication Endpoints (`/api/auth`)

### 1. Admin Login (Email + Password)
**POST** `/api/auth/login`

**Access:** Public

**Request Body:**
```json
{
  "email": "eleonor.sarona@admin.com",
  "password": "your_password",
  "forceLogin": false
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Eleanor Sarona",
    "email": "eleonor.sarona@admin.com",
    "role": "admin",
    "department": "Computer Science",
    "hasFaceEnrolled": true
  }
}
```

---

### 2. Face-Only Login (Students/Teachers)
**POST** `/api/auth/face-login`

**Access:** Public

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA...",
  "forceLogin": false
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "John Doe",
    "email": "john.doe@student.com",
    "role": "student",
    "studentId": "2021-00123"
  },
  "confidence": 0.95
}
```

---

### 3. Get Current User
**GET** `/api/auth/me`

**Access:** Protected (All roles)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Eleanor Sarona",
    "email": "eleonor.sarona@admin.com",
    "role": "admin"
  }
}
```

---

### 4. Enroll Face for 2FA (Admin/SuperAdmin)
**POST** `/api/auth/enroll-face`

**Access:** Protected (admin, superadmin)

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Face enrolled successfully",
  "user": {
    "hasFaceEnrolled": true
  }
}
```

---

### 5. Verify Face (2FA for Admin/SuperAdmin)
**POST** `/api/auth/face-verify`

**Access:** Protected (All roles)

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA..."
}
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "confidence": 0.92
}
```

---

### 6. Logout
**POST** `/api/auth/logout`

**Access:** Protected (All roles)

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 👥 User Management Endpoints (`/api/users`)

### 7. Get All Users
**GET** `/api/users`

**Access:** Protected (admin, superadmin)

**Query Parameters:**
- `role`: Filter by role (student, teacher, admin, superadmin)
- `department`: Filter by department
- `search`: Search by name or email
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Example:** `/api/users?role=student&department=Computer Science&page=1&limit=10`

**Response:**
```json
{
  "success": true,
  "count": 25,
  "page": 1,
  "pages": 3,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john.doe@student.com",
      "role": "student",
      "studentId": "2021-00123",
      "department": "Computer Science",
      "hasFaceEnrolled": true
    }
  ]
}
```

---

### 8. Get Students Only
**GET** `/api/users/students`

**Access:** Protected (admin, superadmin)

**Response:**
```json
{
  "success": true,
  "count": 150,
  "students": [...]
}
```

---

### 9. Get Teachers Only
**GET** `/api/users/teachers`

**Access:** Protected (admin, superadmin)

**Response:**
```json
{
  "success": true,
  "count": 20,
  "teachers": [...]
}
```

---

### 10. Get Single User
**GET** `/api/users/:id`

**Access:** Protected (All roles - can view own profile)

**Example:** `/api/users/507f1f77bcf86cd799439012`

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "John Doe",
    "email": "john.doe@student.com",
    "role": "student"
  }
}
```

---

### 11. Create User
**POST** `/api/users`

**Access:** Protected (admin, superadmin)

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane.smith@student.com",
  "password": "SecurePass123!",
  "role": "student",
  "department": "Computer Science",
  "studentId": "2021-00456",
  "faceDescriptor": [0.123, -0.456, ...], // Optional: 128-dimensional array
  "profileImage": "data:image/jpeg;base64,..." // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Jane Smith",
    "email": "jane.smith@student.com",
    "role": "student"
  }
}
```

---

### 12. Update User
**PUT** `/api/users/:id`

**Access:** Protected (admin, superadmin)

**Request Body:**
```json
{
  "name": "Jane Smith Updated",
  "department": "Software Engineering",
  "password": "NewPassword123!" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "user": {...}
}
```

---

### 13. Delete User
**DELETE** `/api/users/:id`

**Access:** Protected (admin, superadmin)

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## 📝 Student Enrollment Endpoints (`/api/enroll`)

### 14. Get All Enrolled Students
**GET** `/api/enroll`

**Access:** Public

**Response:**
```json
{
  "success": true,
  "count": 120,
  "students": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "studentId": "2021-00123",
      "name": "John Doe",
      "department": "Computer Science",
      "year": "3rd Year",
      "section": "A",
      "faceDescriptor": [...],
      "enrolledAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 15. Enroll New Student
**POST** `/api/enroll`

**Access:** Public

**Request Body:**
```json
{
  "studentId": "2021-00789",
  "name": "Bob Wilson",
  "department": "Computer Science",
  "year": "2nd Year",
  "section": "B",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Student enrolled successfully",
  "student": {
    "_id": "507f1f77bcf86cd799439015",
    "studentId": "2021-00789",
    "name": "Bob Wilson"
  }
}
```

---

### 16. Get Specific Enrolled Student
**GET** `/api/enroll/:studentId`

**Access:** Public

**Example:** `/api/enroll/2021-00123`

**Response:**
```json
{
  "success": true,
  "student": {...}
}
```

---

### 17. Update Enrolled Student
**PUT** `/api/enroll/:studentId`

**Access:** Public

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "year": "4th Year",
  "image": "data:image/jpeg;base64,..." // Optional: update face
}
```

---

### 18. Delete Enrolled Student
**DELETE** `/api/enroll/:studentId`

**Access:** Public

**Response:**
```json
{
  "success": true,
  "message": "Student deleted successfully"
}
```

---

## 📸 Face Login & Attendance (`/api/face-login`)

### 19. Face Login (Log Attendance)
**POST** `/api/face-login`

**Access:** Public

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA...",
  "location": "Room 301",
  "device": "Entrance Scanner 1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance logged successfully",
  "student": {
    "studentId": "2021-00123",
    "name": "John Doe"
  },
  "attendance": {
    "_id": "507f1f77bcf86cd799439016",
    "timeIn": "2024-03-15T08:30:45.000Z"
  },
  "confidence": 0.94
}
```

---

### 20. Verify Face (Without Logging)
**POST** `/api/face-login/verify`

**Access:** Public

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA..."
}
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "student": {
    "studentId": "2021-00123",
    "name": "John Doe"
  },
  "confidence": 0.96
}
```

---

### 21. Get Attendance Stats for Student
**GET** `/api/face-login/stats/:studentId`

**Access:** Public

**Example:** `/api/face-login/stats/2021-00123`

**Response:**
```json
{
  "success": true,
  "studentId": "2021-00123",
  "stats": {
    "totalAttendance": 45,
    "thisMonth": 18,
    "thisWeek": 4,
    "averageCheckInTime": "08:25:00"
  }
}
```

---

## 📊 Attendance Logs Endpoints (`/api/logs`)

### 22. Log My Attendance (Self-Service)
**POST** `/api/logs/log-attendance`

**Access:** Protected (All roles)

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA...",
  "location": "Room 301"
}
```

---

### 23. Get My Attendance
**GET** `/api/logs/my-attendance`

**Access:** Protected (All roles)

**Query Parameters:**
- `startDate`: Filter from date (ISO format)
- `endDate`: Filter to date (ISO format)

**Example:** `/api/logs/my-attendance?startDate=2024-03-01&endDate=2024-03-31`

**Response:**
```json
{
  "success": true,
  "count": 20,
  "logs": [
    {
      "_id": "507f1f77bcf86cd799439017",
      "timeIn": "2024-03-15T08:30:00.000Z",
      "timeOut": "2024-03-15T17:00:00.000Z",
      "location": "Room 301"
    }
  ]
}
```

---

### 24. Get All Attendance Logs
**GET** `/api/logs`

**Access:** Protected (admin, superadmin)

**Query Parameters:**
- `userId`: Filter by user ID
- `studentId`: Filter by student ID
- `startDate`: Filter from date
- `endDate`: Filter to date
- `page`: Page number
- `limit`: Items per page

**Example:** `/api/logs?startDate=2024-03-01&page=1&limit=50`

**Response:**
```json
{
  "success": true,
  "count": 250,
  "page": 1,
  "pages": 5,
  "logs": [...]
}
```

---

### 25. Get Logs Summary
**GET** `/api/logs/summary`

**Access:** Protected (admin, superadmin)

**Query Parameters:**
- `startDate`: Start date
- `endDate`: End date

**Response:**
```json
{
  "success": true,
  "summary": {
    "totalLogs": 450,
    "uniqueUsers": 120,
    "averageAttendancePerDay": 25,
    "peakHour": "08:00"
  }
}
```

---

### 26. Get Logs By Date
**GET** `/api/logs/by-date`

**Access:** Protected (admin, superadmin)

**Query Parameters:**
- `date`: Specific date (YYYY-MM-DD)

**Example:** `/api/logs/by-date?date=2024-03-15`

**Response:**
```json
{
  "success": true,
  "date": "2024-03-15",
  "count": 85,
  "logs": [...]
}
```

---

### 27. Get Single Attendance Log
**GET** `/api/logs/:id`

**Access:** Protected (admin, superadmin)

**Response:**
```json
{
  "success": true,
  "log": {...}
}
```

---

### 28. Delete Attendance Log
**DELETE** `/api/logs/:id`

**Access:** Protected (admin, superadmin)

**Response:**
```json
{
  "success": true,
  "message": "Attendance log deleted successfully"
}
```

---

## 🔍 Login Logs Endpoints (`/api/login-logs`)

### 29. Get All Login Logs
**GET** `/api/login-logs`

**Access:** Protected (admin, superadmin)

**Query Parameters:**
- `userId`: Filter by user ID
- `role`: Filter by role
- `startDate`: Filter from date
- `endDate`: Filter to date
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "count": 150,
  "logs": [
    {
      "_id": "507f1f77bcf86cd799439018",
      "userId": "507f1f77bcf86cd799439011",
      "email": "eleonor.sarona@admin.com",
      "loginType": "email",
      "timestamp": "2024-03-15T08:15:30.000Z",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "success": true
    }
  ]
}
```

---

### 30. Get Login Stats
**GET** `/api/login-logs/stats`

**Access:** Protected (admin, superadmin)

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalLogins": 450,
    "uniqueUsers": 120,
    "successRate": 0.98,
    "loginsByType": {
      "email": 200,
      "face": 250
    }
  }
}
```

---

### 31. Get My Login Logs
**GET** `/api/login-logs/me`

**Access:** Protected (All roles)

**Response:**
```json
{
  "success": true,
  "count": 25,
  "logs": [...]
}
```

---

## 🔄 Device Sync Endpoints (`/api/device-sync`)

### 32. Sync Single Attendance Log
**POST** `/api/device-sync`

**Access:** Public

**Request Body:**
```json
{
  "studentId": "2021-00123",
  "timeIn": "2024-03-15T08:30:00.000Z",
  "timeOut": "2024-03-15T17:00:00.000Z",
  "location": "Entrance Scanner",
  "deviceId": "DEVICE-001",
  "confidence": 0.95
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance log synced successfully",
  "log": {...}
}
```

---

### 33. Bulk Sync Attendance Logs
**POST** `/api/device-sync/bulk`

**Access:** Public

**Request Body:**
```json
{
  "logs": [
    {
      "studentId": "2021-00123",
      "timeIn": "2024-03-15T08:30:00.000Z",
      "location": "Entrance",
      "deviceId": "DEVICE-001"
    },
    {
      "studentId": "2021-00456",
      "timeIn": "2024-03-15T08:35:00.000Z",
      "location": "Entrance",
      "deviceId": "DEVICE-001"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk sync completed",
  "synced": 45,
  "failed": 2,
  "results": [...]
}
```

---

## 📤 Upload Endpoints (`/api/upload`)

### 34. Upload Single Base64 Image
**POST** `/api/upload/image`

**Access:** Public

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA...",
  "type": "profile", // profile, face, attendance
  "userId": "507f1f77bcf86cd799439012" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "imageUrl": "/uploads/faces/1647345600000-face.jpg",
  "path": "c:/uploads/faces/1647345600000-face.jpg"
}
```

---

### 35. Upload Multiple Base64 Images
**POST** `/api/upload/images`

**Access:** Public

**Request Body:**
```json
{
  "images": [
    {
      "image": "data:image/jpeg;base64,...",
      "type": "face"
    },
    {
      "image": "data:image/jpeg;base64,...",
      "type": "face"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "uploads": [
    {
      "imageUrl": "/uploads/faces/1647345600000-face-0.jpg"
    },
    {
      "imageUrl": "/uploads/faces/1647345600000-face-1.jpg"
    }
  ]
}
```

---

### 36. Upload Face Image for Attendance
**POST** `/api/upload/face`

**Access:** Public

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA...",
  "studentId": "2021-00123"
}
```

**Response:**
```json
{
  "success": true,
  "imageUrl": "/uploads/faces/2021-00123-1647345600000.jpg"
}
```

---

## 🧪 Testing Tips

### 1. **Get Admin Token First**
```bash
# Login as admin
POST http://localhost:5000/api/auth/login
{
  "email": "eleonor.sarona@admin.com",
  "password": "your_password"
}

# Copy the token from response
# Use it in Authorization header: Bearer <token>
```

### 2. **Test Face Recognition**
- Use base64 encoded images
- Ensure images are clear and face is visible
- JPEG/PNG format recommended
- Max file size: 5MB

### 3. **Error Responses**
All errors follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "statusCode": 400
}
```

### 4. **Common Status Codes**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (e.g., already logged in)
- `500` - Server Error

---

## 📝 Postman Collection

You can import these endpoints into Postman using the following structure:

1. Create a new Collection: "Attendance Management API"
2. Set Collection Variables:
   - `baseUrl`: `http://localhost:5000`
   - `token`: (leave empty, will be set after login)
3. Add folders for each endpoint category
4. Set Authorization at Collection level: Bearer Token → `{{token}}`

---

## 🔧 Environment Variables

Make sure your `.env` file has:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

---

**Last Updated:** May 5, 2026
