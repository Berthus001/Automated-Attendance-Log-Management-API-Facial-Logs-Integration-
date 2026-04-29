# Error Handling & Middleware Guide

## Overview

The API uses centralized error handling middleware to catch and format all errors consistently. All errors return JSON in this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Middleware Components

### 1. asyncHandler - Async Error Catcher

Wraps async route handlers to automatically catch errors and pass them to the error handler.

**Location:** `middleware/asyncHandler.js`

**Usage:**

```javascript
const asyncHandler = require('../middleware/asyncHandler');

// Wrap async controller functions
exports.myController = asyncHandler(async (req, res) => {
  const data = await SomeModel.find();
  
  res.json({
    success: true,
    data: data
  });
  
  // Any errors thrown here are automatically caught!
});
```

### 2. errorHandler - Global Error Handler

Catches all errors, formats them consistently, and returns JSON responses.

**Location:** `middleware/errorHandler.js`

**Handles:**
- ✅ Mongoose validation errors (400)
- ✅ Mongoose duplicate key errors (400)
- ✅ Mongoose cast errors - invalid ObjectId (400)
- ✅ JWT authentication errors (401)
- ✅ Multer file upload errors (400)
- ✅ Custom errors with statusCode
- ✅ Generic 500 errors

**Example Error Responses:**

```javascript
// Validation Error
{
  "success": false,
  "message": "Validation Error: studentId is required, name is required"
}

// Duplicate Key Error
{
  "success": false,
  "message": "Duplicate value for field: studentId"
}

// Invalid ObjectId
{
  "success": false,
  "message": "Invalid _id: abc123"
}

// Custom Error
{
  "success": false,
  "message": "Student not found"
}
```

### 3. requestLogger - Request Logging

Logs all incoming requests with timestamps, methods, URLs, IPs, and response times.

**Location:** `middleware/logger.js`

**Console Output:**

```
[2026-04-23T14:30:00.000Z] POST /api/enroll - IP: ::1
[2026-04-23T14:30:00.123Z] POST /api/enroll 201 - 123ms

[2026-04-23T14:30:05.000Z] GET /api/logs - IP: ::1
[2026-04-23T14:30:05.045Z] GET /api/logs 200 - 45ms

[2026-04-23T14:30:10.000Z] GET /api/notfound - IP: ::1
[2026-04-23T14:30:10.012Z] GET /api/notfound 404 - 12ms
```

## Using asyncHandler in Controllers

### Example: Update Existing Controller

**Before (no error handling):**

```javascript
// ❌ Errors not caught properly
exports.getStudent = async (req, res) => {
  const student = await Student.findOne({ studentId: req.params.id });
  
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }
  
  res.json({
    success: true,
    data: student
  });
};
```

**After (with asyncHandler):**

```javascript
const asyncHandler = require('../middleware/asyncHandler');

// ✅ Errors automatically caught
exports.getStudent = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ studentId: req.params.id });
  
  if (!student) {
    const error = new Error('Student not found');
    error.statusCode = 404;
    throw error;
  }
  
  res.json({
    success: true,
    data: student
  });
});
```

### Example: Throwing Custom Errors

```javascript
const asyncHandler = require('../middleware/asyncHandler');

exports.enrollStudent = asyncHandler(async (req, res) => {
  const { studentId, name, course } = req.body;
  
  // Validate required fields
  if (!studentId) {
    const error = new Error('studentId is required');
    error.statusCode = 400;
    throw error;
  }
  
  // Check for duplicate
  const existing = await Student.findOne({ studentId });
  if (existing) {
    const error = new Error('Student already enrolled');
    error.statusCode = 409;
    throw error;
  }
  
  // Create student
  const student = await Student.create({
    studentId,
    name,
    course
  });
  
  res.status(201).json({
    success: true,
    data: student
  });
});
```

## Error Types & Status Codes

| Error Type | Status Code | When It Occurs |
|------------|-------------|----------------|
| Validation Error | 400 | Missing/invalid required fields |
| Duplicate Key | 400 | Unique constraint violation |
| Cast Error | 400 | Invalid ObjectId format |
| Custom Error | 400-499 | Business logic errors |
| Unauthorized | 401 | Invalid/expired JWT token |
| Not Found | 404 | Resource doesn't exist |
| Conflict | 409 | Duplicate resource |
| Server Error | 500 | Unexpected errors |

## Creating Custom Errors

### Method 1: Throw Error with statusCode

```javascript
const error = new Error('Resource not found');
error.statusCode = 404;
throw error;
```

### Method 2: Use Error Class (Advanced)

```javascript
// Create custom error class
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 404;
    this.name = 'NotFoundError';
  }
}

// Usage
throw new NotFoundError('Student not found');
```

### Method 3: Use Express next()

```javascript
const error = new Error('Something went wrong');
error.statusCode = 500;
return next(error);
```

## Updating Existing Controllers

To update all controllers to use asyncHandler:

**Step 1:** Import asyncHandler

```javascript
const asyncHandler = require('../middleware/asyncHandler');
```

**Step 2:** Wrap each async function

```javascript
// Before
exports.myFunction = async (req, res) => { ... };

// After
exports.myFunction = asyncHandler(async (req, res) => { ... });
```

