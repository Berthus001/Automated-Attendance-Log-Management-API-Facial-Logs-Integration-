# Enrollment API Documentation

## Overview

The enrollment endpoint allows registering students with facial recognition for automated attendance tracking.

## Base URL
```
POST /api/v1/enroll
```

## Flow

1. **Receive Request** → Accept JSON with studentId, name, course, image (base64)
2. **Validate Input** → Check required fields and validate base64 image
3. **Check Duplicate** → Verify student doesn't already exist
4. **Convert Image** → Convert base64 to JPEG file (max 300px, 70% quality)
5. **Detect Face** → Extract face from image using face-api.js
6. **Validate Face** → Reject if no face or multiple faces detected
7. **Extract Descriptor** → Generate 128-point face descriptor
8. **Save Student** → Store student with face descriptor in MongoDB
9. **Return Success** → Send student data with enrollment confirmation

## API Endpoints

### 1. Enroll New Student

```http
POST /api/v1/enroll
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentId": "STU001",
  "name": "John Doe",
  "course": "Computer Science",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "email": "john.doe@example.com"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Student enrolled successfully",
  "data": {
    "studentId": "STU001",
    "name": "John Doe",
    "course": "Computer Science",
    "email": "john.doe@example.com",
    "imagePath": "uploads/students/img_1714694400000_a1b2c3d4.jpeg",
    "faceDetection": {
      "confidence": 0.9856,
      "boundingBox": {
        "x": 45,
        "y": 32,
        "width": 180,
        "height": 220
      }
    },
    "enrolledAt": "2026-04-23T12:30:00.000Z"
  }
}
```

**Error Responses:**

**400 - Missing Required Fields:**
```json
{
  "success": false,
  "message": "Please provide studentId, name, course, and image"
}
```

**400 - Invalid Base64 Image:**
```json
{
  "success": false,
  "message": "Please provide a valid base64 image"
}
```

**400 - No Face Detected:**
```json
{
  "success": false,
  "message": "No face detected in the image",
  "error": "NO_FACE_DETECTED",
  "faceCount": 0
}
```

**400 - Multiple Faces Detected:**
```json
{
  "success": false,
  "message": "Multiple faces detected (3). Please provide an image with a single face.",
  "error": "MULTIPLE_FACES_DETECTED",
  "faceCount": 3
}
```

**409 - Student Already Exists:**
```json
{
  "success": false,
  "message": "Student with ID STU001 already exists",
  "data": {
    "studentId": "STU001",
    "name": "John Doe",
    "course": "Computer Science"
  }
}
```

### 2. Get Enrolled Student

```http
GET /api/v1/enroll/:studentId
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "studentId": "STU001",
    "name": "John Doe",
    "course": "Computer Science",
    "email": "john.doe@example.com",
    "isActive": true,
    "createdAt": "2026-04-23T12:30:00.000Z",
    "updatedAt": "2026-04-23T12:30:00.000Z"
  }
}
```

### 3. Update Enrolled Student

```http
PUT /api/v1/enroll/:studentId
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Smith",
  "course": "Software Engineering",
  "email": "john.smith@example.com",
  "image": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Student information updated successfully",
  "data": {
    "studentId": "STU001",
    "name": "John Smith",
    "course": "Software Engineering",
    "email": "john.smith@example.com",
    "updatedAt": "2026-04-23T15:45:00.000Z"
  }
}
```

### 4. Delete Enrolled Student

```http
DELETE /api/v1/enroll/:studentId
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Student deleted successfully",
  "data": {
    "studentId": "STU001",
    "name": "John Doe"
  }
}
```

### 5. Get All Enrolled Students

```http
GET /api/v1/enroll?course=Computer Science&limit=50&page=1
```

**Query Parameters:**
- `course` (optional) - Filter by course
- `isActive` (optional) - Filter by active status (true/false)
- `limit` (optional) - Results per page (default: 50)
- `page` (optional) - Page number (default: 1)

**Success Response (200):**
```json
{
  "success": true,
  "count": 25,
  "total": 125,
  "page": 1,
  "pages": 3,
  "data": [
    {
      "studentId": "STU001",
      "name": "John Doe",
      "course": "Computer Science",
      "isActive": true,
      "createdAt": "2026-04-23T12:30:00.000Z"
    }
  ]
}
```

## Validation Rules

### Image Requirements
- ✅ Valid base64 string (with or without data URI prefix)
- ✅ Supported formats: JPEG, PNG, WebP
- ✅ Must contain exactly **1 face**
- ❌ No face detected → Rejected
- ❌ Multiple faces → Rejected
- ✅ Minimum confidence score: 0.5

### Student ID
- Automatically converted to uppercase
- Must be unique
- Required field

### Face Descriptor
- Automatically extracted from image
- 128-point array
- Stored in MongoDB for future recognition

## Testing with cURL

### Enroll Student
```bash
curl -X POST http://localhost:5000/api/v1/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STU001",
    "name": "John Doe",
    "course": "Computer Science",
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }'
```

### Get Student
```bash
curl http://localhost:5000/api/v1/enroll/STU001
```

### Get All Students
```bash
curl http://localhost:5000/api/v1/enroll?course=Computer%20Science&limit=10
```

## Testing with Postman

1. **Create New Request**
   - Method: POST
   - URL: `http://localhost:5000/api/v1/enroll`

2. **Headers**
   - Content-Type: `application/json`

3. **Body** (raw JSON)
   ```json
   {
     "studentId": "STU001",
     "name": "John Doe",
     "course": "Computer Science",
     "image": "data:image/jpeg;base64,..."
   }
   ```

4. **Send Request**

## Image Capture Best Practices

For optimal face detection:
- 📸 **Face forward** - Looking at camera
- 💡 **Good lighting** - Well-lit environment
- 👤 **Single person** - Only one face in frame
- 📏 **Clear face** - No obstructions (glasses okay)
- 🎯 **Centered** - Face in center of image
- 📐 **Close-up** - Face occupies significant portion

## Error Codes

| Code | Error | Description |
|------|-------|-------------|
| 400 | Missing Fields | Required fields not provided |
| 400 | Invalid Image | Base64 image format invalid |
| 400 | NO_FACE_DETECTED | No face found in image |
| 400 | MULTIPLE_FACES_DETECTED | More than one face found |
| 409 | Duplicate Student | Student ID already exists |
| 404 | Not Found | Student not found |
| 500 | Server Error | Internal processing error |

## Face Detection Details

- **Model**: SSD MobileNet V1
- **Landmarks**: 68 facial landmarks
- **Descriptor**: 128-dimensional vector
- **Min Confidence**: 0.5 (50%)
- **Match Threshold**: 0.6 (for future attendance)

## Database Schema

```javascript
{
  studentId: String (unique, indexed),
  name: String,
  course: String,
  faceDescriptor: [Number] (128 elements),
  email: String (optional),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

## Next Steps

After enrollment, students can:
1. ✅ Be verified for attendance
2. ✅ Have their face matched against database
3. ✅ Automatically log attendance when recognized

## Security Notes

- Face descriptors are stored securely in MongoDB
- Original images are compressed and stored separately
- Face descriptors cannot be reverse-engineered to images
- Each descriptor is unique to the individual
