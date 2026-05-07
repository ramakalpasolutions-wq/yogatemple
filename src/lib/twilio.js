// src/lib/twilio.js

export async function sendOTPSMS(phone, otp) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !accountSid.startsWith('AC') || !authToken || !fromPhone) {
    console.log('⚠️ Twilio not configured - SMS skipped. OTP:', otp);
    return { success: false, skipped: true };
  }

  try {
    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);
    await client.messages.create({
      body: `Your Yoga Temple OTP: ${otp}. Valid for 10 minutes. 🧘`,
      from: fromPhone,
      to: phone,
    });
    return { success: true };
  } catch (error) {
    console.error('SMS error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function sendBookingConfirmationSMS(phone, sessionTitle, dateStr) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !accountSid.startsWith('AC') || !authToken || !fromPhone) {
    console.log('⚠️ Twilio not configured - booking SMS skipped');
    return { success: false, skipped: true };
  }

  try {
    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);
    await client.messages.create({
      body: `✅ Yoga Temple: Your session "${sessionTitle}" is confirmed for ${dateStr}. Namaste! 🙏`,
      from: fromPhone,
      to: phone,
    });
    return { success: true };
  } catch (error) {
    console.error('Booking SMS error:', error.message);
    return { success: false, error: error.message };
  }
}