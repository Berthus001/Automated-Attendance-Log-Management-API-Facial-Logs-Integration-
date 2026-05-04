import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';

/**
 * OptimizedWebcamCapture Component
 * 
 * Captures webcam images and automatically compresses them to under 200KB
 * - Resizes to 320x240 pixels
 * - Converts to JPEG format
 * - Uses quality compression (0.5-0.7 range)
 * - Logs size information to console
 * - Suitable for face recognition and API uploads
 */
const OptimizedWebcamCapture = ({ onCapture, capturedImage }) => {
  const webcamRef = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [imageStats, setImageStats] = useState(null);

  // Video constraints - start with higher resolution for better quality
  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user'
  };

  /**
   * Calculate the size of a base64 image in KB
   * @param {string} base64String - Base64 encoded image
   * @returns {string} Size in KB with 2 decimal places
   */
  const getBase64SizeInKB = (base64String) => {
    // Remove data:image/jpeg;base64, prefix if present
    const base64Data = base64String.split(',')[1] || base64String;
    // Calculate size: base64 length * 0.75 / 1024
    // (Each base64 character represents 6 bits, so 4 chars = 3 bytes)
    const sizeInKB = (base64Data.length * 0.75) / 1024;
    return sizeInKB.toFixed(2);
  };

  /**
   * Compress image to target size and dimensions
   * @param {string} imageSrc - Original image data URL
   * @returns {Promise<string>} Compressed image data URL
   */
  const compressImage = useCallback((imageSrc) => {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        // Create canvas with target dimensions
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set target size (optimized for face recognition)
        const targetWidth = 320;
        const targetHeight = 240;
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Draw and resize image
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Start with quality 0.7 and adjust if needed
        let quality = 0.7;
        let compressedImage = canvas.toDataURL('image/jpeg', quality);
        let sizeKB = parseFloat(getBase64SizeInKB(compressedImage));

        console.log(`🖼️ Initial compression (quality ${quality}): ${sizeKB.toFixed(2)} KB`);

        // Iteratively reduce quality if image is still too large
        while (sizeKB > 200 && quality > 0.3) {
          quality -= 0.05;
          compressedImage = canvas.toDataURL('image/jpeg', quality);
          sizeKB = parseFloat(getBase64SizeInKB(compressedImage));
          console.log(`🔄 Recompressing (quality ${quality.toFixed(2)}): ${sizeKB.toFixed(2)} KB`);
        }

        // Increase quality if we have room (for better face recognition)
        while (sizeKB < 150 && quality < 0.8) {
          quality += 0.05;
          const testImage = canvas.toDataURL('image/jpeg', quality);
          const testSize = parseFloat(getBase64SizeInKB(testImage));
          
          if (testSize <= 200) {
            compressedImage = testImage;
            sizeKB = testSize;
            console.log(`⬆️ Increasing quality (${quality.toFixed(2)}): ${sizeKB.toFixed(2)} KB`);
          } else {
            break;
          }
        }

        // Final statistics
        const finalSize = getBase64SizeInKB(compressedImage);
        console.log(`✅ Final image size: ${finalSize} KB (quality: ${quality.toFixed(2)})`);
        console.log(`📐 Dimensions: ${targetWidth}x${targetHeight}`);
        
        // Warn if still over 200KB
        if (parseFloat(finalSize) > 200) {
          console.warn(`⚠️ Image size ${finalSize} KB exceeds 200KB limit`);
        }

        // Return stats for display
        const stats = {
          finalSize: parseFloat(finalSize),
          quality: quality.toFixed(2),
          dimensions: `${targetWidth}x${targetHeight}`,
          underLimit: parseFloat(finalSize) <= 200
        };

        resolve({ image: compressedImage, stats });
      };

      img.onerror = () => {
        console.error('❌ Failed to load image for compression');
        resolve({ image: imageSrc, stats: null });
      };

      img.src = imageSrc;
    });
  }, []);

  /**
   * Capture and compress image from webcam
   */
  const handleCapture = useCallback(async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    
    if (imageSrc) {
      console.log('📸 Capturing image...');
      const originalSize = getBase64SizeInKB(imageSrc);
      console.log(`📊 Original image size: ${originalSize} KB`);
      
      // Compress the image
      const { image: compressedImage, stats } = await compressImage(imageSrc);
      
      // Calculate compression ratio
      if (stats) {
        const reduction = ((1 - stats.finalSize / parseFloat(originalSize)) * 100).toFixed(1);
        console.log(`💾 Size reduction: ${reduction}%`);
        
        setImageStats({
          ...stats,
          originalSize: parseFloat(originalSize),
          reduction
        });
      }
      
      // Pass compressed image to parent
      onCapture(compressedImage);
    }
  }, [webcamRef, onCapture, compressImage]);

  // Handle camera ready
  const handleUserMedia = () => {
    setIsCameraReady(true);
    console.log('📹 Camera ready');
  };

  // Handle camera error
  const handleUserMediaError = (error) => {
    console.error('❌ Camera error:', error);
    setIsCameraReady(false);
  };

  // Retake photo
  const handleRetake = () => {
    onCapture(null);
    setImageStats(null);
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {!capturedImage ? (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              onUserMedia={handleUserMedia}
              onUserMediaError={handleUserMediaError}
              style={styles.video}
            />
            {!isCameraReady && (
              <div style={styles.loading}>
                <p>Loading camera...</p>
              </div>
            )}
          </>
        ) : (
          <div style={styles.capturedContainer}>
            <img 
              src={capturedImage} 
              alt="Captured" 
              style={styles.capturedImage}
            />
            {imageStats && (
              <div style={styles.stats}>
                <h4 style={styles.statsTitle}>📊 Image Statistics</h4>
                <div style={styles.statsGrid}>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Original Size:</span>
                    <span style={styles.statValue}>{imageStats.originalSize.toFixed(2)} KB</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Final Size:</span>
                    <span style={{...styles.statValue, color: imageStats.underLimit ? '#28a745' : '#dc3545'}}>
                      {imageStats.finalSize.toFixed(2)} KB
                    </span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Compression:</span>
                    <span style={styles.statValue}>{imageStats.reduction}%</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Quality:</span>
                    <span style={styles.statValue}>{imageStats.quality}</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Dimensions:</span>
                    <span style={styles.statValue}>{imageStats.dimensions}</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Under 200KB:</span>
                    <span style={styles.statValue}>
                      {imageStats.underLimit ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={styles.controls}>
        {!capturedImage ? (
          <button
            onClick={handleCapture}
            disabled={!isCameraReady}
            style={{
              ...styles.button,
              ...styles.captureButton,
              ...(isCameraReady ? {} : styles.buttonDisabled)
            }}
          >
            📷 Capture Photo
          </button>
        ) : (
          <button
            onClick={handleRetake}
            style={{...styles.button, ...styles.retakeButton}}
          >
            🔄 Retake Photo
          </button>
        )}
      </div>

      {isCameraReady && !capturedImage && (
        <p style={styles.hint}>
          💡 Position your face in the frame and click Capture Photo
        </p>
      )}
    </div>
  );
};

// Inline styles for the component
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  wrapper: {
    position: 'relative',
    width: '640px',
    maxWidth: '100%',
    backgroundColor: '#000',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  video: {
    width: '100%',
    height: 'auto',
    display: 'block'
  },
  loading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: '20px',
    borderRadius: '8px'
  },
  capturedContainer: {
    width: '100%',
    backgroundColor: '#f8f9fa'
  },
  capturedImage: {
    width: '100%',
    height: 'auto',
    display: 'block'
  },
  stats: {
    padding: '15px',
    backgroundColor: '#fff',
    borderTop: '2px solid #007bff'
  },
  statsTitle: {
    margin: '0 0 10px 0',
    fontSize: '16px',
    color: '#333'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px'
  },
  statItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px'
  },
  statLabel: {
    fontWeight: '600',
    color: '#666'
  },
  statValue: {
    fontWeight: 'bold',
    color: '#333'
  },
  controls: {
    marginTop: '20px'
  },
  button: {
    padding: '12px 30px',
    fontSize: '16px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  captureButton: {
    backgroundColor: '#007bff',
    color: 'white'
  },
  retakeButton: {
    backgroundColor: '#6c757d',
    color: 'white'
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
    opacity: 0.6
  },
  hint: {
    marginTop: '15px',
    color: '#666',
    fontSize: '14px',
    textAlign: 'center'
  }
};

export default OptimizedWebcamCapture;
