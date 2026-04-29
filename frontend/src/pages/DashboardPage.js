import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import WebcamWithFaceDetection from '../components/WebcamWithFaceDetection';
import { getAllUsers, createUser, updateUser, deleteUser, getCurrentUser } from '../services/api';
import './DashboardPage.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRole, setSelectedRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
  });
  const [capturedImage, setCapturedImage] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Check authentication and load data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    loadCurrentUser();
  }, [navigate]);

  // Load users when currentUser changes
  useEffect(() => {
    if (currentUser) {
      loadUsers();
    }
  }, [currentUser]);

  // Load current user
  const loadCurrentUser = async () => {
    try {
      const response = await getCurrentUser();
      if (response.success && response.user) {
        setCurrentUser(response.user);
        
        // Check if user has permission (admin or superadmin)
        if (response.user.role !== 'admin' && response.user.role !== 'superadmin') {
          setError('Access denied. Only administrators can access this page.');
          setTimeout(() => navigate('/'), 2000);
        }
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      setError('Session expired. Please login again.');
      setTimeout(() => {
        localStorage.removeItem('token');
        navigate('/');
      }, 2000);
    }
  };

  // Load all users
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await getAllUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      setError(error.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // Handle modal open
  const openAddModal = () => {
    setModalMode('add');
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'student',
    });
    setCapturedImage(null);
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't pre-fill password
      role: user.role,
    });
    setCapturedImage(null);
    setFormError(null);
    setShowModal(true);
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  // Handle image capture
  const handleImageCapture = (image) => {
    setCapturedImage(image);
    setFormError(null);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setFormError('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Email is required');
      return;
    }
    if (modalMode === 'add' && !formData.password.trim()) {
      setFormError('Password is required');
      return;
    }
    if (modalMode === 'add' && !capturedImage) {
      setFormError('Please capture a face photo for enrollment');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
      };

      if (formData.password.trim()) {
        userData.password = formData.password;
      }

      if (capturedImage) {
        userData.image = capturedImage;
      }

      let response;
      if (modalMode === 'add') {
        response = await createUser(userData);
      } else {
        response = await updateUser(selectedUser._id, userData);
      }

      if (response.success) {
        // Reload users list
        await loadUsers();
        setShowModal(false);
        setFormData({ name: '', email: '', password: '', role: 'student' });
        setCapturedImage(null);
      }
    } catch (error) {
      console.error('Form submit error:', error);
      setFormError(error.response?.data?.message || 'Operation failed. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await deleteUser(userId);
      if (response.success) {
        // Reload users list
        await loadUsers();
      }
    } catch (error) {
      console.error('Delete user error:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    // Filter based on current user's role (admins only see students/teachers)
    if (currentUser && currentUser.role === 'admin') {
      if (user.role !== 'student' && user.role !== 'teacher') {
        return false;
      }
    }
    
    // Filter by role
    if (selectedRole !== 'all' && user.role !== selectedRole) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Group users by role
  const usersByRole = {
    superadmin: filteredUsers.filter(u => u.role === 'superadmin'),
    admin: filteredUsers.filter(u => u.role === 'admin'),
    teacher: filteredUsers.filter(u => u.role === 'teacher'),
    student: filteredUsers.filter(u => u.role === 'student'),
  };

  if (error && !currentUser) {
    return (
      <div className="dashboard-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Access Denied</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>
              {currentUser?.role === 'admin' ? '👥 Student & Teacher Management' : '👤 User Management Dashboard'}
            </h1>
            {currentUser && (
              <p className="welcome-text">
                Welcome, <strong>{currentUser.name}</strong> ({currentUser.role})
              </p>
            )}
          </div>
          <div className="header-right">
            <button onClick={handleLogout} className="btn btn-logout">
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="dashboard-controls">
        <div className="controls-left">
          <button onClick={openAddModal} className="btn btn-primary">
            ➕ {currentUser?.role === 'admin' ? 'Add Student/Teacher' : 'Add New User'}
          </button>
        </div>
        
        <div className="controls-center">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="controls-right">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="role-filter"
          >
            <option value="all">All Roles</option>
            {currentUser?.role === 'superadmin' && (
              <>
                <option value="superadmin">Superadmin</option>
                <option value="admin">Admin</option>
              </>
            )}
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-value">
              {currentUser?.role === 'admin' 
                ? usersByRole.student.length + usersByRole.teacher.length
                : users.length}
            </div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👨‍🎓</div>
          <div className="stat-info">
            <div className="stat-value">{usersByRole.student.length}</div>
            <div className="stat-label">Students</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👨‍🏫</div>
          <div className="stat-info">
            <div className="stat-value">{usersByRole.teacher.length}</div>
            <div className="stat-label">Teachers</div>
          </div>
        </div>
        {currentUser?.role === 'superadmin' && (
          <div className="stat-card">
            <div className="stat-icon">🛡️</div>
            <div className="stat-info">
              <div className="stat-value">{usersByRole.admin.length + usersByRole.superadmin.length}</div>
              <div className="stat-label">Administrators</div>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="users-section">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No users found</h3>
            <p>Try adjusting your filters or add a new user</p>
          </div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Face Enrolled</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user._id}>
                    <td className="user-name">{user.name}</td>
                    <td className="user-email">{user.email}</td>
                    <td>
                      <span className={`role-badge role-${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                        {user.isActive ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </td>
                    <td>
                      <span className={`face-status ${user.faceDescriptor && user.faceDescriptor.length > 0 ? 'enrolled' : 'not-enrolled'}`}>
                        {user.faceDescriptor && user.faceDescriptor.length > 0 ? '✓ Yes' : '✗ No'}
                      </span>
                    </td>
                    <td className="user-date">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="user-actions">
                      <button
                        onClick={() => openEditModal(user)}
                        className="btn-icon btn-edit"
                        title="Edit user"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id, user.name)}
                        className="btn-icon btn-delete"
                        title="Delete user"
                        disabled={user._id === currentUser?._id}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'add' ? '➕ Add New User' : '✏️ Edit User'}</h2>
              <button onClick={() => setShowModal(false)} className="modal-close">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="form-input"
                    disabled={formLoading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    className="form-input"
                    disabled={formLoading}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">
                    Password {modalMode === 'add' ? '*' : '(leave blank to keep current)'}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="form-input"
                    disabled={formLoading}
                    required={modalMode === 'add'}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role">Role *</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="form-input"
                    disabled={formLoading}
                    required
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    {currentUser?.role === 'superadmin' && (
                      <>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>
                  Face Photo {modalMode === 'add' ? '*' : '(optional - to update face)'}
                </label>
                <div className="webcam-container">
                  <WebcamWithFaceDetection
                    onCapture={handleImageCapture}
                    capturedImage={capturedImage}
                  />
                </div>
              </div>

              {formError && (
                <div className="form-error">
                  ⚠️ {formError}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? '⏳ Saving...' : modalMode === 'add' ? '➕ Create User' : '💾 Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
