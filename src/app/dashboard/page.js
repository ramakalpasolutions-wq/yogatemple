// src/app/dashboard/page.js
'use client';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link  from 'next/link';

const STYLES = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes dotBounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
  @keyframes breathe{0%,100%{box-shadow:0 0 0 0 rgba(76,211,137,0)}50%{box-shadow:0 0 0 12px rgba(76,211,137,.10)}}
  @keyframes slideRight{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}

  .prof-tab:hover { background:rgba(76,211,137,.06) !important; color:#1a1208 !important; }
  .prof-action:hover { transform:translateY(-2px) !important; box-shadow:0 8px 24px rgba(0,95,43,.12) !important; }
  .prof-card:hover { border-color:rgba(76,211,137,.30) !important; }

  @media(max-width:900px){
    .prof-layout { flex-direction:column !important; }
    .prof-sidebar { width:100% !important; flex-direction:row !important; overflow-x:auto !important; padding:12px !important; gap:6px !important; }
    .prof-tab-label { display:none !important; }
    .prof-tab { justify-content:center !important; min-width:44px !important; padding:10px !important; }
    .prof-tab-icon { font-size:20px !important; }
  }
  @media(max-width:640px){
    .prof-info-grid { grid-template-columns:1fr !important; }
    .prof-stat-grid { grid-template-columns:repeat(2,1fr) !important; }
  }
`;

function useProfileStyles() {
  useEffect(() => {
    const id = 'prof-styles';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id; el.textContent = STYLES;
    document.head.appendChild(el);
    return () => { try { document.head.removeChild(el); } catch {} };
  }, []);
}

const C = {
  bg:'#f4faf6', card:'#ffffff', border:'#c8e6d4',
  accent:'#005f2b', mid:'#2ea065', light:'#4cd389',
  text:'#1a1208', muted:'#6b5a3e', dim:'#9a8a6a',
  red:'#ef4444', gold:'#c49a36', goldL:'#f0c060',
  orange:'#f59e0b',
};

const CATEGORY_LABELS = {
  HATHA:'🌅 Hatha', VINYASA:'🌊 Vinyasa', ASHTANGA:'🔥 Ashtanga',
  POWER:'⚡ Power', YIN:'🌙 Yin', RESTORATIVE:'🌿 Restorative',
  KUNDALINI:'✨ Kundalini', PRENATAL:'🤰 Prenatal', KIDS:'🧒 Kids',
  MEDITATION:'🧠 Meditation', PRANAYAMA:'🌬️ Pranayama',
};

const TABS = [
  { id:'profile',      icon:'👤', label:'Profile'       },
  { id:'subscription', icon:'👑', label:'Subscription'  },
  { id:'bookings',     icon:'📅', label:'Bookings'      },
  { id:'security',     icon:'🔒', label:'Security'      },
];

export default function ProfilePage() {
  useProfileStyles();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('profile');
  const [bookings,  setBookings]  = useState([]);
  const [loadingB,  setLoadingB]  = useState(false);
  const [userData,  setUserData]  = useState(null);
  const [loadingU,  setLoadingU]  = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth');
  }, [status, router]);

  const fetchBookings = useCallback(async () => {
    if (!session) return;
    try {
      setLoadingB(true);
      const r = await axios.get('/api/bookings');
      setBookings(r.data || []);
    } catch {} finally { setLoadingB(false); }
  }, [session]);

  const fetchUser = useCallback(async () => {
    if (!session) return;
    try {
      setLoadingU(true);
      const r = await axios.get('/api/user/me');
      setUserData(r.data);
    } catch {
      setUserData(null);
    } finally { setLoadingU(false); }
  }, [session]);

  useEffect(() => {
    if (session) { fetchBookings(); fetchUser(); }
  }, [session, fetchBookings, fetchUser]);

  useEffect(() => {
    if (activeTab === 'bookings') fetchBookings();
  }, [activeTab, fetchBookings]);

  if (status === 'loading') {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:C.bg, flexDirection:'column', gap:16 }}>
        <div style={{ width:56, height:56, borderRadius:'50%', background:'linear-gradient(135deg,#4cd389,#005f2b)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, animation:'spin 2s linear infinite' }}>🧘</div>
        <div style={{ display:'flex', gap:6 }}>{[0,1,2].map(i=><div key={i} style={{ width:8, height:8, borderRadius:'50%', background:C.mid, animation:`dotBounce 1.4s ease ${i*.16}s infinite` }}/>)}</div>
      </div>
    );
  }

  if (!session) return null;

  const user = session.user;
  const sub  = user.subscription;

  /* ── Subscription state with real plan name ── */
  const isActive        = sub?.isActive === true &&
                          sub?.endDate &&
                          new Date(sub.endDate) > new Date();
  const planDisplayName = sub?.planName || sub?.plan || 'Premium';

  const daysLeft = sub?.endDate
    ? Math.max(0, Math.ceil((new Date(sub.endDate) - new Date()) / (1000*60*60*24)))
    : null;
  const totalDays = (sub?.startDate && sub?.endDate)
    ? Math.ceil((new Date(sub.endDate) - new Date(sub.startDate)) / (1000*60*60*24))
    : null;
  const progressPct = (totalDays && daysLeft !== null)
    ? Math.max(0, Math.round(((totalDays - daysLeft) / totalDays) * 100))
    : 0;

  const initials = user.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) || '🧘';

  return (
    <div style={{ paddingTop:72, minHeight:'100vh', background:C.bg }}>

      {/* ── Profile Hero Banner ── */}
      <div style={{
        background:'linear-gradient(135deg,#005f2b 0%,#2ea065 60%,#4cd389 100%)',
        padding:'clamp(32px,5vw,52px) 0 0',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:-60, right:'5%', width:240, height:240, borderRadius:'50%', background:'rgba(255,255,255,.05)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:0, left:'10%', width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,.03)', pointerEvents:'none' }} />

        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 clamp(12px,3vw,24px)' }}>
          <div style={{ display:'flex', alignItems:'flex-end', gap:'clamp(16px,3vw,28px)', flexWrap:'wrap', paddingBottom:24 }}>

            {/* Avatar */}
            <div style={{ position:'relative', flexShrink:0, animation:'scaleIn .4s cubic-bezier(.34,1.56,.64,1) both' }}>
              <div style={{
                width:'clamp(76px,12vw,100px)', height:'clamp(76px,12vw,100px)',
                borderRadius:'50%',
                background:'linear-gradient(135deg,rgba(255,255,255,.25),rgba(255,255,255,.10))',
                border:'3px solid rgba(255,255,255,.35)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'clamp(28px,5vw,38px)', fontWeight:800, color:'#fff',
                fontFamily:'Times New Roman',
                animation:'breathe 4s ease-in-out infinite',
                backdropFilter:'blur(8px)',
              }}>
                {initials}
              </div>
              <div style={{ position:'absolute', bottom:4, right:4, width:14, height:14, borderRadius:'50%', background:'#4cd389', border:'2.5px solid #fff' }} />
            </div>

            {/* User info */}
            <div style={{ flex:1, minWidth:0, animation:'fadeUp .4s ease .1s both' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:4 }}>
                <h1 style={{ fontSize:'clamp(20px,4vw,30px)', fontFamily:'Times New Roman', color:'#fff', fontWeight:700, margin:0, lineHeight:1.2 }}>
                  {user.name}
                </h1>
                {isActive && (
                  <span style={{
                    fontSize:10, fontWeight:800, letterSpacing:1,
                    background:'linear-gradient(135deg,#c49a36,#f0c060)',
                    color:'#000', padding:'4px 12px', borderRadius:50, textTransform:'uppercase',
                  }}>
                    👑 {planDisplayName}   {/* ← real plan name */}
                  </span>
                )}
              </div>
              <p style={{ color:'rgba(255,255,255,.70)', fontSize:'clamp(12px,1.4vw,14px)', margin:'0 0 8px' }}>
                {user.email}
              </p>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                {[
                  { icon:'✅', label: user.isVerified !== false ? 'Verified' : 'Unverified' },
                  { icon:'📅', label:`Member since ${new Date(userData?.createdAt || Date.now()).toLocaleDateString('en-IN',{month:'short',year:'numeric'})}` },
                  ...(isActive ? [{ icon:'🧘', label: CATEGORY_LABELS[sub.category] || sub.category }] : []),
                ].map(b => (
                  <span key={b.label} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, color:'rgba(255,255,255,.65)', fontWeight:500 }}>
                    <span>{b.icon}</span>{b.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Sign out */}
            <button
              onClick={() => signOut({ callbackUrl:'/' })}
              style={{
                display:'flex', alignItems:'center', gap:6,
                background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.22)',
                color:'#fff', padding:'9px 18px', borderRadius:10,
                fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
                transition:'all .2s', flexShrink:0,
                animation:'fadeUp .4s ease .2s both',
              }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.22)'}
              onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.12)'}
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'clamp(16px,3vw,28px) clamp(12px,3vw,24px)' }}>
        <div className="prof-layout" style={{ display:'flex', gap:'clamp(14px,2vw,24px)', alignItems:'flex-start' }}>

          {/* Sidebar */}
          <div className="prof-sidebar" style={{
            width:220, flexShrink:0,
            background:C.card, borderRadius:18, border:`1px solid ${C.border}`,
            boxShadow:'0 2px 12px rgba(0,95,43,.05)',
            padding:8, display:'flex', flexDirection:'column', gap:3,
            position:'sticky', top:88,
            animation:'slideRight .4s ease both',
          }}>
            {TABS.map(tab => (
              <button key={tab.id} className="prof-tab"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'11px 14px', borderRadius:12, border:'none',
                  cursor:'pointer', textAlign:'left', width:'100%', fontFamily:'inherit',
                  background: activeTab===tab.id ? 'linear-gradient(135deg,rgba(76,211,137,.12),rgba(0,95,43,.08))' : 'transparent',
                  color: activeTab===tab.id ? C.accent : C.dim,
                  fontWeight: activeTab===tab.id ? 700 : 500,
                  fontSize:14, transition:'all .2s',
                  borderLeft: activeTab===tab.id ? `3px solid ${C.mid}` : '3px solid transparent',
                }}
              >
                <span className="prof-tab-icon" style={{ fontSize:18, flexShrink:0 }}>{tab.icon}</span>
                <span className="prof-tab-label">{tab.label}</span>
              </button>
            ))}

            <div style={{ borderTop:`1px solid ${C.border}`, marginTop:8, paddingTop:8 }}>
              {[
                { href:'/classes',  icon:'🧘', label:'Browse Classes' },
                { href:'/schedule', icon:'📅', label:'Schedule'       },
                { href:'/premium',  icon:'👑', label:'Premium Plans'  },
              ].map(l => (
                <Link key={l.href} href={l.href} className="prof-tab"
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', borderRadius:12, color:C.dim, fontSize:13, fontWeight:500, textDecoration:'none', transition:'all .2s' }}
                >
                  <span style={{ fontSize:16 }}>{l.icon}</span>
                  <span className="prof-tab-label">{l.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Content */}
          <div style={{ flex:1, minWidth:0 }}>

            {/* ════ PROFILE TAB ════ */}
            {activeTab === 'profile' && (
              <div style={{ animation:'fadeUp .35s ease both' }}>
                <Section title="Personal Information" icon="👤">
                  <div className="prof-info-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'clamp(12px,2vw,20px)' }}>
                    {[
                      { icon:'👤', label:'Full Name',     value: user.name                },
                      { icon:'✉️', label:'Email Address', value: user.email               },
                      { icon:'📱', label:'Mobile Number', value: userData?.phone || '—'   },
                      { icon:'📍', label:'Address',       value: userData?.address || '—' },
                      { icon:'🔐', label:'Provider',      value: userData?.provider || 'credentials' },
                      { icon:'📅', label:'Member Since',  value: userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-IN',{dateStyle:'long'}) : '—' },
                      { icon:'🕐', label:'Last Login',    value: userData?.lastLogin ? new Date(userData.lastLogin).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}) : '—' },
                      { icon:'✅', label:'Verification',  value: userData?.isVerified ? '✅ Email Verified' : '⚠️ Not Verified' },
                    ].map(f => (
                      <InfoField key={f.label} icon={f.icon} label={f.label} value={f.value} />
                    ))}
                  </div>
                </Section>

                <Section title="Activity" icon="📊">
                  <div className="prof-stat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'clamp(10px,1.5vw,16px)' }}>
                    {[
                      { icon:'📅', label:'Total Bookings',  value: bookings.length,                                          color:C.mid  },
                      { icon:'✅', label:'Confirmed',       value: bookings.filter(b=>b.status==='CONFIRMED').length,         color:'#3b82f6' },
                      { icon:'👑', label:'Subscription',    value: isActive ? planDisplayName : 'Free',  /* ← real name */  color: isActive ? C.gold : C.dim },
                    ].map(s => (
                      <StatCard key={s.label} {...s} />
                    ))}
                  </div>
                </Section>

                <Section title="Quick Actions" icon="⚡">
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:12 }}>
                    {[
                      { href:'/classes',  icon:'🧘', label:'Browse Classes', color:'#2ea065' },
                      { href:'/schedule', icon:'📅', label:'View Schedule',  color:'#3b82f6' },
                      { href:'/premium',  icon:'👑', label:'Premium Plans',  color:'#c49a36' },
                      { href:'/contact',  icon:'💬', label:'Get Support',    color:'#8b5cf6' },
                    ].map(a => (
                      <Link key={a.href} href={a.href} className="prof-action"
                        style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'18px 12px', borderRadius:16, textDecoration:'none', background:'#fff', border:`1px solid ${C.border}`, transition:'all .25s ease', boxShadow:'0 2px 8px rgba(0,95,43,.04)' }}
                      >
                        <span style={{ fontSize:26 }}>{a.icon}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:C.text, textAlign:'center', lineHeight:1.3 }}>{a.label}</span>
                      </Link>
                    ))}
                  </div>
                </Section>
              </div>
            )}

            {/* ════ SUBSCRIPTION TAB ════ */}
            {activeTab === 'subscription' && (
              <div style={{ animation:'fadeUp .35s ease both' }}>
                {isActive ? (
                  <>
                    {/* Active plan card */}
                    <div style={{
                      background:'linear-gradient(135deg,#1a1208,#2c1810)',
                      borderRadius:20, padding:'clamp(24px,4vw,36px)',
                      marginBottom:20, position:'relative', overflow:'hidden',
                    }}>
                      <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'rgba(196,154,54,.08)', pointerEvents:'none' }} />
                      <div style={{ position:'relative', zIndex:1 }}>
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:24 }}>
                          <div>
                            <div style={{ fontSize:10, fontWeight:700, color:'rgba(196,154,54,.7)', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>
                              Active Plan
                            </div>
                            {/* ← Shows real plan name */}
                            <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontFamily:'Times New Roman', color:'#f0c060', margin:0, fontWeight:700 }}>
                              {planDisplayName}
                            </h2>
                            <p style={{ color:'rgba(255,255,255,.55)', fontSize:14, margin:'6px 0 0' }}>
                              {CATEGORY_LABELS[sub.category] || sub.category} Yoga
                            </p>
                          </div>
                          <div style={{ textAlign:'right' }}>
                            <div style={{ fontSize:10, color:'rgba(255,255,255,.4)', letterSpacing:1, textTransform:'uppercase', marginBottom:4 }}>Expires</div>
                            <div style={{ fontSize:16, fontWeight:700, color:'#fff' }}>
                              {sub.endDate ? new Date(sub.endDate).toLocaleDateString('en-IN',{dateStyle:'long'}) : '—'}
                            </div>
                            {daysLeft !== null && (
                              <div style={{
                                marginTop:6, fontSize:11, fontWeight:700,
                                color: daysLeft <= 7 ? '#ef4444' : '#4cd389',
                                background: daysLeft <= 7 ? 'rgba(239,68,68,.12)' : 'rgba(76,211,137,.12)',
                                padding:'3px 10px', borderRadius:50, display:'inline-block',
                              }}>
                                {daysLeft <= 7 ? `⚠️ ${daysLeft} days left` : `✅ ${daysLeft} days remaining`}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Progress bar */}
                        {totalDays && daysLeft !== null && (
                          <div style={{ marginBottom:20 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                              <span style={{ fontSize:10, color:'rgba(255,255,255,.40)', textTransform:'uppercase', letterSpacing:1 }}>Plan Usage</span>
                              <span style={{ fontSize:10, color:'#f0c060', fontWeight:700 }}>{progressPct}% used · {daysLeft} days left</span>
                            </div>
                            <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,.08)', overflow:'hidden' }}>
                              <div style={{
                                height:'100%', width:`${progressPct}%`,
                                background: daysLeft <= 7
                                  ? 'linear-gradient(90deg,#ef4444,#f87171)'
                                  : 'linear-gradient(90deg,#4cd389,#f0c060)',
                                borderRadius:3, transition:'width 1s ease',
                              }} />
                            </div>
                          </div>
                        )}

                        {/* Details grid */}
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12 }}>
                          {[
                            { label:'Plan',      value: planDisplayName },  /* ← real name */
                            { label:'Category',  value: CATEGORY_LABELS[sub.category] || sub.category },
                            { label:'Started',   value: sub.startDate ? new Date(sub.startDate).toLocaleDateString('en-IN',{dateStyle:'medium'}) : '—' },
                            { label:'Status',    value: '✅ Active' },
                          ].map(d => (
                            <div key={d.label} style={{ background:'rgba(255,255,255,.06)', borderRadius:12, padding:'12px 16px', border:'1px solid rgba(255,255,255,.08)' }}>
                              <div style={{ fontSize:10, color:'rgba(255,255,255,.40)', letterSpacing:1, textTransform:'uppercase', marginBottom:4 }}>{d.label}</div>
                              <div style={{ fontSize:14, fontWeight:700, color:'#f0c060' }}>{d.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Section title="What's Included" icon="✨">
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10 }}>
                        {[
                          `${CATEGORY_LABELS[sub.category]} premium classes`,
                          'All live sessions via Google Meet',
                          'Recorded class replays',
                          'SMS class reminders',
                          'Priority support',
                          'Cancel anytime',
                        ].map(f => (
                          <div key={f} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(76,211,137,.05)', borderRadius:10, border:`1px solid ${C.border}` }}>
                            <span style={{ color:C.mid, fontWeight:800, flexShrink:0 }}>✓</span>
                            <span style={{ fontSize:13, color:C.muted }}>{f}</span>
                          </div>
                        ))}
                      </div>
                    </Section>

                    <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:4 }}>
                      <Link href="/classes" style={{ display:'inline-flex', alignItems:'center', gap:6, background:'linear-gradient(135deg,#4cd389,#2ea065)', color:'#fff', padding:'11px 24px', borderRadius:12, fontSize:14, fontWeight:700, textDecoration:'none', boxShadow:'0 4px 14px rgba(0,95,43,.20)' }}>
                        🧘 Go to My Classes →
                      </Link>
                      <Link href="/schedule" style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(196,154,54,.10)', color:C.gold, border:`1px solid rgba(196,154,54,.25)`, padding:'11px 24px', borderRadius:12, fontSize:14, fontWeight:700, textDecoration:'none' }}>
                        📅 View Schedule →
                      </Link>
                    </div>
                  </>
                ) : (
                  <Section title="No Active Subscription" icon="👑">
                    <div style={{ textAlign:'center', padding:'clamp(28px,4vw,48px) 20px' }}>
                      <div style={{ fontSize:56, marginBottom:16, animation:'float 3s ease-in-out infinite' }}>🧘</div>
                      <h3 style={{ fontSize:'clamp(18px,3vw,24px)', fontFamily:'Times New Roman', color:C.text, marginBottom:8, fontWeight:700 }}>
                        Unlock Premium Access
                      </h3>
                      <p style={{ color:C.dim, fontSize:14, maxWidth:380, margin:'0 auto 24px', lineHeight:1.7 }}>
                        Subscribe to a yoga category and get unlimited access to live classes, recordings, and personal guidance.
                      </p>
                      <Link href="/premium" style={{ display:'inline-flex', alignItems:'center', gap:6, background:'linear-gradient(135deg,#c49a36,#f0c060)', color:'#000', padding:'12px 28px', borderRadius:50, fontSize:14, fontWeight:700, textDecoration:'none', boxShadow:'0 6px 20px rgba(196,154,54,.28)' }}>
                        👑 Choose Your Plan →
                      </Link>
                    </div>
                  </Section>
                )}
              </div>
            )}

            {/* ════ BOOKINGS TAB ════ */}
            {activeTab === 'bookings' && (
              <div style={{ animation:'fadeUp .35s ease both' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                  <div>
                    <h2 style={{ fontSize:20, fontWeight:700, color:C.text, fontFamily:'Times New Roman', margin:0 }}>My Bookings</h2>
                    <p style={{ fontSize:13, color:C.dim, marginTop:4 }}>{bookings.length} total session{bookings.length!==1?'s':''}</p>
                  </div>
                  <button onClick={fetchBookings} style={{ display:'flex', alignItems:'center', gap:6, background:'#fff', border:`1.5px solid ${C.border}`, color:C.mid, padding:'8px 16px', borderRadius:10, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=C.mid}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}
                  >
                    🔄 Refresh
                  </button>
                </div>

                {loadingB ? (
                  <div style={{ textAlign:'center', padding:'40px 0' }}>
                    <div style={{ fontSize:36, animation:'float 2s ease-in-out infinite', marginBottom:12 }}>📅</div>
                    <p style={{ color:C.dim }}>Loading…</p>
                  </div>
                ) : bookings.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'clamp(36px,5vw,60px) 20px', background:'#fff', borderRadius:18, border:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:48, marginBottom:14, animation:'float 3s ease-in-out infinite' }}>📅</div>
                    <h3 style={{ fontFamily:'Times New Roman', color:C.text, marginBottom:8, fontSize:22 }}>No sessions yet</h3>
                    <p style={{ color:C.dim, fontSize:14, marginBottom:20 }}>Browse classes and book your first yoga session.</p>
                    <Link href="/classes" style={{ display:'inline-flex', alignItems:'center', gap:6, background:'linear-gradient(135deg,#4cd389,#2ea065)', color:'#fff', padding:'10px 24px', borderRadius:50, fontSize:13, fontWeight:700, textDecoration:'none' }}>
                      Browse Classes →
                    </Link>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {bookings.map((b,i) => (
                      <BookingCard key={b.id||b._id} booking={b} delay={i*40} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ════ SECURITY TAB ════ */}
            {activeTab === 'security' && (
              <div style={{ animation:'fadeUp .35s ease both' }}>
                <Section title="Account Security" icon="🔒">
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {[
                      { icon:'✉️', title:'Email Verification', desc: session.user.isVerified !== false ? 'Your email is verified.' : 'Please verify your email.', status: session.user.isVerified !== false ? 'verified' : 'pending' },
                      { icon:'📱', title:'Phone Verification', desc: userData?.isPhoneVerified ? 'Your mobile is verified.' : 'Add and verify your phone number.', status: userData?.isPhoneVerified ? 'verified' : 'pending' },
                      { icon:'🔑', title:'Password', desc:'Use a strong password with letters, numbers & symbols.', status:'info' },
                    ].map(item => (
                      <div key={item.title} style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 18px', borderRadius:14, background:'#fff', border:`1px solid ${C.border}` }}>
                        <div style={{ width:42, height:42, borderRadius:12, flexShrink:0, background: item.status==='verified' ? 'rgba(76,211,137,.10)' : item.status==='pending' ? 'rgba(245,158,11,.08)' : 'rgba(59,130,246,.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                          {item.icon}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:2 }}>{item.title}</div>
                          <div style={{ fontSize:12, color:C.dim }}>{item.desc}</div>
                        </div>
                        <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:50, flexShrink:0, background: item.status==='verified' ? 'rgba(76,211,137,.10)' : item.status==='pending' ? 'rgba(245,158,11,.10)' : 'rgba(59,130,246,.10)', color: item.status==='verified' ? C.mid : item.status==='pending' ? '#f59e0b' : '#3b82f6' }}>
                          {item.status==='verified' ? '✓ Verified' : item.status==='pending' ? '⚠️ Pending' : 'ℹ️ Info'}
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Session" icon="🚪">
                  <button
                    onClick={() => signOut({ callbackUrl:'/' })}
                    style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(239,68,68,.07)', color:C.red, border:`1px solid rgba(239,68,68,.20)`, padding:'10px 20px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .2s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,.14)'}
                    onMouseLeave={e=>e.currentTarget.style.background='rgba(239,68,68,.07)'}
                  >
                    🚪 Sign Out
                  </button>
                </Section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */
function Section({ title, icon, children }) {
  return (
    <div className="prof-card" style={{ background:C.card, borderRadius:18, padding:'clamp(18px,3vw,28px)', border:`1px solid ${C.border}`, boxShadow:'0 2px 8px rgba(0,95,43,.04)', marginBottom:16, transition:'border-color .2s' }}>
      <h3 style={{ fontSize:16, fontWeight:700, color:C.text, fontFamily:'Times New Roman', margin:'0 0 18px', display:'flex', alignItems:'center', gap:8 }}>
        <span>{icon}</span>{title}
      </h3>
      {children}
    </div>
  );
}

function InfoField({ icon, label, value }) {
  return (
    <div style={{ padding:'14px 16px', borderRadius:12, background:'rgba(76,211,137,.03)', border:`1px solid ${C.border}` }}>
      <div style={{ fontSize:10, fontWeight:700, color:C.dim, letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize:14, fontWeight:600, color:C.text, wordBreak:'break-all' }}>
        {value || '—'}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding:'18px 16px', borderRadius:14, textAlign:'center', background: hov ? `${color}08` : '#fff', border:`1px solid ${hov ? color+'30' : C.border}`, boxShadow: hov ? `0 8px 24px ${color}12` : '0 2px 6px rgba(0,95,43,.04)', transform: hov ? 'translateY(-3px)' : 'none', transition:'all .25s ease' }}
    >
      <div style={{ fontSize:26, marginBottom:8 }}>{icon}</div>
      <div style={{ fontSize:'clamp(16px,2.5vw,22px)', fontWeight:800, color, fontFamily:'Times New Roman', lineHeight:1, wordBreak:'break-word' }}>{value}</div>
      <div style={{ fontSize:11, color:C.dim, marginTop:6, fontWeight:500 }}>{label}</div>
    </div>
  );
}

function BookingCard({ booking: b, delay }) {
  const isConfirmed = b.status === 'CONFIRMED';
  return (
    <div style={{
      background:'#fff', borderRadius:14,
      padding:'clamp(14px,2vw,18px) clamp(14px,2vw,20px)',
      border:`1px solid ${C.border}`,
      boxShadow:'0 2px 6px rgba(0,95,43,.04)',
      display:'flex', alignItems:'center', gap:14, flexWrap:'wrap',
      animation:`fadeUp .3s ease ${delay}ms both`, transition:'all .2s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(76,211,137,.25)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(0,95,43,.08)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.boxShadow='0 2px 6px rgba(0,95,43,.04)'; }}
    >
      <div style={{ width:42, height:42, borderRadius:12, flexShrink:0, background:'linear-gradient(135deg,rgba(76,211,137,.12),rgba(0,95,43,.08))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
        📅
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {b.sessionTitle || b.class?.title || 'Yoga Session'}
        </div>
        <div style={{ fontSize:12, color:C.dim, display:'flex', gap:10, flexWrap:'wrap' }}>
          {b.scheduledAt && <span>📅 {new Date(b.scheduledAt).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</span>}
          {b.type && <span>· {b.type}</span>}
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <span style={{ fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:50, background: isConfirmed ? 'rgba(76,211,137,.10)' : 'rgba(245,158,11,.10)', color: isConfirmed ? C.mid : '#f59e0b' }}>
          {isConfirmed ? '✓ Confirmed' : b.status}
        </span>
        {b.meetLink && (
          <a href={b.meetLink} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:4, background:'linear-gradient(135deg,#005f2b,#2ea065)', color:'#fff', padding:'6px 12px', borderRadius:8, fontSize:11, fontWeight:700, textDecoration:'none' }}>
            🎥 Join
          </a>
        )}
      </div>
    </div>
  );
}