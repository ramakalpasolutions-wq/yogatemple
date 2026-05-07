// src/app/auth/page.js
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const AUTH_STYLES = `
  @keyframes spin          { to { transform: rotate(360deg); } }
  @keyframes spinSlow      { to { transform: rotate(360deg); } }
  @keyframes spinReverse   { to { transform: rotate(-360deg); } }
  @keyframes fadeIn        { from { opacity:0; } to { opacity:1; } }
  @keyframes fadeUp        { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  @keyframes scaleIn       { from { opacity:0; transform:scale(.92); } to { opacity:1; transform:scale(1); } }
  @keyframes slideDown     { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse         { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
  @keyframes glow          { 0%,100%{box-shadow:0 0 12px rgba(76,211,137,.25)} 50%{box-shadow:0 0 28px rgba(76,211,137,.5)} }
  @keyframes shake         { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
  @keyframes dotBounce     { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
  @keyframes float         { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes breathe       { 0%,100%{transform:scale(1);opacity:.85} 50%{transform:scale(1.12);opacity:1} }
  @keyframes breatheGlow   { 0%,100%{box-shadow:0 0 20px rgba(255,215,140,.3),0 0 40px rgba(76,211,137,.2)} 
                             50%{box-shadow:0 0 50px rgba(255,215,140,.6),0 0 90px rgba(76,211,137,.4)} }
  @keyframes lotusOpen     { from{transform:scale(.5) rotate(-30deg);opacity:0} to{transform:scale(1) rotate(0);opacity:1} }
  @keyframes petalFall     { 0%{transform:translateY(-100vh) rotate(0) translateX(0);opacity:0} 
                             10%{opacity:.7} 90%{opacity:.7} 
                             100%{transform:translateY(110vh) rotate(720deg) translateX(50px);opacity:0} }
  @keyframes auraRipple    { 0%{transform:scale(.8);opacity:.7} 100%{transform:scale(2.5);opacity:0} }
  @keyframes omPulse       { 0%,100%{transform:scale(1);filter:drop-shadow(0 0 6px rgba(255,215,140,.4))} 
                             50%{transform:scale(1.08);filter:drop-shadow(0 0 16px rgba(255,215,140,.8))} }
  @keyframes mandalaFloat  { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-20px) rotate(5deg)} }
  @keyframes shimmerTxt    { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes twinkle       { 0%,100%{opacity:.2;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }

  input::placeholder { color: rgba(107,90,62,0.45) !important; }
  select::placeholder { color: rgba(107,90,62,0.45) !important; }
  * { box-sizing: border-box; }

  .yoga-shimmer-text {
    background: linear-gradient(90deg, #fff 0%, #ffe9a8 25%, #fff 50%, #ffe9a8 75%, #fff 100%);
    background-size: 200% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmerTxt 4s linear infinite;
  }

  @media (max-width: 520px) {
    .auth-card   { padding: 24px 18px !important; margin: 0 8px !important; }
    .auth-logo   { width: 84px !important; height: 84px !important; }
    .auth-title  { font-size: 22px !important; }
    .yoga-mandala-bg { opacity: .12 !important; }
  }
`;

function useAuthStyles() {
  useEffect(() => {
    const id = 'auth-styles';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id; el.textContent = AUTH_STYLES;
    document.head.appendChild(el);
    return () => { try { document.head.removeChild(el); } catch {} };
  }, []);
}

const C = {
  bg: '#f4faf6', bgCard: '#ffffff', bgInput: '#fafffe',
  border: '#c8e6d4', borderFoc: '#2ea065',
  accent: '#005f2b', accentMid: '#2ea065', accentLight: '#4cd389',
  gold: '#c49a36', goldLight: '#f0c060',
  text: '#1a1208', textMuted: '#6b5a3e', textLight: '#9a8a6a',
  red: '#ef4444', white: '#ffffff',
};

const focusIn  = e => { e.target.style.borderColor = C.accentMid; e.target.style.boxShadow = '0 0 0 3px rgba(76,211,137,.12)'; };
const focusOut = e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; };

