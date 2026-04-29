import React, { useState, useRef, useEffect } from 'react';
import './WebcamCaptureNative.css';

const WebcamCaptureNative = ({ onCapture, capturedImage }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  // Initialize camera on component mount
  useEffect(() => {
    startCamera();

    // Cleanup: stop camera when component unmounts
    return () => {
      stopCamera();
    };
  }, []);

  // Start camera using getUserMedia
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsReady(true);
        setError(null);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
      setIsReady(false);
    }
  };

  // Stop camera and release resources
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsReady(false);
    }
  };

  // Capture frame from video and convert to base64 JPEG
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to base64 JPEG
    const base64Image = canvas.toDataURL('image/jpeg', 0.95);

    // Return base64 string via callback
    if (onCapture) {
      onCapture(base64Image);
    }
  };

  // Retake photo (clear captured image)
  const retakePhoto = () => {
    if (onCapture) {
      onCapture(null);
    }
  };

  return (
    <div className="webcam-native-container">
      <div className="webcam-native-wrapper">
        {/* Show captured image or live video */}
        {capturedImage ? (
          <div className="captured-preview">
            <img src={capturedImage} alt="Captured" />
          </div>
        ) : (
          <div className="video-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`video-element ${isReady ? 'ready' : ''}`}
            />
            {!isReady && !error && (
              <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <p>Starting camera...</p>
              </div>
            )}
            {error && (
              <div className="error-overlay">
                <p>{error}</p>
                <button onClick={startCamera} className="btn-retry">
                  Retry
                </button>
              </div>
            )}
          </div>
        )}

        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {/* Control buttons */}
      <div className="webcam-controls">
        {capturedImage ? (
          <button onClick={retakePhoto} className="btn btn-retake">
            Retake Photo
          </button>
        ) : (
          <button 
            onClick={captureImage} 
            className="btn btn-capture"
            disabled={!isReady}
          >
            Capture Photo
          </button>
        )}
      </div>
    </div>
  );
};

export default WebcamCaptureNative;
