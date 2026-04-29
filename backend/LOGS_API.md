# Attendance Logs API Documentation

## Overview

The logs endpoint provides comprehensive querying capabilities for attendance records with dynamic filtering, date ranges, pagination, and aggregated statistics.

## Base URL
```
GET /api/v1/logs
```

## Features

- ✅ **Dynamic MongoDB Filtering** - Filter by multiple criteria
- ✅ **Date Range Queries** - Using `$gte` and `$lte` operators
- ✅ **Pagination** - Page-based navigation with metadata
- ✅ **Sorting** - Newest first (timestamp descending)
- ✅ **Total Count** - Complete count for pagination
- ✅ **Aggregations** - Summary statistics and grouping

## API Endpoints

### 1. Get Attendance Logs (Main Endpoint)

```http
GET /api/v1/logs
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studentId` | string | No | Filter by specific student ID |
| `course` | string | No | Filter by course name |
| `status` | string | No | Filter by status (present/late/absent) |
| `deviceId` | string | No | Filter by device ID |
| `startDate` | string | No | Start date (YYYY-MM-DD) |
| `endDate` | string | No | End date (YYYY-MM-DD) |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Results per page (default: 20) |

**Example Request:**
```bash
GET /api/v1/logs?studentId=STU001&startDate=2026-04-01&endDate=2026-04-30&page=1&limit=10
```

**Success Response (200):**
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
      "studentId": "STU001",
      "course": "Computer Science",
      "timestamp": "2026-04-23T14:30:00.000Z",
      "imagePath": "uploads/attendance/img_1714737000000.jpeg",
      "deviceId": "DEVICE_001",
      "status": "present",
      "confidenceScore": 0.8542,
      "createdAt": "2026-04-23T14:30:00.000Z",
      "updatedAt": "2026-04-23T14:30:00.000Z"
    }
  ]
}
```

### 2. Get Single Log by ID

```http
GET /api/v1/logs/:id
```

**Example Request:**
```bash
GET /api/v1/logs/662f9a3b5e8f4a001234abcd
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "662f9a3b5e8f4a001234abcd",
    "studentId": "STU001",
    "course": "Computer Science",
    "timestamp": "2026-04-23T14:30:00.000Z",
    "imagePath": "uploads/attendance/img_1714737000000.jpeg",
    "deviceId": "DEVICE_001",
    "status": "present",
    "confidenceScore": 0.8542,
    "createdAt": "2026-04-23T14:30:00.000Z",
    "updatedAt": "2026-04-23T14:30:00.000Z"
  }
}
```

### 3. Get Logs Summary

```http
GET /api/v1/logs/summary
```

**Query Parameters:**
- `startDate` (optional) - Start date filter
- `endDate` (optional) - End date filter
- `course` (optional) - Course filter

**Example Request:**
```bash
GET /api/v1/logs/summary?startDate=2026-04-01&endDate=2026-04-30
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalLogs": 450,
    "uniqueStudents": 125,
    "statusBreakdown": {
      "present": 420,
      "late": 25,
      "absent": 5
    },
    "courseBreakdown": [
      {
        "_id": "Computer Science",
        "count": 180
      },
      {
        "_id": "Information Technology",
        "count": 145
      },
      {
        "_id": "Software Engineering",
        "count": 125
      }
    ],
    "dateRange": {
      "startDate": "2026-04-01",
      "endDate": "2026-04-30"
    }
  }
}
```

### 4. Get Logs Grouped by Date

```http
GET /api/v1/logs/by-date
```

**Query Parameters:**
- `startDate` (optional)
- `endDate` (optional)
- `course` (optional)

**Example Request:**
```bash
GET /api/v1/logs/by-date?startDate=2026-04-01&endDate=2026-04-30&course=Computer%20Science
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 30,
  "data": [
    {
      "date": "2026-04-23",
      "count": 45,
      "uniqueStudents": 42
    },
    {
      "date": "2026-04-22",
      "count": 48,
      "uniqueStudents": 45
    },
    {
      "date": "2026-04-21",
      "count": 43,
      "uniqueStudents": 40
    }
  ]
}
```

### 5. Delete Attendance Log

```http
DELETE /api/v1/logs/:id
```

**Example Request:**
```bash
DELETE /api/v1/logs/662f9a3b5e8f4a001234abcd
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Attendance log deleted successfully",
  "data": {
    "_id": "662f9a3b5e8f4a001234abcd",
    "studentId": "STU001",
    "course": "Computer Science",
    "timestamp": "2026-04-23T14:30:00.000Z"
  }
}
```

## Query Examples

### Filter by Student
```bash
GET /api/v1/logs?studentId=STU001
```

### Filter by Course
```bash
GET /api/v1/logs?course=Computer%20Science
```

### Filter by Date Range
```bash
GET /api/v1/logs?startDate=2026-04-01&endDate=2026-04-30
```

### Filter by Status
```bash
GET /api/v1/logs?status=present
```

### Multiple Filters + Pagination
```bash
GET /api/v1/logs?course=Computer%20Science&status=present&startDate=2026-04-01&page=2&limit=50
```

### Filter by Device
```bash
GET /api/v1/logs?deviceId=DEVICE_001
```

## MongoDB Query Examples

### Date Range with $gte and $lte

```javascript
// Request: ?startDate=2026-04-01&endDate=2026-04-30

