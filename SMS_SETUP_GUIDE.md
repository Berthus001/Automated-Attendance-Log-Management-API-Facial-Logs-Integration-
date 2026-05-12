# SMS Notification Setup Guide

This application now supports SMS notifications for attendance check-in and check-out. Follow these steps to set up SMS functionality:

## Prerequisites

1. **Twilio Account** - Create a free account at https://www.twilio.com/
2. **Phone Number** - Get a Twilio phone number for sending SMS

## Setup Steps

### 1. Get Twilio Credentials

1. Sign up or log in to [Twilio Console](https://console.twilio.com)
2. Navigate to **Account & Auth Settings**
3. Copy your:
   - **Account SID**
   - **Auth Token**
4. Go to **Phone Numbers** section and note your Twilio phone number

### 2. Update Environment Variables

Add the following to your `backend/.env` file:

```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
```

Example:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Install Dependencies

Run the following command in the `backend` directory:

```bash
npm install
```

This will install Twilio and other dependencies.

### 4. Restart the Server

Stop and restart your backend server:

```bash
npm run dev
```

## How It Works

- When a student/teacher checks **in** with facial recognition, an SMS is sent: 
  > "Hello [Name], you have successfully checked in at [Time]. Welcome!"

- When they check **out**, an SMS is sent:
  > "Hello [Name], you have successfully checked out at [Time]. See you next time!"

## Phone Number Format

- Phone numbers must contain only digits
- They're automatically formatted with country code (+1 for US)
- Example valid formats: `1234567890` or `+1234567890`

## Testing

You can test SMS functionality by:

1. Adding a student/teacher with a valid phone number
2. Checking them in via the kiosk facial recognition
3. You should receive an SMS within seconds

## Troubleshooting

| Issue | Solution |
|-------|----------|
| SMS not sending | Check console logs for errors. Verify Twilio credentials in `.env` |
| Invalid phone number error | Ensure phone number contains only digits (no special characters) |
| Twilio credentials not found | Restart the server after updating `.env` file |
| SMS costs | Check Twilio pricing - free tier includes credits for testing |

## Important Notes

- SMS is optional - the system works without it if credentials aren't configured
- Phone numbers are validated on enrollment/edit forms (numbers only)
- SMS service logs all attempts (success/failure) to the console
- Ensure your database has the `phoneNumber` field (already added to models)
