import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';
import './WebcamWithFaceDetection.css';

const WebcamWithFaceDetection = ({ onCapture, capturedImage, autoCapture = false }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const streamRef = useRef(null);
  
  // Separate state management
  const [stream, setStream] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [modelError, setModelError] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [detectionCount, setDetectionCount] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const hasInitializedRef = useRef(false);
  const stableFaceCountRef = useRef(0);
  const autoCaptureRef = useRef(autoCapture);
  const capturedImageRef = useRef(capturedImage);
  const onCaptureRef = useRef(onCapture);
  const [autoProgress, setAutoProgress] = useState(0);
  const AUTO_CAPTURE_THRESHOLD = 20; // 2 seconds at 100ms interval

  // Stop camera and release resources - use ref to access stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      streamRef.current = null;
      setIsCameraReady(false);
    }
  }, [stream]);

  // Stop face detection
  const stopDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  }, []);

  // Main initialization flow
  const initializeComponent = useCallback(async () => {
    setIsInitializing(true);
    setCameraError(null);
    setModelError(null);

    // Step 1: Check if camera devices are available
    const hasCamera = await checkCameraAvailability();
    if (!hasCamera) {
      setIsInitializing(false);
      return;
    }

    // Step 2: Start camera
    const cameraStarted = await startCamera();
    if (!cameraStarted) {
      setIsInitializing(false);
      return;
    }

    // Step 3: Load face detection models (only if camera works)
    await loadModels();
    setIsInitializing(false);
  }, []);

  // Initialize on component mount: Camera first, then models (ONLY ONCE)
  useEffect(() => {
    // Prevent re-initialization
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    initializeComponent();

    // Cleanup on unmount - use refs to avoid stale closure issues
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      // Stop camera tracks using ref
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array - run ONLY on mount

  // Sync prop refs so interval callbacks read latest values without re-creating
  useEffect(() => { autoCaptureRef.current = autoCapture; }, [autoCapture]);
  useEffect(() => { capturedImageRef.current = capturedImage; }, [capturedImage]);
  useEffect(() => { onCaptureRef.current = onCapture; }, [onCapture]);

  // Reset auto-capture progress when capturedImage is cleared (new scan cycle)
  useEffect(() => {
    if (!capturedImage) {
      stableFaceCountRef.current = 0;
      setAutoProgress(0);
    }
  }, [capturedImage]);

  // Step 1: Check for available video input devices
  const checkCameraAvailability = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera not supported in this browser. Please use Chrome, Firefox, or Edge.');
        return false;
      }

      // Enumerate devices to check for video input
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      console.log('Available video devices:', videoDevices);

      // If we can enumerate and found no devices, camera doesn't exist
      if (videoDevices.length === 0) {
        setCameraError('No camera detected. Please connect a webcam to use this application.');
        return false;
      }

      console.log(`Found ${videoDevices.length} camera(s)`);
      return true;
    } catch (err) {
      console.error('Error checking camera availability:', err);
      // If we can't enumerate, continue to getUserMedia which will give proper error
      console.warn('Cannot enumerate devices, will attempt getUserMedia');
      return true;
    }
  };

  // Step 2: Start camera with proper error handling
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
        streamRef.current = mediaStream; // Store in ref for cleanup
        setCameraError(null);
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Camera ready');
          setIsCameraReady(true);
        };

        return true;
      }
      return false;
    } catch (err) {
      console.error('Camera access error:', err);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      
      // Map getUserMedia errors to user-friendly messages
      const errorName = err.name || '';
      const errorMessage = (err.message || '').toLowerCase();
      
      // NotFoundError - No camera hardware detected
      if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError' ||
          errorMessage.includes('requested device not found') ||
          errorMessage.includes('no device found')) {
        setCameraError('No camera detected. Please connect a webcam to use this application.');
      }
      // NotAllowedError - User denied camera permission
      else if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError' ||
               errorMessage.includes('permission denied') ||
               errorMessage.includes('not allowed')) {
        setCameraError('Camera access denied. Please allow camera permissions in your browser settings.');
      }
      // NotReadableError - Camera is in use by another application
      else if (errorName === 'NotReadableError' || errorName === 'TrackStartError' ||
               errorMessage.includes('not readable') ||
               errorMessage.includes('already in use') ||
               errorMessage.includes('could not start')) {
        setCameraError('Camera is already in use by another application. Please close other apps using your camera.');
      }
      // OverconstrainedError - Camera doesn't support requested constraints
      else if (errorName === 'OverconstrainedError' || errorName === 'ConstraintNotSatisfiedError') {
        setCameraError('Camera does not meet requirements. Try a different camera.');
      }
      // TypeError - Browser doesn't support getUserMedia
      else if (errorName === 'TypeError') {
        setCameraError('Camera not supported in this browser. Please use Chrome, Firefox, or Edge.');
      }
      // AbortError - Generic failure
      else if (errorName === 'AbortError') {
        setCameraError('Camera access was aborted. Please try again.');
      }
      // Unknown error
      else {
        setCameraError(`Unable to access camera: ${err.message || 'Unknown error'}`);
      }
      
      setIsCameraReady(false);
      return false;
    }
  };

  // Step 3: Load face-api models from CDN (only called if camera works)
  const loadModels = async () => {
    try {
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
      
      console.log('Loading face-api.js models...');
      
      // Load all models needed for detection and recognition
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),       // Fast real-time detection
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),          // Accurate detection
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),       // Face landmarks
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),      // Face recognition descriptors
      ]);
      
      console.log('Face-api.js models loaded successfully (detection + recognition)');
      setIsModelLoaded(true);
      setModelError(null);
    } catch (err) {
      console.error('Error loading face-api models:', err);
      setModelError('Failed to load face detection models. Check your internet connection.');
      setIsModelLoaded(false);
    }
  };

  // Capture frame from video, compress, and convert to base64 JPEG
  // Defined as stable useCallback (uses only refs) so detectFaces can call it safely
  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    console.log('📸 Capturing image from webcam...');

    const video = videoRef.current;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    // First, capture full resolution to temp canvas
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

    // Get original size
    const originalImage = tempCanvas.toDataURL('image/jpeg', 0.95);
    const originalSize = getBase64SizeInKB(originalImage);
    console.log(`📊 Original image size: ${originalSize} KB (${tempCanvas.width}x${tempCanvas.height})`);

    // Create optimized canvas with target dimensions (320x240)
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const targetWidth = 320;
    const targetHeight = 240;
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Draw and resize image to target dimensions
    context.drawImage(video, 0, 0, targetWidth, targetHeight);

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

    console.log(`✅ Final image size: ${sizeKB} KB (quality: ${quality.toFixed(2)})`);
    console.log(`📐 Final dimensions: ${targetWidth}x${targetHeight}`);
    console.log(`💾 Size reduction: ${((1 - parseFloat(sizeKB) / parseFloat(originalSize)) * 100).toFixed(1)}%`);
    
    if (parseFloat(sizeKB) > 200) {
      console.warn(`⚠️ Image size ${sizeKB} KB exceeds 200KB limit`);
    }

    if (onCaptureRef.current) {
      onCaptureRef.current(compressedImage);
    }
  }, []); // stable - only uses refs

  // Detect faces in real-time and draw bounding boxes
  const detectFaces = useCallback(async () => {
    if (!videoRef.current || !overlayCanvasRef.current || !isModelLoaded) return;

    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;

    // Skip if video not ready
    if (video.readyState !== 4) return;

    try {
      // Detect faces using TinyFaceDetector (faster for real-time)
      const detections = await faceapi.detectAllFaces(
        video,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.5
        })
      );

      // Update face detection state
      const hasFace = detections.length > 0;
      setFaceDetected(hasFace);
      setDetectionCount(detections.length);

      // Clear canvas
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Match canvas size to video
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      // Draw bounding boxes for each detected face
      detections.forEach((detection) => {
        const box = detection.box;
        
        // Draw bounding box
        ctx.strokeStyle = hasFace ? '#00ff00' : '#ff0000'; // Green if face, red otherwise
        ctx.lineWidth = 3;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Draw corner brackets for better visual
        const cornerLength = 20;
        ctx.lineWidth = 4;
        
        // Top-left corner
        ctx.beginPath();
        ctx.moveTo(box.x, box.y + cornerLength);
        ctx.lineTo(box.x, box.y);
        ctx.lineTo(box.x + cornerLength, box.y);
        ctx.stroke();
        
        // Top-right corner
        ctx.beginPath();
        ctx.moveTo(box.x + box.width - cornerLength, box.y);
        ctx.lineTo(box.x + box.width, box.y);
        ctx.lineTo(box.x + box.width, box.y + cornerLength);
        ctx.stroke();
        
        // Bottom-left corner
        ctx.beginPath();
        ctx.moveTo(box.x, box.y + box.height - cornerLength);
        ctx.lineTo(box.x, box.y + box.height);
        ctx.lineTo(box.x + cornerLength, box.y + box.height);
        ctx.stroke();
        
        // Bottom-right corner
        ctx.beginPath();
        ctx.moveTo(box.x + box.width - cornerLength, box.y + box.height);
        ctx.lineTo(box.x + box.width, box.y + box.height);
        ctx.lineTo(box.x + box.width, box.y + box.height - cornerLength);
        ctx.stroke();

        // Draw detection confidence
        const confidence = (detection.score * 100).toFixed(0);
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`${confidence}%`, box.x + 5, box.y - 5);
      });

      // Show message if no face detected
      if (detections.length === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(10, 10, 200, 40);
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('No face detected', 20, 35);
      }

      // Auto-capture: trigger after face is stably detected for AUTO_CAPTURE_THRESHOLD frames
      if (autoCaptureRef.current && !capturedImageRef.current) {
        if (hasFace) {
          stableFaceCountRef.current += 1;
          const progress = Math.min(
            (stableFaceCountRef.current / AUTO_CAPTURE_THRESHOLD) * 100,
            100
          );
          setAutoProgress(progress);
          if (stableFaceCountRef.current >= AUTO_CAPTURE_THRESHOLD) {
            stableFaceCountRef.current = 0;
            setAutoProgress(0);
            captureImage();
          }
        } else {
          if (stableFaceCountRef.current !== 0) {
            stableFaceCountRef.current = 0;
            setAutoProgress(0);
          }
        }
      }

    } catch (err) {
      console.error('Face detection error:', err);
    }
  }, [isModelLoaded, captureImage]);

  // Start real-time face detection
  const startDetection = useCallback(() => {
    if (detectionIntervalRef.current) return;

    console.log('Starting face detection...');
    
    detectionIntervalRef.current = setInterval(async () => {
      await detectFaces();
    }, 100); // Detect every 100ms
  }, [detectFaces]);

  // Start detection when both camera and models are ready
  useEffect(() => {
    if (isCameraReady && isModelLoaded && videoRef.current && !capturedImage) {
      startDetection();
    } else {
      stopDetection();
    }
  }, [isCameraReady, isModelLoaded, capturedImage, startDetection, stopDetection]);

  // Helper function to calculate base64 size in KB
  const getBase64SizeInKB = (base64String) => {
    // Remove data:image/jpeg;base64, prefix if present
    const base64Data = base64String.split(',')[1] || base64String;
    // Calculate size: base64 length * 0.75 / 1024
    const sizeInKB = (base64Data.length * 0.75) / 1024;
    return sizeInKB.toFixed(2);
  };

  // Retake photo (clear captured image)
  const retakePhoto = () => {
    if (onCapture) {
      onCapture(null);
    }
  };

  // Retry initialization
  const handleRetry = () => {
    stopDetection();
    stopCamera();
    setFaceDetected(false);
    setDetectionCount(0);
    initializeComponent();
  };

  return (
    <div className="webcam-face-container">
      <div className="webcam-face-wrapper">
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
              className={`video-element ${isCameraReady ? 'ready' : ''}`}
            />
            
            {/* Overlay canvas for bounding boxes */}
            <canvas
              ref={overlayCanvasRef}
              className="overlay-canvas"
            />

            {/* Loading/Initializing overlay */}
            {isInitializing && !cameraError && (
              <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <p>
                  {!isCameraReady && 'Checking camera...'}
                  {isCameraReady && !isModelLoaded && 'Loading face detection...'}
                </p>
              </div>
            )}

            {/* Camera Error overlay - shows specific camera issues */}
            {cameraError && (
              <div className="error-overlay camera-error">
                <div className="error-icon">
                  {cameraError.includes('No camera detected') ? '🚫' : 
                   cameraError.includes('already in use') ? '⚠️' :
                   cameraError.includes('access denied') ? '🔒' : '📷'}
                </div>
                <h3>
                  {cameraError.includes('No camera detected') ? 'Camera Required' : 
                   cameraError.includes('already in use') ? 'Camera Unavailable' :
                   cameraError.includes('access denied') ? 'Permission Required' : 'Camera Error'}
                </h3>
                <p>{cameraError}</p>
                
                {/* Different instructions based on error type */}
                {cameraError.includes('No camera detected') ? (
                  <div style={{ marginTop: '15px', fontSize: '13px', opacity: 0.9 }}>
                    <p style={{ margin: '5px 0' }}>💡 This application requires a webcam</p>
                    <p style={{ margin: '5px 0' }}>• Connect a camera to your device</p>
                    <p style={{ margin: '5px 0' }}>• Refresh this page after connecting</p>
                  </div>
                ) : cameraError.includes('already in use') ? (
                  <div style={{ marginTop: '15px', fontSize: '13px', opacity: 0.9 }}>
                    <p style={{ margin: '8px 0', fontWeight: '500' }}>Your camera is being used by:</p>
                    <p style={{ margin: '5px 0' }}>• Another browser tab or window</p>
                    <p style={{ margin: '5px 0' }}>• Another application (Zoom, Teams, etc.)</p>
                    <p style={{ margin: '5px 0' }}>• Camera settings or testing apps</p>
                    <div style={{ marginTop: '12px' }}>
                      <button onClick={handleRetry} className="btn-retry">
                        I've Closed Other Apps - Retry
                      </button>
                    </div>
                  </div>
                ) : cameraError.includes('access denied') ? (
                  <div style={{ marginTop: '15px', fontSize: '13px', opacity: 0.9 }}>
                    <p style={{ margin: '8px 0', fontWeight: '500' }}>How to enable camera:</p>
                    <p style={{ margin: '5px 0' }}>1. Click the 🔒 or 🎥 icon in your browser's address bar</p>
                    <p style={{ margin: '5px 0' }}>2. Select "Allow" for camera permissions</p>
                    <p style={{ margin: '5px 0' }}>3. Refresh this page</p>
                    <div style={{ marginTop: '12px' }}>
                      <button onClick={handleRetry} className="btn-retry">
                        I've Allowed Camera - Retry
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={handleRetry} className="btn-retry">
                    Retry Camera Access
                  </button>
                )}
              </div>
            )}

            {/* Model Error overlay - shows model loading issues */}
            {!cameraError && modelError && (
              <div className="error-overlay model-error">
                <div className="error-icon">⚠️</div>
                <h3>Face Detection Error</h3>
                <p>{modelError}</p>
                <button onClick={handleRetry} className="btn-retry">
                  Retry Loading
                </button>
              </div>
            )}

            {/* Face detection status - only show when everything is ready */}
            {isCameraReady && isModelLoaded && !cameraError && !modelError && (
              <div className={`detection-status ${faceDetected ? 'detected' : 'not-detected'}`}>
                <span className="status-icon">
                  {faceDetected ? '✓' : '✗'}
                </span>
                <span className="status-text">
                  {faceDetected 
                    ? `Face detected (${detectionCount})` 
                    : 'Position your face in frame'}
                </span>
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
          !autoCapture && (
            <button onClick={retakePhoto} className="btn btn-retake">
              Retake Photo
            </button>
          )
        ) : autoCapture ? (
          <div className="auto-capture-status">
            {isCameraReady && isModelLoaded && !cameraError && !modelError ? (
              faceDetected ? (
                <div className="auto-capture-progress">
                  <p className="auto-capture-label">Hold still... scanning</p>
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${autoProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="auto-capture-waiting">👤 Position your face in the frame</p>
              )
            ) : null}
          </div>
        ) : (
          <button 
            onClick={captureImage} 
            className="btn btn-capture"
            disabled={!isCameraReady || !faceDetected}
            title={!faceDetected ? 'Position your face in the frame to capture' : ''}
          >
            {!faceDetected ? '⚠️ No Face Detected' : '📸 Capture Photo'}
          </button>
        )}
      </div>
    </div>
  );
};

export default WebcamWithFaceDetection;
