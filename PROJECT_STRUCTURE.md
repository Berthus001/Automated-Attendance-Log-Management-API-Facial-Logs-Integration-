# 📁 Project Structure with Configuration Files

This document shows the complete project structure including deployment configuration files and their proper locations.

---

## 🗂️ Complete File Structure

```
GROUP 4 - Automated Attendance Log Management API/
│
├── 📄 README.md                              # Main documentation
├── 📄 render.yaml                            # Render backend config (root)
├── 📄 DEPLOYMENT_GUIDE.md                    # Complete deployment guide
├── 📄 DEPLOYMENT_CHECKLIST.md               # Printable checklist
├── 📄 DEPLOYMENT_TROUBLESHOOTING.md         # Troubleshooting guide
├── 📄 DEPLOYMENT_WITH_CONFIG_FILES.md       # Config files guide
├── 📄 QUICK_START_DEPLOYMENT.md             # 15-min quick start
├── 📄 DOCUMENTATION_OVERVIEW.md             # Guide to all docs
├── 📄 .gitignore                            # Git ignore rules
│
├── 📁 backend/                              # Backend API
│   ├── 📄 server.js                        # Main entry point
│   ├── 📄 package.json                     # Backend dependencies
│   ├── 📄 .env                            # Environment vars (not committed)
│   ├── 📄 .env.example                    # Environment template
│   ├── 📄 .gitignore                      # Backend-specific ignores
│   ├── 📄 create-superadmin.js            # Superadmin creation script
│   ├── 📄 README.md                       # Backend documentation
│   ├── 📄 AUTHENTICATION_FLOW.md          # Auth documentation
│   ├── 📄 USER_MANAGEMENT_API.md          # User API docs
│   ├── 📄 LOGS_API.md                     # Logs API docs
│   ├── 📄 [other .md files]               # Additional docs
│   │
│   ├── 📁 config/
│   │   └── db.js                         # MongoDB connection
│   │
│   ├── 📁 controllers/
│   │   ├── authController.js             # Authentication logic
│   │   ├── userController.js             # User CRUD
│   │   ├── logsController.js             # Attendance logs
│   │   └── [other controllers]
│   │
│   ├── 📁 middleware/
│   │   ├── auth.js                       # JWT authentication
│   │   ├── errorHandler.js               # Error handling
│   │   └── logger.js                     # Request logging
│   │
│   ├── 📁 models/
│   │   ├── User.model.js                 # User schema
│   │   ├── Student.model.js              # Student schema
│   │   ├── AttendanceLog.model.js        # Attendance schema
│   │   ├── index.js                      # Model exports
│   │   └── 📁 face-api/                  # Face recognition models
│   │       ├── face_expression_model-weights_manifest.json
│   │       ├── face_landmark_68_model-weights_manifest.json
│   │       ├── face_recognition_model-weights_manifest.json
│   │       ├── ssd_mobilenetv1_model-weights_manifest.json
│   │       └── [other model files]
│   │
│   ├── 📁 routes/
│   │   ├── authRoutes.js                 # Auth endpoints
│   │   ├── userRoutes.js                 # User endpoints
│   │   ├── logsRoutes.js                 # Logs endpoints
│   │   └── [other routes]
│   │
│   ├── 📁 utils/
│   │   ├── faceDetection.js              # Face detection utils
│   │   ├── imageHelpers.js               # Image processing
│   │   └── logger.js                     # Logging utilities
│   │
│   └── 📁 uploads/                        # File uploads (not committed)
│       ├── faces/                        # Face images
│       ├── students/                     # Student photos
│       └── attendance/                   # Attendance images
│
└── 📁 frontend/                           # Frontend React app
    ├── 📄 package.json                   # Frontend dependencies
    ├── 📄 vercel.json                    # Vercel config (frontend folder) ⭐
    ├── 📄 .env.development               # Development env vars
    ├── 📄 .env.production                # Production env vars (not committed)
    ├── 📄 .gitignore                     # Frontend-specific ignores
    ├── 📄 craco.config.js                # CRA config overrides
    ├── 📄 README.md                      # Frontend documentation
    ├── 📄 UPDATED_LOGIN_UI.md            # Login UI docs
    ├── 📄 WEBPACK_WARNINGS_FIX.md        # Build optimization
    │
    ├── 📁 public/
    │   └── index.html                    # HTML template
    │
    └── 📁 src/
        ├── 📄 App.js                     # Main App component
        ├── 📄 index.js                   # Entry point
        ├── 📄 App.css                    # App styles
        ├── 📄 index.css                  # Global styles
        │
        ├── 📁 components/
        │   ├── WebcamCapture.js          # Webcam component
        │   ├── WebcamWithFaceDetection.js # Face detection component
        │   ├── [component files .js]     # Component logic
        │   ├── [component files .css]    # Component styles
        │   ├── FACE_DETECTION.md         # Component docs
        │   └── WEBCAM_NATIVE.md          # Webcam docs
        │
        ├── 📁 pages/
        │   ├── LoginPage.js              # Login page
        │   ├── DashboardPage.js          # Main dashboard
        │   ├── SuperAdminDashboard.js    # Admin dashboard
        │   ├── EnrollPage.js             # Enrollment page
        │   ├── [page files .js]          # Page logic
        │   └── [page files .css]         # Page styles
        │
        ├── 📁 services/
        │   └── api.js                    # API service layer
        │
        └── 📁 utils/
            └── faceRecognitionService.js # Face recognition utils
```

