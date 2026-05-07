// src/lib/classEmailTemplates.js

function milestoneLabel(m) {
  if (m === 30) return '30 minutes';
  if (m === 15) return '15 minutes';
  if (m === 5)  return '5 minutes';
  return '15 minutes';
}

function milestoneEmoji(m) {
  if (m === 30) return '🔔';
  if (m === 15) return '⏰';
  if (m === 5)  return '🚨';
  return '⏰';
}

function milestoneColor(m) {
  if (m === 30) return '#3b82f6';
  if (m === 15) return '#f59e0b';
  if (m === 5)  return '#ef4444';
  return '#2ea065';
}

/* ═══════════════════════════════════════════
   USER REMINDER EMAIL
═══════════════════════════════════════════ */
export function classReminderUserEmail({ userName, classData }) {
  const {
    title,
    category,
    level,
    scheduledAt,
    duration,
    instructor,
    meetLink,
    isPremium,
    milestone = 15,
  } = classData;

  const label    = milestoneLabel(milestone);
  const emoji    = milestoneEmoji(milestone);
  const color    = milestoneColor(milestone);
  const showLink = milestone <= 5;

  const timeString = new Date(scheduledAt).toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });

  return {
    subject: `${emoji} Class in ${label}: ${title} | Yoga Temple`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Georgia,serif;">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,${color},${color}dd);padding:36px 32px;text-align:center;">
    <div style="font-size:52px;margin-bottom:12px;">${emoji}</div>
    <h1 style="color:#fff;margin:0;font-size:26px;font-weight:700;">
      Class Starts in ${label}!
    </h1>
    <p style="color:rgba(255,255,255,0.88);margin:10px 0 0;font-size:15px;">
      Get ready, ${userName || 'Yogi'} 🧘
    </p>
  </div>

  <div style="padding:32px;">

    <!-- Class Details -->
    <div style="background:#f0faf4;border:1px solid #c8e6d4;border-radius:12px;padding:22px;margin-bottom:24px;">
      <h2 style="color:#005f2b;margin:0 0 16px;font-size:20px;">${title}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr>
          <td style="padding:7px 0;color:#6b5a3e;width:38%;">📅 Date & Time</td>
          <td style="padding:7px 0;color:#1a1208;font-weight:600;">${timeString}</td>
        </tr>
        <tr style="border-top:1px solid #e8f5ee;">
          <td style="padding:7px 0;color:#6b5a3e;">⏱ Duration</td>
          <td style="padding:7px 0;color:#1a1208;font-weight:600;">${duration} minutes</td>
        </tr>
        <tr style="border-top:1px solid #e8f5ee;">
          <td style="padding:7px 0;color:#6b5a3e;">👤 Instructor</td>
          <td style="padding:7px 0;color:#1a1208;font-weight:600;">${instructor}</td>
        </tr>
        <tr style="border-top:1px solid #e8f5ee;">
          <td style="padding:7px 0;color:#6b5a3e;">🧘 Style</td>
          <td style="padding:7px 0;color:#1a1208;font-weight:600;">${category}</td>
        </tr>
        <tr style="border-top:1px solid #e8f5ee;">
          <td style="padding:7px 0;color:#6b5a3e;">📊 Level</td>
          <td style="padding:7px 0;color:#1a1208;font-weight:600;">
            ${level?.replace('_', ' ')}
          </td>
        </tr>
        ${isPremium ? `
        <tr style="border-top:1px solid #e8f5ee;">
          <td style="padding:7px 0;color:#6b5a3e;">✨ Type</td>
          <td style="padding:7px 0;">
            <span style="background:rgba(196,154,54,0.12);color:#c49a36;padding:2px 10px;border-radius:50px;font-weight:700;font-size:11px;">👑 PREMIUM</span>
          </td>
        </tr>` : ''}
      </table>
    </div>

    <!-- Meet Link or Dashboard Link -->
    ${showLink ? `
    <div style="text-align:center;margin-bottom:24px;">
      <p style="color:#005f2b;font-weight:700;font-size:14px;margin-bottom:14px;">
        🔓 Your meeting room is ready!
      </p>
      <a href="${meetLink}"
         style="display:inline-block;background:linear-gradient(135deg,#005f2b,#2ea065);
                color:#fff;padding:16px 44px;border-radius:50px;font-size:16px;
                font-weight:700;text-decoration:none;
                box-shadow:0 6px 20px rgba(0,95,43,0.30);">
        🎥 Join Live Class Now →
      </a>
      <p style="color:#9a8a6a;font-size:11px;margin-top:12px;">
        Link: <a href="${meetLink}" style="color:#2ea065;word-break:break-all;">${meetLink}</a>
      </p>
    </div>
    ` : `
    <div style="background:#fffbeb;border:1px solid #f59e0b;border-radius:12px;
                padding:20px;margin-bottom:24px;text-align:center;">
      <p style="color:#92400e;font-size:14px;font-weight:700;margin:0 0 8px;">
        🔐 Meet link unlocks 5 minutes before class
      </p>
      <p style="color:#92400e;font-size:13px;margin:0 0 14px;">
        Head to your dashboard — the Join button appears automatically.
      </p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/classes"
         style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#f0c060);
                color:#000;padding:12px 32px;border-radius:50px;font-size:14px;
                font-weight:700;text-decoration:none;">
        View My Classes →
      </a>
    </div>
    `}

    <!-- Checklist -->
    <div style="background:#f8fffe;border-radius:10px;padding:18px;border:1px solid #c8e6d4;">
      <p style="color:#005f2b;font-weight:700;font-size:13px;margin:0 0 10px;">
        🌿 Quick Checklist:
      </p>
      <ul style="color:#6b5a3e;font-size:13px;margin:0;padding-left:18px;line-height:1.9;">
        <li>Roll out your yoga mat in a quiet space</li>
        <li>Have water nearby</li>
        <li>Wear comfortable clothing</li>
        <li>Test camera & microphone</li>
        <li>Join 2–3 minutes early</li>
      </ul>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#f8fffe;border-top:1px solid #c8e6d4;padding:18px 32px;text-align:center;">
    <p style="color:#9a8a6a;font-size:11px;margin:0;">
      © ${new Date().getFullYear()} Yoga Temple · Namaste 🙏
    </p>
  </div>

</div>
</body>
</html>`,
  };
}

/* ═══════════════════════════════════════════
   ADMIN REMINDER EMAIL
═══════════════════════════════════════════ */
export function classReminderAdminEmail({ classData, attendeeCount }) {
  const {
    title,
    category,
    scheduledAt,
    duration,
    instructor,
    meetLink,
  } = classData;

  const timeString = new Date(scheduledAt).toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });

  return {
    subject: `🔔 "${title}" starts in 15 min — ${attendeeCount} students booked`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Georgia,serif;">
<div style="max-width:560px;margin:20px auto;background:#fff;border-radius:16px;
            overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <div style="background:linear-gradient(135deg,#1a1208,#3d2b0a);padding:32px;text-align:center;">
    <div style="font-size:44px;margin-bottom:10px;">🔔</div>
    <h1 style="color:#f0c060;margin:0;font-size:22px;">Admin Class Alert</h1>
    <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:13px;">
      Your live class starts in 15 minutes
    </p>
  </div>

  <div style="padding:28px;">
    <div style="background:#f8fffe;border:1px solid #c8e6d4;border-radius:12px;
                padding:20px;margin-bottom:20px;">
      <h2 style="color:#005f2b;margin:0 0 14px;">${title}</h2>
      <p style="color:#6b5a3e;font-size:13px;margin:5px 0;">
        <strong>📅 Time:</strong> ${timeString}
      </p>
      <p style="color:#6b5a3e;font-size:13px;margin:5px 0;">
        <strong>👤 Instructor:</strong> ${instructor}
      </p>
      <p style="color:#6b5a3e;font-size:13px;margin:5px 0;">
        <strong>🧘 Category:</strong> ${category}
      </p>
      <p style="color:#6b5a3e;font-size:13px;margin:5px 0;">
        <strong>⏱ Duration:</strong> ${duration} minutes
      </p>
      <p style="color:#ef4444;font-size:15px;font-weight:700;margin:12px 0 0;">
        👥 ${attendeeCount} student(s) booked
      </p>
    </div>

    <div style="text-align:center;margin-bottom:20px;">
      <a href="${meetLink}"
         style="display:inline-block;background:linear-gradient(135deg,#005f2b,#2ea065);
                color:#fff;padding:14px 40px;border-radius:50px;font-size:15px;
                font-weight:700;text-decoration:none;">
        🎥 Start Class Now →
      </a>
      <p style="color:#9a8a6a;font-size:11px;margin-top:10px;word-break:break-all;">
        ${meetLink}
      </p>
    </div>

    <div style="background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.15);
                border-radius:10px;padding:14px;">
      <p style="color:#ef4444;font-size:12px;margin:0;font-weight:600;">
        ⚠️ Start 2–3 minutes early so students can join smoothly.
      </p>
    </div>
  </div>

  <div style="background:#f8fffe;border-top:1px solid #c8e6d4;padding:16px;text-align:center;">
    <p style="color:#9a8a6a;font-size:11px;margin:0;">
      Yoga Temple Admin · Namaste 🙏
    </p>
  </div>
</div>
</body>
</html>`,
  };
}

