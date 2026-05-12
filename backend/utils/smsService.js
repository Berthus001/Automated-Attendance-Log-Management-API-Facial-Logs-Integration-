const axios = require('axios');

const smsService = {};

const SEMAPHORE_API_URL = 'https://api.semaphore.co/api/v4/messages';

// Send SMS via Semaphore
const sendSemaphoreSMS = async (phoneNumber, message) => {
  try {
    const apiKey = process.env.SEMAPHORE_API_KEY;

    if (!apiKey) {
      console.warn('Semaphore API key not configured. SMS notifications disabled.');
      return { success: false, message: 'SMS service not configured' };
    }

    // Validate phone number (should only contain digits)
    if (!phoneNumber || !/^\d+$/.test(phoneNumber)) {
      console.warn(`Invalid phone number: ${phoneNumber}`);
      return { success: false, message: 'Invalid phone number' };
    }

    // Format phone number with country code (Philippines +63)
    const formattedPhone = phoneNumber.startsWith('+')
      ? phoneNumber
      : phoneNumber.startsWith('0')
      ? `+63${phoneNumber.substring(1)}`
      : `+63${phoneNumber}`;

    const params = new URLSearchParams();
    params.append('apikey', apiKey);
    params.append('number', formattedPhone);
    params.append('message', message);
    params.append('sendername', 'FacePass');

    const response = await axios.post(
      SEMAPHORE_API_URL,
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (response.data && response.data.success === 1) {
      console.log(`SMS sent successfully to ${formattedPhone}`);
      return { success: true, messageId: response.data.message_id };
    } else {
      console.error('Semaphore API error:', response.data);
      return { success: false, message: response.data.message || 'Failed to send SMS' };
    }
  } catch (error) {
    console.error('Error sending SMS via Semaphore:', error.message);
    return { success: false, message: error.message };
  }
};

// Format time as "8:12 AM"
const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Format date as "May 12, 2026"
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Send SMS for time in
smsService.sendTimeInSMS = async (phoneNumber, userName, timeIn) => {
  try {
    const time = formatTime(timeIn);
    const date = formatDate(timeIn);
    const messageBody = `FacePass: ${userName} successfully timed in at ${time} on ${date}.`;

    return await sendSemaphoreSMS(phoneNumber, messageBody);
  } catch (error) {
    console.error(`Error sending time-in SMS for ${userName}:`, error.message);
    return { success: false, message: error.message };
  }
};

// Send SMS for time out
smsService.sendTimeOutSMS = async (phoneNumber, userName, timeOut) => {
  try {
    const time = formatTime(timeOut);
    const date = formatDate(timeOut);
    const messageBody = `FacePass: ${userName} successfully timed out at ${time} on ${date}.`;

    return await sendSemaphoreSMS(phoneNumber, messageBody);
  } catch (error) {
    console.error(`Error sending time-out SMS for ${userName}:`, error.message);
    return { success: false, message: error.message };
  }
};

module.exports = smsService;
