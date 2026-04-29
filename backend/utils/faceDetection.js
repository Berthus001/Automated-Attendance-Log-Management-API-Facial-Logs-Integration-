// Use WebAssembly version of face-api to avoid tfjs-node dependency
// This version doesn't require Visual Studio Build Tools or native compilation
const tf = require('@tensorflow/tfjs');
const faceapi = require('@vladmandic/face-api/dist/face-api.node-wasm.js');

const canvas = require('canvas');
const path = require('path');
const fs = require('fs').promises;

// Configure canvas for face-api
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Model loading state
let modelsLoaded = false;

/**
 * Load face-api models
 */
const loadModels = async () => {
  if (modelsLoaded) return;

  try {
    const modelPath = path.join(__dirname, '..', 'models', 'face-api');
    
    // Check if models directory exists
    try {
      await fs.access(modelPath);
    } catch (error) {
      throw new Error(
        'Face recognition models not found. Please download models from: ' +
        'https://github.com/vladmandic/face-api/tree/master/model'
      );
    }

    // Initialize TensorFlow.js WASM backend before loading models
    await tf.ready();

    // Load required models
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath),
      faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath),
      faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath),
    ]);

    modelsLoaded = true;
    console.log('Face recognition models loaded successfully');
  } catch (error) {
    throw new Error(`Failed to load face recognition models: ${error.message}`);
  }
};

/**
 * Extract face descriptor from image file
 * @param {string} imagePath - Path to image file
 * @param {object} options - Detection options
 * @returns {Promise<object>} - Face detection result
 */
const extractFaceDescriptor = async (imagePath, options = {}) => {
  try {
    // Ensure models are loaded
    await loadModels();

    // Load image
    const img = await canvas.loadImage(imagePath);

    // Detect faces with landmarks and descriptors
    const detections = await faceapi
      .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    // Validate face count
    if (detections.length === 0) {
      return {
        success: false,
        error: 'NO_FACE_DETECTED',
        message: 'No face detected in the image',
        faceCount: 0,
      };
    }

    if (detections.length > 1) {
      return {
        success: false,
        error: 'MULTIPLE_FACES_DETECTED',
        message: `Multiple faces detected (${detections.length}). Please provide an image with a single face.`,
        faceCount: detections.length,
      };
    }

    // Extract descriptor from the single detected face
    const detection = detections[0];
    const descriptor = Array.from(detection.descriptor);

    // Get face bounding box
    const box = detection.detection.box;

    return {
      success: true,
      faceCount: 1,
      descriptor,
      confidence: detection.detection.score,
      boundingBox: {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
      },
      landmarks: detection.landmarks ? detection.landmarks.positions.length : 0,
    };
  } catch (error) {
    throw new Error(`Face extraction failed: ${error.message}`);
  }
};

/**
 * Extract face descriptor from base64 image
 * @param {string} base64Image - Base64 encoded image
 * @returns {Promise<object>} - Face detection result
 */
const extractFaceDescriptorFromBase64 = async (base64Image) => {
  try {
    // Ensure models are loaded
    await loadModels();

    // Remove data URI prefix if present
    let base64Data = base64Image;
    if (base64Image.includes('base64,')) {
      base64Data = base64Image.split('base64,')[1];
    }

    // Convert base64 to buffer and load as image
    const buffer = Buffer.from(base64Data, 'base64');
    const img = await canvas.loadImage(buffer);

    // Detect faces
    const detections = await faceapi
      .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    // Validate face count
    if (detections.length === 0) {
      return {
        success: false,
        error: 'NO_FACE_DETECTED',
        message: 'No face detected in the image',
        faceCount: 0,
      };
    }

    if (detections.length > 1) {
      return {
        success: false,
        error: 'MULTIPLE_FACES_DETECTED',
        message: `Multiple faces detected (${detections.length}). Please provide an image with a single face.`,
        faceCount: detections.length,
      };
    }

    // Extract descriptor
    const detection = detections[0];
    const descriptor = Array.from(detection.descriptor);
    const box = detection.detection.box;

    return {
      success: true,
      faceCount: 1,
      descriptor,
      confidence: detection.detection.score,
      boundingBox: {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
      },
    };
  } catch (error) {
    throw new Error(`Face extraction from base64 failed: ${error.message}`);
  }
};

/**
 * Compare two face descriptors
 * @param {Array<number>} descriptor1 - First face descriptor
 * @param {Array<number>} descriptor2 - Second face descriptor
 * @returns {number} - Euclidean distance (lower = more similar)
 */
const compareFaceDescriptors = (descriptor1, descriptor2) => {
  if (descriptor1.length !== descriptor2.length) {
    throw new Error('Descriptors must have the same length');
  }

  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    sum += Math.pow(descriptor1[i] - descriptor2[i], 2);
  }

  return Math.sqrt(sum);
};

/**
 * Check if two faces match (distance below threshold)
 * @param {Array<number>} descriptor1 - First face descriptor
 * @param {Array<number>} descriptor2 - Second face descriptor
 * @param {number} threshold - Match threshold (default: 0.6)
 * @returns {boolean} - True if faces match
 */
const isFaceMatch = (descriptor1, descriptor2, threshold = 0.6) => {
  const distance = compareFaceDescriptors(descriptor1, descriptor2);
  return distance < threshold;
};

/**
 * Get face descriptor from image (throws error on invalid input)
 * @param {string} imagePath - Path to image file
 * @returns {Promise<Array<number>>} - Face descriptor array
 * @throws {Error} - If no face or multiple faces detected
 */
const getFaceDescriptor = async (imagePath) => {
  const result = await extractFaceDescriptor(imagePath);

  if (!result.success) {
    if (result.error === 'NO_FACE_DETECTED') {
      throw new Error('No face detected in the image');
    }
    if (result.error === 'MULTIPLE_FACES_DETECTED') {
      throw new Error(`Multiple faces detected (${result.faceCount}). Only one face allowed`);
    }
    throw new Error(result.message || 'Face detection failed');
  }

  return result.descriptor;
};

/**
 * Compare two face descriptors with Euclidean distance
 * @param {Array<number>} desc1 - First face descriptor
 * @param {Array<number>} desc2 - Second face descriptor
 * @param {number} threshold - Match threshold (default: 0.6)
 * @returns {object} - { distance: number, isMatch: boolean }
 */
const compareFaces = (desc1, desc2, threshold = 0.6) => {
  if (!desc1 || !desc2) {
    throw new Error('Both descriptors are required');
  }

  if (!Array.isArray(desc1) || !Array.isArray(desc2)) {
    throw new Error('Descriptors must be arrays');
  }

  if (desc1.length !== desc2.length) {
    throw new Error('Descriptors must have the same length');
  }

  // Calculate Euclidean distance
  const distance = compareFaceDescriptors(desc1, desc2);
  const isMatch = distance < threshold;

  return {
    distance: parseFloat(distance.toFixed(4)),
    isMatch,
  };
};

module.exports = {
  loadModels,
  extractFaceDescriptor,
  extractFaceDescriptorFromBase64,
  compareFaceDescriptors,
  isFaceMatch,
  getFaceDescriptor,
  compareFaces,
};
