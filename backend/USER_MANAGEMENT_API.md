# User Management API

Full CRUD operations for managing users (admin, teacher, student) with face enrollment.

---

## Base Path: `/api/users`

All routes require `Authorization: Bearer <token>`.

---

## Role Permissions

| Action | Superadmin | Admin | Teacher | Student |
|---|---|---|---|---|
| List all users | All users | Own created users only | — | — |
| Get single user | Any user | Own created users only | Self only | Self only |
| Create admin | Yes | No | No | No |
| Create teacher | Yes | Yes | No | No |
| Create student | Yes | Yes | No | No |
| Create superadmin | No | No | No | No |
| Update user | Any user | Own created users only | — | — |
| Delete user | Any non-superadmin | Own created users only | — | — |
| List students | All students | Own created students | — | — |
| List teachers | All teachers | Own created teachers | — | — |

---

## Endpoints

### GET /api/users — List Users

Returns all users the requester is allowed to see.

```
GET /api/users
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "60d5ec49f1b2c72b8c8e4f3a",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "teacher",
      "department": "Math",
      "isActive": true,
      "createdBy": { "_id": "...", "name": "Admin", "email": "admin@...", "role": "admin" },
      "createdAt": "2026-04-01T10:00:00.000Z"
    }
  ]
}
```

---

### GET /api/users/students — List Students

```
GET /api/users/students
Authorization: Bearer <token>  (admin or superadmin)
```

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "role": "student",
  "data": [...]
}
```

---

### GET /api/users/teachers — List Teachers

```
GET /api/users/teachers
Authorization: Bearer <token>  (admin or superadmin)
```

---

### GET /api/users/:id — Get Single User

```
GET /api/users/60d5ec49f1b2c72b8c8e4f3a
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c72b8c8e4f3a",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "department": "Computer Science",
    "isActive": true,
    "createdAt": "2026-04-01T10:00:00.000Z"
  }
}
```

---

### POST /api/users — Create User

Creates a new user and enrolls their face descriptor.

```
POST /api/users
Authorization: Bearer <token>  (admin or superadmin)
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "student",
  "department": "Computer Science",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | Full name |
| `email` | string | Yes | Must be unique |
| `password` | string | Yes | Min 6 characters |
| `role` | string | Yes | `admin`, `teacher`, or `student` |
| `department` | string | No | Department/course name |
| `image` | string | Yes | Base64-encoded face photo |

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "_id": "60d5ec49f1b2c72b8c8e4f3a",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "department": "Computer Science",
    "isActive": true,
    "createdBy": "60d5ec49f1b2c72b8c8e4f39",
    "createdAt": "2026-05-05T10:30:00.000Z"
  }
}
```

> Note: `faceDescriptor` is stored on the user but is not returned in API responses.

---

### PUT /api/users/:id — Update User

```
PUT /api/users/60d5ec49f1b2c72b8c8e4f3a
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "name": "John Doe Updated",
  "department": "Information Technology"
}
```

> Non-superadmin users cannot change `role` or `createdBy`.

**Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": { ... }
}
```

---

### DELETE /api/users/:id — Delete User

```
DELETE /api/users/60d5ec49f1b2c72b8c8e4f3a
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {}
}
```

> Cannot delete superadmin accounts.

---

## Error Reference

| Code | Message | Cause |
|---|---|---|
| 400 | `Please provide name, email, password, and role` | Missing required fields |
| 400 | `Please provide a base64 image for face recognition` | Missing image |
| 400 | `Invalid role. Must be one of: ...` | Unknown role value |
| 400 | `Email already registered` | Duplicate email |
| 400 | `Failed to extract face descriptor` | No face in image |
| 403 | `Admin users can only create teacher and student accounts` | Role escalation attempt |
| 403 | `Cannot create another superadmin account` | Superadmin creation blocked |
| 403 | `Access denied. You can only view users you created.` | Admin accessing another admin's user |
| 403 | `Cannot delete superadmin accounts` | Protected account |
| 404 | `User not found` | Invalid ID |
