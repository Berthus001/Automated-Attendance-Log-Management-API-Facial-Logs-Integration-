# Face Login API Documentation

## Overview

The face login endpoint enables automated attendance logging through facial recognition. Students can log their attendance by submitting a face image which is matched against enrolled students in the database.

## Base URL
```
POST /api/v1/face-login
```

## Flow

1. **Receive Image** → Accept base64 encoded face image
2. **Convert to File** → Save image (300px, 70% JPEG quality)
3. **Extract Descriptor** → Generate 128-point face descriptor
4. **Compare with All Students** → Calculate Euclidean distance for each enrolled student
5. **Find Best Match** → Identify student with lowest distance
6. **Early Termination** → Stop searching if distance < 0.4 (strong match)
7. **Validate Match** → Check if distance < 0.6 (match threshold)
8. **Log Attendance** → Create attendance record if match found
9. **Return Result** → Send student info and attendance log

## API Endpoints

### 1. Face Login (Log Attendance)

```http
POST /api/v1/face-login
Content-Type: application/json
```

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "deviceId": "DEVICE_001",
  "location": {
    "type": "Point",
    "coordinates": [121.0244, 14.5547]
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Attendance logged successfully",
  "data": {
    "student": {
      "studentId": "STU001",
      "name": "John Doe",
      "course": "Computer Science"
    },
    "attendance": {
      "id": "662f9a3b5e8f4a001234abcd",
      "timestamp": "2026-04-23T14:30:00.000Z",
      "status": "present",
      "imagePath": "uploads/attendance/img_1714694400000_a1b2c3d4.jpeg",
      "deviceId": "DEVICE_001"
    },
    "match": {
      "confidence": "0.8542",
      "distance": "0.1458",
      "threshold": 0.6
    },
    "faceDetection": {
      "confidence": 0.9856,
      "boundingBox": {
        "x": 45,
        "y": 32,
        "width": 180,
        "height": 220
      }
    }
  }
}
```

**Error Responses:**

**400 - Invalid Image:**
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

**400 - Multiple Faces:**
```json
{
  "success": false,
  "message": "Multiple faces detected (2). Please provide an image with a single face.",
  "error": "MULTIPLE_FACES_DETECTED",
  "faceCount": 2
}
```

**401 - Face Not Recognized:**
```json
{
  "success": false,
  "message": "Face not recognized. Please enroll first.",
  "error": "FACE_NOT_RECOGNIZED",
  "confidence": "0.4231",
  "threshold": 0.6
}
```

**404 - No Students Enrolled:**
```json
{
  "success": false,
  "message": "No enrolled students found in the system"
}
```

### 2. Verify Face (No Attendance Log)

Test face recognition without creating attendance record.

```http
POST /api/v1/face-login/verify
Content-Type: application/json
```

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Face recognized",
  "data": {
    "student": {
      "studentId": "STU001",
      "name": "John Doe",
      "course": "Computer Science"
    },
    "match": {
      "confidence": "0.8542",
      "distance": "0.1458",
      "threshold": 0.6,
      "recognized": true
    }
  }
}
```

**Not Recognized (401):**
```json
{
  "success": false,
  "message": "Face not recognized",
  "error": "FACE_NOT_RECOGNIZED",
  "data": {
    "match": {
      "confidence": "0.4123",
      "distance": "0.5877",
      "threshold": 0.6,
      "recognized": false
    }
  }
}
```

### 3. Get Attendance Statistics

```http
GET /api/v1/face-login/stats/:studentId?startDate=2026-04-01&endDate=2026-04-30
```

