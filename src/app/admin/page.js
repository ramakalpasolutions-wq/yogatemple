// src/app/admin/page.js
'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link  from 'next/link';

const T = {
  bg:'#f4faf6', bgCard:'#ffffff', border:'#c8e6d4',
  accent:'#005f2b', accentMid:'#2ea065', accentLight:'#4cd389',
  gold:'#c49a36', text:'#1a1208', textMuted:'#6b5a3e', textLight:'#9a8a6a',
  red:'#ef4444', blue:'#3b82f6', purple:'#8b5cf6', orange:'#f59e0b',
};

/* ── Animated counter ── */
function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  const startRef = useRef(null);

  useEffect(() => {
    if (target === '…' || target === undefined) return;
    const num = parseFloat(String(target).replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return;
    const prefix = String(target).startsWith('₹') ? '₹' : '';
    const start  = performance.now();
    startRef.current = start;

    const tick = (now) => {
      if (startRef.current !== start) return;
      const p      = Math.min((now - start) / duration, 1);
      const eased  = 1 - Math.pow(1 - p, 3);
      const current = Math.round(eased * num);
      setVal(prefix + current.toLocaleString('en-IN'));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return val || target;
}

/* ── Stat Card ── */
function StatCard({ icon, label, value, color, sub, delay = 0, href }) {
  const [hov, setHov] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const animated = useCountUp(visible ? value : 0);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const inner = (
    <div
      ref={ref}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.bgCard, borderRadius: 18, padding: '22px 20px',
        border: `1px solid ${T.border}`, borderTop: `3px solid ${color}`,
        boxShadow: hov ? `0 16px 48px ${color}22` : '0 2px 8px rgba(0,95,43,0.05)',
        transform: hov ? 'translateY(-5px)' : 'translateY(0)',
        transition: 'all 0.28s cubic-bezier(.4,0,.2,1)',
        position: 'relative', overflow: 'hidden',
        animation: `fadeInUp .5s ease ${delay}ms both`,
        cursor: href ? 'pointer' : 'default',
      }}
    >
      <div style={{
        position: 'absolute', top: -24, right: -24,
        width: 90, height: 90, borderRadius: '50%',
        background: `${color}12`, pointerEvents: 'none',
        transform: hov ? 'scale(1.3)' : 'scale(1)',
        transition: 'transform .4s ease',
      }} />
      {hov && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 18,
          background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)',
          backgroundSize: '200% 100%',
          animation: 'shimmerSlide 1s ease both',
          pointerEvents: 'none',
        }} />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <div>
          <div style={{
            fontSize: 'clamp(22px,3vw,28px)', fontWeight: 800, color,
            fontFamily: "'Cormorant Garamond',serif", lineHeight: 1,
            transform: hov ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform .2s ease',
          }}>
            {animated}
          </div>
          <div style={{ fontSize: 12, color: T.textLight, marginTop: 7, fontWeight: 500 }}>
            {label}
          </div>
          {sub && (
            <div style={{ fontSize: 10, color: T.accentMid, marginTop: 4, fontWeight: 600, letterSpacing: 0.3 }}>
              {sub}
            </div>
          )}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color}14`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
          transform: hov ? 'rotate(-8deg) scale(1.12)' : 'rotate(0) scale(1)',
          transition: 'transform .28s cubic-bezier(.34,1.56,.64,1)',
        }}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
        {inner}
      </Link>
    );
  }
  return inner;
}

/* ── User Row ── */
function UserRow({ u, delay }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '11px 8px', borderRadius: 10, marginBottom: 2,
        background: hov ? 'rgba(76,211,137,0.04)' : 'transparent',
        borderBottom: `1px solid ${T.border}`,
        transition: 'background .2s ease',
        animation: `fadeInLeft .4s ease ${delay}ms both`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: `linear-gradient(135deg,rgba(76,211,137,${hov?'0.25':'0.15'}),rgba(0,95,43,${hov?'0.15':'0.08'}))`,
          border: `1.5px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, color: T.accentMid,
          transform: hov ? 'scale(1.1)' : 'scale(1)',
          transition: 'all .22s',
        }}>
          {u.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{u.name}</div>
          <div style={{ fontSize: 11, color: T.textLight }}>{u.email}</div>
        </div>
      </div>
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 50,
        background: u.role === 'ADMIN' ? 'rgba(239,68,68,0.09)' : 'rgba(76,211,137,0.10)',
        color: u.role === 'ADMIN' ? T.red : T.accentMid,
        transform: hov ? 'scale(1.05)' : 'scale(1)',
        transition: 'all .2s',
      }}>
        {u.role}
      </span>
    </div>
  );
}

