import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WebcamWithFaceDetection from '../components/WebcamWithFaceDetection';
import { adminLogin, enrollFace2FA, verifyFace2FA } from '../services/api';
import './AdminLoginPage.css';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  
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

  // Modal state for "already logged in" scenario
  const [showAlreadyLoggedInModal, setShowAlreadyLoggedInModal] = useState(false);
  const [pendingLoginData, setPendingLoginData] = useState(null);

  const hasFaceEnrolled = Boolean(loggedInUser?.hasFaceEnrolled);

  // Handle "Logout Previous Session" button click
  const handleForceLogout = async () => {
    setLoading(true);
    
    try {
      setShowAlreadyLoggedInModal(false);
      
      if (pendingLoginData) {
        await retryAdminLogin({ ...pendingLoginData.credentials, forceLogin: true });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to logout previous session. Please try again.'
      });
    } finally {
      setLoading(false);
      setPendingLoginData(null);
    }
  };

  // Retry admin login after force logout
  const retryAdminLogin = async (credentials) => {
    try {
      const response = await adminLogin(credentials);

      if (response.success) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('pendingFace2FA', 'true');
        
        setLoggedInUser(response.user);
        setShowFace2FA(true);
        setResult({
          success: true,
          message: response.user.hasFaceEnrolled
            ? `Welcome back, ${response.user.name}. Complete face verification to continue.`
            : `Welcome back, ${response.user.name}. Enroll your face to enable 2FA.`,
          user: response.user
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed after logout.';
      setResult({
        success: false,
        message: errorMessage
      });
    }
  };

  // Handle "Cancel" button click in modal
  const handleCancelForceLogout = () => {
    setShowAlreadyLoggedInModal(false);
    setPendingLoginData(null);
    setLoading(false);
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
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('pendingFace2FA', 'true');
        
        setLoggedInUser(response.user);
        setShowFace2FA(true);
        setResult({
          success: true,
          message: response.user.hasFaceEnrolled
            ? `Welcome back, ${response.user.name}. Complete face verification to continue.`
            : `Welcome back, ${response.user.name}. Enroll your face to enable 2FA.`,
          user: response.user
        });
      }
    } catch (error) {
      if (error.response?.status === 409) {
        setPendingLoginData({
          type: 'admin',
          credentials: adminForm
        });
        setShowAlreadyLoggedInModal(true);
      } else {
        const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
        setResult({
          success: false,
          message: errorMessage
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFaceEnrollment = async () => {
    if (!capturedImage) {
      setResult({
        success: false,
        message: 'Please capture your face for enrollment'
      });
      return;
    }

    setLoading(true);

    try {
      const response = await enrollFace2FA({ image: capturedImage });

      if (response.success) {
        localStorage.setItem('user', JSON.stringify(response.user));
        setLoggedInUser(response.user);
        setCapturedImage(null);
        setResult({
          success: true,
          message: 'Face enrolled successfully. Verify once to complete login.',
          user: response.user
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Face enrollment failed.';
      setResult({
        success: false,
        message: errorMessage
      });
      setCapturedImage(null);
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
        localStorage.removeItem('pendingFace2FA');
        setResult({
          success: true,
          message: '✓ Face verified! Full access granted.',
          verified: true,
          user: loggedInUser
        });
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      } else {
        setResult({
          success: false,
          message: '✗ Face verification failed. Please try again.',
          verified: false
        });
        // Clear image so autoCapture can retry
        setCapturedImage(null);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Face verification failed.';
      setResult({
        success: false,
        message: errorMessage
      });
      setCapturedImage(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle image capture from webcam – auto-trigger verify/enroll
  const handleImageCapture = (image) => {
    setCapturedImage(image);
    setResult(null);
  };

  // Auto-submit as soon as autoCapture fires an image
  useEffect(() => {
    if (!capturedImage || loading || result?.verified) return;
    if (!showFace2FA || !loggedInUser) return;
    if (hasFaceEnrolled) {
      handleFace2FAVerification();
    } else {
      handleFaceEnrollment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capturedImage]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('pendingFace2FA');
    setLoggedInUser(null);
    setShowFace2FA(false);
    setResult(null);
    setCapturedImage(null);
  };

  return (
    <div className="admin-login-wrapper">
      <nav className="navbar">
        <div className="nav-container">
          <h1 className="nav-logo">🎓 Attendance System</h1>
          <p className="nav-subtitle">Administrator Portal</p>
          <button 
            className="back-btn"
            onClick={() => navigate('/')}
          >
            ← Back to Home
          </button>
        </div>
      </nav>

      <div className="container">
        <div className="admin-login-page">
          <div className="page-header">
            <h2>🛡️ Administrator Login</h2>
            <p>Secure access for administrators only</p>
          </div>

          <div className="login-content">
            {!loggedInUser ? (
              <>
                <div className="section-header">
                  <h3>Login with Credentials</h3>
                  <p>Enter your email and password</p>
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
              <>
                {showFace2FA && !result?.verified && (
                  <>
                    <div className="section-header">
                      <h3>{hasFaceEnrolled ? 'Face Verification (2FA)' : 'Face Enrollment'}</h3>
                      <p>
                        {hasFaceEnrolled
                          ? 'Verify your identity to finish signing in'
                          : 'Capture a clear face photo to enable face-based 2FA'}
                      </p>
                    </div>

                    <WebcamWithFaceDetection
                      onCapture={handleImageCapture}
                      capturedImage={capturedImage}
                      autoCapture={true}
                    />

                    <div className="login-actions">
                      {loading && (
                        <p className="auto-verify-status">
                          {hasFaceEnrolled ? '⏳ Verifying face...' : '⏳ Enrolling face...'}
                        </p>
                      )}
                      <button onClick={handleLogout} className="btn btn-secondary">
                        {hasFaceEnrolled ? 'Cancel' : 'Do This Later'}
                      </button>
                    </div>
                  </>
                )}

                {!showFace2FA && (
                  <div className="admin-success">
                    <h3>✓ Logged In Successfully</h3>
                    <p>Welcome, {loggedInUser.name}!</p>
                    <button onClick={() => setShowFace2FA(true)} className="btn btn-secondary">
                      {hasFaceEnrolled ? 'Verify Face' : 'Enroll Face 2FA'}
                    </button>
                    <button onClick={handleLogout} className="btn btn-logout">
                      Logout
                    </button>
                  </div>
                )}
              </>
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
                  </div>
                )}
              </div>
            )}
          </div>

          {/* "Already Logged In" Modal */}
          {showAlreadyLoggedInModal && (
            <div className="modal-overlay">
              <div className="modal-container">
                <div className="modal-header">
                  <h3>⚠️ Already Logged In</h3>
                </div>
                <div className="modal-body">
                  <p>This account is already logged in on another session.</p>
                  <p>Would you like to logout from the previous session and login here?</p>
                </div>
                <div className="modal-actions">
                  <button
                    onClick={handleForceLogout}
                    disabled={loading}
                    className="btn btn-logout-previous"
                  >
                    {loading ? '⏳ Logging out...' : '🔓 Logout Previous Session'}
                  </button>
                  <button
                    onClick={handleCancelForceLogout}
                    disabled={loading}
                    className="btn btn-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
