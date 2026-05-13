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
      console.warn('PhilSMS API key not configured. SMS notifications disabled.');
      return { success: false, message: 'SMS service not configured' };
    }

    if (!phoneNumber) {
      console.warn(`Invalid phone number: ${phoneNumber}`);
      return { success: false, message: 'Invalid phone number' };
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log(`📱 Formatting phone ${phoneNumber} -> ${formattedPhone}`);

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
          console.log(`✅ SMS sent successfully to ${formattedPhone} via ${url}`);
          return { success: true, messageId: response.data.message_id || response.data.id };
        }

        lastError = response.data || { message: 'Unknown PhilSMS error', status: response.status };
        console.error(`PhilSMS API error at ${url}:`, lastError);

        if (response.status === 404 || response.status === 403 || response.status === 500) {
          continue;
        }

        return { success: false, message: response.data?.message || 'Failed to send SMS' };
      } catch (error) {
        const status = error.response?.status;
        lastError = error.response?.data || error.message;
        console.error(`Error sending SMS via PhilSMS at ${url}:`, lastError);

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
    console.error('Error sending SMS via PhilSMS:', error.response?.data || error.message);
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

// Send custom SMS
smsService.sendCustomSMS = async (phoneNumber, message) => {
  return await sendPhilSMS(phoneNumber, message);
};

module.exports = smsService;