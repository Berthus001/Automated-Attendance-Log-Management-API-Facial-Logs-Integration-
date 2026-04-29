# Face Recognition Model Setup

## ✅ Models Are Now Bundled

The required face-api.js model files are included in the repository under `backend/models/face-api/`.
No manual download is required — just install npm dependencies and start the server.

## Models Included

| File | Purpose | Size |
|------|---------|------|
| `ssd_mobilenetv1_model.bin` + manifest | Face detection | ~5.4 MB |
| `face_landmark_68_model.bin` + manifest | Face landmarks (68 points) | ~349 KB |
| `face_recognition_model.bin` + manifest | 128-D face descriptor | ~6.2 MB |
| `tiny_face_detector_model.bin` + manifest | Lightweight real-time detection | ~189 KB |

## Backend Setup

```bash
cd backend
npm install
npm start
```

On first request the server logs:
```
Face recognition models loaded successfully
```

## Frontend Models (CDN)

The React frontend loads models from the jsDelivr CDN at runtime:

```
https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model
```

Models loaded in the browser:
- `tinyFaceDetector` — real-time face detection bounding boxes
- `ssdMobilenetv1` — accurate detection for descriptor extraction
- `faceLandmark68Net` — face landmark detection
- `faceRecognitionNet` — 128-D descriptor for recognition

## Architecture

```
Browser (face-api.js)               Backend (face-api.js / WASM)
─────────────────────               ──────────────────────────
Camera live feed ──────────────────►  POST /api/enroll
 └─ Real-time detection                └─ extractFaceDescriptorFromBase64()
 └─ Capture frame (JPEG base64)         └─ Save descriptor to DB

Face login page ────────────────────►  POST /api/auth/face-login
 └─ Capture frame (JPEG base64)         └─ extractFaceDescriptorFromBase64()
                                         └─ Compare against all stored descriptors
                                         └─ Return matched user + JWT
```

## Troubleshooting

**Error: Face recognition models not found**
- Ensure you have run `git pull` to get the latest model files
- Check `backend/models/face-api/` contains `*.bin` and `*-weights_manifest.json` files

**Error: WASM backend not initialized**
- This is fixed in `utils/faceDetection.js` via `await tf.ready()` before model loading

**Frontend models fail to load**
- Check internet connection (models loaded from CDN)
- Browser console will show the specific model that failed

