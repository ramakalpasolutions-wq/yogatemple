// src/app/admin/bookings/page.js
'use client';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const T = {
  border: '#c8e6d4', accentMid: '#2ea065', accentLight: '#4cd389',
  accentPale: 'rgba(76,211,137,0.10)', gold: '#c49a36',
  text: '#1a1208', textMuted: '#6b5a3e', textLight: '#9a8a6a',
  red: '#ef4444', blue: '#3b82f6', orange: '#f59e0b', bg: '#f4faf6',
};

const STYLES = `
  @keyframes modalIn  { from{opacity:0;transform:scale(.94) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes overlayIn{ from{opacity:0} to{opacity:1} }
  @keyframes fadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .bk-modal   { animation: modalIn   .28s cubic-bezier(.34,1.56,.64,1) both; }
  .bk-overlay { animation: overlayIn .2s  ease both; }
  @media (max-width:640px) {
    .bk-modal {
      width:100%!important; max-width:100%!important;
      border-radius:20px 20px 0 0!important;
      position:fixed!important; bottom:0!important;
      left:0!important; right:0!important; max-height:92vh!important;
    }
    .bk-table-wrap { display:none!important; }
    .bk-cards-wrap { display:block!important; }
  }
  @media (min-width:641px) {
    .bk-cards-wrap { display:none!important; }
    .bk-table-wrap { display:block!important; }
  }
`;

function useStyles() {
  useEffect(() => {
    const id = 'bk-styles';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id; el.textContent = STYLES;
    document.head.appendChild(el);
    return () => { try { document.head.removeChild(el); } catch {} };
  }, []);
}

/* ── Helpers ── */
const STATUS_CFG = {
  CONFIRMED: { bg:'rgba(76,211,137,0.12)',  color:'#2ea065', label:'✅ Confirmed' },
  PENDING:   { bg:'rgba(245,158,11,0.12)',  color:'#d97706', label:'⏳ Pending'   },
  CANCELLED: { bg:'rgba(239,68,68,0.10)',   color:'#ef4444', label:'❌ Cancelled' },
  ATTENDED:  { bg:'rgba(59,130,246,0.10)',  color:'#3b82f6', label:'🎯 Attended'  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || { bg:'#f5f5f5', color:'#9a8a6a', label: status };
  return (
    <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:50, background:cfg.bg, color:cfg.color, whiteSpace:'nowrap' }}>
      {cfg.label}
    </span>
  );
}

/* Detect if a booking is from the floating button */
function isFloatingBooking(b) {
  return (
    b.sessionTitle?.toLowerCase().includes('required session') ||
    b.notes?.toLowerCase().includes('required session') ||
    b.type === 'REQUIRED'
  );
}

function parseNotes(notes) {
  if (!notes) return {};
  const result = {};
  notes.split(' | ').forEach(part => {
    const idx = part.indexOf(': ');
    if (idx > -1) result[part.slice(0,idx).trim()] = part.slice(idx+2).trim();
  });
  return result;
}

