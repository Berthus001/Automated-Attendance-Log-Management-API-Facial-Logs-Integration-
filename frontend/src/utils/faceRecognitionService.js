import * as faceapi from '@vladmandic/face-api';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

let modelsLoaded = false;

/**
 * Load face-api.js models required for recognition.
 * Safe to call multiple times — loads only once.
 */
export const loadRecognitionModels = async () => {
  if (modelsLoaded) return;

  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);

  modelsLoaded = true;
};

/**
 * Extract a 128-dimensional face descriptor from a base64 image string.
 *
 * @param {string} base64Image - Data URL or raw base64 JPEG/PNG string
 * @returns {Promise<{success: boolean, descriptor: number[]|null, message: string}>}
 */
export const extractDescriptorFromBase64 = async (base64Image) => {
  try {
    await loadRecognitionModels();

    // Create an HTMLImageElement from the base64 data
    const img = await faceapi.fetchImage(base64Image);

    const detection = await faceapi
      .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return { success: false, descriptor: null, message: 'No face detected in the image.' };
    }

    return {
      success: true,
      descriptor: Array.from(detection.descriptor),
      confidence: detection.detection.score,
      boundingBox: {
        x: Math.round(detection.detection.box.x),
        y: Math.round(detection.detection.box.y),
        width: Math.round(detection.detection.box.width),
        height: Math.round(detection.detection.box.height),
      },
      message: 'Face descriptor extracted successfully.',
    };
  } catch (err) {
    return { success: false, descriptor: null, message: err.message };
  }
};

/**
 * Compare two face descriptors using Euclidean distance.
 *
 * @param {number[]} descriptor1
 * @param {number[]} descriptor2
 * @param {number} threshold - Match threshold (default 0.6, lower = stricter)
 * @returns {{ distance: number, isMatch: boolean }}
 */
export const compareFaceDescriptors = (descriptor1, descriptor2, threshold = 0.6) => {
  const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
  return { distance: parseFloat(distance.toFixed(4)), isMatch: distance < threshold };
};

/**
 * Find the best matching user from a list of enrolled users
 * by comparing the captured descriptor against all stored descriptors.
 *
 * @param {number[]} capturedDescriptor - Descriptor from current camera frame
 * @param {Array<{id: string, name: string, faceDescriptor: number[]}>} enrolledUsers
 * @param {number} threshold - Match threshold (default 0.6)
 * @returns {{ match: object|null, distance: number }}
 */
export const findBestMatch = (capturedDescriptor, enrolledUsers, threshold = 0.6) => {
  let bestMatch = null;
  let lowestDistance = Infinity;

  for (const user of enrolledUsers) {
    if (!user.faceDescriptor || user.faceDescriptor.length === 0) continue;

    const distance = faceapi.euclideanDistance(capturedDescriptor, user.faceDescriptor);
    if (distance < lowestDistance) {
      lowestDistance = distance;
      bestMatch = user;
      if (distance < 0.4) break; // Strong match — early exit
    }
  }

  if (lowestDistance >= threshold) {
    return { match: null, distance: lowestDistance };
  }

  return { match: bestMatch, distance: lowestDistance };
};
