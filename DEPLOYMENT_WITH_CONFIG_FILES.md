# Deployment With Config Files

Complete config file contents for deploying the project.

---

## render.yaml (Backend — Render)

Location: `render.yaml` (project root)

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
      - key: JWT_EXPIRE
        value: 7d
      # Set these manually in the Render dashboard (do not commit secrets):
      # - MONGO_URI
      # - JWT_SECRET
      # - FRONTEND_URL
```

Render reads this file automatically when you connect your repository.

---

## vercel.json (Frontend — Vercel)

Location: `frontend/vercel.json`

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

This ensures all paths (e.g., `/admin-login`, `/dashboard`) serve the React SPA instead of returning a 404.

---

## Backend Environment File (.env)

Location: `backend/.env` (not committed to Git)

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/attendance?retryWrites=true&w=majority

# Auth
JWT_SECRET=replace-this-with-a-very-long-random-string-at-least-64-characters
JWT_EXPIRE=7d

# CORS (frontend URL)
FRONTEND_URL=http://localhost:3001
```

For production on Render, add all of these as environment variables in the Render dashboard instead.

---

## Frontend Environment File (.env)

Location: `frontend/.env` (not committed to Git)

```env
# API base URL (no trailing slash)
REACT_APP_API_URL=http://localhost:5000/api
```

For production on Vercel:
```env
REACT_APP_API_URL=https://your-api.onrender.com/api
```

> **Important:** Vercel bakes `REACT_APP_*` variables at build time. If you change the value, you must trigger a new deploy.

---

## craco.config.js (Frontend webpack override)

Location: `frontend/craco.config.js`

```js
const { getLoader, loaderByName } = require("@craco/craco");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Suppress source-map-loader warnings from face-api.js
      const { isFound, match } = getLoader(
        webpackConfig,
        loaderByName("source-map-loader")
      );
      if (isFound) {
        const exclude = match.loader.exclude || [];
        match.loader.exclude = Array.isArray(exclude)
          ? [...exclude, /node_modules\/@vladmandic/]
          : [exclude, /node_modules\/@vladmandic/];
      }
      return webpackConfig;
    },
  },
};
```

---

## package.json Scripts

### Backend

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### Frontend

```json
{
  "scripts": {
    "start": "craco start",
    "build": "craco build",
    "test": "craco test"
  }
}
```

---

## .gitignore Recommendations

```
# Secrets
backend/.env
frontend/.env

# Dependencies
node_modules/

# Uploads (user-generated content)
backend/uploads/

# Build output
frontend/build/

# ML models (large binary files)
backend/models/face-api/*.bin
backend/models/face-api/*.json
```

---

## MongoDB Atlas IP Whitelist

For production:
1. Go to **MongoDB Atlas ? Network Access**
2. Click **Add IP Address**
3. For Render free tier (dynamic IPs): add `0.0.0.0/0`
4. For paid Render (static IPs): add only Render's outbound IPs