/* ═══════════════════════════════════════════
   CLASS CREATED — ADMIN EMAIL
═══════════════════════════════════════════ */
export function classCreatedAdminEmail({ adminName, classData }) {
  const {
    title,
    category,
    level,
    scheduledAt,
    duration,
    instructor,
    meetLink,
    isPremium,
  } = classData;

  const timeString = scheduledAt
    ? new Date(scheduledAt).toLocaleString('en-IN', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata',
      })
    : 'N/A';

  return {
    subject: `✅ Class Created: "${title}" | Yoga Temple`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Georgia,serif;">
<div style="max-width:560px;margin:20px auto;background:#fff;border-radius:16px;
            overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <div style="background:linear-gradient(135deg,#005f2b,#4cd389);
              padding:32px;text-align:center;">
    <div style="font-size:44px;margin-bottom:10px;">✅</div>
    <h1 style="color:#fff;margin:0;font-size:22px;">Class Created!</h1>
    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">
      Hello ${adminName}, your class is live!
    </p>
  </div>

  <div style="padding:28px;">
    <div style="background:#f0faf4;border:1px solid #c8e6d4;
                border-radius:12px;padding:20px;margin-bottom:20px;">
      <h2 style="color:#005f2b;margin:0 0 14px;">${title}</h2>
      <p style="color:#6b5a3e;font-size:13px;margin:5px 0;">
        <strong>📅 Scheduled:</strong> ${timeString}
      </p>
      <p style="color:#6b5a3e;font-size:13px;margin:5px 0;">
        <strong>🧘 Category:</strong> ${category}
      </p>
      <p style="color:#6b5a3e;font-size:13px;margin:5px 0;">
        <strong>📊 Level:</strong> ${level?.replace('_', ' ')}
      </p>
      <p style="color:#6b5a3e;font-size:13px;margin:5px 0;">
        <strong>⏱ Duration:</strong> ${duration} min
      </p>
      <p style="color:#6b5a3e;font-size:13px;margin:5px 0;">
        <strong>👤 Instructor:</strong> ${instructor}
      </p>
      ${isPremium
        ? `<p style="color:#c49a36;font-size:13px;font-weight:700;margin:5px 0;">
             👑 Premium Class
           </p>`
        : ''}
    </div>

    ${meetLink ? `
    <div style="background:#e8f5ee;border-radius:10px;padding:16px;margin-bottom:16px;">
      <p style="color:#005f2b;font-weight:700;font-size:13px;margin:0 0 8px;">
        🎥 Meeting Room Link
      </p>
      <a href="${meetLink}"
         style="color:#2ea065;font-size:13px;word-break:break-all;">${meetLink}</a>
    </div>

    <div style="text-align:center;">
      <a href="${meetLink}"
         style="display:inline-block;background:linear-gradient(135deg,#005f2b,#2ea065);
                color:#fff;padding:13px 32px;border-radius:50px;
                font-size:14px;font-weight:700;text-decoration:none;">
        🔗 Open Meeting Room
      </a>
    </div>` : ''}

    <div style="margin-top:20px;background:#fffbeb;border:1px solid #f59e0b;
                border-radius:10px;padding:14px;">
      <p style="color:#92400e;font-size:12px;margin:0;font-weight:600;">
        📬 Reminder emails will be sent to booked students at:
        <b>30 min</b>, <b>15 min</b>, and <b>5 min</b> before class.
      </p>
    </div>
  </div>

  <div style="background:#f8fffe;border-top:1px solid #c8e6d4;
              padding:16px;text-align:center;">
    <p style="color:#9a8a6a;font-size:11px;margin:0;">
      Yoga Temple Admin · Namaste 🙏
    </p>
  </div>
</div>
</body>
</html>`,
  };
}

/* ═══════════════════════════════════════════
   NEW CLASS — USER NOTIFICATION EMAIL
═══════════════════════════════════════════ */
export function newClassUserEmail({ userName, classData }) {
  const {
    title,
    category,
    level,
    scheduledAt,
    duration,
    instructor,
    isPremium,
  } = classData;

  const timeString = scheduledAt
    ? new Date(scheduledAt).toLocaleString('en-IN', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata',
      })
    : null;

  return {
    subject: `🧘 New ${isPremium ? 'Premium ' : ''}Class: "${title}" | Yoga Temple`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Georgia,serif;">
<div style="max-width:560px;margin:20px auto;background:#fff;border-radius:16px;
            overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <div style="background:linear-gradient(135deg,#005f2b,#2ea065);
              padding:36px 32px;text-align:center;">
    <div style="font-size:44px;margin-bottom:12px;">🧘</div>
    <h1 style="color:#fff;margin:0;font-size:24px;">New Class Available!</h1>
    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">
      Hello ${userName || 'Yogi'}, a new class has been added!
    </p>
  </div>

  <div style="padding:28px;">
    ${isPremium ? `
    <div style="background:linear-gradient(135deg,rgba(196,154,54,0.10),rgba(196,154,54,0.05));
                border:1px solid rgba(196,154,54,0.25);border-radius:10px;
                padding:12px 16px;margin-bottom:20px;text-align:center;">
      <span style="color:#c49a36;font-weight:700;font-size:13px;">
        👑 PREMIUM CLASS — Subscribers Only
      </span>
    </div>` : ''}

    <div style="background:#f0faf4;border:1px solid #c8e6d4;
                border-radius:12px;padding:20px;margin-bottom:24px;">
      <h2 style="color:#005f2b;margin:0 0 14px;">${title}</h2>
      ${timeString
        ? `<p style="color:#2ea065;font-size:13px;font-weight:700;margin:5px 0;">
             📅 ${timeString}
           </p>`
        : ''}
      <p style="color:#6b5a3e;font-size:13px;margin:5px 0;">
        <strong>🧘 Style:</strong> ${category}
      </p>
      <p style="color:#6b5a3e;font-size:13px;margin:5px 0;">
        <strong>📊 Level:</strong> ${level?.replace('_', ' ')}
      </p>
      <p style="color:#6b5a3e;font-size:13px;margin:5px 0;">
        <strong>⏱ Duration:</strong> ${duration} minutes
      </p>
      <p style="color:#6b5a3e;font-size:13px;margin:5px 0;">
        <strong>👤 Instructor:</strong> ${instructor}
      </p>
    </div>

    <div style="text-align:center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/classes"
         style="display:inline-block;
                background:linear-gradient(135deg,#005f2b,#2ea065);
                color:#fff;padding:14px 36px;border-radius:50px;
                font-size:15px;font-weight:700;text-decoration:none;
                box-shadow:0 4px 16px rgba(0,95,43,0.25);">
        View Class →
      </a>
    </div>
  </div>

  <div style="background:#f8fffe;border-top:1px solid #c8e6d4;
              padding:16px;text-align:center;">
    <p style="color:#9a8a6a;font-size:11px;margin:0;">
      © ${new Date().getFullYear()} Yoga Temple · Namaste 🙏
    </p>
  </div>
</div>
</body>
</html>`,
  };
}