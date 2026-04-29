/**
 * Face Recognition Utility - Usage Examples
 * Demonstrates how to use the face recognition functions
 */

const { loadModels, getFaceDescriptor, compareFaces } = require('../utils/faceDetection');
const path = require('path');

/**
 * Example 1: Load Models
 */
const example1_LoadModels = async () => {
  try {
    console.log('Loading face recognition models...');
    await loadModels();
    console.log('✓ Models loaded successfully');
  } catch (error) {
    console.error('✗ Failed to load models:', error.message);
  }
};

/**
 * Example 2: Get Face Descriptor (Single Face)
 */
const example2_GetDescriptor = async () => {
  try {
    const imagePath = path.join(__dirname, '../uploads/faces/user123.jpg');
    
    console.log('Extracting face descriptor...');
    const descriptor = await getFaceDescriptor(imagePath);
    
    console.log('✓ Face descriptor extracted');
    console.log('  Descriptor length:', descriptor.length);
    console.log('  First 5 values:', descriptor.slice(0, 5));
  } catch (error) {
    console.error('✗ Error:', error.message);
    // Possible errors:
    // - "No face detected in the image"
    // - "Multiple faces detected (2). Only one face allowed"
  }
};

/**
 * Example 3: Compare Two Faces
 */
const example3_CompareFaces = async () => {
  try {
    const image1 = path.join(__dirname, '../uploads/faces/user1.jpg');
    const image2 = path.join(__dirname, '../uploads/faces/user2.jpg');
    
    // Get descriptors
    const desc1 = await getFaceDescriptor(image1);
    const desc2 = await getFaceDescriptor(image2);
    
    // Compare faces (default threshold: 0.6)
    const result = compareFaces(desc1, desc2);
    
    console.log('Face comparison result:');
    console.log('  Distance:', result.distance);
    console.log('  Is Match:', result.isMatch);
    console.log('  Status:', result.isMatch ? '✓ MATCH' : '✗ NO MATCH');
  } catch (error) {
    console.error('✗ Error:', error.message);
  }
};

/**
 * Example 4: Compare with Custom Threshold
 */
const example4_CustomThreshold = async () => {
  try {
    const image1 = path.join(__dirname, '../uploads/faces/user1.jpg');
    const image2 = path.join(__dirname, '../uploads/faces/user1_different_angle.jpg');
    
    const desc1 = await getFaceDescriptor(image1);
    const desc2 = await getFaceDescriptor(image2);
    
    // Use stricter threshold (0.5)
    const strictResult = compareFaces(desc1, desc2, 0.5);
    
    // Use looser threshold (0.7)
    const looseResult = compareFaces(desc1, desc2, 0.7);
    
    console.log('Strict (0.5):', strictResult);
    console.log('Default (0.6):', compareFaces(desc1, desc2));
    console.log('Loose (0.7):', looseResult);
  } catch (error) {
    console.error('✗ Error:', error.message);
  }
};

/**
 * Example 5: Handle Errors (No Face)
 */
const example5_NoFaceError = async () => {
  try {
    const imagePath = path.join(__dirname, '../uploads/no-face.jpg');
    const descriptor = await getFaceDescriptor(imagePath);
  } catch (error) {
    console.log('Expected error:', error.message);
    // Output: "No face detected in the image"
  }
};

/**
 * Example 6: Handle Errors (Multiple Faces)
 */
const example6_MultipleFacesError = async () => {
  try {
    const imagePath = path.join(__dirname, '../uploads/group-photo.jpg');
    const descriptor = await getFaceDescriptor(imagePath);
  } catch (error) {
    console.log('Expected error:', error.message);
    // Output: "Multiple faces detected (3). Only one face allowed"
  }
};

/**
 * Example 7: Complete Authentication Flow
 */
const example7_AuthenticationFlow = async () => {
  try {
    // Step 1: Load models (do this once at server startup)
    await loadModels();
    
    // Step 2: During enrollment - get face descriptor from uploaded image
    const enrollmentImage = path.join(__dirname, '../uploads/faces/new_user.jpg');
    const enrolledDescriptor = await getFaceDescriptor(enrollmentImage);
    
    // Save enrolledDescriptor to database
    console.log('✓ User enrolled with face descriptor');
    
    // Step 3: During login - get descriptor from login image
    const loginImage = path.join(__dirname, '../uploads/faces/login_attempt.jpg');
    const loginDescriptor = await getFaceDescriptor(loginImage);
    
    // Step 4: Compare with stored descriptor
    const comparison = compareFaces(enrolledDescriptor, loginDescriptor);
    
    console.log('\nAuthentication Result:');
    console.log('  Distance:', comparison.distance);
    console.log('  Match:', comparison.isMatch);
    
    if (comparison.isMatch) {
      console.log('  ✓ Authentication successful');
      // Grant access
    } else {
      console.log('  ✗ Authentication failed');
      // Deny access
    }
  } catch (error) {
    console.error('Authentication error:', error.message);
  }
};

// Run examples (uncomment to test)
// example1_LoadModels();
// example2_GetDescriptor();
// example3_CompareFaces();
// example4_CustomThreshold();
// example5_NoFaceError();
// example6_MultipleFacesError();
// example7_AuthenticationFlow();

module.exports = {
  example1_LoadModels,
  example2_GetDescriptor,
  example3_CompareFaces,
  example4_CustomThreshold,
  example5_NoFaceError,
  example6_MultipleFacesError,
  example7_AuthenticationFlow,
};
