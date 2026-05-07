'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* ── Real SVG Social Icons ── */
function FacebookIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function YouTubeIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function WhatsAppIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function TwitterXIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TelegramIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0 12 12 0 0011.944 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

/* ── Social button with real icon ── */
function SocialBtn({ icon: Icon, label, href, hoverBg, hoverColor }) {
  const [hov, setHov] = useState(false);
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 42, height: 42, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        textDecoration: 'none',
        background: hov ? (hoverBg || 'rgba(0,95,43,.14)') : 'rgba(0,0,0,.06)',
        color: hov ? (hoverColor || '#005f2b') : 'rgba(0,0,0,.45)',
        transform: hov ? 'translateY(-3px) scale(1.12)' : 'translateY(0) scale(1)',
        boxShadow: hov ? '0 6px 16px rgba(0,0,0,.12)' : 'none',
        transition: 'all .25s cubic-bezier(.4,0,.2,1)',
      }}
    >
      <Icon size={18} color="currentColor" />
    </a>
  );
}

/* ── Footer Link ── */
function FooterLink({ href, children }) {
  const [hov, setHov] = useState(false);
  return (
    <Link href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'block', marginBottom: 10, fontSize: 14,
        color: hov ? '#005f2b' : 'rgba(0,0,0,.5)',
        textDecoration: 'none',
        paddingLeft: hov ? 6 : 0,
        transition: 'color .2s ease, padding-left .2s ease',
      }}
    >
      {children}
    </Link>
  );
}

/* ── Social links config — UPDATE THESE ── */
const SOCIAL_LINKS = [
  { icon: FacebookIcon,  label: 'Facebook',  href: 'https://facebook.com/yogatemple',        hoverBg: 'rgba(24,119,242,.12)',  hoverColor: '#1877F2' },
  { icon: InstagramIcon, label: 'Instagram', href: 'https://instagram.com/yogatemple',       hoverBg: 'rgba(225,48,108,.12)',  hoverColor: '#E1306C' },
  { icon: YouTubeIcon,   label: 'YouTube',   href: 'https://youtube.com/@yogatemple',        hoverBg: 'rgba(255,0,0,.10)',     hoverColor: '#FF0000' },
  { icon: WhatsAppIcon,  label: 'WhatsApp',  href: 'https://wa.me/919876543210',             hoverBg: 'rgba(37,211,102,.12)',  hoverColor: '#25D366' },
];

const FOOTER_STYLES = `
  @media (max-width: 640px) {
    .footer-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
    .footer-brand-section { text-align: center; }
    .footer-social-row { justify-content: center !important; }
    .footer-bottom-row { flex-direction: column !important; gap: 12px !important; text-align: center !important; }
  }
  @media (min-width: 641px) and (max-width: 900px) {
    .footer-grid { grid-template-columns: 1fr 1fr !important; }
  }
`;

export default function Footer() {
  const pathname = usePathname();
  const [rkHov, setRkHov] = useState(false);

  useEffect(() => {
    const id = 'footer-styles';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id; el.textContent = FOOTER_STYLES;
    document.head.appendChild(el);
  }, []);

  if (pathname?.startsWith('/admin')) return null;

  return (
    <footer style={{
      background: 'linear-gradient(180deg,#f0faf4 0%,#d4ede0 40%,#005f2b 100%)',
      color: 'rgba(0,0,0,.8)', paddingTop: 72,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        {/* ── Main Grid ── */}
        <div className="footer-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 48, paddingBottom: 48,
        }}>

          {/* Brand */}
          <div className="footer-brand-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 32 }}>🧘</span>
              <span style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 22, fontWeight: 700, color: '#1a1208' }}>
                Yoga Temple
              </span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: 'rgba(0,0,0,.55)', marginBottom: 20 }}>
              A sacred space for your yoga journey. Live classes, recorded sessions,
              and personal coaching from the comfort of your home.
            </p>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#6b5a3e', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
              Follow Us
            </p>
            <div className="footer-social-row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SOCIAL_LINKS.map(s => <SocialBtn key={s.label} {...s} />)}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: '#1a1208', marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Quick Links</h4>
            {[
              ['/', 'Home'],
              ['/about', 'About Us'],
              ['/classes', 'Free Classes'],
              ['/premium-classes', 'Premium Classes'],
              ['/schedule', 'Schedule'],
              ['/premium', 'Pricing'],
              ['/contact', 'Contact'],
            ].map(([href, label]) => (
              <FooterLink key={href} href={href}>{label}</FooterLink>
            ))}
          </div>

          {/* Yoga Styles */}
          <div>
            <h4 style={{ color: '#1a1208', marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Yoga Styles</h4>
            {[
              '🌅 Hatha Yoga', '🌊 Vinyasa Flow', '⚡ Power Yoga',
              '🌙 Yin Yoga', '🧠 Meditation', '🌬️ Pranayama',
              '🔥 Ashtanga', '🌿 Restorative',
            ].map(cls => (
              <FooterLink key={cls} href="/classes">{cls}</FooterLink>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: '#1a1208', marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Get in Touch</h4>
            {[
              ['📍', '123 Serenity Lane, Hyderabad'],
              ['📞', '+91 98765 43210'],
              ['✉️', 'hello@yogatemple.com'],
              ['⏰', 'Mon–Sun: 5:30 AM – 9 PM'],
            ].map(([icon, text]) => (
              <div key={text} style={{ display: 'flex', gap: 10, marginBottom: 12, fontSize: 13, color: 'rgba(0,0,0,.5)' }}>
                <span style={{ flexShrink: 0 }}>{icon}</span>
                <span>{text}</span>
              </div>
            ))}

            {/* WhatsApp CTA */}
            <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                marginTop: 12, padding: '10px 18px', borderRadius: 50,
                background: 'linear-gradient(135deg,#25D366,#128C7E)',
                color: '#fff', fontSize: 13, fontWeight: 700,
                textDecoration: 'none', boxShadow: '0 4px 12px rgba(37,211,102,.3)',
                transition: 'transform .2s, box-shadow .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,211,102,.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,211,102,.3)'; }}
            >
              <WhatsAppIcon size={16} color="#fff" />
              Chat on WhatsApp
            </a>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,.15)',
          padding: '20px 0',
        }}>
          <div className="footer-bottom-row" style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: 16,
          }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', margin: 0 }}>
              © {new Date().getFullYear()} Yoga Temple. All rights reserved.
            </p>

            {/* Ramakalpa badge */}
            <a
              href="https://www.ramakalpasolutions.in/"
              target="_blank" rel="noopener noreferrer"
              onMouseEnter={() => setRkHov(true)}
              onMouseLeave={() => setRkHov(false)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '6px 16px', borderRadius: 999,
                background: rkHov ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.06)',
                border: rkHov ? '1px dashed rgba(255,255,255,.4)' : '1px dashed rgba(255,255,255,.2)',
                textDecoration: 'none', transition: 'all .25s ease',
              }}
            >
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.45)' }}>Designed by</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#4cd389', letterSpacing: .3 }}>Ramakalpa Solutions</span>
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#4cd389" style={{ opacity: .5 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            <div style={{ display: 'flex', gap: 16 }}>
              {['Privacy Policy', 'Terms of Service', 'Refund Policy'].map(text => {
                const [h, setH] = useState(false);
                return (
                  <Link key={text} href="#"
                    onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
                    style={{ fontSize: 11, textDecoration: 'none', color: h ? '#4cd389' : 'rgba(255,255,255,.35)', transition: 'color .2s ease' }}>
                    {text}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}