# Deployment Troubleshooting

Common problems and solutions for Render (backend) and Vercel (frontend) deployments.

---

## Backend (Render)

### Build Failures

**`npm install` fails — native module errors**

The `canvas` and `sharp` packages require native binaries. Render uses Linux (Ubuntu) and handles this automatically, but may occasionally fail.

Solution:
- Ensure `package.json` does not pin incompatible patch versions
- Add `"engines": { "node": "20.x" }` to `backend/package.json`
- Check Render build logs for the exact error line

---

**`Error: Cannot find module '...'`**

A dependency is missing from `package.json`.

Solution:
```bash
cd backend
npm install <missing-package>
```

Then commit `package.json` and `package-lock.json`.

---

### Runtime Errors

**Server starts but all requests return 500**

Check Render logs. Most common cause: `MONGO_URI` is not set or is wrong.

```
MongooseError: The `uri` parameter to `openUri()` must be a string
```

Solution: Add `MONGO_URI` env var in Render dashboard.

---

**`MongoServerError: bad auth`**

MongoDB Atlas username or password is wrong.

Solutions:
1. URL-encode special characters in the password (e.g., `@` ? `%40`)
2. Verify the Atlas database user credentials
3. Test locally: `node test-atlas-connection.js`

---

**`MongooseServerSelectionError: connect ECONNREFUSED`**

MongoDB Atlas network access is blocking Render's IP.

Solution:
1. Go to Atlas ? Network Access ? Add IP Address
2. Either add Render's outbound IPs, or temporarily allow all IPs: `0.0.0.0/0`

---

**Face recognition fails on first request after deploy**

On cold start (after Render spins up the free tier), the first face request may time out.

Solution:
- The WASM backend JIT compiles on first use — this is expected (~2–3 s)
- Upgrade to a paid Render plan to avoid cold starts
- Add a health-ping service to keep the server warm

---

**JWT errors — `invalid signature` or `jwt malformed`**

`JWT_SECRET` is different between the session that issued the token and the current running instance.

Solution:
- Ensure `JWT_SECRET` is a static value in Render env vars (not regenerated on each deploy)
- Clear browser localStorage and log in again

---

### Session Issues

**409 — "User already logged in from another session"**

An active session is within the 24-hour window.

Solutions:
- Send `"forceLogin": true` in the request body
- Wait 24 hours for the session to auto-expire
- Use the MongoDB shell or `list-all-users.js` to manually set `isLoggedIn = false`

```bash
# Quick fix via MongoDB shell
db.users.updateOne({ email: "user@example.com" }, { $set: { isLoggedIn: false } })
```

---

## Frontend (Vercel)

### Blank Page After Deploy

**Cause 1: SPA routing not configured**

Vercel doesn't know to serve `index.html` for all routes by default.

Solution: Ensure `frontend/vercel.json` contains:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

**Cause 2: Wrong `REACT_APP_API_URL`**

The frontend cannot reach the backend.

Solution:
1. Go to Vercel ? Settings ? Environment Variables
2. Set `REACT_APP_API_URL=https://your-api.onrender.com/api`
3. **Redeploy** — Vercel bakes env vars at build time, not runtime

---

**Cause 3: Build error**

Check Vercel build logs. Common issue: CRACO version incompatibility.

Solution: Ensure `frontend/craco.config.js` exists and `@craco/craco` is in `dependencies` (not `devDependencies`).

---

### CORS Errors in Browser Console

```
Access to XMLHttpRequest at 'https://your-api.onrender.com/api/...' blocked by CORS policy
```

The backend is rejecting requests from the frontend origin.

Solution:
1. Set `FRONTEND_URL=https://your-app.vercel.app` in Render env vars (no trailing slash)
2. Redeploy the backend

---

### Webcam Not Working

**Error: "Camera not available"**

Browsers only allow webcam access on HTTPS or `localhost`.

Solution:
- Production (Vercel) uses HTTPS — should work by default
- For local development, use `http://localhost:3001` (not your local IP)

---

## MongoDB Atlas

### IP Whitelist Issues

For production, either:
- Add Render's outbound static IPs (paid Render plans only)
- Use `0.0.0.0/0` (allows all IPs — less secure, but simple for development/testing)

---

### Connection String Format

Correct format:
```
mongodb+srv://username:password@cluster-name.xxxxx.mongodb.net/database-name?retryWrites=true&w=majority
```

Common mistakes:
- Special characters in password not URL-encoded
- Missing database name after the cluster hostname
- Using old `mongodb://` format instead of `mongodb+srv://`

---

## Diagnostic Scripts

Run these locally (with the production `MONGO_URI` set) to diagnose issues:

```bash
# Test Atlas connection
cd backend
MONGO_URI=<atlas-uri> node test-atlas-connection.js

# List all users
MONGO_URI=<atlas-uri> node list-all-users.js

# Diagnose connection
MONGO_URI=<atlas-uri> node diagnose-connection.js
```