**Step 3:** Replace try-catch with throw

```javascript
// Before
try {
  const data = await Model.find();
  res.json({ success: true, data });
} catch (error) {
  res.status(500).json({ success: false, message: error.message });
}

// After
const data = await Model.find();

if (!data) {
  const error = new Error('Data not found');
  error.statusCode = 404;
  throw error;
}

res.json({ success: true, data });
```

## Testing Error Handling

### Test 1: Invalid ObjectId

```bash
curl http://localhost:5000/api/logs/invalidid123
```

**Response:**
```json
{
  "success": false,
  "message": "Invalid _id: invalidid123"
}
```

### Test 2: Validation Error

```bash
curl -X POST http://localhost:5000/api/enroll \
  -H "Content-Type: application/json" \
  -d '{"name": "John"}'
```

**Response:**
```json
{
  "success": false,
  "message": "Validation Error: studentId is required"
}
```

### Test 3: Duplicate Key

```bash
# Enroll same student twice
curl -X POST http://localhost:5000/api/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STU001",
    "name": "John Doe",
    "course": "CS"
  }'
```

**Response:**
```json
{
  "success": false,
  "message": "Duplicate value for field: studentId"
}
```

### Test 4: 404 Not Found

```bash
curl http://localhost:5000/api/nonexistent
```

**Response:**
```json
{
  "success": false,
  "message": "Route not found"
}
```

## Best Practices

### 1. Always Use asyncHandler

```javascript
// ✅ Good
exports.handler = asyncHandler(async (req, res) => { ... });

// ❌ Bad - errors not caught
exports.handler = async (req, res) => { ... };
```

### 2. Set Appropriate Status Codes

```javascript
// ✅ Good - specific status codes
if (!resource) {
  const error = new Error('Resource not found');
  error.statusCode = 404;
  throw error;
}

// ❌ Bad - generic 500
throw new Error('Resource not found');
```

### 3. Provide Descriptive Messages

```javascript
// ✅ Good - clear message
throw new Error('Student with ID STU001 not found');

// ❌ Bad - vague message
throw new Error('Not found');
```

### 4. Don't Catch Errors Manually

```javascript
// ✅ Good - let asyncHandler catch it
exports.handler = asyncHandler(async (req, res) => {
  const data = await Model.find();
  res.json({ success: true, data });
});

// ❌ Bad - manual try-catch not needed
exports.handler = asyncHandler(async (req, res) => {
  try {
    const data = await Model.find();
    res.json({ success: true, data });
  } catch (error) {
    throw error; // Redundant!
  }
});
```

### 5. Validate Input Early

```javascript
exports.handler = asyncHandler(async (req, res) => {
  // Validate at the start
  if (!req.body.studentId) {
    const error = new Error('studentId is required');
    error.statusCode = 400;
    throw error;
  }
  
  // Continue with business logic
  const student = await Student.create(req.body);
  res.json({ success: true, data: student });
});
```

## Logging Configuration

Request logging is automatically enabled in [server.js](server.js):

```javascript
// Morgan (dev mode only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Custom request logger (always on)
app.use(requestLogger);
```

**Morgan output (development):**
```
POST /api/enroll 201 123.456 ms - 456
GET /api/logs 200 45.678 ms - 1234
```

**Custom logger output (all modes):**
```
[2026-04-23T14:30:00.000Z] POST /api/enroll - IP: ::1
[2026-04-23T14:30:00.123Z] POST /api/enroll 201 - 123ms
```

## Environment Variables

The error handler respects `NODE_ENV`:

```bash
# .env
NODE_ENV=development  # Shows stack traces in logs
NODE_ENV=production   # Hides stack traces
```

**Development mode:**
```javascript
console.error('Error occurred:', {
  message: 'Student not found',
  stack: 'Error: Student not found\n    at ...',  // ✅ Shown
  path: '/api/enroll/STU001',
  method: 'GET'
});
```

**Production mode:**
```javascript
console.error('Error occurred:', {
  message: 'Student not found',
  stack: undefined,  // ❌ Hidden
  path: '/api/enroll/STU001',
  method: 'GET'
});
```

## Middleware Order (Important!)

In [server.js](server.js), middleware order matters:

```javascript
// 1. Built-in middleware
app.use(cors());
app.use(express.json());

// 2. Logging middleware
app.use(requestLogger);

// 3. Routes
app.use('/api/enroll', enrollRoutes);
app.use('/api/logs', logsRoutes);

// 4. 404 handler
app.use((req, res, next) => {
  const error = new Error('Route not found');
  error.statusCode = 404;
  next(error);
});

// 5. Error handler (MUST BE LAST!)
app.use(errorHandler);
```

## Summary

✅ **asyncHandler** - Wraps async functions to catch errors  
✅ **errorHandler** - Formats all errors as `{ success: false, message }`  
✅ **requestLogger** - Logs all requests with timestamps and duration  
✅ **Consistent Responses** - All errors follow same JSON format  
✅ **Automatic Handling** - Mongoose, JWT, validation errors handled  
✅ **Development Friendly** - Detailed logs in dev mode
