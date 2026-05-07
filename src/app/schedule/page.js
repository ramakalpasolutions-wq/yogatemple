// src/app/schedule/page.js
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import axios from 'axios';

/* ── Styles ── */
const SCH_STYLES = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
  @keyframes slideLeft{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
  @keyframes slideRight{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:translateX(0)}}
  @keyframes liveDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.6)}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes dotBounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
  @keyframes cardEnter{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}

  .sch-search-input:focus { border-color:#2ea065 !important; box-shadow:0 0 0 4px rgba(76,211,137,.10) !important; }
  .sch-search-input::placeholder { color:rgba(107,90,62,.40) !important; }

  @media(max-width:900px){
    .sch-class-card{flex-direction:column!important;align-items:flex-start!important}
    .sch-time-col{min-width:auto!important;text-align:left!important;margin-bottom:6px!important}
    .sch-cta-col{width:100%!important;margin-top:8px!important}
    .sch-cta-col a,.sch-cta-col button{width:100%!important;justify-content:center!important}
  }
  @media(max-width:640px){
    .sch-mobile-hide{display:none!important}
    .sch-month-grid{grid-template-columns:repeat(7,1fr)!important;font-size:10px!important}
    .sch-month-cell{min-height:44px!important;padding:3px!important}
    .sch-week-header{font-size:9px!important}
  }
`;

function useStyles() {
  useEffect(() => {
    const id = 'sch-v3';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id; el.textContent = SCH_STYLES;
    document.head.appendChild(el);
    return () => { try { document.head.removeChild(el); } catch {} };
  }, []);
}

/* ── Constants ── */
const DAYS        = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAY_SHORT   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const MONTHS      = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const catEmoji    = { HATHA:'🌅',VINYASA:'🌊',ASHTANGA:'🔥',POWER:'⚡',YIN:'🌙',RESTORATIVE:'🌿',KUNDALINI:'✨',PRENATAL:'🤰',KIDS:'🧒',MEDITATION:'🧠',PRANAYAMA:'🌬️' };
const levelColors = { BEGINNER:'#2ea065',INTERMEDIATE:'#c49a36',ADVANCED:'#ef4444',ALL_LEVELS:'#3b82f6' };
const levelDisplay= { BEGINNER:'Beginner',INTERMEDIATE:'Intermediate',ADVANCED:'Advanced',ALL_LEVELS:'All Levels' };

const CATEGORIES = [
  { value:'HATHA',       emoji:'🌅', label:'Hatha'       },
  { value:'VINYASA',     emoji:'🌊', label:'Vinyasa'     },
  { value:'ASHTANGA',    emoji:'🔥', label:'Ashtanga'    },
  { value:'POWER',       emoji:'⚡', label:'Power'       },
  { value:'YIN',         emoji:'🌙', label:'Yin'         },
  { value:'RESTORATIVE', emoji:'🌿', label:'Restorative' },
  { value:'KUNDALINI',   emoji:'✨', label:'Kundalini'   },
  { value:'PRENATAL',    emoji:'🤰', label:'Prenatal'    },
  { value:'KIDS',        emoji:'🧒', label:'Kids'        },
  { value:'MEDITATION',  emoji:'🧠', label:'Meditation'  },
  { value:'PRANAYAMA',   emoji:'🌬️', label:'Pranayama'  },
];

/* ── Helpers ── */
function getDayIndex(date) { const d = date.getDay(); return d === 0 ? 6 : d - 1; }
function getTimeStr(d)     { return new Date(d).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true }); }
function isSameDay(a, b)   { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }

function getRelativeTime(date) {
  const now  = new Date();
  const d    = new Date(date);
  const diff = d - now;
  if (diff < 0) return null;
  const hrs  = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hrs > 24) return null;
  if (hrs > 0)  return `in ${hrs}h ${mins}m`;
  if (mins > 0) return `in ${mins}m`;
  return 'Starting now!';
}

function isLiveNow(cls, now) {
  const start = new Date(cls.scheduledAt);
  const end   = new Date(start.getTime() + cls.duration * 60000);
  return now >= start && now < end;
}

/* ── Calendar helpers ── */
function getMonthDays(year, month) {
  const first         = new Date(year, month, 1);
  const last          = new Date(year, month + 1, 0);
  const startDay      = getDayIndex(first);
  const totalDays     = last.getDate();
  const prevMonthLast = new Date(year, month, 0).getDate();
  const cells         = [];

  for (let i = startDay - 1; i >= 0; i--)
    cells.push({ day: prevMonthLast - i, month: month - 1, outside: true });
  for (let i = 1; i <= totalDays; i++)
    cells.push({ day: i, month, outside: false });
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++)
    cells.push({ day: i, month: month + 1, outside: true });

  return cells;
}

/* ══════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════ */
export default function SchedulePage() {
  useStyles();

  /* ── Session ── */
  const { data: session, status } = useSession();

  /* ── Subscription info — all derived INSIDE component ── */
  const subscription    = session?.user?.subscription ?? null;
  const isActive        = subscription?.isActive === true;
  const subCategory     = subscription?.category?.toUpperCase() ?? null;
  const subCatData      = CATEGORIES.find(c => c.value === subCategory);
  /* ★ planDisplayName: prefer planName (real name) over plan enum */
  const planDisplayName = subscription?.planName || subscription?.plan || 'Premium';

  /* ── UI state ── */
  const today    = new Date();
  const todayIdx = getDayIndex(today);

  const [activeDay,     setActiveDay]     = useState(todayIdx);
  const [allClasses,    setAllClasses]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [viewMode,      setViewMode]      = useState('week');
  const [animDir,       setAnimDir]       = useState('right');
  const [isMobile,      setIsMobile]      = useState(false);
  const [now,           setNow]           = useState(new Date());
  const [search,        setSearch]        = useState('');
  const [searchFoc,     setSearchFoc]     = useState(false);
  const [calYear,       setCalYear]       = useState(today.getFullYear());
  const [calMonth,      setCalMonth]      = useState(today.getMonth());
  const [selectedDate,  setSelectedDate]  = useState(null);

  /* ── Responsive ── */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* ── Live clock ── */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  /* ── Auto switch to day view on mobile ── */
  useEffect(() => {
    if (isMobile && viewMode === 'week') setViewMode('day');
  }, [isMobile, viewMode]);

  /* ── Fetch classes ── */
  const fetchSchedule = useCallback(async () => {
    if (status === 'loading') return;
    try {
      setLoading(true);
      const params = ['type=LIVE'];
      if (isActive && subCategory) params.push(`category=${subCategory}`);
      const r  = await axios.get(`/api/classes?${params.join('&')}`);
      let all  = r.data || [];
      if (!isActive) all = all.filter(c => !c.isPremium);
      setAllClasses(all);
    } catch (err) {
      console.error('Schedule fetch:', err);
    } finally {
      setLoading(false);
    }
  }, [isActive, subCategory, status]);

  useEffect(() => {
    fetchSchedule();
    const t = setInterval(fetchSchedule, 60000);
    return () => clearInterval(t);
  }, [fetchSchedule]);

  /* ── Group by day of week ── */
  const classesByDay = useMemo(() => {
    return DAYS.reduce((acc, _, i) => {
      acc[i] = allClasses
        .filter(cls => cls.scheduledAt && getDayIndex(new Date(cls.scheduledAt)) === i)
        .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
      return acc;
    }, {});
  }, [allClasses]);

  /* ── Group by exact date (month view) ── */
  const classesByDate = useMemo(() => {
    const map = {};
    allClasses.forEach(cls => {
      if (!cls.scheduledAt) return;
      const d   = new Date(cls.scheduledAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(cls);
    });
    Object.keys(map).forEach(k =>
      map[k].sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
    );
    return map;
  }, [allClasses]);

  /* ── Search results ── */
  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return allClasses
      .filter(cls =>
        cls.title?.toLowerCase().includes(q) ||
        cls.instructor?.toLowerCase().includes(q) ||
        cls.category?.toLowerCase().includes(q) ||
        cls.description?.toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  }, [search, allClasses]);

  const dayClasses          = classesByDay[activeDay] || [];
  const monthDays           = getMonthDays(calYear, calMonth);

  const selectedDateClasses = useMemo(() => {
    if (!selectedDate) return [];
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
    return classesByDate[key] || [];
  }, [selectedDate, classesByDate]);

  /* ── Navigation ── */
  const goDay = dir => {
    setAnimDir(dir > 0 ? 'right' : 'left');
    setActiveDay(d => (d + dir + 7) % 7);
  };

  const goMonth = dir => {
    let m = calMonth + dir;
    let y = calYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0)  { m = 11; y--; }
    setCalMonth(m);
    setCalYear(y);
    setSelectedDate(null);
  };

  /* ── Loading screen ── */
  if (status === 'loading') {
    return (
      <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#faf7f2', flexDirection:'column', gap:16 }}>
        <div style={{ fontSize:48, animation:'float 2s ease-in-out infinite' }}>📅</div>
        <p style={{ color:'#9a8a6a', fontSize:15 }}>Loading schedule…</p>
        <div style={{ display:'flex', gap:6 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:'#2ea065', animation:`dotBounce 1.4s ease ${i*.16}s infinite` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── HERO ── */}
      <div style={{
        background:'linear-gradient(135deg,#005f2b 0%,#2ea065 55%,#4cd389 100%)',
        padding:'clamp(100px,14vw,130px) 0 clamp(36px,5vw,52px)',
        textAlign:'center', position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:-60, right:'5%', width:280, height:280, borderRadius:'50%', background:'rgba(255,255,255,.04)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-40, left:'8%', width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,.03)', pointerEvents:'none' }} />

        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', position:'relative', zIndex:1 }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.18)', borderRadius:50, padding:'5px 18px', marginBottom:18, fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:'#fff' }}>
            {isActive && subCatData ? `${subCatData.emoji} ${subCatData.label} Schedule` : '📅 Class Schedule'}
          </span>

          <h1 style={{ fontSize:'clamp(28px,5.5vw,52px)', fontFamily:'Times New Roman', color:'#fff', marginBottom:12, fontWeight:700, textShadow:'0 4px 20px rgba(0,0,0,.18)', lineHeight:1.1 }}>
            {isActive && subCatData
              ? <>{subCatData.emoji} <em style={{ fontStyle:'normal', color:'rgba(255,255,255,.75)' }}>{subCatData.label}</em> Schedule</>
              : <>Live Class <em style={{ fontStyle:'normal', color:'rgba(255,255,255,.75)' }}>Calendar</em></>
            }
          </h1>

          <p style={{ fontSize:'clamp(13px,1.6vw,16px)', color:'rgba(255,255,255,.72)', maxWidth:480, margin:'0 auto', lineHeight:1.7 }}>
            {isActive
              ? `Your ${subCatData?.label || ''} live sessions. Join via Google Meet.`
              : 'Browse and join live yoga sessions. Google Meet links available at class time.'
            }
          </p>
        </div>
      </div>

      {/* ── MAIN ── */}
      <section style={{ background:'#faf7f2', padding:'clamp(20px,3vw,36px) 0 clamp(48px,6vw,72px)' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 clamp(12px,2.5vw,24px)' }}>

          {/* ── Banners ── */}
          {isActive && subCatData && (
            <Banner
              icon={subCatData.emoji}
              bg="rgba(196,154,54,.08)"
              border="rgba(196,154,54,.22)"
              color="#c49a36"
              title={`👑 ${planDisplayName} — ${subCatData.label} Yoga`}
              sub={`Showing ${subCatData.label} live classes only.${
                subscription.endDate
                  ? ` Expires ${new Date(subscription.endDate).toLocaleDateString('en-IN', { dateStyle:'medium' })}.`
                  : ''
              }`}
              linkHref="/classes"
              linkText="All Classes →"
            />
          )}

          {!isActive && session && (
            <Banner
              icon="🔓"
              bg="rgba(76,211,137,.04)"
              border="rgba(76,211,137,.16)"
              color="#2ea065"
              title="Free classes only"
              sub="Subscribe to see premium live sessions."
              linkHref="/premium"
              linkText="👑 Get Premium →"
              linkBg="linear-gradient(135deg,#c49a36,#f0c060)"
              linkColor="#000"
            />
          )}

          {!session && (
            <Banner
              icon="👋"
              bg="rgba(59,130,246,.04)"
              border="rgba(59,130,246,.14)"
              color="#3b82f6"
              title="Welcome!"
              sub="Sign in to book classes and see your schedule."
              linkHref="/auth"
              linkText="Sign In →"
              linkBg="linear-gradient(135deg,#005f2b,#2ea065)"
              linkColor="#fff"
            />
          )}

          {/* ── Controls ── */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:20 }}>

            {/* Navigation */}
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              {viewMode !== 'month' && (
                <>
                  <NavBtn onClick={() => goDay(-1)}>←</NavBtn>
                  <div style={{ minWidth: isMobile ? 100 : 140, textAlign:'center' }}>
                    <h2 style={{ fontSize:'clamp(16px,2.5vw,22px)', fontFamily:'Times New Roman', color:'#1a1208', fontWeight:700, margin:0, lineHeight:1.2 }}>
                      {DAYS[activeDay]}
                    </h2>
                    <p style={{ fontSize:11, color:'#9a8a6a', margin:'2px 0 0' }}>
                      {activeDay === todayIdx ? '● Today' : `${dayClasses.length} class${dayClasses.length !== 1 ? 'es' : ''}`}
                    </p>
                  </div>
                  <NavBtn onClick={() => goDay(1)}>→</NavBtn>
                </>
              )}

              {viewMode === 'month' && (
                <>
                  <NavBtn onClick={() => goMonth(-1)}>←</NavBtn>
                  <div style={{ minWidth: isMobile ? 120 : 180, textAlign:'center' }}>
                    <h2 style={{ fontSize:'clamp(16px,2.5vw,22px)', fontFamily:'Times New Roman', color:'#1a1208', fontWeight:700, margin:0 }}>
                      {MONTHS[calMonth]} {calYear}
                    </h2>
                  </div>
                  <NavBtn onClick={() => goMonth(1)}>→</NavBtn>
                </>
              )}
            </div>

            {/* Search + toggles */}
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              {/* Search */}
              <div style={{ position:'relative', minWidth: isMobile ? 160 : 200 }}>
                <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:14, color:'#9a8a6a', pointerEvents:'none', zIndex:1 }}>🔍</span>
                <input
                  className="sch-search-input"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => setSearchFoc(true)}
                  onBlur={() => setTimeout(() => setSearchFoc(false), 200)}
                  placeholder="Search classes…"
                  style={{
                    width:'100%', padding:'9px 32px 9px 36px',
                    border:`1.5px solid ${searchFoc ? '#2ea065' : '#c8e6d4'}`,
                    borderRadius:12, background:'#fff', fontSize:13, color:'#1a1208',
                    outline:'none', fontFamily:'inherit',
                    transition:'all .2s', boxSizing:'border-box',
                    boxShadow: searchFoc ? '0 0 0 4px rgba(76,211,137,.10)' : 'none',
                  }}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#9a8a6a', cursor:'pointer', fontSize:14, padding:0, lineHeight:1 }}>✕</button>
                )}
              </div>

              {/* Today button */}
              {((viewMode !== 'month' && activeDay !== todayIdx) || (viewMode === 'month' && (calMonth !== today.getMonth() || calYear !== today.getFullYear()))) && (
                <button
                  onClick={() => {
                    if (viewMode === 'month') { setCalMonth(today.getMonth()); setCalYear(today.getFullYear()); setSelectedDate(null); }
                    else { setAnimDir('left'); setActiveDay(todayIdx); }
                  }}
                  style={{ fontSize:11, fontWeight:700, color:'#2ea065', background:'rgba(76,211,137,.08)', border:'1px solid rgba(76,211,137,.20)', borderRadius:50, padding:'7px 14px', cursor:'pointer', fontFamily:'inherit', transition:'all .2s', whiteSpace:'nowrap' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(76,211,137,.16)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(76,211,137,.08)'}
                >
                  Today
                </button>
              )}

              {/* View toggles */}
              <div style={{ display:'flex', background:'#fff', borderRadius:10, border:'1px solid #c8e6d4', padding:3 }}>
                {[
                  { v:'month', l:'📆', lt:'Month' },
                  { v:'week',  l:'📅', lt:'Week'  },
                  { v:'day',   l:'📋', lt:'Day'   },
                ].map(m => (
                  <button key={m.v} onClick={() => setViewMode(m.v)} title={m.lt} style={{
                    padding: isMobile ? '6px 10px' : '6px 14px',
                    borderRadius:7, border:'none', cursor:'pointer',
                    fontSize: isMobile ? 14 : 12, fontWeight:600, fontFamily:'inherit',
                    background: viewMode === m.v ? 'linear-gradient(135deg,#4cd389,#2ea065)' : 'transparent',
                    color: viewMode === m.v ? '#fff' : '#9a8a6a',
                    transition:'all .22s', whiteSpace:'nowrap',
                  }}>
                    {isMobile ? m.l : `${m.l} ${m.lt}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── SEARCH RESULTS ── */}
          {searchResults !== null && (
            <div style={{ marginBottom:28, animation:'fadeUp .3s ease both' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <h3 style={{ fontSize:16, fontFamily:'Times New Roman', color:'#1a1208', fontWeight:700, margin:0 }}>
                  🔍 Search Results ({searchResults.length})
                </h3>
                <button onClick={() => setSearch('')} style={{ fontSize:12, color:'#ef4444', background:'rgba(239,68,68,.06)', border:'1px solid rgba(239,68,68,.15)', borderRadius:50, padding:'5px 14px', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
                  ✕ Clear
                </button>
              </div>

              {searchResults.length === 0 ? (
                <EmptyState icon="🔍" title="No classes match" sub="Try different keywords or clear your search." />
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  {searchResults.slice(0, 10).map((cls, i) => (
                    <ClassCard key={cls.id} cls={cls} idx={i} isMobile={isMobile} now={now} session={session} showDate />
                  ))}
                  {searchResults.length > 10 && (
                    <p style={{ textAlign:'center', fontSize:12, color:'#9a8a6a', fontWeight:600 }}>
                      Showing 10 of {searchResults.length} results
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── MONTH VIEW ── */}
          {viewMode === 'month' && !searchResults && (
            <div style={{ animation:'scaleIn .35s ease both' }}>
              <div style={{ background:'#fff', borderRadius:20, border:'1px solid #c8e6d4', overflow:'hidden', boxShadow:'0 4px 20px rgba(0,95,43,.06)' }}>
                {/* Day headers */}
                <div className="sch-month-grid" style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'1px solid #e8f5ee' }}>
                  {DAY_SHORT.map((d, i) => (
                    <div key={d} className="sch-week-header" style={{ padding:'10px 4px', textAlign:'center', fontSize:11, fontWeight:700, color: i >= 5 ? '#c49a36' : '#9a8a6a', letterSpacing:1, textTransform:'uppercase', background:'rgba(76,211,137,.03)' }}>
                      {isMobile ? d[0] : d}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="sch-month-grid" style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
                  {monthDays.map((cell, i) => {
                    const cellDate   = new Date(calYear, cell.month, cell.day);
                    const isToday    = isSameDay(cellDate, today);
                    const isSelected = selectedDate && isSameDay(cellDate, selectedDate);
                    const key        = `${cellDate.getFullYear()}-${cellDate.getMonth()}-${cellDate.getDate()}`;
                    const classes    = classesByDate[key] || [];
                    const hasClasses = classes.length > 0;

                    return (
                      <div
                        key={i}
                        className="sch-month-cell"
                        onClick={() => { if (!cell.outside) setSelectedDate(cellDate); }}
                        style={{
                          minHeight: isMobile ? 48 : 80,
                          padding: isMobile ? '4px 2px' : '8px 6px',
                          borderRight: (i + 1) % 7 !== 0 ? '1px solid #f0faf4' : 'none',
                          borderBottom: i < 35 ? '1px solid #f0faf4' : 'none',
                          background: isSelected ? 'rgba(76,211,137,.08)' : isToday ? 'rgba(76,211,137,.04)' : 'transparent',
                          opacity: cell.outside ? .4 : 1,
                          cursor: cell.outside ? 'default' : 'pointer',
                          transition:'background .15s', position:'relative',
                        }}
                        onMouseEnter={e => { if (!cell.outside) e.currentTarget.style.background = 'rgba(76,211,137,.06)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = isSelected ? 'rgba(76,211,137,.08)' : isToday ? 'rgba(76,211,137,.04)' : 'transparent'; }}
                      >
                        <div style={{
                          width: isMobile ? 22 : 26, height: isMobile ? 22 : 26, borderRadius:'50%',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize: isMobile ? 11 : 13, fontWeight: isToday || isSelected ? 800 : 500,
                          background: isToday ? 'linear-gradient(135deg,#4cd389,#2ea065)' : isSelected ? 'rgba(76,211,137,.15)' : 'transparent',
                          color: isToday ? '#fff' : isSelected ? '#005f2b' : cell.outside ? '#c8e6d4' : '#1a1208',
                          margin: isMobile ? '0 auto' : '0',
                          transition:'all .2s',
                        }}>
                          {cell.day}
                        </div>

                        {hasClasses && !isMobile && (
                          <div style={{ marginTop:4, display:'flex', flexDirection:'column', gap:2 }}>
                            {classes.slice(0, 2).map(cls => (
                              <div key={cls.id} style={{ fontSize:9, fontWeight:600, lineHeight:1.3, padding:'2px 4px', borderRadius:4, background:`${levelColors[cls.level] || '#6b7280'}12`, color: levelColors[cls.level] || '#6b7280', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                {getTimeStr(cls.scheduledAt)}
                              </div>
                            ))}
                            {classes.length > 2 && <div style={{ fontSize:8, color:'#9a8a6a', fontWeight:700, textAlign:'center' }}>+{classes.length - 2}</div>}
                          </div>
                        )}

                        {hasClasses && isMobile && (
                          <div style={{ display:'flex', justifyContent:'center', gap:2, marginTop:3 }}>
                            {classes.slice(0, 3).map((cls, j) => (
                              <div key={j} style={{ width:4, height:4, borderRadius:'50%', background: cls.isPremium ? '#c49a36' : '#2ea065' }} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected date detail */}
              {selectedDate && (
                <div style={{ marginTop:20, animation:'fadeUp .3s ease both' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                    <h3 style={{ fontSize:16, fontFamily:'Times New Roman', color:'#1a1208', fontWeight:700, margin:0 }}>
                      📅 {selectedDate.toLocaleDateString('en-IN', { weekday:'long', month:'long', day:'numeric' })}
                    </h3>
                    <span style={{ fontSize:12, color:'#9a8a6a', fontWeight:600 }}>
                      {selectedDateClasses.length} class{selectedDateClasses.length !== 1 ? 'es' : ''}
                    </span>
                  </div>

                  {selectedDateClasses.length === 0 ? (
                    <EmptyState icon="📅" title="No classes on this date" sub="Select another date or check the week view." />
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                      {selectedDateClasses.map((cls, i) => (
                        <ClassCard key={cls.id} cls={cls} idx={i} isMobile={isMobile} now={now} session={session} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── WEEK VIEW ── */}
          {viewMode === 'week' && !isMobile && !searchResults && (
            <div style={{ background:'#fff', borderRadius:20, border:'1px solid #c8e6d4', overflow:'hidden', boxShadow:'0 4px 20px rgba(0,95,43,.06)', animation:'scaleIn .35s ease both' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'1px solid #e8f5ee' }}>
                {DAYS.map((day, i) => (
                  <button key={day} onClick={() => { setActiveDay(i); setViewMode('day'); }}
                    style={{ padding:'14px 8px', textAlign:'center', cursor:'pointer', background: i === todayIdx ? 'rgba(76,211,137,.06)' : 'transparent', border:'none', borderRight: i < 6 ? '1px solid #e8f5ee' : 'none', fontFamily:'inherit', transition:'background .2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(76,211,137,.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = i === todayIdx ? 'rgba(76,211,137,.06)' : 'transparent'}
                  >
                    <div style={{ fontSize:11, color:'#9a8a6a', fontWeight:600, letterSpacing:1, textTransform:'uppercase', marginBottom:4 }}>{DAY_SHORT[i]}</div>
                    <div style={{ width:28, height:28, borderRadius:'50%', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, background: i === todayIdx ? 'linear-gradient(135deg,#4cd389,#2ea065)' : 'transparent', color: i === todayIdx ? '#fff' : '#1a1208', border: i === activeDay && i !== todayIdx ? '2px solid #2ea065' : 'none' }}>
                      {i + 1}
                    </div>
                    {(classesByDay[i]?.length || 0) > 0 && (
                      <div style={{ marginTop:6, display:'flex', justifyContent:'center', gap:3 }}>
                        {Array.from({ length: Math.min(classesByDay[i].length, 4) }).map((_, j) => (
                          <div key={j} style={{ width:5, height:5, borderRadius:'50%', background: classesByDay[i][j]?.isPremium ? '#c49a36' : '#2ea065' }} />
                        ))}
                        {classesByDay[i].length > 4 && <span style={{ fontSize:8, color:'#9a8a6a', fontWeight:700 }}>+{classesByDay[i].length - 4}</span>}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
                {DAYS.map((_, i) => {
                  const classes = classesByDay[i] || [];
                  return (
                    <div key={i} onClick={() => { setActiveDay(i); setViewMode('day'); }}
                      style={{ padding:'clamp(6px,1vw,14px)', minHeight:110, borderRight: i < 6 ? '1px solid #f0faf4' : 'none', background: i === activeDay ? 'rgba(76,211,137,.03)' : 'transparent', cursor:'pointer', transition:'background .15s', display:'flex', flexDirection:'column', gap:4 }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(76,211,137,.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = i === activeDay ? 'rgba(76,211,137,.03)' : 'transparent'}
                    >
                      {classes.length === 0 && <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#c8e6d4', fontSize:11 }}>—</div>}
                      {classes.slice(0, 3).map((cls, j) => <CalCell key={cls.id} cls={cls} delay={j * 40} />)}
                      {classes.length > 3 && <div style={{ fontSize:10, color:'#2ea065', fontWeight:700, textAlign:'center' }}>+{classes.length - 3} more</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── DAY VIEW ── */}
          {(viewMode === 'day' || isMobile) && !searchResults && (
            <div key={activeDay} style={{ animation:`${animDir === 'right' ? 'slideLeft' : 'slideRight'} .3s ease both` }}>

              {/* Mobile day pills */}
              {isMobile && viewMode === 'day' && (
                <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:8, marginBottom:18, scrollbarWidth:'none' }}>
                  {DAYS.map((day, i) => (
                    <button key={day} onClick={() => { setAnimDir(i > activeDay ? 'right' : 'left'); setActiveDay(i); }}
                      style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'8px 12px', borderRadius:14, border:'none', cursor:'pointer', background: i === activeDay ? 'linear-gradient(135deg,#4cd389,#2ea065)' : '#fff', color: i === activeDay ? '#fff' : '#1a1208', boxShadow: i === activeDay ? '0 4px 16px rgba(76,211,137,.28)' : '0 1px 4px rgba(0,0,0,.06)', fontFamily:'inherit', flexShrink:0, minWidth:52, transition:'all .22s', outline: i === todayIdx && i !== activeDay ? '2px solid #2ea065' : 'none', outlineOffset:2 }}>
                      <span style={{ fontSize:10, fontWeight:600, opacity: i === activeDay ? .85 : .6 }}>{DAY_SHORT[i]}</span>
                      <span style={{ fontSize:16, fontWeight:800 }}>{i + 1}</span>
                      {(classesByDay[i]?.length || 0) > 0 && <div style={{ width:5, height:5, borderRadius:'50%', background: i === activeDay ? 'rgba(255,255,255,.6)' : '#2ea065', marginTop:2 }} />}
                    </button>
                  ))}
                </div>
              )}

              {loading && (
                <div style={{ textAlign:'center', padding:'48px 0' }}>
                  <div style={{ fontSize:36, marginBottom:10, animation:'float 2s ease-in-out infinite' }}>📅</div>
                  <p style={{ color:'#9a8a6a', fontSize:14 }}>Loading…</p>
                </div>
              )}

              {!loading && dayClasses.length === 0 && (
                <EmptyState
                  icon={isActive && subCatData ? subCatData.emoji : '📅'}
                  title={`No classes on ${DAYS[activeDay]}`}
                  sub={isActive ? `Check other days for ${subCatData?.label || ''} sessions.` : 'Try another day or browse all classes.'}
                  linkHref="/classes"
                  linkText="Browse Classes →"
                />
              )}

              {!loading && dayClasses.length > 0 && (
                <div style={{ position:'relative', paddingLeft: isMobile ? 0 : 32 }}>
                  {!isMobile && <div style={{ position:'absolute', left:13, top:0, bottom:0, width:3, background:'linear-gradient(180deg,#4cd389,#c8e6d4)', borderRadius:2 }} />}
                  <div style={{ display:'flex', flexDirection:'column', gap:'clamp(12px,2vw,18px)' }}>
                    {dayClasses.map((cls, idx) => (
                      <ClassCard key={cls.id} cls={cls} idx={idx} isMobile={isMobile} now={now} session={session} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Footer ── */}
          <div style={{
            marginTop:'clamp(32px,5vw,48px)',
            background:'linear-gradient(135deg,rgba(76,211,137,.06),rgba(0,95,43,.03))',
            border:'1px solid rgba(76,211,137,.14)',
            borderRadius:18, padding:'clamp(16px,2.5vw,24px)', textAlign:'center',
          }}>
            <p style={{ color:'#005f2b', fontWeight:700, marginBottom:6, fontSize:'clamp(13px,1.4vw,15px)' }}>
              {isActive
                ? `📅 Your ${subCatData?.label || ''} classes are on Google Meet`
                : '📅 All live classes via Google Meet'
              }
            </p>
            <p style={{ color:'#9a8a6a', fontSize:'clamp(12px,1.3vw,14px)', marginBottom: isActive ? 0 : 12 }}>
              {isActive ? 'Click "Join Meet" at class time.' : 'Subscribe to get class links and SMS reminders.'}
            </p>
            {!isActive && (
              <Link href="/premium" style={{ display:'inline-flex', alignItems:'center', gap:6, background:'linear-gradient(135deg,#4cd389,#2ea065)', color:'#fff', padding:'10px 24px', borderRadius:50, fontSize:13, fontWeight:700, textDecoration:'none', boxShadow:'0 4px 14px rgba(0,95,43,.20)' }}>
                View Premium Plans →
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

/* ══════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════ */
function CalCell({ cls, delay }) {
  const color = levelColors[cls.level] || '#6b7280';
  const time  = getTimeStr(cls.scheduledAt);
  return (
    <div style={{ background:`${color}08`, borderLeft:`3px solid ${color}`, borderRadius:8, padding:'5px 8px', fontSize:10, lineHeight:1.4, animation:`fadeIn .3s ease ${delay}ms both`, cursor:'pointer' }}>
      <div style={{ fontWeight:700, color:'#1a1208', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{cls.title}</div>
      <div style={{ color:'#9a8a6a', display:'flex', gap:6, alignItems:'center', marginTop:2 }}>
        <span>{time}</span>
        {cls.isPremium && <span style={{ color:'#c49a36', fontWeight:700 }}>👑</span>}
      </div>
    </div>
  );
}

function ClassCard({ cls, idx, isMobile, now, session, showDate }) {
  const [hov,    setHov]    = useState(false);
  const [btnHov, setBtnHov] = useState(false);

  const color = levelColors[cls.level] || '#6b7280';
  const emoji = catEmoji[cls.category] || '🧘';
  const time  = getTimeStr(cls.scheduledAt);
  const rel   = getRelativeTime(cls.scheduledAt);
  const live  = isLiveNow(cls, now);

  return (
    <div style={{ position:'relative', animation:`cardEnter .35s ease ${idx * 60}ms both` }}>
      {!isMobile && !showDate && (
        <div style={{ position:'absolute', left:-32, top:22, width:14, height:14, borderRadius:'50%', background: live ? '#ef4444' : '#fff', border:`3px solid ${live ? '#ef4444' : '#2ea065'}`, zIndex:2, animation: live ? 'liveDot 1.5s infinite' : 'none', boxShadow: live ? '0 0 10px rgba(239,68,68,.4)' : '0 0 0 4px rgba(76,211,137,.10)' }} />
      )}

      <div
        className="sch-class-card"
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background:'#fff', borderRadius:16,
          padding:'clamp(14px,2vw,20px) clamp(14px,2vw,22px)',
          border:`1px solid ${hov ? 'rgba(76,211,137,.28)' : live ? 'rgba(239,68,68,.20)' : '#e8f5ee'}`,
          boxShadow: hov ? '0 12px 36px rgba(0,95,43,.10)' : '0 2px 8px rgba(0,95,43,.04)',
          transform: hov ? 'translateY(-3px)' : 'none',
          transition:'all .25s ease',
          display:'flex', alignItems:'center', gap:'clamp(12px,2vw,20px)', flexWrap:'wrap',
          borderLeft:`4px solid ${color}`,
          position:'relative', overflow:'hidden',
        }}
      >
        {live && <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,#ef4444,#ff8a8a,#ef4444)', backgroundSize:'200% 100%', animation:'shimmer 2s linear infinite' }} />}

        <div className="sch-time-col" style={{ minWidth:80, textAlign:'center', flexShrink:0 }}>
          {showDate && (
            <div style={{ fontSize:10, color:'#9a8a6a', fontWeight:600, marginBottom:4 }}>
              {new Date(cls.scheduledAt).toLocaleDateString('en-IN', { weekday:'short', month:'short', day:'numeric' })}
            </div>
          )}
          <div style={{ fontSize:'clamp(15px,2vw,19px)', fontWeight:800, fontFamily:'Times New Roman', color: live ? '#ef4444' : '#005f2b' }}>
            {time}
          </div>
          <div style={{ fontSize:11, color:'#9a8a6a' }}>{cls.duration} min</div>
          {rel && (
            <div style={{ fontSize:9, fontWeight:700, marginTop:4, color: live ? '#ef4444' : '#2ea065', background: live ? 'rgba(239,68,68,.08)' : 'rgba(76,211,137,.08)', padding:'2px 8px', borderRadius:50, display:'inline-block' }}>
              {live
                ? <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><span style={{ width:5, height:5, borderRadius:'50%', background:'#ef4444', animation:'liveDot 1.5s infinite' }} />LIVE NOW</span>
                : rel
              }
            </div>
          )}
        </div>

        {cls.image && (
          <div style={{ width:56, height:56, borderRadius:12, overflow:'hidden', flexShrink:0 }}>
            <img src={cls.image} alt={cls.title} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          </div>
        )}

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:4 }}>
            <h3 style={{ fontSize:'clamp(14px,1.7vw,17px)', margin:0, fontFamily:'Times New Roman', color:'#1a1208', fontWeight:700 }}>{cls.title}</h3>
            {cls.isPremium && <span style={{ fontSize:9, fontWeight:700, background:'rgba(196,154,54,.12)', color:'#c49a36', padding:'2px 7px', borderRadius:50 }}>👑</span>}
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginBottom:4 }}>
            <span style={{ fontSize:12, color:'#9a8a6a' }}>👤 {cls.instructor}</span>
            <span style={{ fontSize:10, fontWeight:600, background:`${color}12`, color, padding:'2px 8px', borderRadius:50 }}>{emoji} {cls.category}</span>
            <span style={{ fontSize:10, fontWeight:600, background:`${color}12`, color, padding:'2px 8px', borderRadius:50 }}>{levelDisplay[cls.level]}</span>
          </div>
          {cls.description && (
            <p style={{ fontSize:12, color:'#9a8a6a', lineHeight:1.5, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {cls.description}
            </p>
          )}
        </div>

        <div className="sch-cta-col" style={{ flexShrink:0 }}>
          {cls.googleMeetLink ? (
            <a
              href={cls.googleMeetLink}
              target="_blank" rel="noopener noreferrer"
              onMouseEnter={() => setBtnHov(true)}
              onMouseLeave={() => setBtnHov(false)}
              style={{
                display:'inline-flex', alignItems:'center', gap:6,
                background: btnHov
                  ? (live ? 'linear-gradient(135deg,#ef4444,#ff6b6b)' : 'linear-gradient(135deg,#2ea065,#4cd389)')
                  : (live ? 'linear-gradient(135deg,#ff6b6b,#ef4444)' : 'linear-gradient(135deg,#005f2b,#2ea065)'),
                color:'#fff', padding:'10px 20px', borderRadius:12,
                fontSize:13, fontWeight:700, textDecoration:'none',
                boxShadow: btnHov ? '0 8px 24px rgba(0,95,43,.22)' : '0 4px 12px rgba(0,95,43,.12)',
                transform: btnHov ? 'translateY(-1px)' : 'none',
                transition:'all .22s',
              }}
            >
              {live ? '🔴 Join Now' : '🎥 Join Meet'}
            </a>
          ) : (
            <Link href="/classes" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'10px 20px', borderRadius:12, fontSize:13, fontWeight:700, color:'#2ea065', border:'1.5px solid rgba(76,211,137,.25)', background:'transparent', textDecoration:'none', transition:'all .2s' }}>
              View →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, sub, linkHref, linkText }) {
  return (
    <div style={{ textAlign:'center', padding:'clamp(36px,5vw,56px) 20px', background:'#fff', borderRadius:20, border:'1px solid #c8e6d4', boxShadow:'0 2px 12px rgba(0,95,43,.05)', animation:'scaleIn .3s ease both' }}>
      <div style={{ fontSize:48, marginBottom:14, animation:'float 3s ease-in-out infinite' }}>{icon}</div>
      <h3 style={{ color:'#1a1208', marginBottom:8, fontFamily:'Times New Roman', fontSize:'clamp(17px,2.5vw,22px)', fontWeight:700 }}>{title}</h3>
      <p style={{ color:'#9a8a6a', fontSize:14, maxWidth:360, margin:'0 auto 18px', lineHeight:1.6 }}>{sub}</p>
      {linkHref && (
        <Link href={linkHref}
          style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'10px 24px', borderRadius:50, fontSize:13, fontWeight:700, color:'#2ea065', border:'1.5px solid #2ea065', background:'transparent', textDecoration:'none', transition:'all .2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#2ea065'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2ea065'; }}
        >
          {linkText}
        </Link>
      )}
    </div>
  );
}

function Banner({ icon, bg, border, color, title, sub, linkHref, linkText, linkBg, linkColor }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, background:bg, border:`1px solid ${border}`, borderRadius:16, padding:'14px 20px', marginBottom:20, animation:'fadeUp .4s ease both' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:22 }}>{icon}</span>
        <div>
          <p style={{ fontSize:13, fontWeight:700, color:'#1a1208', margin:0 }}>{title}</p>
          <p style={{ fontSize:12, color:'#9a8a6a', margin:'2px 0 0' }}>{sub}</p>
        </div>
      </div>
      <Link href={linkHref} style={{ fontSize:12, fontWeight:700, color: linkColor || color, textDecoration:'none', borderRadius:50, padding:'7px 16px', background: linkBg || `${color}12`, border: linkBg ? 'none' : `1px solid ${border}`, flexShrink:0, transition:'all .2s' }}>
        {linkText}
      </Link>
    </div>
  );
}

function NavBtn({ children, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{ width:38, height:38, borderRadius:12, border:'1.5px solid #c8e6d4', background: h ? 'rgba(76,211,137,.08)' : '#fff', color:'#005f2b', fontSize:16, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s', fontFamily:'inherit', transform: h ? 'scale(1.08)' : 'scale(1)' }}
    >
      {children}
    </button>
  );
}