'use client';
// src/app/join/[code]/page.js
//
// Route: /join/abc-defg-hij
//
// This page is the real link users click. It validates the Meet code
// format, shows class info + a countdown if too early, and only
// opens Google Meet when the user explicitly clicks "Open in Google Meet"
// — preventing the confusing "wrong code" error from appearing.
//
// Usage in LiveClassJoinButton:
//   href={`/join/${meetCode}`}   ← use code, not full google URL
//
// Or if you store the full URL, strip the prefix:
//   const code = meetLink.replace('https://meet.google.com/', '')

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Valid Meet code regex: exactly abc-defg-hij (3-4-3 lowercase letters)
const MEET_CODE_RE = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/;

function pad(n) { return String(Math.max(0, n)).padStart(2, '0'); }

function formatTime(ms) {
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return { h: pad(h), m: pad(m), s: pad(sec), hasHours: h > 0 };
}

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const code   = params?.code ?? '';

  const [classInfo, setClassInfo]   = useState(null);
  const [status, setStatus]         = useState('loading'); // loading | valid | invalid | opening
  const [countdown, setCountdown]   = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const meetUrl    = `https://meet.google.com/${code}`;
  const isValidFmt = MEET_CODE_RE.test(code);

  // Fetch class info for this meet code
  useEffect(() => {
    if (!isValidFmt) { setStatus('invalid'); return; }

    async function fetchInfo() {
      try {
        const res  = await fetch(`/api/meet-info?code=${encodeURIComponent(code)}`);
        const data = await res.json();
        if (data.class) {
          setClassInfo(data.class);
          setIsUnlocked(data.isUnlocked);
        }
        setStatus('valid');
      } catch {
        setStatus('valid'); // show join anyway even if info fetch fails
      }
    }
    fetchInfo();
  }, [code, isValidFmt]);

  // Countdown tick
  useEffect(() => {
    if (!classInfo?.scheduledAt) return;
    const unlockAt = new Date(new Date(classInfo.scheduledAt).getTime() - 5 * 60 * 1000);
    const tick = () => {
      const msLeft = unlockAt.getTime() - Date.now();
      setCountdown(msLeft);
      setIsUnlocked(msLeft <= 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [classInfo]);

  function openMeet() {
    setStatus('opening');
    // Small delay so the user sees the opening state before redirect
    setTimeout(() => { window.open(meetUrl, '_blank', 'noopener,noreferrer'); setStatus('valid'); }, 600);
  }

  const timeLeft = countdown !== null ? formatTime(countdown) : null;

  // ── Shared layout ──────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #071a0e 0%, #0a2614 50%, #071a0e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'Georgia, serif',
    }}>
      {/* Subtle radial glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(46,160,101,0.07) 0%, transparent 70%)',
      }} />

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 480,
        background: 'rgba(10,30,16,0.85)',
        border: '1px solid rgba(76,211,137,0.15)',
        borderRadius: 20,
        overflow: 'hidden',
        backdropFilter: 'blur(12px)',
      }}>
        {/* Top accent bar */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, #005f2b, #4cd389, #005f2b)' }} />

        <div style={{ padding: '36px 32px 32px' }}>

          {/* Logo / brand */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🧘</div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', margin: 0 }}>
              Yoga Temple · Live Class
            </p>
          </div>

          {/* ── LOADING ── */}
          {status === 'loading' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#4cd389',
                    animation: `bounce 1.2s ${i*0.2}s ease-in-out infinite`,
                  }} />
                ))}
              </div>
              <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}`}</style>
            </div>
          )}

          {/* ── INVALID FORMAT ── */}
          {status === 'invalid' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 12,
                padding: '20px 16px',
                marginBottom: 20,
              }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>⚠️</div>
                <p style={{ color: '#f87171', fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>
                  Invalid Meeting Code
                </p>
                <p style={{ color: 'rgba(248,113,113,0.7)', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                  The code <code style={{ background: 'rgba(239,68,68,0.15)', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace' }}>{code || '(empty)'}</code> is not a valid Google Meet code.
                  <br />Valid format: <strong>abc-defg-hij</strong> (3-4-3 lowercase letters)
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                style={btnStyle('#1a3a22', 'rgba(76,211,137,0.3)', '#4cd389')}
              >
                ← Back to Dashboard
              </button>
            </div>
          )}

          {/* ── VALID ── */}
          {(status === 'valid' || status === 'opening') && isValidFmt && (
            <>
              {/* Class info card */}
              {classInfo && (
                <div style={{
                  background: 'rgba(76,211,137,0.05)',
                  border: '1px solid rgba(76,211,137,0.15)',
                  borderRadius: 12,
                  padding: '16px 18px',
                  marginBottom: 24,
                }}>
                  <p style={{ color: '#4cd389', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 6px', fontWeight: 600 }}>
                    Your Session
                  </p>
                  <p style={{ color: '#e8f5ee', fontSize: 17, margin: '0 0 10px', fontWeight: 600 }}>{classInfo.title}</p>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {classInfo.instructor && (
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>👤 {classInfo.instructor}</span>
                    )}
                    {classInfo.scheduledAt && (
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                        📅 {new Date(classInfo.scheduledAt).toLocaleTimeString('en-IN', { timeStyle: 'short', timeZone: 'Asia/Kolkata' })} IST
                      </span>
                    )}
                    {classInfo.duration && (
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>⏱ {classInfo.duration} min</span>
                    )}
                  </div>
                </div>
              )}

              {/* Meet code display */}
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 8px' }}>
                  Meet Code
                </p>
                <div style={{
                  display: 'inline-block',
                  background: 'rgba(76,211,137,0.08)',
                  border: '1px solid rgba(76,211,137,0.2)',
                  borderRadius: 10,
                  padding: '10px 20px',
                  fontFamily: "'Courier New', monospace",
                  fontSize: 22,
                  letterSpacing: 4,
                  color: '#4cd389',
                  fontWeight: 700,
                }}>
                  {code}
                </div>
              </div>

              {/* Countdown OR Join button */}
              {classInfo && !isUnlocked && timeLeft ? (
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 10px' }}>
                    Class opens in
                  </p>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 6 }}>
                    {timeLeft.hasHours && (
                      <>
                        <DigitBlock value={timeLeft.h} label="hrs" />
                        <Sep />
                      </>
                    )}
                    <DigitBlock value={timeLeft.m} label="min" />
                    <Sep />
                    <DigitBlock value={timeLeft.s} label="sec" />
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '14px 0 0', lineHeight: 1.6 }}>
                    The Join button will appear 5 minutes before class starts
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                  {/* Live indicator */}
                  {isUnlocked && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 14 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', background: '#4cd389',
                        boxShadow: '0 0 0 3px rgba(76,211,137,0.25)',
                        animation: 'pulse 2s ease-in-out infinite',
                      }} />
                      <span style={{ color: '#4cd389', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>
                        Class is live
                      </span>
                    </div>
                  )}

                  <button
                    onClick={openMeet}
                    disabled={status === 'opening'}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 10,
                      background: status === 'opening'
                        ? 'rgba(76,211,137,0.2)'
                        : 'linear-gradient(135deg, #005f2b, #2ea065)',
                      color: '#fff',
                      border: 'none',
                      padding: '15px 36px',
                      borderRadius: 50,
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: status === 'opening' ? 'default' : 'pointer',
                      letterSpacing: 0.3,
                      transition: 'all 0.2s',
                      animation: isUnlocked ? 'glow 2s ease-in-out infinite' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>🎥</span>
                    {status === 'opening' ? 'Opening…' : 'Open in Google Meet'}
                  </button>

                  <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, margin: '10px 0 0', wordBreak: 'break-all' }}>
                    {meetUrl}
                  </p>
                </div>
              )}

              {/* Info note */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10,
                padding: '12px 14px',
                marginTop: 16,
              }}>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0, lineHeight: 1.7 }}>
                  💡 Make sure you are signed into the Google account registered with Yoga Temple. If Google shows a "meeting code not found" error, the host may not have started the meeting yet — please wait a moment and try again.
                </p>
              </div>
            </>
          )}

          {/* Back link */}
          {status !== 'loading' && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button
                onClick={() => router.push('/dashboard')}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: 12, cursor: 'pointer' }}
              >
                ← Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(76,211,137,0.25); }
          50%       { box-shadow: 0 0 0 6px rgba(76,211,137,0.1); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 4px 20px rgba(0,95,43,0.4); }
          50%       { box-shadow: 0 4px 36px rgba(76,211,137,0.5); }
        }
      `}</style>
    </div>
  );
}

function DigitBlock({ value, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        background: 'rgba(10,20,12,0.9)',
        border: '1px solid rgba(76,211,137,0.2)',
        borderRadius: 10,
        padding: '10px 8px 8px',
        fontFamily: "'Courier New', monospace",
        fontSize: 28,
        fontWeight: 700,
        color: '#4cd389',
        minWidth: 54,
        lineHeight: 1,
      }}>
        {value}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 5, letterSpacing: 1, textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  );
}

function Sep() {
  return <div style={{ color: '#4cd389', fontSize: 22, fontWeight: 700, opacity: 0.5, marginBottom: 16 }}>:</div>;
}

function btnStyle(bg, border, color) {
  return {
    background: bg,
    border: `1px solid ${border}`,
    color,
    borderRadius: 50,
    padding: '10px 24px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  };
}