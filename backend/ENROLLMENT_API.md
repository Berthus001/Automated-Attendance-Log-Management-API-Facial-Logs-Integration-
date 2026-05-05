# Enrollment API (Legacy Student Model)

Manages enrolled students using the standalone `Student` model. This is the original enrollment system.

> **Current system:** New user creation (including students and teachers) uses `POST /api/users`. See [USER_MANAGEMENT_API.md](USER_MANAGEMENT_API.md).

---

## Base Path: `/api/enroll`

All endpoints are **Public** (no authentication required).

---

## Student Schema

| Field | Type | Notes |
|---|---|---|
| `studentId` | string | Unique, uppercase, auto-formatted |
| `name` | string | Required |
| `course` | string | Optional |
| `email` | string | Optional |
| `faceDescriptor` | [Number] | 128 values required |
| `isActive` | boolean | Default: true |

---

## Endpoints

### GET /api/enroll — List All Enrolled Students

```
GET /api/enroll
```

**Response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "662f9a3b5e8f4a001234abcd",
      "studentId": "STU001",
      "name": "John Doe",
      "course": "Computer Science",
      "email": "john@example.com",
      "isActive": true,
      "createdAt": "2026-04-01T10:00:00.000Z"
    }
  ]
}
```

---

### POST /api/enroll — Enroll New Student

```
POST /api/enroll
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentId": "STU001",
  "name": "John Doe",
  "course": "Computer Science",
  "email": "john@example.com",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

The server extracts the face descriptor from `image` automatically.

**Response (201):**
```json
{
  "success": true,
  "message": "Student enrolled successfully",
  "data": {
    "_id": "662f9a3b5e8f4a001234abcd",
    "studentId": "STU001",
    "name": "John Doe",
    "course": "Computer Science",
    "email": "john@example.com",
    "isActive": true,
    "createdAt": "2026-05-05T10:30:00.000Z"
  }
}
```

---

### GET /api/enroll/:studentId — Get Single Student

```
GET /api/enroll/STU001
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "662f9a3b5e8f4a001234abcd",
    "studentId": "STU001",
    "name": "John Doe",
    "course": "Computer Science",
    "isActive": true
  }
}
```

---

### PUT /api/enroll/:studentId — Update Student

```
PUT /api/enroll/STU001
Content-Type: application/json
```

```json
{
  "name": "John Doe Updated",
  "course": "Information Technology"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Student updated successfully",
  "data": { ... }
}
```

---

### DELETE /api/enroll/:studentId — Delete Student

```
DELETE /api/enroll/STU001
```

**Response (200):**
```json
{
  "success": true,
  "message": "Student removed from enrollment",
  "data": {}
}
```

---

## Error Reference

| Code | Message | Cause |
|---|---|---|
| 400 | `Please provide studentId, name, and image` | Missing required fields |
| 400 | `Failed to extract face descriptor` | No face detected in image |
| 400 | `Student ID already exists` | Duplicate studentId |
| 404 | `Student not found` | Invalid studentId |
