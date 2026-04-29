import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WebcamWithFaceDetection from '../components/WebcamWithFaceDetection';
import { adminLogin, faceOnlyLogin, verifyFace2FA } from '../services/api';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  
  // Tab state: 'admin' or 'face'
  const [activeTab, setActiveTab] = useState('face');
  
  // Admin login form state
  const [adminForm, setAdminForm] = useState({
    email: '',
    password: ''
  });
  
  // Face login state
  const [capturedImage, setCapturedImage] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showFace2FA, setShowFace2FA] = useState(false);

  // Handle tab switch
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Clear states when switching tabs
    setResult(null);
    setCapturedImage(null);
    setAdminForm({ email: '', password: '' });
    setShowFace2FA(false);
  };

  // Handle admin form input
  const handleAdminInputChange = (e) => {
    const { name, value } = e.target;
    setAdminForm(prev => ({ ...prev, [name]: value }));
    setResult(null);
  };

  // Handle admin email + password login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!adminForm.email.trim() || !adminForm.password.trim()) {
      setResult({
        success: false,
        message: 'Please provide both email and password'
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await adminLogin(adminForm);

      if (response.success) {
        // Store token
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        setLoggedInUser(response.user);
        setResult({
          success: true,
          message: `Welcome back, ${response.user.name}! Redirecting to dashboard...`,
          user: response.user
        });

        // Redirect to dashboard after 1 second
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      setResult({
        success: false,
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle face 2FA verification for admin
  const handleFace2FAVerification = async () => {
    if (!capturedImage) {
      setResult({
        success: false,
        message: 'Please capture your face for verification'
      });
      return;
    }

    setLoading(true);

    try {
      const response = await verifyFace2FA({ image: capturedImage });

      if (response.success && response.verified) {
        setResult({
          success: true,
          message: '✓ Face verified! Full access granted.',
          verified: true
        });
      } else {
        setResult({
          success: false,
          message: '✗ Face verification failed. Please try again.',
          verified: false
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Face verification failed.';
      setResult({
        success: false,
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle face-only login (teachers/students)
  const handleFaceLogin = async () => {
    if (!capturedImage) {
      setResult({
        success: false,
        message: 'Please capture your face first'
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await faceOnlyLogin({ image: capturedImage });

      if (response.success) {
        // Store token
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        setResult({
          success: true,
          message: `Welcome, ${response.user.name}! 🎉`,
          user: response.user,
          confidence: response.confidence
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Face not recognized. Please try again.';
      setResult({
        success: false,
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle image capture from webcam
  const handleImageCapture = (image) => {
    setCapturedImage(image);
    setResult(null);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setLoggedInUser(null);
    setShowFace2FA(false);
    setResult(null);
    setCapturedImage(null);
  };

  // Handle reset
  const handleReset = () => {
    setCapturedImage(null);
    setResult(null);
  };

  return (
    <div className="login-page-wrapper">
      <nav className="navbar">
        <div className="nav-container">
          <h1 className="nav-logo">🎓 Attendance System</h1>
          <p className="nav-subtitle">Secure Authentication Portal</p>
        </div>
      </nav>

      <div className="container">
        <div className="login-page">
        <div className="page-header">
          <h2>🔐 Secure Login Portal</h2>
          <p>Choose your authentication method</p>
        </div>

        {/* Login Tabs */}
        <div className="login-tabs">
          <button
            className={`tab-btn ${activeTab === 'face' ? 'active' : ''}`}
            onClick={() => handleTabChange('face')}
          >
            👤 Student / Teacher
          </button>
          <button
            className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => handleTabChange('admin')}
          >
            🛡️ Admin / Superadmin
          </button>
        </div>

        {/* Tab Content */}
        <div className="login-content">
          {/* Face-Only Login (Teachers/Students) */}
          {activeTab === 'face' && (
            <div className="face-login-section">
              <div className="section-header">
                <h3>Face Recognition Login</h3>
                <p>Look at the camera to login instantly</p>
              </div>

              <WebcamWithFaceDetection
                onCapture={handleImageCapture}
                capturedImage={capturedImage}
              />

              <div className="login-actions">
                {capturedImage && !result && (
                  <button
                    onClick={handleFaceLogin}
                    disabled={loading}
                    className="btn btn-login"
                  >
                    {loading ? '⏳ Recognizing...' : '🔓 Login with Face'}
                  </button>
                )}
                
                {result && (
                  <button onClick={handleReset} className="btn btn-reset">
                    ↻ Try Again
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Admin Login (Email + Password + Face 2FA) */}
          {activeTab === 'admin' && (
            <div className="admin-login-section">
              {!loggedInUser ? (
                // Step 1: Email + Password
                <>
                  <div className="section-header">
                    <h3>Administrator Login</h3>
                    <p>Login with your credentials</p>
                  </div>

                  <form onSubmit={handleAdminLogin} className="admin-form">
                    <div className="form-group">
                      <label htmlFor="email">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={adminForm.email}
                        onChange={handleAdminInputChange}
                        placeholder="admin@example.com"
                        className="form-input"
                        disabled={loading}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="password">Password</label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={adminForm.password}
                        onChange={handleAdminInputChange}
                        placeholder="••••••••"
                        className="form-input"
                        disabled={loading}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-login"
                    >
                      {loading ? '⏳ Logging in...' : '🔐 Login'}
                    </button>
                  </form>
                </>
              ) : (
                // Step 2: Face 2FA (Optional)
                <>
                  {showFace2FA && !result?.verified && (
                    <>
                      <div className="section-header">
                        <h3>Face Verification (2FA)</h3>
                        <p>Verify your identity for enhanced security</p>
                      </div>

                      <WebcamWithFaceDetection
                        onCapture={handleImageCapture}
                        capturedImage={capturedImage}
                      />

                      <div className="login-actions">
                        {capturedImage && (
                          <button
                            onClick={handleFace2FAVerification}
                            disabled={loading}
                            className="btn btn-login"
                          >
                            {loading ? '⏳ Verifying...' : '✓ Verify Face'}
                          </button>
                        )}
                        
                        <button onClick={handleLogout} className="btn btn-secondary">
                          Skip for Now
                        </button>
                      </div>
                    </>
                  )}

                  {!showFace2FA && (
                    <div className="admin-success">
                      <h3>✓ Logged In Successfully</h3>
                      <p>Welcome, {loggedInUser.name}!</p>
                      <button onClick={() => setShowFace2FA(true)} className="btn btn-secondary">
                        Enable Face 2FA
                      </button>
                      <button onClick={handleLogout} className="btn btn-logout">
                        Logout
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className={`result-card result-${result.success ? 'success' : 'error'}`}>
              <div className="result-icon">
                {result.success ? '✓' : '✗'}
              </div>
              <h3 className="result-title">
                {result.success ? 'Success!' : 'Failed'}
              </h3>
              <p className="result-message">{result.message}</p>
              
              {result.success && result.user && (
                <div className="user-info">
                  <div className="info-row">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{result.user.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Role:</span>
                    <span className="info-value role-badge">{result.user.role}</span>
                  </div>
                  {result.confidence && (
                    <div className="info-row">
                      <span className="info-label">Confidence:</span>
                      <span className="info-value">
                        {(1 - result.confidence.distance).toFixed(2) * 100}%
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default LoginPage;
