require('dotenv').config(); // ← must be FIRST line
const smsService = require('./utils/smsService');

// Test SMS functionality
async function testSMS(phoneNumber) {
  console.log('🧪 Testing SMS Service');
  console.log('=' .repeat(50));

  // Test phone numbers
  const testNumbers = [
    phoneNumber || '+639524801721',  // Use provided phone number from prompt
  ];

  // Test messages
  const testMessages = [
    'FacePass: Test SMS - Time In at 8:30 AM on May 12, 2026',
    'FacePass: Test SMS - Time Out at 5:00 PM on May 12, 2026',
    'FacePass: Hello! This is a test message from FacePass system.'
  ];

  console.log('📱 Test Phone Numbers:', testNumbers);
  console.log('💬 Test Messages:', testMessages.length);
  console.log('');

  // Test time-in SMS
  console.log('📥 Testing Time-In SMS...');
  const timeInResult = await smsService.sendTimeInSMS(
    testNumbers[0],
    'Test User',
    new Date()
  );

  if (timeInResult.success) {
    console.log('✅ Time-In SMS sent successfully!');
    console.log('📨 Message ID:', timeInResult.messageId);
  } else {
    console.log('❌ Time-In SMS failed:', timeInResult.message);
  }

  // Wait a bit before next test
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test time-out SMS
  console.log('\n📤 Testing Time-Out SMS...');
  const timeOutResult = await smsService.sendTimeOutSMS(
    testNumbers[0],
    'Test User',
    new Date()
  );

  if (timeOutResult.success) {
    console.log('✅ Time-Out SMS sent successfully!');
    console.log('📨 Message ID:', timeOutResult.messageId);
  } else {
    console.log('❌ Time-Out SMS failed:', timeOutResult.message);
  }

  // Wait a bit before next test
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test custom message (direct API call)
  console.log('\n📝 Testing Custom Message...');
  const customResult = await testCustomSMS(testNumbers[0], testMessages[2]);

  if (customResult.success) {
    console.log('✅ Custom SMS sent successfully!');
    console.log('📨 Message ID:', customResult.messageId);
  } else {
    console.log('❌ Custom SMS failed:', customResult.message);
  }

  console.log('\n' + '=' .repeat(50));
  console.log('🏁 SMS Testing Complete!');
  console.log('\n💡 Tips:');
  console.log('   - Check your phone for SMS messages');
  console.log('   - SMS may take 30-60 seconds to arrive');
  console.log('   - Make sure your phone number is in the correct format');
  console.log('   - Check PhilSMS dashboard for delivery status');
}

// Direct SMS test function (using the PhilSMS-powered smsService)
async function testCustomSMS(phoneNumber, message) {
  return await smsService.sendCustomSMS(phoneNumber, message);
}

// Check SMS configuration
function checkSMSConfig() {
  console.log('🔧 SMS Configuration Check');
  console.log('=' .repeat(30));

  const apiKey = process.env.PHILSMS_API_KEY;
  const senderId = process.env.PHILSMS_SENDER_ID;

  console.log('API Key configured:', apiKey ? '✅ Yes' : '❌ No');
  console.log('Sender ID configured:', senderId ? '✅ Yes' : '⚠️ Using default sender');

  if (!apiKey) {
    console.log('\n❌ SMS service is not configured!');
    console.log('Please set PHILSMS_API_KEY in your .env file');
    return false;
  }

  console.log('\n✅ SMS service is configured and ready to test!');
  return true;
}

// Main execution
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();

  checkSMSConfig();
  console.log('');

  // Ask user to input their phone number
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('📱 Enter your phone number (e.g., 9171234567): ', (phoneNumber) => {
    if (!phoneNumber || phoneNumber.trim() === '') {
      console.log('❌ No phone number provided. Exiting...');
      rl.close();
      return;
    }

    rl.close();
    testSMS(phoneNumber.trim()).catch(console.error);
  });
}

module.exports = { testSMS, checkSMSConfig };