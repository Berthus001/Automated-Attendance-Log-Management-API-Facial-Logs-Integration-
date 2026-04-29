# Complete Workflow Example

This guide demonstrates the complete flow from student enrollment to attendance logging.

## Prerequisites

- ✅ MongoDB running
- ✅ Backend server started (`npm run dev`)
- ✅ Face-api models downloaded (see [MODELS_SETUP.md](MODELS_SETUP.md))

## Step 1: Enroll a Student

First, register a student with their face image.

### Request
```bash
POST /api/v1/enroll
Content-Type: application/json
```

```json
{
  "studentId": "STU001",
  "name": "John Doe",
  "course": "Computer Science",
  "email": "john.doe@university.edu",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

### Response
```json
{
  "success": true,
  "message": "Student enrolled successfully",
  "data": {
    "studentId": "STU001",
    "name": "John Doe",
    "course": "Computer Science",
    "email": "john.doe@university.edu",
    "imagePath": "uploads/students/img_1714694400000_a1b2c3d4.jpeg",
    "faceDetection": {
      "confidence": 0.9856,
      "boundingBox": { "x": 45, "y": 32, "width": 180, "height": 220 }
    },
    "enrolledAt": "2026-04-23T08:00:00.000Z"
  }
}
```

**What Happens:**
1. ✅ Base64 image converted to JPEG (300px, 70% quality)
2. ✅ Face detected in image
3. ✅ 128-point face descriptor extracted
4. ✅ Student saved to MongoDB with descriptor
5. ✅ Image saved to `uploads/students/`

---

## Step 2: Log Attendance (Face Login)

Student arrives and takes a selfie for attendance.

### Request
```bash
POST /api/v1/face-login
Content-Type: application/json
```

```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "deviceId": "DEVICE_001"
}
```

### Response
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
      "imagePath": "uploads/attendance/img_1714737000000_xyz123.jpeg",
      "deviceId": "DEVICE_001"
    },
    "match": {
      "confidence": "0.8542",
      "distance": "0.1458",
      "threshold": 0.6
    },
    "faceDetection": {
      "confidence": 0.9723,
      "boundingBox": { "x": 52, "y": 28, "width": 175, "height": 215 }
    }
  }
}
```

**What Happens:**
1. ✅ Base64 image converted to JPEG
2. ✅ Face descriptor extracted from new image
3. ✅ Compared with all enrolled students (Euclidean distance)
4. ✅ Best match found: STU001 with distance 0.1458
5. ✅ Distance < 0.6 threshold → Match confirmed
6. ✅ Attendance log created in MongoDB
7. ✅ Image saved to `uploads/attendance/`

---

## Step 3: Verify Face (Optional - Testing)

Test face recognition without logging attendance.

### Request
```bash
POST /api/v1/face-login/verify
Content-Type: application/json
```

```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

### Response
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

---

## Step 4: Get Attendance Statistics

View student's attendance history.

### Request
```bash
GET /api/v1/face-login/stats/STU001?startDate=2026-04-01&endDate=2026-04-30
```

### Response
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
      "totalAttendance": 18,
      "presentCount": 17,
      "lateCount": 1,
      "attendanceRate": "94.44"
    },
    "recentLogs": [
      {
        "_id": "662f9a3b5e8f4a001234abcd",
        "timestamp": "2026-04-23T14:30:00.000Z",
        "status": "present",
        "imagePath": "uploads/attendance/img_1714737000000.jpeg",
        "confidenceScore": 0.8542,
        "deviceId": "DEVICE_001"
      }
    ]
  }
}
```

---

## Complete Node.js Example

```javascript
const axios = require('axios');
const fs = require('fs');

const API_BASE = 'http://localhost:5000/api/v1';

// Helper: Convert image file to base64
function imageToBase64(filePath) {
  const imageBuffer = fs.readFileSync(filePath);
  return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
}

// Step 1: Enroll Student
async function enrollStudent() {
  const image = imageToBase64('./photos/john_doe_enrollment.jpg');
  
  const response = await axios.post(`${API_BASE}/enroll`, {
    studentId: 'STU001',
    name: 'John Doe',
    course: 'Computer Science',
    email: 'john.doe@university.edu',
    image
  });
  
  console.log('✅ Student enrolled:', response.data);
  return response.data;
}

// Step 2: Log Attendance
async function logAttendance() {
  const image = imageToBase64('./photos/john_doe_attendance.jpg');
  
  const response = await axios.post(`${API_BASE}/face-login`, {
    image,
    deviceId: 'DEVICE_001'
  });
  
  console.log('✅ Attendance logged:', response.data);
  return response.data;
}

// Step 3: Get Statistics
async function getStats(studentId) {
  const response = await axios.get(
    `${API_BASE}/face-login/stats/${studentId}`,
    {
      params: {
        startDate: '2026-04-01',
        endDate: '2026-04-30'
      }
    }
  );
  
  console.log('📊 Statistics:', response.data);
  return response.data;
}

// Run workflow
async function runWorkflow() {
  try {
    // Enroll
    const enrollment = await enrollStudent();
    console.log(`Student ${enrollment.data.studentId} enrolled\n`);
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Log attendance
    const attendance = await logAttendance();
    console.log(`Attendance logged for ${attendance.data.student.name}\n`);
    
    // Get stats
    const stats = await getStats('STU001');
    console.log(`Attendance rate: ${stats.data.statistics.attendanceRate}%`);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

runWorkflow();
```

---

