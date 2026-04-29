# Face Recognition Model Setup

## ⚠️ IMPORTANT: Models Required for Enrollment

The enrollment system requires face-api.js models for face detection and recognition.

## Quick Download - Option 1: Direct Download (Recommended)

**Download the complete model package:**

1. Visit: https://github.com/vladmandic/face-api/tree/master/model
2. Click on each file and download:
   - Click the file name
   - Click the "Download raw file" button
   - Save to `backend/models/face-api/`

## Option 2: Manual URLs

1. **Create models directory** (already created at `models/face-api/`)

2. **Download these files to `backend/models/face-api/`:**

### SSD MobileNet V1 (Face Detection)
- `ssd_mobilenetv1_model-weights_manifest.json`
- `ssd_mobilenetv1_model-shard1`

### Face Landmark 68 Net
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`

### Face Recognition Net
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model-shard1`
- `face_recognition_model-shard2`

## Quick Setup (Windows PowerShell)

```powershell
# Create directory
New-Item -ItemType Directory -Force -Path "models\face-api"

# Download models (requires curl or wget)
cd models\face-api

# SSD MobileNet V1
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/vladmandic/face-api/master/model/ssd_mobilenetv1_model-weights_manifest.json" -OutFile "ssd_mobilenetv1_model-weights_manifest.json"
Invoke-WebRequest -Uri "https://github.com/vladmandic/face-api/raw/master/model/ssd_mobilenetv1_model-shard1" -OutFile "ssd_mobilenetv1_model-shard1"

# Face Landmark 68
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_landmark_68_model-weights_manifest.json" -OutFile "face_landmark_68_model-weights_manifest.json"
Invoke-WebRequest -Uri "https://github.com/vladmandic/face-api/raw/master/model/face_landmark_68_model-shard1" -OutFile "face_landmark_68_model-shard1"

# Face Recognition
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_recognition_model-weights_manifest.json" -OutFile "face_recognition_model-weights_manifest.json"
Invoke-WebRequest -Uri "https://github.com/vladmandic/face-api/raw/master/model/face_recognition_model-shard1" -OutFile "face_recognition_model-shard1"
Invoke-WebRequest -Uri "https://github.com/vladmandic/face-api/raw/master/model/face_recognition_model-shard2" -OutFile "face_recognition_model-shard2"

cd ..\..
```

## Verify Installation

Your directory structure should look like:
```
/backend
  ├── models/
  │   └── face-api/
  │       ├── ssd_mobilenetv1_model-weights_manifest.json
  │       ├── ssd_mobilenetv1_model-shard1
  │       ├── face_landmark_68_model-weights_manifest.json
  │       ├── face_landmark_68_model-shard1
  │       ├── face_recognition_model-weights_manifest.json
  │       ├── face_recognition_model-shard1
  │       └── face_recognition_model-shard2
```

## Test Models

Start the server and make an enrollment request. If models are loaded correctly, you'll see:
```
Face recognition models loaded successfully
```

## Troubleshooting

**Error: Face recognition models not found**
- Ensure models are in `backend/models/face-api/`
- Check file names match exactly (case-sensitive)
- Verify all 7 files are present

**Error: Failed to load models**
- Check file permissions
- Ensure files are not corrupted
- Re-download the models

## Model Sizes

- SSD MobileNet V1: ~5.7 MB
- Face Landmark 68: ~350 KB
- Face Recognition: ~6.2 MB
- **Total: ~12.3 MB**
