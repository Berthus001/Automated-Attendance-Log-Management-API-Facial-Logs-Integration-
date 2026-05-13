const axios = require('axios');

const smsService = {};

const PHILSMS_API_URLS = [
  'https://dashboard.philsms.com/api/v3/sms/send',
];

const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return phoneNumber;

  const cleaned = phoneNumber.trim().replace(/[^0-9+]/g, '');

  if (cleaned.startsWith('+63')) {
    return cleaned.substring(1);
  }

  if (cleaned.startsWith('63')) {
    return cleaned;
  }

  if (cleaned.startsWith('0')) {
    return `63${cleaned.substring(1)}`;
  }

  return `63${cleaned}`;
};

const sendPhilSMS = async (phoneNumber, message) => {
  try {
    const apiKey = process.env.PHILSMS_API_KEY?.trim();
    const senderId = (process.env.PHILSMS_SENDER_ID || 'PhilSMS').trim();

    if (!apiKey) {
      console.warn('[SMS] PhilSMS API key not configured. SMS notifications disabled.');
      return { success: false, message: 'SMS service not configured' };
    }

    if (!phoneNumber) {
      console.warn(`[SMS] Invalid phone number: ${phoneNumber}`);
      return { success: false, message: 'Invalid phone number' };
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log(`[SMS] Phone formatted: ${phoneNumber} → ${formattedPhone}, Sender: ${senderId}`);

    const payload = {
      recipient: formattedPhone,
      sender_id: senderId,
      type: 'plain',
      message,
    };

    let lastError;
    for (const url of PHILSMS_API_URLS) {
      try {
        const response = await axios.post(url, payload, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 15000,
        });

        if (
          response.data &&
          (response.data.success === 1 ||
            response.data.success === true ||
            response.data.status === 'success')
        ) {
          console.log(`[SMS] ✓ SMS sent successfully to ${formattedPhone}, Message ID: ${response.data.message_id || response.data.id}`);
          return { success: true, messageId: response.data.message_id || response.data.id };
        }

        lastError = response.data || { message: 'Unknown PhilSMS error', status: response.status };
        console.error(`[SMS] ✗ PhilSMS API returned error:`, lastError);

        if (response.status === 404 || response.status === 403 || response.status === 500) {
          continue;
        }

        return { success: false, message: response.data?.message || 'Failed to send SMS' };
      } catch (error) {
        const status = error.response?.status;
        lastError = error.response?.data || error.message;
        console.error(`[SMS] ✗ Error calling PhilSMS API (status ${status}):`, lastError);

        if (
          status === 404 ||
          status === 403 ||
          status === 500 ||
          status === 502 ||
          status === 503
        ) {
          continue;
        }

        return { success: false, message: error.response?.data?.message || error.message };
      }
    }

    return {
      success: false,
      message: `Failed to send SMS via PhilSMS after trying ${PHILSMS_API_URLS.length} endpoints`,
    };
  } catch (error) {
    console.error('[SMS] ✗ Unexpected error in sendPhilSMS:', error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
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
    if (!phoneNumber) {
      console.warn(`[SMS] Time-in SMS skipped: No phone number for user ${userName}`);
      return { success: false, message: 'No phone number on file' };
    }

    const time = formatTime(timeIn);
    const date = formatDate(timeIn);
    const messageBody = `FacePass: ${userName} successfully timed in at ${time} on ${date}.`;

    console.log(`[SMS] Attempting to send time-in SMS to ${phoneNumber} for ${userName}`);
    const result = await sendPhilSMS(phoneNumber, messageBody);
    
    if (!result.success) {
      console.warn(`[SMS] Time-in SMS failed for ${userName}:`, result.message);
    }
    
    return result;
  } catch (error) {
    console.error(`[SMS] Error sending time-in SMS for ${userName}:`, error.message);
    return { success: false, message: error.message };
  }
};

// Send SMS for time out
smsService.sendTimeOutSMS = async (phoneNumber, userName, timeOut) => {
  try {
    if (!phoneNumber) {
      console.warn(`[SMS] Time-out SMS skipped: No phone number for user ${userName}`);
      return { success: false, message: 'No phone number on file' };
    }

    const time = formatTime(timeOut);
    const date = formatDate(timeOut);
    const messageBody = `FacePass: ${userName} successfully timed out at ${time} on ${date}.`;

    console.log(`[SMS] Attempting to send time-out SMS to ${phoneNumber} for ${userName}`);
    const result = await sendPhilSMS(phoneNumber, messageBody);
    
    if (!result.success) {
      console.warn(`[SMS] Time-out SMS failed for ${userName}:`, result.message);
    }
    
    return result;
  } catch (error) {
    console.error(`[SMS] Error sending time-out SMS for ${userName}:`, error.message);
    return { success: false, message: error.message };
  }
};

// Send custom SMS
smsService.sendCustomSMS = async (phoneNumber, message) => {
  return await sendPhilSMS(phoneNumber, message);
};

// Check SMS service status
smsService.getStatus = () => {
  const hasApiKey = !!process.env.PHILSMS_API_KEY?.trim();
  const senderId = process.env.PHILSMS_SENDER_ID || 'PhilSMS';
  
  return {
    configured: hasApiKey,
    apiKeyPresent: hasApiKey ? '✓' : '✗',
    senderId: senderId,
    message: hasApiKey ? 'SMS service is ready' : 'SMS service is NOT configured - set PHILSMS_API_KEY in .env'
  };
};

module.exports = smsService;