# Face Recognition Technical Reference

Implementation details for the face recognition pipeline.

---

## Technology Stack

| Component | Library | Version |
|---|---|---|
| Face detection & descriptor extraction | `@vladmandic/face-api` | 1.7.15 |
| ML backend | `@tensorflow/tfjs` + `tfjs-backend-wasm` | 4.22 |
| Image processing | `sharp` | 0.34 |
| Canvas support | `canvas` | 3.2 |
| ML model files | `backend/models/face-api/` | SSD MobileNet v1 |

---

## Pipeline Overview

```
1. Receive base64 image string
2. Decode base64 ? Buffer
3. Process with Sharp:
   - Resize to 416×416
   - Convert to JPEG (quality 90)
   - Normalise to RGB
4. Create face-api canvas image
5. Detect face with SSD MobileNet v1
6. Extract 128-point face descriptor
7. Compare against stored descriptors (Euclidean distance)
8. Return best match below threshold
```

---

## Key Utilities (`backend/utils/faceDetection.js`)

### `extractFaceDescriptor(base64Image)`

Accepts a `data:image/...;base64,...` string.
Returns a 128-element Float32Array face descriptor, or throws if no face is detected.

```js
const descriptor = await extractFaceDescriptor(imageBase64);
// Float32Array(128) [0.0234, -0.1023, ...]
```

### `compareFaceDescriptors(descriptor1, descriptor2)`

Returns the Euclidean distance between two 128-point descriptors.

```js
const distance = compareFaceDescriptors(knownDescriptor, candidateDescriptor);
// 0.2345 ? match  |  0.7812 ? no match
```

### `findBestMatch(queryDescriptor, candidateDescriptors)`

Iterates all candidates, returns the best match and its distance.

```js
const { match, distance } = findBestMatch(queryDescriptor, allUserDescriptors);
```

---

## Face Matching Thresholds

| Distance Range | Classification |
|---|---|
| `0.0 – 0.40` | Strong match (early exit, not all candidates scanned) |
| `0.40 – 0.59` | Match |
| `0.60+` | No match |

These thresholds apply to:
- `POST /api/auth/face-login` — student/teacher kiosk login
- `POST /api/auth/face-verify` — admin 2FA verification
- `POST /api/face-login` — legacy student enrollment face login

---

## ML Model Files

Models are stored in `backend/models/face-api/` and loaded on server startup via `backend/utils/faceDetection.js`.

Required files:

```
backend/models/face-api/
  ssd_mobilenetv1_model-weights_manifest.json
  ssd_mobilenetv1_model-shard1
  face_landmark_68_model-weights_manifest.json
  face_landmark_68_model-shard1
  face_recognition_model-weights_manifest.json
  face_recognition_model-shard1
```

See [MODELS_SETUP.md](MODELS_SETUP.md) for download instructions.

---

## Image Processing (`backend/utils/imageProcessor.js`)

All images go through pre-processing before descriptor extraction:

| Step | Operation | Value |
|---|---|---|
| Resize | Fit within bounding box | 416×416 |
| Format | Convert to JPEG | Quality 90 |
| Normalise | RGB channel order | Yes |

---

## Performance Notes

- First inference after cold start is slower (~2–3 s) due to WASM JIT
- Subsequent inferences are faster (~200–500 ms)
- Bulk descriptor comparisons are O(n) — performance degrades with 1000+ enrolled users
- Face descriptors are stored as plain `[Number]` arrays in MongoDB — no special index needed for comparisons