## Browser/Frontend Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Attendance System</title>
</head>
<body>
  <h1>Face Recognition Attendance</h1>
  
  <!-- Video preview -->
  <video id="video" width="640" height="480" autoplay></video>
  <br>
  <button onclick="captureAndLog()">Log Attendance</button>
  
  <div id="result"></div>
  
  <script>
    const video = document.getElementById('video');
    const resultDiv = document.getElementById('result');
    
    // Start webcam
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        video.srcObject = stream;
      })
      .catch(err => {
        console.error('Error accessing webcam:', err);
      });
    
    // Capture image from webcam
    function captureImage() {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.8);
    }
    
    // Log attendance
    async function captureAndLog() {
      try {
        const base64Image = captureImage();
        
        resultDiv.innerHTML = '<p>Processing...</p>';
        
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
          resultDiv.innerHTML = `
            <h2>✅ Attendance Logged</h2>
            <p><strong>Student:</strong> ${result.data.student.name}</p>
            <p><strong>ID:</strong> ${result.data.student.studentId}</p>
            <p><strong>Course:</strong> ${result.data.student.course}</p>
            <p><strong>Confidence:</strong> ${(result.data.match.confidence * 100).toFixed(2)}%</p>
            <p><strong>Time:</strong> ${new Date(result.data.attendance.timestamp).toLocaleString()}</p>
          `;
        } else {
          resultDiv.innerHTML = `
            <h2>❌ Not Recognized</h2>
            <p>${result.message}</p>
          `;
        }
      } catch (error) {
        resultDiv.innerHTML = `<p>Error: ${error.message}</p>`;
      }
    }
  </script>
</body>
</html>
```

---

## Error Handling Examples

### No Face Detected
```json
{
  "success": false,
  "message": "No face detected in the image",
  "error": "NO_FACE_DETECTED",
  "faceCount": 0
}
```

### Multiple Faces
```json
{
  "success": false,
  "message": "Multiple faces detected (3). Please provide an image with a single face.",
  "error": "MULTIPLE_FACES_DETECTED",
  "faceCount": 3
}
```

### Face Not Recognized
```json
{
  "success": false,
  "message": "Face not recognized. Please enroll first.",
  "error": "FACE_NOT_RECOGNIZED",
  "confidence": "0.3845",
  "threshold": 0.6
}
```

### Student Already Exists
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

---

## Database Schema Reference

### Student Document
```javascript
{
  _id: ObjectId("662f9a3b5e8f4a001234abcd"),
  studentId: "STU001",
  name: "John Doe",
  course: "Computer Science",
  email: "john.doe@university.edu",
  faceDescriptor: [0.123, -0.456, 0.789, ...], // 128 numbers
  isActive: true,
  createdAt: ISODate("2026-04-23T08:00:00.000Z"),
  updatedAt: ISODate("2026-04-23T08:00:00.000Z")
}
```

### AttendanceLog Document
```javascript
{
  _id: ObjectId("662f9b3c5e8f4a001234abce"),
  studentId: "STU001",
  course: "Computer Science",
  timestamp: ISODate("2026-04-23T14:30:00.000Z"),
  imagePath: "uploads/attendance/img_1714737000000_xyz123.jpeg",
  deviceId: "DEVICE_001",
  status: "present",
  confidenceScore: 0.8542,
  createdAt: ISODate("2026-04-23T14:30:00.000Z"),
  updatedAt: ISODate("2026-04-23T14:30:00.000Z")
}
```

---

## Performance Tips

1. **Optimize Face Comparison**
   - Early termination when strong match found (distance < 0.4)
   - Only compare with active students
   
2. **Image Processing**
   - Resize to 300px max width
   - 70% JPEG quality
   - Progressive JPEG for web
   
3. **Database Indexing**
   - `studentId` is indexed
   - `timestamp` is indexed
   - Compound indexes on common queries
   
4. **Caching** (Future Enhancement)
   - Cache student descriptors in Redis
   - Reduce database queries for large datasets

---

## Production Checklist

- [ ] Configure MongoDB connection string
- [ ] Download and verify face-api models
- [ ] Set up proper error logging
- [ ] Configure CORS for your domain
- [ ] Add rate limiting
- [ ] Implement authentication/authorization
- [ ] Set up SSL/TLS for production
- [ ] Configure environment variables
- [ ] Test with various lighting conditions
- [ ] Monitor match confidence scores
- [ ] Set up backup for attendance logs
- [ ] Implement liveness detection (anti-spoofing)

---

## Troubleshooting

### Issue: "Face recognition models not found"
**Solution:** Download models to `backend/models/face-api/` - see [MODELS_SETUP.md](MODELS_SETUP.md)

### Issue: Low confidence scores
**Solutions:**
- Improve lighting conditions
- Use higher quality images
- Re-enroll with multiple angles
- Lower match threshold (with caution)

### Issue: Slow recognition (>2 seconds)
**Solutions:**
- Ensure early termination is working
- Check database query performance
- Consider caching student descriptors
- Use smaller image sizes

### Issue: False positives
**Solutions:**
- Lower match threshold (e.g., 0.5 instead of 0.6)
- Improve enrollment image quality
- Add liveness detection
- Require multiple confirmations

---

## Next Steps

1. ✅ **Enroll Students** - Register all students with face images
2. ✅ **Test System** - Use `/verify` endpoint to test recognition
3. ✅ **Deploy Devices** - Set up cameras/tablets at entry points
4. ✅ **Monitor** - Track confidence scores and accuracy
5. ✅ **Optimize** - Adjust thresholds based on real-world performance

## Support

For detailed API documentation:
- [FACE_LOGIN_API.md](FACE_LOGIN_API.md)
- [ENROLLMENT_API.md](ENROLLMENT_API.md)
- [MODELS_SETUP.md](MODELS_SETUP.md)
