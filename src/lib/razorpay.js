import Razorpay from 'razorpay';
import crypto from 'crypto';

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function createOrder(amount, currency = 'INR', receipt) {
  const options = {
    amount: amount * 100, // amount in paise
    currency,
    receipt,
    payment_capture: 1,
  };
  const order = await razorpay.orders.create(options);
  return order;
}

export function verifyPaymentSignature(orderId, paymentId, signature) {
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');
  return expectedSignature === signature;
}

export const PLANS = {
  monthly: {
    name: 'Monthly Premium',
    price: 999,
    duration: 30,
    features: [
      'Unlimited Live Classes',
      'Access to All Recorded Sessions',
      'Priority Booking',
      'Email & SMS Reminders',
      '1 Free Counseling Session',
    ],
  },
  quarterly: {
    name: 'Quarterly Premium',
    price: 2499,
    duration: 90,
    features: [
      'Everything in Monthly',
      '3 Free Counseling Sessions',
      'Exclusive Workshops',
      'Personalized Training Plan',
      'WhatsApp Support',
    ],
  },
  annual: {
    name: 'Annual Premium',
    price: 7999,
    duration: 365,
    features: [
      'Everything in Quarterly',
      'Unlimited Counseling Sessions',
      'One-on-One Training Sessions',
      'Nutrition Guidance',
      'Certificate of Completion',
      'Free Annual Health Check',
    ],
  },
};
