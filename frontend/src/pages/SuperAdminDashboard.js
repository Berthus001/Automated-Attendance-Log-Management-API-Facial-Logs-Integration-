import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import WebcamWithFaceDetection from '../components/WebcamWithFaceDetection';
import { getAllUsers, createUser, updateUser, deleteUser, getCurrentUser, getAttendance } from '../services/api';
import './SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, admins
  const [selectedRole, setSelectedRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState(null);
  const [attendanceRoleFilter, setAttendanceRoleFilter] = useState('all');
  const [attendanceDateFilter, setAttendanceDateFilter] = useState('');
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendanceLimit] = useState(10);
  const [attendanceTotal, setAttendanceTotal] = useState(0);
  const [attendancePages, setAttendancePages] = useState(0);

  // Department options for React Select
  const departmentOptions = [
    { value: 'Computer Science', label: 'Computer Science' },
    { value: 'Information Technology', label: 'Information Technology' },
    { value: 'Software Engineering', label: 'Software Engineering' },
    { value: 'Mathematics', label: 'Mathematics' },
    { value: 'Physics', label: 'Physics' },
    { value: 'Chemistry', label: 'Chemistry' },
    { value: 'Biology', label: 'Biology' },
    { value: 'English', label: 'English' },
    { value: 'History', label: 'History' },
    { value: 'Business Administration', label: 'Business Administration' },
    { value: 'Accounting', label: 'Accounting' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Mechanical Engineering', label: 'Mechanical Engineering' },
    { value: 'Electrical Engineering', label: 'Electrical Engineering' },
    { value: 'Civil Engineering', label: 'Civil Engineering' },
    { value: 'Architecture', label: 'Architecture' },
    { value: 'Psychology', label: 'Psychology' },
    { value: 'Sociology', label: 'Sociology' },
    { value: 'Economics', label: 'Economics' },
    { value: 'Political Science', label: 'Political Science' },
    { value: 'Education', label: 'Education' },
    { value: 'Nursing', label: 'Nursing' },
    { value: 'Medicine', label: 'Medicine' },
    { value: 'Law', label: 'Law' },
    { value: 'Arts & Design', label: 'Arts & Design' },
    { value: 'Music', label: 'Music' },
    { value: 'Physical Education', label: 'Physical Education' },
    { value: 'Other', label: 'Other' },
  ];
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    department: '',
  });
  const [capturedImage, setCapturedImage] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadCurrentUser = useCallback(async () => {
    try {
      const response = await getCurrentUser();
      if (response.success && response.user) {
        setCurrentUser(response.user);
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
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    loadCurrentUser();
  }, [navigate, loadCurrentUser]);

  useEffect(() => {
    if (currentUser) {
      loadUsers();
      loadAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

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

  const loadAttendance = useCallback(async () => {
    try {
      setAttendanceLoading(true);
      setAttendanceError(null);

      const filters = {
        page: attendancePage,
        limit: attendanceLimit,
      };
      if (attendanceRoleFilter !== 'all') {
        filters.role = attendanceRoleFilter;
      }
      if (attendanceDateFilter) {
        filters.date = attendanceDateFilter;
      }

      const response = await getAttendance(filters);
      if (response.success && Array.isArray(response.data)) {
        setAttendanceLogs(response.data);
        setAttendanceTotal(response.total || 0);
        setAttendancePages(response.pages || 0);
      } else {
        setAttendanceLogs([]);
        setAttendanceTotal(0);
        setAttendancePages(0);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
      setAttendanceError(err.response?.data?.message || 'Failed to load attendance logs');
      setAttendanceLogs([]);
      setAttendanceTotal(0);
      setAttendancePages(0);
    } finally {
      setAttendanceLoading(false);
    }
  }, [attendanceRoleFilter, attendanceDateFilter, attendancePage, attendanceLimit]);

  useEffect(() => {
    setAttendancePage(1);
  }, [attendanceRoleFilter, attendanceDateFilter]);

  useEffect(() => {
    if (currentUser && activeTab === 'attendance') {
      loadAttendance();
    }
  }, [currentUser, activeTab, loadAttendance]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const openAddModal = (roleType = 'student') => {
    setModalMode('add');
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: roleType,
      department: '',
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
      password: '',
      role: user.role,
    });
    setCapturedImage(null);
    setFormError(null);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  const handleDepartmentChange = (selectedOption) => {
    setFormData(prev => ({ ...prev, department: selectedOption ? selectedOption.value : '' }));
    setFormError(null);
  };

  const handleImageCapture = (image) => {
    setCapturedImage(image);
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
        department: formData.department || '',
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
        await loadUsers();
        setShowModal(false);
        setFormData({ name: '', email: '', password: '', role: 'student', department: '' });
        setCapturedImage(null);
      }
    } catch (error) {
      console.error('Form submit error:', error);
      setFormError(error.response?.data?.message || 'Operation failed. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await deleteUser(userId);
      if (response.success) {
        await loadUsers();
      }
    } catch (error) {
      console.error('Delete user error:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user => {
    if (currentUser && currentUser.role === 'admin') {
      if (user.role !== 'student' && user.role !== 'teacher') {
        return false;
      }
    }
    
    if (selectedRole !== 'all' && user.role !== selectedRole) {
      return false;
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const usersByRole = {
    superadmin: users.filter(u => u.role === 'superadmin'),
    admin: users.filter(u => u.role === 'admin'),
    teacher: users.filter(u => u.role === 'teacher'),
    student: users.filter(u => u.role === 'student'),
  };

  if (error && !currentUser) {
    return (
      <div className="superadmin-dashboard">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Access Denied</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const renderOverviewTab = () => (
    <div className="overview-content">
      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-header">
            <span className="stat-icon">👥</span>
            <span className="stat-title">Total Users</span>
          </div>
          <div className="stat-value">{users.length}</div>
          <div className="stat-footer">Active in system</div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-header">
            <span className="stat-icon">👨‍🎓</span>
            <span className="stat-title">Students</span>
          </div>
          <div className="stat-value">{usersByRole.student.length}</div>
          <div className="stat-footer">Enrolled students</div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-header">
            <span className="stat-icon">👨‍🏫</span>
            <span className="stat-title">Teachers</span>
          </div>
          <div className="stat-value">{usersByRole.teacher.length}</div>
          <div className="stat-footer">Active teachers</div>
        </div>

        {currentUser?.role === 'superadmin' && (
          <div className="stat-card stat-warning">
            <div className="stat-header">
              <span className="stat-icon">🛡️</span>
              <span className="stat-title">Administrators</span>
            </div>
            <div className="stat-value">{usersByRole.admin.length}</div>
            <div className="stat-footer">Admin accounts</div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2 className="section-title">⚡ Quick Actions</h2>
        <div className="action-cards-grid">
          {currentUser?.role === 'superadmin' && (
            <div className="action-card" onClick={() => openAddModal('admin')}>
              <div className="action-icon action-admin">🔐</div>
              <h3>Add New Admin</h3>
              <p>Create administrator account with full access</p>
            </div>
          )}
          
          <div className="action-card" onClick={() => openAddModal('teacher')}>
            <div className="action-icon action-teacher">👨‍🏫</div>
            <h3>Add Teacher</h3>
            <p>Register new teacher account</p>
          </div>
          
          <div className="action-card" onClick={() => openAddModal('student')}>
            <div className="action-icon action-student">👨‍🎓</div>
            <h3>Add Student</h3>
            <p>Enroll new student with face recognition</p>
          </div>
          
          <div className="action-card" onClick={() => setActiveTab('users')}>
            <div className="action-icon action-view">📋</div>
            <h3>View All Users</h3>
            <p>Manage existing user accounts</p>
          </div>

          <div className="action-card" onClick={() => setActiveTab('attendance')}>
            <div className="action-icon action-view">🕒</div>
            <h3>View Attendance</h3>
            <p>See student and teacher login history</p>
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="recent-users">
        <h2 className="section-title">👤 Recently Added Users</h2>
        <div className="recent-users-list">
          {users.slice(0, 5).map(user => (
            <div key={user._id} className="recent-user-item">
              <div className="user-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
              </div>
              <span className={`role-badge role-${user.role}`}>
                {user.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="users-content">
      <div className="users-header">
        <h2 className="section-title">👥 All Users</h2>
        <div className="users-controls">
          <input
            type="text"
            placeholder="🔍 Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
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
                  <td className="user-name-cell">
                    <div className="user-avatar-small">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    {user.name}
                  </td>
                  <td className="user-email">{user.email}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                      {user.isActive ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </td>
                  <td>
                    <span className={`face-badge ${user.faceDescriptor?.length > 0 ? 'face-enrolled' : 'face-missing'}`}>
                      {user.faceDescriptor?.length > 0 ? '✓ Enrolled' : '✗ No Face'}
                    </span>
                  </td>
                  <td className="date-cell">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="actions-cell">
                    <button
                      onClick={() => openEditModal(user)}
                      className="btn-action btn-edit"
                      title="Edit user"
                    >
                      ✏️
                    </button>
                    {user._id !== currentUser?._id && (
                      <button
                        onClick={() => handleDeleteUser(user._id, user.name)}
                        className="btn-action btn-delete"
                        title="Delete user"
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderAttendanceTab = () => (
    <div className="attendance-content">
      <div className="users-header">
        <h2 className="section-title">🕒 Attendance Logs</h2>
        <div className="users-controls attendance-controls">
          <select
            value={attendanceRoleFilter}
            onChange={(e) => setAttendanceRoleFilter(e.target.value)}
            className="role-filter"
          >
            <option value="all">All Roles</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>

          <input
            type="date"
            value={attendanceDateFilter}
            onChange={(e) => setAttendanceDateFilter(e.target.value)}
            className="attendance-date-filter"
          />

          <button
            className="btn-secondary"
            type="button"
            onClick={() => {
              setAttendanceRoleFilter('all');
              setAttendanceDateFilter('');
              setAttendancePage(1);
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {attendanceLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading attendance logs...</p>
        </div>
      ) : attendanceError ? (
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <h3>Failed to load attendance</h3>
          <p>{attendanceError}</p>
        </div>
      ) : attendanceLogs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No attendance logs found</h3>
          <p>Try changing filters or wait for new face logins.</p>
        </div>
      ) : (
        <div className="attendance-table-wrapper">
          <div className="users-table-container">
            <table className="users-table attendance-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Date</th>
                  <th>Time In</th>
                  <th>Time Out</th>
                </tr>
              </thead>
              <tbody>
                {attendanceLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="user-name-cell">{log.name}</td>
                    <td>
                      <span className={`role-badge role-${log.role}`}>
                        {log.role}
                      </span>
                    </td>
                    <td>{log.date}</td>
                    <td>{log.timeInFormatted || log.time || '—'}</td>
                    <td>
                      {log.timeOutFormatted
                        ? log.timeOutFormatted
                        : <span className="time-pending">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="attendance-pagination">
            <button
              type="button"
              className="btn-secondary attendance-page-btn"
              onClick={() => setAttendancePage((prev) => Math.max(1, prev - 1))}
              disabled={attendanceLoading || attendancePage <= 1}
            >
              Previous
            </button>

            <span className="attendance-page-indicator">
              Page {attendancePages === 0 ? 0 : attendancePage} of {attendancePages}
            </span>

            <button
              type="button"
              className="btn-secondary attendance-page-btn"
              onClick={() => setAttendancePage((prev) => prev + 1)}
              disabled={attendanceLoading || attendancePage >= attendancePages || attendancePages === 0}
            >
              Next
            </button>
          </div>

          <div className="attendance-pagination-summary">
            Total records: {attendanceTotal}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="superadmin-dashboard">
      {/* Top Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="header-title">
              {currentUser?.role === 'superadmin' ? '🛡️ Superadmin Dashboard' : '👥 Admin Dashboard'}
            </h1>
            <p className="header-subtitle">
              Welcome back, <strong>{currentUser?.name}</strong>
            </p>
          </div>
          <div className="header-right">
            <div className="user-badge">
              <span className={`role-indicator role-${currentUser?.role}`}>
                {currentUser?.role}
              </span>
            </div>
            <button onClick={handleLogout} className="btn-logout">
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-nav">
        <div className="nav-content">
          <button
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button
            className={`nav-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 All Users
          </button>
          <button
            className={`nav-tab ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            🕒 Attendance
          </button>
          {currentUser?.role === 'superadmin' && (
            <button
              className={`nav-tab ${activeTab === 'admins' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('users');
                setSelectedRole('admin');
              }}
            >
              🛡️ Administrators
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'attendance' && renderAttendanceTab()}
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'add' ? '➕ Add New User' : '✏️ Edit User'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {formError && (
                <div className="form-error">
                  ⚠️ {formError}
                </div>
              )}

              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  disabled={formLoading}
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  disabled={formLoading || modalMode === 'edit'}
                />
              </div>

              <div className="form-group">
                <label>Password {modalMode === 'edit' && '(leave blank to keep current)'}</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter password"
                  disabled={formLoading}
                />
              </div>

              <div className="form-group">
                <label>Role</label>
                <input
                  type="text"
                  value={formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
                  disabled
                  className="role-display"
                  style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label>Department</label>
                <Select
                  value={departmentOptions.find(opt => opt.value === formData.department)}
                  onChange={handleDepartmentChange}
                  options={departmentOptions}
                  isDisabled={formLoading}
                  placeholder="Select Department"
                  isClearable
                  className="department-select-container"
                  classNamePrefix="department-select"
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    menu: (base) => ({
                      ...base,
                      maxHeight: '200px',
                    }),
                    menuList: (base) => ({
                      ...base,
                      maxHeight: '200px',
                    }),
                    control: (base) => ({
                      ...base,
                      borderColor: '#e5e7eb',
                      borderWidth: '2px',
                      borderRadius: '8px',
                      minHeight: '44px',
                      '&:hover': {
                        borderColor: '#e5e7eb',
                      },
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected ? '#667eea' : state.isFocused ? '#f3f4f6' : 'white',
                      color: state.isSelected ? 'white' : '#374151',
                      cursor: 'pointer',
                      padding: '10px 12px',
                    }),
                  }}
                />
              </div>

              {modalMode === 'add' && (
                <div className="form-group">
                  <label>Face Photo (Required for Enrollment)</label>
                  <div className="webcam-container">
                    <WebcamWithFaceDetection
                      onCapture={handleImageCapture}
                      buttonText="📸 Capture Face"
                    />
                  </div>
                  {capturedImage && (
                    <div className="captured-preview">
                      <p>✓ Face captured successfully!</p>
                    </div>
                  )}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? 'Processing...' : (modalMode === 'add' ? 'Create User' : 'Update User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
