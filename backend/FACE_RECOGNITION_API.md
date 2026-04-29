# Face Recognition Utility API

Utility functions for face recognition using face-api.js with strict validation rules.

## Functions

### 1. `loadModels()`

Loads face-api.js models (SSD MobileNet, Face Landmarks, Face Recognition).

```javascript
const { loadModels } = require('./utils/faceDetection');

await loadModels();
```

**Note:** Call this once at server startup. Models are cached after first load.

---

### 2. `getFaceDescriptor(imagePath)`

Extracts face descriptor from an image file.

**Parameters:**
- `imagePath` (string): Path to the image file

**Returns:**
- `Array<number>`: Face descriptor (128-dimensional array)

**Throws:**
- `Error`: "No face detected in the image"
- `Error`: "Multiple faces detected (N). Only one face allowed"

**Example:**
```javascript
const { getFaceDescriptor } = require('./utils/faceDetection');

try {
  const descriptor = await getFaceDescriptor('./uploads/faces/user123.jpg');
  console.log('Descriptor length:', descriptor.length); // 128
} catch (error) {
  console.error(error.message);
}
```

**Rules:**
- ✓ Allows **exactly one face**
- ✗ Throws error if **no face** detected
- ✗ Throws error if **multiple faces** detected

---

### 3. `compareFaces(desc1, desc2, threshold = 0.6)`

Compares two face descriptors using Euclidean distance.

**Parameters:**
- `desc1` (Array<number>): First face descriptor
- `desc2` (Array<number>): Second face descriptor  
- `threshold` (number, optional): Match threshold (default: 0.6)

**Returns:**
```javascript
{
  distance: number,  // Euclidean distance (lower = more similar)
  isMatch: boolean   // true if distance < threshold
}
```

**Example:**
```javascript
const { getFaceDescriptor, compareFaces } = require('./utils/faceDetection');

// Get descriptors
const desc1 = await getFaceDescriptor('./user1.jpg');
const desc2 = await getFaceDescriptor('./user2.jpg');

// Compare faces
const result = compareFaces(desc1, desc2);

console.log(result);
// {
//   distance: 0.4523,
//   isMatch: true
// }

if (result.isMatch) {
  console.log('Same person!');
} else {
  console.log('Different person!');
}
```

**Custom Threshold:**
```javascript
// Stricter matching (lower threshold)
const strict = compareFaces(desc1, desc2, 0.5);

// Looser matching (higher threshold)
const loose = compareFaces(desc1, desc2, 0.7);
```

**Distance Guidelines:**
- `< 0.4`: Very strong match (same person, same conditions)
- `0.4 - 0.6`: Good match (same person, different conditions)
- `0.6 - 0.8`: Weak match (may be same person)
- `> 0.8`: Different person

**Default Threshold:** `0.6` (recommended)

---

## Complete Usage Example

```javascript
const { loadModels, getFaceDescriptor, compareFaces } = require('./utils/faceDetection');

async function authenticateUser(enrolledImagePath, loginImagePath) {
  try {
    // 1. Load models (once at startup)
    await loadModels();
    
    // 2. Get face descriptors
    const enrolledDescriptor = await getFaceDescriptor(enrolledImagePath);
    const loginDescriptor = await getFaceDescriptor(loginImagePath);
    
    // 3. Compare faces
    const { distance, isMatch } = compareFaces(enrolledDescriptor, loginDescriptor);
    
    console.log(`Distance: ${distance}`);
    console.log(`Match: ${isMatch}`);
    
    return isMatch;
  } catch (error) {
    console.error('Authentication failed:', error.message);
    return false;
  }
}

// Usage
const isAuthenticated = await authenticateUser(
  './uploads/faces/user123.jpg',
  './uploads/faces/login_attempt.jpg'
);
```

---

## Error Handling

```javascript
try {
  const descriptor = await getFaceDescriptor(imagePath);
} catch (error) {
  if (error.message.includes('No face detected')) {
    // Handle: no face in image
  } else if (error.message.includes('Multiple faces')) {
    // Handle: multiple faces in image
  } else {
    // Handle: other errors
  }
}
```

---

## Technical Details

- **Algorithm:** Euclidean distance
- **Descriptor Size:** 128 dimensions
- **Default Threshold:** 0.6
- **Models:** SSD MobileNetV1, Face Landmark 68, Face Recognition Net
- **One Face Rule:** Strictly enforced (throws error otherwise)
