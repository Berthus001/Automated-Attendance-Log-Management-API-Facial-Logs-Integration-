/**
 * Face Verification API - Usage Examples
 * Demonstrates second-factor authentication using facial recognition
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
 * Helper: Login to get JWT token
 */
const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });

    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Example 1: Successful Face Verification
 */
const example1_SuccessfulVerification = async () => {
  try {
    console.log('\n=== Example 1: Successful Face Verification ===\n');

    // Step 1: Login to get JWT token
    console.log('Step 1: Logging in...');
    const token = await login('admin@school.com', 'admin123456');
    console.log('✓ Logged in successfully');

    // Step 2: Capture face image (simulate webcam capture)
    console.log('\nStep 2: Capturing face image...');
    const imagePath = path.join(__dirname, '../uploads/faces/admin-photo.jpg');
    const base64Image = imageToBase64(imagePath);
    console.log('✓ Face image captured');

    // Step 3: Verify face
    console.log('\nStep 3: Verifying face...');
    const response = await axios.post(`${API_URL}/auth/face-verify`, {
      image: base64Image
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✓ Face verification successful!');
    console.log('\nResponse:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\nUser verified:', response.data.user.name);
    console.log('Confidence distance:', response.data.confidence.distance);
    console.log('Match threshold:', response.data.confidence.threshold);
  } catch (error) {
    console.error('✗ Error:', error.response?.data || error.message);
  }
};

/**
 * Example 2: Failed Verification - Wrong Face
 */
const example2_FailedVerification = async () => {
  try {
    console.log('\n=== Example 2: Failed Verification - Wrong Face ===\n');

    // Login as user A
    const token = await login('admin@school.com', 'admin123456');
    console.log('✓ Logged in as Admin');

    // Try to verify with different person's face
    const imagePath = path.join(__dirname, '../uploads/faces/different-person.jpg');
    const base64Image = imageToBase64(imagePath);

    const response = await axios.post(`${API_URL}/auth/face-verify`, {
      image: base64Image
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✗ This should not succeed!');
  } catch (error) {
    console.log('✓ Expected error (Face does not match):');
    console.log(JSON.stringify(error.response?.data, null, 2));
    console.log('\nVerification status:', error.response?.data.verified);
    console.log('Distance:', error.response?.data.confidence?.distance);
  }
};

/**
 * Example 3: Error - No Face Detected
 */
const example3_NoFaceDetected = async () => {
  try {
    console.log('\n=== Example 3: Error - No Face Detected ===\n');

    const token = await login('admin@school.com', 'admin123456');

    // Image with no face
    const imagePath = path.join(__dirname, '../uploads/no-face.jpg');
    const base64Image = imageToBase64(imagePath);

    const response = await axios.post(`${API_URL}/auth/face-verify`, {
      image: base64Image
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    console.log('✓ Expected error (No face detected):');
    console.log(JSON.stringify(error.response?.data, null, 2));
  }
};

/**
 * Example 4: Error - Multiple Faces Detected
 */
const example4_MultipleFaces = async () => {
  try {
    console.log('\n=== Example 4: Error - Multiple Faces ===\n');

    const token = await login('admin@school.com', 'admin123456');

    // Image with multiple faces
    const imagePath = path.join(__dirname, '../uploads/group-photo.jpg');
    const base64Image = imageToBase64(imagePath);

    const response = await axios.post(`${API_URL}/auth/face-verify`, {
      image: base64Image
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    console.log('✓ Expected error (Multiple faces):');
    console.log(JSON.stringify(error.response?.data, null, 2));
  }
};

/**
 * Example 5: Error - No JWT Token
 */
const example5_NoToken = async () => {
  try {
    console.log('\n=== Example 5: Error - No JWT Token ===\n');

    const imagePath = path.join(__dirname, '../uploads/faces/admin-photo.jpg');
    const base64Image = imageToBase64(imagePath);

    // Try to verify without JWT token
    const response = await axios.post(`${API_URL}/auth/face-verify`, {
      image: base64Image
    });
  } catch (error) {
    console.log('✓ Expected error (Unauthorized):');
    console.log(JSON.stringify(error.response?.data, null, 2));
  }
};

/**
 * Example 6: Protected Action Flow with Face Verification
 */
const example6_ProtectedActionFlow = async () => {
  try {
    console.log('\n=== Example 6: Protected Action Flow ===\n');

    // Step 1: User wants to perform sensitive action
    console.log('User wants to delete their account (sensitive action)...');

    // Step 2: Login
    console.log('\nStep 1: Logging in...');
    const token = await login('admin@school.com', 'admin123456');
    console.log('✓ Logged in');

    // Step 3: Require face verification before proceeding
    console.log('\nStep 2: System requires face verification for this action...');
    console.log('Capturing face...');
    
    const imagePath = path.join(__dirname, '../uploads/faces/admin-photo.jpg');
    const base64Image = imageToBase64(imagePath);

    console.log('Verifying face...');
    const verifyResponse = await axios.post(`${API_URL}/auth/face-verify`, {
      image: base64Image
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (verifyResponse.data.verified) {
      console.log('✓ Face verified!');
      console.log('\nStep 3: Proceeding with sensitive action...');
      // Now proceed with the sensitive action
      // await axios.delete(`${API_URL}/users/delete-account`, { headers: { 'Authorization': `Bearer ${token}` }});
      console.log('✓ Action completed successfully!');
    } else {
      console.log('✗ Face verification failed. Action denied.');
    }
  } catch (error) {
    console.error('✗ Error:', error.response?.data || error.message);
  }
};

/**
 * Example 7: Time-Limited Verification (Session-based)
 */
const example7_TimeLimitedVerification = async () => {
  console.log('\n=== Example 7: Time-Limited Verification ===\n');

  // Simulate session storage
  const session = {
    faceVerified: false,
    verifiedAt: null
  };

  const verifyFaceAndCache = async (token, imagePath) => {
    const base64Image = imageToBase64(imagePath);

    try {
      const response = await axios.post(`${API_URL}/auth/face-verify`, {
        image: base64Image
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.verified) {
        session.faceVerified = true;
        session.verifiedAt = Date.now();
        console.log('✓ Face verified and cached');
        return true;
      }
    } catch (error) {
      console.log('✗ Face verification failed');
      return false;
    }
  };

  const isFaceRecentlyVerified = () => {
    if (!session.faceVerified) return false;

    // Check if verification is still valid (5 minutes)
    const fiveMinutes = 5 * 60 * 1000;
    const isValid = (Date.now() - session.verifiedAt) < fiveMinutes;

    console.log(`Face verification ${isValid ? 'is' : 'is NOT'} still valid`);
    return isValid;
  };

  try {
    const token = await login('admin@school.com', 'admin123456');
    const imagePath = path.join(__dirname, '../uploads/faces/admin-photo.jpg');

    // First sensitive action
    console.log('\nAction 1: Update password');
    if (!isFaceRecentlyVerified()) {
      console.log('  Verification required...');
      await verifyFaceAndCache(token, imagePath);
    }
    console.log('  ✓ Password updated');

    // Second action within 5 minutes
    console.log('\nAction 2: Change email (within 5 minutes)');
    if (!isFaceRecentlyVerified()) {
      console.log('  Verification required...');
      await verifyFaceAndCache(token, imagePath);
    } else {
      console.log('  Using cached verification');
    }
    console.log('  ✓ Email changed');

    // Simulate time passing
    console.log('\n[6 minutes later...]');
    session.verifiedAt = Date.now() - (6 * 60 * 1000);

    // Third action after expiry
    console.log('\nAction 3: Delete account (after 6 minutes)');
    if (!isFaceRecentlyVerified()) {
      console.log('  Verification expired, re-verification required...');
      await verifyFaceAndCache(token, imagePath);
    } else {
      console.log('  Using cached verification');
    }
    console.log('  ✓ Account deleted');
  } catch (error) {
    console.error('Error:', error.message);
  }
};

/**
 * Run all examples
 */
const runExamples = async () => {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  Face Verification API - Usage Examples   ║');
  console.log('╚════════════════════════════════════════════╝');

  await example1_SuccessfulVerification();
  console.log('\n' + '─'.repeat(50));

  await example2_FailedVerification();
  console.log('\n' + '─'.repeat(50));

  await example3_NoFaceDetected();
  console.log('\n' + '─'.repeat(50));

  await example4_MultipleFaces();
  console.log('\n' + '─'.repeat(50));

  await example5_NoToken();
  console.log('\n' + '─'.repeat(50));

  await example6_ProtectedActionFlow();
  console.log('\n' + '─'.repeat(50));

  await example7_TimeLimitedVerification();
  console.log('\n' + '─'.repeat(50));

  console.log('\n✓ All examples completed!');
};

// Uncomment to run
// runExamples();

module.exports = {
  imageToBase64,
  login,
  example1_SuccessfulVerification,
  example2_FailedVerification,
  example3_NoFaceDetected,
  example4_MultipleFaces,
  example5_NoToken,
  example6_ProtectedActionFlow,
  example7_TimeLimitedVerification,
  runExamples
};
