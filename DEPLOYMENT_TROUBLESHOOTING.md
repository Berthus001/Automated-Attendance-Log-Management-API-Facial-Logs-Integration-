# 🔧 Deployment Troubleshooting Guide

Common issues and their solutions when deploying to Render + Vercel.

---

## 🚨 Backend Issues (Render)

### Issue #1: Build Failed on Render

**Symptoms:**
- Render shows "Build failed" status
- Logs show npm install errors

**Common Causes & Fixes:**

1. **Missing package.json**
   ```
   Fix: Verify backend/package.json exists and is committed
   ```

2. **Wrong Node version**
   ```
   Fix: Add .node-version file in backend folder with: 20.20.2
   ```

3. **Failed to install dependencies**
   ```
   Fix: Delete package-lock.json, run npm install locally, commit new lock file
   ```

4. **Canvas module installation fails**
   ```
   Good news: You're using @vladmandic/face-api which doesn't require native compilation!
   This error should not occur. If it does, check build logs for the actual error.
   ```

---

### Issue #2: Backend Deployed but Crashes

**Symptoms:**
- Build succeeded
- Service starts then immediately crashes
- Logs show "Application error"

**Check These:**

1. **Check server.js location**
   ```bash
   # Should be: backend/server.js
   # NOT: server.js or src/server.js
   ```

2. **Check start command**
   ```bash
   # Render start command should be: node server.js
   # NOT: npm start (unless your package.json has this script)
   ```

3. **Check for port issues**
   ```javascript
   // In server.js, should be:
   const PORT = process.env.PORT || 5000;
   // NOT hardcoded: const PORT = 5000;
   ```

4. **Check MongoDB connection**
   - Verify MONGO_URI environment variable is set
   - Test connection string locally first
   - Check MongoDB Atlas allows 0.0.0.0/0

---

### Issue #3: MongoDB Connection Failed

**Symptoms:**
- Render logs show: `MongooseServerSelectionError`
- Backend can't connect to database

**Fixes:**

1. **Verify connection string format**
   ```
   ✅ Correct:
   mongodb+srv://username:password@cluster.mongodb.net/attendance_db?retryWrites=true&w=majority
   
   ❌ Wrong:
   - Missing database name
   - Has < > brackets still
   - Wrong password
   ```

2. **Check MongoDB Atlas Network Access**
   - Go to MongoDB Atlas → Network Access
   - Must have 0.0.0.0/0 in whitelist
   - Add it if missing

3. **Password has special characters**
   ```
   If password has special chars like @, #, $, %, encode them:
   @ → %40
   # → %23
   $ → %24
   % → %25
   
   Or change password to alphanumeric only
   ```

4. **Database name missing**
   ```
   Add /attendance_db before the ?
   mongodb+srv://user:pass@cluster.mongodb.net/attendance_db?options=here
                                                    ↑ Add this!
   ```

---

### Issue #4: CORS Errors from Frontend

**Symptoms:**
- Frontend shows "Network Error"
- Browser console: "blocked by CORS policy"

**Fixes:**

1. **Update FRONTEND_URL in Render**
   ```
   1. Go to Render → Your service → Environment
   2. Find FRONTEND_URL variable
   3. Set to: https://your-app.vercel.app
   4. NO trailing slash!
   5. Save → Wait for redeploy
   ```

2. **Verify server.js CORS config**
   ```javascript
   // Should have:
   const allowedOrigins = [
     'http://localhost:3001',
     process.env.FRONTEND_URL
   ].filter(Boolean);
   
   app.use(cors({
     origin: function (origin, callback) {
       if (!origin) return callback(null, true);
       if (process.env.NODE_ENV === 'development') {
         return callback(null, true);
       }
       if (allowedOrigins.indexOf(origin) !== -1) {
         callback(null, true);
       } else {
         callback(new Error('Not allowed by CORS'));
       }
     },
     credentials: true
   }));
   ```

3. **Clear browser cache**
   ```
   1. Press Ctrl+Shift+Delete
   2. Select "Cached images and files"
   3. Click "Clear data"
   4. Refresh page
   ```

---

### Issue #5: Service Keeps Sleeping (Free Tier)

