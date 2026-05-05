# Error Handling

Centralised error handling for the backend API.

---

## Architecture

Errors flow through two middleware layers:

1. `asyncHandler` (`backend/middleware/asyncHandler.js`) — wraps async route handlers, automatically passes thrown errors to `next(err)`
2. `errorHandler` (`backend/middleware/errorHandler.js`) — global Express error handler, formats and returns structured JSON error responses

---

## Standard Error Response Format

All errors return a consistent JSON structure:

```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

For validation errors (Mongoose), additional detail may be included:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Email already registered",
    "name": "Name is required"
  }
}
```

---

## HTTP Status Codes

| Code | Meaning | Typical Cause |
|---|---|---|
| 200 | OK | Successful read/update/delete |
| 201 | Created | Successful create |
| 400 | Bad Request | Missing/invalid input, duplicate data |
| 401 | Unauthorized | Missing/invalid JWT, wrong password, face mismatch |
| 403 | Forbidden | Insufficient role permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Active session conflict (already logged in) |
| 500 | Internal Server Error | Unexpected server-side error |

---

## Common Error Messages

### Authentication

| Message | Code | Cause |
|---|---|---|
| `Please provide email and password` | 400 | Missing login fields |
| `Invalid credentials` | 401 | Wrong email or password |
| `Not authorized to access this route` | 401 | JWT missing, invalid, or expired |
| `Account is deactivated` | 403 | `isActive = false` on user |
| `Access denied. This login is for administrators only` | 403 | Student/teacher tried admin login |
| `User already logged in from another session` | 409 | Active session within 24 hours |

### Face Recognition

| Message | Code | Cause |
|---|---|---|
| `No image provided` | 400 | Missing `image` field |
| `No face detected in the image` | 400 | Image has no detectable face |
| `No face descriptor found` | 400 | User has no enrolled face |
| `Failed to extract face descriptor` | 400 | Descriptor extraction failed |
| `Face verification failed. Face does not match.` | 401 | Euclidean distance = 0.6 |
| `Face not recognized. No matching user found.` | 401 | No user matches the scanned face |

### User Management

| Message | Code | Cause |
|---|---|---|
| `User not found` | 404 | Invalid user ID |
| `Email already registered` | 400 | Duplicate email |
| `Please provide name, email, password, and role` | 400 | Missing required fields |
| `Invalid role. Must be one of: ...` | 400 | Unrecognised role value |
| `Admin users can only create teacher and student accounts` | 403 | Admin tried to create another admin |
| `Cannot create another superadmin account` | 403 | Superadmin creation blocked |
| `Cannot delete superadmin accounts` | 403 | Protected account type |

### Attendance Logs

| Message | Code | Cause |
|---|---|---|
| `Log not found` | 404 | Invalid log ID |

### Enrollment (Student model)

| Message | Code | Cause |
|---|---|---|
| `Student not found` | 404 | Invalid studentId |
| `Student ID already exists` | 400 | Duplicate studentId |
| `Please provide studentId, name, and image` | 400 | Missing required fields |

---

## asyncHandler Usage

```js
const asyncHandler = require('../middleware/asyncHandler');

router.post('/example', asyncHandler(async (req, res, next) => {
  // Any thrown error is automatically forwarded to errorHandler
  const data = await SomeModel.findById(req.params.id);
  if (!data) {
    const err = new Error('Not found');
    err.statusCode = 404;
    throw err;
  }
  res.json({ success: true, data });
}));
```

---

## Mongoose Error Mapping

The `errorHandler` middleware translates Mongoose errors:

| Mongoose Error | HTTP Code | Behaviour |
|---|---|---|
| `CastError` (invalid ObjectId) | 400 | Returns `"Resource not found"` |
| `ValidationError` | 400 | Returns field-level validation messages |
| Duplicate key (`code 11000`) | 400 | Returns `"<field> already exists"` |
