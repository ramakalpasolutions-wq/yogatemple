// src/lib/googleMeet.js

/* ═══════════════════════════════════════════════════
   Yoga Temple — Jitsi Meeting Helper
   ✅ 100% Free
   ✅ No API Key
   ✅ Real Working Rooms
══════════════════════════════════════════════════ */

function generateRoomName(title = 'YogaClass') {
  const clean = title
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '')
    .substring(0, 20);

  const code = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  return `YogaTemple-${clean}-${code}`;
}

export async function createMeetEvent({
  title = 'Yoga Class',
  description = '',
  scheduledAt,
  durationMinutes = 60,
}) {
  const startTime = new Date(scheduledAt);
  const endTime = new Date(
    startTime.getTime() + durationMinutes * 60 * 1000
  );

  const roomName = generateRoomName(title);
  const meetLink = `https://meet.jit.si/${roomName}`;
  const eventId = `jitsi_${Date.now()}`;

  console.log(`✅ Jitsi room created: ${meetLink}`);

  return {
    meetLink,
    eventId,
    calendarLink: null,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    provider: 'jitsi',
  };
}

export async function updateMeetEvent({ eventId }) {
  return { meetLink: null, eventId, calendarLink: null };
}

export async function deleteMeetEvent(eventId) {
  console.log(`ℹ️ Jitsi room ${eventId} auto closes when empty`);
}

export function generateMeetLink(title = 'YogaClass') {
  return `https://meet.jit.si/${generateRoomName(title)}`;
}