// src/components/Header.js
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/',         label: 'Home'     },
  { href: '/about',    label: 'About'    },
{ href: '/classes',         label: ' Free Classes'     },
{ href: '/premium-classes', label: '👑 Premium Classes'  },
  { href: '/schedule', label: 'Schedule' },
  { href: '/premium',  label: 'Premium'  },
  { href: '/contact',  label: 'Contact'  },
];

const HEADER_STYLES = `
  @media (max-width: 900px) {
    .desktop-nav      { display: none  !important; }
    .mobile-menu-btn  { display: flex  !important; }
  }
  @media (max-width: 600px) {
    .header-logo-text { font-size: 15px !important; }
    .header-sign-in   { display: none  !important; }
  }
  @media (max-width: 380px) {
    .header-logo-sub  { display: none !important; }
  }
`;

function useHeaderStyles() {
  useEffect(() => {
    const id = 'header-styles';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id;
    el.textContent = HEADER_STYLES;
    document.head.appendChild(el);
    return () => { try { document.head.removeChild(el); } catch {} };
  }, []);
}

/* ════════════════════════════════════════════════════
   LOGO COMPONENT
   — reads from /public/logo.png (or .svg / .jpg)
   — falls back to emoji if image fails
════════════════════════════════════════════════════ */
function Logo({ size = 100 }) {
  const [err, setErr] = useState(false);

  // The logo file lives at public/logo.png
  // Change this path if you use a different filename / format:
  const SRC = '/logo-2.png';

  if (err) {
    /* ── emoji fallback ── */
    return (
      <div style={{
        width: size, height: size, borderRadius: '10%',
        background: 'linear-gradient(135deg,#4cd389,#005f2b)',
        border: '0.5px solid #000000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.50, flexShrink: 0,
        boxShadow: '0 4px 16px rgba(0,95,43,0.30)',
      }}>
        🧘
      </div>
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '90%',
      border: '0px solid rgba(0, 0, 0, 0.96)',
      overflow: 'hidden', flexShrink: 0,
      boxShadow: '0 4px 16px rgba(0,95,43,0.30)',
      background: 'rgba(255,255,255,0.10)',
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={SRC}
        alt="Yoga Temple"
        width={size}
        height={size}
        onError={() => setErr(true)}
        style={{
          width: '100%', height: '100%',
          objectFit: 'cover', display: 'block',
        }}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════
   MAIN HEADER
════════════════════════════════════════════════════ */
export default function Header() {
  useHeaderStyles();

  const { data: session } = useSession();
  const pathname = usePathname();

  const [scrolled,     setScrolled]     = useState(false);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isAdmin = pathname?.startsWith('/admin');

  /* scroll */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  /* close on route change */
  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  /* close dropdown on outside click */
  useEffect(() => {
    if (!dropdownOpen) return;
    const fn = e => {
      if (!e.target.closest?.('#user-dropdown-wrap')) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [dropdownOpen]);

  if (isAdmin) return null;

  return (
    <header style={{  
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: scrolled
        ? 'rgba(10, 160, 78, 0.97)'
        : 'linear-gradient(180deg,#005f2b 0%,rgba(13, 146, 73, 0.92) 100%)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: scrolled
        ? '1px solid rgba(76,211,137,0.22)'
        : '1px solid transparent',
      transition: 'all 0.35s ease',
      padding: '0 clamp(12px,3vw,32px)',
      boxShadow: scrolled ? '0 4px 28px rgba(0,95,43,0.22)' : 'none',
    }}>

      {/* ── Inner row ── */}
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        height: 'clamp(60px,9vh,72px)',
        gap: 12,
      }}>

        {/* ── Logo + Brand ── */}
        <Link href="/" style={{
          display: 'flex', alignItems: 'center',
          gap: 'clamp(8px,1.2vw,12px)',
          textDecoration: 'none', flexShrink: 0,
        }}>
          {/* Responsive logo size */}
          <div style={{ display:'contents' }} className="logo-wrap">
            <Logo size={60} />
          </div>

          <div style={{ lineHeight: 1.15 }}>
            <span
              className="header-logo-text"
              style={{
                fontFamily: 'Cormorant Garamond,serif',
                fontSize: 'clamp(16px,2.2vw,21px)',
                fontWeight: 700, color: '#fff',
                 display: 'block',
              }}
            >
              Yoga Temple
            </span>
           
          </div>
        </Link>

        {/* ── Desktop Nav ── */}
        <nav
          className="desktop-nav"
          style={{
            display: 'flex', alignItems: 'center',
            gap: 2, flex: 1, justifyContent: 'center',
          }}
        >
          {NAV_LINKS.map(({ href, label }) => (
            <NavLink
              key={href}
              href={href}
              label={label}
              active={pathname === href}
            />
          ))}
        </nav>

        {/* ── Auth area + Hamburger ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>

          {/* Logged in */}
          {session ? (
            <div id="user-dropdown-wrap" style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  borderRadius: 50, padding: '7px 14px',
                  fontSize: 13, fontWeight: 600, color: '#fff',
                  cursor: 'pointer', transition: 'background 0.2s',
                  fontFamily: 'inherit', whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#4cd389,#2ea065)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
                }}>
                  {session.user.name?.[0]?.toUpperCase() || '🧘'}
                </div>
                <span style={{ maxWidth: 80, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {session.user.name?.split(' ')[0]}
                </span>
                <span style={{
                  fontSize: 8, opacity: 0.7, display: 'inline-block',
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.25s',
                }}>▼</span>
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  background: '#fff', borderRadius: 16,
                  boxShadow: '0 20px 60px rgba(0,95,43,0.18)',
                  minWidth: 220, overflow: 'hidden',
                  border: '1px solid rgba(76,211,137,0.20)',
                  animation: 'dropIn .22s cubic-bezier(.34,1.56,.64,1)',
                }}>
                  {/* User card */}
                  <div style={{
                    padding: '14px 18px 12px',
                    borderBottom: '1px solid #e8f5ee',
                    background: 'linear-gradient(135deg,rgba(76,211,137,0.07),rgba(0,95,43,0.04))',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{
                        width:36, height:36, borderRadius:'50%', flexShrink:0,
                        background:'linear-gradient(135deg,#4cd389,#2ea065)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:15, fontWeight:800, color:'#fff',
                      }}>
                        {session.user.name?.[0]?.toUpperCase() || '🧘'}
                      </div>
                      <div style={{ minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:700, color:'#1a1208', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {session.user.name}
                        </p>
                        <p style={{ fontSize:11, color:'#9a8a6a', margin:'2px 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {session.user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {[
{ href: '/dashboard', icon: '👤', label: 'My Profile' }, // Changed from 'Dashboard'
                    { href:'/premium',   icon:'👑', label:'Premium Plans' },
                  ].map(item => (
                    <DropItem key={item.href} {...item} onClick={() => setDropdownOpen(false)} />
                  ))}

                  <button
                    onClick={() => { signOut({ callbackUrl:'/' }); setDropdownOpen(false); }}
                    style={{
                      width:'100%', textAlign:'left', padding:'12px 18px',
                      fontSize:14, color:'#ef4444', border:'none',
                      background:'transparent', cursor:'pointer',
                      borderTop:'1px solid #e8f5ee',
                      display:'flex', alignItems:'center', gap:10,
                      fontFamily:'inherit', transition:'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    <span>🚪</span><span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Sign in button */
            <Link
              href="/auth"
              className="header-sign-in"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.12)',
                border: '1.5px solid rgba(255,255,255,0.28)',
                color: '#fff', borderRadius: 50,
                padding: '8px 20px',
                fontSize: 13, fontWeight: 600,
                textDecoration: 'none', transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.22)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.50)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)';
              }}
            >
              Sign In / Sign Up
            </Link>
          )}

          {/* ── Hamburger ── */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="mobile-menu-btn"
            aria-label="Toggle navigation menu"
            style={{
              background: menuOpen ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.20)',
              borderRadius: 10, width: 40, height: 40,
              cursor: 'pointer', display: 'none',
              alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s', flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
            onMouseLeave={e => e.currentTarget.style.background = menuOpen ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.10)'}
          >
            {/* Animated lines */}
            <div style={{
              width: 20, height: 14,
              display: 'flex', flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              {[
                { transform: menuOpen ? 'rotate(45deg) translate(4px,6px)' : 'none', width:'100%' },
                { opacity: menuOpen ? 0 : 1, width:'70%' },
                { transform: menuOpen ? 'rotate(-45deg) translate(4px,-6px)' : 'none', width:'100%' },
              ].map((s, i) => (
                <div key={i} style={{
                  height: 2, background: '#fff', borderRadius: 2,
                  transition: 'all .25s ease',
                  ...s,
                }} />
              ))}
            </div>
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          MOBILE MENU  — smooth slide via max-height
      ════════════════════════════════════════════════════ */}
      <div style={{
        maxHeight: menuOpen ? '600px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.38s cubic-bezier(.4,0,.2,1)',
        background: '#fff',
      }}>
        <div style={{ borderTop: '1px solid rgba(76,211,137,0.20)', padding: '8px 14px 20px' }}>

          {/* Mobile user card */}
          {session && (
            <div style={{
              display:'flex', alignItems:'center', gap:12,
              padding:'12px 10px 14px', marginBottom:4,
              borderBottom:'1px solid #e8f5ee',
            }}>
              <div style={{
                width:44, height:44, borderRadius:'50%', flexShrink:0,
                background:'linear-gradient(135deg,#4cd389,#2ea065)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:18, fontWeight:800, color:'#fff',
              }}>
                {session.user.name?.[0]?.toUpperCase() || '🧘'}
              </div>
              <div style={{ minWidth:0 }}>
                <p style={{ fontSize:14, fontWeight:700, color:'#1a1208', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {session.user.name}
                </p>
                <p style={{ fontSize:11, color:'#9a8a6a', margin:'2px 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {session.user.email}
                </p>
              </div>
            </div>
          )}

          {/* Nav items */}
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href;
            const icons  = { '/':'🏠', '/about':'ℹ️', '/classes':'🧘', '/schedule':'📅', '/premium':'👑', '/contact':'📧' };
            return (
              <Link key={href} href={href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding:'12px 10px', fontSize:15,
                  fontWeight: active ? 700 : 500,
                  borderBottom:'1px solid #f0faf4',
                  color: active ? '#005f2b' : '#1a1208',
                  background: active ? 'rgba(76,211,137,0.06)' : 'transparent',
                  textDecoration:'none', borderRadius: active ? 8 : 0,
                  transition:'all 0.15s',
                }}
              >
                {/* Active bar */}
                {active && (
                  <div style={{
                    width:4, height:18, borderRadius:2, flexShrink:0,
                    background:'linear-gradient(180deg,#4cd389,#2ea065)',
                  }} />
                )}
                <span style={{ fontSize:17 }}>{icons[href] || '→'}</span>
                <span>{label}</span>
                {active && (
                  <span style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:'#2ea065', flexShrink:0 }} />
                )}
              </Link>
            );
          })}

          {/* Bottom auth buttons */}
          <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:8 }}>
            {!session ? (
              <Link href="/auth" onClick={() => setMenuOpen(false)} style={{
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                background:'linear-gradient(135deg,#005f2b,#2ea065)',
                color:'#fff', padding:'14px', borderRadius:12,
                fontWeight:700, fontSize:14, textDecoration:'none',
                boxShadow:'0 4px 14px rgba(0,95,43,0.22)',
              }}>
                🙏 Sign In / Sign Up
              </Link>
            ) : (
              <>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'12px 14px', borderRadius:10, fontSize:14,
                  color:'#005f2b', background:'rgba(76,211,137,0.08)',
                  border:'1px solid rgba(76,211,137,0.20)',
                  textDecoration:'none', fontWeight:600,
                }}>
                  📊 <span>Dashboard</span>
                </Link>
                <Link href="/premium" onClick={() => setMenuOpen(false)} style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'12px 14px', borderRadius:10, fontSize:14,
                  color:'#c49a36', background:'rgba(196,154,54,0.08)',
                  border:'1px solid rgba(196,154,54,0.20)',
                  textDecoration:'none', fontWeight:600,
                }}>
                  👑 <span>Premium Plans</span>
                </Link>
                <button
                  onClick={() => { signOut({ callbackUrl:'/' }); setMenuOpen(false); }}
                  style={{
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    background:'rgba(239,68,68,0.07)', color:'#ef4444',
                    padding:'12px', borderRadius:10, fontWeight:600, fontSize:14,
                    border:'1px solid rgba(239,68,68,0.18)',
                    cursor:'pointer', fontFamily:'inherit',
                  }}
                >
                  🚪 Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <style suppressHydrationWarning>{`
        @keyframes dropIn {
          from { opacity:0; transform:translateY(-10px) scale(.96); }
          to   { opacity:1; transform:translateY(0)     scale(1);   }
        }
        @keyframes fbFadeIn { from{opacity:0} to{opacity:1} }
      `}</style>
    </header>
  );
}

/* ── Nav Link ── */
function NavLink({ href, label, active }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'inline-flex', alignItems:'center',
        padding:'6px clamp(10px,1.2vw,14px)', borderRadius:8,
        fontSize:'clamp(12px,1.2vw,14px)', fontWeight: active ? 700 : 500,
        textDecoration:'none', whiteSpace:'nowrap',
        color: active ? '#4cd389' : hov ? '#fff' : 'rgba(255,255,255,0.82)',
        background: active
          ? 'rgba(76,211,137,0.14)'
          : hov ? 'rgba(255,255,255,0.08)' : 'transparent',
        borderBottom: active ? '2px solid #4cd389' : '2px solid transparent',
        transition:'all 0.2s ease',
      }}
    >
      {label}
    </Link>
  );
}

/* ── Dropdown Item ── */
function DropItem({ href, icon, label, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={href} onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', alignItems:'center', gap:10,
        padding:'12px 18px', fontSize:14,
        color: hov ? '#005f2b' : '#1a1208',
        background: hov ? 'rgba(76,211,137,0.06)' : 'transparent',
        textDecoration:'none', transition:'all 0.15s',
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}