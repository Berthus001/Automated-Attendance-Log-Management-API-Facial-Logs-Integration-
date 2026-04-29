/**
 * Validate base64 image string
 * @param {string} base64String - Base64 string to validate
 * @returns {boolean} - Is valid base64 image
 */
const isValidBase64Image = (base64String) => {
  if (!base64String || typeof base64String !== 'string') {
    return false;
  }

  // Check if it's a data URI
  const dataUriRegex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;
  if (dataUriRegex.test(base64String)) {
    return true;
  }

  // Check if it's pure base64
  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
  return base64Regex.test(base64String) && base64String.length % 4 === 0;
};

/**
 * Extract MIME type from base64 data URI
 * @param {string} base64String - Base64 data URI
 * @returns {string|null} - MIME type or null
 */
const getBase64MimeType = (base64String) => {
  const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,/);
  return matches ? matches[1] : null;
};

/**
 * Get file extension from MIME type
 * @param {string} mimeType - MIME type
 * @returns {string} - File extension
 */
const getExtensionFromMimeType = (mimeType) => {
  const mimeMap = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };
  return mimeMap[mimeType] || 'jpg';
};

/**
 * Format file size to human-readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted size string
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Generate unique filename
 * @param {string} prefix - Filename prefix
 * @param {string} extension - File extension
 * @returns {string} - Unique filename
 */
const generateUniqueFilename = (prefix = 'img', extension = 'jpg') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${prefix}_${timestamp}_${random}.${extension}`;
};

module.exports = {
  isValidBase64Image,
  getBase64MimeType,
  getExtensionFromMimeType,
  formatFileSize,
  generateUniqueFilename,
};