/* ── Booking Row ── */
function BookingRow({ b, delay }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '11px 8px', borderRadius: 10, marginBottom: 2,
        display: 'flex', alignItems: 'center', gap: 12,
        background: hov ? 'rgba(196,154,54,0.04)' : 'transparent',
        borderBottom: `1px solid ${T.border}`,
        transition: 'background .2s ease',
        animation: `fadeInRight .4s ease ${delay}ms both`,
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: `linear-gradient(135deg,rgba(196,154,54,${hov?'0.20':'0.12'}),rgba(196,154,54,0.06))`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 17, transition: 'all .22s',
        transform: hov ? 'rotate(-6deg) scale(1.12)' : 'rotate(0) scale(1)',
      }}>📅</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {b.sessionTitle}
        </div>
        <div style={{ fontSize: 11, color: T.textLight, marginTop: 2 }}>
          {b.user?.name} · {new Date(b.scheduledAt || b.createdAt).toLocaleDateString('en-IN')}
        </div>
      </div>
    </div>
  );
}

/* ── Enquiry Lead Row ── */
function EnquiryRow({ lead, delay }) {
  const [hov, setHov] = useState(false);
  const statusColor = {
    NEW:       T.red,
    CONTACTED: T.orange,
    CLOSED:    T.accentMid,
  }[lead.status] || T.textLight;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '11px 8px', borderRadius: 10, marginBottom: 2,
        display: 'flex', alignItems: 'center', gap: 12,
        background: hov ? 'rgba(245,158,11,0.04)' : 'transparent',
        borderBottom: `1px solid ${T.border}`,
        transition: 'background .2s ease',
        animation: `fadeInLeft .4s ease ${delay}ms both`,
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: hov ? 'rgba(245,158,11,0.18)' : 'rgba(245,158,11,0.10)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 17, transition: 'all .22s',
        transform: hov ? 'scale(1.12)' : 'scale(1)',
      }}>📋</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lead.userName}
        </div>
        <div style={{ fontSize: 11, color: T.textLight, marginTop: 2 }}>
          {lead.planName} · ₹{(lead.amount || 0).toLocaleString('en-IN')}
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <span style={{
          fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 50,
          background: `${statusColor}15`, color: statusColor,
          display: 'block', marginBottom: 2,
        }}>
          {lead.status}
        </span>
        <span style={{ fontSize: 10, color: T.textLight }}>
          {new Date(lead.createdAt).toLocaleDateString('en-IN')}
        </span>
      </div>
    </div>
  );
}

/* ── Quick Action Card ── */
function QuickAction({ icon, label, href, color, delay }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 8, padding: '18px 12px', borderRadius: 16, textDecoration: 'none',
        background: hov ? `${color}12` : T.bgCard,
        border: `1.5px solid ${hov ? color + '40' : T.border}`,
        boxShadow: hov ? `0 10px 32px ${color}18` : '0 2px 8px rgba(0,95,43,0.04)',
        transform: hov ? 'translateY(-5px) scale(1.03)' : 'translateY(0) scale(1)',
        transition: 'all .28s cubic-bezier(.4,0,.2,1)',
        animation: `scaleIn .4s ease ${delay}ms both`,
        cursor: 'pointer',
      }}
    >
      <div style={{
        fontSize: 28,
        transform: hov ? 'rotate(-8deg) scale(1.15)' : 'rotate(0) scale(1)',
        transition: 'transform .28s cubic-bezier(.34,1.56,.64,1)',
        display: 'inline-block',
      }}>
        {icon}
      </div>
      <span style={{
        fontSize: 12, fontWeight: 700,
        color: hov ? color : T.textMuted,
        textAlign: 'center', lineHeight: 1.3, transition: 'color .2s',
      }}>
        {label}
      </span>
    </Link>
  );
}

