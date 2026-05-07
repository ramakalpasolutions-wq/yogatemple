// src/app/admin/layout.js
'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

const T = {
  bg:          '#f4faf6',
  bgDark:      '#005f2b',
  bgCard:      '#ffffff',
  bgAlt:       '#e8f5ee',
  border:      '#c8e6d4',
  accent:      '#005f2b',
  accentMid:   '#2ea065',
  accentLight: '#4cd389',
  accentPale:  'rgba(76,211,137,0.10)',
  gold:        '#c49a36',
  goldLight:   '#f0c060',
  text:        '#1a1208',
  textMuted:   '#6b5a3e',
  textLight:   '#9a8a6a',
  white:       '#ffffff',
  red:         '#ef4444',
  blue:        '#3b82f6',
  orange:      '#f59e0b',
  shadow:      '0 4px 24px rgba(0,95,43,0.08)',
  shadowLg:    '0 12px 48px rgba(0,95,43,0.14)',
};

const TABS = [
  { id: '/admin',               icon: '📊', label: 'Dashboard',     color: '#3b82f6' },
  { id: '/admin/classes',       icon: '🧘', label: 'Classes',       color: '#2ea065' },
  { id: '/admin/add-class',     icon: '➕', label: 'Add Class',     color: '#4cd389' },
  { id: '/admin/pricing',       icon: '💰', label: 'Pricing',       color: '#c49a36' },
  { id: '/admin/enquiries',     icon: '📋', label: 'Enquiries',     color: '#f59e0b' },
  { id: '/admin/hero',          icon: '🖼️', label: 'Hero Images',   color: '#8b5cf6' },
  { id: '/admin/videos',        icon: '🎬', label: 'Videos',        color: '#ef4444' },
  { id: '/admin/announcements', icon: '📢', label: 'Announcements', color: '#f97316' },
  { id: '/admin/bookings',      icon: '📅', label: 'Bookings',      color: '#c49a36' },
  { id: '/admin/users',         icon: '👥', label: 'Users',         color: '#06b6d4' },
  { id: '/admin/contacts',      icon: '✉️', label: 'Messages',      color: '#ec4899' },
];

export { T };

const ADMIN_KF = `
  @keyframes spin        { to { transform: rotate(360deg); } }
  @keyframes fadeInUp    { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeInLeft  { from { opacity:0; transform:translateX(-16px); } to { opacity:1; transform:translateX(0); } }
  @keyframes fadeInRight { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }
  @keyframes scaleIn     { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
  @keyframes pulse       { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
  @keyframes shimmerSlide{ 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes dotBounce   { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
  @keyframes slideDown   { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glow        { 0%,100%{box-shadow:0 0 8px rgba(76,211,137,.3)} 50%{box-shadow:0 0 20px rgba(76,211,137,.6)} }
  @keyframes badgePop    { 0%{transform:scale(0)} 70%{transform:scale(1.2)} 100%{transform:scale(1)} }

  @media (max-width: 900px) {
    .admin-mobile-header { display: flex !important; }
    .admin-sidebar       { transform: translateX(-100%) !important; top: 60px; }
    .admin-sidebar.open  { transform: translateX(0) !important; }
    .admin-overlay       { display: block !important; }
    .admin-main          { margin-left: 0 !important; padding-top: 60px; }
  }
  * { box-sizing: border-box; }
  ::-webkit-scrollbar       { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: #f4faf6; }
  ::-webkit-scrollbar-thumb { background: #c8e6d4; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #2ea065; }
`;

function useAdminStyles() {
  useEffect(() => {
    const id = 'admin-kf';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id; el.textContent = ADMIN_KF;
    document.head.appendChild(el);
    return () => { try { document.head.removeChild(el); } catch {} };
  }, []);
}

