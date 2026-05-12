# Semaphore SMS Integration for Attendance Notifications

This guide explains how to set up and use Semaphore SMS for sending attendance notifications when users perform face recognition login.

## Overview

When a student or teacher successfully scans their face:
1. Attendance is logged to the database
2. An SMS notification is sent automatically via Semaphore
3. SMS includes their name, action (timed in/out), and timestamp

**Example SMS:**
```
FacePass: Juan Dela Cruz successfully timed in at 8:12 AM on May 12, 2026.
```

## Setup Instructions

### 1. Get Semaphore API Key

1. Visit [Semaphore.co](https://semaphore.co)
2. Sign up or log in to your account
3. Go to Dashboard → Settings → API Keys
4. Copy your API key

### 2. Configure Environment Variables

In your `.env` file, add:

```env
SEMAPHORE_API_KEY=your_actual_api_key_here
```

Example:
```env
SEMAPHORE_API_KEY=2129bff8c58a093d403e85d1b942d82c
```

### 3. Ensure Student Phone Numbers

For SMS notifications to work, students must have phone numbers in the database. When enrolling a student, include their phone number:

**Enrollment example with phone number:**
```json
POST /api/enroll
{
  "studentId": "2021-00123",
  "name": "Juan Dela Cruz",
  "department": "Computer Science",
  "year": "2nd Year",
  "section": "A",
  "phoneNumber": "09171234567",
  "image": "data:image/jpeg;base64,..."
}
```

**Phone number formats supported:**
- `09171234567` (Philippines format, auto-converted to +63)
- `09171234567` with leading 0 (converted to +63917...)
- `+639171234567` (with country code, used as-is)
- Digits only

### 4. Install Dependencies

```bash
cd backend
npm install
```

This installs `axios` (used for Semaphore API calls).

## How It Works

### Face Login Flow with SMS

1. **Face Recognition**
   - Student scans their face at kiosk
   - System recognizes the student

2. **Attendance Logged**
   - Attendance record created in database
   - Status marked as 'present'

3. **SMS Sent** (Non-blocking)
   - If student has phone number on file:
     - SMS formatted: "FacePass: [Name] successfully timed in at [TIME] on [DATE]."
     - Sent via Semaphore API
     - Logged to console (success/failure)
   - If no phone number:
     - SMS skipped (attendance still logged)
   - If SMS fails:
     - Error logged
     - Attendance still recorded (SMS failures don't block attendance)

### SMS Message Formats

**Time In:**
```
FacePass: [StudentName] successfully timed in at [TIME] on [DATE].
```

**Time Out (when implemented):**
```
FacePass: [StudentName] successfully timed out at [TIME] on [DATE].
```

**Example:**
```
FacePass: Juan Dela Cruz successfully timed in at 8:12 AM on May 12, 2026.
```

## Implementation Details

### Modified Files

1. **`utils/smsService.js`** - Semaphore SMS integration
   - `sendTimeInSMS(phoneNumber, userName, timeIn)` - Send time-in notification
   - `sendTimeOutSMS(phoneNumber, userName, timeOut)` - Send time-out notification
   - Internal `sendSemaphoreSMS()` helper function
   - Time/date formatting helpers

2. **`controllers/faceLoginController.js`** - Face login with SMS
   - Imports `smsService`
   - Calls `smsService.sendTimeInSMS()` after successful attendance log
   - SMS sending is non-blocking (doesn't affect attendance response)

3. **`package.json`** - Dependencies
   - Added: `axios` for HTTP requests to Semaphore
   - Removed: `twilio` (replaced with Semaphore)

4. **`.env.example`** - Environment configuration template
   - Added: `SEMAPHORE_API_KEY` configuration

## Testing

### Test SMS Sending

1. **With curl (if SMS configured):**
```bash
curl -X POST http://localhost:5000/api/face-login \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,YOUR_BASE64_IMAGE",
    "location": "Room 301"
  }'
```

2. **Expected Response (Success):**
```json
{
  "success": true,
  "message": "Attendance logged successfully",
  "data": {
    "student": {
      "studentId": "2021-00123",
      "name": "Juan Dela Cruz",
      "course": "Computer Science"
    },
    "attendance": {
      "id": "...",
      "timestamp": "2026-05-12T08:12:00Z",
      "status": "present"
    }
  }
}
```

3. **Check logs for SMS status:**
```
SMS sent successfully to +639171234567
SMS notification sent to Juan Dela Cruz
```

## Troubleshooting

### SMS Not Sending

**Problem:** SMS notifications not appearing

**Solutions:**
1. **Check API key is set:**
   ```bash
   echo $SEMAPHORE_API_KEY  # Should not be empty
   ```

2. **Verify student phone number:**
   - Student record must have `phoneNumber` field populated
   - Check in MongoDB: `db.students.findOne({studentId: "2021-00123"})`

3. **Check server logs:**
   - Look for "SMS sent successfully" or error messages
   - SMS errors won't block attendance (logged separately)

4. **Verify API key validity:**
   - Test API key at [Semaphore.co Dashboard](https://semaphore.co/dashboard)

### Invalid Phone Number

**Problem:** "Invalid phone number" error in logs

**Solutions:**
- Ensure phone number contains only digits: `09171234567`
- Don't include spaces, dashes, or special characters
- Include country code handling (09xxxxxxxx auto-converted to +63)

### Semaphore Account Issues

- Ensure account has sufficient credits
- Check if API key is active in Semaphore dashboard
- Verify sending limit not exceeded (rate limits depend on plan)

## Rate Limits & Credits

- **Semaphore free tier:** Limited SMS per month
- **Paid plans:** Higher limits and priority support
- Each SMS sent costs 1 credit (varies by plan)

See [Semaphore Pricing](https://semaphore.co/pricing) for details.

## Error Handling

SMS failures are logged but do not:
- Block attendance recording
- Return errors to the frontend
- Interrupt the face login flow

This ensures attendance is always recorded even if SMS service fails temporarily.

## Future Enhancements

Possible improvements:
1. Add time-out SMS notifications (when time-out endpoint added)
2. Add SMS history/audit log in database
3. Add per-student SMS notification preferences
4. Add batch SMS scheduling for reports
5. Add SMS templates for customization
6. Add multiple SMS recipient support (guardians, parents)

## Support

For Semaphore API issues:
- Documentation: [Semaphore API Docs](https://semaphore.co/docs)
- Support: [Semaphore Support](https://semaphore.co/support)

For attendance system issues:
- Check application logs
- Verify MongoDB connection
- Ensure `.env` configuration is correct
