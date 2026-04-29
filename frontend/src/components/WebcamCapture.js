import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import './WebcamCapture.css';

const WebcamCapture = ({ onCapture, capturedImage }) => {
  const webcamRef = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Video constraints
  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user'
  };

  // Capture image from webcam
  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
    }
  }, [webcamRef, onCapture]);

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
