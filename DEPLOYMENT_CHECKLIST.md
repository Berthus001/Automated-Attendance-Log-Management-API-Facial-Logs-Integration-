# Deployment Checklist

Step-by-step checklist to validate a successful deployment.

---

## Pre-Deployment

- [ ] MongoDB Atlas cluster is running and accessible
- [ ] Atlas network access allows Render IPs (or set to `0.0.0.0/0` for all)
- [ ] Atlas database user has read/write access
- [ ] Face-api model files present in `backend/models/face-api/`
- [ ] `backend/package.json` lists all dependencies (no dev-only deps needed in production)
- [ ] `.env` values are set for local testing

---

## Backend (Render)

- [ ] Repository connected to Render
- [ ] Root directory set to `backend`
- [ ] Start command: `node server.js`
- [ ] Build command: `npm install`
- [ ] Node.js version: 20
- [ ] Environment variables set:
  - [ ] `NODE_ENV=production`
  - [ ] `MONGO_URI` — Atlas connection string
  - [ ] `JWT_SECRET` — random 64+ char string
  - [ ] `JWT_EXPIRE=7d`
  - [ ] `FRONTEND_URL` — Vercel frontend URL
  - [ ] `PORT=10000` (Render's default)

---

## Frontend (Vercel)

- [ ] Repository connected to Vercel
- [ ] Root directory set to `frontend`
- [ ] Build command: `npm run build`
- [ ] Output directory: `build`
- [ ] Environment variable set:
  - [ ] `REACT_APP_API_URL=https://your-api.onrender.com/api`
- [ ] `vercel.json` present with SPA rewrite rule

---

## Post-Deployment Verification

### Backend health check
```bash
curl https://your-api.onrender.com/api/auth/me
# Expected: 401 { "success": false, "message": "Not authorized..." }
# (401 confirms the server is running and auth middleware is active)
```

### Create superadmin
```bash
cd backend
MONGO_URI=<atlas-uri> node create-superadmin.js
```

### Admin login test
```bash
curl -X POST https://your-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@attendance.com","password":"Admin@123456"}'
# Expected: 200 with token
```

### Frontend reachable
- [ ] `https://your-app.vercel.app` loads without blank page
- [ ] `/admin-login` page renders correctly
- [ ] `/` (kiosk page) renders correctly

### Face enrollment test
- [ ] Log in with email + password
- [ ] Enroll face via webcam
- [ ] Verify 2FA works on next login

### Kiosk test
- [ ] Student/teacher face scan triggers attendance log
- [ ] `GET /api/logs` returns the attendance record

---

## Security Checklist

- [ ] Default superadmin password changed
- [ ] `JWT_SECRET` is unique and not committed to repo
- [ ] `MONGO_URI` credentials not committed to repo
- [ ] `NODE_ENV=production` (disables debug logging)
- [ ] CORS is restricted to your Vercel URL only (via `FRONTEND_URL`)

---

## Rollback Plan

If deployment fails:
1. Check Render build logs for npm install errors
2. Check environment variables for missing/wrong values
3. Test MongoDB connection: `node test-atlas-connection.js` locally with Atlas URI
4. Redeploy the last working commit from Render dashboard