function Mandala({ size = 600, opacity = 0.18, color = '#ffffff', duration = 90, reverse = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200"
      style={{ opacity, animation: `${reverse ? 'spinReverse' : 'spinSlow'} ${duration}s linear infinite` }}>
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
          <line key={i} x1="100" y1="100"
            x2={100 + 35 * Math.cos((i * Math.PI) / 4)}
            y2={100 + 35 * Math.sin((i * Math.PI) / 4)}
            strokeWidth="0.6" />
        ))}
        <polygon points="100,75 115,100 100,125 85,100" />
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
          <ellipse key={i} cx="0" cy="-20" rx="10" ry="28"
            transform={`rotate(${rot})`}
            fill="url(#petalSide)" stroke="#4cd389" strokeWidth="0.5" opacity="0.85" />
        ))}
      </g>
      <g transform="translate(50,55)">
        {[-45, -15, 15, 45].map((rot, i) => (
          <ellipse key={i} cx="0" cy="-15" rx="9" ry="24"
            transform={`rotate(${rot})`}
            fill="url(#petal)" stroke="#2ea065" strokeWidth="0.6" />
        ))}
      </g>
      <circle cx="50" cy="55" r="8" fill="url(#lotusCenter)" />
      <circle cx="50" cy="55" r="3" fill="#c49a36" />
    </svg>
  );
}

function OmSymbol({ size = 24, color = '#ffd78c' }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: size, color,
      animation: 'omPulse 4s ease-in-out infinite',
      fontWeight: 'bold', lineHeight: 1,
    }}>ॐ</span>
  );
}

function FloatingPetals({ count = 14 }) {
  const [petals] = useState(() =>
    Array.from({ length: count }).map(() => ({
      left: Math.random() * 100,
      delay: Math.random() * 12,
      duration: 14 + Math.random() * 16,
      size: 10 + Math.random() * 18,
      rot: Math.random() * 360,
      hue: Math.random() > 0.5 ? '#ffe5b4' : '#a8e6c1',
    }))
  );
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {petals.map((p, i) => (
        <svg key={i} width={p.size} height={p.size * 1.4} viewBox="0 0 20 28"
          style={{
            position: 'absolute', left: `${p.left}%`, top: '-10%',
            animation: `petalFall ${p.duration}s linear ${p.delay}s infinite`,
            transform: `rotate(${p.rot}deg)`,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
          }}>
          <path d="M10,0 Q18,10 14,20 Q10,28 10,28 Q10,28 6,20 Q2,10 10,0 Z" fill={p.hue} opacity="0.7" />
        </svg>
      ))}
    </div>
  );
}

function TwinklingStars({ count = 25 }) {
  const [stars] = useState(() =>
    Array.from({ length: count }).map(() => ({
      top: Math.random() * 100, left: Math.random() * 100,
      size: 1 + Math.random() * 3,
      delay: Math.random() * 5, duration: 2 + Math.random() * 4,
    }))
  );
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {stars.map((s, i) => (
        <div key={i} style={{
          position: 'absolute', top: `${s.top}%`, left: `${s.left}%`,
          width: s.size, height: s.size, borderRadius: '50%',
          background: '#fff7d6', boxShadow: `0 0 ${s.size * 3}px #ffd78c`,
          animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
        }} />
      ))}
    </div>
  );
}

function YogaSilhouette({ position = 'bottom-right' }) {
  const pos = {
    'bottom-right': { bottom: 20, right: 20 },
    'bottom-left': { bottom: 20, left: 20 },
  }[position];
  return (
    <div style={{ position: 'absolute', ...pos, zIndex: 0, opacity: 0.18, pointerEvents: 'none', animation: 'breathe 6s ease-in-out infinite' }}>
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

function Field({ icon, label, children, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 700,
        color: C.textMuted, marginBottom: 6,
        letterSpacing: 1, textTransform: 'uppercase',
      }}>
        {label}{required && <span style={{ color: C.red, marginLeft: 2 }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{
            position: 'absolute', left: 14, top: '50%',
            transform: 'translateY(-50%)', fontSize: 15,
            color: C.textLight, pointerEvents: 'none', zIndex: 1,
          }}>{icon}</span>
        )}
        {children}
      </div>
    </div>
  );
}

