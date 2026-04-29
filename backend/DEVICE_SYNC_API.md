# Device Sync API Documentation

## Overview

The Device Sync endpoint allows external devices (e.g., attendance kiosks, mobile apps, Raspberry Pi devices) to upload pre-recorded attendance logs to the central server. This is useful when devices perform facial recognition locally and need to sync the results.

## Base URL
```
POST /api/v1/device-sync
```

## Features

- ✅ **Field Validation** - Validates required fields (studentId, timestamp, deviceId)
- ✅ **Student Verification** - Checks if student exists and is active
- ✅ **Optional Image Upload** - Accepts base64 image for attendance verification
- ✅ **Image Processing** - Automatic compression and resizing
- ✅ **Duplicate Detection** - Prevents duplicate logs within 1-minute window
- ✅ **Timestamp Validation** - Ensures valid ISO 8601 format
- ✅ **Bulk Sync** - Upload multiple logs in one request

## API Endpoints

### 1. Sync Single Attendance Log

```http
POST /api/v1/device-sync
```

**Request Body:**

```json
{
  "studentId": "STU001",
  "timestamp": "2026-04-23T14:30:00Z",
  "deviceId": "DEVICE_001",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..." // optional
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `studentId` | string | Yes | Student ID (auto-converted to uppercase) |
| `timestamp` | string | Yes | ISO 8601 timestamp (e.g., 2026-04-23T14:30:00Z) |
| `deviceId` | string | Yes | Unique device identifier |
| `image` | string | No | Base64-encoded image (JPEG/PNG) |

**Success Response (201):**

```json
{
  "success": true,
  "message": "Attendance log synced successfully",
  "data": {
    "logId": "662f9a3b5e8f4a001234abcd",
    "student": {
      "studentId": "STU001",
      "name": "John Doe",
      "course": "Computer Science"
    },
    "attendance": {
      "timestamp": "2026-04-23T14:30:00.000Z",
      "deviceId": "DEVICE_001",
      "status": "present",
      "imagePath": "uploads/attendance/img_1714737000000.jpeg"
    }
  }
}
```

**Error Responses:**

**400 - Missing Required Field:**
```json
{
  "success": false,
  "message": "studentId is required"
}
```

**400 - Invalid Timestamp:**
```json
{
  "success": false,
  "message": "Invalid timestamp format. Use ISO 8601 format (e.g., 2026-04-23T14:30:00Z)"
}
```

**404 - Student Not Found:**
```json
{
  "success": false,
  "message": "Student with ID STU001 not found or inactive"
}
```

**409 - Duplicate Log:**
```json
{
  "success": false,
  "message": "Duplicate attendance log detected within 1-minute window",
  "existingLog": {
    "id": "662f9a3b5e8f4a001234abcd",
    "timestamp": "2026-04-23T14:30:15.000Z",
    "deviceId": "DEVICE_001"
  }
}
```

### 2. Bulk Sync Multiple Logs

```http
POST /api/v1/device-sync/bulk
```

**Request Body:**

```json
{
  "logs": [
    {
      "studentId": "STU001",
      "timestamp": "2026-04-23T08:00:00Z",
      "deviceId": "DEVICE_001",
      "image": "data:image/jpeg;base64,..."
    },
    {
      "studentId": "STU002",
      "timestamp": "2026-04-23T08:05:00Z",
      "deviceId": "DEVICE_001"
    },
    {
      "studentId": "STU003",
      "timestamp": "2026-04-23T08:10:00Z",
      "deviceId": "DEVICE_002",
      "status": "late",
      "confidenceScore": 0.85
    }
  ]
}
```

**Bulk Request Limits:**
- Maximum: **100 logs per request**
- Minimum: **1 log**

**Success Response (201):**

```json
{
  "success": true,
  "message": "Processed 3 logs: 3 success, 0 failed, 0 duplicates",
  "summary": {
    "total": 3,
    "success": 3,
    "failed": 0,
    "duplicate": 0
  },
  "results": {
    "success": [
      {
        "index": 0,
        "logId": "662f9a3b5e8f4a001234abcd",
        "studentId": "STU001",
        "timestamp": "2026-04-23T08:00:00.000Z"
      },
      {
        "index": 1,
        "logId": "662f9a3b5e8f4a001234abce",
        "studentId": "STU002",
        "timestamp": "2026-04-23T08:05:00.000Z"
      },
      {
        "index": 2,
        "logId": "662f9a3b5e8f4a001234abcf",
        "studentId": "STU003",
        "timestamp": "2026-04-23T08:10:00.000Z"
      }
    ],
    "failed": [],
    "duplicate": []
  }
}
```

**Partial Success Response (201):**

```json
{
  "success": true,
  "message": "Processed 5 logs: 3 success, 1 failed, 1 duplicates",
  "summary": {
    "total": 5,
    "success": 3,
    "failed": 1,
    "duplicate": 1
  },
  "results": {
    "success": [...],
    "failed": [
      {
        "index": 2,
        "log": {
          "studentId": "STU999",
          "timestamp": "2026-04-23T08:15:00Z",
          "deviceId": "DEVICE_001"
        },
        "reason": "Student STU999 not found or inactive"
      }
    ],
    "duplicate": [
      {
        "index": 4,
        "log": {
          "studentId": "STU001",
          "timestamp": "2026-04-23T08:00:30Z",
          "deviceId": "DEVICE_001"
        },
        "existingLogId": "662f9a3b5e8f4a001234abcd"
      }
    ]
  }
}
```

## Timestamp Format

### Accepted Formats

**ISO 8601 (Recommended):**
```
2026-04-23T14:30:00Z          // UTC
2026-04-23T14:30:00.000Z      // UTC with milliseconds
2026-04-23T14:30:00+08:00     // With timezone offset
2026-04-23T14:30:00-05:00     // With negative offset
```

**JavaScript Date String:**
```javascript
new Date().toISOString()
// "2026-04-23T14:30:00.000Z"
```

**Invalid Formats:**
```
2026-04-23                    // ❌ Date only
14:30:00                      // ❌ Time only
04/23/2026 2:30 PM            // ❌ US format
23-04-2026 14:30              // ❌ Wrong separator
```

## Duplicate Detection

The system prevents duplicate logs using a **1-minute window**:

```javascript
// If a log exists with:
// - Same studentId
// - Same deviceId
// - Timestamp within ±1 minute

