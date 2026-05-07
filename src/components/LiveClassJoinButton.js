// src/components/LiveClassJoinButton.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/* ═══════════════════════════════════════════════════
   LiveClassJoinButton
   Props:
     classId     — string   (required)
     scheduledAt — string   (ISO date)
     title       — string
     size        — 'sm' | 'md' | 'lg'
═══════════════════════════════════════════════════ */
export default function LiveClassJoinButton({
  classId,
  scheduledAt,
  title = 'Yoga Class',
  size = 'md',
}) {
  const [state, setState]       = useState('loading');
  const [meetLink, setMeetLink] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [error, setError]       = useState(null);

  /* ── Sizes ── */
  const S = {
    sm: { pad: '8px 18px',  font: 12, radius: 50 },
    md: { pad: '12px 28px', font: 14, radius: 50 },
    lg: { pad: '16px 36px', font: 16, radius: 50 },
  }[size] || { pad: '12px 28px', font: 14, radius: 50 };

  /* ── Poll API every 10 seconds ── */
  const poll = useCallback(async () => {
    if (!classId) return;
    try {
      const { data } = await axios.get(
        `/api/classes/${classId}/meet-link`
      );
      setState(data.code || 'TOO_EARLY');
      if (data.meetLink) setMeetLink(data.meetLink);
      setError(null);
    } catch (err) {
      const code = err.response?.data?.code;
      setState(code || 'ERROR');
      setError(err.response?.data?.error || null);
    }
  }, [classId]);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, 10_000);
    return () => clearInterval(interval);
  }, [poll]);

  /* ── Live countdown timer (ticks every second) ── */
  useEffect(() => {
    if (!scheduledAt) return;

    const tick = () => {
      const now    = new Date();
      const start  = new Date(scheduledAt);
      const diff   = start - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const totalSec = Math.floor(diff / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;

      if (h > 0) {
        setTimeLeft(`${h}h ${m}m`);
      } else if (m > 0) {
        setTimeLeft(`${m}m ${String(s).padStart(2, '0')}s`);
      } else {
        setTimeLeft(`${s}s`);
      }
    };

    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [scheduledAt]);

  /* ── Loading ── */
  if (state === 'loading') {
    return (
      <div style={{
        padding: S.pad,
        background: '#f4faf6',
        borderRadius: S.radius,
        fontSize: S.font,
        color: '#9a8a6a',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#c8e6d4',
          display: 'inline-block',
          animation: 'pulse 1s infinite',
        }}/>
        Checking…
      </div>
    );
  }

  /* ── Ended ── */
  if (state === 'ENDED') {
    return (
      <div style={{
        padding: S.pad,
        background: 'rgba(0,0,0,0.05)',
        borderRadius: S.radius,
        fontSize: S.font,
        color: '#9a8a6a',
        display: 'inline-block',
      }}>
        ✅ Class Ended
      </div>
    );
  }

  /* ── Auth / Subscription errors ── */
  if (state === 'UNAUTHENTICATED') {
    return (
      <a href="/auth" style={{
        padding: S.pad,
        background: 'linear-gradient(135deg,#005f2b,#2ea065)',
        color: '#fff',
        borderRadius: S.radius,
        fontSize: S.font,
        fontWeight: 700,
        textDecoration: 'none',
        display: 'inline-block',
      }}>
        Sign In to Join →
      </a>
    );
  }

  if (state === 'NOT_SUBSCRIBED') {
    return (
      <a href="/premium" style={{
        padding: S.pad,
        background: 'linear-gradient(135deg,#c49a36,#f0c060)',
        color: '#000',
        borderRadius: S.radius,
        fontSize: S.font,
        fontWeight: 700,
        textDecoration: 'none',
        display: 'inline-block',
      }}>
        👑 Subscribe to Join →
      </a>
    );
  }

  /* ── Too early (more than 10 min away) ── */
  if (state === 'TOO_EARLY') {
    return (
      <div style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}>
        <div style={{
          padding: S.pad,
          background: 'rgba(76,211,137,0.08)',
          border: '1.5px solid rgba(76,211,137,0.20)',
          borderRadius: S.radius,
          fontSize: S.font,
          color: '#2ea065',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
        }}>
          📅 Starts in {timeLeft || '…'}
        </div>
        <span style={{ fontSize: 10, color: '#9a8a6a' }}>
          Join link unlocks 5 min before class
        </span>
      </div>
    );
  }

  /* ── Countdown phase (10 min → 5 min) ── */
  if (state === 'COUNTDOWN') {
    return (
      <div style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
      }}>
        {/* Countdown box */}
        <div style={{
          padding: S.pad,
          background: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(245,158,11,0.06))',
          border: '2px solid rgba(245,158,11,0.35)',
          borderRadius: S.radius,
          fontSize: S.font + 2,
          color: '#b45309',
          fontWeight: 800,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          animation: 'pulse 2s ease-in-out infinite',
        }}>
          ⏳ {timeLeft || '…'}
        </div>
        <span style={{ fontSize: 11, color: '#9a8a6a', fontWeight: 600 }}>
          🔐 Join link unlocks in a moment…
        </span>
      </div>
    );
  }

  /* ── Unlocked / Live Now ── */
  if (state === 'UNLOCKED' || state === 'LIVE_NOW') {
    const isLive = state === 'LIVE_NOW';

    return (
      <div style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
      }}>
        <a
          href={meetLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: S.pad,
            background: isLive
              ? 'linear-gradient(135deg,#ef4444,#ff6b6b)'
              : 'linear-gradient(135deg,#005f2b,#2ea065)',
            color: '#fff',
            borderRadius: S.radius,
            fontSize: S.font,
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: isLive
              ? '0 6px 20px rgba(239,68,68,0.35)'
              : '0 6px 20px rgba(0,95,43,0.30)',
            animation: isLive ? 'pulse 1.5s ease-in-out infinite' : 'none',
          }}
        >
          {isLive ? (
            <>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#fff',
                display: 'inline-block',
                animation: 'pulse 1s infinite',
              }}/>
              🔴 Join Live Now!
            </>
          ) : (
            '🎥 Join Live Class →'
          )}
        </a>

        {isLive && (
          <span style={{
            fontSize: 11,
            color: '#ef4444',
            fontWeight: 700,
            background: 'rgba(239,68,68,0.08)',
            padding: '3px 12px',
            borderRadius: 50,
          }}>
            🔴 Class is happening now!
          </span>
        )}

        {!isLive && (
          <span style={{ fontSize: 10, color: '#9a8a6a' }}>
            🔓 Room is open — class starts soon
          </span>
        )}
      </div>
    );
  }

  /* ── Fallback error ── */
  return (
    <div style={{
      padding: S.pad,
      background: 'rgba(239,68,68,0.06)',
      border: '1px solid rgba(239,68,68,0.20)',
      borderRadius: S.radius,
      fontSize: S.font,
      color: '#ef4444',
      display: 'inline-block',
    }}>
      {error || 'Unable to load class'}
    </div>
  );
}