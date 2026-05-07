'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

/* ── Real SVG Social Icons ── */
function FacebookIcon({ size = 18, color = 'currentColor' }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>);
}
function InstagramIcon({ size = 18, color = 'currentColor' }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>);
}
function YouTubeIcon({ size = 18, color = 'currentColor' }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>);
}
function WhatsAppIcon({ size = 18, color = 'currentColor' }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>);
}
function TwitterXIcon({ size = 18, color = 'currentColor' }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>);
}
function TelegramIcon({ size = 18, color = 'currentColor' }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0 12 12 0 0011.944 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>);
}

/* ── Social links config ── */
const SOCIAL_LINKS = [
  { Icon: FacebookIcon,  label: 'Facebook',  href: 'https://facebook.com/yogatemple',  bg: '#1877F2' },
  { Icon: InstagramIcon, label: 'Instagram', href: 'https://instagram.com/yogatemple', bg: '#E1306C' },
  { Icon: YouTubeIcon,   label: 'YouTube',   href: 'https://youtube.com/@yogatemple',  bg: '#FF0000' },
  { Icon: WhatsAppIcon,  label: 'WhatsApp',  href: 'https://wa.me/919876543210',       bg: '#25D366' },

];

const STYLES = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}

  .con-input:focus { border-color:#2ea065 !important; box-shadow:0 0 0 4px rgba(76,211,137,.10) !important; background:#fafffe !important; }
  .con-input::placeholder { color:rgba(107,90,62,.38) !important; }
  .con-info:hover { border-color:rgba(76,211,137,.28) !important; transform:translateY(-2px) !important; box-shadow:0 8px 24px rgba(0,95,43,.08) !important; }
  .con-submit:hover:not(:disabled) { transform:translateY(-2px) !important; box-shadow:0 10px 32px rgba(0,95,43,.28) !important; }
  .social-pill:hover { transform:translateY(-2px) !important; box-shadow:0 6px 16px rgba(0,0,0,.12) !important; }

  @media(max-width:768px){
    .con-grid { grid-template-columns:1fr !important; gap:32px !important; }
    .con-field-row { grid-template-columns:1fr !important; }
    .social-grid { grid-template-columns:repeat(3,1fr) !important; }
  }
  @media(max-width:400px){
    .social-grid { grid-template-columns:repeat(2,1fr) !important; }
  }
`;

function useStyles() {
  useEffect(() => {
    const id = 'con-styles';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id; el.textContent = STYLES;
    document.head.appendChild(el);
    return () => { try { document.head.removeChild(el); } catch {} };
  }, []);
}

const inp = (extra = {}) => ({
  width: '100%', padding: '13px 16px', boxSizing: 'border-box',
  background: '#f4faf6', border: '1.5px solid #c8e6d4',
  borderRadius: 12, fontSize: 14, color: '#1a1208',
  outline: 'none', fontFamily: 'inherit',
  transition: 'all .25s cubic-bezier(.4,0,.2,1)',
  ...extra,
});

const CONTACT_INFO = [
  { icon: '📍', title: 'Studio Location', info: '123 Serenity Lane, Banjara Hills\nHyderabad, Telangana 500034', color: 'rgba(76,211,137,.10)' },
  { icon: '📞', title: 'Phone',           info: '+91 98765 43210\n+91 87654 32109',                              color: 'rgba(59,130,246,.10)' },
  { icon: '✉️', title: 'Email',           info: 'hello@yogatemple.com\nsupport@yogatemple.com',                  color: 'rgba(139,92,246,.10)' },
  { icon: '⏰', title: 'Hours',           info: 'Mon–Sat: 5:30 AM – 9:00 PM\nSunday: 6:00 AM – 6:00 PM',        color: 'rgba(245,158,11,.10)' },
];

const FAQ = [
  { q: 'How do live classes work?',         a: 'All live classes are conducted via Google Meet / Jitsi. After booking, you receive a link to join at the scheduled time.' },
  { q: 'Can I access classes on mobile?',   a: 'Yes! Our platform and video calls work seamlessly on iOS and Android devices.' },
  { q: 'What if I miss a live class?',      a: 'Premium subscribers get access to recordings of all live sessions, so you never miss out.' },
  { q: 'How do I cancel my subscription?',  a: 'You can cancel anytime from your Profile page. Your access continues until the end of the billing period.' },
];

/* ── Social Pill Button ── */
function SocialPill({ Icon, label, href, bg }) {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={href} target="_blank" rel="noopener noreferrer"
      className="social-pill"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 16px', borderRadius: 12,
        background: hov ? bg : '#fff',
        color: hov ? '#fff' : '#1a1208',
        border: `1.5px solid ${hov ? bg : '#c8e6d4'}`,
        textDecoration: 'none', fontSize: 13, fontWeight: 600,
        transition: 'all .25s cubic-bezier(.4,0,.2,1)',
        cursor: 'pointer',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: hov ? 'rgba(255,255,255,.2)' : `${bg}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'background .25s',
      }}>
        <Icon size={16} color={hov ? '#fff' : bg} />
      </div>
      <span>{label}</span>
    </a>
  );
}

