import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import './WebcamCapture.css';

const WebcamCapture = ({ onCapture, capturedImage }) => {
  const webcamRef = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Video constraints - higher initial resolution for better quality
  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user'
  };

  // Helper function to calculate base64 size in KB
  const getBase64SizeInKB = (base64String) => {
    // Remove data:image/jpeg;base64, prefix if present
    const base64Data = base64String.split(',')[1] || base64String;
    // Calculate size: base64 length * 0.75 / 1024
    const sizeInKB = (base64Data.length * 0.75) / 1024;
    return sizeInKB.toFixed(2);
  };

  // Optimize and compress image to under 200KB
  const compressImage = useCallback((imageSrc) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas with target dimensions (320x240)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set target size
        const targetWidth = 320;
        const targetHeight = 240;
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Draw and resize image
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Try different quality levels to get under 200KB
        let quality = 0.7;
        let compressedImage = canvas.toDataURL('image/jpeg', quality);
        let sizeKB = getBase64SizeInKB(compressedImage);

        console.log(`🖼️ Initial compression (quality ${quality}): ${sizeKB} KB`);

        // If still too large, reduce quality
        while (parseFloat(sizeKB) > 200 && quality > 0.3) {
          quality -= 0.05;
          compressedImage = canvas.toDataURL('image/jpeg', quality);
          sizeKB = getBase64SizeInKB(compressedImage);
          console.log(`🔄 Recompressing (quality ${quality.toFixed(2)}): ${sizeKB} KB`);
        }

        // Final log
        console.log(`✅ Final image size: ${sizeKB} KB (quality: ${quality.toFixed(2)})`);
        console.log(`📐 Dimensions: ${targetWidth}x${targetHeight}`);
        
        // Warn if still over 200KB
        if (parseFloat(sizeKB) > 200) {
          console.warn(`⚠️ Image size ${sizeKB} KB exceeds 200KB limit`);
        }

        resolve(compressedImage);
      };
      img.src = imageSrc;
    });
  }, []);

  // Capture and compress image from webcam
  const handleCapture = useCallback(async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      console.log('📸 Capturing image...');
      const originalSize = getBase64SizeInKB(imageSrc);
      console.log(`📊 Original image size: ${originalSize} KB`);
      
      // Compress the image
      const compressedImage = await compressImage(imageSrc);
      
      // Pass compressed image to parent
      onCapture(compressedImage);
    }
  }, [webcamRef, onCapture, compressImage]);

  // Handle camera ready
  const handleUserMedia = () => {
    setIsCameraReady(true);
  };

  // Handle camera error
  const handleUserMediaError = (error) => {
    console.error('Camera error:', error);
    setIsCameraReady(false);
  };

  // Retake photo
  const handleRetake = () => {
    onCapture(null);
  };

  return (
    <div className="webcam-container">
      <div className="webcam-wrapper">
        {!capturedImage ? (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              onUserMedia={handleUserMedia}
              onUserMediaError={handleUserMediaError}
              className="webcam-video"
            />
            {!isCameraReady && (
              <div className="camera-loading">
                <p>Loading camera...</p>
              </div>
            )}
          </>
        ) : (
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="captured-image"
          />
        )}
      </div>

      <div className="webcam-controls">
        {!capturedImage ? (
          <button
            onClick={handleCapture}
            disabled={!isCameraReady}
            className="btn btn-primary"
          >
            📷 Capture Photo
          </button>
        ) : (
          <button
            onClick={handleRetake}
            className="btn btn-secondary"
          >
            🔄 Retake Photo
          </button>
        )}
      </div>

      {isCameraReady && !capturedImage && (
        <p className="webcam-hint">
          Position your face in the frame and click Capture Photo
        </p>
      )}
    </div>
  );
};

export default WebcamCapture;
