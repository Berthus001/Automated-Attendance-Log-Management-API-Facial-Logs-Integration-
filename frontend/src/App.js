import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminLoginPage from './pages/AdminLoginPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import { logout } from './services/api';
import './App.css';

const ADMIN_IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const ADMIN_WARNING_BEFORE_MS = 60 * 1000;
const ADMIN_LAST_ACTIVITY_KEY = 'adminLastActivityAt';

// Helper – read stored role without throwing
const getStoredRole = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}').role || null;
  } catch {
    return null;
  }
};

const isAdminRole = (role) => role === 'admin' || role === 'superadmin';
// True while the admin has passed email/password but not yet completed face 2FA
const isFace2FAPending = () => localStorage.getItem('pendingFace2FA') === 'true';

const clearAdminSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('pendingFace2FA');
  localStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);
};

const hasActiveAdminSession = () => {
  const token = localStorage.getItem('token');
  const role = getStoredRole();
  return Boolean(token) && isAdminRole(role) && !isFace2FAPending();
};

const AdminIdleLogoutWatcher = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [warningSecondsLeft, setWarningSecondsLeft] = useState(Math.floor(ADMIN_WARNING_BEFORE_MS / 1000));

  useEffect(() => {
    let warningTimeoutId = null;
    let logoutTimeoutId = null;
    let countdownIntervalId = null;

    const clearTimers = () => {
      if (warningTimeoutId) {
        window.clearTimeout(warningTimeoutId);
        warningTimeoutId = null;
      }
      if (logoutTimeoutId) {
        window.clearTimeout(logoutTimeoutId);
        logoutTimeoutId = null;
      }
      if (countdownIntervalId) {
        window.clearInterval(countdownIntervalId);
        countdownIntervalId = null;
      }
    };

    const getLastActivity = () => {
      const stored = Number.parseInt(localStorage.getItem(ADMIN_LAST_ACTIVITY_KEY) || '', 10);
      return Number.isFinite(stored) ? stored : Date.now();
    };

    const getRemainingIdleMs = () => ADMIN_IDLE_TIMEOUT_MS - (Date.now() - getLastActivity());

    const performIdleLogout = async () => {
      clearTimers();
      setShowIdleWarning(false);
      if (!hasActiveAdminSession()) {
        localStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);
        return;
      }

      try {
        await logout();
      } catch (error) {
        console.error('Idle logout request failed:', error);
      }

      clearAdminSession();
      navigate('/admin-login', { replace: true });
    };

    const startWarningCountdown = () => {
      setShowIdleWarning(true);
      setWarningSecondsLeft(Math.max(0, Math.ceil(getRemainingIdleMs() / 1000)));

      if (countdownIntervalId) {
        window.clearInterval(countdownIntervalId);
      }

      countdownIntervalId = window.setInterval(() => {
        const seconds = Math.max(0, Math.ceil(getRemainingIdleMs() / 1000));
        setWarningSecondsLeft(seconds);
      }, 1000);
    };

    const scheduleIdleTimers = () => {
      clearTimers();

      if (!hasActiveAdminSession()) {
        localStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);
        setShowIdleWarning(false);
        return;
      }

      const remaining = getRemainingIdleMs();

      if (remaining <= 0) {
        performIdleLogout();
        return;
      }

      const warningDelay = Math.max(remaining - ADMIN_WARNING_BEFORE_MS, 0);
      if (warningDelay > 0) {
        warningTimeoutId = window.setTimeout(startWarningCountdown, warningDelay);
      }
      logoutTimeoutId = window.setTimeout(performIdleLogout, remaining);

      if (warningDelay === 0) {
        startWarningCountdown();
      }
    };

    const markActivity = () => {
      if (!hasActiveAdminSession()) {
        setShowIdleWarning(false);
        return;
      }

      localStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, String(Date.now()));
      setShowIdleWarning(false);
      scheduleIdleTimers();
    };

    const onStorageChange = (event) => {
      if (
        event.key === 'token' ||
        event.key === 'user' ||
        event.key === 'pendingFace2FA' ||
        event.key === ADMIN_LAST_ACTIVITY_KEY
      ) {
        if (!hasActiveAdminSession()) {
          setShowIdleWarning(false);
        }
        scheduleIdleTimers();
      }
    };

    const onKeepAlive = () => {
      markActivity();
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, markActivity, { passive: true });
    });

    window.addEventListener('storage', onStorageChange);
    window.addEventListener('admin-keep-alive', onKeepAlive);

    if (hasActiveAdminSession()) {
      localStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, String(Date.now()));
    }
    scheduleIdleTimers();

    return () => {
      clearTimers();
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
      });
      window.removeEventListener('storage', onStorageChange);
      window.removeEventListener('admin-keep-alive', onKeepAlive);
    };
  }, [navigate, location.pathname]);

  const handleStayLoggedIn = () => {
    if (!hasActiveAdminSession()) {
      return;
    }

    window.dispatchEvent(new Event('admin-keep-alive'));
  };

  return showIdleWarning ? (
    <div className="idle-warning-overlay" role="dialog" aria-modal="true" aria-labelledby="idle-warning-title">
      <div className="idle-warning-modal">
        <h2 id="idle-warning-title">Session Timeout Warning</h2>
        <p>
          You will be logged out in <strong>{warningSecondsLeft}</strong> seconds due to inactivity.
        </p>
        <p className="idle-warning-subtext">Click below to stay logged in.</p>
        <div className="idle-warning-actions">
          <button type="button" className="idle-warning-btn" onClick={handleStayLoggedIn}>
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  ) : null;
};

// ── Route Guards ────────────────────────────────────────────────────────────

// /  →  Students & teachers (face kiosk).
// If an admin is already FULLY logged in, send them straight to the dashboard.
const KioskGuard = ({ children }) => {
  const token = localStorage.getItem('token');
  const role = getStoredRole();
  if (token && isAdminRole(role) && !isFace2FAPending()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// /admin-login  →  Login page for admins.
// Already-fully-authenticated admins are redirected to the dashboard.
const AdminLoginGuard = ({ children }) => {
  const token = localStorage.getItem('token');
  const role = getStoredRole();
  if (token && isAdminRole(role) && !isFace2FAPending()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// /dashboard  →  Admin / SuperAdmin only, face 2FA must be complete.
// No token OR pending 2FA → /admin-login.  Student/teacher token → /.
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token || isFace2FAPending()) {
    return <Navigate to="/admin-login" replace />;
  }
  const role = getStoredRole();
  if (!isAdminRole(role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <AdminIdleLogoutWatcher />
      <div className="App">
        <Routes>
          <Route
            path="/"
            element={
              <KioskGuard>
                <HomePage />
              </KioskGuard>
            }
          />
          <Route
            path="/admin-login"
            element={
              <AdminLoginGuard>
                <AdminLoginPage />
              </AdminLoginGuard>
            }
          />
          <Route
            path="/dashboard"
            element={
              <AdminRoute>
                <SuperAdminDashboard />
              </AdminRoute>
            }
          />
          {/* Catch-all – send unknown paths to kiosk */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
