# 🔧 Deployment Using Configuration Files

This guide shows how to deploy using **Infrastructure as Code** configuration files instead of manual dashboard setup.

---

## 📋 Configuration Files Included

### 1. `render.yaml` - Render Backend Configuration
**Location:** Project root `/render.yaml`  
Defines backend service configuration for Render.

### 2. `vercel.json` - Vercel Frontend Configuration
**Location:** Frontend folder `/frontend/vercel.json`  
Defines frontend build and routing for Vercel.

**File Locations:**
```
project-root/
├── render.yaml              ← Backend config (root)
├── frontend/
│   ├── vercel.json         ← Frontend config (in frontend folder)
│   └── package.json
└── backend/
    └── server.js
```

---

## ✅ Benefits of Configuration Files

| Benefit | Description |
|---------|-------------|
| **Reproducible** | Same setup every time, no manual clicks |
| **Version Controlled** | Track changes in Git |
| **Team Friendly** | Everyone deploys with same settings |
| **Documentation** | Config file IS the documentation |
| **Multi-Service** | Can define databases, cron jobs, etc. |
| **Easier Updates** | Change file, push, auto-redeploy |

---

## 🚀 Method 1: Deploy Backend with render.yaml

### Step 1: Update render.yaml

Open `render.yaml` and customize:

```yaml
services:
  - type: web
    name: attendance-api  # Change if you want different name
    region: singapore     # Change to your region
    plan: free           # Or: starter, standard, pro
    branch: main         # Your Git branch
```

### Step 2: Add Sensitive Environment Variables

**Do NOT add secrets to render.yaml if repo is public!**

Instead, prepare these values:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/attendance_db?retryWrites=true&w=majority
JWT_SECRET=[generate 32+ random characters]
FRONTEND_URL=http://localhost:3001  (update after frontend deployed)
```

### Step 3: Deploy Using Render Blueprint

**Option A: First Time Deployment**

1. Push `render.yaml` to GitHub:
   ```bash
   git add render.yaml
   git commit -m "Add Render configuration"
   git push
   ```

2. Go to [Render Dashboard](https://dashboard.render.com)

3. Click **"New +"** → **"Blueprint"**

4. Connect your GitHub repository

5. Render detects `render.yaml` automatically

6. Click **"Apply"**

7. **Add environment secrets:**
   - Go to created service → **Environment**
   - Add: `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`
   - Mark them as "secret"

8. Service deploys automatically!

**Option B: Update Existing Service**

1. Update `render.yaml`
2. Push to GitHub
3. Render auto-detects changes and redeploys

### Step 4: Get Backend URL

- Copy URL: `https://attendance-api.onrender.com`
- Save for frontend configuration

---

## 🌐 Method 2: Deploy Frontend with vercel.json

### Option A: Dashboard Deployment (Recommended)

The `vercel.json` file is **optional** for simple deployments. Vercel auto-detects Create React App.

**Simplest approach:**

1. Deploy via Vercel Dashboard (as described in DEPLOYMENT_GUIDE.md)
2. Vercel auto-detects React and configures correctly
3. Only add environment variable: `REACT_APP_API_URL`

The `vercel.json` I created is for **advanced configuration** if needed later.

### Option B: Using vercel.json with Secrets

If you want to use `vercel.json`:

1. **Set up Vercel secret:**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Login
   vercel login
   
   # Add secret (do this ONCE)
   vercel secrets add react_app_api_url "https://attendance-api.onrender.com/api"
   ```

2. **Deploy:**
   ```bash
   cd frontend
   vercel --prod
   ```

3. The `vercel.json` references the secret via `@react_app_api_url`

### Option C: Simplified vercel.json (No Secrets)

The `vercel.json` in the `frontend/` folder is already simplified and ready to use:

```json
{
  "version": 2,
  "name": "attendance-management-system",
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "create-react-app"
}
```

Then add `REACT_APP_API_URL` via Vercel Dashboard environment variables.

**Note:** Since `vercel.json` is inside the `frontend/` folder, paths are relative to that folder.

---

## 🎯 Recommended Approach: Hybrid

**Best practice for your project:**

### Backend: Use render.yaml
✅ Clear configuration
✅ Easy to update
✅ Team can reproduce deployment

**Steps:**
1. Use `render.yaml` to deploy via Blueprint
2. Add secrets via Dashboard (not in YAML)

### Frontend: Dashboard + Optional vercel.json
✅ Simplest and fastest
✅ Vercel auto-detects React
✅ Add `vercel.json` only if you need custom routing/headers later

**Steps:**
1. Deploy via Vercel Dashboard
2. Add `REACT_APP_API_URL` in environment variables
3. Keep `vercel.json` for future customization

---

## 📝 Complete Deployment with Config Files
(in project root) committed to repo
- [ ] `vercel.json` (in frontend folder)
- [ ] `render.yaml` committed to repo
- [ ] `vercel.json` committed to repo (optional)
- [ ] MongoDB connection string ready
- [ ] Strong JWT_SECRET generated

### Backend Deployment

```bash
# 1. Commit config file
git add render.yaml
git commit -m "Add Render configuration"
git push

# 2. Deploy via Render Dashboard → Blueprint
# 3. Add environment secrets in Dashboard
# 4. Copy backend URL
```

### Frontend Deployment

```bash
# 1. Update .env.production with backend URL
# Edit: frontend/.env.production
REACT_APP_API_URL=https://attendance-api.onrender.com/api

