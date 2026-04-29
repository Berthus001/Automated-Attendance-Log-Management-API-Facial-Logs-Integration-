const { processBase64Image, processMultipleBase64Images } = require('../utils/imageProcessor');
const { isValidBase64Image } = require('../utils/imageHelpers');

/**
 * Upload single base64 image
 * @route   POST /api/v1/upload/image
 * @access  Public
 */
exports.uploadBase64Image = async (req, res) => {
  try {
    const { image, subfolder } = req.body;

    // Validate base64 image
    if (!image || !isValidBase64Image(image)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid base64 image',
      });
    }

    // Process and save image
    const result = await processBase64Image(image, {
      maxWidth: 300,
      quality: 70,
      format: 'jpeg',
      subfolder: subfolder || '',
    });

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Upload multiple base64 images
 * @route   POST /api/v1/upload/images
 * @access  Public
 */
exports.uploadMultipleBase64Images = async (req, res) => {
  try {
    const { images, subfolder } = req.body;

    // Validate images array
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of base64 images',
      });
    }

    // Validate each image
    const invalidImages = images.filter((img) => !isValidBase64Image(img));
    if (invalidImages.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${invalidImages.length} invalid base64 image(s) detected`,
      });
    }

    // Process and save images
    const results = await processMultipleBase64Images(images, {
      maxWidth: 300,
      quality: 70,
      format: 'jpeg',
      subfolder: subfolder || '',
    });

    res.status(201).json({
      success: true,
      message: `${results.length} image(s) uploaded successfully`,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Upload face image for attendance
 * @route   POST /api/v1/upload/face
 * @access  Public
 */
exports.uploadFaceImage = async (req, res) => {
  try {
    const { image, studentId } = req.body;

    if (!image || !isValidBase64Image(image)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid base64 face image',
      });
    }

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required',
      });
    }

    // Process and save face image in faces subfolder
    const result = await processBase64Image(image, {
      maxWidth: 300,
      quality: 70,
      format: 'jpeg',
      subfolder: 'faces',
    });

    res.status(201).json({
      success: true,
      message: 'Face image uploaded successfully',
      data: {
        ...result,
        studentId,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
