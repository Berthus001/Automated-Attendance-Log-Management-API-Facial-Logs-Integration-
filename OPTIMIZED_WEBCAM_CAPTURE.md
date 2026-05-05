# Optimized Webcam Capture

Details on how the frontend captures webcam frames efficiently for face detection.

---

## Library

The project uses **react-webcam** v7.2 for webcam access.

```bash
npm install react-webcam
```

---

## Webcam Configuration

```jsx
import Webcam from "react-webcam";

const videoConstraints = {
  width: 640,
  height: 480,
  facingMode: "user",        // Front camera
  frameRate: { ideal: 30 }, // 30 fps
};

<Webcam
  ref={webcamRef}
  audio={false}
  screenshotFormat="image/jpeg"
  screenshotQuality={0.8}
  videoConstraints={videoConstraints}
  mirrored={true}
  style={{ display: "none" }} // Hidden; canvas shows the overlay
/>
```

---

## Detection Loop

The detection loop runs on every animation frame to minimize latency:

```js
const runDetection = async () => {
  if (webcamRef.current && canvasRef.current) {
    const video = webcamRef.current.video;

    if (video.readyState === 4) {
      // Resize canvas to match video
      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;

      // Detect face + extract descriptor
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        // Draw bounding box
        const ctx = canvasRef.current.getContext("2d");
        const box = detection.detection.box;
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Match against stored descriptors
        matchFace(detection.descriptor);
      }
    }
  }

  requestAnimationFrame(runDetection);
};
```

---

## Canvas Overlay

A `<canvas>` element is positioned absolutely over the `<video>` element:

```jsx
<div style={{ position: "relative", display: "inline-block" }}>
  <video ref={videoRef} autoPlay muted playsInline />
  <canvas
    ref={canvasRef}
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      pointerEvents: "none",
    }}
  />
</div>
```

The canvas draws the detection bounding box in real time over the live video feed.

---

## Screenshot Capture

For single-frame capture (e.g., enrollment, admin 2FA):

```js
const captureImage = () => {
  const imageSrc = webcamRef.current.getScreenshot({
    width: 640,
    height: 480,
  });
  // imageSrc is a base64 data URL: "data:image/jpeg;base64,..."
  return imageSrc;
};
```

---

## Performance Notes

| Setting | Value | Reason |
|---|---|---|
| Detection model | TinyFaceDetector | Fast; suitable for real-time |
| Video resolution | 640×480 | Balance of accuracy vs. performance |
| Screenshot quality | 0.8 | Reduces payload size for upload |
| Input size (TinyFaceDetector) | 416 | Default; good accuracy |
| Detection frequency | requestAnimationFrame | ~60 fps max; browser-throttled |

---

## Face-API Model Loading (Frontend)

```js
import * as faceapi from "@vladmandic/face-api";

const MODEL_URL = "/models"; // served from frontend/public/models/

await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
```

Place model files in `frontend/public/models/`.

---

## Browser Compatibility

| Browser | Webcam API | WebGL | WASM |
|---|---|---|---|
| Chrome 90+ | Yes | Yes | Yes |
| Firefox 88+ | Yes | Yes | Yes |
| Safari 14.1+ | Yes | Partial | Yes |
| Edge 90+ | Yes | Yes | Yes |

> Webcam requires HTTPS in production. `localhost` is exempt.
