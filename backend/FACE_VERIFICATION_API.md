# Face Verification API (Second-Factor Authentication)

Endpoint for verifying a user's identity using facial recognition as a second-factor authentication method.

## Endpoint

`POST /api/auth/face-verify`

## Purpose

This endpoint acts as a **second-factor authentication** mechanism. The user must already be logged in (have a valid JWT token) and then verify their identity by capturing their face.

## Use Cases

- Extra security for sensitive operations
- Two-factor authentication (2FA) using face recognition
- Re-authentication before critical actions
- Verify user identity before granting access to protected resources

## Authentication

**Required:** JWT Token (Bearer)

**Note:** User MUST be logged in first. This is not a login endpoint, but a verification endpoint.

## Request Headers

```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

## Request Body

```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | string | Yes | Base64-encoded image of the user's face |

## Flow

1. **User logs in** → Gets JWT token (via `/api/auth/login`)
2. **User attempts sensitive action** → System requires face verification
3. **User captures face** → Frontend captures image from webcam
4. **Send to `/api/auth/face-verify`** → Backend extracts face descriptor
5. **Compare faces** → Compares with stored descriptor from enrollment
6. **Result:**
   - ✅ **Match:** User verified, proceed with action
   - ❌ **No match:** Unauthorized, deny access

## Response

### Success (200 OK) - Face Verified

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
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin"
  }
}
```

### Error Responses

#### 400 - Missing Image
```json
{
  "success": false,
  "message": "Please provide a base64 image for face verification"
}
```

#### 400 - No Face Descriptor for User
```json
{
  "success": false,
  "message": "No face descriptor found for this user. Please enroll your face first."
}
```

#### 400 - No Face Detected in Image
```json
{
  "success": false,
  "message": "No face detected in the image",
  "error": "NO_FACE_DETECTED",
  "faceCount": 0
}
```

#### 400 - Multiple Faces Detected
```json
{
  "success": false,
  "message": "Multiple faces detected (2). Please provide an image with a single face.",
  "error": "MULTIPLE_FACES_DETECTED",
  "faceCount": 2
}
```

#### 401 - Face Does Not Match (Verification Failed)
```json
{
  "success": false,
  "message": "Face verification failed. Face does not match.",
  "verified": false,
  "confidence": {
    "distance": 0.8523,
    "threshold": 0.6
  }
}
```

#### 401 - Unauthorized (No JWT Token)
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

#### 404 - User Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

## Usage Examples

### Example 1: Basic Face Verification (JavaScript)

```javascript
const axios = require('axios');
const fs = require('fs');

// User is already logged in and has JWT token
const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Capture image from webcam (base64)
const imageBuffer = fs.readFileSync('./user-face-capture.jpg');
const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

// Verify face
const response = await axios.post('http://localhost:5000/api/auth/face-verify', {
  image: base64Image
}, {
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});

if (response.data.verified) {
  console.log('✓ Face verified! Proceeding with action...');
  console.log('User:', response.data.user.name);
  console.log('Confidence:', response.data.confidence.distance);
} else {
  console.log('✗ Face verification failed');
}
```

### Example 2: React Frontend Integration

```javascript
import axios from 'axios';
import Webcam from 'react-webcam';