---

## 🎯 Key Configuration File Locations

### ✅ Root Level Files (Project Root)

```
/render.yaml                              # Render backend configuration
/README.md                                # Main documentation
/DEPLOYMENT_*.md                          # Deployment guides
/.gitignore                               # Root git ignores
```

**Why root?**
- Standard location for project-wide configs
- Render looks for `render.yaml` in root
- Documentation is easily discoverable

---

### ✅ Backend Configuration Files

```
/backend/.env                             # Backend environment (NOT committed)
/backend/.env.example                     # Environment template
/backend/.gitignore                       # Backend-specific ignores
/backend/package.json                     # Dependencies and scripts
```

**Why in backend folder?**
- Keeps backend configs separate from frontend
- Clear separation of concerns
- Each service has its own dependencies

---

### ✅ Frontend Configuration Files

```
/frontend/vercel.json                     # Vercel deployment config ⭐
/frontend/.env.development                # Development environment
/frontend/.env.production                 # Production environment (NOT committed)
/frontend/.gitignore                      # Frontend-specific ignores
/frontend/package.json                    # Dependencies and scripts
/frontend/craco.config.js                 # CRA overrides
```

**Why `vercel.json` in frontend folder?**
- ✅ Config lives with the code it configures
- ✅ Cleaner paths (no need for `frontend/` references)
- ✅ When deploying, you set "Root Directory" to `frontend`
- ✅ Vercel applies config relative to that folder
- ✅ Easier for team to understand

**Alternative:** Some projects keep `vercel.json` in root, but then you need:
```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/build"
}
```
Having it in the frontend folder is cleaner.

---

## 📝 Files That Should NOT Be Committed

These files are in `.gitignore`:

### Backend
```
/backend/node_modules/        # Dependencies
/backend/.env                 # Environment secrets
/backend/uploads/             # User uploads
/backend/*.log                # Log files
```

### Frontend
```
/frontend/node_modules/       # Dependencies
/frontend/.env.production     # Production secrets
/frontend/build/              # Build output
```

### Root
```
node_modules/                 # If any root dependencies
.DS_Store                     # macOS
Thumbs.db                     # Windows
```

---

## 🚀 Deployment File Usage

### When Deploying Backend to Render:

1. **Render looks for:** `/render.yaml` in root ✅
2. **Config specifies:** `rootDir: backend` (deploy from backend folder)
3. **Result:** Render deploys only backend code

### When Deploying Frontend to Vercel:

**Option A: Dashboard (Recommended)**
1. Import repository
2. Set "Root Directory" to `frontend`
3. Vercel auto-detects React
4. Uses `/frontend/vercel.json` if present ✅

**Option B: CLI**
```bash
cd frontend
vercel --prod
# Automatically uses frontend/vercel.json
```

---

## 🔍 How Each Platform Finds Config Files

### Render
```
1. Checks root for: render.yaml
2. Reads: rootDir: backend
3. Builds from: /backend/
4. Runs: npm install (in backend folder)
5. Starts: node server.js (from backend)
```

### Vercel (Dashboard)
```
1. You set: Root Directory = frontend
2. Checks: /frontend/vercel.json (if exists)
3. Builds from: /frontend/
4. Runs: npm run build (in frontend folder)
5. Deploys: /frontend/build/
```

### Vercel (CLI from frontend folder)
```
1. You run: vercel --prod (from /frontend/)
2. Looks for: ./vercel.json (finds it ✅)
3. Builds: npm run build
4. Deploys: ./build/
```

---

## ✅ Best Practices

### 1. Configuration Files
- ✅ `render.yaml` in root (Render standard)
- ✅ `vercel.json` in frontend folder (cleaner)
- ✅ `.env.example` in each service folder
- ✅ Actual `.env` NOT committed

### 2. Documentation Files
- ✅ Project-wide docs in root
- ✅ Service-specific docs in service folders
- ✅ Component docs near components

### 3. Git Ignores
- ✅ Root `.gitignore` for project-wide ignores
- ✅ Service-specific `.gitignore` in each service
- ✅ Never commit secrets or node_modules

### 4. Environment Files
- ✅ Template (`.env.example`) committed
- ✅ Actual secrets (`.env`, `.env.production`) NOT committed
- ✅ Development defaults (`.env.development`) can be committed

---

## 🎯 Quick Reference

| What | Where | Committed? |
|------|-------|-----------|
| Render config | `/render.yaml` | ✅ Yes |
| Vercel config | `/frontend/vercel.json` | ✅ Yes |
| Backend secrets | `/backend/.env` | ❌ No |
| Backend template | `/backend/.env.example` | ✅ Yes |
| Frontend secrets | `/frontend/.env.production` | ❌ No |
| Frontend dev env | `/frontend/.env.development` | ✅ Yes (no secrets) |
| Documentation | Root + service folders | ✅ Yes |
| Dependencies | `node_modules/` anywhere | ❌ No |
| Build output | `/frontend/build/` | ❌ No |
| User uploads | `/backend/uploads/` | ❌ No |

---

## 📚 Related Documentation

- [README.md](../README.md) - Main project documentation
- [DEPLOYMENT_WITH_CONFIG_FILES.md](../DEPLOYMENT_WITH_CONFIG_FILES.md) - How to use config files
- [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) - Complete deployment guide

---

**Last Updated:** April 29, 2026

This structure follows industry best practices for monorepo projects with separate backend and frontend services. ✨
