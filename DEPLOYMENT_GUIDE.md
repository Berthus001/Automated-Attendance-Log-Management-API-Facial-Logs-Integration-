# 🚀 Deployment Guide: Render + Vercel

This guide walks you through deploying your Attendance Management System to production using Render (backend) and Vercel (frontend).

---

## 📋 Before You Start

### What You'll Need:
- ✅ GitHub account (free)
- ✅ Render account (free tier available) - [Sign up](https://render.com)
- ✅ Vercel account (free tier available) - [Sign up](https://vercel.com)
- ✅ MongoDB Atlas cluster (free tier available) - [Sign up](https://mongodb.com/cloud/atlas)
- ✅ Your code pushed to a GitHub repository

### Time Required:
- First-time deployment: ~30-45 minutes
- Subsequent deployments: ~5-10 minutes (automatic)

---

## 🎯 Deployment Overview

```
┌─────────────────────┐
│   1. MongoDB Atlas  │  ← Set up database (if not done)
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  2. Backend (Render)│  ← Deploy API server
└──────────┬──────────┘
           │ Get Backend URL
┌──────────▼──────────┐
│ 3. Frontend(Vercel) │  ← Deploy React app
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│   4. Update CORS    │  ← Configure security
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│   5. Test & Launch  │  ← Verify everything works
└─────────────────────┘
```

---

## 📝 STEP 1: Prepare MongoDB Atlas

### 1.1 Create/Configure Database

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Log in to your account
3. Select your cluster (or create a new one)

### 1.2 Configure Network Access

1. Click **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. Select **"Allow Access from Anywhere"** (0.0.0.0/0)
   - This is needed for Render's dynamic IPs
4. Click **"Confirm"**

### 1.3 Get Connection String

1. Click **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string (should look like):
   ```
   mongodb+srv://username:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual database password
6. Add database name: `attendance_db` before the `?`
   ```
   mongodb+srv://username:password@cluster.mongodb.net/attendance_db?retryWrites=true&w=majority
   ```
7. **Save this connection string** - you'll need it for Render

---

## 🔧 STEP 2: Deploy Backend to Render

### 2.1 Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect a repository"**
4. Authorize Render to access your GitHub
5. Select your repository

### 2.2 Configure Build Settings

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `attendance-api` (or your choice) |
| **Region** | Select closest to your users |
| **Branch** | `main` (or your default branch) |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | Free (or Starter for better performance) |

### 2.3 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add these:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | `5000` | Render sets this automatically, but good to specify |
| `MONGO_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Generate strong secret | **Min 32 characters!** Use password generator |
| `JWT_EXPIRE` | `7d` | Optional: token expiration time |
| `FRONTEND_URL` | `http://localhost:3001` | Update after frontend deployment |

**⚠️ Important:** Generate a strong JWT_SECRET:
```bash
# On Windows PowerShell:
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# Or use an online generator:
# https://randomkeygen.com/ (use "CodeIgniter Encryption Keys")
```

### 2.4 Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes first time)
3. Watch the logs for any errors
4. Once deployed, you'll see: **"Your service is live 🎉"**

### 2.5 Get Your Backend URL

1. Copy the URL shown (e.g., `https://attendance-api.onrender.com`)
2. **Save this URL** - you need it for frontend!
3. Test it by visiting: `https://your-service.onrender.com/`
   - You should see: `{"message": "Welcome to Attendance Management API", ...}`

---

## ⚡ STEP 3: Deploy Frontend to Vercel

### 3.1 Update Production Environment Variables

Before deploying, update your production environment file:

1. Open `frontend/.env.production`
2. Replace with your Render backend URL:
   ```env
   REACT_APP_API_URL=https://attendance-api.onrender.com/api
   ```
   **⚠️ Important:** Don't forget `/api` at the end!

3. **DO NOT commit this file** (it's in .gitignore)

### 3.2 Deploy to Vercel (Method A: Dashboard)

**Recommended for beginners**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Select your GitHub repository
5. Configure project:

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Create React App` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `build` |
| **Install Command** | `npm install` |

6. Add Environment Variable:
   - Click **"Environment Variables"**
   - Key: `REACT_APP_API_URL`
   - Value: `https://attendance-api.onrender.com/api`
   - Apply to: **Production** (checked)

7. Click **"Deploy"**
8. Wait for deployment (3-5 minutes)
9. Once done, you'll get a URL like: `https://your-app.vercel.app`

### 3.3 Deploy to Vercel (Method B: CLI)

**For advanced users**

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login:
   ```bash
   vercel login
   ```

3. Navigate to frontend folder:
   ```bash
   cd frontend
   ```

4. Deploy:
   ```bash
   vercel --prod
   ```

5. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - What's your project's name? `attendance-system` (or your choice)
   - In which directory is your code located? `./`
   - Want to override settings? **Y**
   - Build command: `npm run build`
   - Output directory: `build`
   - Development command: `npm start`

6. Add environment variable:
   ```bash
   vercel env add REACT_APP_API_URL production
   # Paste: https://attendance-api.onrender.com/api
   ```

7. Redeploy:
   ```bash
   vercel --prod
   ```

---

## 🔒 STEP 4: Update CORS Configuration

Now that you have your frontend URL, update backend CORS:

### 4.1 Update Render Environment Variables

1. Go to Render Dashboard → Your service
2. Click **"Environment"** in left sidebar
3. Find `FRONTEND_URL` variable
4. Update value to: `https://your-app.vercel.app`
5. Click **"Save Changes"**
6. Render will automatically redeploy

### 4.2 Verify CORS is Working

The backend `server.js` is already configured to use `FRONTEND_URL`:
```javascript
const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);
```

After Render redeploys, CORS should work automatically!

---

## ✅ STEP 5: Test Your Deployment

### 5.1 Create Superadmin Account

You need to create a superadmin before you can use the system:

**Option A: Using Render Shell**

1. Go to Render Dashboard → Your service
2. Click **"Shell"** tab (top right)
3. Wait for shell to connect
4. Run:
   ```bash
   node create-superadmin.js
   ```
5. You should see: "Superadmin created successfully!"

**Option B: Using Local Script (connects to production DB)**

1. On your local machine:
   ```bash
   cd backend
   ```
2. Temporarily update your local `.env`:
   ```env
   MONGO_URI=<your-production-mongodb-uri>
   ```
3. Run:
   ```bash
   node create-superadmin.js
   ```
4. **Revert `.env` back to development settings**

### 5.2 Test Login

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. You should see the login page
3. Try logging in with superadmin:
   - Email: `superadmin@attendance.com`
   - Password: `Admin@123456`
4. You should be redirected to the dashboard

### 5.3 Test Features

- [ ] Login works
- [ ] Dashboard loads
- [ ] User statistics display
- [ ] Can navigate between tabs (Overview, Users)
- [ ] Webcam loads (may need to grant permissions)
- [ ] Can create a test user (Teacher or Student)
- [ ] Face capture works
- [ ] User appears in the list

### 5.4 Change Default Password

**⚠️ IMPORTANT: Do this immediately!**

1. In dashboard, go to Users tab
2. Find superadmin account
3. Click Edit
4. Change password to something strong
5. Save changes
6. Log out and test new password

---

## 🎉 Deployment Complete!

Your app is now live! Here's what you have:

✅ **Backend API:** `https://attendance-api.onrender.com`
✅ **Frontend App:** `https://your-app.vercel.app`
✅ **Database:** MongoDB Atlas (cloud)
✅ **Superadmin:** Created and password changed
✅ **HTTPS:** Automatic on both platforms
✅ **Auto-deploy:** Enabled from GitHub

---

## 🔄 Making Updates

### Automatic Deployment

Both Render and Vercel are configured for automatic deployment:

1. Make changes to your code locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```
3. Render and Vercel automatically detect the push
4. They rebuild and redeploy automatically (2-5 minutes)
5. Your changes are live!

### Manual Deployment

**Render:**
- Go to your service → Click "Manual Deploy" → Select branch

**Vercel:**
- Go to your project → Deployments → Click "Redeploy"

---

## 🐛 Troubleshooting

### Issue: "Cannot GET /" on Backend

**Symptom:** Backend URL shows error page

**Fix:**
1. Check Render logs for errors
2. Verify `server.js` is in `backend/` folder
3. Check start command is `node server.js`
4. Look for failed dependencies in build logs

### Issue: Frontend Shows "Network Error"

**Symptom:** Login fails, can't connect to backend

**Fix:**
1. Verify `REACT_APP_API_URL` in Vercel environment variables
2. Check backend is running (visit backend URL directly)
3. Check browser console for CORS errors
4. Verify backend CORS configuration includes frontend URL

### Issue: CORS Error

**Symptom:** Browser console shows: "Access to XMLHttpRequest blocked by CORS"

**Fix:**
1. Add frontend URL to Render `FRONTEND_URL` environment variable
2. Verify it includes `https://` and no trailing slash
3. Save and wait for Render to redeploy
4. Clear browser cache and try again

### Issue: MongoDB Connection Failed

**Symptom:** Backend logs show "MongooseServerSelectionError"

**Fix:**
1. Verify `MONGO_URI` in Render environment variables
2. Check MongoDB Atlas Network Access allows 0.0.0.0/0
3. Verify MongoDB user password is correct (no special characters issues)
4. Check database name is in the connection string

### Issue: Render Service Sleeping (Free Tier)

**Symptom:** First request takes 30-60 seconds

**Explanation:** Free tier services sleep after 15 minutes of inactivity

**Fix:**
- Upgrade to Starter plan ($7/month) for always-on service
- Or accept the cold start delay
- Or use a service like [UptimeRobot](https://uptimerobot.com/) to ping your API every 10 minutes

### Issue: Webcam Not Working

**Symptom:** "Camera not found" or permission denied

**Fix:**
1. Webcam requires HTTPS (both Render and Vercel provide this)
2. Grant camera permissions when browser prompts
3. Check browser settings → Site permissions
4. Try a different browser (Chrome recommended)

### Issue: Face Recognition Not Working

**Symptom:** Face detection fails or errors during enrollment

**Fix:**
1. Verify `backend/models/face-api/` folder exists with all model files
2. Check Render build logs - ensure models were included
3. Test with good lighting and face centered in frame
4. Check browser console for JavaScript errors

---

## 💰 Cost Breakdown

### Free Tier (Suitable for testing/small projects)

| Service | Free Tier Limits | Cost |
|---------|-----------------|------|
| **Render** | 750 hours/month, sleeps after 15min inactivity | $0 |
| **Vercel** | 100GB bandwidth, unlimited deployments | $0 |
| **MongoDB Atlas** | 512MB storage, shared cluster | $0 |
| **Total** | | **$0/month** |

### Recommended Paid Tier (For production)

| Service | Plan | Features | Cost |
|---------|------|----------|------|
| **Render** | Starter | Always-on, no sleep, better performance | $7/month |
| **Vercel** | Hobby | Same as free for small projects | $0 |
| **MongoDB Atlas** | M2 | 2GB storage, better performance | $9/month |
| **Total** | | | **$16/month** |

---

## 📚 Additional Resources

### Documentation Links
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)

### Support
- Render Support: [render.com/support](https://render.com/support)
- Vercel Support: [vercel.com/support](https://vercel.com/support)
- MongoDB Support: [mongodb.com/support](https://www.mongodb.com/support)

### Project Documentation
- [Main README](../README.md)
- [API Documentation](backend/README.md)
- [Authentication Flow](backend/AUTHENTICATION_FLOW.md)

---

## ✨ Pro Tips

1. **Environment Variables:** Never commit `.env` files. Always use platform environment variable settings.

2. **Logs:** Check logs regularly:
   - Render: Dashboard → Your service → Logs
   - Vercel: Dashboard → Your project → Deployments → Click deployment → Function logs

3. **Custom Domains:** Both platforms support custom domains:
   - Render: $0 (includes SSL)
   - Vercel: $0 (includes SSL)

4. **Monitoring:** Set up uptime monitoring:
   - [UptimeRobot](https://uptimerobot.com) - Free
   - [Pingdom](https://pingdom.com) - Paid

5. **Backups:** MongoDB Atlas automatically backs up your database (even on free tier)

6. **Performance:** 
   - Enable compression in Express
   - Optimize images before upload
   - Use CDN for static assets (Vercel does this automatically)

7. **Security:**
   - Rotate JWT_SECRET periodically
   - Use strong database passwords
   - Enable 2FA on all accounts (Render, Vercel, MongoDB, GitHub)

---

## 🎯 Next Steps

After successful deployment:

1. ✅ Change default superadmin password
2. ✅ Create admin accounts for your team
3. ✅ Enroll test users (teachers, students)
4. ✅ Test attendance logging
5. ✅ Set up monitoring/alerts
6. ✅ Document custom domain (if using one)
7. ✅ Share URLs with stakeholders
8. ✅ Set up regular database backups
9. ✅ Plan for scaling (upgrade plans if needed)

---

**Need Help?** If you encounter issues not covered here:
1. Check Render/Vercel logs first
2. Search error messages online
3. Check GitHub issues for similar problems
4. Contact support for the specific platform

**Good luck with your deployment! 🚀**