const FaceVerification = () => {
  const webcamRef = useRef(null);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const verifyFace = async () => {
    setLoading(true);

    // Capture image from webcam
    const imageSrc = webcamRef.current.getScreenshot();

    try {
      const response = await axios.post('/api/auth/face-verify', {
        image: imageSrc
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.verified) {
        setVerified(true);
        alert('Face verified successfully!');
        // Proceed with protected action
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Face verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Face Verification Required</h2>
      <Webcam ref={webcamRef} screenshotFormat="image/jpeg" />
      <button onClick={verifyFace} disabled={loading}>
        {loading ? 'Verifying...' : 'Verify Face'}
      </button>
    </div>
  );
};
```

### Example 3: Protected Action with Face Verification

```javascript
// Backend: Protected route requiring face verification
router.post('/delete-account', protect, async (req, res) => {
  // This is a sensitive action
  // We don't verify face here, but frontend should call face-verify first
  
  // Frontend should:
  // 1. Call /api/auth/face-verify
  // 2. If verified, then call this endpoint
  
  // Delete account logic here
});
```

```javascript
// Frontend: Delete account flow
const deleteAccountWithFaceVerification = async () => {
  try {
    // Step 1: Verify face
    const verifyResponse = await axios.post('/api/auth/face-verify', {
      image: capturedImage
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!verifyResponse.data.verified) {
      alert('Face verification failed. Cannot delete account.');
      return;
    }

    // Step 2: Proceed with sensitive action
    const deleteResponse = await axios.post('/api/users/delete-account', {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    alert('Account deleted successfully');
  } catch (error) {
    alert('Error: ' + error.response?.data?.message);
  }
};
```

### Example 4: Time-Limited Verification (Cache Result)

```javascript
// Frontend: Store verification result temporarily
const verifyFaceAndCache = async () => {
  const response = await axios.post('/api/auth/face-verify', {
    image: capturedImage
  }, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (response.data.verified) {
    // Store verification status with timestamp
    sessionStorage.setItem('faceVerified', JSON.stringify({
      verified: true,
      timestamp: Date.now()
    }));
  }
};

// Check if face was recently verified (within 5 minutes)
const isFaceRecentlyVerified = () => {
  const data = JSON.parse(sessionStorage.getItem('faceVerified'));
  if (!data) return false;

  const fiveMinutes = 5 * 60 * 1000;
  return (Date.now() - data.timestamp) < fiveMinutes;
};

// Use in protected action
const performSensitiveAction = async () => {
  if (!isFaceRecentlyVerified()) {
    // Require face verification again
    await verifyFaceAndCache();
  }

  // Proceed with action
  await axios.post('/api/sensitive-action', data, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
};
```

## Security Considerations

### ✅ Best Practices

1. **Always require JWT first** - User must be logged in
2. **Don't store verification result permanently** - Re-verify for each sensitive action or use time limits
3. **Use HTTPS** - Protect images and tokens in transit
4. **Rate limiting** - Prevent brute-force attacks
5. **Log verification attempts** - Monitor for suspicious activity

### ⚠️ Important Notes

- This is NOT a replacement for login - it's an additional security layer
- Face verification can fail due to poor lighting, angle, or quality
- Always provide fallback authentication methods (e.g., password re-entry)
- Consider UX - don't require face verification for every action

## Confidence Metrics

The response includes confidence metrics:

```json
{
  "confidence": {
    "distance": 0.3245,  // Euclidean distance (lower = more similar)
    "threshold": 0.6     // Match threshold
  }
}
```

**Distance Interpretation:**
- `< 0.4` - Very strong match (same person, good conditions)
- `0.4 - 0.6` - Good match (same person, acceptable conditions)
- `> 0.6` - No match (different person or poor conditions)

## Workflow Diagram

```
User Action Flow:
┌─────────────────┐
│  User Login     │ → JWT Token
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Access Protected Area  │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Sensitive Action       │ → Requires Face Verification
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Capture Face Image     │ → Webcam
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  POST /face-verify      │ → Send JWT + Image
└────────┬────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐  ┌───────┐
│ Match │  │No Match│
└───┬───┘  └───┬───┘
    │          │
    ▼          ▼
 ✅ Allow   ❌ Deny
```

## Testing

### Test with cURL

```bash
# First, login to get JWT token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}' \
  | jq -r '.token')

# Then verify face
curl -X POST http://localhost:5000/api/auth/face-verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/jpeg;base64,..."}'
```

## Related Endpoints

- `POST /api/auth/login` - Initial login (get JWT token)
- `GET /api/auth/me` - Get current user info
- `POST /api/users` - Enroll user with face descriptor
- `POST /api/face-login` - Login using face recognition only

## Differences: Face Verify vs Face Login

| Feature | Face Verify | Face Login |
|---------|-------------|------------|
| **Purpose** | Second-factor auth | Primary login method |
| **Requires JWT** | ✅ Yes | ❌ No |
| **Use case** | Extra security check | Alternative to password |
| **When to use** | After login, before sensitive action | Initial authentication |