**Symptoms:**
- First request takes 30-60 seconds
- Then works fine for a while
- After 15 minutes of no use, slow again

**Explanation:**
- This is normal behavior for Render Free tier
- Service sleeps after 15 minutes of inactivity
- Wakes up on first request (cold start)

**Solutions:**

1. **Upgrade to paid plan** ($7/month Starter)
   - Always-on service
   - No sleep/cold starts
   - Better performance

2. **Use a ping service** (Keep free tier awake)
   - [UptimeRobot](https://uptimerobot.com) - Free
   - Set to ping your API every 10 minutes
   - Example: `https://your-api.onrender.com/`

3. **Accept the cold start**
   - First request is slow, subsequent ones are fast
   - Good for testing/demos
   - Not ideal for production

---

### Issue #6: Face Recognition Models Not Loading

**Symptoms:**
- Backend starts fine
- Face detection/enrollment fails
- Logs show: "Failed to load model"

**Fixes:**

1. **Verify models directory exists**
   ```bash
   backend/models/face-api/
   ├── face_expression_model-weights_manifest.json
   ├── face_landmark_68_model-weights_manifest.json
   ├── face_recognition_model-weights_manifest.json
   ├── ssd_mobilenetv1_model-weights_manifest.json
   └── ... (all model files)
   ```

2. **Ensure models are committed to Git**
   ```bash
   # Check .gitignore doesn't exclude them
   # Should NOT have: models/ or *.json in .gitignore
   ```

3. **Check file paths in code**
   ```javascript
   // In faceDetection.js or similar:
   const MODEL_PATH = path.join(__dirname, '../models/face-api');
   // Verify this path is correct
   ```

---

## 🌐 Frontend Issues (Vercel)

### Issue #7: Vercel Build Failed

**Symptoms:**
- Vercel shows "Build Failed"
- Deployment never completes

**Common Fixes:**

1. **Wrong root directory**
   ```
   Vercel Settings:
   Root Directory: frontend
   NOT: . (root) or src
   ```

2. **Build command issues**
   ```
   Build Command: npm run build
   NOT: npm build or react-scripts build
   ```

3. **Missing dependencies**
   ```bash
   # Locally, in frontend folder:
   npm install
   # Commit package-lock.json
   git add package-lock.json
   git commit -m "Update package-lock"
   git push
   ```

4. **Environment variable missing**
   ```
   Add in Vercel dashboard:
   Key: REACT_APP_API_URL
   Value: https://your-backend.onrender.com/api
   ```

5. **React warnings treated as errors**
   ```
   If build fails due to warnings, add to package.json:
   "scripts": {
     "build": "GENERATE_SOURCEMAP=false react-scripts build"
   }
   ```

---

### Issue #8: Frontend Loads but Shows White Screen

**Symptoms:**
- Vercel deployment succeeded
- Page loads but is blank/white
- No errors in Vercel logs

**Fixes:**

1. **Check browser console**
   ```
   Press F12 → Console tab
   Look for JavaScript errors
   Common: "Cannot read property of undefined"
   ```

2. **Verify routing**
   ```javascript
   // In App.js, should have:
   <BrowserRouter>
     <Routes>
       <Route path="/" element={<LoginPage />} />
       <Route path="/dashboard" element={<SuperAdminDashboard />} />
     </Routes>
   </BrowserRouter>
   ```

3. **Check API URL**
   ```
   In browser console, check Network tab
   Are requests going to correct backend URL?
   Should be: https://your-backend.onrender.com/api/...
   ```

---

### Issue #9: "Network Error" When Trying to Login

**Symptoms:**
- Login form submits
- Shows "Network Error" or "Cannot connect"
- No API request in Network tab

**Fixes:**

1. **Verify REACT_APP_API_URL**
   ```
   Vercel Dashboard → Your project → Settings → Environment Variables
   
   Check:
   REACT_APP_API_URL = https://your-backend.onrender.com/api
   
   Must have:
   ✅ https:// (not http://)
   ✅ /api at the end
   ✅ No trailing slash after /api
   ```

2. **Redeploy after adding env var**
   ```
   If you just added the variable:
   1. Go to Vercel → Deployments
   2. Click latest deployment
   3. Click "..." → "Redeploy"
   ```

3. **Check backend is running**
   ```
   Visit: https://your-backend.onrender.com/
   Should show: {"message": "Welcome to Attendance Management API"}
   
   If not, backend is down - check Render logs
   ```

---

### Issue #10: Webcam Not Working in Production

**Symptoms:**
- Webcam works locally
- In production shows: "Permission denied" or "Camera not found"

**Explanation:**
- Browsers require HTTPS for webcam access
- Both Render and Vercel provide HTTPS automatically
- So this shouldn't happen in production

**If it still happens:**

1. **Check browser permissions**
   ```
   Chrome: Click lock icon in address bar → Permissions → Camera
   Make sure camera is "Allowed"
   ```

2. **Try different browser**
   ```
   Test in:
   - Chrome (recommended)
   - Edge
   - Firefox
   Avoid: Safari (sometimes has issues)
   ```

3. **Check HTTPS**
   ```
   URL should show: https://your-app.vercel.app
   NOT: http://your-app.vercel.app
   ```

4. **Check webcam code**
   ```javascript
   // In WebcamWithFaceDetection.js, should have:
   <Webcam
     audio={false}
     ref={webcamRef}
     screenshotFormat="image/jpeg"
     videoConstraints={{ facingMode: "user" }}
   />
   ```

---

## 🔐 Security & Authentication Issues

### Issue #11: JWT Token Invalid

**Symptoms:**
- Can log in
- Immediately redirected back to login
- Or shows: "Token is not valid"

**Fixes:**

1. **JWT_SECRET mismatch**
   ```
   Backend JWT_SECRET must be consistent
   If you changed it, all old tokens are invalid
   Fix: Log out, clear localStorage, log in again
   ```

2. **Clear browser storage**
   ```javascript
   // In browser console:
   localStorage.clear();
   // Then refresh page
   ```

3. **Check token in request headers**
   ```
   F12 → Network tab → Click any API request
   Headers → Request Headers
   Should see: Authorization: Bearer <token>
   ```

4. **Verify token expiration**
   ```
   Default is 7 days (JWT_EXPIRE=7d)
   After 7 days, must log in again
   This is normal behavior
   ```

---

### Issue #12: Can't Create Superadmin

**Symptoms:**
- Running `node create-superadmin.js` fails
- Error: "MongoError" or connection timeout

**Fixes:**

1. **Using Render Shell**
   ```bash
   # In Render Shell:
   cd /opt/render/project/src  # or wherever server.js is
   node create-superadmin.js
   ```

2. **Connection string issue**
   ```
   Make sure MONGO_URI is set in Render environment variables
   The script uses this to connect
   ```

3. **Run locally pointing to production DB**
   ```bash
   # Temporarily update local .env:
   MONGO_URI=<your-production-mongo-uri>
   
   # Run script:
   node create-superadmin.js
   
   # IMPORTANT: Revert .env back to development settings!
   ```

---

## 🔄 Deployment & Update Issues

### Issue #13: Auto-Deploy Not Working

**Symptoms:**
- You push to GitHub
- Render/Vercel doesn't redeploy automatically

**Fixes:**

1. **For Render:**
   ```
   1. Go to Render Dashboard → Your service
   2. Settings → Build & Deploy
   3. Check "Auto-Deploy" is ON
   4. Verify branch is correct (usually 'main')
   ```

2. **For Vercel:**
   ```
   1. Vercel Dashboard → Your project → Settings
   2. Git → Production Branch
   3. Should be: main (or your default branch)
   4. Make sure repository is connected
   ```

3. **Check GitHub webhooks**
   ```
   GitHub → Your repo → Settings → Webhooks
   Should see webhooks for Render and Vercel
   Recent Deliveries should show successful pings
   ```

---

### Issue #14: Changes Not Showing After Deploy

**Symptoms:**
- Deployed new code
- Old version still showing

**Fixes:**

1. **Hard refresh browser**
   ```
   Chrome: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   This bypasses cache
   ```

2. **Check deployment actually completed**
   ```
   Render: Should show "Live" status
   Vercel: Should show green checkmark on latest deployment
   ```

3. **Verify correct branch**
   ```
   Make sure you pushed to the right branch
   Check Render/Vercel is deploying from that branch
   ```

4. **Clear Vercel cache**
   ```
   Vercel Dashboard → Your project → Latest deployment
   Click "..." → "Redeploy" → Check "Use existing build cache": OFF
   ```

---

## 📊 Performance Issues

### Issue #15: Slow Backend Response

**Symptoms:**
- API requests take 3+ seconds
- Face recognition is very slow

**Fixes:**

1. **Cold start (Free tier)**
   ```
   Expected: First request slow, then fast
   Solution: Upgrade to paid tier or use ping service
   ```

2. **MongoDB slow queries**
   ```
   Check MongoDB Atlas metrics
   May need to create indexes
   ```

3. **Large face descriptor calculations**
   ```
   This is normal - face processing takes 2-3 seconds
   Can't really optimize without changing library
   ```

4. **Upgrade Render instance**
   ```
   Free: 512 MB RAM
   Starter ($7/mo): 512 MB RAM but faster CPU
   Standard ($25/mo): 2 GB RAM, much faster
   ```

---

### Issue #16: MongoDB Out of Storage

**Symptoms:**
- Can't create new users
- MongoDB error: "Quota exceeded"

**Fixes:**

1. **Check current usage**
   ```
   MongoDB Atlas → Cluster → Metrics
   Free tier: 512 MB limit
   ```

2. **Clean up old data**
   ```javascript
   // Connect to database and remove test users
   // Or old attendance logs
   ```

3. **Upgrade MongoDB plan**
   ```
   M2: $9/month → 2 GB storage
   M5: $25/month → 5 GB storage
   ```

---

## 🆘 Emergency Procedures

### Complete Reset (Nuclear Option)

If nothing works and you want to start fresh:

**1. Backend (Render):**
```
1. Delete the web service
2. Recreate it with same settings
3. Re-add environment variables
4. Redeploy from GitHub
```

**2. Frontend (Vercel):**
```
1. Go to Project Settings
2. Scroll to "Delete Project"
3. Recreate by importing repository again
4. Re-add environment variables
```

**3. Database (MongoDB):**
```
DON'T delete unless absolutely necessary!
Instead:
1. Create new database user
2. Update password
3. Update MONGO_URI in Render
```

---

## 📞 Getting Help

### Check Logs First

1. **Render Logs:**
   ```
   Dashboard → Your service → Logs tab
   Shows real-time backend logs
   ```

2. **Vercel Logs:**
   ```
   Dashboard → Your project → Deployments → Click deployment
   View build logs and function logs
   ```

3. **Browser Console:**
   ```
   Press F12 → Console tab
   See frontend JavaScript errors
   ```

4. **Network Tab:**
   ```
   F12 → Network tab
   See all API requests/responses
   Check status codes (200 = good, 400/500 = error)
   ```

### Platform Support

- **Render:** support@render.com or live chat
- **Vercel:** vercel.com/support or Discord
- **MongoDB:** support.mongodb.com

### Search Common Errors

Before contacting support, Google the error:
```
"[error message]" site:stackoverflow.com
"[error message]" site:github.com
"[error message]" render.com OR vercel.com
```

---

## ✅ Verification Commands

Use these to verify everything is working:

### Test Backend:
```bash
# Should return welcome message
curl https://your-backend.onrender.com/

# Should return 401 (not authenticated)
curl https://your-backend.onrender.com/api/users

# Test login
curl -X POST https://your-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@attendance.com","password":"Admin@123456"}'
```

### Test Frontend:
```
1. Visit: https://your-app.vercel.app
2. Press F12 → Network tab
3. Try to log in
4. Check if request goes to: https://your-backend.onrender.com/api/auth/login
5. Check response status (should be 200)
```

### Test Database:
```javascript
// In Render Shell or locally:
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ Error:', err));
```

---

**Still having issues?** 

1. Read the full error message carefully
2. Check the relevant section above
3. Google the specific error
4. Check platform status pages (render.com/status, vercel.com/status)
5. Contact support with:
   - Error message
   - Platform (Render/Vercel/MongoDB)
   - Steps to reproduce
   - Logs/screenshots

**Good luck! 🚀**
