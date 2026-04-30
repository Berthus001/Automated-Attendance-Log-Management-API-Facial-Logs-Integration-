# Automated Attendance Log Management API (Facial Recognition Integration)

A comprehensive attendance management system with facial recognition capabilities, built with Node.js, Express, MongoDB, and React.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Deployment](#deployment) - 🚀 **Deploy to Render & Vercel**
  - [Quick Start (15 min)](./QUICK_START_DEPLOYMENT.md)
  - [Complete Guide](./DEPLOYMENT_GUIDE.md)
  - [Checklist](./DEPLOYMENT_CHECKLIST.md)
  - [Troubleshooting](./DEPLOYMENT_TROUBLESHOOTING.md)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Contributors](#contributors)

## ✨ Features

### Core Functionality
- 🔐 **User Authentication** - JWT-based secure authentication
- 👤 **Face Recognition** - Automated face detection and verification using face-api.js
- 📊 **Dashboard** - Role-based dashboards for different user types
- 👥 **User Management** - Create, read, update, delete users with role-based access control
- 🏫 **Department Management** - Organize users by academic departments
- 📸 **Face Enrollment** - Webcam integration for capturing face data during registration
- 📝 **Attendance Logging** - Automatic attendance tracking via facial recognition
- 🔍 **Search & Filter** - Advanced user search and role-based filtering

### User Roles
- **Superadmin** - Full system access, can manage all users including admins
- **Admin** - Manage teachers and students
- **Teacher** - View and manage student attendance
- **Student** - Access personal attendance records

### Security Features
- Password encryption with bcrypt
- JWT token-based authentication
- Role-based access control (RBAC)
- Protected API routes
- Face descriptor encryption for secure storage

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js v20.20.2
- **Framework:** Express.js
- **Database:** MongoDB Atlas
- **ODM:** Mongoose v8.0.0
- **Authentication:** JWT + bcrypt v6.0.0
- **Face Recognition:** @vladmandic/face-api v1.7.15, @tensorflow/tfjs v4.22.0
- **Image Processing:** canvas v3.2.3

### Frontend
- **Framework:** React 18.2.0
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Face Detection:** @vladmandic/face-api
- **Webcam:** react-webcam v7.2.0
- **Dropdown:** react-select
- **Build Tool:** Craco v7.1.0

## 📦 Prerequisites

Before running this application, ensure you have the following installed:

- **Node.js** (v20.x or higher) - [Download](https://nodejs.org/)
- **npm** (v10.x or higher) - Comes with Node.js
- **MongoDB Atlas Account** - [Sign up](https://www.mongodb.com/cloud/atlas)
- **Git** - [Download](https://git-scm.com/)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "GROUP 4 - Automated Attendance Log Management API (Facial Logs Integration)"
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## ⚙️ Configuration

### Backend Configuration

1. Create a `.env` file in the `backend` directory:

```bash
cd backend
```

2. Add the following environment variables:

```env
# MongoDB Connection String (Replace with your MongoDB Atlas connection string)
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-address>/<database-name>?retryWrites=true&w=majority

# JWT Secret (Use a strong, random string)
JWT_SECRET=your-super-secret-jwt-key-here

# Server Port
PORT=5000

# Node Environment
NODE_ENV=development
```

**Important:** Replace the MongoDB connection string with your actual MongoDB Atlas credentials.

### Frontend Configuration

#### For Development

The frontend is configured to connect to `http://localhost:5000` by default. If you change the backend port, update the API base URL in:

```
frontend/src/services/api.js
```

#### For Production (Optional)

Create environment files in the `frontend` directory for different environments:

1. Create `.env.development` (for local development):
```env
REACT_APP_API_URL=http://localhost:5000
```

2. Create `.env.production` (for production deployment):
```env
REACT_APP_API_URL=https://your-backend.onrender.com
```

3. Update `frontend/src/services/api.js` to use environment variables:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

**Note:** You'll set the production URL after deploying your backend to Render.

## 🏃 Running the Application

### Method 1: Run Backend and Frontend Separately

#### Start Backend Server

```bash
cd backend
npm start
```

Backend will run on: `http://localhost:5000`

#### Start Frontend Development Server

Open a new terminal window:

```bash
cd frontend
npm start
```

Frontend will run on: `http://localhost:3001`

### Method 2: Create Superadmin Account (First Time Setup)

Before using the system, create a superadmin account:

```bash
cd backend
node create-superadmin.js
```

**Default Superadmin Credentials:**
- Email: `superadmin@attendance.com`
- Password: `Admin@123456`
- Role: `superadmin`

⚠️ **Important:** Change the default password after first login!

## 📚 API Documentation

### Authentication Endpoints

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <jwt-token>
```

#### Face Recognition Login
```http
POST /api/auth/face-login
Content-Type: application/json

{
  "image": "base64-encoded-image-string"
}
```

### User Management Endpoints

#### Get All Users
```http
GET /api/users
Authorization: Bearer <jwt-token>
```

#### Create User
```http
POST /api/users
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student",
  "department": "Computer Science",
  "image": "base64-encoded-face-image"
}
```

#### Update User
```http
PUT /api/users/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "John Doe Updated",
  "department": "Information Technology"
}
```

#### Delete User
```http
DELETE /api/users/:id
Authorization: Bearer <jwt-token>
```

### Attendance Log Endpoints

#### Get Attendance Logs
```http
GET /api/logs
Authorization: Bearer <jwt-token>
```

#### Create Attendance Log
```http
POST /api/logs
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "userId": "user-id-here",
  "type": "check-in"
}
```

For complete API documentation, see:
- [AUTHENTICATION_FLOW.md](backend/AUTHENTICATION_FLOW.md)
- [USER_MANAGEMENT_API.md](backend/USER_MANAGEMENT_API.md)
- [LOGS_API.md](backend/LOGS_API.md)

## 👥 User Roles

### Superadmin
- Full system access
- Can create and manage admin accounts
- Can view all users including other admins
- Cannot create additional superadmin accounts (security measure)

### Admin
- Can create and manage teachers and students
- Cannot view or manage superadmin or other admin accounts
- Can access user management dashboard

### Teacher
- Can view student attendance records
- Can manage classroom attendance
- Access to teaching-related features

### Student
- Can view personal attendance history
- Can check-in/check-out via face recognition
- Limited dashboard access

## 📁 Project Structure

```
project-root/
├── backend/
│   ├── config/
│   │   └── db.js                 # Database connection
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── userController.js     # User CRUD operations
│   │   └── logsController.js     # Attendance logs
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── errorHandler.js      # Error handling
│   │   └── logger.js            # Request logging
│   ├── models/
│   │   ├── User.model.js        # User schema
│   │   ├── AttendanceLog.model.js
│   │   ├── Student.model.js
│   │   └── face-api/            # Face recognition models
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   └── logsRoutes.js
│   ├── utils/
│   │   ├── faceDetection.js     # Face recognition utilities
│   │   └── imageHelpers.js
│   ├── uploads/                 # File uploads directory
│   ├── .env                     # Environment variables
│   ├── server.js               # Application entry point
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── WebcamWithFaceDetection.js
│   │   │   └── WebcamCapture.js
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── DashboardPage.js
│   │   │   ├── SuperAdminDashboard.js
│   │   │   └── EnrollPage.js
│   │   ├── services/
│   │   │   └── api.js           # API service layer
│   │   ├── utils/
│   │   │   └── faceRecognitionService.js
│   │   ├── App.js
│   │   └── index.js
│   ├── craco.config.js
│   └── package.json
│
└── README.md
```

## 🐛 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed

**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution:**
- Verify your MongoDB Atlas connection string in `.env`
- Check your IP whitelist in MongoDB Atlas
- Ensure your database user has proper permissions

#### 2. Face Recognition Models Not Loading

**Error:** `Failed to load face recognition models`

**Solution:**
- Ensure `backend/models/face-api/` contains all model files
- Check that files have proper permissions
- Verify @vladmandic/face-api is installed correctly

#### 3. CORS Errors

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
- Backend CORS is configured for `http://localhost:3001`
- If using a different port, update CORS settings in `server.js`

#### 4. JWT Token Expired

**Error:** `Token is not valid`

**Solution:**
- Log out and log back in
- Clear browser localStorage
- Verify JWT_SECRET in backend `.env`

#### 5. Webcam Not Working

**Error:** `Permission denied` or `Camera not found`

**Solution:**
- Grant camera permissions in browser
- Use HTTPS in production (required for webcam access)
- Check if another application is using the camera

### Installation Issues

#### Canvas Module Installation Fails (Windows)

If you encounter errors installing the `canvas` module:

1. Install Visual Studio Build Tools (optional, if needed):
   ```bash
   npm install --global windows-build-tools
   ```

2. The project uses @vladmandic/face-api which includes WebAssembly backend, so native compilation is not required.

### Performance Tips

- Use a modern browser (Chrome, Edge, Firefox latest versions)
- Ensure good lighting for face recognition
- Keep face centered in webcam frame
- Backend face processing may take 2-3 seconds on first load

## 🔒 Security Best Practices

1. **Change Default Credentials** - Immediately change superadmin password after setup
2. **Use Strong Passwords** - Enforce minimum 8 characters with mixed case, numbers, and symbols
3. **Secure JWT Secret** - Use a long, random string for JWT_SECRET
4. **HTTPS in Production** - Always use HTTPS for production deployment
5. **Environment Variables** - Never commit `.env` files to version control
6. **Regular Updates** - Keep dependencies updated for security patches

## ✅ Pre-Deployment Checklist

Before deploying to production, ensure you have completed the following:

### Prerequisites
- [ ] GitHub repository created and code pushed
- [ ] MongoDB Atlas cluster created and configured
- [ ] MongoDB user created with appropriate permissions
- [ ] MongoDB Atlas Network Access configured (allow `0.0.0.0/0` for Render)
- [ ] Face-api models are in `backend/models/face-api/` directory
- [ ] All sensitive data removed from code (no hardcoded credentials)

### Backend Preparation
- [ ] `.env` file NOT committed to Git (check `.gitignore`)
- [ ] `backend/.gitignore` includes: `node_modules/`, `.env`, `uploads/`, `*.log`
- [ ] `backend/package.json` has all required dependencies
- [ ] Start command is `node server.js` (or confirm your entry point)
- [ ] CORS configuration ready to accept frontend domain
- [ ] MongoDB connection string ready (SRV format preferred)
- [ ] Strong JWT_SECRET generated (minimum 32 characters)
- [ ] Test backend locally: `npm start` works without errors

### Frontend Preparation
- [ ] `.env` files NOT committed to Git
- [ ] `frontend/.gitignore` includes: `node_modules/`, `.env*`, `/build`
- [ ] API service configured to use `process.env.REACT_APP_API_URL`
- [ ] `.env.production` file ready (will set after backend deployment)
- [ ] Test frontend locally: `npm start` works without errors
- [ ] Production build works: `npm run build` completes successfully

### Accounts Setup
- [ ] Render account created (for backend)
- [ ] Vercel account created (for frontend)
- [ ] GitHub repository connected to both platforms (recommended)
- [ ] Domain name purchased (optional, for custom URLs)

### Testing
- [ ] All features tested locally
- [ ] Superadmin account creation script tested
- [ ] Face recognition enrollment works
- [ ] User login/logout works
- [ ] User management (create, read, update, delete) works
- [ ] Webcam permissions granted in browser

### Security
- [ ] Strong production passwords prepared
- [ ] JWT_SECRET is different from development
- [ ] MongoDB password is strong (16+ characters)
- [ ] Default superadmin password will be changed after first login
- [ ] No API keys or secrets in frontend code

## 🚢 Deployment

> **📚 Comprehensive Deployment Resources:**
> 
> - **[Quick Start (15 min)](./QUICK_START_DEPLOYMENT.md)** - Fast track for experienced developers
> - **[Complete Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Step-by-step with screenshots
> - **[Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)** - Print and check off as you go
> - **[Troubleshooting Guide](./DEPLOYMENT_TROUBLESHOOTING.md)** - Solutions to common issues
>
> The sections below provide a summary. For detailed instructions, see the guides above.

---

### Backend Deployment (Render)

#### Step 1: Prepare Your Repository

1. Ensure your `backend` folder is in the root of your repository
2. Create a `.gitignore` file in the backend folder if not exists:
   ```gitignore
   node_modules/
   .env
   uploads/
   *.log
   ```

#### Step 2: Create Render Web Service

1. Sign up or log in to [Render](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:
   - **Name:** `attendance-api` (or your preferred name)
   - **Region:** Choose closest to your users
   - **Branch:** `main` (or your default branch)
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free (or paid for better performance)

#### Step 3: Configure Environment Variables

In the Render dashboard, add these environment variables:

```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/attendance_db?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-production
PORT=5000
NODE_ENV=production
```

**Important:** Use production-ready values, not development credentials!

#### Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will automatically build and deploy your backend
3. Once deployed, you'll get a URL like: `https://attendance-api.onrender.com`
4. **Save this URL** - you'll need it for frontend configuration

#### Step 5: Update CORS Settings

Update `backend/server.js` to allow your frontend domain:

```javascript
const cors = require('cors');

app.use(cors({
  origin: ['http://localhost:3001', 'https://your-frontend.vercel.app'],
  credentials: true
}));
```

Commit and push this change to trigger a new deployment.

---

### Frontend Deployment (Vercel)

#### Step 1: Update API Configuration

Update `frontend/src/services/api.js` to use your production backend URL:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// or directly:
const API_BASE_URL = 'https://attendance-api.onrender.com';
```

**Better approach:** Use environment variables

Create `.env.production` in the frontend folder:

```env
REACT_APP_API_URL=https://attendance-api.onrender.com
```

Update `api.js`:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

#### Step 2: Deploy to Vercel

**Option A: Using Vercel CLI**

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Navigate to frontend folder:
   ```bash
   cd frontend
   ```

3. Login to Vercel:
   ```bash
   vercel login
   ```

4. Deploy:
   ```bash
   vercel --prod
   ```

**Option B: Using Vercel Dashboard (Recommended)**

1. Sign up or log in to [Vercel](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset:** Create React App
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
   - **Install Command:** `npm install`

5. Add Environment Variables:
   ```
   REACT_APP_API_URL=https://attendance-api.onrender.com
   ```

6. Click **"Deploy"**

#### Step 3: Verify Deployment

1. Vercel will provide a URL like: `https://your-app.vercel.app`
2. Visit the URL and test:
   - Login functionality
   - Face recognition features
   - User management
   - Webcam access (requires HTTPS)

#### Step 4: Update Backend CORS

Go back to your backend code and update CORS with your Vercel URL:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3001',
    'https://your-app.vercel.app',
    'https://your-app-*.vercel.app' // Allows preview deployments
  ],
  credentials: true
}));
```

Commit and push to trigger redeployment on Render.

---

### Post-Deployment Checklist

- [ ] Backend is running on Render
- [ ] Frontend is running on Vercel
- [ ] Environment variables are set correctly
- [ ] CORS is configured for frontend domain
- [ ] MongoDB Atlas IP whitelist includes `0.0.0.0/0` (allow all) or Render's IPs
- [ ] Superadmin account created
- [ ] Test login with superadmin credentials
- [ ] Test face recognition enrollment
- [ ] Test user creation and management
- [ ] Webcam permissions granted in browser
- [ ] HTTPS is enabled (automatic on both platforms)
- [ ] Changed default superadmin password

### Production Considerations

#### MongoDB Atlas Settings
- Whitelist IP: `0.0.0.0/0` (for Render's dynamic IPs) or upgrade to paid plan for IP whitelisting
- Enable connection string SRV
- Set up database backups
- Monitor database usage

#### Render Settings
- Use at least **Starter** instance ($7/month) for better performance
- Enable **Auto-Deploy** from GitHub
- Set up **Health Checks** endpoint
- Monitor logs regularly
- Cold start issue: Free tier may sleep after 15 mins inactivity

#### Vercel Settings
- Set up custom domain (optional)
- Enable automatic deployments from GitHub
- Configure preview deployments for branches
- Set up environment variables for different environments

#### Security
- Use strong JWT_SECRET (minimum 32 characters)
- Enable rate limiting on backend
- Set up MongoDB user with minimal required permissions
- Regular security audits
- Keep dependencies updated

### Troubleshooting Deployment

#### Issue: CORS Error in Production
**Solution:** Ensure frontend URL is added to backend CORS configuration

#### Issue: Face Recognition Not Working
**Solution:** 
- Verify face-api model files are included in deployment
- Check Render build logs for missing files
- Ensure canvas module is installed correctly

#### Issue: MongoDB Connection Failed
**Solution:**
- Verify MONGO_URI in Render environment variables
- Check MongoDB Atlas IP whitelist
- Ensure network access is configured

#### Issue: Render Service Keeps Crashing
**Solution:**
- Check Render logs for error messages
- Verify all dependencies in package.json
- Ensure PORT environment variable is set
- Check memory usage (upgrade instance if needed)

#### Issue: Vercel Build Failed
**Solution:**
- Check build logs in Vercel dashboard
- Verify all dependencies are in package.json
- Ensure build command is correct
- Check for environment-specific code issues

### Custom Domain Setup (Optional)

#### For Vercel:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. SSL certificate is automatic

#### For Render:
1. Go to Service → Settings → Custom Domain
2. Add your domain
3. Update DNS CNAME record
4. SSL certificate is automatic

---

### Deployment URLs

After deployment, document your URLs:

- **Backend API:** `https://your-backend.onrender.com`
- **Frontend App:** `https://your-app.vercel.app`
- **API Docs:** `https://your-backend.onrender.com/api-docs` (if implemented)

Update these in your project documentation and share with team members.

## 📝 License

This project is developed as part of an academic course project.

## 👨‍💻 Contributors

**GROUP 4 Members:**
- [Add team member names]
- [Add team member names]
- [Add team member names]
- [Add team member names]

## 📞 Support

For issues, questions, or contributions:
- Create an issue in the repository
- Contact the development team
- Review documentation in `backend/` folder

## 🙏 Acknowledgments

- Face-API.js by Vladimir Mandic
- TensorFlow.js team
- MongoDB Atlas
- React community
- All open-source contributors

---

**Version:** 1.0.0  
**Last Updated:** April 29, 2026  
**Status:** Active Development