// Example:
Existing log: 2026-04-23T14:30:00Z
New log:      2026-04-23T14:30:30Z  // ❌ Rejected (within 1 minute)
New log:      2026-04-23T14:31:30Z  // ✅ Accepted (after 1 minute)
```

### Why 1-Minute Window?

- Prevents accidental double-taps
- Handles network retries
- Allows legitimate re-entries after brief exit

## Image Processing

When an image is provided:

1. **Validation** - Checks base64 format
2. **Conversion** - Converts to JPEG file
3. **Resize** - Max width 300px (maintains aspect ratio)
4. **Compression** - 70% JPEG quality with mozjpeg
5. **Storage** - Saved to `uploads/attendance/` folder

**Supported Formats:**
- JPEG/JPG
- PNG
- Base64 data URI

**Image Size Recommendations:**
- Original: Any size
- Output: Max 300px width, ~20-50KB

## Use Cases

### 1. Attendance Kiosk

A kiosk device performs facial recognition locally and syncs results:

```javascript
// Device captures attendance
const attendance = {
  studentId: "STU001",
  timestamp: new Date().toISOString(),
  deviceId: "KIOSK_BUILDING_A",
  image: capturedImage // base64
};

// Sync to server
const response = await fetch('http://server/api/v1/device-sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(attendance)
});
```

### 2. Mobile App Check-In

Students check in via mobile app with GPS verification:

```javascript
const checkin = {
  studentId: userId,
  timestamp: new Date().toISOString(),
  deviceId: `MOBILE_${deviceFingerprint}`,
  image: selfieBase64 // optional
};

await syncAttendance(checkin);
```

### 3. Offline Device Sync

Device stores logs offline and syncs when internet available:

```javascript
// Device comes online with queued logs
const queuedLogs = getOfflineQueue(); // 50 logs

