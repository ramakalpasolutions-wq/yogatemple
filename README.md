# 🧘 Yoga Temple — Full Stack Next.js Application

A complete yoga platform with live Google Meet classes, subscriptions, and admin panel.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, CSS Variables
- **Auth**: NextAuth.js (Google + Email/OTP)
- **Database**: MongoDB + Mongoose
- **Payments**: Razorpay
- **Media**: Cloudinary
- **Email**: Nodemailer (Gmail)
- **SMS**: Twilio
- **Live Classes**: Google Meet integration

## Getting Started

1. Clone the repo and install dependencies:
```bash
npm install
```

2. Copy `.env.local` and fill in your credentials.

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Pages
- `/` — Homepage
- `/about` — About & instructors
- `/classes` — All classes (filter by type, level, category)
- `/schedule` — Weekly class schedule
- `/premium` — Subscription plans (Razorpay)
- `/contact` — Contact form
- `/auth` — Sign In / Sign Up with OTP
- `/dashboard` — User dashboard & bookings
- `/admin` — Admin panel (admin role required)

## Admin Setup
To make a user admin, update their role in MongoDB:
```javascript
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

## Environment Variables
See `.env.local` for all required variables.