// Generated MongoDB Query:
{
  timestamp: {
    $gte: ISODate("2026-04-01T00:00:00.000Z"),
    $lte: ISODate("2026-04-30T23:59:59.999Z")
  }
}
```

### Multiple Filters

```javascript
// Request: ?studentId=STU001&course=Computer Science&status=present

// Generated MongoDB Query:
{
  studentId: "STU001",
  course: "Computer Science",
  status: "present"
}
```

### Combined Filters with Date Range

```javascript
// Request: ?course=Computer Science&startDate=2026-04-01&endDate=2026-04-30

// Generated MongoDB Query:
{
  course: "Computer Science",
  timestamp: {
    $gte: ISODate("2026-04-01T00:00:00.000Z"),
    $lte: ISODate("2026-04-30T23:59:59.999Z")
  }
}
```

## Pagination Details

### Calculation
- `skip = (page - 1) * limit`
- `totalPages = Math.ceil(total / limit)`

### Response Metadata
- `count` - Number of logs in current response
- `total` - Total logs matching query
- `page` - Current page number
- `limit` - Results per page
- `totalPages` - Total number of pages
- `hasNextPage` - Boolean if next page exists
- `hasPrevPage` - Boolean if previous page exists

### Example Pagination

**Page 1:**
```bash
GET /api/v1/logs?page=1&limit=20
```
Returns logs 1-20

**Page 2:**
```bash
GET /api/v1/logs?page=2&limit=20
```
Returns logs 21-40

**Page 3:**
```bash
GET /api/v1/logs?page=3&limit=20
```
Returns logs 41-60

## Sorting

All logs are sorted by **newest first** (timestamp descending).

```javascript
.sort({ timestamp: -1 })
```

This means:
- Most recent attendance logs appear first
- Older logs appear later
- Consistent ordering across pages

## Testing with cURL

### Get All Logs
```bash
curl http://localhost:5000/api/v1/logs
```

### Get Logs with Filters
```bash
curl "http://localhost:5000/api/v1/logs?studentId=STU001&startDate=2026-04-01&endDate=2026-04-30&page=1&limit=10"
```

### Get Summary
```bash
curl "http://localhost:5000/api/v1/logs/summary?startDate=2026-04-01&endDate=2026-04-30"
```

### Get Logs by Date
```bash
curl "http://localhost:5000/api/v1/logs/by-date?startDate=2026-04-01&endDate=2026-04-30"
```

### Get Single Log
```bash
curl http://localhost:5000/api/v1/logs/662f9a3b5e8f4a001234abcd
```

### Delete Log
```bash
curl -X DELETE http://localhost:5000/api/v1/logs/662f9a3b5e8f4a001234abcd
```

## JavaScript/Fetch Examples

### Get Filtered Logs
```javascript
const fetchLogs = async (filters) => {
  const params = new URLSearchParams(filters);
  
  const response = await fetch(
    `http://localhost:5000/api/v1/logs?${params.toString()}`
  );
  
  const result = await response.json();
  return result;
};

