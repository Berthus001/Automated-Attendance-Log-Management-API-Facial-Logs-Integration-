# Attendance Management System - React Frontend

Modern React frontend application for the Attendance Management System with facial recognition capabilities.

## 🚀 Features

- ✅ **Functional Components** - Built with React Hooks
- ✅ **Face Login** - Attendance logging via facial recognition
- ✅ **Student Enrollment** - Register students with face photos
- ✅ **Webcam Integration** - Real-time camera capture
- ✅ **Responsive Design** - Works on desktop and mobile
- ✅ **Modern UI** - Clean and intuitive interface

## 📁 Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── WebcamCapture.js      # Webcam component
│   │   └── WebcamCapture.css
│   ├── pages/
│   │   ├── EnrollPage.js         # Student enrollment page
│   │   ├── EnrollPage.css
│   │   ├── LoginPage.js          # Face login page
│   │   └── LoginPage.css
│   ├── services/
│   │   └── api.js                # API service functions
│   ├── App.js                    # Main app component
│   ├── App.css
│   ├── index.js                  # Entry point
│   └── index.css
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🛠️ Technologies

- **React 18.2** - UI library
- **React Router 6** - Navigation
- **React Webcam** - Camera integration
- **Axios** - HTTP client
- **CSS3** - Styling

## 📦 Installation

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your backend API URL:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🏃 Running the App

### Development Mode
```bash
npm start
```
Opens at `http://localhost:3000`

### Production Build
```bash
npm run build
```
Creates optimized build in `/build` folder

## 📱 Pages

### 1. Login Page (/)
- Face recognition login
- Webcam capture
- Real-time verification
- Attendance logging
- Success/error feedback

**Features:**
- Capture photo with webcam
- Automatic face detection
- Confidence score display
- Student information display

### 2. Enroll Page (/enroll)
- Student registration form
- Face photo capture
- Validation
- Success/error messages

**Form Fields:**
- Student ID (required)
- Full Name (required)
- Course (required)
- Email (optional)
- Phone (optional)
- Face Photo (required)

## 🎯 Components

### WebcamCapture
Reusable webcam component with capture functionality.

**Props:**
- `onCapture(image)` - Callback when photo is captured
- `capturedImage` - Current captured image

**Features:**
- Real-time camera preview
- Capture button
- Retake functionality
- Loading state
- Error handling

**Usage:**
```jsx
import WebcamCapture from './components/WebcamCapture';

function MyComponent() {
  const [image, setImage] = useState(null);
  
  return (
    <WebcamCapture
      onCapture={setImage}
      capturedImage={image}
    />
  );
}
```

## 🔌 API Integration

All API calls are centralized in `services/api.js`:

```javascript
import { enrollStudent, faceLogin, getAttendanceLogs } from './services/api';

// Enroll student
const response = await enrollStudent({
  studentId: 'STU001',
  name: 'John Doe',
  course: 'Computer Science',
  image: base64Image
});

// Face login
const response = await faceLogin({
  image: base64Image,
  deviceId: 'WEB_APP_001'
});

// Get logs
const response = await getAttendanceLogs({
  studentId: 'STU001',
  startDate: '2026-04-01',
  endDate: '2026-04-30'
});
```

## 🎨 Styling

### CSS Organization
- Global styles in `index.css`
- Component-specific styles in separate CSS files
- Responsive design with media queries
- Modern gradients and animations

### Color Scheme
- Primary: `#3498db` (Blue)
- Secondary: `#2c3e50` (Dark Blue)
- Success: `#27ae60` (Green)
- Error: `#e74c3c` (Red)
- Background: `#f5f5f5` (Light Gray)

### Responsive Breakpoints
- Desktop: `> 1024px`
- Tablet: `768px - 1024px`
- Mobile: `< 768px`

## 🔧 Configuration

### Environment Variables

Create `.env` file:
```env
# Backend API URL
REACT_APP_API_URL=http://localhost:5000/api
```

### CORS Setup

Ensure backend allows frontend origin:
```javascript
// backend/server.js
app.use(cors({
  origin: 'http://localhost:3000'
}));
```

## 📝 Usage Examples

### Enrolling a Student

1. Navigate to `/enroll`
2. Fill in student information
3. Click "Capture Photo"
4. Position face in camera
5. Click "Capture Photo" button
6. Review captured image
7. Click "Enroll Student"
8. Wait for success message

### Logging Attendance

1. Navigate to `/` (home)
2. Click "Capture Photo"
3. Position face in camera
4. Click "Capture Photo" button
5. Review captured image
6. Click "Login & Log Attendance"
7. Wait for face recognition
8. View success message with details

## 🐛 Troubleshooting

### Camera Not Working

**Issue:** Camera doesn't load
**Solutions:**
- Grant camera permissions in browser
- Check if camera is being used by another app
- Try different browser (Chrome recommended)
- Ensure HTTPS in production

### API Connection Error

**Issue:** Cannot connect to backend
**Solutions:**
- Check backend is running (`npm run dev`)
- Verify `REACT_APP_API_URL` in `.env`
- Check CORS configuration
- Inspect network tab in browser DevTools

### Build Errors

**Issue:** `npm install` or `npm start` fails
**Solutions:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Try using --legacy-peer-deps
npm install --legacy-peer-deps
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Static Hosting

**Netlify:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=build
```

**Vercel:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**GitHub Pages:**
```json
// package.json
{
  "homepage": "https://username.github.io/repo-name",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

## 🔐 Security Considerations

### Camera Permissions
- Always request user consent
- Show clear indication when camera is active
- Handle permission denials gracefully

### Data Handling
- Images are base64 encoded
- Transmitted over HTTPS in production
- No client-side storage of sensitive data

### API Security
- Use environment variables for URLs
- Implement authentication (future)
- Validate all inputs

## 📱 Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Edge | 90+ | ✅ Full |
| Mobile Safari | 14+ | ✅ Full |
| Chrome Mobile | 90+ | ✅ Full |

## 🎓 React Hooks Used

- `useState` - State management
- `useRef` - Webcam reference
- `useCallback` - Memoized callbacks
- `useEffect` - Side effects (future)

## 📚 Learn More

- [React Documentation](https://react.dev)
- [React Router](https://reactrouter.com)
- [React Webcam](https://www.npmjs.com/package/react-webcam)
- [Axios Documentation](https://axios-http.com)

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📄 License

ISC

## 🎉 Next Features

- [ ] Attendance history view
- [ ] Student dashboard
- [ ] Real-time notifications
- [ ] Admin panel
- [ ] Reports and analytics
- [ ] Export data
- [ ] Dark mode
- [ ] Multi-language support
