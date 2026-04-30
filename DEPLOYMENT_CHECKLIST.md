# 📋 Quick Deployment Checklist

Print this and check off as you go!

---

## ☑️ Pre-Deployment Preparation

### Accounts
- [ ] GitHub account created and repository pushed
- [ ] Render account created (render.com)
- [ ] Vercel account created (vercel.com)
- [ ] MongoDB Atlas account created with cluster

### Code Preparation
- [ ] All code committed and pushed to GitHub
- [ ] `.gitignore` includes `.env`, `node_modules`, `uploads`
- [ ] No hardcoded secrets in code
- [ ] `backend/.env.example` reviewed
- [ ] Face-api models in `backend/models/face-api/`
- [ ] Test locally - backend runs: `cd backend && npm start`
- [ ] Test locally - frontend runs: `cd frontend && npm start`

---

## ☑️ MongoDB Atlas Setup

- [ ] Network Access set to 0.0.0.0/0
- [ ] Database user created with password
- [ ] Connection string copied and password replaced
- [ ] Database name added to connection string: `attendance_db`
- [ ] Connection string saved in safe place

**Your MongoDB URI:**
```
mongodb+srv://_________________:_________________@_________.mongodb.net/attendance_db?retryWrites=true&w=majority
```

---

## ☑️ Backend Deployment (Render)

### Service Creation
- [ ] New Web Service created
- [ ] GitHub repository connected
- [ ] Root Directory set to: `backend`
- [ ] Runtime set to: `Node`
- [ ] Build Command: `npm install`
- [ ] Start Command: `node server.js`

### Environment Variables Added
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `5000`
- [ ] `MONGO_URI` = (your MongoDB connection string)
- [ ] `JWT_SECRET` = (32+ character random string)
- [ ] `JWT_EXPIRE` = `7d`
- [ ] `FRONTEND_URL` = `http://localhost:3001` (update later)

### Deployment
- [ ] Clicked "Create Web Service"
- [ ] Deployment succeeded (check logs)
- [ ] Service is live
- [ ] Backend URL copied and saved
- [ ] Tested backend URL in browser (shows welcome message)

**Your Backend URL:**
```
https://________________________________.onrender.com
```

---

## ☑️ Frontend Deployment (Vercel)

### Preparation
- [ ] Created `frontend/.env.production` file
- [ ] Set `REACT_APP_API_URL` to backend URL + `/api`
- [ ] Verified backend URL includes `/api` at the end

### Vercel Configuration
- [ ] Imported Git repository
- [ ] Root Directory set to: `frontend`
- [ ] Framework Preset: `Create React App`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `build`
- [ ] Install Command: `npm install`

### Environment Variables
- [ ] Added `REACT_APP_API_URL` = `https://your-backend.onrender.com/api`
- [ ] Set to apply to Production environment

### Deployment
- [ ] Clicked "Deploy"
- [ ] Deployment succeeded
- [ ] Frontend URL copied and saved
- [ ] Visited frontend URL in browser

**Your Frontend URL:**
```
https://________________________________.vercel.app
```

---

## ☑️ CORS Configuration Update

- [ ] Go to Render Dashboard → Your service → Environment
- [ ] Update `FRONTEND_URL` to Vercel URL
- [ ] Saved changes
- [ ] Waited for automatic redeploy (~2-3 minutes)
- [ ] Deployment succeeded

---

## ☑️ Superadmin Setup

### Create Superadmin
- [ ] Accessed Render Shell OR ran locally
- [ ] Ran: `node create-superadmin.js`
- [ ] Saw success message

### Test Login
- [ ] Visited frontend URL
- [ ] Logged in with: `superadmin@attendance.com` / `Admin@123456`
- [ ] Successfully logged in
- [ ] Dashboard loaded correctly

### Change Password
- [ ] Navigated to Users tab
- [ ] Found superadmin user
- [ ] Clicked Edit
- [ ] Changed password to strong password
- [ ] Saved changes
- [ ] Logged out
- [ ] Logged in with new password successfully

**New Superadmin Password (keep secure!):**
```
_________________________________________________
```

---

## ☑️ Feature Testing

### Basic Features
- [ ] Login/logout works
- [ ] Dashboard displays statistics
- [ ] Can switch between tabs (Overview, Users)
- [ ] User list loads

### User Management
- [ ] Can click "Add Teacher" button
- [ ] Modal opens correctly
- [ ] Form fields work (name, email, password)
- [ ] Department dropdown works
- [ ] Can select a department

### Face Recognition
- [ ] Browser requested webcam permission
- [ ] Granted webcam permission
- [ ] Webcam feed shows in modal
- [ ] Can capture face image
- [ ] Face rectangle appears (detection working)

### Create User
- [ ] Filled out test teacher form
- [ ] Captured face image
- [ ] Submitted form
- [ ] User created successfully
- [ ] User appears in list
- [ ] Can edit user
- [ ] Can delete user

---

## ☑️ Production Verification

### Security
- [ ] Default superadmin password changed
- [ ] JWT_SECRET is strong (32+ characters)
- [ ] MongoDB password is strong
- [ ] No `.env` files committed to Git
- [ ] HTTPS enabled (automatic on Render & Vercel)
- [ ] CORS properly configured

### Performance
- [ ] Frontend loads in reasonable time (<5 seconds)
- [ ] Backend responds quickly (<2 seconds)
- [ ] Webcam initializes properly
- [ ] Face detection works with good lighting
- [ ] Images upload successfully

### Monitoring
- [ ] Bookmarked Render logs URL
- [ ] Bookmarked Vercel deployments URL
- [ ] Bookmarked MongoDB Atlas dashboard
- [ ] Set up uptime monitoring (optional but recommended)

---

## ☑️ Documentation

- [ ] Updated README.md with deployment info
- [ ] Documented production URLs
- [ ] Shared credentials with team (securely!)
- [ ] Created backup of environment variables
- [ ] Documented any custom configuration

---

## 📝 Quick Reference URLs

| Service | URL | Notes |
|---------|-----|-------|
| **Frontend** | https://_________________.vercel.app | Main user interface |
| **Backend** | https://_________________.onrender.com | API server |
| **Render Dashboard** | https://dashboard.render.com | Backend logs & settings |
| **Vercel Dashboard** | https://vercel.com/dashboard | Frontend deployments |
| **MongoDB Atlas** | https://cloud.mongodb.com | Database management |
| **GitHub Repo** | https://github.com/______/______ | Source code |

---

## 🎯 Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Change superadmin password
- [ ] Create admin accounts for team
- [ ] Test all major features
- [ ] Verify webcam works on different browsers

### Week 1
- [ ] Monitor error logs daily
- [ ] Create test users (teachers, students)
- [ ] Test face recognition accuracy
- [ ] Document any issues

### Ongoing
- [ ] Check logs weekly
- [ ] Monitor database storage usage
- [ ] Update dependencies monthly
- [ ] Regular database backups (automatic on Atlas)

---

## 🆘 Emergency Contacts

| Issue | Where to Check |
|-------|----------------|
| Backend down | Render logs + Dashboard |
| Frontend errors | Browser console + Vercel logs |
| Database issues | MongoDB Atlas metrics |
| Deployment failed | GitHub Actions (if enabled) |

---

## ✅ Deployment Status

**Deployment Date:** ____________________

**Deployed By:** ____________________

**Status:** 
- [ ] ✅ Fully deployed and tested
- [ ] ⚠️ Deployed with minor issues
- [ ] ❌ Deployment failed

**Notes:**
```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

---

**Congratulations! Your app is deployed! 🎉**

Keep this checklist for reference and future deployments.