await fetch('http://server/api/v1/device-sync/bulk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ logs: queuedLogs })
});
```

### 4. Raspberry Pi Scanner

Raspberry Pi with camera scans student IDs:

```python
import requests
from datetime import datetime

# Scan student ID and capture photo
attendance = {
    "studentId": scanned_id,
    "timestamp": datetime.utcnow().isoformat() + "Z",
    "deviceId": "RPI_LAB_101",
    "image": image_base64
}

response = requests.post(
    "http://server/api/v1/device-sync",
    json=attendance
)
```

## Testing Examples

### cURL - Single Sync

```bash
curl -X POST http://localhost:5000/api/v1/device-sync \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STU001",
    "timestamp": "2026-04-23T14:30:00Z",
    "deviceId": "DEVICE_001"
  }'
```

### cURL - With Image

```bash
curl -X POST http://localhost:5000/api/v1/device-sync \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STU001",
    "timestamp": "2026-04-23T14:30:00Z",
    "deviceId": "DEVICE_001",
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }'
```

### cURL - Bulk Sync

```bash
curl -X POST http://localhost:5000/api/v1/device-sync/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "logs": [
      {
        "studentId": "STU001",
        "timestamp": "2026-04-23T08:00:00Z",
        "deviceId": "DEVICE_001"
      },
      {
        "studentId": "STU002",
        "timestamp": "2026-04-23T08:05:00Z",
        "deviceId": "DEVICE_001"
      }
    ]
  }'
```

### JavaScript/Fetch - Single Sync

```javascript
const syncAttendance = async (studentId, deviceId, image = null) => {
  const data = {
    studentId: studentId,
    timestamp: new Date().toISOString(),
    deviceId: deviceId
  };
  
  if (image) {
    data.image = image;
  }
  
  const response = await fetch('http://localhost:5000/api/v1/device-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  return await response.json();
};

// Usage
const result = await syncAttendance('STU001', 'DEVICE_001');
console.log(result);
```

### JavaScript/Fetch - Bulk Sync

```javascript
const bulkSync = async (logs) => {
  const response = await fetch('http://localhost:5000/api/v1/device-sync/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logs })
  });
  
  return await response.json();
};

// Usage
const logs = [
  {
    studentId: 'STU001',
    timestamp: '2026-04-23T08:00:00Z',
    deviceId: 'DEVICE_001'
  },
  {
    studentId: 'STU002',
    timestamp: '2026-04-23T08:05:00Z',
    deviceId: 'DEVICE_001'
  }
];

const result = await bulkSync(logs);
console.log(`Success: ${result.summary.success}, Failed: ${result.summary.failed}`);
```

### Python - Single Sync

```python
import requests
from datetime import datetime

def sync_attendance(student_id, device_id, image=None):
    data = {
        "studentId": student_id,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "deviceId": device_id
    }
    
    if image:
        data["image"] = image
    
    response = requests.post(
        "http://localhost:5000/api/v1/device-sync",
        json=data
    )
    
    return response.json()

# Usage
result = sync_attendance("STU001", "DEVICE_001")
print(result)
```

### Python - Bulk Sync

```python
import requests

def bulk_sync(logs):
    response = requests.post(
        "http://localhost:5000/api/v1/device-sync/bulk",
        json={"logs": logs}
    )
    return response.json()

# Usage
logs = [
    {
        "studentId": "STU001",
        "timestamp": "2026-04-23T08:00:00Z",
        "deviceId": "DEVICE_001"
    },
    {
        "studentId": "STU002",
        "timestamp": "2026-04-23T08:05:00Z",
        "deviceId": "DEVICE_001"
    }
]

