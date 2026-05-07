// src/app/admin/login/page.js
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

/* ══════════════════════════════════════════════════════
   YOGA-THEME STYLES + KEYFRAMES
══════════════════════════════════════════════════════ */
const AUTH_STYLES = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes spinSlow { to { transform: rotate(360deg); } }
  @keyframes spinReverse { to { transform: rotate(-360deg); } }

  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  @keyframes scaleIn { from { opacity:0; transform:scale(.92); } to { opacity:1; transform:scale(1); } }
  @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
  @keyframes dotBounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }

  /* Yoga motion */
  @keyframes breathe { 0%,100%{transform:scale(1);opacity:.85} 50%{transform:scale(1.12);opacity:1} }
  @keyframes breatheGlow { 0%,100%{box-shadow:0 0 20px rgba(255,215,140,.3),0 0 40px rgba(76,211,137,.2)} 50%{box-shadow:0 0 50px rgba(255,215,140,.6),0 0 90px rgba(76,211,137,.4)} }
  @keyframes lotusOpen { from{transform:scale(.5) rotate(-30deg);opacity:0} to{transform:scale(1) rotate(0);opacity:1} }
  @keyframes petalFall { 0%{transform:translateY(-110vh) rotate(0) translateX(0);opacity:0} 10%{opacity:.7} 90%{opacity:.7} 100%{transform:translateY(115vh) rotate(720deg) translateX(50px);opacity:0} }
  @keyframes auraRipple { 0%{transform:scale(.8);opacity:.7} 100%{transform:scale(2.5);opacity:0} }
  @keyframes mandalaFloat { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-20px) rotate(5deg)} }
  @keyframes shimmerTxt { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes twinkle { 0%,100%{opacity:.2;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }

  input::placeholder { color: rgba(107,90,62,0.45) !important; }
  * { box-sizing: border-box; }

  .yoga-shimmer-text{
    background: linear-gradient(90deg, #fff 0%, #ffe9a8 25%, #fff 50%, #ffe9a8 75%, #fff 100%);
    background-size:200% 100%;
    -webkit-background-clip:text;
    background-clip:text;
    -webkit-text-fill-color:transparent;
    animation: shimmerTxt 4s linear infinite;
  }

  @media (max-width: 520px){
    .auth-card { padding: 24px 18px !important; margin: 0 8px !important; }
  }
`;

function useAuthStyles() {
  useEffect(() => {
    const id = 'auth-styles';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id;
    el.textContent = AUTH_STYLES;
    document.head.appendChild(el);
    return () => {
      try {
        document.head.removeChild(el);
      } catch {}
    };
  }, []);
}

/* ══════════════════════════════════════════════════════
   THEME
══════════════════════════════════════════════════════ */
const C = {
  border: '#c8e6d4',
  borderFoc: '#2ea065',
  accentMid: '#2ea065',
  accentLight: '#4cd389',
  textMuted: '#6b5a3e',
  textLight: '#9a8a6a',
  red: '#ef4444',
};

const focusIn = (e) => {
  e.target.style.borderColor = C.accentMid;
  e.target.style.boxShadow = '0 0 0 3px rgba(76,211,137,.12)';
};
const focusOut = (e) => {
  e.target.style.borderColor = C.border;
  e.target.style.boxShadow = 'none';
};

const inp = (extra = {}) => ({
  width: '100%',
  padding: '13px 16px 13px 44px',
  background: '#fafffe',
  border: `1.5px solid ${C.border}`,
  borderRadius: 12,
  fontSize: 14,
  color: '#1a1208',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color .2s, box-shadow .2s',
  fontFamily: 'inherit',
  ...extra,
});

/* ══════════════════════════════════════════════════════
   Background graphics components (SVG/animated)
══════════════════════════════════════════════════════ */

function Mandala({ size = 600, opacity = 0.18, color = '#ffffff', duration = 90, reverse = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      style={{
        opacity,
        animation: `${reverse ? 'spinReverse' : 'spinSlow'} ${duration}s linear infinite`,
      }}
    >
      <g fill="none" stroke={color} strokeWidth="0.5">
        <circle cx="100" cy="100" r="95" />
        <circle cx="100" cy="100" r="80" />
        <circle cx="100" cy="100" r="65" />
        <circle cx="100" cy="100" r="50" />
        <circle cx="100" cy="100" r="35" />
        <circle cx="100" cy="100" r="20" />

        {Array.from({ length: 12 }).map((_, i) => (
          <g key={i} transform={`rotate(${i * 30} 100 100)`}>
            <path d="M100,15 Q110,50 100,100 Q90,50 100,15" stroke={color} strokeWidth="0.7" />
            <ellipse cx="100" cy="40" rx="6" ry="18" />
            <circle cx="100" cy="22" r="3" />
          </g>
        ))}

        {Array.from({ length: 8 }).map((_, i) => (
          <line
            key={i}
            x1="100"
            y1="100"
            x2={100 + 35 * Math.cos((i * Math.PI) / 4)}
            y2={100 + 35 * Math.sin((i * Math.PI) / 4)}
            strokeWidth="0.6"
          />
        ))}
        <polygon points="100,75 115,100 100,125 85,100" />
        <polygon points="100,80 110,100 100,120 90,100" />
      </g>
    </svg>
  );
}

function LotusLogo({ size = 72 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block' }}>
      <defs>
        <radialGradient id="lotusCenter" cx="50%" cy="60%" r="50%">
          <stop offset="0%" stopColor="#fff7d6" />
          <stop offset="60%" stopColor="#f0c060" />
          <stop offset="100%" stopColor="#c49a36" />
        </radialGradient>
        <linearGradient id="petal" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#a8e6c1" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="petalSide" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#e8f8ee" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#7fd2a3" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      <g transform="translate(50,55)">
        {[-60, -30, 0, 30, 60].map((rot, i) => (
          <ellipse
            key={i}
            cx="0"
            cy="-20"
            rx="10"
            ry="28"
            transform={`rotate(${rot})`}
            fill="url(#petalSide)"
            stroke="#4cd389"
            strokeWidth="0.5"
            opacity="0.85"
          />
        ))}
      </g>

      <g transform="translate(50,55)">
        {[-45, -15, 15, 45].map((rot, i) => (
          <ellipse
            key={i}
            cx="0"
            cy="-15"
            rx="9"
            ry="24"
            transform={`rotate(${rot})`}
            fill="url(#petal)"
            stroke="#2ea065"
            strokeWidth="0.6"
          />
        ))}
      </g>

      <circle cx="50" cy="55" r="8" fill="url(#lotusCenter)" />
      <circle cx="50" cy="55" r="3" fill="#c49a36" />
    </svg>
  );
}

function TwinklingStars({ count = 25 }) {
  const starsRef = useRef(null);
  if (!starsRef.current) {
    starsRef.current = Array.from({ length: count }).map(() => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: 1 + Math.random() * 3,
      delay: Math.random() * 5,
      duration: 2 + Math.random() * 4,
    }));
  }

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {starsRef.current.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: '#fff7d6',
            boxShadow: `0 0 ${s.size * 3}px #ffd78c`,
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function FloatingPetals({ count = 14 }) {
  const petalsRef = useRef(null);
  if (!petalsRef.current) {
    petalsRef.current = Array.from({ length: count }).map(() => ({
      left: Math.random() * 100,
      delay: Math.random() * 12,
      duration: 14 + Math.random() * 16,
      size: 10 + Math.random() * 18,
      rot: Math.random() * 360,
      hue: Math.random() > 0.5 ? '#ffe5b4' : '#a8e6c1',
    }));
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {petalsRef.current.map((p, i) => (
        <svg
          key={i}
          width={p.size}
          height={p.size * 1.4}
          viewBox="0 0 20 28"
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: '-10%',
            animation: `petalFall ${p.duration}s linear ${p.delay}s infinite`,
            transform: `rotate(${p.rot}deg)`,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
          }}
        >
          <path
            d="M10,0 Q18,10 14,20 Q10,28 10,28 Q10,28 6,20 Q2,10 10,0 Z"
            fill={p.hue}
            opacity="0.7"
          />
          <path d="M10,4 Q14,12 10,22" stroke="#fff" strokeWidth="0.5" fill="none" opacity="0.5" />
        </svg>
      ))}
    </div>
  );
}

function YogaSilhouette({ position = 'bottom-right' }) {
  const pos =
    position === 'bottom-left'
      ? { bottom: 20, left: 20 }
      : position === 'top-right'
      ? { top: 20, right: 20 }
      : { bottom: 20, right: 20 };

  return (
    <div
      style={{
        position: 'absolute',
        ...pos,
        zIndex: 0,
        opacity: 0.18,
        pointerEvents: 'none',
        animation: 'breathe 6s ease-in-out infinite',
      }}
    >
      <svg width="120" height="160" viewBox="0 0 100 130" fill="#fff">
        <circle cx="50" cy="22" r="11" />
        <ellipse cx="50" cy="55" rx="18" ry="22" />
        <ellipse cx="22" cy="80" rx="20" ry="9" transform="rotate(-15 22 80)" />
        <ellipse cx="78" cy="80" rx="20" ry="9" transform="rotate(15 78 80)" />
        <ellipse cx="20" cy="60" rx="14" ry="5" transform="rotate(20 20 60)" />
        <ellipse cx="80" cy="60" rx="14" ry="5" transform="rotate(-20 80 60)" />
        <ellipse cx="50" cy="100" rx="32" ry="6" />
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Admin Login Page
══════════════════════════════════════════════════════ */
export default function AdminLoginPage() {
  useAuthStyles();

  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;
    axios
      .get('/api/admin/me')
      .then(() => alive && router.replace('/admin'))
      .catch(() => {})
      .finally(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
  }, [router]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');
      setLoading(true);
      try {
        await axios.post('/api/admin/login', form);
        router.push('/admin');
      } catch (err) {
        setError(err.response?.data?.error || 'Login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [form, router]
  );

  if (checking)
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg,#0a3d2e 0%,#1e6b52 50%,#4cd389 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <TwinklingStars count={30} />
        <FloatingPetals count={12} />

        <YogaSilhouette position="bottom-right" />

        <div style={{ textAlign: 'center', zIndex: 1 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div
              style={{
                position: 'absolute',
                inset: -14,
                borderRadius: '50%',
                border: '2px solid rgba(255,215,140,.45)',
                animation: 'auraRipple 3s ease-out infinite',
              }}
            />
            <div
              style={{
                width: 110,
                height: 110,
                borderRadius: '50%',
                background: 'rgba(255,255,255,.15)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'breatheGlow 4s ease-in-out infinite',
              }}
            >
              <LotusLogo size={76} />
            </div>
          </div>

          <div style={{ marginTop: 16, color: '#fff', fontSize: 14, opacity: 0.85, letterSpacing: 2 }}>
            ॐ &nbsp; Checking session… &nbsp; ॐ
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 14, justifyContent: 'center' }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#ffd78c',
                  animation: `dotBounce 1.4s ease ${i * 0.16}s infinite`,
                }}
              />
            ))}
          </div>

          <div style={{ marginTop: 10, color: 'rgba(255,255,255,.7)', fontSize: 12 }}>
            Breathe in… breathe out…
          </div>
        </div>

        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.16 }}>
          <Mandala size={700} opacity={1} color="#ffffff" duration={110} />
        </div>
      </div>
    );

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 'clamp(70px,10vh,100px) 16px 40px',
        background: 'linear-gradient(135deg,#0a3d2e 0%,#1e6b52 35%,#2ea065 70%,#4cd389 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <TwinklingStars count={28} />
      <FloatingPetals count={14} />

      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.18, pointerEvents: 'none', zIndex: 0 }}>
        <Mandala size={900} opacity={1} color="#ffffff" duration={120} />
      </div>

      <div
        style={{
          position: 'absolute',
          top: '15%',
          right: '-10%',
          opacity: 0.15,
          pointerEvents: 'none',
          zIndex: 0,
          animation: 'mandalaFloat 12s ease-in-out infinite',
        }}
      >
        <Mandala size={420} opacity={1} color="#ffd78c" duration={70} reverse />
      </div>

      <YogaSilhouette position="bottom-right" />
      <YogaSilhouette position="bottom-left" />

      <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 2 }}>
        {/* Logo + Title */}
        <div style={{ textAlign: 'center', marginBottom: 28, animation: 'fadeUp .8s ease both' }}>
          <div
            style={{
              width: 98,
              height: 98,
              borderRadius: '50%',
              margin: '0 auto 18px',
              position: 'relative',
              animation: 'lotusOpen 1.4s cubic-bezier(.34,1.56,.64,1) both',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: -8,
                borderRadius: '50%',
                border: '2px solid rgba(255,215,140,.45)',
                animation: 'auraRipple 3.5s ease-out infinite',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: -8,
                borderRadius: '50%',
                border: '2px solid rgba(76,211,137,.45)',
                animation: 'auraRipple 3.5s ease-out 1.5s infinite',
              }}
            />

            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: 'rgba(255,255,255,.22)',
                border: '2.5px solid rgba(255,255,255,.35)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(0,0,0,.18)',
                animation: 'breatheGlow 5s ease-in-out infinite',
              }}
            >
              <div style={{ animation: 'breathe 5s ease-in-out infinite' }}>
                <LotusLogo size={66} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 6 }}>
            <span className="yoga-shimmer-text" style={{ fontSize: 20, fontWeight: 800 }}>
              ॐ
            </span>
            <h1
              style={{
                margin: 0,
                color: '#fff',
                fontSize: 'clamp(26px,5.5vw,32px)',
                fontFamily: 'Cormorant Garamond,serif',
                fontWeight: 700,
                letterSpacing: 1,
              }}
              className="yoga-shimmer-text"
            >
              Admin Portal
            </h1>
            <span className="yoga-shimmer-text" style={{ fontSize: 20, fontWeight: 800 }}>
              ॐ
            </span>
          </div>

          <p style={{ color: 'rgba(255,255,255,.78)', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 500 }}>
            Yoga Temple • Secure Access
          </p>
        </div>

        {/* Card */}
        <div
          className="auth-card"
          style={{
            background: 'rgba(255,255,255,.97)',
            border: '1px solid rgba(76,211,137,.18)',
            borderRadius: 24,
            padding: 'clamp(24px,4vw,36px) clamp(20px,3.5vw,32px)',
            boxShadow: '0 32px 80px rgba(0,0,0,.25), 0 0 60px rgba(255,215,140,.15)',
            animation: 'scaleIn .5s cubic-bezier(.34,1.56,.64,1) .15s both',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: 'linear-gradient(90deg,#ffd78c,#4cd389,#2ea065,#005f2b,#4cd389,#ffd78c)',
              backgroundSize: '200% 100%',
              animation: 'shimmerTxt 6s linear infinite',
            }}
          />

          <div style={{ position: 'absolute', top: -100, right: -120, opacity: 0.04, pointerEvents: 'none' }}>
            <Mandala size={420} opacity={1} color="#005f2b" duration={160} />
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2
              style={{
                color: '#1a1208',
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 6,
                textAlign: 'center',
                fontFamily: 'Cormorant Garamond,serif',
              }}
            >
              Welcome Back
            </h2>
            <p style={{ color: '#9a8a6a', fontSize: 13, textAlign: 'center', marginBottom: 28 }}>
              Sign in to manage your Admin Dashboard 
            </p>

            {error && (
              <div
                style={{
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.22)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  marginBottom: 18,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  animation: 'shake .4s ease',
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
                <span style={{ color: C.red, fontSize: 13, lineHeight: 1.5, fontWeight: 600 }}>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Username */}
              <div style={{ marginBottom: 18 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.textMuted,
                    marginBottom: 8,
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                  }}
                >
                  Username or Email
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 16,
                      color: '#9a8a6a',
                      pointerEvents: 'none',
                      zIndex: 1,
                    }}
                  >
                    👤
                  </span>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                    autoComplete="username"
                    placeholder="Enter username or email"
                    style={inp()}
                    onFocus={focusIn}
                    onBlur={focusOut}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 22 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.textMuted,
                    marginBottom: 8,
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                  }}
                >
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 16,
                      color: '#9a8a6a',
                      pointerEvents: 'none',
                      zIndex: 1,
                    }}
                  >
                    🔒
                  </span>

                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    style={inp({ paddingRight: 54 })}
                    onFocus={focusIn}
                    onBlur={focusOut}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: C.textLight,
                      cursor: 'pointer',
                      fontSize: 16,
                      padding: 0,
                      zIndex: 2,
                    }}
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: loading ? C.border : 'linear-gradient(135deg,#4cd389,#2ea065)',
                  color: loading ? C.textLight : '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontFamily: 'inherit',
                  boxShadow: loading ? 'none' : '0 6px 20px rgba(0,95,43,.20)',
                  transition: 'all .25s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {!loading ? '🧘 Sign In to Admin' : '⏳ Signing in…'}
                {loading && <span style={{ position: 'absolute', left: -9999 }}>loading</span>}
              </button>

              {/* subtle yoga divider */}
              <div
                style={{
                  marginTop: 18,
                  paddingTop: 18,
                  borderTop: `1px solid ${C.border}`,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <a
                  href="/"
                  style={{
                    color: C.textLight,
                    fontSize: 12,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 600,
                    transition: 'color .2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = C.accentMid)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = C.textLight)}
                >
                  ← Back to Yoga Temple
                </a>
              </div>
            </form>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'rgba(255,255,255,.45)', fontSize: 11 }}>
          🔐 Secure admin access · Yoga Temple © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}