const inp = (extra = {}) => ({
  width: '100%', padding: '12px 16px 12px 44px',
  background: C.bgInput, border: `1.5px solid ${C.border}`,
  borderRadius: 12, fontSize: 14, color: C.text,
  outline: 'none', transition: 'border-color .2s, box-shadow .2s',
  fontFamily: 'inherit', ...extra,
});

const inpNoIcon = (extra = {}) => ({
  width: '100%', padding: '12px 16px',
  background: C.bgInput, border: `1.5px solid ${C.border}`,
  borderRadius: 12, fontSize: 14, color: C.text,
  outline: 'none', transition: 'border-color .2s, box-shadow .2s',
  fontFamily: 'inherit', ...extra,
});

function OtpGrid({ values, onChange, id }) {
  return (
    <div style={{ display: 'flex', gap: 'clamp(6px,1.5vw,10px)', justifyContent: 'center' }}>
      {values.map((v, i) => (
        <input
          key={i} id={`${id}-${i}`}
          type="text" inputMode="numeric" maxLength={1}
          value={v} autoComplete="one-time-code"
          onChange={e => {
            const val = e.target.value.replace(/\D/g, '').slice(-1);
            const next = [...values]; next[i] = val; onChange(next);
            if (val && i < 5) document.getElementById(`${id}-${i + 1}`)?.focus();
          }}
          onKeyDown={e => {
            if (e.key === 'Backspace') {
              if (values[i]) { const n = [...values]; n[i] = ''; onChange(n); }
              else if (i > 0) document.getElementById(`${id}-${i - 1}`)?.focus();
            }
          }}
          onPaste={e => {
            e.preventDefault();
            const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
            if (!t) return;
            const n = [...values]; t.split('').forEach((ch, idx) => { if (idx < 6) n[idx] = ch; }); onChange(n);
            document.getElementById(`${id}-${Math.min(t.length, 5)}`)?.focus();
          }}
          style={{
            width: 'clamp(40px,8vw,48px)', height: 'clamp(48px,10vw,56px)',
            textAlign: 'center', fontSize: 'clamp(18px,4vw,22px)',
            fontWeight: 700, borderRadius: 12,
            border: v ? `2.5px solid ${C.accentMid}` : `2px solid ${C.border}`,
            background: v ? 'rgba(76,211,137,.08)' : C.bgInput,
            color: C.text, outline: 'none', transition: 'all .2s ease',
            fontFamily: 'inherit',
          }}
          onFocus={e => { e.target.style.borderColor = C.accentMid; e.target.style.boxShadow = '0 0 0 4px rgba(76,211,137,.15)'; }}
          onBlur={e => { e.target.style.borderColor = v ? C.accentMid : C.border; e.target.style.boxShadow = 'none'; }}
        />
      ))}
    </div>
  );
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const len = password.length;
  const s = len >= 12 ? 'strong' : len >= 8 ? 'medium' : 'weak';
  const colors = { strong: C.accentMid, medium: '#f59e0b', weak: C.red };
  const labels = { strong: '✅ Strong password', medium: '⚠️ Medium — add more characters', weak: '❌ Too weak — min 8 chars' };
  return (
    <div style={{ marginBottom: 12, marginTop: -4, animation: 'fadeIn .3s ease' }}>
      <div style={{ height: 4, background: 'rgba(0,0,0,.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 3,
          transition: 'width .4s ease, background .4s ease',
          width: s === 'strong' ? '100%' : s === 'medium' ? '60%' : '30%',
          background: colors[s],
        }} />
      </div>
      <span style={{ fontSize: 10, color: C.textLight, marginTop: 4, display: 'block', fontWeight: 500 }}>{labels[s]}</span>
    </div>
  );
}

