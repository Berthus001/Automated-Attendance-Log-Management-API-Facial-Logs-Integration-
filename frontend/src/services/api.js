import axios from 'axios';

// API Base URL - update this to match your backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API Functions

// ========== AUTHENTICATION ==========

/**
 * Admin/Superadmin login with email + password
 * @param {Object} credentials - { email, password }
 * @returns {Promise} Response with token
 */
export const adminLogin = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    console.error('Admin login error:', error);
    throw error;
  }
};

/**
 * Face-only login for teachers and students
 * @param {Object} loginData - { image: base64 string }
 * @returns {Promise} Response with token
 */
export const faceOnlyLogin = async (loginData) => {
  try {
    const response = await api.post('/auth/face-login', loginData);
    return response.data;
  } catch (error) {
    console.error('Face login error:', error);
    throw error;
  }
};

/**
 * Face verification (2FA) for admins
 * @param {Object} verifyData - { image: base64 string }
 * @returns {Promise} Response with verification result
 */
export const verifyFace2FA = async (verifyData) => {
  try {
    const response = await api.post('/auth/face-verify', verifyData);
    return response.data;
  } catch (error) {
    console.error('Face verification error:', error);
    throw error;
  }
};

/**
 * Enroll or update the logged-in admin's face for 2FA
 * @param {Object} enrollData - { image: base64 string }
 * @returns {Promise} Response with updated user data
 */
export const enrollFace2FA = async (enrollData) => {
  try {
    const response = await api.post('/auth/enroll-face', enrollData);
    return response.data;
  } catch (error) {
    console.error('Face enrollment error:', error);
    throw error;
  }
};

/**
 * Get current user info
 * @returns {Promise} Response with user data
 */
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

/**
 * Logout current user
 * @returns {Promise} Response with logout confirmation
 */
export const logout = async () => {
  try {
    const response = await api.post('/auth/logout');
    return response.data;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Force logout (used when user is already logged in)
 * @param {Object} credentials - { email, password } for admin or { image } for face login
 * @returns {Promise} Response with logout confirmation
 */
export const forceLogout = async (credentials) => {
  try {
    // First, attempt to logout with provided credentials
    const response = await api.post('/auth/logout', credentials);
    return response.data;
  } catch (error) {
    console.error('Force logout error:', error);
    throw error;
  }
};

// ========== USER MANAGEMENT ==========

/**
 * Get all users (admin/superadmin only)
 * @param {Object} filters - Query parameters for filtering
 * @returns {Promise} Response with users list
 */
export const getAllUsers = async (filters = {}) => {
  try {
    const response = await api.get('/users', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Get all users error:', error);
    throw error;
  }
};

/**
 * Get user by ID (admin/superadmin only)
 * @param {string} userId - User ID
 * @returns {Promise} Response with user data
 */
export const getUserById = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get user by ID error:', error);
    throw error;
  }
};

/**
 * Create new user (admin/superadmin only)
 * @param {Object} userData - User data { name, email, password, role, image }
 * @returns {Promise} Response with created user
 */
export const createUser = async (userData) => {
  try {
    const response = await api.post('/users', userData);
    return response.data;
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
};

/**
 * Update user (admin/superadmin only)
 * @param {string} userId - User ID
 * @param {Object} userData - Updated user data
 * @returns {Promise} Response with updated user
 */
export const updateUser = async (userId, userData) => {
  try {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
};

/**
 * Delete user (admin/superadmin only)
 * @param {string} userId - User ID
 * @returns {Promise} Response confirmation
 */
export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Delete user error:', error);
    throw error;
  }
};

// ========== OLD ENDPOINTS (for reference) ==========

/**
 * Enroll a new student (DEPRECATED - use user management API)
 * @param {Object} studentData - Student enrollment data
 * @returns {Promise} Response from API
 */
export const enrollStudent = async (studentData) => {
  try {
    const response = await api.post('/enroll', studentData);
    return response.data;
  } catch (error) {
    console.error('Enrollment error:', error);
    throw error;
  }
};

/**
 * Face login - log attendance via facial recognition
 * @param {Object} loginData - Login data with image and deviceId
 * @returns {Promise} Response from API
 */
export const faceLogin = async (loginData) => {
  try {
    const response = await api.post('/face-login', loginData);
    return response.data;
  } catch (error) {
    console.error('Face login error:', error);
    throw error;
  }
};

/**
 * Verify face without logging attendance
 * @param {Object} verifyData - Verification data with image
 * @returns {Promise} Response from API
 */
export const verifyFace = async (verifyData) => {
  try {
    const response = await api.post('/face-login/verify', verifyData);
    return response.data;
  } catch (error) {
    console.error('Face verification error:', error);
    throw error;
  }
};

/**
 * Get attendance logs with filters
 * @param {Object} filters - Query parameters for filtering
 * @returns {Promise} Response from API
 */
export const getAttendanceLogs = async (filters = {}) => {
  try {
    const response = await api.get('/logs', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Get logs error:', error);
    throw error;
  }
};

/**
 * Get dashboard attendance records (admin/superadmin)
 * @param {Object} filters - { role, date }
 * @returns {Promise} Response from API
 */
export const getAttendance = async (filters = {}) => {
  try {
    const response = await api.get('/attendance', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Get attendance error:', error);
    throw error;
  }
};

/**
 * Get unified action logs (superadmin only)
 * @param {Object} filters - { role, actionType, startDate, endDate, page, limit }
 * @returns {Promise} Response from API
 */
export const getActionLogs = async (filters = {}) => {
  try {
    const response = await api.get('/login-logs/actions', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Get action logs error:', error);
    throw error;
  }
};

// ========== KIOSK ==========

/**
 * Get all enrolled users (students/teachers) with face descriptors for kiosk matching
 * @returns {Promise} Response with user descriptors array
 */
export const getKioskDescriptors = async () => {
  try {
    const response = await api.get('/kiosk/descriptors');
    return response.data;
  } catch (error) {
    console.error('Get kiosk descriptors error:', error);
    throw error;
  }
};

/**
 * Record kiosk attendance after client-side face match
 * @param {Object} data - { userId, image, confidenceScore, deviceId? }
 * @returns {Promise} Response with attendance result
 */
export const recordKioskAttendance = async (data) => {
  try {
    const response = await api.post('/kiosk/attendance', data);
    return response.data;
  } catch (error) {
    console.error('Record kiosk attendance error:', error);
    throw error;
  }
};

/**
 * Get attendance statistics
 * @param {string} studentId - Student ID
 * @returns {Promise} Response from API
 */
export const getAttendanceStats = async (studentId) => {
  try {
    const response = await api.get(`/face-login/stats/${studentId}`);
    return response.data;
  } catch (error) {
    console.error('Get stats error:', error);
    throw error;
  }
};

/**
 * Get all enrolled students
 * @returns {Promise} Response from API
 */
export const getEnrolledStudents = async () => {
  try {
    const response = await api.get('/enroll');
    return response.data;
  } catch (error) {
    console.error('Get students error:', error);
    throw error;
  }
};

/**
 * Device sync - upload attendance log from device
 * @param {Object} syncData - Attendance log data
 * @returns {Promise} Response from API
 */
export const deviceSync = async (syncData) => {
  try {
    const response = await api.post('/device-sync', syncData);
    return response.data;
  } catch (error) {
    console.error('Device sync error:', error);
    throw error;
  }
};

export default api;
