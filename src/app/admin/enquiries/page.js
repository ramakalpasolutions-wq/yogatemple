// src/app/admin/enquiries/page.js
'use client';
import { useEffect, useState } from 'react';
import axios  from 'axios';
import toast  from 'react-hot-toast';

const T = {
  border:'#c8e6d4', accentMid:'#2ea065', accentLight:'#4cd389',
  accentPale:'rgba(76,211,137,0.10)', gold:'#c49a36',
  text:'#1a1208', textMuted:'#6b5a3e', textLight:'#9a8a6a',
  red:'#ef4444', orange:'#f59e0b', blue:'#3b82f6', purple:'#8b5cf6',
};

const KF = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes spin{to{transform:rotate(360deg)}}
`;

const STATUS_CONFIG = {
  NEW:       { label:'New',       color:'#fff',   bg:'#ef4444',   border:'#ef4444'   },
  CONTACTED: { label:'Contacted', color:'#fff',   bg:'#f59e0b',   border:'#f59e0b'   },
  CLOSED:    { label:'Closed',    color:'#fff',   bg:'#2ea065',   border:'#2ea065'   },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.NEW;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 10px',
      borderRadius: 50, background: cfg.bg, color: cfg.color,
      display: 'inline-block',
    }}>
      {cfg.label}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
      {[60, 40, 70, 50].map((w, i) => (
        <div key={i} style={{ height: 10, width: `${w}%`, borderRadius: 6, marginBottom: 12, background: 'linear-gradient(90deg,#e8f5ee,#d4ede0,#e8f5ee)', backgroundSize: '200% 100%', animation: 'shimmer 1.6s infinite' }} />
      ))}
    </div>
  );
}

/* ── Lead Card ── */
function LeadCard({ lead, onStatusChange, onDelete }) {
  const [hov,       setHov]       = useState(false);
  const [notes,     setNotes]     = useState(lead.adminNotes || '');
  const [saving,    setSaving]    = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [confirmDel,setConfirmDel]= useState(false);

  const handleStatus = async (status) => {
    setSaving(true);
    try {
      await axios.patch(`/api/admin/enquiries?id=${lead.id}`, { status });
      toast.success(`Status → ${status}`);
      onStatusChange(lead.id, status);
    } catch { toast.error('Failed to update status'); }
    finally { setSaving(false); }
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await axios.patch(`/api/admin/enquiries?id=${lead.id}`, { adminNotes: notes });
      toast.success('Notes saved!');
      setShowNotes(false);
    } catch { toast.error('Failed to save notes'); }
    finally { setSaving(false); }
  };

  const createdAt = new Date(lead.createdAt).toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short',
  });

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setConfirmDel(false); }}
      style={{
        background: '#fff', borderRadius: 16, overflow: 'hidden',
        border: `1px solid ${hov ? T.accentMid : T.border}`,
        boxShadow: hov ? '0 12px 32px rgba(0,95,43,.10)' : '0 2px 8px rgba(0,95,43,.05)',
        transform: hov ? 'translateY(-3px)' : 'none',
        transition: 'all .25s ease', animation: 'fadeUp .4s ease',
      }}
    >
      {/* Top bar */}
      <div style={{
        height: 4,
        background: lead.status === 'CLOSED'
          ? 'linear-gradient(90deg,#4cd389,#2ea065)'
          : lead.status === 'CONTACTED'
            ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
            : 'linear-gradient(90deg,#ef4444,#f87171)',
      }} />

      <div style={{ padding: '16px 18px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0, fontFamily: 'Georgia,serif' }}>
                {lead.userName}
              </h3>
              <StatusBadge status={lead.status} />
            </div>
            <p style={{ fontSize: 12, color: T.textLight, margin: 0 }}>📅 {createdAt}</p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontSize: 20, fontWeight: 800, color: T.orange, margin: 0, fontFamily: 'Georgia,serif' }}>
              ₹{(lead.amount || 0).toLocaleString('en-IN')}
            </p>
            <p style={{ fontSize: 10, color: T.textLight, margin: '2px 0 0' }}>paid</p>
          </div>
        </div>

        {/* Contact info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <a href={`mailto:${lead.userEmail}`} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 10px', background: 'rgba(59,130,246,0.06)',
            border: '1px solid rgba(59,130,246,0.15)',
            borderRadius: 8, textDecoration: 'none', fontSize: 12,
            color: T.blue, fontWeight: 600, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            📧 {lead.userEmail}
          </a>
          {lead.userPhone ? (
            <a href={`tel:${lead.userPhone}`} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 10px', background: 'rgba(76,211,137,0.06)',
              border: '1px solid rgba(76,211,137,0.18)',
              borderRadius: 8, textDecoration: 'none', fontSize: 12,
              color: T.accentMid, fontWeight: 600,
            }}>
              📱 {lead.userPhone}
            </a>
          ) : (
            <div style={{ padding: '8px 10px', background: 'rgba(0,0,0,.03)', border: '1px solid rgba(0,0,0,.06)', borderRadius: 8, fontSize: 12, color: T.textLight }}>
              📱 No phone
            </div>
          )}
        </div>

        {/* Plan info */}
        <div style={{ padding: '10px 12px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 10, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <div>
              <p style={{ fontSize: 10, color: T.textLight, margin: '0 0 2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 }}>Enquiry Plan</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: T.orange, margin: 0 }}>{lead.planName}</p>
            </div>
            <code style={{ fontSize: 10, color: T.textLight, background: '#f4faf6', padding: '2px 8px', borderRadius: 4 }}>
              {lead.planKey}
            </code>
          </div>
        </div>

        {/* Admin notes */}
        {lead.adminNotes && !showNotes && (
          <div style={{ padding: '8px 12px', background: T.accentPale, border: `1px solid rgba(76,211,137,0.18)`, borderRadius: 8, marginBottom: 12, fontSize: 12, color: T.textMuted }}>
            📝 {lead.adminNotes}
          </div>
        )}

        {showNotes && (
          <div style={{ marginBottom: 12 }}>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add notes about this customer…"
              rows={3}
              style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${T.border}`, borderRadius: 10, fontSize: 12, color: T.text, background: '#fafffe', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = T.accentMid}
              onBlur={e => e.target.style.borderColor = T.border}
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button onClick={handleSaveNotes} disabled={saving} style={{ flex: 2, padding: '8px', background: 'linear-gradient(135deg,#4cd389,#2ea065)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? '⏳ Saving…' : '💾 Save Notes'}
              </button>
              <button onClick={() => setShowNotes(false)} style={{ flex: 1, padding: '8px', background: 'transparent', border: `1px solid ${T.border}`, color: T.textLight, borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Status actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 10 }}>
          {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
            <button
              key={s}
              onClick={() => handleStatus(s)}
              disabled={saving || lead.status === s}
              style={{
                padding: '8px 4px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                border: `1.5px solid ${lead.status === s ? cfg.border : T.border}`,
                background: lead.status === s ? cfg.bg : 'transparent',
                color: lead.status === s ? cfg.color : T.textLight,
                cursor: saving || lead.status === s ? 'default' : 'pointer',
                fontFamily: 'inherit', transition: 'all .2s',
              }}
              onMouseEnter={e => { if (lead.status !== s && !saving) { e.currentTarget.style.background = cfg.bg; e.currentTarget.style.color = cfg.color; e.currentTarget.style.borderColor = cfg.border; }}}
              onMouseLeave={e => { if (lead.status !== s) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textLight; e.currentTarget.style.borderColor = T.border; }}}
            >
              {s === 'NEW' ? '🔴' : s === 'CONTACTED' ? '🟡' : '🟢'} {cfg.label}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setShowNotes(v => !v)}
            style={{ flex: 1, padding: '8px', background: showNotes ? T.accentPale : 'rgba(76,211,137,0.04)', border: `1px solid ${showNotes ? T.accentMid : T.border}`, color: showNotes ? T.accentMid : T.textLight, borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}
          >
            📝 {lead.adminNotes ? 'Edit' : 'Add'} Notes
          </button>

          {confirmDel ? (
            <>
              <button onClick={() => onDelete(lead.id)} style={{ flex: 1, padding: '8px', background: 'rgba(239,68,68,0.12)', color: T.red, border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Yes, Delete
              </button>
              <button onClick={() => setConfirmDel(false)} style={{ flex: 1, padding: '8px', background: 'transparent', border: `1px solid ${T.border}`, color: T.textLight, borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
            </>
          ) : (
            <button onClick={() => setConfirmDel(true)} style={{ flex: 1, padding: '8px', background: 'rgba(239,68,68,0.05)', color: T.red, border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.05)'}
            >
              🗑️ Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════ */
export default function EnquiriesPage() {
  const [leads,    setLeads]    = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('ALL');
  const [search,   setSearch]   = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const r = await axios.get('/api/admin/enquiries');
      setLeads(r.data.leads || []);
      setStats(r.data.stats);
    } catch { toast.error('Failed to load enquiries'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = (id, status) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/admin/enquiries?id=${id}`);
      toast.success('Lead deleted');
      setLeads(prev => prev.filter(l => l.id !== id));
    } catch { toast.error('Delete failed'); }
  };

  const filtered = leads.filter(l => {
    const matchStatus = filter === 'ALL' || l.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !search ||
      l.userName?.toLowerCase().includes(q) ||
      l.userEmail?.toLowerCase().includes(q) ||
      l.planName?.toLowerCase().includes(q) ||
      l.userPhone?.includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div>
      <style suppressHydrationWarning>{KF}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, fontFamily: 'Georgia,serif', marginBottom: 4 }}>
            📋 Enquiry Leads
          </h2>
          <p style={{ fontSize: 13, color: T.textLight, margin: 0 }}>
            Users who paid an enquiry fee — contact them and close the lead
          </p>
        </div>
        <button onClick={load} style={{ background: '#fff', border: `1.5px solid ${T.border}`, color: T.accentMid, padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .2s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = T.accentMid}
          onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Leads',  value: stats.total,     color: T.text,       bg: '#fff',                      border: T.border },
            { label: 'New',          value: stats.newLeads,  color: '#ef4444',    bg: 'rgba(239,68,68,0.05)',      border: 'rgba(239,68,68,0.2)' },
            { label: 'Contacted',    value: stats.contacted, color: T.orange,     bg: 'rgba(245,158,11,0.05)',     border: 'rgba(245,158,11,0.2)' },
            { label: 'Closed',       value: stats.closed,    color: T.accentMid,  bg: T.accentPale,                border: T.border },
            { label: 'Total Revenue',value: `₹${(stats.revenue || 0).toLocaleString('en-IN')}`, color: T.gold, bg: 'rgba(196,154,54,0.06)', border: 'rgba(196,154,54,0.2)' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: 0, fontFamily: 'Georgia,serif' }}>{s.value}</p>
              <p style={{ fontSize: 11, color: T.textLight, margin: '4px 0 0', fontWeight: 600 }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: T.textLight, pointerEvents: 'none' }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, phone…"
            style={{ width: '100%', padding: '10px 12px 10px 34px', border: `1.5px solid ${T.border}`, borderRadius: 10, background: '#fff', fontSize: 13, color: T.text, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = T.accentMid}
            onBlur={e => e.target.style.borderColor = T.border}
          />
        </div>

        {/* Status filters */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { v: 'ALL',       label: 'All'       },
            { v: 'NEW',       label: '🔴 New'    },
            { v: 'CONTACTED', label: '🟡 Contacted' },
            { v: 'CLOSED',    label: '🟢 Closed' },
          ].map(f => (
            <button key={f.v} onClick={() => setFilter(f.v)} style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: filter === f.v ? 700 : 500,
              background: filter === f.v ? 'linear-gradient(135deg,#4cd389,#2ea065)' : '#fff',
              color: filter === f.v ? '#fff' : T.textMuted,
              border: filter === f.v ? 'none' : `1px solid ${T.border}`,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s',
              boxShadow: filter === f.v ? '0 4px 12px rgba(76,211,137,0.25)' : 'none',
            }}>
              {f.label}
            </button>
          ))}
        </div>

        <span style={{ fontSize: 12, color: T.textLight, fontWeight: 600 }}>
          {loading ? 'Loading…' : `${filtered.length} lead${filtered.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 16, padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📋</div>
          <h3 style={{ color: T.text, marginBottom: 8, fontFamily: 'Georgia,serif', fontSize: 22 }}>
            {leads.length === 0 ? 'No Enquiry Leads Yet' : 'No Leads Match'}
          </h3>
          <p style={{ color: T.textLight, fontSize: 14 }}>
            {leads.length === 0
              ? 'When users pay an enquiry fee, their details will appear here.'
              : 'Try adjusting your search or filter.'}
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
          {filtered.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}