function Alert({ type, message }) {
  if (!message) return null;
  const err = type === 'error';
  return (
    <div style={{
      background: err ? 'rgba(239,68,68,.06)' : 'rgba(76,211,137,.06)',
      border: `1px solid ${err ? 'rgba(239,68,68,.22)' : 'rgba(76,211,137,.22)'}`,
      borderRadius: 12, padding: '11px 14px', marginBottom: 16,
      display: 'flex', alignItems: 'flex-start', gap: 8,
      animation: err ? 'shake .4s ease' : 'fadeIn .3s ease',
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{err ? '⚠️' : '✅'}</span>
      <span style={{ color: err ? C.red : C.accentMid, fontSize: 13, lineHeight: 1.5, fontWeight: 500 }}>{message}</span>
    </div>
  );
}

function TabToggle({ active, options, onChange }) {
  return (
    <div style={{
      display: 'flex', background: 'rgba(76,211,137,.05)',
      borderRadius: 14, padding: 4, marginBottom: 22,
      border: '1px solid rgba(76,211,137,.12)',
    }}>
      {options.map(([value, label]) => (
        <button key={value} type="button" onClick={() => onChange(value)} style={{
          flex: 1, padding: '10px', borderRadius: 10,
          border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700,
          background: active === value ? 'linear-gradient(135deg,#4cd389,#2ea065)' : 'transparent',
          color: active === value ? '#fff' : C.textLight,
          fontFamily: 'inherit', transition: 'all .25s cubic-bezier(.4,0,.2,1)',
          boxShadow: active === value ? '0 4px 14px rgba(0,95,43,.22)' : 'none',
        }}>{label}</button>
      ))}
    </div>
  );
}

function ResendBtn({ cooldown, onClick }) {
  return (
    <div style={{ textAlign: 'center', marginTop: 16 }}>
      <button type="button" onClick={onClick} disabled={cooldown > 0} style={{
        background: 'none', border: 'none',
        color: cooldown > 0 ? C.textLight : C.accentMid,
        fontSize: 13, cursor: cooldown > 0 ? 'default' : 'pointer',
        fontFamily: 'inherit', fontWeight: 600,
      }}>
        {cooldown > 0 ? <>⏳ Resend in <strong>{cooldown}s</strong></> : '🔄 Resend OTP'}
      </button>
    </div>
  );
}

function SubmitBtn({ loading, label, loadingLabel }) {
  const [hov, setHov] = useState(false);
  return (
    <button type="submit" disabled={loading}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', padding: '14px',
        background: loading ? C.border : 'linear-gradient(135deg,#4cd389,#2ea065)',
        color: loading ? C.textLight : '#fff',
        border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontFamily: 'inherit',
        boxShadow: loading ? 'none' : hov ? '0 10px 32px rgba(0,95,43,.28)' : '0 6px 20px rgba(0,95,43,.20)',
        transform: hov && !loading ? 'translateY(-1px)' : 'none',
        transition: 'all .25s ease', position: 'relative', overflow: 'hidden',
      }}>
      {loading
        ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> {loadingLabel || 'Please wait…'}</>
        : label}
    </button>
  );
}

// ── HOW DID YOU KNOW OPTIONS ──
const HOW_OPTIONS = [
  { value: 'friends', label: '👥 Friends' },
  { value: 'family', label: '👨‍👩‍👧 Family Member' },
  { value: 'neighbours', label: '🏘️ Neighbours' },
  { value: 'social_media', label: '📱 Social Media' },
  { value: 'other', label: '✨ Other' },
];

const TIME_SLOTS = [
  '6:00 AM - 7:00 AM', '7:00 AM - 8:00 AM', '8:00 AM - 9:00 AM',
  '9:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM',
  '4:00 PM - 5:00 PM', '5:00 PM - 6:00 PM', '6:00 PM - 7:00 PM',
  '7:00 PM - 8:00 PM',
];

