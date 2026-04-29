import React, { useState } from 'react';
import WebcamCaptureNative from '../components/WebcamCaptureNative';

/**
 * Example usage of WebcamCaptureNative component
 * 
 * This demonstrates how to:
 * - Import and use the native webcam component
 * - Receive the base64 JPEG string
 * - Handle the captured image
 */
const WebcamExamplePage = () => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [base64String, setBase64String] = useState('');

  // Handle image capture - receives base64 JPEG string
  const handleCapture = (base64Image) => {
    setCapturedImage(base64Image);
    
    if (base64Image) {
      // Extract base64 string (remove data:image/jpeg;base64, prefix)
      const base64Data = base64Image.split(',')[1];
      setBase64String(base64Data);
      
      console.log('Full base64 string:', base64Image);
      console.log('Base64 data only:', base64Data);
      console.log('Image size:', base64Data.length, 'characters');
    } else {
      setBase64String('');
    }
  };

  // Example: Send to backend API
  const handleSubmit = async () => {
    if (!capturedImage) {
      alert('Please capture an image first');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/face-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: capturedImage, // Full base64 string with prefix
          deviceId: 'WEB_APP_001'
        })
      });

      const data = await response.json();
      console.log('API response:', data);
      alert('Login successful!');
    } catch (error) {
      console.error('Error:', error);
      alert('Login failed');
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Native Webcam Component Example</h1>
      
      {/* Webcam Component */}
      <WebcamCaptureNative 
        onCapture={handleCapture}
        capturedImage={capturedImage}
      />

      {/* Display base64 info */}
      {base64String && (
        <div style={{ marginTop: '20px', padding: '20px', background: '#f3f4f6', borderRadius: '8px' }}>
          <h3>Captured Image Details:</h3>
          <p><strong>Format:</strong> JPEG</p>
          <p><strong>Base64 length:</strong> {base64String.length} characters</p>
          <p><strong>Estimated size:</strong> {(base64String.length * 0.75 / 1024).toFixed(2)} KB</p>
          
          <details style={{ marginTop: '10px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              View Base64 String (click to expand)
            </summary>
            <pre style={{ 
              marginTop: '10px',
              padding: '10px', 
              background: 'white', 
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '200px',
              fontSize: '10px',
              wordBreak: 'break-all'
            }}>
              {base64String}
            </pre>
          </details>

          <button 
            onClick={handleSubmit}
            style={{
              marginTop: '15px',
              padding: '12px 24px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Submit to API
          </button>
        </div>
      )}

      {/* Usage instructions */}
      <div style={{ marginTop: '30px', padding: '20px', background: '#eff6ff', borderRadius: '8px' }}>
        <h3>How it works:</h3>
        <ol style={{ lineHeight: '1.8' }}>
          <li><strong>getUserMedia:</strong> Accesses the camera with video constraints</li>
          <li><strong>Live Video:</strong> Displays real-time camera feed in video element</li>
          <li><strong>Canvas Capture:</strong> Draws current video frame to canvas on capture</li>
          <li><strong>Base64 Conversion:</strong> Converts canvas to JPEG with 95% quality</li>
          <li><strong>Preview:</strong> Shows captured image replacing live video</li>
          <li><strong>Return String:</strong> Passes base64 string via onCapture callback</li>
        </ol>
      </div>

      {/* Code example */}
      <div style={{ marginTop: '30px', padding: '20px', background: '#1f2937', color: 'white', borderRadius: '8px' }}>
        <h3 style={{ color: 'white' }}>Usage Code:</h3>
        <pre style={{ overflow: 'auto' }}>
{`import WebcamCaptureNative from './components/WebcamCaptureNative';

const [capturedImage, setCapturedImage] = useState(null);

// Receives full base64 string: "data:image/jpeg;base64,/9j/4AAQ..."
const handleCapture = (base64Image) => {
  setCapturedImage(base64Image);
  
  // Send to backend
  fetch('/api/endpoint', {
    method: 'POST',
    body: JSON.stringify({ image: base64Image })
  });
};

<WebcamCaptureNative 
  onCapture={handleCapture}
  capturedImage={capturedImage}
/>`}
        </pre>
      </div>
    </div>
  );
};

export default WebcamExamplePage;