/* ── Sidebar Link ── */
function SidebarLink({ tab, isActive, index, badge }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={tab.id}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 16px', borderRadius: 10,
        marginBottom: 3, fontSize: 14,
        fontWeight: isActive ? 700 : 500,
        textDecoration: 'none',
        background: isActive
          ? 'rgba(255,255,255,0.16)'
          : hov ? 'rgba(255,255,255,0.08)' : 'transparent',
        color: isActive ? '#fff' : hov ? '#fff' : 'rgba(255,255,255,0.65)',
        borderLeft: isActive
          ? `3px solid ${tab.color || '#4cd389'}`
          : '3px solid transparent',
        transition: 'all 0.22s cubic-bezier(.4,0,.2,1)',
        animation: `fadeInLeft .4s ease ${index * 40}ms both`,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Hover shimmer */}
      {hov && !isActive && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)',
          backgroundSize: '200% 100%',
          animation: 'shimmerSlide 1.2s linear infinite',
          pointerEvents: 'none',
        }} />
      )}

      <span style={{
        fontSize: 18, flexShrink: 0,
        transform: (isActive || hov) ? 'scale(1.12)' : 'scale(1)',
        transition: 'transform .22s ease',
        display: 'inline-block',
      }}>
        {tab.icon}
      </span>

      <span style={{ flex: 1 }}>{tab.label}</span>

      {/* Badge for new count */}
      {badge > 0 && (
        <span style={{
          fontSize: 9, fontWeight: 800,
          background: tab.color || '#4cd389',
          color: '#fff',
          padding: '2px 6px', borderRadius: 50,
          minWidth: 18, textAlign: 'center',
          animation: 'badgePop .4s cubic-bezier(.34,1.56,.64,1) both',
          flexShrink: 0,
        }}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}

      {/* Active dot */}
      {isActive && badge === 0 && (
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: tab.color || '#4cd389',
            animation: 'glow 2s ease-in-out infinite',
          }} />
        </div>
      )}
    </Link>
  );
}

/* ── Loading Dots ── */
function LoadingDots() {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#2ea065',
          animation: `dotBounce 1.4s ease ${i * 0.16}s infinite`,
        }} />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   LAYOUT
