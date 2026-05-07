// src/lib/meetLink.js
// Now uses Jitsi Meet — real working rooms, no API needed

const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

function rand(n) {
  return Array.from(
    { length: n },
    () => CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('');
}

function generateJitsiRoom(title = 'YogaClass') {
  const clean = title
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '')
    .substring(0, 20);

  const code = rand(6).toUpperCase();
  return `YogaTemple-${clean}-${code}`;
}

export function generateMeetCode() {
  return generateJitsiRoom();
}

// src/lib/meetLink.js

export function generateMeetLink(title = 'YogaClass') {
  const clean = title
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '')
    .substring(0, 20);

  const code = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  return `https://meet.jit.si/YogaTemple-${clean}-${code}`;
}

export function generateEventId() {
  return 'jitsi_' + Math.random().toString(36).substring(2, 15);
}

export function createMeetLink({ title = 'Yoga Class', scheduledAt } = {}) {
  const room     = generateJitsiRoom(title);
  const meetLink = `https://meet.jit.si/${room}`;
  const eventId  = generateEventId();

  console.log(`📅 Jitsi room for "${title}": ${meetLink}`);
  return { meetLink, eventId, room };
}