// Usage
const logs = await fetchLogs({
  studentId: 'STU001',
  startDate: '2026-04-01',
  endDate: '2026-04-30',
  page: 1,
  limit: 20
});

console.log(`Found ${logs.total} logs`);
console.log(`Showing page ${logs.page} of ${logs.totalPages}`);
```

### Get Summary Statistics
```javascript
const getSummary = async (startDate, endDate) => {
  const response = await fetch(
    `http://localhost:5000/api/v1/logs/summary?startDate=${startDate}&endDate=${endDate}`
  );
  
  const result = await response.json();
  return result.data;
};

// Usage
const summary = await getSummary('2026-04-01', '2026-04-30');
console.log(`Total logs: ${summary.totalLogs}`);
console.log(`Unique students: ${summary.uniqueStudents}`);
console.log(`Present: ${summary.statusBreakdown.present}`);
```

### Paginate Through All Logs
```javascript
const getAllLogs = async (filters) => {
  let allLogs = [];
  let currentPage = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await fetch(
      `http://localhost:5000/api/v1/logs?${new URLSearchParams({
        ...filters,
        page: currentPage,
        limit: 100
      })}`
    );
    
    const result = await response.json();
    allLogs = allLogs.concat(result.data);
    
    hasMore = result.hasNextPage;
    currentPage++;
  }
  
  return allLogs;
};

// Usage
const logs = await getAllLogs({ course: 'Computer Science' });
console.log(`Retrieved ${logs.length} total logs`);
```

## Performance Considerations

### Indexing
The following fields are indexed for optimal query performance:
- `studentId` (indexed in Student model)
- `timestamp` (indexed in AttendanceLog model)
- `course` (indexed in AttendanceLog model)

### Query Optimization
```javascript
// Efficient: Uses indexed fields
GET /api/v1/logs?studentId=STU001&startDate=2026-04-01

// Less efficient: No indexes on these fields
GET /api/v1/logs?deviceId=DEVICE_001
```

### Pagination Best Practices
- Use reasonable `limit` values (10-100)
- Avoid very large page numbers (prefer date range filtering)
- Consider caching for frequently accessed data

## Error Responses

### 404 - Log Not Found
```json
{
  "success": false,
  "message": "Attendance log not found"
}
```

### 500 - Server Error
```json
{
  "success": false,
  "message": "Error message details"
}
```

## Use Cases

### 1. Student Attendance History
```bash
GET /api/v1/logs?studentId=STU001&startDate=2026-04-01&endDate=2026-04-30
```

### 2. Daily Attendance Report
```bash
GET /api/v1/logs?startDate=2026-04-23&endDate=2026-04-23
```

### 3. Course Attendance
```bash
GET /api/v1/logs?course=Computer%20Science&startDate=2026-04-01
```

### 4. Late Arrivals
```bash
GET /api/v1/logs?status=late&startDate=2026-04-01&endDate=2026-04-30
```

### 5. Device-Specific Logs
```bash
GET /api/v1/logs?deviceId=DEVICE_001
```

### 6. Monthly Summary
```bash
GET /api/v1/logs/summary?startDate=2026-04-01&endDate=2026-04-30
```

### 7. Attendance Trends
```bash
GET /api/v1/logs/by-date?startDate=2026-04-01&endDate=2026-04-30
```

## Response Time Estimates

| Records | Filter Type | Estimated Time |
|---------|-------------|----------------|
| 1K      | Indexed     | < 50ms         |
| 10K     | Indexed     | < 100ms        |
| 100K    | Indexed     | < 300ms        |
| 1M      | Indexed     | < 1s           |

*Times vary based on filter complexity and server resources*

## Future Enhancements

- [ ] Export to CSV/Excel
- [ ] Real-time updates via WebSockets
- [ ] Advanced analytics (attendance patterns, trends)
- [ ] Scheduled reports
- [ ] Bulk operations
- [ ] Caching for frequently accessed data
- [ ] GraphQL endpoint alternative