/* ════════════════════════════════════════════════════
   MAIN DASHBOARD
════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const [stats,         setStats]         = useState(null);
  const [enquiryStats,  setEnquiryStats]  = useState(null);
  const [recentLeads,   setRecentLeads]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [enquiryLoading,setEnquiryLoading]= useState(true);
  const [time,          setTime]          = useState(new Date());

  /* Live clock */
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const r = await axios.get('/api/admin/stats');
      setStats(r.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const loadEnquiries = async () => {
    try {
      setEnquiryLoading(true);
      const r = await axios.get('/api/admin/enquiries');
      setEnquiryStats(r.data.stats);
      /* Show 5 most recent */
      setRecentLeads((r.data.leads || []).slice(0, 5));
    } catch {}
    finally { setEnquiryLoading(false); }
  };

  useEffect(() => {
    loadStats();
    loadEnquiries();
  }, []);

  const statCards = [
    { icon:'👥', label:'Total Users',      value: stats?.stats?.totalUsers          ?? '…', color: T.blue,      sub:'Registered members',   delay:0,   href:'/admin/users'    },
    { icon:'🧘', label:'Active Classes',   value: stats?.stats?.totalClasses        ?? '…', color: T.accentMid, sub:'Live & recorded',       delay:80,  href:'/admin/classes'  },
    { icon:'📅', label:'Total Bookings',   value: stats?.stats?.totalBookings       ?? '…', color: T.gold,      sub:'All time',              delay:160, href:'/admin/bookings' },
    { icon:'✉️', label:'New Messages',     value: stats?.stats?.newContacts         ?? '…', color: T.red,       sub:'Unread contacts',       delay:240, href:'/admin/contacts' },
    { icon:'👑', label:'Premium Members',  value: stats?.stats?.activeSubscriptions ?? 0,   color: T.purple,    sub:'Active plans',          delay:320  },
    { icon:'💰', label:'Total Revenue',    value: `₹${(stats?.stats?.totalRevenue || 0).toLocaleString('en-IN')}`, color:'#f59e0b', sub:'Lifetime earnings', delay:400 },
    { icon:'📋', label:'Enquiry Leads',    value: enquiryStats?.total               ?? '…', color: T.orange,    sub:`${enquiryStats?.newLeads || 0} new`, delay:480, href:'/admin/enquiries' },
    { icon:'💵', label:'Enquiry Revenue',  value: `₹${(enquiryStats?.revenue || 0).toLocaleString('en-IN')}`, color:'#10b981', sub:'From enquiry fees', delay:560 },
  ];

  const quickActions = [
    { icon:'➕', label:'Add Class',       href:'/admin/add-class',     color: T.accentMid, delay:0   },
    { icon:'🖼️', label:'Hero Images',     href:'/admin/hero',          color:'#8b5cf6',    delay:60  },
    { icon:'💰', label:'Update Pricing',  href:'/admin/pricing',       color: T.gold,      delay:120 },
    { icon:'📋', label:'Enquiries',       href:'/admin/enquiries',     color: T.orange,    delay:180 },
    { icon:'📢', label:'Announcements',   href:'/admin/announcements', color:'#f97316',    delay:240 },
    { icon:'🎬', label:'Manage Videos',   href:'/admin/videos',        color: T.red,       delay:300 },
  ];

  const greeting = () => {
    const h = time.getHours();
    if (h < 12) return '🌅 Good Morning';
    if (h < 17) return '☀️ Good Afternoon';
    return '🌙 Good Evening';
  };

  const newEnquiries = enquiryStats?.newLeads || 0;

  return (
    <div>
      {/* ── Welcome Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg,#005f2b 0%,#2ea065 60%,#4cd389 100%)',
        borderRadius: 20, padding: 'clamp(20px,3vw,28px)',
        marginBottom: 28, color: '#fff', position: 'relative', overflow: 'hidden',
        animation: 'fadeInUp .4s ease both',
      }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-30, left:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />

        <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.70)', marginBottom:4, fontWeight:500 }}>
              {greeting()}
            </p>
            <h2 style={{ fontSize:'clamp(18px,2.5vw,24px)', fontWeight:700, fontFamily:"'Cormorant Garamond',serif", margin:0, marginBottom:6 }}>
              Welcome back, {stats ? (stats.recentUsers?.[0]?.name?.split(' ')[0] || 'Admin') : 'Admin'} 🙏
            </h2>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.65)', margin:0 }}>
              Here's what's happening at Yoga Temple today.
            </p>

            {/* Enquiry alert in banner */}
            {newEnquiries > 0 && (
              <Link href="/admin/enquiries" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                marginTop: 12, padding: '8px 16px', borderRadius: 50,
                background: 'rgba(245,158,11,0.20)',
                border: '1px solid rgba(245,158,11,0.40)',
                textDecoration: 'none', color: '#fff',
                fontSize: 13, fontWeight: 700,
                animation: 'badgePop .5s ease .3s both',
              }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background: T.orange, display:'inline-block', animation:'pulse 1.5s infinite' }} />
                {newEnquiries} new enquir{newEnquiries === 1 ? 'y' : 'ies'} waiting →
              </Link>
            )}
          </div>

          {/* Live clock */}
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'clamp(22px,3vw,30px)', fontWeight:800, fontFamily:"'Cormorant Garamond',serif", color:'rgba(255,255,255,0.95)', letterSpacing:1 }}>
              {time.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true })}
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)', marginTop:4 }}>
              {time.toLocaleDateString('en-IN', { weekday:'long', month:'long', day:'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Refresh ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <h3 style={{ fontSize:16, fontWeight:700, color:T.text, fontFamily:"'Cormorant Garamond',serif", margin:0 }}>
          Overview Statistics
        </h3>
        <button
          onClick={() => { loadStats(); loadEnquiries(); toast.success('Stats refreshed!'); }}
          style={{
            display:'flex', alignItems:'center', gap:6,
            background:'linear-gradient(135deg,rgba(76,211,137,0.10),rgba(0,95,43,0.06))',
            border:`1px solid ${T.border}`,
            color: T.accentMid, padding:'8px 18px', borderRadius:10,
            cursor:'pointer', fontSize:13, fontWeight:600,
            fontFamily:'inherit', transition:'all .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(76,211,137,0.18)'; e.currentTarget.style.transform='translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background='linear-gradient(135deg,rgba(76,211,137,0.10),rgba(0,95,43,0.06))'; e.currentTarget.style.transform='none'; }}
        >
          <span style={{ display:'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>🔄</span>
          Refresh
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fit,minmax(clamp(150px,18vw,175px),1fr))',
        gap:'clamp(10px,1.5vw,16px)', marginBottom:32,
      }}>
        {statCards.map(c => (
          <StatCard key={c.label} {...c} value={loading || (c.label.includes('Enquiry') && enquiryLoading) ? '…' : c.value} />
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ marginBottom:32 }}>
        <h3 style={{ fontSize:16, fontWeight:700, color:T.text, fontFamily:"'Cormorant Garamond',serif", marginBottom:14 }}>
          Quick Actions
        </h3>
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fill,minmax(clamp(90px,14vw,110px),1fr))',
          gap:'clamp(8px,1.2vw,14px)',
        }}>
          {quickActions.map(a => <QuickAction key={a.href} {...a} />)}
        </div>
      </div>

      {/* ── Recent Data (3 columns) ── */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fit,minmax(clamp(260px,30vw,320px),1fr))',
        gap:'clamp(14px,2vw,24px)',
      }}>

        {/* Recent Users */}
        <div style={{
          background:T.bgCard, borderRadius:18,
          padding:'clamp(16px,2vw,24px)', border:`1px solid ${T.border}`,
          boxShadow:'0 2px 8px rgba(0,95,43,0.05)',
          animation:'fadeInLeft .5s ease .2s both',
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:T.text, fontFamily:"'Cormorant Garamond',serif", margin:0 }}>
              Recent Users
            </h3>
            <span style={{ fontSize:11, padding:'3px 10px', borderRadius:50, background:'rgba(76,211,137,0.10)', color:T.accentMid, fontWeight:700 }}>
              Latest
            </span>
          </div>

          {loading && (
            <div style={{ textAlign:'center', padding:'24px 0', display:'flex', gap:6, justifyContent:'center' }}>
              {[0,1,2].map(i => <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:T.border, animation:`dotBounce 1.4s ease ${i*0.16}s infinite` }} />)}
            </div>
          )}
          {!loading && (stats?.recentUsers || []).length === 0 && (
            <div style={{ textAlign:'center', padding:'28px 0', color:T.textLight }}>
              <div style={{ fontSize:36, marginBottom:10 }}>👥</div>
              <p style={{ fontSize:13 }}>No users yet</p>
            </div>
          )}
          {!loading && (stats?.recentUsers || []).map((u, i) => (
            <UserRow key={u._id || u.id} u={u} delay={i * 60} />
          ))}
          {!loading && (stats?.recentUsers || []).length > 0 && (
            <Link href="/admin/users" style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:4,
              marginTop:14, fontSize:12, fontWeight:600, color:T.accentMid,
              textDecoration:'none', padding:'8px', borderRadius:8,
              background:'rgba(76,211,137,0.06)', transition:'background .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(76,211,137,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(76,211,137,0.06)'}
            >
              View all users →
            </Link>
          )}
        </div>

        {/* Recent Bookings */}
        <div style={{
          background:T.bgCard, borderRadius:18,
          padding:'clamp(16px,2vw,24px)', border:`1px solid ${T.border}`,
          boxShadow:'0 2px 8px rgba(0,95,43,0.05)',
          animation:'fadeInUp .5s ease .25s both',
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:T.text, fontFamily:"'Cormorant Garamond',serif", margin:0 }}>
              Recent Bookings
            </h3>
            <span style={{ fontSize:11, padding:'3px 10px', borderRadius:50, background:'rgba(196,154,54,0.10)', color:T.gold, fontWeight:700 }}>
              Latest
            </span>
          </div>

          {loading && (
            <div style={{ textAlign:'center', padding:'24px 0', display:'flex', gap:6, justifyContent:'center' }}>
              {[0,1,2].map(i => <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:T.border, animation:`dotBounce 1.4s ease ${i*0.16}s infinite` }} />)}
            </div>
          )}
          {!loading && (stats?.recentBookings || []).length === 0 && (
            <div style={{ textAlign:'center', padding:'28px 0', color:T.textLight }}>
              <div style={{ fontSize:36, marginBottom:10 }}>📅</div>
              <p style={{ fontSize:13 }}>No bookings yet</p>
            </div>
          )}
          {!loading && (stats?.recentBookings || []).map((b, i) => (
            <BookingRow key={b._id || b.id} b={b} delay={i * 60} />
          ))}
          {!loading && (stats?.recentBookings || []).length > 0 && (
            <Link href="/admin/bookings" style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:4,
              marginTop:14, fontSize:12, fontWeight:600, color:T.gold,
              textDecoration:'none', padding:'8px', borderRadius:8,
              background:'rgba(196,154,54,0.06)', transition:'background .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(196,154,54,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(196,154,54,0.06)'}
            >
              View all bookings →
            </Link>
          )}
        </div>

        {/* Recent Enquiry Leads */}
        <div style={{
          background:T.bgCard, borderRadius:18,
          padding:'clamp(16px,2vw,24px)', border:`1px solid ${T.border}`,
          boxShadow:'0 2px 8px rgba(0,95,43,0.05)',
          animation:'fadeInRight .5s ease .3s both',
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:T.text, fontFamily:"'Cormorant Garamond',serif", margin:0 }}>
              Enquiry Leads
            </h3>
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              {newEnquiries > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 800,
                  background: T.orange, color: '#fff',
                  padding: '2px 8px', borderRadius: 50,
                  animation: 'badgePop .4s ease',
                }}>
                  {newEnquiries} new
                </span>
              )}
              <span style={{ fontSize:11, padding:'3px 10px', borderRadius:50, background:'rgba(245,158,11,0.10)', color:T.orange, fontWeight:700 }}>
                📋 Enquiries
              </span>
            </div>
          </div>

          {/* Enquiry mini stats */}
          {enquiryStats && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:14 }}>
              {[
                { label:'New',       value: enquiryStats.newLeads,  color: T.red    },
                { label:'Contacted', value: enquiryStats.contacted, color: T.orange },
                { label:'Closed',    value: enquiryStats.closed,    color: T.accentMid },
              ].map(s => (
                <div key={s.label} style={{
                  textAlign:'center', padding:'8px 4px', borderRadius:8,
                  background: `${s.color}08`, border:`1px solid ${s.color}20`,
                }}>
                  <p style={{ fontSize:16, fontWeight:800, color:s.color, margin:0, fontFamily:"'Cormorant Garamond',serif" }}>
                    {s.value}
                  </p>
                  <p style={{ fontSize:9, color:T.textLight, margin:'2px 0 0', fontWeight:600, textTransform:'uppercase', letterSpacing:.5 }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {enquiryLoading && (
            <div style={{ textAlign:'center', padding:'24px 0', display:'flex', gap:6, justifyContent:'center' }}>
              {[0,1,2].map(i => <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:T.border, animation:`dotBounce 1.4s ease ${i*0.16}s infinite` }} />)}
            </div>
          )}
          {!enquiryLoading && recentLeads.length === 0 && (
            <div style={{ textAlign:'center', padding:'20px 0', color:T.textLight }}>
              <div style={{ fontSize:36, marginBottom:8 }}>📋</div>
              <p style={{ fontSize:13 }}>No enquiry leads yet</p>
              <p style={{ fontSize:11, color:T.textLight }}>
                Create an Enquiry plan in Pricing to start receiving leads.
              </p>
            </div>
          )}
          {!enquiryLoading && recentLeads.map((lead, i) => (
            <EnquiryRow key={lead.id} lead={lead} delay={i * 60} />
          ))}
          {!enquiryLoading && recentLeads.length > 0 && (
            <Link href="/admin/enquiries" style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:4,
              marginTop:14, fontSize:12, fontWeight:600, color:T.orange,
              textDecoration:'none', padding:'8px', borderRadius:8,
              background:'rgba(245,158,11,0.06)', transition:'background .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(245,158,11,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(245,158,11,0.06)'}
            >
              View all enquiries →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}