**Query Parameters:**
- `startDate` (optional) - Filter from date (YYYY-MM-DD)
- `endDate` (optional) - Filter to date (YYYY-MM-DD)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "student": {
      "studentId": "STU001",
      "name": "John Doe",
      "course": "Computer Science"
    },
    "statistics": {
      "totalAttendance": 45,
      "presentCount": 42,
      "lateCount": 3,
      "attendanceRate": "93.33"
    },
    "recentLogs": [
      {
        "timestamp": "2026-04-23T14:30:00.000Z",
        "status": "present",
        "imagePath": "uploads/attendance/img_1714694400000.jpeg",
        "confidenceScore": 0.8542
      }
    ]
  }
}
```

## Match Algorithm

### Distance Calculation
- Uses **Euclidean distance** between 128-dimensional face descriptors
- Formula: `√(Σ(descriptor1[i] - descriptor2[i])²)`

### Thresholds
- **Match Threshold**: `0.6` - Maximum distance for positive match
- **Strong Match**: `0.4` - Early termination threshold for optimization
- **Confidence**: `1 - distance` - Higher is better

### Optimization
```javascript
// Early termination when strong match found
if (distance < 0.4) {
  console.log(`Strong match found with distance ${distance}`);
  break; // Stop comparing with remaining students
}
```

## Performance Optimization

### Early Termination
- Algorithm stops comparing once a **strong match** (distance < 0.4) is found
- Reduces unnecessary comparisons with remaining students
- Improves response time in large databases

### Best Practices
1. **Active Students Only** - Only compares with `isActive: true` students
2. **Single Query** - Fetches all students once, not per comparison
3. **Minimal Fields** - Only loads necessary fields (studentId, name, course, faceDescriptor)
4. **Distance Tracking** - Keeps track of best match during iteration

## Testing Examples

### cURL - Log Attendance

```bash
curl -X POST http://localhost:5000/api/v1/face-login \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "deviceId": "DEVICE_001"
  }'
```

### cURL - Verify Face

```bash
curl -X POST http://localhost:5000/api/v1/face-login/verify \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }'
```

### cURL - Get Statistics

```bash
curl http://localhost:5000/api/v1/face-login/stats/STU001?startDate=2026-04-01
```

## JavaScript Example

```javascript
// Capture image from webcam or camera
const captureImage = async () => {
  const video = document.querySelector('video');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  
  return canvas.toDataURL('image/jpeg', 0.8);
};

// Log attendance
const logAttendance = async () => {
  const base64Image = await captureImage();
  
  const response = await fetch('http://localhost:5000/api/v1/face-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: base64Image,
      deviceId: 'WEB_CAMERA_001'
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log(`Welcome, ${result.data.student.name}!`);
    console.log(`Confidence: ${result.data.match.confidence}`);
  } else {
    console.error('Face not recognized');
  }
};
```

## Response Time Estimates

| Students | Without Optimization | With Early Termination |
|----------|---------------------|------------------------|
| 50       | ~200ms              | ~50-100ms              |
| 100      | ~400ms              | ~50-150ms              |
| 500      | ~2000ms             | ~50-300ms              |
| 1000     | ~4000ms             | ~50-500ms              |

*Actual times vary based on hardware and face descriptor complexity*

## Match Confidence Interpretation

| Confidence | Distance | Interpretation |
|------------|----------|----------------|
| 0.85-1.00  | 0.00-0.15| Excellent match - Same person |
| 0.70-0.84  | 0.16-0.30| Very good match - Likely same person |
| 0.60-0.69  | 0.31-0.40| Good match - Probably same person |
| 0.40-0.59  | 0.41-0.60| **Match threshold** - Uncertain |
| 0.00-0.39  | 0.61-1.00| Poor match - Different person |

## Error Codes

| Code | Error | Description |
|------|-------|-------------|
| 400 | Invalid Image | Base64 format invalid |
| 400 | NO_FACE_DETECTED | No face in image |
| 400 | MULTIPLE_FACES_DETECTED | More than one face |
| 401 | FACE_NOT_RECOGNIZED | No match below threshold |
| 404 | No Students | Database empty |
| 500 | Server Error | Processing failed |

## Security Considerations

1. **Face Descriptor Storage** - Descriptors cannot be reversed to images
2. **Confidence Threshold** - Prevents false positives
3. **Single Face Validation** - Prevents group attendance fraud
4. **Image Archival** - All attendance images stored for audit
5. **Device Tracking** - Optional deviceId for location verification

## Best Practices

### Image Capture
- 📸 Face forward, looking at camera
- 💡 Good lighting conditions
- 👤 Single person in frame
- 📏 Face clearly visible
- 🎯 Centered in frame

### System Configuration
- Adjust `matchThreshold` based on accuracy needs
- Lower threshold = stricter matching (fewer false positives)
- Higher threshold = looser matching (more false positives)

### Database Maintenance
- Regularly update face descriptors if appearance changes
- Deactivate (`isActive: false`) graduated students
- Monitor confidence scores for quality assurance

## Future Enhancements

- [ ] Liveness detection (prevent photo spoofing)
- [ ] Multi-angle face registration
- [ ] Batch face recognition for group photos
- [ ] Real-time confidence score feedback
- [ ] Anti-spoofing measures
- [ ] Face mask detection
