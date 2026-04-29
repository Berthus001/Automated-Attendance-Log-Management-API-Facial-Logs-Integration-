import React, { useState } from 'react';
import WebcamWithFaceDetection from '../components/WebcamWithFaceDetection';
import { enrollStudent } from '../services/api';
import './EnrollPage.css';

const EnrollPage = () => {
  // Form state
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    course: ''
  });
  
  // Webcam state
  const [capturedImage, setCapturedImage] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear message when user types
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  // Handle image capture from webcam
  const handleImageCapture = (image) => {
    setCapturedImage(image);
    // Clear error message when image is captured
    if (message.type === 'error' && message.text.includes('photo')) {
      setMessage({ type: '', text: '' });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation - check required fields
    if (!formData.studentId.trim()) {
      setMessage({ type: 'error', text: 'Student ID is required' });
      return;
    }
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Name is required' });
      return;
    }
    if (!formData.course.trim()) {
      setMessage({ type: 'error', text: 'Course is required' });
      return;
    }
    
    // Validation - require image before submit
    if (!capturedImage) {
      setMessage({ type: 'error', text: 'Please capture a photo' });
      return;
    }

    // Show loading state
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Prepare enrollment data
      const enrollmentData = {
        studentId: formData.studentId.trim(),
        name: formData.name.trim(),
        course: formData.course.trim(),
        image: capturedImage // Base64 JPEG string
      };

      // Send POST to /api/enroll
      const response = await enrollStudent(enrollmentData);

      if (response.success) {
        // Show success message
        setMessage({ 
          type: 'success', 
          text: `✓ Student ${response.data.studentId} enrolled successfully!` 
        });
        
        // Reset form after successful enrollment
        setFormData({
          studentId: '',
          name: '',
          course: ''
        });
        setCapturedImage(null);
      } else {
        // Show error from API response
        setMessage({ 
          type: 'error', 
          text: response.message || 'Enrollment failed' 
        });
      }
    } catch (error) {
      // Show error - network or API error
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Network error. Please try again.' 
      });
    } finally {
      // Always hide loading state
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="enroll-page">
        <div className="page-header">
          <h2>Student Enrollment</h2>
          <p>Register a new student with facial recognition</p>
        </div>

        <div className="enroll-content">
          {/* Left side - Form */}
          <div className="enroll-form-section">
            <form onSubmit={handleSubmit} className="enroll-form">
              <div className="form-group">
                <label htmlFor="studentId">Student ID *</label>
                <input
                  type="text"
                  id="studentId"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  placeholder="e.g., STU001"
                  className="form-input"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., John Doe"
                  className="form-input"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="course">Course *</label>
                <select
                  id="course"
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                  className="form-input"
                  disabled={loading}
                >
                  <option value="">-- Select a Course --</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Computer Engineering">Computer Engineering</option>
                  <option value="Business Administration">Business Administration</option>
                  <option value="Accounting">Accounting</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finance">Finance</option>
                  <option value="Nursing">Nursing</option>
                  <option value="Psychology">Psychology</option>
                  <option value="Education">Education</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Architecture">Architecture</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="English">English</option>
                  <option value="Communications">Communications</option>
                  <option value="Graphic Design">Graphic Design</option>
                  <option value="Multimedia Arts">Multimedia Arts</option>
                </select>
              </div>

              <div className="form-info">
                <p>📸 Capture your photo using the webcam on the right</p>
              </div>

              <button 
                type="submit" 
                className="btn btn-submit"
                disabled={loading}
              >
                {loading ? '⏳ Enrolling...' : '✓ Enroll Student'}
              </button>
            </form>
          </div>

          {/* Right side - Webcam */}
          <div className="enroll-webcam-section">
            <WebcamWithFaceDetection
              onCapture={handleImageCapture}
              capturedImage={capturedImage}
            />
          </div>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`message message-${message.type}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnrollPage;
