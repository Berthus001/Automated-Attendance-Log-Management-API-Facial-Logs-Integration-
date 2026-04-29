const express = require('express');
const router = express.Router();
const {
  uploadBase64Image,
  uploadMultipleBase64Images,
  uploadFaceImage,
} = require('../controllers/uploadController');

// Upload single base64 image
router.post('/image', uploadBase64Image);

// Upload multiple base64 images
router.post('/images', uploadMultipleBase64Images);

// Upload face image for attendance
router.post('/face', uploadFaceImage);

module.exports = router;
