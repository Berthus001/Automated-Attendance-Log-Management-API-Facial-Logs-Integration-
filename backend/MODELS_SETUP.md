# Models Setup — Face-API ML Files

The face recognition system requires pre-trained model weight files to be placed in `backend/models/face-api/` before starting the server.

---

## Required Model Files

```
backend/models/face-api/
  ssd_mobilenetv1_model-weights_manifest.json
  ssd_mobilenetv1_model-shard1
  face_landmark_68_model-weights_manifest.json
  face_landmark_68_model-shard1
  face_recognition_model-weights_manifest.json
  face_recognition_model-shard1
```

---

## Download

Download model files from the `@vladmandic/face-api` npm package or its GitHub releases:

```bash
# Install the package (if not already installed)
npm install @vladmandic/face-api

# Copy model files from the package
cp -r node_modules/@vladmandic/face-api/model/* backend/models/face-api/
```

Or download directly from:
https://github.com/vladmandic/face-api/tree/master/model

---

## Directory Structure After Setup

```
backend/
  models/
    face-api/
      ssd_mobilenetv1_model-weights_manifest.json
      ssd_mobilenetv1_model-shard1
      face_landmark_68_model-weights_manifest.json
      face_landmark_68_model-shard1
      face_recognition_model-weights_manifest.json
      face_recognition_model-shard1
    index.js           ? Mongoose model exports
```

---

## Verification

The models are loaded automatically on server startup by `backend/utils/faceDetection.js`. If model files are missing, the server will throw a `Cannot read properties of undefined` error during the first face operation.

To verify the setup is working, make a POST request to `POST /api/auth/face-login` with a valid face image. A successful face detection confirms models are loaded correctly.
