import React, { useState } from 'react';
import OptimizedWebcamCapture from '../components/OptimizedWebcamCapture';
import './OptimizedWebcamExample.css';

/**
 * Example page demonstrating the OptimizedWebcamCapture component
 * Shows how to use the optimized webcam with <200KB compression
 */
const OptimizedWebcamExample = () => {
  const [capturedImage, setCapturedImage] = useState(null);

  const handleCapture = (imageData) => {
    setCapturedImage(imageData);
    
    if (imageData) {
      console.log('📦 Image captured and ready to use!');
      console.log('🔗 You can now send this to your API for face recognition');
      
      // Example: How to send to an API
      // sendToAPI(imageData);
    }
  };

  // Example function showing how to send the compressed image to an API
  const sendToAPI = async () => {
    if (!capturedImage) return;

    try {
      console.log('🚀 Sending image to API...');
      
      const response = await fetch('http://localhost:5000/api/face/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: capturedImage // Already compressed to <200KB
        })
      });

      const result = await response.json();
      console.log('✅ API Response:', result);
      alert('Image sent successfully! Check console for response.');
    } catch (error) {
      console.error('❌ API Error:', error);
      alert('Failed to send image. Check console for details.');
    }
  };

  return (
    <div className="optimized-webcam-example">
      <div className="example-header">
        <h1>📸 Optimized Webcam Capture Demo</h1>
        <p>Automatically compresses images to under 200KB for efficient uploads</p>
      </div>

      <div className="features-info">
        <h3>✨ Features:</h3>
        <ul>
          <li>✅ Resizes to 320x240 pixels (optimal for face recognition)</li>
          <li>✅ JPEG compression with quality 0.5-0.7</li>
          <li>✅ Automatically adjusts quality to stay under 200KB</li>
          <li>✅ Shows detailed compression statistics</li>
          <li>✅ Console logging for debugging</li>
        </ul>
      </div>

      <div className="webcam-section">
        <OptimizedWebcamCapture
          onCapture={handleCapture}
          capturedImage={capturedImage}
        />
      </div>

      {capturedImage && (
        <div className="action-section">
          <h3>🎯 Next Steps:</h3>
          <div className="action-buttons">
            <button onClick={sendToAPI} className="btn-send-api">
              📤 Send to API (Example)
            </button>
            <button 
              onClick={() => {
                const link = document.createElement('a');
                link.href = capturedImage;
                link.download = 'compressed-image.jpg';
                link.click();
              }}
              className="btn-download"
            >
              💾 Download Image
            </button>
          </div>
          
          <div className="code-example">
            <h4>📝 How to use in your code:</h4>
            <pre>
{`// 1. Import the component
import OptimizedWebcamCapture from './components/OptimizedWebcamCapture';

// 2. Use in your component
const [capturedImage, setCapturedImage] = useState(null);

// 3. Handle the captured image
const handleCapture = (imageData) => {
  setCapturedImage(imageData);
  // imageData is now compressed to <200KB
  // Send to API or use for face recognition
};

// 4. Render the component
<OptimizedWebcamCapture
  onCapture={handleCapture}
  capturedImage={capturedImage}
/>`}
            </pre>
          </div>
        </div>
      )}

      <div className="technical-details">
        <h3>🔧 Technical Details:</h3>
        <div className="details-grid">
          <div className="detail-card">
            <h4>Original Video</h4>
            <p>640x480 resolution</p>
            <p>High quality capture</p>
          </div>
          <div className="detail-card">
            <h4>Compression</h4>
            <p>Canvas resizing</p>
            <p>JPEG quality adjustment</p>
          </div>
          <div className="detail-card">
            <h4>Final Output</h4>
            <p>320x240 pixels</p>
            <p>&lt;200KB file size</p>
          </div>
          <div className="detail-card">
            <h4>Use Case</h4>
            <p>Face recognition APIs</p>
            <p>Fast uploads</p>
          </div>
        </div>
      </div>

      <div className="console-info">
        <h4>📊 Check Browser Console</h4>
        <p>Open your browser's developer console (F12) to see detailed compression logs:</p>
        <ul>
          <li>Original image size</li>
          <li>Compression iterations</li>
          <li>Final size and quality</li>
          <li>Compression percentage</li>
        </ul>
      </div>
    </div>
  );
};

export default OptimizedWebcamExample;