result = bulk_sync(logs)
print(f"Success: {result['summary']['success']}")
```

## Error Handling

### Client-Side Retry Logic

```javascript
const syncWithRetry = async (data, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('http://localhost:5000/api/v1/device-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (result.success) {
        return result;
      }
      
      // Don't retry on 409 (duplicate) or 404 (not found)
      if (response.status === 409 || response.status === 404) {
        throw new Error(result.message);
      }
      
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

### Offline Queue Management

```javascript
class OfflineQueue {
  constructor() {
    this.queue = JSON.parse(localStorage.getItem('attendanceQueue') || '[]');
  }
  
  add(attendance) {
    this.queue.push(attendance);
    this.save();
  }
  
  async sync() {
    if (this.queue.length === 0) return;
    
    const batch = this.queue.splice(0, 100); // Max 100 per request
    
    try {
      const response = await fetch('http://server/api/v1/device-sync/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: batch })
      });
      
      const result = await response.json();
      
      // Re-add failed logs to queue
      if (result.results.failed.length > 0) {
        result.results.failed.forEach(item => {
          this.queue.push(item.log);
        });
      }
      
      this.save();
      return result;
      
    } catch (error) {
      // Network error - restore batch to queue
      this.queue = [...batch, ...this.queue];
      this.save();
      throw error;
    }
  }
  
  save() {
    localStorage.setItem('attendanceQueue', JSON.stringify(this.queue));
  }
}
```

## Security Considerations

### Device Authentication (Future Enhancement)

Currently, the API accepts any `deviceId`. For production:

```javascript
// Add device authentication middleware
const authenticateDevice = async (req, res, next) => {
  const { deviceId } = req.body;
  const apiKey = req.headers['x-api-key'];
  
  // Verify device is registered and API key is valid
  const device = await Device.findOne({ deviceId, apiKey });
  
  if (!device) {
    return res.status(401).json({
      success: false,
      message: 'Invalid device credentials'
    });
  }
  
  next();
};

router.post('/', authenticateDevice, syncAttendanceLog);
```

### Rate Limiting

Prevent abuse with rate limiting:

```javascript
const rateLimit = require('express-rate-limit');

const syncLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many sync requests, please try again later'
});

router.post('/', syncLimiter, syncAttendanceLog);
```

## Best Practices

### 1. Use UTC Timestamps
```javascript
// ✅ Good
const timestamp = new Date().toISOString(); // "2026-04-23T14:30:00.000Z"

// ❌ Bad
const timestamp = new Date().toString(); // "Wed Apr 23 2026 14:30:00 GMT+0800"
```

### 2. Store Device ID Consistently
```javascript
// ✅ Good
const deviceId = "KIOSK_BUILDING_A_FLOOR_2";

// ❌ Bad
const deviceId = Math.random().toString(); // Different every time
```

### 3. Handle Images Efficiently
```javascript
// ✅ Good - Compress before sending
const compressed = await compressImage(image, 0.7);
await syncAttendance(studentId, deviceId, compressed);

// ❌ Bad - Send large uncompressed images
await syncAttendance(studentId, deviceId, highResImage); // 5MB+
```

### 4. Implement Offline Support
```javascript
// ✅ Good - Queue when offline
if (navigator.onLine) {
  await syncAttendance(data);
} else {
  offlineQueue.add(data);
}

// Sync when online
window.addEventListener('online', () => {
  offlineQueue.sync();
});
```

## Performance Considerations

### Single Sync
- **Average Response Time:** 100-200ms (without image)
- **With Image:** 300-500ms (includes processing)
- **Recommended:** For real-time syncing

### Bulk Sync
- **Average Response Time:** 2-5 seconds (100 logs)
- **Recommended:** For offline sync, batch uploads

### Optimization Tips
1. Use bulk sync for multiple logs
2. Compress images before upload
3. Implement retry logic with exponential backoff
4. Queue failed syncs for retry

## Comparison with Face Login

| Feature | Device Sync | Face Login |
|---------|-------------|------------|
| Purpose | Upload pre-recorded logs | Perform facial recognition |
| Face Recognition | Done on device | Done on server |
| Image | Optional | Required |
| Confidence Score | Optional (from device) | Calculated by server |
| Use Case | Offline devices, kiosks | Real-time recognition |
| Speed | Fast (no face processing) | Slower (face matching) |
| Bulk Support | Yes (100 logs) | No |

## Future Enhancements

- [ ] Device authentication with API keys
- [ ] Device management (register/unregister)
- [ ] Rate limiting per device
- [ ] Webhook notifications on sync
- [ ] Sync status tracking
- [ ] Device health monitoring
- [ ] Automatic conflict resolution
- [ ] Image storage optimization (CDN)
