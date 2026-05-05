# Deployment Guide

Complete instructions for deploying to Render (backend) and Vercel (frontend).

---

## Prerequisites

- Node.js v20.x
- MongoDB Atlas cluster (free tier is sufficient)
- Render account (render.com)
- Vercel account (vercel.com)
- Git repository

---

## Backend Deployment — Render

### 1. Connect Repository

1. Log in to [render.com](https://render.com)
2. Click **New ? Web Service**
3. Connect your Git repository

### 2. Configure Service

| Setting | Value |
|---|---|
| **Name** | `attendance-api` |
| **Root Directory** | `backend` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Node Version** | 20 |
| **Plan** | Free (Starter) |

### 3. Environment Variables

Add these in the Render dashboard under **Environment**:

```
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
JWT_SECRET=<random-64-char-string>
JWT_EXPIRE=7d
FRONTEND_URL=https://your-app.vercel.app
```

> Generate `JWT_SECRET`:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 4. Using render.yaml (optional)

The project includes a `render.yaml` at the root. Render will auto-detect it.

```yaml
services:
  - type: web
    name: attendance-api
    env: node
    rootDir: backend
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
```

### 5. Deploy

Click **Create Web Service**. Render will build and deploy automatically.

**First deploy takes ~3–5 minutes** (npm install + face-api model load).

---

## Frontend Deployment — Vercel

### 1. Connect Repository

1. Log in to [vercel.com](https://vercel.com)
2. Click **New Project** ? import your Git repository

### 2. Configure Project

| Setting | Value |
|---|---|
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `build` |

### 3. Environment Variables

Add this in the Vercel dashboard under **Settings ? Environment Variables**:

```
REACT_APP_API_URL=https://your-api.onrender.com/api
```

### 4. vercel.json

The project includes `frontend/vercel.json` for SPA routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### 5. Deploy

Click **Deploy**. Vercel builds automatically and assigns a URL.

---

## Post-Deployment Setup

### Create Superadmin

After the backend is deployed:

```bash
# Connect to Render shell (or run locally with production MONGO_URI)
cd backend
node create-superadmin.js
```

Default credentials:
- Email: `superadmin@attendance.com`
- Password: `Admin@123456`

> **Change the password immediately after first login.**

### Enroll Admin Face

1. Log in at `https://your-app.vercel.app/admin-login`
2. Enter email + password
3. The system will prompt for face enrollment
4. Follow the on-screen instructions

---

## Environment Variables Reference

### Backend (.env)

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your-very-long-random-secret
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3001
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## CORS Configuration

The backend allows requests from the `FRONTEND_URL` environment variable. Set this to your Vercel URL in production. During development it defaults to `http://localhost:3001`.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Build fails — `canvas` module error | Render automatically handles native dependencies. Check build logs. |
| `MongoServerError: bad auth` | Check `MONGO_URI` — ensure user/password are correct and URL-encoded |
| Frontend shows blank page | Check that `REACT_APP_API_URL` points to the correct Render URL |
| 401 on all requests | JWT_SECRET mismatch between deploys — ensure env var is set |
| Face login fails | Verify face-api model files are in `backend/models/face-api/` |
| Session stuck (409) | Use `forceLogin: true` or wait 24 hours |

See [DEPLOYMENT_TROUBLESHOOTING.md](DEPLOYMENT_TROUBLESHOOTING.md) for more detail.