/* ── Stat Card ── */
function StatCard({ icon, label, value, color = T.accentMid, small }) {
  return (
    <div style={{
      background:'#fff', border:`1px solid ${T.border}`,
      borderRadius:14, padding: small ? '12px 14px' : '16px 18px',
      boxShadow:'0 2px 8px rgba(0,95,43,0.05)',
      display:'flex', alignItems:'center', gap:12,
    }}>
      <div style={{
        width: small ? 36 : 44, height: small ? 36 : 44, borderRadius:12,
        background:`${color}18`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize: small ? 16 : 20, flexShrink:0,
      }}>{icon}</div>
      <div>
        <p style={{ fontSize:10, color:T.textLight, margin:'0 0 2px', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>{label}</p>
        <p style={{ fontSize: small ? 18 : 22, fontWeight:800, color, margin:0, fontFamily:'Georgia,serif' }}>{value}</p>
      </div>
    </div>
  );
}

/* ── Source badge ── */
function SourceBadge({ booking }) {
  const isFloat = isFloatingBooking(booking);
  return (
    <span style={{
      fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:50,
      background: isFloat ? 'rgba(245,158,11,0.12)' : 'rgba(76,211,137,0.08)',
      color: isFloat ? T.orange : T.accentMid,
      whiteSpace:'nowrap',
    }}>
      {isFloat ? '📅 Session' : '🧘 Class'}
    </span>
  );
}

/* ══════════════════════════════════════════════════════
   BOOKING DETAIL MODAL
══════════════════════════════════════════════════════ */
function BookingModal({ booking, onClose, onStatusChange }) {
  const [updating,  setUpdating]  = useState(false);
  const [meetLink,  setMeetLink]  = useState(booking.meetLink || '');
  const [linkSaved, setLinkSaved] = useState(false);

  const notes    = parseNotes(booking.notes);
  const name     = booking.user?.name  || notes['Name']  || '—';
  const email    = booking.user?.email || notes['Email'] || '—';
  const phone    = booking.user?.phone || notes['Phone'] || '—';
  const isFloat  = isFloatingBooking(booking);

  const scheduledDate = booking.scheduledAt
    ? new Date(booking.scheduledAt).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
    : '—';
  const scheduledTime = booking.scheduledAt
    ? new Date(booking.scheduledAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
    : '—';

  const handleStatus = async newStatus => {
    if (updating || booking.status === newStatus) return;
    setUpdating(true);
    try {
      await axios.patch(`/api/admin/bookings?id=${booking.id}`, { status: newStatus });
      toast.success(`Status → ${newStatus}`);
      onStatusChange(booking.id, newStatus);
      onClose();
    } catch { toast.error('Failed to update status'); }
    finally { setUpdating(false); }
  };

  const handleSaveMeetLink = async () => {
    setUpdating(true);
    try {
      await axios.patch(`/api/admin/bookings?id=${booking.id}`, { meetLink });
      toast.success('Meet link saved!');
      setLinkSaved(true);
      onStatusChange(booking.id, booking.status, meetLink);
    } catch { toast.error('Failed to save meet link'); }
    finally { setUpdating(false); }
  };

  return (
    <div className="bk-overlay" onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(10,61,46,0.55)', backdropFilter:'blur(6px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:16,
    }}>
      <div className="bk-modal" onClick={e => e.stopPropagation()} style={{
        background:'#fff', borderRadius:20,
        width:'100%', maxWidth:560,
        maxHeight:'90vh', overflowY:'auto',
        boxShadow:'0 32px 80px rgba(0,0,0,0.28)',
      }}>
        {/* Header */}
        <div style={{
          background: isFloat
            ? 'linear-gradient(135deg,#92400e,#f59e0b)'
            : 'linear-gradient(135deg,#0a3d2e,#2ea065)',
          borderRadius:'20px 20px 0 0', padding:'20px 22px',
          display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10,
        }}>
          <div>
            <h2 style={{ color:'#fff', fontSize:18, fontWeight:700, margin:'0 0 4px', fontFamily:'Georgia,serif' }}>
              {isFloat ? '📅 Required Session Booking' : '🧘 Class Booking Details'}
            </h2>
            <p style={{ color:'rgba(255,255,255,0.7)', fontSize:12, margin:0 }}>
              Ref: #{booking.id.slice(-8).toUpperCase()} · Booked {new Date(booking.bookedAt).toLocaleDateString('en-IN')}
            </p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            <StatusBadge status={booking.status} />
            <button onClick={onClose} style={{
              background:'rgba(255,255,255,0.18)', border:'none', borderRadius:'50%',
              width:32, height:32, cursor:'pointer', fontSize:15, color:'#fff',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>✕</button>
          </div>
        </div>

        <div style={{ padding:'20px 22px' }}>

          {/* Source label */}
          <div style={{
            marginBottom:16, padding:'8px 12px', borderRadius:10,
            background: isFloat ? 'rgba(245,158,11,0.07)' : T.accentPale,
            border: `1px solid ${isFloat ? 'rgba(245,158,11,0.2)' : T.border}`,
            fontSize:12, color: isFloat ? '#92400e' : T.accentMid,
            fontWeight:600, display:'flex', alignItems:'center', gap:6,
          }}>
            <span>{isFloat ? '📅' : '🧘'}</span>
            {isFloat ? 'Required Session — Booked via floating button' : 'Class booking'}
          </div>

          {/* Customer */}
          <ModalSection title="👤 Customer">
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
              <div style={{
                width:48, height:48, borderRadius:'50%', flexShrink:0,
                background:'linear-gradient(135deg,rgba(76,211,137,0.2),rgba(0,95,43,0.15))',
                border:`1.5px solid ${T.border}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:20, fontWeight:700, color:T.accentMid,
              }}>
                {name[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize:16, fontWeight:700, color:T.text, margin:0 }}>{name}</p>
                <p style={{ fontSize:12, color:T.textLight, margin:'2px 0 0' }}>{email}</p>
                {phone !== '—' && <p style={{ fontSize:12, color:T.textLight, margin:'2px 0 0' }}>📱 {phone}</p>}
              </div>
            </div>
            {/* Contact actions */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <a href={`mailto:${email}`} style={{
                display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700,
                padding:'6px 12px', borderRadius:8, textDecoration:'none',
                background:'rgba(59,130,246,0.07)', color:T.blue,
                border:'1px solid rgba(59,130,246,0.2)',
              }}>
                📧 Send Email
              </a>
              {phone !== '—' && (
                <a href={`tel:${phone}`} style={{
                  display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700,
                  padding:'6px 12px', borderRadius:8, textDecoration:'none',
                  background:'rgba(76,211,137,0.07)', color:T.accentMid,
                  border:`1px solid rgba(76,211,137,0.2)`,
                }}>
                  📱 Call
                </a>
              )}
              {phone !== '—' && (
                <a href={`https://wa.me/${phone.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener noreferrer" style={{
                  display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700,
                  padding:'6px 12px', borderRadius:8, textDecoration:'none',
                  background:'rgba(37,211,102,0.07)', color:'#25D366',
                  border:'1px solid rgba(37,211,102,0.2)',
                }}>
                  💬 WhatsApp
                </a>
              )}
            </div>
          </ModalSection>

          {/* Session */}
          <ModalSection title="📅 Session Details">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                ['📅','Date',    scheduledDate],
                ['⏰','Time',    scheduledTime],
                ['💰','Amount', `₹${booking.amount}`],
                ['🏷️','Type',   booking.sessionTitle || 'Required Session'],
              ].map(([icon,label,value]) => (
                <div key={label} style={{
                  background:'#f0faf4', borderRadius:10, padding:'10px 12px',
                  border:'1px solid rgba(76,211,137,0.15)',
                }}>
                  <p style={{ fontSize:10, color:T.textLight, margin:'0 0 3px', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>{label}</p>
                  <p style={{ fontSize:13, color:T.text, margin:0, fontWeight:600 }}>{icon} {value}</p>
                </div>
              ))}
            </div>
          </ModalSection>

          {/* Payment */}
          {booking.paymentId && (
            <ModalSection title="💳 Payment">
              <div style={{ background:'#f9fafb', borderRadius:10, padding:'10px 14px', border:`1px solid ${T.border}` }}>
                <p style={{ fontSize:10, color:T.textLight, margin:'0 0 3px', fontWeight:700, textTransform:'uppercase' }}>Payment / Order ID</p>
                <p style={{ fontSize:12, color:T.text, margin:0, fontWeight:600, wordBreak:'break-all', fontFamily:'monospace' }}>
                  {booking.paymentId}
                </p>
              </div>
            </ModalSection>
          )}

          {/* Meet Link */}
          <ModalSection title="🔗 Meeting Link (Optional)">
            <div style={{ display:'flex', gap:8 }}>
              <input
                value={meetLink}
                onChange={e => { setMeetLink(e.target.value); setLinkSaved(false); }}
                placeholder="https://meet.google.com/..."
                style={{
                  flex:1, padding:'10px 12px',
                  border:`1.5px solid ${T.border}`, borderRadius:10,
                  fontSize:13, color:T.text, outline:'none',
                  fontFamily:'inherit', background:'#fafffe',
                  transition:'border-color .2s',
                }}
                onFocus={e => e.target.style.borderColor = T.accentMid}
                onBlur={e => e.target.style.borderColor = T.border}
              />
              <button onClick={handleSaveMeetLink} disabled={updating} style={{
                padding:'10px 16px', background: linkSaved ? T.accentMid : '#fff',
                border:`1.5px solid ${T.border}`, borderRadius:10,
                cursor:'pointer', fontSize:12, fontWeight:700,
                color: linkSaved ? '#fff' : T.accentMid, fontFamily:'inherit',
                transition:'all .2s', whiteSpace:'nowrap',
              }}>
                {linkSaved ? '✅ Saved' : '💾 Save'}
              </button>
            </div>
          </ModalSection>

          {/* Status */}
          <ModalSection title="🔄 Update Status">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {['CONFIRMED','ATTENDED','PENDING','CANCELLED'].map(s => {
                const cfg = STATUS_CFG[s];
                const isActive = booking.status === s;
                return (
                  <button key={s} onClick={() => handleStatus(s)} disabled={updating || isActive}
                    style={{
                      padding:'10px 14px', borderRadius:10,
                      border:`1.5px solid ${isActive ? cfg.color : T.border}`,
                      background: isActive ? cfg.bg : '#fff',
                      color: isActive ? cfg.color : T.textMuted,
                      cursor: isActive ? 'default' : 'pointer',
                      fontSize:12, fontWeight:700, fontFamily:'inherit',
                      opacity: isActive ? 0.9 : 1, transition:'all .2s',
                    }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background=cfg.bg; e.currentTarget.style.borderColor=cfg.color; e.currentTarget.style.color=cfg.color; }}}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background='#fff'; e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.textMuted; }}}
                  >
                    {cfg.label} {isActive ? '(current)' : ''}
                  </button>
                );
              })}
            </div>
          </ModalSection>
        </div>
      </div>
    </div>
  );
}

