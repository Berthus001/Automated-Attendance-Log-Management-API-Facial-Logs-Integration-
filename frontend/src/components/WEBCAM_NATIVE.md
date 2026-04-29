# WebcamCaptureNative Component

Native React webcam component using **getUserMedia API** (no external libraries).

## Features

✅ **Native getUserMedia** - Direct browser API, no dependencies  
✅ **Live Video Preview** - Real-time camera feed  
✅ **Canvas-based Capture** - Frame extraction from video stream  
✅ **Base64 JPEG Conversion** - Returns data URI string  
✅ **Image Preview** - Shows captured photo  
✅ **Error Handling** - Camera permission errors  
✅ **Auto Cleanup** - Releases camera on unmount  

## Usage

```jsx
import React, { useState } from 'react';
import WebcamCaptureNative from './components/WebcamCaptureNative';

function App() {
  const [capturedImage, setCapturedImage] = useState(null);

  const handleCapture = (base64Image) => {
    setCapturedImage(base64Image);
    
    if (base64Image) {
      console.log('Captured:', base64Image);
      // base64Image format: "data:image/jpeg;base64,/9j/4AAQ..."
      
      // Send to backend
      sendToAPI(base64Image);
    }
  };

  return (
    <WebcamCaptureNative 
      onCapture={handleCapture}
      capturedImage={capturedImage}
    />
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onCapture` | `function` | Yes | Callback receiving base64 JPEG string |
| `capturedImage` | `string` | No | Base64 image to display (or null for live video) |

## How It Works

### 1. **getUserMedia**
```javascript
const mediaStream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    facingMode: 'user'
  },
  audio: false
});
```

### 2. **Live Video Display**
```javascript
videoRef.current.srcObject = mediaStream;
```

### 3. **Canvas Capture**
```javascript
const canvas = canvasRef.current;
const context = canvas.getContext('2d');
canvas.width = video.videoWidth;
canvas.height = video.videoHeight;
context.drawImage(video, 0, 0, canvas.width, canvas.height);
```

### 4. **Base64 Conversion**
```javascript
const base64Image = canvas.toDataURL('image/jpeg', 0.95);
// Returns: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
```

### 5. **Return String**
```javascript
onCapture(base64Image); // Pass to parent component
```

## Base64 Format

The component returns a **data URI** string:

```
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGB...
└─────┬─────┘ └───┬──┘ └──────────────┬──────────────┘
   MIME type    encoding       base64 data
```

### Extract Base64 Data Only

```javascript
const handleCapture = (base64Image) => {
  // Full string: "data:image/jpeg;base64,XXXXXX"
  const base64Data = base64Image.split(',')[1];
  // Result: "XXXXXX" (base64 data only)
};
```

## Backend Integration

### Send to Express API

```javascript
const handleCapture = async (base64Image) => {
  try {
    const response = await fetch('http://localhost:5000/api/face-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,  // Full data URI string
        deviceId: 'WEB_APP_001'
      })
    });

    const data = await response.json();
    console.log('Success:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Backend Processing (Node.js)

```javascript
// Extract base64 data
const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '');

// Convert to buffer
const imageBuffer = Buffer.from(base64Data, 'base64');

// Save to file
const fs = require('fs');
fs.writeFileSync('captured.jpg', imageBuffer);
```

## Camera Permissions

### Browser Prompt
When the component mounts, the browser will request camera permission:

```
[Website] wants to use your camera
[Block] [Allow]
```

### Handle Permission Errors

The component automatically handles:
- ❌ Permission denied
- ❌ No camera found  
- ❌ Camera in use by another app

Error messages display with a retry button.

## Cleanup

The component automatically **stops the camera** when unmounted:

```javascript
useEffect(() => {
  startCamera();
  
  return () => {
    stopCamera(); // Releases camera resources
  };
}, []);
```

## Image Quality

- **Format:** JPEG
- **Quality:** 95% (0.95)
- **Resolution:** Native video resolution (typically 640x480)
- **Average size:** 50-150 KB

### Adjust Quality

Edit `captureImage()` function:

```javascript
// Lower quality = smaller file size
const base64Image = canvas.toDataURL('image/jpeg', 0.8); // 80% quality

// PNG format (larger, lossless)
const base64Image = canvas.toDataURL('image/png');
```

## Styling

Customize appearance in `WebcamCaptureNative.css`:

```css
.webcam-native-wrapper {
  border-radius: 12px;  /* Rounded corners */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);  /* Shadow */
}

.btn-capture {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}
```

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ 53+ |
| Firefox | ✅ 36+ |
| Safari | ✅ 11+ |
| Edge | ✅ 12+ |
| Mobile Chrome | ✅ |
| Mobile Safari | ✅ |

### HTTPS Requirement

`getUserMedia` requires **HTTPS** in production (or `localhost` for development).

```
❌ http://example.com  → Permission denied
✅ https://example.com → Works
✅ http://localhost    → Works (development only)
```

## Comparison with react-webcam

| Feature | WebcamCaptureNative | react-webcam |
|---------|---------------------|--------------|
| Dependencies | None (native) | External library |
| Bundle size | 0 KB | ~50 KB |
| Customization | Full control | Limited |
| Learning curve | Higher | Lower |
| Features | Basic | More features |

## Common Issues

### Camera Not Starting

**Check permissions:**
```
Chrome → Settings → Privacy and security → Site settings → Camera
```

**Check if HTTPS:**
```javascript
console.log(window.location.protocol); // Should be "https:" or "http:" (localhost)
```

### Black Screen

Video may take a moment to initialize. The component shows a loading spinner until ready.

### Multiple Cameras

To use back camera (mobile):

```javascript
video: {
  facingMode: { exact: 'environment' } // Back camera
}
```

## Complete Example

See [WebcamExamplePage.js](../pages/WebcamExamplePage.js) for a full working example with:
- Image capture
- Base64 display
- API submission
- Error handling

## Files

- `WebcamCaptureNative.js` - React component
- `WebcamCaptureNative.css` - Styles
- `WebcamExamplePage.js` - Usage example
- `WEBCAM_NATIVE.md` - This documentation
