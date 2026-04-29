# Attendance Management API

Automated Attendance Log Management API with Facial Recognition Integration

## Features

- Express.js backend server
- MongoDB database integration with Mongoose
- **Facial Recognition** with face-api.js
- **Student Enrollment** with face detection
- **Image Processing** with Sharp (compression, resizing)
- **Base64 to Image** conversion
- RESTful API architecture
- Clean folder structure
- Environment configuration with dotenv
- Error handling middleware
- CORS enabled
- Request logging with Morgan

## Project Structure

```
/backend
 ├── config/         # Configuration files (database, etc.)
 ├── models/         # Mongoose models (Student, AttendanceLog, User)
 │   └── face-api/   # Face recognition models (download required)
 ├── routes/         # API routes
 ├── controllers/    # Route controllers
 ├── middleware/     # Custom middleware
 ├── utils/          # Utility functions (image processing, face detection)
 ├── uploads/        # File uploads directory
 ├── .env            # Environment variables
 ├── .gitignore      # Git ignore file
 ├── package.json    # Dependencies
 └── server.js       # Application entry point
```

## Installation

1. Install dependencies:
```bash
npm install
```
**Download Face Recognition Models** (Required for enrollment):
   - See [MODELS_SETUP.md](MODELS_SETUP.md) for detailed instructions
   - Download models from: https://github.com/vladmandic/face-api/tree/master/model
   - Place in `models/face-api/` directory

4. 
2. Configure environment variables:
   - Copy `.env` and update with your MongoDB connection string
   - Set your desired PORT (default: 5000)

3. Start the server:
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

## Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/attendance_db
JWT_SECRET=your_jwt_secret_key_here
API_VERSION=v1
```

## Middleware & Error Handling

The API includes robust middleware for error handling and request logging:

### 🛡️ Error Handling
- **asyncHandler** - Wraps async functions to catch errors automatically
- **errorHandler** - Global error handler with consistent JSON responses
- Returns: `{ success: false, message: "error description" }`

### 📝 Request Logging
- **requestLogger** - Logs all requests with timestamps, methods, URLs, and response times
- **morgan** - HTTP request logger (development mode only)

### Error Types Handled
- ✅ Mongoose validation errors
- ✅ Mongoose duplicate key errors
- ✅ Invalid ObjectId (cast errors)
- ✅ JWT authentication errors
- ✅ File upload errors
- ✅ Custom application errors

📖 **Complete guide:** [ERROR_HANDLING.md](ERROR_HANDLING.md)

## API Endpoints

### 🔐 Face Login (Automated Attendance)
- `POST /api/v1/face-login` - Log attendance via facial recognition
- `POST /api/v1/face-login/verify` - Verify face without logging
- `GET /api/v1/face-login/stats/:studentId` - Get attendance statistics

📖 **Detailed docs:** [FACE_LOGIN_API.md](FACE_LOGIN_API.md)

### 🎓 Enrollment (Student Registration with Face Recognition)
- `POST /api/v1/enroll` - Enroll new student with face image
- `GET /api/v1/enroll` - Get all enrolled students
- `GET /api/v1/enroll/:studentId` - Get specific student
- `PUT /api/v1/enroll/:studentId` - Update student information
- `DELETE /api/v1/enroll/:studentId` - Delete student

📖 **Detailed docs:** [ENROLLMENT_API.md](ENROLLMENT_API.md)

### 📤 Upload (Image Processing)
- `POST /api/v1/upload/image` - Upload single base64 image
- `POST /api/v1/upload/images` - Upload multiple images
- `POST /api/v1/upload/face` - Upload face image

📖 **Usage examples:** [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md)

### 📊 Logs (Attendance Records)
- `GET /api/v1/logs` - Get attendance logs with filtering & pagination
- `GET /api/v1/logs/:id` - Get single log by ID
- `GET /api/v1/logs/summary` - Get aggregated statistics
- `GET /api/v1/logs/by-date` - Get logs grouped by date
- `DELETE /api/v1/logs/:id` - Delete attendance log

📖 **Detailed docs:** [LOGS_API.md](LOGS_API.md)

### 🔄 Device Sync (External Device Integration)
- `POST /api/v1/device-sync` - Sync single attendance log from device
- `POST /api/v1/device-sync/bulk` - Bulk sync multiple logs

### 👥 Users
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get single user
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user
Sharp** - Image processing and compression
- **@vladmandic/face-api** - Face detection and recognition
- **Canvas** - Image manipulation for face-api
- **dotenv** - Environment configuration
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger

## Quick Start Example

### 1. Enroll a Student

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

**Response:**
```json
{
  "success": true,
  "message": "Student enrolled successfully",
  "data": {
    "studentId": "STU001",
    "name": "John Doe",
    "course": "Computer Science",
    "imagePath": "uploads/students/img_1714694400000_a1b2c3d4.jpeg",
    "faceDetection": {
      "confidence": 0.9856,
      "boundingBox": { "x": 45, "y": 32, "width": 180, "height": 220 }
    }
  }
}
```

### 2. Log Attendance with Face Recognition

```bash
curl -X POST http://localhost:5000/api/v1/face-login \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "deviceId": "DEVICE_001"
  }'
```

**Response:**
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
    "match": {
      "confidence": "0.8542",
      "distance": "0.1458"
    }
  }
}
```

### 3. Query Attendance Logs

```bash
curl "http://localhost:5000/api/v1/logs?studentId=STU001&startDate=2026-04-01&endDate=2026-04-30&page=1&limit=10"
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 18,
  "page": 1,
  "totalPages": 2,
  "data": [
    {
      "studentId": "STU001",
      "course": "Computer Science",
      "timestamp": "2026-04-23T14:30:00.000Z",
      "status": "present",
      "confidenceScore": 0.8542
    }
  ]
}
```

## Documentation Files

- 📄 [WORKFLOW_EXAMPLE.md](WORKFLOW_EXAMPLE.md) - Complete workflow from enrollment to attendance
- 📄 [ERROR_HANDLING.md](ERROR_HANDLING.md) - Error handling & middleware guide
- 📄 [FACE_LOGIN_API.md](FACE_LOGIN_API.md) - Face login & attendance logging API
- 📄 [DEVICE_SYNC_API.md](DEVICE_SYNC_API.md) - Device sync for external attendance uploads
- 📄 [LOGS_API.md](LOGS_API.md) - Attendance logs querying & filtering API
- 📄 [ENROLLMENT_API.md](ENROLLMENT_API.md) - Complete enrollment API documentation
- 📄 [MODELS_SETUP.md](MODELS_SETUP.md) - Face recognition models setup guide
- 📄 [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md) - Image processing utility examples
### 👥 Users
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get single user
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

## Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **dotenv** - Environment configuration
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger

## Development

The API runs on `http://localhost:5000` by default.

## License

ISC
