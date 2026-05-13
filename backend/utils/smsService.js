const axios = require('axios');

const smsService = {};

const PHILSMS_API_URL = 'https://api.philsms.com/api/v3/sms/send';

// Send SMS via PhilSMS
const sendPhilSMS = async (phoneNumber, message) => {
  try {
    const apiKey = process.env.PHILSMS_API_KEY;

    if (!apiKey) {
      console.warn('PhilSMS API key not configured. SMS notifications disabled.');
      return { success: false, message: 'SMS service not configured' };
    }

    // Validate phone number (should contain digits and optionally + or leading 0)
    if (!phoneNumber) {
      console.warn(`Invalid phone number: ${phoneNumber}`);
      return { success: false, message: 'Invalid phone number' };
    }

    // Format phone number for PhilSMS API (+63 format)
    let formattedPhone;
    if (phoneNumber.startsWith('+63')) {
      formattedPhone = phoneNumber; // Already in correct format
    } else if (phoneNumber.startsWith('63')) {
      formattedPhone = `+${phoneNumber}`;
    } else if (phoneNumber.startsWith('0')) {
      formattedPhone = `+63${phoneNumber.substring(1)}`; // Replace 0 with +63
    } else {
      formattedPhone = `+63${phoneNumber}`;
    }

    console.log(`📱 Formatting phone ${phoneNumber} -> ${formattedPhone}`);

    const senderId = process.env.PHILSMS_SENDER_ID || 'FacePass';
    const params = new URLSearchParams();
    params.append('apikey', apiKey);
    params.append('recipient', formattedPhone);
    params.append('message', message);
    params.append('sender', senderId);

    const response = await axios.post(
      PHILSMS_API_URL,
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (response.data && (response.data.success === 1 || response.data.success === true || response.data.status === 'success')) {
      console.log(`SMS sent successfully to ${formattedPhone}`);
      return { success: true, messageId: response.data.message_id || response.data.id };
    } else {
      console.error('PhilSMS API error:', response.data);
      return { success: false, message: response.data.message || 'Failed to send SMS' };
    }
  } catch (error) {
    console.error('Error sending SMS via PhilSMS:', error.message);
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

    return await sendPhilSMS(phoneNumber, messageBody);
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

    return await sendPhilSMS(phoneNumber, messageBody);
  } catch (error) {
    console.error(`Error sending time-out SMS for ${userName}:`, error.message);
    return { success: false, message: error.message };
  }
};

module.exports = smsService;