export default function ContactPage() {
  useStyles();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true);
    try {
      await axios.post('/api/contact', form);
      toast.success('Message sent! We\'ll get back to you within 24 hours. 🙏');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      setSent(true);
      setTimeout(() => setSent(false), 6000);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to send message'); }
    finally { setLoading(false); }
  };

  return (
    <>
      {/* ══ HERO ══ */}
      <div style={{
        background: 'linear-gradient(135deg,#005f2b 0%,#2ea065 55%,#4cd389 100%)',
        padding: 'clamp(100px,14vw,130px) 0 clamp(56px,7vw,72px)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: '5%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -50, left: '8%', width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,.04)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          <span style={{ display: 'inline-block', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.20)', color: '#fff', borderRadius: 50, padding: '5px 20px', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 }}>
            Get In Touch
          </span>
          <h1 style={{ fontSize: 'clamp(30px,6vw,58px)', fontFamily: 'Times New Roman', color: '#fff', marginBottom: 14, fontWeight: 700, textShadow: '0 4px 24px rgba(0,0,0,.18)', lineHeight: 1.1 }}>
            Contact <em style={{ fontStyle: 'normal', color: 'rgba(255,255,255,.75)' }}>Us</em>
          </h1>
          <p style={{ fontSize: 'clamp(14px,1.8vw,17px)', color: 'rgba(255,255,255,.80)', maxWidth: 480, margin: '0 auto', lineHeight: 1.75 }}>
            We'd love to hear from you. Reach out with any questions, feedback, or booking requests.
          </p>
        </div>
      </div>

      {/* ══ MAIN ══ */}
      <section style={{ background: '#faf7f2', padding: 'clamp(40px,6vw,64px) 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(12px,3vw,24px)' }}>
          <div className="con-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(32px,5vw,64px)', alignItems: 'start' }}>

            {/* ── FORM ── */}
            <div style={{ background: '#fff', borderRadius: 22, padding: 'clamp(24px,4vw,40px)', boxShadow: '0 4px 24px rgba(0,95,43,.07)', border: '1px solid #c8e6d4', animation: 'fadeUp .4s ease both', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg,#4cd389,#2ea065,#005f2b)' }} />

              {sent ? (
                <div style={{ textAlign: 'center', padding: 'clamp(32px,5vw,56px) 20px', animation: 'scaleIn .4s ease' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#4cd389,#2ea065)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 36, color: '#fff', boxShadow: '0 8px 24px rgba(0,95,43,.25)' }}>✓</div>
                  <h3 style={{ fontSize: 'clamp(20px,3vw,26px)', fontFamily: 'Times New Roman', color: '#1a1208', marginBottom: 10 }}>Message Sent! 🙏</h3>
                  <p style={{ color: '#9a8a6a', fontSize: 14, lineHeight: 1.7 }}>Thank you for reaching out. We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <>
                  <h2 style={{ fontSize: 'clamp(20px,3vw,26px)', fontFamily: 'Times New Roman', color: '#1a1208', marginBottom: 6, fontWeight: 700 }}>Send a Message</h2>
                  <p style={{ color: '#9a8a6a', fontSize: 13, marginBottom: 24 }}>Fill in the form and we'll respond within 24 hours.</p>

                  <form onSubmit={handleSubmit}>
                    <div className="con-field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b5a3e', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>Full Name *</label>
                        <input className="con-input" name="name" value={form.name} onChange={handleChange} required style={inp()} placeholder="Your full name" />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b5a3e', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>Email *</label>
                        <input className="con-input" name="email" type="email" value={form.email} onChange={handleChange} required style={inp()} placeholder="your@email.com" />
                      </div>
                    </div>

                    <div className="con-field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b5a3e', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>Phone</label>
                        <input className="con-input" name="phone" value={form.phone} onChange={handleChange} style={inp()} placeholder="+91 98765 43210" />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b5a3e', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>Subject *</label>
                        <select className="con-input" name="subject" value={form.subject} onChange={handleChange} required style={{ ...inp(), cursor: 'pointer' }}>
                          <option value="">Select a topic</option>
                          {['General Inquiry', 'Class Booking', 'Subscription', 'Counseling Session', 'Technical Support', 'Feedback'].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: 22 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b5a3e', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>Message *</label>
                      <textarea className="con-input" name="message" value={form.message} onChange={handleChange} required rows={5} style={{ ...inp(), resize: 'vertical', minHeight: 120 }} placeholder="Tell us how we can help…" />
                    </div>

                    <button type="submit" disabled={loading} className="con-submit" style={{
                      width: '100%', padding: '14px',
                      background: loading ? '#c8e6d4' : 'linear-gradient(135deg,#005f2b,#2ea065)',
                      color: loading ? '#9a8a6a' : '#fff',
                      border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      fontFamily: 'inherit', transition: 'all .25s ease',
                      boxShadow: loading ? 'none' : '0 6px 20px rgba(0,95,43,.22)',
                    }}>
                      {loading ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Sending…</> : 'Send Message 🙏'}
                    </button>

                    <p style={{ textAlign: 'center', fontSize: 11, color: '#9a8a6a', marginTop: 12 }}>
                      🔒 Your information is safe with us.
                    </p>
                  </form>
                </>
              )}
            </div>

            {/* ── INFO SIDE ── */}
            <div style={{ animation: 'fadeUp .4s ease .1s both' }}>
              <span style={{ display: 'inline-block', background: 'linear-gradient(135deg,rgba(76,211,137,.14),rgba(36,180,101,.09))', color: '#2ea065', borderRadius: 50, padding: '5px 18px', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>
                Contact Details
              </span>
              <h2 style={{ fontSize: 'clamp(20px,3vw,30px)', fontFamily: 'Times New Roman', color: '#1a1208', marginBottom: 8, fontWeight: 700 }}>
                We're Here For You
              </h2>
              <p style={{ color: '#6b5a3e', marginBottom: 28, lineHeight: 1.8, fontSize: 14 }}>
                Whether you have questions about classes, need help with your subscription, or want to book a personal session — we're here to help.
              </p>

              {/* Contact cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {CONTACT_INFO.map(({ icon, title, info, color }) => (
                  <div key={title} className="con-info" style={{
                    display: 'flex', gap: 14, padding: '16px 18px',
                    background: '#fff', borderRadius: 14, border: '1px solid #c8e6d4',
                    boxShadow: '0 2px 8px rgba(0,95,43,.04)',
                    transition: 'all .22s cubic-bezier(.4,0,.2,1)', cursor: 'default',
                  }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1208', marginBottom: 4 }}>{title}</div>
                      <div style={{ color: '#6b5a3e', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{info}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Social Media Section ── */}
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#9a8a6a', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
                  Connect With Us
                </p>
                <div className="social-grid" style={{
                  display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10,
                }}>
                  {SOCIAL_LINKS.map(s => (
                    <SocialPill key={s.label} {...s} />
                  ))}
                </div>
              </div>

           
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section style={{
        background: 'linear-gradient(135deg,#005f2b 0%,#2ea065 60%,#4cd389 100%)',
        padding: 'clamp(48px,6vw,72px) 0', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.06)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 44, marginBottom: 16, animation: 'float 3s ease-in-out infinite', display: 'inline-block' }}>🙏</div>
          <h2 style={{ fontSize: 'clamp(22px,4vw,38px)', fontFamily: 'Times New Roman', color: '#fff', marginBottom: 12, fontWeight: 700 }}>
            Still Have Questions?
          </h2>
          <p style={{ color: 'rgba(255,255,255,.80)', fontSize: 'clamp(13px,1.5vw,16px)', marginBottom: 28, lineHeight: 1.8 }}>
            Our team is happy to help. Call us, message us, or just drop by.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="tel:+919876543210" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: '#005f2b', padding: '12px 28px', borderRadius: 50, fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 6px 20px rgba(0,0,0,.15)', transition: 'transform .2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
              📞 Call Us
            </a>
            <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#25D366,#128C7E)', color: '#fff', padding: '12px 28px', borderRadius: 50, fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 6px 20px rgba(37,211,102,.3)', transition: 'transform .2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
              <WhatsAppIcon size={16} color="#fff" /> WhatsApp
            </a>
            <a href="mailto:hello@yogatemple.com" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.12)', color: '#fff', border: '1.5px solid rgba(255,255,255,.35)', padding: '12px 28px', borderRadius: 50, fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'transform .2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
              ✉️ Email Us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}