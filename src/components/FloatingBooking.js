// src/components/FloatingBooking.js
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';

/* ── DD/MM/YYYY date helpers ── */
function toDDMMYYYY(isoDate) {
  // 'YYYY-MM-DD' → 'DD/MM/YYYY'
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y}`;
}

function toISODate(ddmmyyyy) {
  // 'DD/MM/YYYY' → 'YYYY-MM-DD'
  if (!ddmmyyyy) return '';
  const parts = ddmmyyyy.replace(/[^\d]/g, '');
  if (parts.length < 8) return '';
  const d = parts.slice(0, 2);
  const m = parts.slice(2, 4);
  const y = parts.slice(4, 8);
  return `${y}-${m}-${d}`;
}

function isValidDate(ddmmyyyy) {
  const iso = toISODate(ddmmyyyy);
  if (!iso || iso.length < 10) return false;
  const date = new Date(iso);
  return !isNaN(date.getTime());
}

/* ── DD/MM/YYYY date input component ── */
function DateInput({ value, onChange, min, placeholder = 'DD/MM/YYYY' }) {
  const [foc, setFoc] = useState(false);
  // value is stored as 'YYYY-MM-DD' internally, displayed as 'DD/MM/YYYY'
  const [display, setDisplay] = useState(toDDMMYYYY(value));

  // Sync display when value changes externally
  useEffect(() => {
    setDisplay(toDDMMYYYY(value));
  }, [value]);

  const handleChange = (e) => {
    let raw = e.target.value;

    // Only allow digits and slashes
    raw = raw.replace(/[^\d/]/g, '');

    // Auto-insert slashes
    const digits = raw.replace(/\//g, '');
    let formatted = '';
    for (let i = 0; i < digits.length && i < 8; i++) {
      if (i === 2 || i === 4) formatted += '/';
      formatted += digits[i];
    }

    setDisplay(formatted);

    // Only fire onChange when we have a complete valid date
    if (formatted.length === 10) {
      const iso = toISODate(formatted);
      if (isValidDate(formatted)) {
        // Check if >= min date
        if (min && iso < min) return;
        onChange(iso);
      }
    } else {
      // Clear the stored value if user is typing an incomplete date
      onChange('');
    }
  };

  const handleBlur = () => {
    setFoc(false);
    // If display is incomplete, reset it
    if (display.length > 0 && display.length < 10) {
      setDisplay('');
      onChange('');
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={display}
      onChange={handleChange}
      onFocus={() => setFoc(true)}
      onBlur={handleBlur}
      maxLength={10}
      style={{
        width: '100%',
        padding: '12px 14px 12px 42px',
        border: foc ? '1.5px solid #2ea065' : '1.5px solid #e8e0d0',
        borderRadius: 10,
        fontSize: 14,
        color: '#1a1208',
        outline: 'none',
        boxSizing: 'border-box',
        background: foc ? '#fff' : '#faf7f2',
        fontFamily: 'inherit',
        boxShadow: foc ? '0 0 0 3px rgba(46,160,101,.12)' : 'none',
        transition: 'border-color .2s ease, box-shadow .2s ease, background .2s ease',
        letterSpacing: display.length > 0 ? '1px' : 'normal',
      }}
    />
  );
}

const ALL_STYLES = `
  @keyframes floatPulse{0%,100%{box-shadow:0 4px 20px rgba(76,211,137,.3)}50%{box-shadow:0 4px 32px rgba(76,211,137,.55)}}
  @keyframes fbSlideUp{from{opacity:0;transform:translateY(30px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes fbFadeIn{from{opacity:0}to{opacity:1}}
  @keyframes fbCheckmark{0%{transform:scale(0) rotate(-45deg);opacity:0}60%{transform:scale(1.2);opacity:1}100%{transform:scale(1);opacity:1}}
  @keyframes fbSpin{to{transform:rotate(360deg)}}
  @keyframes labelSlide{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}
  @keyframes labelPulse{0%,100%{opacity:1}50%{opacity:.75}}

  @media(max-width:500px){
    .fb-modal{
      bottom:0!important;
      right:0!important;
      left:0!important;
      width:100%!important;
      border-radius:20px 20px 0 0!important;
      max-height:90vh!important;
    }
  }
`;

function useFloatingStyles() {
  useEffect(() => {
    const id = 'fb-all-styles';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id;
    el.textContent = ALL_STYLES;
    document.head.appendChild(el);
    return () => {
      try { document.head.removeChild(el); } catch {}
    };
  }, []);
}

function loadRazorpay() {
  return new Promise(resolve => {
    if (typeof window !== 'undefined' && window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function Field({ icon, children }) {
  return (
    <div style={{ position:'relative', marginBottom:14 }}>
      <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:15, color:'#9a8a6a', pointerEvents:'none', zIndex:1, lineHeight:1 }}>
        {icon}
      </span>
      {children}
    </div>
  );
}

function FbInput({ type='text', placeholder, value, onChange, min, autoComplete }) {
  const [foc, setFoc] = useState(false);
  return (
    <input
      type={type} placeholder={placeholder} value={value} onChange={onChange}
      min={min} autoComplete={autoComplete}
      onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
      style={{
        width:'100%', padding:'12px 14px 12px 42px',
        border: foc ? '1.5px solid #2ea065' : '1.5px solid #e8e0d0',
        borderRadius:10, fontSize:14, color:'#1a1208', outline:'none',
        boxSizing:'border-box', background: foc ? '#fff' : '#faf7f2',
        fontFamily:'inherit',
        boxShadow: foc ? '0 0 0 3px rgba(46,160,101,.12)' : 'none',
        transition:'border-color .2s ease, box-shadow .2s ease, background .2s ease',
      }}
    />
  );
}

export default function FloatingBooking() {
  useFloatingStyles();

  const { data:session, status } = useSession();
  const router   = useRouter();
  const pathname = usePathname();

  const [open,    setOpen]    = useState(false);
  const [step,    setStep]    = useState('form');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [result,  setResult]  = useState(null);
  const [btnHov,  setBtnHov]  = useState(false);
  const [payHov,  setPayHov]  = useState(false);
  const [doneHov, setDoneHov] = useState(false);

  const AMOUNT = parseInt(process.env.NEXT_PUBLIC_BOOKING_AMOUNT || '499', 10);

  const [form, setForm] = useState({ name:'', phone:'', email:'', date:'', time:'' });

  useEffect(() => {
    if (session?.user) {
      setForm(p => ({
        ...p,
        name:  p.name  || session.user.name  || '',
        email: p.email || session.user.email || '',
      }));
    }
  }, [session]);

  /* Hide on admin pages */
  if (pathname?.startsWith('/admin')) return null;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleOpen = () => {
    if (status === 'unauthenticated') { router.push('/auth'); return; }
    setOpen(true);
    setStep('form');
    setError('');
  };

  const handleClose = () => {
    if (step === 'paying') return;
    setOpen(false);
    if (step === 'success') {
      setStep('form');
      setResult(null);
      setForm({
        name:  session?.user?.name  || '',
        email: session?.user?.email || '',
        phone:'', date:'', time:'',
      });
      setError('');
    }
  };

  const setField = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

    const validate = () => {
    if (!form.name.trim())  return 'Please enter your name';
    if (!form.phone.trim()) return 'Please enter your phone number';
    if (!form.phone.match(/^[+]?\d{10,13}$/)) return 'Enter a valid 10-digit phone number';
    if (!form.email.trim()) return 'Please enter your email';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return 'Enter a valid email address';
    if (!form.date)  return 'Please select a date (DD/MM/YYYY)';
    // ★ Validate the date is not in the past
    if (form.date < minDate) return 'Please select a future date';
    if (!form.time)  return 'Please select a time';
    return null;
  };

  const handlePay = async () => {
    const ve = validate();
    if (ve) { setError(ve); return; }
    setError('');
    setLoading(true);
    setStep('paying');
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Payment gateway failed to load');

      const { data:order } = await axios.post('/api/bookings/schedule', { action:'create-order' });

      const rzp = new window.Razorpay({
        key:         order.keyId,
        amount:      order.amount * 100,
        currency:    order.currency,
        name:        'Yoga Temple',
        description: `Required Session — ₹${order.amount}`,
        order_id:    order.orderId,
        prefill: { name:form.name, email:form.email, contact:form.phone },
        theme: { color:'#005f2b' },
        handler: async resp => {
          try {
            const { data:res } = await axios.post('/api/bookings/schedule', {
              action:            'verify-payment',
              razorpayOrderId:   resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
              name:  form.name,
              phone: form.phone,
              email: form.email,
              date:  form.date,
              time:  form.time,
            });
            setResult(res);
            setStep('success');
          } catch (e) {
            setError(e.response?.data?.error || 'Verification failed');
            setStep('error');
          }
          setLoading(false);
        },
        modal: { ondismiss: () => { setStep('form'); setLoading(false); } },
      });

      rzp.on('payment.failed', r => {
        setError(r.error?.description || 'Payment failed');
        setStep('error');
        setLoading(false);
      });

      rzp.open();
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Something went wrong');
      setStep('error');
      setLoading(false);
    }
  };

  return (
    <>
      {/* ══ FLOATING BUTTON with PERMANENT LABEL ══ */}
         {/* ══ FLOATING BUTTON with LABEL ABOVE ══ */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 20,
        zIndex: 9990,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
      }}>

        {/* ── Label ABOVE the button — like a location pin tooltip ── */}
        {!open && (
          <div
            onClick={handleOpen}
            onMouseEnter={() => setBtnHov(true)}
            onMouseLeave={() => setBtnHov(false)}
            style={{
              background: 'linear-gradient(135deg, #005f2b, #2ea065)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 11,
              padding: '8px 16px',
              borderRadius: 12,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              animation: 'labelSlide .4s ease',
              letterSpacing: .3,
              textAlign: 'center',
              lineHeight: 1.4,
              position: 'relative',
              boxShadow: btnHov
                ? '0 6px 24px rgba(0,95,43,.45)'
                : '0 3px 14px rgba(0,95,43,.25)',
              transform: btnHov ? 'translateY(-2px)' : 'translateY(0)',
              transition: 'all .25s ease',
              marginBottom: -6,
            }}
          >
            Book Your
            <br />
            Required Session

            {/* ── Triangle pointer (arrow pointing down to button) ── */}
            <div style={{
              position: 'absolute',
              bottom: -7,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid #2ea065',
            }} />
          </div>
        )}

        {/* ── Round FAB button ── */}
        <button
          onClick={open ? handleClose : handleOpen}
          onMouseEnter={() => setBtnHov(true)}
          onMouseLeave={() => setBtnHov(false)}
          aria-label="Book a required session"
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: open
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
              : 'linear-gradient(135deg, #2ea065, #4cd389)',
            color: '#fff',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
            zIndex: 9990,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: open ? 'none' : 'floatPulse 2.5s ease-in-out infinite',
            transform: btnHov ? 'scale(1.1)' : 'scale(1)',
            transition: 'all .25s cubic-bezier(.34,1.56,.64,1)',
            flexShrink: 0,
            boxShadow: open
              ? '0 4px 16px rgba(239,68,68,.3)'
              : '0 4px 20px rgba(76,211,137,.35)',
            position: 'relative',
          }}
        >
          <span style={{
            display: 'inline-block',
            transition: 'transform .3s cubic-bezier(.34,1.56,.64,1)',
            transform: open ? 'rotate(135deg)' : 'rotate(0)',
            fontSize: open ? 20 : 24,
          }}>
            {open ? '✕' : '📅'}
          </span>
        </button>
      </div>

      {/* ── Overlay ── */}
      {open && (
        <div
          onClick={handleClose}
          style={{
            position:'fixed', inset:0, zIndex:9998,
            background:'rgba(0,0,0,.5)',
            backdropFilter:'blur(5px)',
            WebkitBackdropFilter:'blur(5px)',
            animation:'fbFadeIn .3s ease',
          }}
        />
      )}

      {/* ── Modal ── */}
      {open && (
        <div className="fb-modal" style={{
          position:'fixed', zIndex:9999,
          bottom:'clamp(0px,5vw,100px)',
          right:'clamp(0px,3vw,24px)',
          left:'auto',
          width:'min(400px,100vw)',
          maxHeight:'calc(100vh - 140px)',
          overflowY:'auto',
          background:'#fff',
          borderRadius:'clamp(0px,3vw,20px)',
          boxShadow:'0 24px 80px rgba(0,0,0,.2)',
          animation:'fbSlideUp .35s cubic-bezier(.34,1.56,.64,1)',
        }}>
          {/* Header */}
          <div style={{
            background:'linear-gradient(135deg,#005f2b,#2ea065)',
            padding:'20px 24px',
            borderRadius:'clamp(0px,3vw,20px) clamp(0px,3vw,20px) 0 0',
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <div>
              <h3 style={{ color:'#fff', fontSize:18, fontWeight:700, margin:0 }}>
                {step === 'success' ? '✅ Booking Confirmed!' : '📅 Book Your Required Session'}
              </h3>
              <p style={{ color:'rgba(255,255,255,.75)', fontSize:12, margin:'4px 0 0' }}>
                {step === 'success' ? 'Receipt sent to your email' : `Personal yoga session · ₹${AMOUNT}`}
              </p>
            </div>
            <button onClick={handleClose} style={{
              background:'rgba(255,255,255,.15)', border:'none',
              color:'#fff', width:32, height:32, borderRadius:'50%',
              fontSize:16, cursor:'pointer', flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'inherit', transition:'background .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.28)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,.15)'}
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div style={{ padding:24 }}>

            {/* FORM / ERROR */}
            {(step === 'form' || step === 'error') && (
              <>
                {error && (
                  <div style={{
                    background:'#fef2f2', border:'1px solid #fecaca',
                    borderRadius:10, padding:'10px 14px', marginBottom:16,
                    display:'flex', alignItems:'flex-start', gap:8,
                  }}>
                    <span style={{ flexShrink:0 }}>⚠️</span>
                    <span style={{ color:'#dc2626', fontSize:13 }}>{error}</span>
                  </div>
                )}

                <Field icon="👤">
                  <FbInput placeholder="Full Name" value={form.name} onChange={setField('name')} autoComplete="name" />
                </Field>
                <Field icon="📱">
                  <FbInput type="tel" placeholder="Phone (+91...)" value={form.phone} onChange={setField('phone')} autoComplete="tel" />
                </Field>
                <Field icon="✉️">
                  <FbInput type="email" placeholder="Email Address" value={form.email} onChange={setField('email')} autoComplete="email" />
                </Field>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <Field icon="📅">
                    {/* ★ DD/MM/YYYY custom date input */}
                    <DateInput
                      value={form.date}
                      min={minDate}
                      onChange={val => setForm(p => ({ ...p, date: val }))}
                    />
                  </Field>
                  <Field icon="⏰">
                    <FbInput type="time" value={form.time} onChange={setField('time')} />
                  </Field>
                </div>

                {/* Price summary */}
                <div style={{
                  background:'#f0faf4', borderRadius:12, padding:'14px 16px',
                  margin:'16px 0 20px', border:'1px solid rgba(76,211,137,.15)',
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                }}>
                  <div>
                    <p style={{ fontSize:13, color:'#6b5a3e', margin:0, fontWeight:600 }}>Required Session</p>
                    <p style={{ fontSize:11, color:'#9a8a6a', margin:'3px 0 0' }}>Personal guidance included</p>
                  </div>
                  <p style={{ fontSize:26, fontWeight:800, color:'#005f2b', margin:0, fontFamily:'Cormorant Garamond,serif' }}>
                    ₹{AMOUNT}
                  </p>
                </div>

                {/* Pay button */}
                <button onClick={handlePay} disabled={loading}
                  onMouseEnter={() => setPayHov(true)}
                  onMouseLeave={() => setPayHov(false)}
                  style={{
                    width:'100%', padding:'15px',
                    background: loading ? 'rgba(0,95,43,.5)' : payHov ? 'linear-gradient(135deg,#2ea065,#4cd389)' : 'linear-gradient(135deg,#005f2b,#2ea065)',
                    color:'#fff', border:'none', borderRadius:12, fontSize:16, fontWeight:700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    transform: payHov && !loading ? 'translateY(-1px)' : 'translateY(0)',
                    boxShadow: payHov && !loading ? '0 8px 24px rgba(0,95,43,.25)' : 'none',
                    transition:'all .22s ease', fontFamily:'inherit',
                  }}
                >
                  {loading ? '⏳ Please wait…' : `Pay ₹${AMOUNT} & Confirm →`}
                </button>

                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:12, opacity:.45 }}>
                  <span style={{ fontSize:12 }}>🔒</span>
                  <span style={{ fontSize:11, color:'#6b5a3e' }}>100% secure · Powered by Razorpay</span>
                </div>
              </>
            )}

            {/* PAYING */}
            {step === 'paying' && (
              <div style={{ textAlign:'center', padding:'40px 0' }}>
                <div style={{ width:56, height:56, borderRadius:'50%', border:'4px solid #e8e0d0', borderTopColor:'#2ea065', animation:'fbSpin 1s linear infinite', margin:'0 auto 20px' }} />
                <p style={{ color:'#1a1208', fontWeight:600, fontSize:16, marginBottom:6 }}>Processing Payment…</p>
                <p style={{ color:'#9a8a6a', fontSize:13 }}>Complete the payment in the Razorpay window</p>
              </div>
            )}

            {/* SUCCESS */}
            {step === 'success' && (
              <div style={{ textAlign:'center' }}>
                <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#4cd389,#2ea065)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', animation:'fbCheckmark .5s cubic-bezier(.34,1.56,.64,1)' }}>
                  <span style={{ fontSize:40, color:'#fff', lineHeight:1 }}>✓</span>
                </div>
                <h3 style={{ fontSize:22, fontWeight:700, color:'#005f2b', marginBottom:6, fontFamily:'Cormorant Garamond,serif' }}>
                  Required Session Booked! 🎉
                </h3>
                <p style={{ color:'#6b5a3e', fontSize:13, marginBottom:20 }}>
                  Receipt sent to <strong>{form.email}</strong>
                </p>
                <div style={{ background:'#f0faf4', borderRadius:14, padding:16, textAlign:'left', border:'1px solid rgba(76,211,137,.15)', marginBottom:20 }}>
                  {[
                    ['📅','Date', form.date ? toDDMMYYYY(form.date) : '—'],
                    ['⏰','Time',        form.time || '—'],
                    ['💰','Amount Paid', `₹${AMOUNT}`],
                    ['🆔','Booking Ref', result?.bookingId ? `#${result.bookingId.slice(-8).toUpperCase()}` : '—'],
                  ].map(([icon,label,value], idx, arr) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom: idx < arr.length-1 ? '1px solid rgba(76,211,137,.10)' : 'none' }}>
                      <span style={{ fontSize:13, color:'#6b5a3e' }}>{icon} {label}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:'#1a1208' }}>{value}</span>
                    </div>
                  ))}
                </div>
                <button onClick={handleClose}
                  onMouseEnter={() => setDoneHov(true)}
                  onMouseLeave={() => setDoneHov(false)}
                  style={{
                    width:'100%', padding:'14px',
                    background: doneHov ? 'linear-gradient(135deg,#2ea065,#4cd389)' : 'linear-gradient(135deg,#005f2b,#2ea065)',
                    color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:700,
                    cursor:'pointer',
                    transform: doneHov ? 'translateY(-1px)' : 'translateY(0)',
                    boxShadow: doneHov ? '0 8px 24px rgba(0,95,43,.25)' : 'none',
                    transition:'all .22s ease', fontFamily:'inherit',
                  }}
                >
                  Done ✓
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}