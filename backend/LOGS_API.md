# Attendance Logs API

Query, filter, and manage attendance records.

---

## Base Path: `/api/logs`

All routes require `Authorization: Bearer <token>`.

---

## Endpoints

### GET /api/logs — List Logs (Admin/Superadmin)

```
GET /api/logs?userId=<id>&status=present&startDate=2026-05-01&endDate=2026-05-31&page=1&limit=20
Authorization: Bearer <token>  (superadmin or admin)
```

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `userId` | ObjectId | Filter by user ID |
| `userRole` | string | Filter by role: `student`, `teacher`, `admin` |
| `studentId` | string | Legacy field — filter by student ID |
| `course` | string | Filter by course/department |
| `status` | string | `present`, `late`, `absent` |
| `deviceId` | string | Filter by device ID |
| `startDate` | YYYY-MM-DD | Logs on or after this date |
| `endDate` | YYYY-MM-DD | Logs on or before this date |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20) |

**Response (200):**
```json
{
  "success": true,
  "count": 10,
  "total": 45,
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "hasNextPage": true,
  "hasPrevPage": false,
  "data": [
    {
      "_id": "662f9a3b5e8f4a001234abcd",
      "userId": { "_id": "...", "name": "Jane Doe", "email": "jane@...", "role": "student" },
      "userRole": "student",
      "userName": "Jane Doe",
      "timestamp": "2026-05-05T08:30:00.000Z",
      "status": "present",
      "confidenceScore": 0.8542,
      "deviceId": "KIOSK_001",
      "imagePath": "uploads/attendance/img_1746433800000.jpeg",
      "createdAt": "2026-05-05T08:30:00.000Z"
    }
  ]
}
```

---

### GET /api/logs/summary — Aggregated Statistics (Admin/Superadmin)

```
GET /api/logs/summary
Authorization: Bearer <token>
```

Returns totals grouped by status (present, late, absent) with date range support.

---

### GET /api/logs/by-date — Logs Grouped by Date (Admin/Superadmin)

```
GET /api/logs/by-date?startDate=2026-05-01&endDate=2026-05-31
Authorization: Bearer <token>
```

---

### GET /api/logs/my-attendance — Current User's Attendance

```
GET /api/logs/my-attendance
Authorization: Bearer <token>  (any role)
```

Returns only the authenticated user's attendance records.

---

### POST /api/logs/log-attendance — Self-Service Attendance

```
POST /api/logs/log-attendance
Authorization: Bearer <token>  (any role)
```

Allows any authenticated user to manually log their own attendance.

---

### GET /api/logs/:id — Single Log

```
GET /api/logs/662f9a3b5e8f4a001234abcd
Authorization: Bearer <token>  (superadmin or admin)
```

---

### DELETE /api/logs/:id — Delete Log

```
DELETE /api/logs/662f9a3b5e8f4a001234abcd
Authorization: Bearer <token>  (superadmin or admin)
```

**Response (200):**
```json
{
  "success": true,
  "message": "Attendance log deleted",
  "data": {}
}
```

---

## AttendanceLog Schema Fields

| Field | Type | Description |
|---|---|---|
| `userId` | ObjectId (User ref) | The user who attended |
| `userRole` | string | `student`, `teacher`, or `admin` |
| `userName` | string | Name snapshot at time of attendance |
| `studentId` | string | Legacy field for backward compatibility |
| `course` | string | Course/department |
| `timestamp` | Date | When attendance was recorded |
| `timeIn` | Date | Time-in timestamp |
| `timeOut` | Date | Time-out timestamp |
| `scanCount` | number | 1 = checked in, 2 = checked out |
| `imagePath` | string | Path to captured image |
| `deviceId` | string | Source device ID |
| `status` | string | `present`, `late`, `absent` |
| `confidenceScore` | number | Face match confidence (0–1) |
| `location` | GeoJSON Point | Optional GPS coordinates |
| `createdBy` | ObjectId (User ref) | Admin who created the user |

---

## Error Reference

| Code | Message | Cause |
|---|---|---|
| 401 | `Not authorized to access this route` | Missing/invalid token |
| 403 | `Access denied` | Insufficient role |
| 404 | `Log not found` | Invalid log ID |