══════════════════════════════════════════════════════ */
export default function AdminLayout({ children }) {
  useAdminStyles();
  const router   = useRouter();
  const pathname = usePathname();

  const [admin,          setAdmin]          = useState(null);
  const [checking,       setChecking]       = useState(true);
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [pageKey,        setPageKey]        = useState(0);
  const [enquiryBadge,   setEnquiryBadge]   = useState(0); // new enquiry count

  const isLoginPage = pathname === '/admin/login';

  const checkAuth = useCallback(async () => {
    if (isLoginPage) { setChecking(false); return; }
    try {
      const res = await axios.get('/api/admin/me');
      setAdmin(res.data.admin);
    } catch {
      router.replace('/admin/login');
    } finally {
      setChecking(false);
    }
  }, [isLoginPage, router]);

  /* Fetch enquiry badge count */
  const fetchEnquiryBadge = useCallback(async () => {
    if (isLoginPage) return;
    try {
      const r = await axios.get('/api/admin/enquiries');
      const newCount = (r.data.leads || []).filter(l => l.status === 'NEW').length;
      setEnquiryBadge(newCount);
    } catch {}
  }, [isLoginPage]);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  useEffect(() => {
    if (admin) {
      fetchEnquiryBadge();
      /* Refresh badge every 60 seconds */
      const interval = setInterval(fetchEnquiryBadge, 60_000);
      return () => clearInterval(interval);
    }
  }, [admin, fetchEnquiryBadge]);

  useEffect(() => {
    setSidebarOpen(false);
    setPageKey(k => k + 1);
    /* Refresh badge when navigating to/from enquiries */
    if (admin) fetchEnquiryBadge();
  }, [pathname]);

  const handleLogout = async () => {
    await axios.post('/api/admin/logout');
    router.push('/admin/login');
  };

  if (isLoginPage) return <>{children}</>;

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg,#f4faf6,#e8f5ee)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg,#4cd389,#005f2b)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, marginBottom: 20,
          animation: 'spin 2s linear infinite',
          boxShadow: '0 8px 32px rgba(0,95,43,0.25)',
        }}>🧘</div>
        <p style={{ color: T.accentMid, fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
          Loading Admin Panel
        </p>
        <p style={{ color: T.textLight, fontSize: 13, marginBottom: 16 }}>
          Please wait…
        </p>
        <LoadingDots />
      </div>
    );
  }

  if (!admin) return null;

  const activeTab = TABS.find(t => t.id === pathname) || TABS[0];

  /* Build badge map */
  const badgeMap = {
    '/admin/enquiries': enquiryBadge,
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Jost',sans-serif" }}>

      {/* ══ Mobile Top Bar ══ */}
      <div style={{
        display: 'none',
        position: 'fixed', top: 0, left: 0, right: 0, height: 60,
        background: 'linear-gradient(90deg,#005f2b,#2ea065)',
        boxShadow: '0 2px 20px rgba(0,95,43,0.25)',
        padding: '0 16px',
        alignItems: 'center', justifyContent: 'space-between',
        zIndex: 200,
      }} className="admin-mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>🧘</div>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#fff', fontFamily: "'Cormorant Garamond',serif" }}>
            Admin
          </span>
        </div>

        {/* Mobile hamburger + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {enquiryBadge > 0 && (
            <div style={{
              fontSize: 10, fontWeight: 800,
              background: T.orange, color: '#fff',
              padding: '3px 8px', borderRadius: 50,
              animation: 'badgePop .4s ease',
            }}>
              📋 {enquiryBadge} new
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 8, width: 40, height: 40,
              color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{ width: 18, height: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {[
                { transform: sidebarOpen ? 'rotate(45deg) translate(4px,5px)' : 'none' },
                { opacity: sidebarOpen ? 0 : 1 },
                { transform: sidebarOpen ? 'rotate(-45deg) translate(4px,-5px)' : 'none' },
              ].map((s, i) => (
                <div key={i} style={{ height: 2, background: '#fff', borderRadius: 1, transition: 'all .25s', ...s }} />
              ))}
            </div>
          </button>
        </div>
      </div>

      {/* ══ Overlay ══ */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 250,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
            display: 'none', animation: 'scaleIn .2s ease',
          }}
          className="admin-overlay"
        />
      )}

      {/* ══ Sidebar ══ */}
      <div
        style={{
          position: 'fixed', left: 0, top: 0, bottom: 0, width: 260,
          background: 'linear-gradient(180deg,#005f2b 0%,#003d1c 100%)',
          display: 'flex', flexDirection: 'column',
          zIndex: 300, overflowY: 'auto',
          boxShadow: '4px 0 28px rgba(0,95,43,0.20)',
          transition: 'transform 0.32s cubic-bezier(.4,0,.2,1)',
        }}
        className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}
      >
        {/* Brand */}
        <div style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          animation: 'fadeInLeft .5s ease both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 46, height: 46, borderRadius: '50%',
              background: 'linear-gradient(135deg,rgba(76,211,137,0.20),rgba(255,255,255,0.10))',
              border: '2px solid rgba(76,211,137,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, flexShrink: 0,
              boxShadow: '0 0 20px rgba(76,211,137,0.15)',
              animation: 'glow 3s ease-in-out infinite',
            }}>🧘</div>
            <div>
              <div style={{
                fontSize: 17, fontWeight: 700, color: '#fff',
                fontFamily: "'Cormorant Garamond',serif", lineHeight: 1.2,
              }}>
                Yoga Temple
              </div>
              <div style={{
                fontSize: 10, color: 'rgba(76,211,137,0.7)',
                letterSpacing: 2, textTransform: 'uppercase', marginTop: 3, fontWeight: 600,
              }}>
                Admin Panel
              </div>
            </div>
          </div>

          {/* Admin badge */}
          <div style={{
            marginTop: 14, display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 10,
            background: 'rgba(76,211,137,0.08)',
            border: '1px solid rgba(76,211,137,0.15)',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#4cd389,#2ea065)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: '#fff',
            }}>
              {admin.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {admin.name}
              </div>
              <div style={{ fontSize: 10, color: '#4cd389', marginTop: 1 }}>● Super Admin</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '14px 10px' }}>
          <div style={{
            fontSize: 10, fontWeight: 700,
            color: 'rgba(255,255,255,0.30)',
            letterSpacing: 2, textTransform: 'uppercase',
            padding: '0 16px', marginBottom: 8,
          }}>
            Navigation
          </div>

          {TABS.map((tab, i) => (
            <SidebarLink
              key={tab.id}
              tab={tab}
              isActive={pathname === tab.id}
              index={i}
              badge={badgeMap[tab.id] || 0}
            />
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '0 10px 10px' }}>
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 10,
            background: 'rgba(76,211,137,0.10)',
            border: '1px solid rgba(76,211,137,0.18)',
            color: '#4cd389', fontSize: 13, fontWeight: 600,
            textDecoration: 'none', transition: 'all 0.2s', marginBottom: 6,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(76,211,137,0.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(76,211,137,0.10)'; }}
          >
            <span>🌐</span>
            <span>View Live Site</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.6 }}>↗</span>
          </Link>

          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '10px 16px',
              background: 'rgba(239,68,68,0.10)',
              border: '1px solid rgba(239,68,68,0.22)',
              borderRadius: 10, color: '#fca5a5',
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.22s',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.20)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.10)'; e.currentTarget.style.color = '#fca5a5'; }}
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* ══ Main Content ══ */}
      <div style={{ marginLeft: 260, minHeight: '100vh' }} className="admin-main">

        {/* Top bar */}
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${T.border}`,
          padding: '0 clamp(16px,2.5vw,32px)',
          height: 68,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 50,
          boxShadow: '0 2px 16px rgba(0,95,43,0.06)',
        }}>
          {/* Page title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `linear-gradient(135deg,${activeTab.color || T.accentMid}18,${activeTab.color || T.accentMid}08)`,
              border: `1.5px solid ${activeTab.color || T.accentMid}22`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, flexShrink: 0,
            }}>
              {activeTab.icon}
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: T.text, lineHeight: 1.2, margin: 0, animation: 'slideDown .3s ease both' }}>
                {activeTab.label}
              </h1>
              <p style={{ fontSize: 11, color: T.textLight, margin: 0 }}>
                Yoga Temple Admin
              </p>
            </div>
          </div>

          {/* Right: enquiry alert + date + avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

            {/* Enquiry alert in top bar */}
            {enquiryBadge > 0 && pathname !== '/admin/enquiries' && (
              <Link href="/admin/enquiries" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 50,
                background: 'rgba(245,158,11,0.10)',
                border: '1px solid rgba(245,158,11,0.30)',
                textDecoration: 'none', fontSize: 12, fontWeight: 700,
                color: T.orange, animation: 'badgePop .4s ease',
                transition: 'all .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.10)'; }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: T.orange,
                  display: 'inline-block',
                  animation: 'pulse 1.5s infinite',
                }} />
                {enquiryBadge} new enquir{enquiryBadge === 1 ? 'y' : 'ies'}
              </Link>
            )}

            <div style={{
              background: 'linear-gradient(135deg,rgba(76,211,137,0.08),rgba(0,95,43,0.04))',
              border: `1px solid ${T.border}`,
              borderRadius: 10, padding: '6px 14px',
              fontSize: 12, color: T.textMuted, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>📅</span>
              <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>

            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#4cd389,#2ea065)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 800, color: '#fff',
              boxShadow: '0 4px 12px rgba(0,95,43,0.25)',
              cursor: 'default',
            }}>
              {admin.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div
          key={pageKey}
          style={{ padding: 'clamp(16px,2.5vw,32px)', animation: 'fadeInUp .35s cubic-bezier(.4,0,.2,1) both' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}