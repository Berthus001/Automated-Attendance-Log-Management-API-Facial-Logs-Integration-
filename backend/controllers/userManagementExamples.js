/**
 * User Management API - Test Examples
 * Demonstrates how to use the POST /api/users endpoint
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';

/**
 * Helper: Convert image file to base64
 */
const imageToBase64 = (imagePath) => {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');
  const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
};

/**
 * Example 1: SuperAdmin creates an Admin user
 */
const superAdminCreatesAdmin = async (superadminToken) => {
  try {
    const imagePath = path.join(__dirname, '../uploads/faces/admin-photo.jpg');
    const base64Image = imageToBase64(imagePath);

    const response = await axios.post(`${API_URL}/users`, {
      name: 'Admin User',
      email: 'admin@school.com',
      password: 'admin123456',
      role: 'admin',
      image: base64Image
    }, {
      headers: {
        'Authorization': `Bearer ${superadminToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✓ SuperAdmin created Admin user:');
    console.log(response.data);
  } catch (error) {
    console.error('✗ Error:', error.response?.data || error.message);
  }
};

/**
 * Example 2: SuperAdmin creates a Teacher
 */
const superAdminCreatesTeacher = async (superadminToken) => {
  try {
    const imagePath = path.join(__dirname, '../uploads/faces/teacher-photo.jpg');
    const base64Image = imageToBase64(imagePath);

    const response = await axios.post(`${API_URL}/users`, {
      name: 'Jane Smith',
      email: 'jane.smith@school.com',
      password: 'teacher123',
      role: 'teacher',
      image: base64Image
    }, {
      headers: {
        'Authorization': `Bearer ${superadminToken}`
      }
    });

    console.log('✓ SuperAdmin created Teacher:');
    console.log(response.data);
  } catch (error) {
    console.error('✗ Error:', error.response?.data || error.message);
  }
};

/**
 * Example 3: Admin creates a Teacher
 */
const adminCreatesTeacher = async (adminToken) => {
  try {
    const imagePath = path.join(__dirname, '../uploads/faces/teacher2-photo.jpg');
    const base64Image = imageToBase64(imagePath);

    const response = await axios.post(`${API_URL}/users`, {
      name: 'John Doe',
      email: 'john.doe@school.com',
      password: 'teacher456',
      role: 'teacher',
      image: base64Image
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    console.log('✓ Admin created Teacher:');
    console.log(response.data);
  } catch (error) {
    console.error('✗ Error:', error.response?.data || error.message);
  }
};

/**
 * Example 4: Admin creates a Student
 */
const adminCreatesStudent = async (adminToken) => {
  try {
    const imagePath = path.join(__dirname, '../uploads/faces/student-photo.jpg');
    const base64Image = imageToBase64(imagePath);

    const response = await axios.post(`${API_URL}/users`, {
      name: 'Alice Johnson',
      email: 'alice.johnson@school.com',
      password: 'student789',
      role: 'student',
      image: base64Image
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    console.log('✓ Admin created Student:');
    console.log(response.data);
  } catch (error) {
    console.error('✗ Error:', error.response?.data || error.message);
  }
};

/**
 * Example 5: Admin tries to create Admin (SHOULD FAIL - 403)
 */
const adminCreatesAdmin_Forbidden = async (adminToken) => {
  try {
    const imagePath = path.join(__dirname, '../uploads/faces/admin2-photo.jpg');
    const base64Image = imageToBase64(imagePath);

    const response = await axios.post(`${API_URL}/users`, {
      name: 'Another Admin',
      email: 'admin2@school.com',
      password: 'admin456',
      role: 'admin', // ❌ Admin cannot create admin
      image: base64Image
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    console.log('✗ This should not succeed!');
  } catch (error) {
    console.log('✓ Expected error (Admin cannot create Admin):');
    console.log(error.response?.data);
    // Expected: "Admin users can only create teacher and student accounts"
  }
};

/**
 * Example 6: Error - No face detected
 */
const errorNoFaceDetected = async (adminToken) => {
  try {
    const imagePath = path.join(__dirname, '../uploads/no-face.jpg');
    const base64Image = imageToBase64(imagePath);

    const response = await axios.post(`${API_URL}/users`, {
      name: 'Test User',
      email: 'test@school.com',
      password: 'test123',
      role: 'student',
      image: base64Image // Image with no face
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
  } catch (error) {
    console.log('✓ Expected error (No face detected):');
    console.log(error.response?.data);
    // Expected: "No face detected in the image"
  }
};

/**
 * Example 7: Error - Multiple faces detected
 */
const errorMultipleFaces = async (adminToken) => {
  try {
    const imagePath = path.join(__dirname, '../uploads/group-photo.jpg');
    const base64Image = imageToBase64(imagePath);

    const response = await axios.post(`${API_URL}/users`, {
      name: 'Test User',
      email: 'test2@school.com',
      password: 'test123',
      role: 'student',
      image: base64Image // Image with multiple faces
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
  } catch (error) {
    console.log('✓ Expected error (Multiple faces):');
    console.log(error.response?.data);
    // Expected: "Multiple faces detected (N). Please provide an image with a single face."
  }
};

/**
 * Example 8: Error - Email already exists
 */
const errorEmailExists = async (adminToken) => {
  try {
    const imagePath = path.join(__dirname, '../uploads/faces/duplicate-photo.jpg');
    const base64Image = imageToBase64(imagePath);

    // Try to create user with existing email
    const response = await axios.post(`${API_URL}/users`, {
      name: 'Duplicate User',
      email: 'alice.johnson@school.com', // Already exists
      password: 'password123',
      role: 'student',
      image: base64Image
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
  } catch (error) {
    console.log('✓ Expected error (Email already exists):');
    console.log(error.response?.data);
    // Expected: "Email already registered"
  }
};

/**
 * Run all examples
 */
const runExamples = async () => {
  console.log('\n=== User Management API Examples ===\n');

  // First, login to get tokens
  const superadminToken = 'your-superadmin-jwt-token';
  const adminToken = 'your-admin-jwt-token';

  // Run examples
  await superAdminCreatesAdmin(superadminToken);
  console.log('\n---\n');
  
  await superAdminCreatesTeacher(superadminToken);
  console.log('\n---\n');
  
  await adminCreatesTeacher(adminToken);
  console.log('\n---\n');
  
  await adminCreatesStudent(adminToken);
  console.log('\n---\n');
  
  await adminCreatesAdmin_Forbidden(adminToken);
  console.log('\n---\n');
  
  await errorNoFaceDetected(adminToken);
  console.log('\n---\n');
  
  await errorMultipleFaces(adminToken);
  console.log('\n---\n');
  
  await errorEmailExists(adminToken);
};

// Uncomment to run
// runExamples();

module.exports = {
  imageToBase64,
  superAdminCreatesAdmin,
  superAdminCreatesTeacher,
  adminCreatesTeacher,
  adminCreatesStudent,
  adminCreatesAdmin_Forbidden,
  errorNoFaceDetected,
  errorMultipleFaces,
  errorEmailExists,
};
