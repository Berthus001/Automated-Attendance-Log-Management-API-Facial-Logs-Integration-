import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminLoginPage from './pages/AdminLoginPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import './App.css';

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
