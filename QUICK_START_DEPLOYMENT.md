# ⚡ Quick Start: Deploy in 15 Minutes

**TL;DR** - Fast track deployment for experienced developers.

---

## 🎯 Prerequisites

- [ ] GitHub repo with code
- [ ] MongoDB Atlas cluster ready
- [ ] Render account
- [ ] Vercel account

---

## 🚀 3-Step Deployment

### STEP 1: Backend (Render) - 5 minutes

1. **Create Service:**
   - Go to render.com → New Web Service
   - Connect GitHub repo
   - Root Dir: `backend`
   - Build: `npm install`
   - Start: `node server.js`

2. **Environment Variables:**
   ```env
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/attendance_db?retryWrites=true&w=majority
   JWT_SECRET=[32+ random characters]
   FRONTEND_URL=http://localhost:3001
   ```

3. **Deploy & Copy URL**

---

### STEP 2: Frontend (Vercel) - 5 minutes

1. **Create `.env.production`:**
   ```env
   REACT_APP_API_URL=https://your-backend.onrender.com/api
   ```

2. **Deploy:**
   - Go to vercel.com → New Project
   - Import repo
   - Root Dir: `frontend`
   - Framework: Create React App
   - Add env var: `REACT_APP_API_URL`

3. **Copy Vercel URL**

---

### STEP 3: Update CORS - 2 minutes

1. Go to Render → Environment
2. Update `FRONTEND_URL` to Vercel URL
3. Wait for redeploy

---

## 🔐 Create Superadmin - 3 minutes

**In Render Shell:**
```bash
node create-superadmin.js
```

**Or locally:**
```bash
# Update local .env with production MONGO_URI
cd backend
node create-superadmin.js
# Revert .env
```

**Login:**
- Email: `superadmin@attendance.com`
- Password: `Admin@123456`
- **Change password immediately!**

---

## ✅ Quick Test

1. Visit Vercel URL
2. Login with superadmin
3. Create test teacher
4. Verify webcam works
5. Done! ✨

---

## 📚 Full Documentation

- [Complete Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- [Troubleshooting Guide](./DEPLOYMENT_TROUBLESHOOTING.md)
- [Main README](./README.md)

---

## 🐛 Common Issues

| Issue | Fix |
|-------|-----|
| CORS error | Update `FRONTEND_URL` in Render |
| MongoDB fails | Check Network Access: 0.0.0.0/0 |
| Build fails | Verify Root Directory settings |
| White screen | Check browser console + env vars |
| Service sleeping | Free tier sleeps after 15min (normal) |

---

## 🔗 Quick Links

**Your URLs:**
- Backend: `https://[your-service].onrender.com`
- Frontend: `https://[your-app].vercel.app`

**Dashboards:**
- Render: https://dashboard.render.com
- Vercel: https://vercel.com/dashboard
- MongoDB: https://cloud.mongodb.com

**Logs:**
- Render: Dashboard → Service → Logs
- Vercel: Dashboard → Project → Deployments
- Browser: F12 → Console

---

## 💡 Pro Tips

1. **Save your URLs** - You'll need them multiple times
2. **Enable auto-deploy** - Push to GitHub = auto redeploy
3. **Use strong secrets** - 32+ character JWT_SECRET
4. **Monitor logs** - First few days, check regularly
5. **Upgrade later** - Start free, upgrade if needed

---

## 📞 Need Help?

1. Check [Troubleshooting Guide](./DEPLOYMENT_TROUBLESHOOTING.md)
2. Read platform logs
3. Search error on Google/Stack Overflow
4. Contact platform support

---

**Total Time:** ~15 minutes
**Cost:** $0 (free tiers)
**Difficulty:** ⭐⭐⭐ (Medium)

**You got this! 🚀**
