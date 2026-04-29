# Authentication System - Complete Flow

Complete authentication system with role-based login methods and two-factor authentication.

## Overview

Different user roles have different authentication methods:

| Role | Login Method | 2FA | Endpoint |
|------|--------------|-----|----------|
| **Superadmin** | Email + Password | ✅ Face verification | `/api/auth/login` + `/api/auth/face-verify` |
| **Admin** | Email + Password | ✅ Face verification | `/api/auth/login` + `/api/auth/face-verify` |
| **Teacher** | Face Recognition ONLY | ❌ No 2FA | `/api/auth/face-login` |
| **Student** | Face Recognition ONLY | ❌ No 2FA | `/api/auth/face-login` |

---

## 1. Superadmin & Admin Authentication

### Step 1: Login with Email + Password

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ec49f1b2c72b8c8e4f3a",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### Step 2: Face Verification (2FA)

For sensitive operations, require face verification:

**Endpoint:** `POST /api/auth/face-verify`

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Face verified successfully",
  "verified": true,
  "confidence": {
    "distance": 0.3245,
    "threshold": 0.6
  },
  "user": {
    "id": "60d5ec49f1b2c72b8c8e4f3a",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

---

## 2. Teacher & Student Authentication

### Face-Only Login

**Endpoint:** `POST /api/auth/face-login`

**Request:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Face login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ec49f1b2c72b8c8e4f3b",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "teacher"
  },
  "confidence": {
    "distance": 0.4123,
    "threshold": 0.6
  }
}
```

**Response (Failed):**
```json
{
  "success": false,
  "message": "Face not recognized. No matching user found.",
  "confidence": {
    "distance": 0.8523,
    "threshold": 0.6
  }
}
```

---

## Authentication Endpoints Summary

### Public Endpoints (No JWT Required)

#### `POST /api/auth/login`
- **Purpose:** Email + password login
- **For:** Superadmin, Admin only
- **Returns:** JWT token
- **2FA:** Requires face verification for sensitive actions

#### `POST /api/auth/face-login`
- **Purpose:** Face-only authentication
- **For:** Teacher, Student only
- **Returns:** JWT token immediately
- **2FA:** No additional verification needed

### Protected Endpoints (JWT Required)

#### `GET /api/auth/me`
- **Purpose:** Get current user info
- **For:** All authenticated users
- **Requires:** JWT token

#### `POST /api/auth/face-verify`
- **Purpose:** Second-factor authentication
- **For:** Superadmin, Admin (after login)
- **Requires:** JWT token + face image
- **Use case:** Verify identity before sensitive operations

---

## Frontend Implementation

### Admin/Superadmin Login Flow

```javascript
import axios from 'axios';

const adminLogin = async (email, password) => {
  try {
    // Step 1: Email + password login
    const loginResponse = await axios.post('/api/auth/login', {
      email,
      password
    });

    const token = loginResponse.data.token;
    localStorage.setItem('token', token);
    localStorage.setItem('role', loginResponse.data.user.role);

    console.log('✓ Logged in successfully');
    return token;
  } catch (error) {
    console.error('Login failed:', error.response?.data?.message);
    throw error;
  }
};