function ModalSection({ title, children }) {
  return (
    <div style={{ marginBottom:18 }}>
      <h3 style={{ fontSize:11, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:'uppercase', marginBottom:10, marginTop:0 }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ── Mobile Card ── */
function BookingCard({ booking, onClick }) {
  const notes = parseNotes(booking.notes);
  const name  = booking.user?.name  || notes['Name']  || '—';
  const email = booking.user?.email || notes['Email'] || '—';

  const scheduledDate = booking.scheduledAt
    ? new Date(booking.scheduledAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
    : '—';
  const scheduledTime = booking.scheduledAt
    ? new Date(booking.scheduledAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
    : '—';

  return (
    <div onClick={() => onClick(booking)} style={{
      background:'#fff', border:`1px solid ${T.border}`,
      borderRadius:14, padding:16, marginBottom:12,
      cursor:'pointer', boxShadow:'0 2px 8px rgba(0,95,43,0.05)',
      transition:'all .2s', animation:'fadeUp .3s ease',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(0,95,43,0.12)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 2px 8px rgba(0,95,43,0.05)'; }}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, marginBottom:10 }}>
        <div style={{ minWidth:0 }}>
          <p style={{ fontSize:15, fontWeight:700, color:T.text, margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</p>
          <p style={{ fontSize:12, color:T.textLight, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{email}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <SourceBadge booking={booking} />
        <span style={{ fontSize:12, color:T.textMuted }}>📅 {scheduledDate}</span>
        <span style={{ fontSize:12, color:T.textMuted }}>⏰ {scheduledTime}</span>
        <span style={{ fontSize:13, fontWeight:700, color:T.accentMid }}>₹{booking.amount}</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════ */
export default function AdminBookingsPage() {
  useStyles();

  const [bookings, setBookings] = useState([]);
  const [stats,    setStats]    = useState({ total:0, confirmed:0, attended:0, cancelled:0, pending:0, revenue:0, floatingTotal:0, floatingConfirmed:0, floatingRevenue:0 });
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('ALL');
  /* ── NEW: source tab ── */
  const [sourceTab, setSourceTab] = useState('FLOATING'); // 'FLOATING' | 'ALL'

  const load = useCallback(async (src = sourceTab) => {
    try {
      setLoading(true);
      const params = src === 'FLOATING' ? '?source=floating' : '';
      const r = await axios.get(`/api/admin/bookings${params}`);
      setBookings(r.data.bookings || []);
      if (r.data.stats) setStats(r.data.stats);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [sourceTab]);

  useEffect(() => { load(sourceTab); }, [sourceTab]);

  const handleStatusChange = (id, newStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
  };

  const filtered = bookings.filter(b => {
    const notes = parseNotes(b.notes);
    const name  = b.user?.name  || notes['Name']  || '';
    const email = b.user?.email || notes['Email'] || '';
    const q     = search.toLowerCase();
    const matchSearch = !search || name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
    const matchFilter = filter === 'ALL' || b.status === filter;
    return matchSearch && matchFilter;
  });

  /* Stats to show depend on source tab */
  const displayStats = sourceTab === 'FLOATING'
    ? {
        total:     stats.floatingTotal     || 0,
        confirmed: stats.floatingConfirmed || 0,
        attended:  bookings.filter(b => b.status === 'ATTENDED').length,
        cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
        pending:   bookings.filter(b => b.status === 'PENDING').length,
        revenue:   stats.floatingRevenue   || 0,
      }
    : stats;

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:700, color:T.text, fontFamily:'Georgia,serif', marginBottom:4 }}>
            📋 Bookings
          </h2>
          <p style={{ fontSize:13, color:T.textLight, margin:0 }}>
            {stats.floatingTotal} required sessions · {stats.total - stats.floatingTotal} class bookings · {stats.total} total
          </p>
        </div>
        <button
          onClick={() => { load(sourceTab); toast.success('Refreshed!'); }}
          style={{
            background:'#fff', border:`1.5px solid ${T.border}`,
            color:T.accentMid, padding:'10px 18px', borderRadius:10,
            cursor:'pointer', fontSize:13, fontWeight:600,
            fontFamily:'inherit', display:'flex', alignItems:'center', gap:6,
            transition:'all .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor=T.accentMid; e.currentTarget.style.transform='translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.transform='none'; }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* ── SOURCE TABS ── */}
      <div style={{
        display:'flex', background:'rgba(76,211,137,0.05)',
        borderRadius:14, padding:4, marginBottom:24,
        border:'1px solid rgba(76,211,137,0.15)',
        maxWidth:440,
      }}>
        {[
          { value:'FLOATING', label:'📅 Required Sessions', count: stats.floatingTotal },
          { value:'ALL',      label:'🧘 All Bookings',      count: stats.total         },
        ].map(tab => (
          <button key={tab.value} onClick={() => setSourceTab(tab.value)} style={{
            flex:1, padding:'10px 8px', borderRadius:10, border:'none',
            cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'inherit',
            background: sourceTab === tab.value
              ? tab.value === 'FLOATING'
                ? 'linear-gradient(135deg,#f59e0b,#fbbf24)'
                : 'linear-gradient(135deg,#4cd389,#2ea065)'
              : 'transparent',
            color: sourceTab === tab.value ? (tab.value === 'FLOATING' ? '#1a1208' : '#fff') : T.textLight,
            boxShadow: sourceTab === tab.value ? '0 4px 14px rgba(0,95,43,.18)' : 'none',
            transition:'all .25s ease',
            display:'flex', alignItems:'center', justifyContent:'center', gap:6,
          }}>
            {tab.label}
            <span style={{
              fontSize:10, fontWeight:800, padding:'1px 7px', borderRadius:50,
              background: sourceTab === tab.value ? 'rgba(255,255,255,0.25)' : 'rgba(76,211,137,0.10)',
              color: sourceTab === tab.value ? (tab.value === 'FLOATING' ? '#1a1208' : '#fff') : T.accentMid,
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── FLOATING notice banner ── */}
      {sourceTab === 'FLOATING' && (
        <div style={{
          background:'rgba(245,158,11,0.07)',
          border:'1px solid rgba(245,158,11,0.2)',
          borderRadius:12, padding:'12px 16px', marginBottom:20,
          display:'flex', alignItems:'center', gap:10, fontSize:13,
          animation:'fadeUp .3s ease',
        }}>
          <span style={{ fontSize:20, flexShrink:0 }}>📅</span>
          <div>
            <p style={{ margin:0, fontWeight:700, color:'#92400e' }}>Required Session Bookings</p>
            <p style={{ margin:'2px 0 0', fontSize:12, color:'#78350f' }}>
              These are bookings made via the floating "Book Your Required Session" button. Contact customers within 24 hours.
            </p>
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',
        gap:12, marginBottom:24,
      }}>
        <StatCard icon="📋" label="Total"     value={displayStats.total}     color={T.accentMid} />
        <StatCard icon="✅" label="Confirmed" value={displayStats.confirmed} color={T.accentMid} />
        <StatCard icon="🎯" label="Attended"  value={displayStats.attended}  color={T.blue}      />
        <StatCard icon="❌" label="Cancelled" value={displayStats.cancelled} color={T.red}       />
        <StatCard icon="💰" label="Revenue"   value={`₹${(displayStats.revenue||0).toLocaleString('en-IN')}`} color={T.gold} />
      </div>

      {/* ── Filters ── */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:200, maxWidth:360 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:T.textLight, fontSize:14, pointerEvents:'none' }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            style={{
              width:'100%', padding:'10px 12px 10px 36px', boxSizing:'border-box',
              border:`1.5px solid ${T.border}`, borderRadius:10,
              background:'#fff', fontSize:13, color:T.text,
              outline:'none', fontFamily:'inherit', transition:'border-color .2s',
            }}
            onFocus={e => e.target.style.borderColor = T.accentMid}
            onBlur={e => e.target.style.borderColor = T.border}
          />
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {['ALL','CONFIRMED','ATTENDED','PENDING','CANCELLED'].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding:'8px 12px', borderRadius:8,
              borderColor: filter === s ? T.accentMid : T.border,
              border: `1.5px solid ${filter === s ? T.accentMid : T.border}`,
              background: filter === s ? T.accentPale : '#fff',
              color: filter === s ? T.accentMid : T.textLight,
              fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
              transition:'all .15s',
            }}>
              {s === 'ALL' ? `All (${displayStats.total})` : s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Mobile Cards ── */}
      <div className="bk-cards-wrap">
        {loading && (
          <div style={{ textAlign:'center', padding:48, color:T.textLight }}>
            <div style={{ fontSize:36, marginBottom:12 }}>⏳</div>Loading…
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:48, color:T.textLight }}>
            <div style={{ fontSize:36, marginBottom:12 }}>
              {sourceTab === 'FLOATING' ? '📅' : '📋'}
            </div>
            {sourceTab === 'FLOATING' ? 'No required session bookings yet' : 'No bookings found'}
          </div>
        )}
        {filtered.map(b => <BookingCard key={b.id} booking={b} onClick={setSelected} />)}
      </div>

      {/* ── Desktop Table ── */}
      <div className="bk-table-wrap" style={{
        background:'#fff', borderRadius:16,
        border:`1px solid ${T.border}`,
        boxShadow:'0 2px 8px rgba(0,95,43,0.05)', overflow:'hidden',
      }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:720 }}>
            <thead>
              <tr style={{ background:'linear-gradient(135deg,rgba(76,211,137,0.06),rgba(0,95,43,0.04))', borderBottom:`1px solid ${T.border}` }}>
                {['Source', 'Customer', 'Contact', 'Session Date & Time', 'Amount', 'Status', 'Booked On'].map(h => (
                  <th key={h} style={{ padding:'14px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:'uppercase', whiteSpace:'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} style={{ padding:48, textAlign:'center', color:T.textLight }}>
                  <div style={{ fontSize:36, marginBottom:12 }}>⏳</div>Loading bookings…
                </td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding:48, textAlign:'center', color:T.textLight }}>
                  <div style={{ fontSize:36, marginBottom:12 }}>
                    {sourceTab === 'FLOATING' ? '📅' : '📋'}
                  </div>
                  {sourceTab === 'FLOATING'
                    ? 'No required session bookings yet. Required sessions are booked via the floating button on the website.'
                    : search || filter !== 'ALL' ? 'No bookings match your filter' : 'No bookings yet'}
                </td></tr>
              )}
              {filtered.map(b => {
                const notes = parseNotes(b.notes);
                const name  = b.user?.name  || notes['Name']  || '—';
                const email = b.user?.email || notes['Email'] || '—';
                const phone = b.user?.phone || notes['Phone'] || '—';
                const sDate = b.scheduledAt ? new Date(b.scheduledAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—';
                const sTime = b.scheduledAt ? new Date(b.scheduledAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : '—';

                return (
                  <tr key={b.id} onClick={() => setSelected(b)}
                    style={{ borderBottom:`1px solid ${T.border}`, cursor:'pointer', transition:'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(76,211,137,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    <td style={{ padding:'14px 16px' }}>
                      <SourceBadge booking={b} />
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{
                          width:36, height:36, borderRadius:'50%', flexShrink:0,
                          background:'linear-gradient(135deg,rgba(76,211,137,0.18),rgba(0,95,43,0.12))',
                          border:`1.5px solid ${T.border}`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:13, fontWeight:700, color:T.accentMid,
                        }}>
                          {name[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontSize:14, fontWeight:600, color:T.text }}>{name}</span>
                      </div>
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      <p style={{ fontSize:12, color:T.textLight, margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:160 }}>{email}</p>
                      {phone !== '—' && <p style={{ fontSize:11, color:T.textLight, margin:0 }}>📱 {phone}</p>}
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      <p style={{ fontSize:13, color:T.text, margin:'0 0 2px', fontWeight:600 }}>📅 {sDate}</p>
                      <p style={{ fontSize:11, color:T.textLight, margin:0 }}>⏰ {sTime}</p>
                    </td>
                    <td style={{ padding:'14px 16px', fontSize:14, fontWeight:700, color:T.accentMid }}>
                      ₹{b.amount}
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      <StatusBadge status={b.status} />
                    </td>
                    <td style={{ padding:'14px 16px', fontSize:11, color:T.textLight }}>
                      {new Date(b.bookedAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <BookingModal
          booking={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}