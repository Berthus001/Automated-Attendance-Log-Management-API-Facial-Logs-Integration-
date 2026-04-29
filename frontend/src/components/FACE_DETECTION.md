# Enhanced Webcam with Face Detection

Browser-based real-time face detection using **face-api.js** integrated into React webcam component.

## ✨ Features

✅ **Real-time Face Detection** - Detects faces at 10 FPS  
✅ **Visual Bounding Boxes** - Green boxes around detected faces  
✅ **Corner Brackets** - Enhanced visual markers  
✅ **Confidence Score** - Shows detection confidence percentage  
✅ **Auto-disable Capture** - Button disabled when no face detected  
✅ **Status Indicator** - Live feedback on detection status  
✅ **CDN Model Loading** - No manual model downloads required  

## 📦 Installation

The component uses **@vladmandic/face-api** which is already added to package.json.

```bash
cd frontend
npm install
```

## 🎯 Usage

### Import Component

```jsx
import WebcamWithFaceDetection from '../components/WebcamWithFaceDetection';
```

### Basic Usage

```jsx
const [capturedImage, setCapturedImage] = useState(null);

<WebcamWithFaceDetection 
  onCapture={setCapturedImage}
  capturedImage={capturedImage}
/>
```

### Already Integrated In:
- ✅ **EnrollPage** - Student enrollment with face capture
- ✅ **LoginPage** - Face recognition login

## 🔧 How It Works

### 1. Load Models from CDN
```javascript
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
```

### 2. Start Camera
```javascript
navigator.mediaDevices.getUserMedia({ video: true });
```

### 3. Real-time Detection Loop
```javascript
setInterval(async () => {
  const detections = await faceapi.detectAllFaces(
    video,
    new faceapi.TinyFaceDetectorOptions({
      inputSize: 224,
      scoreThreshold: 0.5
    })
  );
}, 100); // Every 100ms
```

### 4. Draw Bounding Boxes
```javascript
detections.forEach((detection) => {
  const box = detection.box;
  ctx.strokeStyle = '#00ff00';
  ctx.strokeRect(box.x, box.y, box.width, box.height);
});
```

### 5. Disable Capture if No Face
```javascript
<button 
  disabled={!faceDetected}
  onClick={captureImage}
>
  {!faceDetected ? '⚠️ No Face Detected' : '📸 Capture Photo'}
</button>
```

## 🎨 Visual Features

### Bounding Box
- **Green box** around detected face
- **Corner brackets** for enhanced visibility
- **Confidence score** displayed above box

### Status Indicator
- **Green badge** ✓ "Face detected (1)"
- **Red badge** ✗ "Position your face in frame"
- **Pulsing animation** when no face detected

### Button States
- **Enabled** (blue) - Face detected, ready to capture
- **Disabled** (gray) - No face detected, shows warning

## ⚙️ Configuration

### Detection Settings

```javascript
// In WebcamWithFaceDetection.js

// Adjust detection frequency (default: 100ms)
setInterval(detectFaces, 100); // Higher = faster but more CPU

// Adjust detection threshold (default: 0.5)
new faceapi.TinyFaceDetectorOptions({
  inputSize: 224,      // 128, 160, 224, 320, 416, 512, 608
  scoreThreshold: 0.5  // 0.0 to 1.0 (lower = more detections)
})
```

### Bounding Box Style

```javascript
// In detectFaces() function

ctx.strokeStyle = '#00ff00';  // Box color (green)
ctx.lineWidth = 3;            // Box thickness
const cornerLength = 20;      // Corner bracket size
```

## 🎯 Detection Model

Uses **TinyFaceDetector** - optimized for real-time performance:

| Model | Speed | Accuracy | Use Case |
|-------|-------|----------|----------|
| TinyFaceDetector | ⚡ Fast | Good | Real-time (used) |
| SSD MobileNet V1 | Medium | Better | Balanced |
| MTCNN | Slow | Best | High accuracy |

## 📊 Performance

- **Detection Rate**: 10 FPS (100ms interval)
- **Model Size**: ~600 KB (TinyFaceDetector)
- **Browser**: Modern browsers with WebGL support
- **CPU Usage**: Low to moderate

## 🌐 Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Yes | Full support |
| Firefox | ✅ Yes | Full support |
| Safari | ✅ Yes | macOS 11+, iOS 14+ |
| Edge | ✅ Yes | Chromium-based |

**Requires:**
- WebRTC (getUserMedia)
- Canvas API
- ES6+ JavaScript