const verifyFaceForSensitiveAction = async (image, token) => {
  try {
    // Step 2: Face verification (2FA)
    const response = await axios.post('/api/auth/face-verify', {
      image
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.verified) {
      console.log('✓ Face verified. Proceeding with action...');
      return true;
    }
  } catch (error) {
    console.error('Face verification failed:', error.response?.data?.message);
    return false;
  }
};

// Usage
const handleDeleteAccount = async () => {
  const token = localStorage.getItem('token');
  const faceImage = webcamRef.current.getScreenshot();

  // Require face verification before deletion
  const verified = await verifyFaceForSensitiveAction(faceImage, token);
  
  if (verified) {
    // Proceed with account deletion
    await axios.delete('/api/users/delete-account', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } else {
    alert('Face verification failed. Cannot proceed.');
  }
};
```

### Student/Teacher Face Login Flow

```javascript
import axios from 'axios';
import Webcam from 'react-webcam';

const faceLogin = async (image) => {
  try {
    const response = await axios.post('/api/auth/face-login', {
      image
    });

    const token = response.data.token;
    const user = response.data.user;

    // Store token and user info
    localStorage.setItem('token', token);
    localStorage.setItem('role', user.role);
    localStorage.setItem('userId', user.id);

    console.log(`✓ Welcome ${user.name}!`);
    console.log(`Role: ${user.role}`);
    
    return { token, user };
  } catch (error) {
    console.error('Face login failed:', error.response?.data?.message);
    throw error;
  }
};

// React Component
const FaceLoginPage = () => {
  const webcamRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFaceLogin = async () => {
    setLoading(true);

    try {
      // Capture image from webcam
      const imageSrc = webcamRef.current.getScreenshot();

      // Attempt face login
      const { token, user } = await faceLogin(imageSrc);

      // Redirect based on role
      if (user.role === 'teacher') {
        navigate('/teacher-dashboard');
      } else if (user.role === 'student') {
        navigate('/student-dashboard');
      }
    } catch (error) {
      alert('Face not recognized. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Face Login</h2>
      <p>For Teachers and Students</p>
      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={640}
        height={480}
      />
      <button onClick={handleFaceLogin} disabled={loading}>
        {loading ? 'Recognizing...' : 'Login with Face'}
      </button>
    </div>
  );
};
```

---

## Security Features

### Email + Password Login (Admin/Superadmin)
- ✅ Password hashed with bcrypt
- ✅ JWT token with 7-day expiration
- ✅ Role verification (admin/superadmin only)
- ✅ Account active status check
- ✅ Face verification required for sensitive actions

### Face-Only Login (Teacher/Student)
- ✅ Face descriptor matching with all enrolled users
- ✅ Euclidean distance threshold: 0.6
- ✅ Early exit optimization for strong matches
- ✅ JWT token generation upon successful match
- ✅ Role verification (teacher/student only)
- ✅ Active account check

### Face Verification (2FA)
- ✅ Requires valid JWT token
- ✅ Compares with logged-in user's stored descriptor
- ✅ Returns confidence metrics
- ✅ Suitable for time-limited caching

---

## Error Handling

### Email + Password Login Errors

```json
// Missing credentials
{
  "success": false,
  "message": "Please provide email and password"
}

// Invalid credentials
{
  "success": false,
  "message": "Invalid credentials"
}

// Wrong role (student/teacher trying to use email login)
{
  "success": false,
  "message": "Access denied. This login is for administrators only"
}

// Inactive account
{
  "success": false,
  "message": "Account is deactivated"
}
```

### Face Login Errors

```json
// No face detected
{
  "success": false,
  "message": "No face detected in the image",
  "error": "NO_FACE_DETECTED",
  "faceCount": 0
}

// Multiple faces
{
  "success": false,
  "message": "Multiple faces detected (2). Please provide an image with a single face.",
  "error": "MULTIPLE_FACES_DETECTED",
  "faceCount": 2
}

// Face not recognized
{
  "success": false,
  "message": "Face not recognized. No matching user found.",
  "confidence": {
    "distance": 0.8523,
    "threshold": 0.6
  }
}

// No enrolled users
{
  "success": false,
  "message": "No enrolled students or teachers found in the system"
}
```

---

## Workflow Diagrams

### Admin/Superadmin Flow
```
┌─────────────────────┐
│  Admin Login Page   │
└──────────┬──────────┘
           │
           ▼
    ┌──────────────┐
    │ Email + Pass │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  Get Token   │
    └──────┬───────┘
           │
           ▼
    ┌──────────────────┐
    │  Admin Dashboard │
    └──────┬───────────┘
           │
           ▼
    ┌─────────────────────┐
    │  Sensitive Action?  │
    └──────┬──────────────┘
           │
           ▼
    ┌─────────────────┐
    │  Face Verify    │ → 2FA
    └──────┬──────────┘
           │
      ┌────┴────┐
      │         │
      ▼         ▼
   ✅ Allow  ❌ Deny
```

### Teacher/Student Flow
```
┌──────────────────────┐
│  Face Login Page     │
└──────────┬───────────┘
           │
           ▼
    ┌──────────────┐
    │ Capture Face │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │ Match Face   │
    └──────┬───────┘
           │
      ┌────┴────┐
      │         │
      ▼         ▼
   ✅ Match  ❌ No Match
      │         │
      ▼         ▼
  Get Token  Show Error
      │
      ▼
   Dashboard
```

---

## Testing

### Test Admin Login + Face Verify

```bash
# 1. Login with email + password
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'

# Save the token from response

# 2. Verify face (2FA)
curl -X POST http://localhost:5000/api/auth/face-verify \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,..."
  }'
```

### Test Face Login (Teacher/Student)

```bash
curl -X POST http://localhost:5000/api/auth/face-login \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,..."
  }'
```

---

## Best Practices

### For Admins/Superadmins
1. Always use strong passwords
2. Enable face verification for:
   - Deleting users
   - Changing critical settings
   - Accessing sensitive data
   - Modifying permissions
3. Use time-limited verification caching (5-10 minutes)
4. Re-verify before each critical action

### For Teachers/Students
1. Enroll with clear, well-lit face photos
2. Ensure good lighting during login
3. Look directly at camera
4. Avoid obstructions (glasses, masks, hats if possible)
5. Re-enroll if face changes significantly

### For Developers
1. Store tokens securely (localStorage or httpOnly cookies)
2. Implement token refresh mechanism
3. Add rate limiting to prevent brute-force attacks
4. Log all authentication attempts
5. Implement account lockout after failed attempts
6. Use HTTPS in production

---

## Related Endpoints

- `POST /api/users` - Create user with face enrollment (admin/superadmin only)
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout (frontend clears token)