# 2. Deploy via Vercel Dashboard
# Or using CLI:
cd frontend
vercel --prod

# 3. Add REACT_APP_API_URL in Vercel environment variables
# 4. Copy frontend URL
```

### Update CORS

```bash
# Go to Render Dashboard
# Your service → Environment
# Update FRONTEND_URL to Vercel URL
# Save and wait for redeploy
```

---

## 🔄 Updating After Initial Deployment

### Update Backend Settings

1. Edit `render.yaml`
2. Commit and push
3. Render auto-redeploys with new settings

### Update Frontend Settings

1. Edit `vercel.json` (if using)
2. Commit and push
3. Vercel auto-redeploys

### Update Environment Variables

**Backend (Render):**
- Dashboard → Service → Environment
- Update variables
- Save (auto-redeploys)

**Frontend (Vercel):**
- Dashboard → Project → Settings → Environment Variables
- Update variables
- Redeploy (if needed)

---

## 🆚 Config File vs Dashboard: Which to Use?

### Use Configuration Files When:
- ✅ Working with a team
- ✅ Want reproducible deployments
- ✅ Need to document infrastructure
- ✅ Planning multiple services
- ✅ Want automated deployments

### Use Dashboard When:
- ✅ First time deploying
- ✅ Solo project
- ✅ Quick prototype/test
- ✅ Need to change settings frequently
- ✅ Not familiar with YAML/JSON config

### Best of Both Worlds:
1. **First deployment:** Use dashboard (easier, visual)
2. **Export config:** Document what you created
3. **Future deployments:** Use config files
4. **Secrets:** Always via dashboard (never commit!)

---

## 🔐 Security Best Practices

### ❌ DO NOT:
```yaml
# render.yaml - NEVER do this in public repo!
envVars:
  - key: MONGO_URI
    value: mongodb+srv://user:password@cluster...  # ❌ EXPOSED!
  - key: JWT_SECRET
    value: my-super-secret-key-12345  # ❌ EXPOSED!
```

### ✅ DO:
```yaml
# render.yaml - Reference only
envVars:
  - key: NODE_ENV
    value: production  # ✅ OK - not sensitive
  
  # Add these via Dashboard as "secrets":
  # - MONGO_URI
  # - JWT_SECRET
  # - FRONTEND_URL (contains your domain, could be sensitive)
```

### For Private Repos:
If your repo is private, you CAN add secrets to config files, but:
- Use Render's `sync: false` option
- Better yet, still use Dashboard for secrets

---

## 📚 Additional Resources

### Render Configuration
- [Blueprint Spec](https://render.com/docs/blueprint-spec)
- [Environment Variables](https://render.com/docs/environment-variables)
- [YAML Syntax](https://docs.ansible.com/ansible/latest/reference_appendices/YAMLSyntax.html)

### Vercel Configuration
- [vercel.json Reference](https://vercel.com/docs/projects/project-configuration)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Build Configuration](https://vercel.com/docs/concepts/projects/build-configuration)

---

## 🎯 Quick Decision Guide

```
Do you need config files?
│
├─ YES if:
│  ├─ Working with team
│  ├─ Want reproducible deployments
│  ├─ Multiple services to deploy
│  └─ Following DevOps best practices
│
└─ NO if:
   ├─ First time deploying
   ├─ Solo developer
   ├─ Quick prototype
   └─ Prefer GUI over config files
```

**For your project (GROUP 4):**
- **Recommended:** Use `render.yaml` for backend (team project, good practice)
- **Optional:** Skip `vercel.json` for frontend (Vercel auto-detects React perfectly)
- **Always:** Use dashboard for secrets

---

## ✅ Summary

| File | Location | Required? | Purpose |
|------|----------|-----------|---------|
| `render.yaml` | **Project root** `/` | Optional | Backend config for Render |
| `vercel.json` | **Frontend folder** `/frontend/` | Optional | Frontend config for Vercel |
| `.env.production` | **Frontend folder** `/frontend/` | Recommended | Frontend env vars |

### Why These Locations?

**`render.yaml` in root:**
- ✅ Render looks for it in the repository root
- ✅ Can reference backend folder via `rootDir: backend`
- ✅ Standard location for multi-folder projects

**`vercel.json` in frontend folder:**
- ✅ Cleaner - config lives with the code it configures
- ✅ When importing, select "frontend" as root directory
- ✅ Vercel applies config relative to the folder
- ✅ No need for complex path references

**Alternative:** You can also keep `vercel.json` in root, but you'd need to:
- Update paths to reference `frontend/` subfolder
- Add more complex build configurations
- Less intuitive for team members

**Bottom Line:**
- Configuration files are **nice to have** but **not required**
- Dashboard deployment (from DEPLOYMENT_GUIDE.md) works perfectly fine
- Use config files for better team collaboration and documentation
- **Never commit secrets** to config files in public repos!

---

Choose the method that fits your team's workflow:
1. **Beginner-friendly:** Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - dashboard only
2. **Team/Production:** Use config files (this guide) + dashboard for secrets
3. **Advanced:** Full IaC with Terraform/Pulumi (beyond this guide)

**All methods work equally well! 🚀**
