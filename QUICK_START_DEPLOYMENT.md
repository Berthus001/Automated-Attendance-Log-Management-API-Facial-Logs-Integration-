# Quick Start — Deployment

Fastest path from zero to running system.

---

## Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd "GROUP 4 - Automated Attendance Log Management API (Facial Logs Integration)"
```

---

## Step 2: Configure Backend

```bash
cd backend
cp .env.example .env   # or create .env manually
```

Edit `backend/.env`:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/attendance
JWT_SECRET=generate-a-random-64-char-string-here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3001
```

Generate `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Step 3: Install Backend Dependencies

```bash
cd backend
npm install
```

---

## Step 4: Download Face-API Models

Create `backend/models/face-api/` and add these files from the [@vladmandic/face-api releases](https://github.com/vladmandic/face-api/tree/master/model):

- `ssd_mobilenetv1_model-weights_manifest.json`
- `ssd_mobilenetv1_model-shard1`
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model-shard1`

---

## Step 5: Start Backend

```bash
cd backend
node server.js
# Server starts on http://localhost:5000
```

---

## Step 6: Create Superadmin

```bash
cd backend
node create-superadmin.js
```

Default credentials:
- Email: `superadmin@attendance.com`
- Password: `Admin@123456`

---

## Step 7: Configure Frontend

```bash
cd frontend
```

Create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## Step 8: Install Frontend Dependencies and Start

```bash
cd frontend
npm install
npm start
# Frontend starts on http://localhost:3001
```

---

## Step 9: Verify Everything Works

1. Open `http://localhost:3001` — kiosk page should load
2. Open `http://localhost:3001/admin-login` — login form should appear
3. Log in with `superadmin@attendance.com` / `Admin@123456`
4. Dashboard should open

---

## Deploy to Production

| Service | Guide |
|---|---|
| Backend ? Render | [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) |
| Frontend ? Vercel | [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) |
| Config files | [DEPLOYMENT_WITH_CONFIG_FILES.md](DEPLOYMENT_WITH_CONFIG_FILES.md) |
| Troubleshooting | [DEPLOYMENT_TROUBLESHOOTING.md](DEPLOYMENT_TROUBLESHOOTING.md) |
| Pre-deploy checklist | [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) |