## 🔒 HTTPS Requirement

Face detection works on:
- ✅ `https://` (production)
- ✅ `http://localhost` (development)
- ❌ `http://` (other domains)

## 🎭 Component States

### Loading
```
┌─────────────────────┐
│   Loading Spinner   │
│ "Loading face       │
│  detection..."      │
└─────────────────────┘
```

### No Face Detected
```
┌─────────────────────┐
│ ✗ Position your     │
│   face in frame     │
│                     │
│  [No face detected] │
│  (red text overlay) │
└─────────────────────┘
Button: ⚠️ No Face Detected (disabled)
```

### Face Detected
```
┌─────────────────────┐
│ ✓ Face detected (1) │
│                     │
│  ╔═══════╗ 95%     │
│  ║       ║         │
│  ║ 😊    ║         │
│  ║       ║         │
│  ╚═══════╝         │
└─────────────────────┘
Button: 📸 Capture Photo (enabled)
```

### Captured
```
┌─────────────────────┐
│                     │
│   Captured Image    │
│   (static photo)    │
│                     │
└─────────────────────┘
Button: Retake Photo
```

## 🐛 Troubleshooting

### Models Won't Load
```javascript
// Check console for errors
console.log('Models loaded:', modelsLoaded);

// Try different CDN
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model';
```

### Detection Too Slow
```javascript
// Increase interval (lower FPS)
setInterval(detectFaces, 200); // 5 FPS

// Reduce input size
inputSize: 128  // Faster but less accurate
```

### False Positives
```javascript
// Increase threshold
scoreThreshold: 0.7  // More strict
```

### Camera Not Starting
```
1. Check browser permissions
2. Ensure HTTPS or localhost
3. Check console for errors
4. Try different browser
```

## 📝 Props API

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onCapture` | `function` | Yes | Callback when photo captured |
| `capturedImage` | `string\|null` | No | Base64 image to display |

### onCapture Callback
```javascript
const handleCapture = (base64Image) => {
  // base64Image: "data:image/jpeg;base64,..."
  // or null when retaking
};
```

## 🔄 Lifecycle

```
Mount
  ↓
Load Models (CDN)
  ↓
Start Camera
  ↓
Start Detection Loop (100ms)
  ↓
Detect Faces → Draw Boxes → Update State
  ↓
User Clicks Capture (if face detected)
  ↓
Stop Detection
  ↓
Show Captured Image
  ↓
Unmount
  ↓
Stop Camera & Detection
```

## 🎨 Styling

Component uses `WebcamWithFaceDetection.css`:

- `.detection-status` - Status badge
- `.overlay-canvas` - Bounding box canvas
- `.btn-capture:disabled` - Disabled button style

### Customize Colors

```css
/* In WebcamWithFaceDetection.css */

.detection-status.detected {
  background-color: rgba(34, 197, 94, 0.9); /* Green */
}

.detection-status.not-detected {
  background-color: rgba(239, 68, 68, 0.9); /* Red */
}
```

## 🚀 Advanced Usage

### Multiple Faces

```javascript
// Component already supports multiple faces
detections.forEach((detection) => {
  // Draws box for each face
});

// Display count
setDetectionCount(detections.length); // "Face detected (3)"
```

### Custom Detection Options

```javascript
// Edit in detectFaces() function
new faceapi.TinyFaceDetectorOptions({
  inputSize: 320,      // Higher = more accurate
  scoreThreshold: 0.6  // Higher = fewer false positives
})
```

## 📚 Resources

- **face-api.js Docs**: https://github.com/vladmandic/face-api
- **Model Files**: https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model
- **Examples**: https://vladmandic.github.io/face-api/demo

## ⚡ Performance Tips

1. **Adjust FPS**: Lower interval = less CPU usage
2. **Reduce inputSize**: 128 or 160 for faster detection
3. **Use TinyFaceDetector**: Fastest model
4. **Stop detection**: When not needed (capturedImage shown)

## 🎯 Use Cases

✅ **Enrollment** - Ensure face visible before registration  
✅ **Login** - Verify face present before authentication  
✅ **Attendance** - Auto-capture when face detected  
✅ **Photo ID** - Ensure quality face photo  

## 🔐 Privacy

- ✅ **No server upload** - Detection runs in browser
- ✅ **No data collection** - Models loaded from CDN
- ✅ **Local processing** - All computation client-side
- ✅ **Camera control** - User must grant permission

---

**Ready to use!** The component is already integrated in EnrollPage and LoginPage.
