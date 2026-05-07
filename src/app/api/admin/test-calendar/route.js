// src/app/api/admin/test-calendar/route.js
// TEMPORARY — delete this file after confirming everything works

import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  const results = {
    envCheck: {},
    authTest: null,
    calendarTest: null,
    error: null,
  };

  // ── 1. Check env vars ──
  results.envCheck = {
    GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
      ? `✅ Set (${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL})`
      : '❌ MISSING',
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY
      ? `✅ Set (length: ${process.env.GOOGLE_PRIVATE_KEY.length})`
      : '❌ MISSING',
    GOOGLE_CALENDAR_ID: process.env.GOOGLE_CALENDAR_ID
      ? `✅ Set (${process.env.GOOGLE_CALENDAR_ID})`
      : '⚠️ Not set — will use "primary"',
  };

  // ── 2. Auth test ──
  try {
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const token = await auth.authorize();
    results.authTest = `✅ Auth successful (token type: ${token.token_type})`;
  } catch (err) {
    results.authTest = `❌ Auth failed: ${err.message}`;
    results.error = err.message;
    return NextResponse.json(results, { status: 200 });
  }

  // ── 3. Calendar access test ──
  try {
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: privateKey,
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // Try to list calendars the service account can access
    const calList = await calendar.calendarList.list();
    const cals = calList.data.items?.map(c => ({
      id: c.id,
      summary: c.summary,
      accessRole: c.accessRole,
    })) ?? [];

    results.calendarTest = {
      message: '✅ Calendar API works',
      accessibleCalendars: cals,
      tip: cals.length === 0
        ? '⚠️ No calendars found. Share your Google Calendar with the service account email!'
        : `Found ${cals.length} calendar(s). Use one of the IDs above as GOOGLE_CALENDAR_ID`,
    };

    // ── 4. Try creating a test event ──
    const calendarId = process.env.GOOGLE_CALENDAR_ID || (cals[0]?.id) || 'primary';
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000);

    try {
      const testEvent = await calendar.events.insert({
        calendarId,
        conferenceDataVersion: 1,
        sendUpdates: 'none',
        requestBody: {
          summary: '[TEST] Yoga Temple Test Event — safe to delete',
          start: { dateTime: now.toISOString(), timeZone: 'Asia/Kolkata' },
          end:   { dateTime: end.toISOString(), timeZone: 'Asia/Kolkata' },
          conferenceData: {
            createRequest: {
              requestId: `test-${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
        },
      });

      const meetLink = testEvent.data.conferenceData?.entryPoints?.find(
        ep => ep.entryPointType === 'video'
      )?.uri;

      results.eventTest = {
        success: true,
        calendarIdUsed: calendarId,
        eventId: testEvent.data.id,
        meetLink: meetLink || '⚠️ Meet link not generated',
        htmlLink: testEvent.data.htmlLink,
      };

      // Clean up — delete the test event
      await calendar.events.delete({ calendarId, eventId: testEvent.data.id, sendUpdates: 'none' });
      results.eventTest.cleanup = '✅ Test event deleted';
    } catch (evtErr) {
      results.eventTest = {
        success: false,
        calendarIdUsed: calendarId,
        error: evtErr.message,
        fix: calendarId !== 'primary'
          ? 'The GOOGLE_CALENDAR_ID may be wrong, or the service account was not shared on that calendar.'
          : 'Try sharing a real Google Calendar with the service account and set GOOGLE_CALENDAR_ID.',
      };
    }
  } catch (err) {
    results.calendarTest = `❌ Calendar list failed: ${err.message}`;
    results.error = err.message;
  }

  return NextResponse.json(results, { status: 200 });
}