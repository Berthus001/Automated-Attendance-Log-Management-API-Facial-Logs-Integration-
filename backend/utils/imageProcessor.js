const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Process and save base64 image
 * @param {string} base64String - Base64 encoded image string
 * @param {object} options - Processing options
 * @returns {Promise<object>} - Object containing file path and metadata
 */
const processBase64Image = async (base64String, options = {}) => {
  try {
    // Default options
    const {
      maxWidth = 300,
      quality = 70,
      format = 'jpeg',
      subfolder = '',
    } = options;

    // Remove data URI prefix if present
    let base64Data = base64String;
    if (base64String.includes('base64,')) {
      base64Data = base64String.split('base64,')[1];
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const filename = `img_${timestamp}_${randomString}.${format}`;

    // Determine upload path
    const uploadDir = path.join(__dirname, '..', 'uploads', subfolder);
    const filePath = path.join(uploadDir, filename);

    // Ensure upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Process image with sharp
    const processedImage = sharp(imageBuffer)
      .resize(maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality,
        progressive: true,
        mozjpeg: true,
      });

    // Get image metadata
    const metadata = await processedImage.metadata();

    // Save processed image
    await processedImage.toFile(filePath);

    // Get file stats
    const stats = await fs.stat(filePath);

    // Return relative path and metadata
    const relativePath = path.join('uploads', subfolder, filename).replace(/\\/g, '/');

    return {
      success: true,
      filePath: relativePath,
      absolutePath: filePath,
      filename,
      size: stats.size,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
    };
  } catch (error) {
    throw new Error(`Image processing failed: ${error.message}`);
  }
};

/**
 * Process and save multiple base64 images
 * @param {Array<string>} base64Images - Array of base64 encoded images
 * @param {object} options - Processing options
 * @returns {Promise<Array>} - Array of file paths and metadata
 */
const processMultipleBase64Images = async (base64Images, options = {}) => {
  try {
    const results = await Promise.all(
      base64Images.map((base64) => processBase64Image(base64, options))
    );
    return results;
  } catch (error) {
    throw new Error(`Multiple image processing failed: ${error.message}`);
  }
};

/**
 * Delete an image file
 * @param {string} filePath - Relative or absolute file path
 * @returns {Promise<boolean>} - Success status
 */
const deleteImage = async (filePath) => {
  try {
    let absolutePath = filePath;
    
    // If relative path, convert to absolute
    if (!path.isAbsolute(filePath)) {
      absolutePath = path.join(__dirname, '..', filePath);
    }

    await fs.unlink(absolutePath);
    return true;
  } catch (error) {
    throw new Error(`Image deletion failed: ${error.message}`);
  }
};

/**
 * Optimize existing image file
 * @param {string} inputPath - Path to input image
 * @param {object} options - Processing options
 * @returns {Promise<object>} - Optimized image info
 */
const optimizeImage = async (inputPath, options = {}) => {
  try {
    const { maxWidth = 300, quality = 70 } = options;

    const outputPath = inputPath.replace(/\.(jpg|jpeg|png)$/i, '_optimized.jpg');

    await sharp(inputPath)
      .resize(maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality,
        progressive: true,
        mozjpeg: true,
      })
      .toFile(outputPath);

    const stats = await fs.stat(outputPath);

    return {
      success: true,
      filePath: outputPath,
      size: stats.size,
    };
  } catch (error) {
    throw new Error(`Image optimization failed: ${error.message}`);
  }
};

module.exports = {
  processBase64Image,
  processMultipleBase64Images,
  deleteImage,
  optimizeImage,
};
