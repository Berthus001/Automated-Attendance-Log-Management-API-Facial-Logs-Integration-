import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { getKioskDescriptors, recordKioskAttendance } from '../services/api';
import './KioskScanner.css';

// Detection interval: 500ms as specified
const DETECTION_INTERVAL_MS = 500;
// Cooldown after any scan (5 seconds – prevents duplicate scans)
const COOLDOWN_SECONDS = 5;
// Face match threshold (strict: distance must be < 0.45)
const MATCH_THRESHOLD = 0.45;
// Force-reset blocked/error states quickly to prevent UI from getting stuck
const ERROR_RESET_MS = 3000;
// Guard API call so "Identifying..." cannot stay forever on network issues
const API_TIMEOUT_MS = 8000;
// CDN for face-api models
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

const KioskScanner = () => {
  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionTimerRef = useRef(null);
  const faceMatcherRef = useRef(null);
  const startDetectionRef = useRef(null);
  const isDetectingRef = useRef(false); // prevent overlapping detections

  const [status, setStatus] = useState('loading'); // loading | ready | scanning | matching | result | cooldown | error
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  // result shape: { name, role, department, scanType, timeIn, timeOut, error? }
  const [result, setResult] = useState(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [facePresent, setFacePresent] = useState(false);
  const [descriptorCount, setDescriptorCount] = useState(0);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const stopDetection = useCallback(() => {
    if (detectionTimerRef.current) {
      clearInterval(detectionTimerRef.current);
      detectionTimerRef.current = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Capture compressed JPEG frame from video
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState !== 4) return null;

    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    canvas.getContext('2d').drawImage(video, 0, 0, 320, 240);

    let quality = 0.7;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    const sizeKB = (dataUrl.length * 0.75) / 1024;
    if (sizeKB > 200 && quality > 0.4) {
      quality = 0.5;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }
    return dataUrl;
  }, []);

  // Draw face bounding box overlay
  const drawOverlay = useCallback((detections, color = '#00ff88') => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach((det) => {
      const box = det.detection ? det.detection.box : det.box;
      if (!box) return;
      const cl = 16;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;

      // Corner brackets
      const corners = [
        [[box.x, box.y + cl], [box.x, box.y], [box.x + cl, box.y]],
        [[box.x + box.width - cl, box.y], [box.x + box.width, box.y], [box.x + box.width, box.y + cl]],
        [[box.x, box.y + box.height - cl], [box.x, box.y + box.height], [box.x + cl, box.y + box.height]],
        [[box.x + box.width - cl, box.y + box.height], [box.x + box.width, box.y + box.height], [box.x + box.width, box.y + box.height - cl]],
      ];
      corners.forEach(([a, b, c]) => {
        ctx.beginPath();
        ctx.moveTo(...a);
        ctx.lineTo(...b);
        ctx.lineTo(...c);
        ctx.stroke();
      });
    });
  }, []);

  const clearOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    if (canvas) {
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const withTimeout = useCallback((promise, ms, timeoutMessage) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(timeoutMessage)), ms);
      }),
    ]);
  }, []);

  const resumeScanningAfterDelay = useCallback((faceMatcher, delayMs = ERROR_RESET_MS) => {
    setTimeout(() => {
      setResult(null);
      clearOverlay();
      if (startDetectionRef.current) {
        startDetectionRef.current(faceMatcher);
      }
    }, delayMs);
  }, [clearOverlay]);

  // ─── Cooldown timer ─────────────────────────────────────────────────────────
  const startCooldown = useCallback((resumeCallback) => {
    setStatus('cooldown');
    setCooldownLeft(COOLDOWN_SECONDS);

    let remaining = COOLDOWN_SECONDS;
    const tick = setInterval(() => {
      remaining -= 1;
      setCooldownLeft(remaining);
      if (remaining <= 0) {
        clearInterval(tick);
        setResult(null);
        resumeCallback();
      }
    }, 1000);
  }, []);

  // ─── Main detection loop ─────────────────────────────────────────────────────
  const startDetection = useCallback((faceMatcher) => {
    if (detectionTimerRef.current) return;

    setStatus('scanning');
    setFacePresent(false);

    detectionTimerRef.current = setInterval(async () => {
      // Skip if a detection is already in progress
      if (isDetectingRef.current) return;
      const video = videoRef.current;
      if (!video || video.readyState !== 4) return;

      isDetectingRef.current = true;
      try {
        // Step 1: Fast detection to check face presence
        const tinyDetections = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
        );

        const hasFace = tinyDetections.length > 0;
        setFacePresent(hasFace);

        if (!hasFace) {
          clearOverlay();
          isDetectingRef.current = false;
          return;
        }

        // Step 2: Full pipeline – extract descriptor for matching
        setStatus('matching');
        const fullDetection = await faceapi
          .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!fullDetection) {
          drawOverlay(tinyDetections);
          setStatus('scanning');
          isDetectingRef.current = false;
          return;
        }

        drawOverlay([fullDetection], '#00ff88');

        // Step 3: Compare descriptor with all enrolled users
        const match = faceMatcher.findBestMatch(fullDetection.descriptor);

        if (match.label === 'unknown' || match.distance >= MATCH_THRESHOLD) {
          // Unknown face: surface feedback then auto-resume scanning.
          stopDetection();
          drawOverlay([fullDetection], '#ff4444');
          setResult({ error: 'Unknown face. Please try again.' });
          setStatus('result');
          resumeScanningAfterDelay(faceMatcher);
          isDetectingRef.current = false;
          return;
        }

        // Step 4: Match found – stop detection loop and record attendance
        stopDetection();
        const userData = JSON.parse(match.label);

        // Role-aware gate before API call: kiosk is only for students/teachers.
        if (userData.role !== 'student' && userData.role !== 'teacher') {
          setResult({
            error: 'Access denied: Not allowed for attendance',
            name: userData.name,
            role: userData.role,
          });
          setStatus('result');
          resumeScanningAfterDelay(faceMatcher);
          isDetectingRef.current = false;
          return;
        }

        const confidenceScore = 1 - match.distance;
        const capturedImage = captureFrame();

        setStatus('matching');

        try {
          const response = await withTimeout(recordKioskAttendance({
            userId: userData._id,
            image: capturedImage,
            confidenceScore,
          }), API_TIMEOUT_MS, 'Attendance request timed out');

          setResult({
            name: response.data?.name || userData.name,
            role: response.data?.role || userData.role,
            department: response.data?.department || userData.department || '',
            scanType: response.scanType || 'time-in',
            timeIn: response.data?.timeIn ? new Date(response.data.timeIn) : new Date(),
            timeOut: response.data?.timeOut ? new Date(response.data.timeOut) : null,
          });
          setStatus('result');

          // Success path keeps normal cooldown behavior.
          startCooldown(() => {
            clearOverlay();
            startDetection(faceMatcher);
          });
        } catch (apiErr) {
          const statusCode = apiErr.response?.status;
          const errData = apiErr.response?.data;

          // Strictly reject unauthorized/non-kiosk roles (admin/superadmin).
          if (
            statusCode === 403 ||
            /admin|superadmin|not eligible|not allowed/i.test(errData?.message || '')
          ) {
            setResult({
              error: 'Access denied: Not allowed for attendance',
              name: userData.name,
              role: userData.role,
            });
            setStatus('result');
            resumeScanningAfterDelay(faceMatcher);
            isDetectingRef.current = false;
            return;
          }

          // 'completed' is a known business state; show then auto-resume.
          if (errData?.scanType === 'completed') {
            setResult({
              name: errData.data?.name || userData.name,
              role: errData.data?.role || userData.role,
              department: errData.data?.department || userData.department || '',
              scanType: 'completed',
              timeIn: errData.data?.timeIn ? new Date(errData.data.timeIn) : null,
              timeOut: errData.data?.timeOut ? new Date(errData.data.timeOut) : null,
            });
            setStatus('result');
            resumeScanningAfterDelay(faceMatcher);
            isDetectingRef.current = false;
            return;
          } else {
            const backendMessage = errData?.message || '';
            const msg = /already completed/i.test(backendMessage)
              ? 'Attendance already completed for today'
              : backendMessage || 'Failed to record attendance';
            setResult({ error: msg, name: userData.name, role: userData.role });
            setStatus('result');
            resumeScanningAfterDelay(faceMatcher);
            isDetectingRef.current = false;
            return;
          }
        }
      } catch (err) {
        console.error('Detection error:', err);
        setStatus('scanning');
      } finally {
        isDetectingRef.current = false;
      }
    }, DETECTION_INTERVAL_MS);
  }, [
    captureFrame,
    clearOverlay,
    drawOverlay,
    resumeScanningAfterDelay,
    startCooldown,
    stopDetection,
    withTimeout,
  ]);

  useEffect(() => {
    startDetectionRef.current = startDetection;
  }, [startDetection]);

  // ─── Initialization ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        // 1. Start camera
        setLoadingMessage('Starting camera...');
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        });
        if (cancelled) { mediaStream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await new Promise((resolve) => {
            videoRef.current.onloadedmetadata = resolve;
          });
        }

        // 2. Load face-api models
        setLoadingMessage('Loading face recognition models...');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        if (cancelled) return;

        // 3. Fetch enrolled descriptors from backend
        setLoadingMessage('Loading enrolled users...');
        const descriptorRes = await getKioskDescriptors();
        if (cancelled) return;

        const users = descriptorRes.data || [];
        if (users.length === 0) {
          setStatus('error');
          setLoadingMessage('No enrolled users found. Please enroll students/teachers first.');
          return;
        }

        // 4. Build FaceMatcher
        const labeled = users.map(
          (u) =>
            new faceapi.LabeledFaceDescriptors(
              JSON.stringify({ _id: u._id, name: u.name, role: u.role, department: u.department }),
              [new Float32Array(u.faceDescriptor)]
            )
        );
        faceMatcherRef.current = new faceapi.FaceMatcher(labeled, MATCH_THRESHOLD);
        setDescriptorCount(users.length);

        // 5. Start detection loop
        if (!cancelled) {
          startDetection(faceMatcherRef.current);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Kiosk init error:', err);
        let msg = 'Initialization failed.';
        if (err.name === 'NotAllowedError') msg = 'Camera access denied. Please allow camera permissions.';
        else if (err.name === 'NotFoundError') msg = 'No camera detected. Please connect a webcam.';
        else if (err.message) msg = err.message;
        setStatus('error');
        setLoadingMessage(msg);
      }
    };

    init();

    return () => {
      cancelled = true;
      stopDetection();
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const formatTime = (date) =>
    new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const roleLabel = (role) => (role ? role.charAt(0).toUpperCase() + role.slice(1) : '');

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="kiosk-scanner">
      {/* Video feed is always mounted so the stream stays alive */}
      <div className="kiosk-video-wrapper">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`kiosk-video ${status !== 'loading' && status !== 'error' ? 'visible' : ''}`}
        />
        <canvas ref={overlayCanvasRef} className="kiosk-overlay" />

        {/* Status badge over video */}
        {(status === 'scanning' || status === 'matching' || status === 'cooldown') && (
          <div className={`kiosk-badge ${status}`}>
            {status === 'scanning' && (
              <>
                <span className="badge-pulse" />
                {facePresent ? '👤 Face detected – scanning...' : '🔍 Scanning...'}
              </>
            )}
            {status === 'matching' && (
              <>
                <span className="badge-spinner" />
                Identifying...
              </>
            )}
            {status === 'cooldown' && (
              <>
                <span className="badge-pulse green" />
                Resuming in {cooldownLeft}s
              </>
            )}
          </div>
        )}

        {/* Loading overlay */}
        {status === 'loading' && (
          <div className="kiosk-loading-overlay">
            <div className="kiosk-spinner" />
            <p>{loadingMessage}</p>
          </div>
        )}

        {/* Error overlay */}
        {status === 'error' && (
          <div className="kiosk-error-overlay">
            <div className="kiosk-error-icon">⚠️</div>
            <p>{loadingMessage}</p>
          </div>
        )}
      </div>

      {/* Enrolled count indicator */}
      {descriptorCount > 0 && (
        <div className="kiosk-enrolled-count">
          {descriptorCount} enrolled user{descriptorCount !== 1 ? 's' : ''}
        </div>
      )}

      {/* Result card – shown during result + cooldown states */}
      {status === 'result' || status === 'cooldown' ? (
        <div className={`kiosk-result-card ${
          result?.error
            ? 'kiosk-result-error'
            : result?.scanType === 'completed'
            ? 'kiosk-result-completed'
            : result?.scanType === 'time-out'
            ? 'kiosk-result-timeout'
            : 'kiosk-result-timein'
        }`}>
          {result?.error ? (
            <>
              <div className="kiosk-result-icon error-icon">✗</div>
              <h3 className="kiosk-result-title">Not Recognized</h3>
              <p className="kiosk-result-msg">{result.error}</p>
            </>
          ) : result?.scanType === 'completed' ? (
            <>
              <div className="kiosk-result-icon completed-icon">⚠</div>
              <h3 className="kiosk-result-name">{result?.name}</h3>
              <div className="kiosk-result-meta">
                <span className={`kiosk-role-badge role-${result?.role}`}>{roleLabel(result?.role)}</span>
                {result?.department && <span className="kiosk-dept">{result.department}</span>}
              </div>
              <div className="kiosk-status-row completed">
                <span className="status-dot" />
                Attendance already completed for today
              </div>
              <div className="kiosk-timeinout-row">
                <div className="timeinout-item">
                  <span className="timeinout-label">Time In</span>
                  <span className="timeinout-value">{result?.timeIn ? formatTime(result.timeIn) : '—'}</span>
                </div>
                <div className="timeinout-divider" />
                <div className="timeinout-item">
                  <span className="timeinout-label">Time Out</span>
                  <span className="timeinout-value">{result?.timeOut ? formatTime(result.timeOut) : '—'}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={`kiosk-result-icon ${result?.scanType === 'time-out' ? 'timeout-icon' : 'timein-icon'}`}>
                {result?.scanType === 'time-out' ? '👋' : '👋'}
              </div>
              <h3 className="kiosk-result-name">{result?.name}</h3>
              <div className="kiosk-result-meta">
                <span className={`kiosk-role-badge role-${result?.role}`}>{roleLabel(result?.role)}</span>
                {result?.department && <span className="kiosk-dept">{result.department}</span>}
              </div>
              <div className={`kiosk-scan-type-badge ${result?.scanType === 'time-out' ? 'badge-timeout' : 'badge-timein'}`}>
                {result?.scanType === 'time-out' ? '🚪 Time Out Recorded' : '✅ Time In Recorded'}
              </div>
              <div className="kiosk-timeinout-row">
                <div className="timeinout-item">
                  <span className="timeinout-label">Time In</span>
                  <span className="timeinout-value">{result?.timeIn ? formatTime(result.timeIn) : '—'}</span>
                </div>
                {result?.scanType === 'time-out' && (
                  <>
                    <div className="timeinout-divider" />
                    <div className="timeinout-item">
                      <span className="timeinout-label">Time Out</span>
                      <span className="timeinout-value">{result?.timeOut ? formatTime(result.timeOut) : '—'}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="kiosk-timestamp">
                <div className="ts-date">{result?.timeIn ? formatDate(result.timeIn) : ''}</div>
              </div>
            </>
          )}
          {status === 'cooldown' && (
            <div className="kiosk-cooldown-bar-wrap">
              <div
                className="kiosk-cooldown-bar"
                style={{ animationDuration: `${COOLDOWN_SECONDS}s` }}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default KioskScanner;
