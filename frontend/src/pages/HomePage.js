import React from 'react';
import { useNavigate } from 'react-router-dom';
import KioskScanner from '../components/KioskScanner';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="homepage-wrapper">
      {/* Header */}
      <nav className="homepage-navbar">
        <div className="nav-container">
          <h1 className="nav-logo">🎓 Attendance System</h1>
          <p className="nav-subtitle">Face Recognition Kiosk</p>
          <button
            className="admin-link-btn"
            onClick={() => navigate('/admin-login')}
          >
            👤 Admin Login
          </button>
        </div>
      </nav>

      <div className="homepage-container">
        <div className="kiosk-section">
          <div className="kiosk-header">
            <h2>📸 Face Attendance</h2>
            <p>Look at the camera – attendance is logged automatically</p>
          </div>

          <div className="webcam-container">
            <KioskScanner />
          </div>

          <div className="kiosk-instructions">
            <p>✓ Look directly at the camera</p>
            <p>✓ Ensure good lighting</p>
            <p>✓ Remove glasses if needed</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="homepage-footer">
        <p>© 2026 Attendance System | Powered by Face Recognition</p>
      </footer>
    </div>
  );
};

export default HomePage;

