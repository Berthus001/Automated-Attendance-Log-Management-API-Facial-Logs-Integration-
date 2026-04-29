# User Management API

Role-based user creation with face descriptor extraction.

## Endpoint

`POST /api/users`

## Authentication

**Required:** JWT Token (Bearer)

**Authorized Roles:**
- `superadmin` - Can create: admin, teacher, student
- `admin` - Can create: teacher, student

## Request Headers

```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

## Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "teacher",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Full name of the user |
| `email` | string | Yes | Email address (must be unique) |
| `password` | string | Yes | Password (min 6 characters) |
| `role` | string | Yes | User role: `admin`, `teacher`, or `student` |
| `image` | string | Yes | Base64-encoded image for face recognition |

### Role Restrictions

| Requester Role | Can Create |
|----------------|------------|
| **superadmin** | admin, teacher, student |
| **admin** | teacher, student |
| **teacher** | ❌ Cannot create users |
| **student** | ❌ Cannot create users |

## Response

### Success (201 Created)

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "_id": "60d5ec49f1b2c72b8c8e4f3a",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "teacher",
    "faceDescriptor": [0.123, -0.456, 0.789, ...],
    "createdBy": "60d5ec49f1b2c72b8c8e4f39",
    "isActive": true,
    "createdAt": "2026-04-29T10:30:00.000Z",
    "updatedAt": "2026-04-29T10:30:00.000Z"
  }
}
```

### Error Responses

#### 400 - Missing Required Fields
```json
{
  "success": false,
  "message": "Please provide name, email, password, and role"
}
```

#### 400 - Missing Image
```json
{
  "success": false,
  "message": "Please provide a base64 image for face recognition"
}
```

#### 400 - Invalid Role
```json
{
  "success": false,
  "message": "Invalid role. Must be one of: superadmin, admin, teacher, student"
}
```

#### 400 - Email Already Exists
```json
{
  "success": false,
  "message": "Email already registered"
}
```

#### 400 - No Face Detected
```json
{
  "success": false,
  "message": "No face detected in the image",
  "error": "NO_FACE_DETECTED",
  "faceCount": 0
}
```

#### 400 - Multiple Faces Detected
```json
{
  "success": false,
  "message": "Multiple faces detected (3). Please provide an image with a single face.",
  "error": "MULTIPLE_FACES_DETECTED",
  "faceCount": 3
}
```

#### 403 - Unauthorized Role Creation (Admin trying to create Admin)
```json
{
  "success": false,
  "message": "Admin users can only create teacher and student accounts"
}
```

#### 403 - Unauthorized Role Creation (SuperAdmin trying to create SuperAdmin)
```json
{
  "success": false,
  "message": "Cannot create another superadmin account"
}
```

#### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

## Usage Examples

### Example 1: SuperAdmin Creates Admin

```javascript
const axios = require('axios');
const fs = require('fs');

// Read and convert image to base64
const imageBuffer = fs.readFileSync('./admin-photo.jpg');
const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

const response = await axios.post('http://localhost:5000/api/users', {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'securepassword',
  role: 'admin',
  image: base64Image
}, {
  headers: {
    'Authorization': `Bearer ${superadminToken}`,
    'Content-Type': 'application/json'
  }
});

console.log(response.data);
```

### Example 2: Admin Creates Teacher

```javascript
const response = await axios.post('http://localhost:5000/api/users', {
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
  password: 'teacher123',
  role: 'teacher',
  image: base64Image
}, {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
```

### Example 3: Admin Creates Student

```javascript
const response = await axios.post('http://localhost:5000/api/users', {
  name: 'Student Name',
  email: 'student@example.com',
  password: 'student123',
  role: 'student',
  image: base64Image
}, {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
```

### Example 4: Error - Admin Tries to Create Admin (Forbidden)

```javascript
const response = await axios.post('http://localhost:5000/api/users', {
  name: 'Another Admin',
  email: 'admin2@example.com',
  password: 'password',
  role: 'admin',  // ❌ Admin cannot create admin
  image: base64Image
}, {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});

// Response: 403 Forbidden
// "Admin users can only create teacher and student accounts"
```

## Frontend Integration (React)

```javascript
import axios from 'axios';

const createUser = async (userData, token) => {
  try {
    // Convert image file to base64
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];
    
    const reader = new FileReader();
    const base64Image = await new Promise((resolve) => {
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });

    const response = await axios.post('http://localhost:5000/api/users', {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      image: base64Image
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('User created:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};
```

## Face Recognition

- **Face Detection:** Automatically extracts face descriptor during user creation
- **Validation:** Only accepts images with **exactly one face**
- **Storage:** Face descriptor (128-dimensional array) stored in database
- **Usage:** Used for facial recognition login/attendance

## Security Features

- ✅ Password automatically hashed with bcrypt
- ✅ JWT authentication required
- ✅ Role-based access control
- ✅ Face descriptor extraction and validation
- ✅ Email uniqueness check
- ✅ Created by tracking (stores who created the user)

## Other User Endpoints

### Get All Users
`GET /api/users` (SuperAdmin/Admin only)

### Get Single User
`GET /api/users/:id` (Authenticated users)

### Update User
`PUT /api/users/:id` (SuperAdmin/Admin only)

### Delete User
`DELETE /api/users/:id` (SuperAdmin/Admin only)