export default function AuthPage() {
  useAuthStyles();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showCPass, setShowCPass] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const coolRef = useRef(null);

  const [regForm, setRegForm] = useState({
    name: '', email: '', phone: '',
    problems: '', howKnow: '', howKnowOther: '',
    password: '', confirmPassword: '', preferredTime: '',
  });

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  useEffect(() => { if (status === 'authenticated') router.push('/'); }, [status, router]);
  useEffect(() => { setError(''); setSuccess(''); }, [mode]);
  useEffect(() => () => clearInterval(coolRef.current), []);

  const startCooldown = useCallback(() => {
    setCooldown(60);
    clearInterval(coolRef.current);
    coolRef.current = setInterval(() => {
      setCooldown(p => { if (p <= 1) { clearInterval(coolRef.current); return 0; } return p - 1; });
    }, 1000);
  }, []);

  const setReg = f => e => setRegForm(p => ({ ...p, [f]: e.target.value }));
  const setLog = f => e => setLoginForm(p => ({ ...p, [f]: e.target.value }));

  // ── REGISTER ──
  const handleRegister = async e => {
    e.preventDefault(); setError('');
    if (!regForm.name.trim()) return setError('Full name is required');
    if (!regForm.email.trim()) return setError('Email is required');
    if (!regForm.phone.trim()) return setError('Mobile number is required');
    if (!regForm.problems.trim()) return setError('Please describe your problems');
    if (!regForm.howKnow) return setError('Please tell us how you know about us');
    if (regForm.howKnow === 'other' && !regForm.howKnowOther.trim()) return setError('Please specify how you know about us');
    if (!regForm.password) return setError('Password is required');
    if (regForm.password.length < 8) return setError('Password must be at least 8 characters');
    if (regForm.password !== regForm.confirmPassword) return setError('Passwords do not match');
    if (!regForm.preferredTime) return setError('Please select a convenient time');

    setLoading(true);
    try {
      const payload = {
        name: regForm.name,
        email: regForm.email,
        phone: regForm.phone,
        address: regForm.problems,
        howKnow: regForm.howKnow === 'other' ? `Other: ${regForm.howKnowOther}` : HOW_OPTIONS.find(o => o.value === regForm.howKnow)?.label,
        preferredTime: regForm.preferredTime,
        password: regForm.password,
      };
      await axios.post('/api/auth/register', payload);
      setPendingEmail(regForm.email);
      setMode('verifyEmail');
      setSuccess('Registration successful! Please verify your email with the OTP sent.');
      startCooldown();
    } catch (err) { setError(err.response?.data?.error || 'Registration failed'); }
    finally { setLoading(false); }
  };

  // ── VERIFY EMAIL ──
  const handleVerifyEmail = async e => {
    e.preventDefault();
    const otp = emailOtp.join('');
    if (otp.length < 6) return setError('Enter all 6 digits');
    setLoading(true); setError('');
    try {
      await axios.post('/api/auth/verify-otp', { email: pendingEmail, otp });
      setEmailOtp(['', '', '', '', '', '']);
      setSuccess('✅ Email verified! Redirecting to sign in…');
      setTimeout(() => { setMode('login'); setSuccess(''); }, 2000);
    } catch (err) { setError(err.response?.data?.error || 'Invalid OTP'); }
    finally { setLoading(false); }
  };

  // ── PASSWORD LOGIN ──
  const handlePasswordLogin = async e => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await signIn('credentials', {
        email: loginForm.email, password: loginForm.password, redirect: false,
      });
      if (res?.error) throw new Error(res.error);
      router.push('/');
    } catch (err) { setError(err.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  // ── RESEND EMAIL OTP ──
  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(''); setSuccess('');
    try {
      await axios.post('/api/auth/resend-otp', { email: pendingEmail });
      startCooldown(); setSuccess('OTP resent!');
    } catch { setError('Failed to resend OTP'); }
  };

  if (status === 'loading') return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#0a3d2e 0%,#1e6b52 50%,#4cd389 100%)',
      flexDirection: 'column', position: 'relative', overflow: 'hidden',
    }}>
      <TwinklingStars count={30} />
      <div style={{ position: 'relative', animation: 'breathe 4s ease-in-out infinite' }}>
        <div style={{
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'breatheGlow 4s ease-in-out infinite',
        }}>
          <LotusLogo size={70} />
        </div>
      </div>
      <div style={{ marginTop: 24, color: '#fff', fontSize: 14, opacity: .8, letterSpacing: 2 }}>
        ॐ &nbsp; Breathing in… breathing out… &nbsp; ॐ
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
        {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffd78c', animation: `dotBounce 1.4s ease ${i * 0.16}s infinite` }} />)}
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', padding: 'clamp(70px,10vh,100px) 16px 40px',
      background: 'linear-gradient(135deg,#0a3d2e 0%,#1e6b52 35%,#2ea065 70%,#4cd389 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <TwinklingStars count={28} />
      <FloatingPetals count={14} />

      <div className="yoga-mandala-bg" style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        opacity: .18, pointerEvents: 'none', zIndex: 0,
      }}>
        <Mandala size={900} opacity={1} color="#ffffff" duration={120} />
      </div>

      <div style={{ position: 'absolute', top: '15%', right: '-10%', opacity: .15, pointerEvents: 'none', zIndex: 0 }}>
        <Mandala size={400} opacity={1} color="#ffd78c" duration={70} reverse />
      </div>

      <YogaSilhouette position="bottom-right" />
      <YogaSilhouette position="bottom-left" />

      <div style={{ position: 'absolute', top: '-8%', right: '-12%', width: 'clamp(200px,40vw,500px)', height: 'clamp(200px,40vw,500px)', borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,215,140,.15) 0%,transparent 70%)', pointerEvents: 'none', animation: 'float 8s ease-in-out infinite', zIndex: 0 }} />

      <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 2 }}>

        {/* Logo + Title */}
        <div style={{ textAlign: 'center', marginBottom: 28, animation: 'fadeUp .8s ease both' }}>
          <div className="auth-logo" style={{ width: 96, height: 96, margin: '0 auto 18px', position: 'relative', animation: 'lotusOpen 1.4s cubic-bezier(.34,1.56,.64,1) both' }}>
            <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '2px solid rgba(255,215,140,.45)', animation: 'auraRipple 3.5s ease-out infinite' }} />
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'rgba(255,255,255,.22)', border: '2.5px solid rgba(255,255,255,.35)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'breatheGlow 5s ease-in-out infinite' }}>
              <div style={{ animation: 'breathe 5s ease-in-out infinite' }}><LotusLogo size={64} /></div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 6 }}>
            <OmSymbol size={20} />
            <h1 className="auth-title yoga-shimmer-text" style={{ fontSize: 'clamp(26px,5.5vw,32px)', fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, margin: 0, letterSpacing: 1 }}>
              Yoga Temple
            </h1>
            <OmSymbol size={20} />
          </div>
          <p style={{ color: 'rgb(255,255,255)', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 900 }}>
            🌿 వ్యాయామం · ఆహారం · ఔషధం 🌿
          </p>
        </div>

        {/* Card */}
        <div className="auth-card" style={{
          background: 'rgba(255,255,255,.97)', border: '1px solid rgba(76,211,137,.18)',
          borderRadius: 24, padding: 'clamp(24px,4vw,36px) clamp(20px,3.5vw,32px)',
          boxShadow: '0 32px 80px rgba(0,0,0,.25), 0 0 60px rgba(255,215,140,.15)',
          animation: 'scaleIn .5s cubic-bezier(.34,1.56,.64,1) .15s both',
          position: 'relative', overflow: 'hidden', backdropFilter: 'blur(20px)',
        }}>
          {/* Top accent line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#ffd78c,#4cd389,#2ea065,#005f2b,#4cd389,#ffd78c)', backgroundSize: '200% 100%', animation: 'shimmerTxt 6s linear infinite' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>

            {/* Tab Switcher */}
            {(mode === 'login' || mode === 'register') && (
              <TabToggle
                active={mode}
                options={[['login', '🙏 Sign In'], ['register', '🌟 Sign Up']]}
                onChange={v => { setMode(v); setError(''); setSuccess(''); }}
              />
            )}

            <Alert type="error" message={error} />
            <Alert type="success" message={success} />

            {/* ════ REGISTER ════ */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} autoComplete="off" style={{ animation: 'fadeUp .3s ease' }}>

                {/* Full Name */}
                <Field icon="👤" label="Full Name" required>
                  <input style={inp()} placeholder="Your full name" value={regForm.name} onChange={setReg('name')} onFocus={focusIn} onBlur={focusOut} />
                </Field>

                {/* Email */}
                <Field icon="✉️" label="Email Address" required>
                  <input style={inp()} type="email" placeholder="your@email.com" value={regForm.email} onChange={setReg('email')} onFocus={focusIn} onBlur={focusOut} />
                </Field>

                {/* Mobile */}
                <Field icon="📱" label="Mobile Number" required>
                  <input style={inp()} type="tel" placeholder="+91 98765 43210" value={regForm.phone} onChange={setReg('phone')} onFocus={focusIn} onBlur={focusOut} />
                  <span style={{ fontSize: 10, color: C.textLight, marginTop: 3, display: 'block', paddingLeft: 2 }}>
                    📝 Verification not required for mobile
                  </span>
                </Field>

                {/* Problems */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>
                    Your Problems <span style={{ color: C.red }}>*</span>
                  </label>
                  <textarea
                    placeholder="Describe your health concerns or problems…"
                    value={regForm.problems}
                    onChange={setReg('problems')}
                    rows={3}
                    onFocus={focusIn} onBlur={focusOut}
                    style={{
                      width: '100%', padding: '12px 16px',
                      background: C.bgInput, border: `1.5px solid ${C.border}`,
                      borderRadius: 12, fontSize: 14, color: C.text,
                      outline: 'none', transition: 'border-color .2s, box-shadow .2s',
                      fontFamily: 'inherit', resize: 'vertical', minHeight: 80,
                    }}
                  />
                </div>

                {/* How do you know about us */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>
                    How Do You Know About Us <span style={{ color: C.red }}>*</span>
                  </label>
                  <select
                    value={regForm.howKnow}
                    onChange={setReg('howKnow')}
                    onFocus={focusIn} onBlur={focusOut}
                    style={{
                      width: '100%', padding: '12px 16px',
                      background: C.bgInput, border: `1.5px solid ${C.border}`,
                      borderRadius: 12, fontSize: 14, color: regForm.howKnow ? C.text : C.textLight,
                      outline: 'none', transition: 'border-color .2s, box-shadow .2s',
                      fontFamily: 'inherit', cursor: 'pointer', appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239a8a6a' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
                    }}
                  >
                    <option value="">— Select an option —</option>
                    {HOW_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>

                  {/* Show text input when any option is selected */}
                  {regForm.howKnow && (
                    <div style={{ marginTop: 10, animation: 'slideDown .25s ease' }}>
                      <input
                        style={inpNoIcon()}
                        placeholder={
                          regForm.howKnow === 'friends' ? 'Friend\'s name' :
                          regForm.howKnow === 'family' ? 'Family member\'s name ' :
                          regForm.howKnow === 'neighbours' ? 'Neighbour\'s name ' :
                          regForm.howKnow === 'social_media' ? 'Which platform? (e.g. Instagram, Facebook)' :
                          'Please specify…'
                        }
                        value={regForm.howKnowOther}
                        onChange={setReg('howKnowOther')}
                        onFocus={focusIn} onBlur={focusOut}
                      />
                    </div>
                  )}
                </div>

                {/* Password */}
                <Field icon="🔒" label="Password" required>
                  <input
                    style={inp({ paddingRight: 46 })}
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={regForm.password}
                    onChange={setReg('password')}
                    onFocus={focusIn} onBlur={focusOut}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.textLight, cursor: 'pointer', fontSize: 15 }}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </Field>
                <PasswordStrength password={regForm.password} />

                {/* Confirm Password */}
                <Field icon="🔒" label="Re-enter Password" required>
                  <input
                    style={inp({ paddingRight: 46 })}
                    type={showCPass ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={regForm.confirmPassword}
                    onChange={setReg('confirmPassword')}
                    onFocus={focusIn} onBlur={focusOut}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowCPass(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.textLight, cursor: 'pointer', fontSize: 15 }}>
                    {showCPass ? '🙈' : '👁️'}
                  </button>
                </Field>

                {/* Preferred Time */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>
                    🕐 Convenient Time for You <span style={{ color: C.red }}>*</span>
                  </label>
                  <select
                    value={regForm.preferredTime}
                    onChange={setReg('preferredTime')}
                    onFocus={focusIn} onBlur={focusOut}
                    style={{
                      width: '100%', padding: '12px 16px',
                      background: C.bgInput, border: `1.5px solid ${C.border}`,
                      borderRadius: 12, fontSize: 14,
                      color: regForm.preferredTime ? C.text : C.textLight,
                      outline: 'none', transition: 'border-color .2s, box-shadow .2s',
                      fontFamily: 'inherit', cursor: 'pointer', appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239a8a6a' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
                    }}
                  >
                    <option value="">— Select a time slot —</option>
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <SubmitBtn loading={loading} label="🌟 Create Account" loadingLabel="Creating Account…" />
              </form>
            )}

            {/* ════ VERIFY EMAIL ════ */}
            {mode === 'verifyEmail' && (
              <div style={{ animation: 'fadeUp .3s ease' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 52, marginBottom: 12, animation: 'float 3s ease-in-out infinite' }}>✉️</div>
                  <h2 style={{ color: C.text, fontSize: 22, marginBottom: 8, fontFamily: 'Cormorant Garamond,serif', fontWeight: 700 }}>Verify Your Email</h2>
                  <p style={{ color: C.textLight, fontSize: 13, lineHeight: 1.6 }}>
                    Enter the 6-digit OTP sent to<br />
                    <strong style={{ color: C.accentMid }}>{pendingEmail}</strong>
                  </p>
                </div>
                <form onSubmit={handleVerifyEmail}>
                  <div style={{ marginBottom: 24 }}>
                    <OtpGrid values={emailOtp} onChange={setEmailOtp} id="email-otp" />
                  </div>
                  <SubmitBtn loading={loading} label="✅ Verify & Go to Sign In" loadingLabel="Verifying…" />
                  <ResendBtn cooldown={cooldown} onClick={handleResend} />
                  <div style={{ textAlign: 'center', marginTop: 14 }}>
                    <button type="button" onClick={() => setMode('register')} style={{ background: 'none', border: 'none', color: C.textLight, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                      ← Back to Registration
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ════ LOGIN ════ */}
            {mode === 'login' && (
              <form onSubmit={handlePasswordLogin} style={{ animation: 'fadeUp .3s ease' }} autoComplete="on">

                <Field icon="✉️" label="Email Address" required>
                  <input
                    style={inp()} type="email"
                    placeholder="your@email.com"
                    value={loginForm.email}
                    onChange={setLog('email')}
                    onFocus={focusIn} onBlur={focusOut}
                    autoComplete="email"
                    required
                  />
                </Field>

                <Field icon="🔒" label="Password" required>
                  <input
                    style={inp({ paddingRight: 46 })}
                    type={showPass ? 'text' : 'password'}
                    placeholder="Your password"
                    value={loginForm.password}
                    onChange={setLog('password')}
                    onFocus={focusIn} onBlur={focusOut}
                    autoComplete="current-password"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.textLight, cursor: 'pointer', fontSize: 15 }}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </Field>

                {/* Info note */}
                <div style={{
                  background: 'rgba(76,211,137,.06)', border: '1px solid rgba(76,211,137,.15)',
                  borderRadius: 10, padding: '10px 14px', marginBottom: 18,
                  fontSize: 12, color: C.textMuted, lineHeight: 1.5,
                }}>
                  📧 Email verification is required after registration before you can sign in.
                </div>

                <SubmitBtn loading={loading} label="🙏 Sign In" loadingLabel="Signing in…" />
              </form>
            )}

            {/* Back to site */}
            {(mode === 'login' || mode === 'register') && (
              <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                <a href="/" style={{ color: C.textLight, fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 500, transition: 'color .2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = C.accentMid}
                  onMouseLeave={e => e.currentTarget.style.color = C.textLight}>
                  ← Back to Yoga Temple
                </a>
              </div>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'rgba(255,255,255,.55)', fontSize: 11, letterSpacing: 2 }}>
          ॐ &nbsp; <span style={{ fontStyle: 'italic' }}>Lokāḥ Samastāḥ Sukhino Bhavantu</span> &nbsp; ॐ
        </p>
        <p style={{ textAlign: 'center', marginTop: 6, color: 'rgba(255,255,255,.35)', fontSize: 10 }}>
          🔐 Secure · Yoga Temple © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}