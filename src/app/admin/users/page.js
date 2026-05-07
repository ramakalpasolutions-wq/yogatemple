'use client';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const T = {
  bgCard: '#ffffff', border: '#c8e6d4',
  accentMid: '#2ea065', accentLight: '#4cd389',
  accentPale: 'rgba(76,211,137,0.10)',
  gold: '#c49a36', text: '#1a1208',
  textMuted: '#6b5a3e', textLight: '#9a8a6a',
  red: '#ef4444', purple: '#8b5cf6',
  bg: '#f4faf6',
};

const STYLES = `
  @keyframes modalIn    { from{opacity:0;transform:scale(.94) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes overlayIn  { from{opacity:0} to{opacity:1} }
  @keyframes fadeUp     { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer    { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

  .user-modal   { animation: modalIn .28s cubic-bezier(.34,1.56,.64,1) both; }
  .user-overlay { animation: overlayIn .2s ease both; }
  .user-row:hover { background: rgba(76,211,137,0.04) !important; }
  .user-card:hover { transform: translateY(-2px) !important; box-shadow: 0 6px 20px rgba(0,95,43,0.12) !important; }

  /* Desktop */
  .users-table-wrap { display: block; }
  .users-cards-wrap { display: none; }

  /* Tablet ≤ 900px */
  @media (max-width: 900px) {
    .modal-grid { grid-template-columns: 1fr !important; }
  }

  /* Mobile ≤ 640px */
  @media (max-width: 640px) {
    .users-table-wrap { display: none !important; }
    .users-cards-wrap { display: block !important; }
    .user-modal {
      width: 100% !important; max-width: 100% !important;
      border-radius: 20px 20px 0 0 !important;
      max-height: 92vh !important;
      position: fixed !important;
      bottom: 0 !important; left: 0 !important; right: 0 !important;
      top: auto !important;
    }
    .modal-grid { grid-template-columns: 1fr !important; }
    .modal-payment-table { font-size: 11px !important; }
    .modal-payment-table th,
    .modal-payment-table td { padding: 8px !important; }
  }
`;

function useStyles() {
  useEffect(() => {
    const id = 'admin-users-styles';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id; el.textContent = STYLES;
    document.head.appendChild(el);
    return () => { try { document.head.removeChild(el); } catch {} };
  }, []);
}

/* ── Parse address field ── */
function parseAddress(addr) {
  if (!addr) return { problems: null, source: null, time: null };
  const parts = addr.split(' | ');
  const find = (prefix) => {
    const p = parts.find(x => x.startsWith(prefix));
    return p ? p.replace(prefix, '').trim() : null;
  };
  return {
    problems: find('Problems:'),
    source:   find('Source:'),
    time:     find('Preferred Time:'),
  };
}

/* ── Check subscription really active ── */
function isSubReallyActive(sub) {
  return (
    sub?.isActive === true &&
    sub?.endDate != null &&
    new Date(sub.endDate) > new Date()
  );
}

/* ── Info Row ── */
function InfoRow({ label, value, badge, badgeColor }) {
  if (!value && !badge) return null;
  return (
    <div style={{ padding: '10px 0', borderBottom: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: T.textLight, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</span>
      {badge ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 50, background: badgeColor?.bg || T.accentPale, color: badgeColor?.text || T.accentMid, alignSelf: 'flex-start' }}>
          {badge}
        </span>
      ) : (
        <span style={{ fontSize: 13, color: T.text, fontWeight: 500, wordBreak: 'break-word' }}>{value || '—'}</span>
      )}
    </div>
  );
}

/* ── Section Header ── */
function SectionHead({ children }) {
  return (
    <h3 style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: 'uppercase', margin: '16px 0 4px', paddingTop: 4 }}>
      {children}
    </h3>
  );
}

/* ── Payment Status Badge ── */
function PaymentBadge({ status }) {
  const map = {
    PAID:    { bg: 'rgba(76,211,137,0.12)',  color: '#16a34a', label: '✅ Paid'    },
    PENDING: { bg: 'rgba(245,158,11,0.10)', color: '#d97706', label: '⏳ Pending' },
    FAILED:  { bg: 'rgba(239,68,68,0.10)',  color: T.red,     label: '❌ Failed'  },
  };
  const s = map[status] || map.PENDING;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 50, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

/* ════════════════════════════════════════
   USER DETAIL MODAL
════════════════════════════════════════ */
function UserModal({ user, onClose, onUpdate }) {
  const [updating, setUpdating]     = useState(false);
  const [activeTab, setActiveTab]   = useState('info'); // 'info' | 'payments'

  if (!user) return null;

  const sub         = user.subscription;
  const subActive   = isSubReallyActive(sub);
  const addrParsed  = parseAddress(user.address);
  const payments    = user.payments || [];

  const handleToggleActive = async () => {
    setUpdating(true);
    try {
      await axios.patch(`/api/admin/users?id=${user.id || user._id}`, { isActive: !user.isActive });
      toast.success(`User ${!user.isActive ? 'activated' : 'deactivated'}`);
      onUpdate({ ...user, isActive: !user.isActive });
    } catch { toast.error('Failed to update'); }
    finally { setUpdating(false); }
  };

  const handleRoleChange = async (newRole) => {
    if (newRole === user.role) return;
    setUpdating(true);
    try {
      await axios.patch(`/api/admin/users?id=${user.id || user._id}`, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      onUpdate({ ...user, role: newRole });
    } catch { toast.error('Failed to update role'); }
    finally { setUpdating(false); }
  };

  return (
    <div className="user-overlay" onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,61,46,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="user-modal" onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.28)', position: 'relative', display: 'flex', flexDirection: 'column' }}>

        {/* ── Modal Header ── */}
        <div style={{ background: 'linear-gradient(135deg,#0a3d2e,#2ea065)', borderRadius: '20px 20px 0 0', padding: '20px 20px 16px', flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 14, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
          >✕</button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2.5px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {user.avatar
                ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : user.name?.[0]?.toUpperCase()
              }
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 3px', fontFamily: 'Cormorant Garamond,serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 50, background: user.role === 'ADMIN' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.2)', color: '#fff' }}>
                  {user.role}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 50, background: user.isVerified ? 'rgba(76,211,137,0.3)' : 'rgba(239,68,68,0.3)', color: '#fff' }}>
                  {user.isVerified ? '✅ Verified' : '⭕ Unverified'}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 50, background: user.isActive ? 'rgba(76,211,137,0.3)' : 'rgba(239,68,68,0.3)', color: '#fff' }}>
                  {user.isActive ? '🟢 Active' : '🔴 Inactive'}
                </span>
                {subActive && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 50, background: 'rgba(196,154,54,0.35)', color: '#fff' }}>
                    👑 {sub.category || sub.plan}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Quick Action Buttons ── */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <button onClick={handleToggleActive} disabled={updating}
              style={{ flex: 1, minWidth: 120, padding: '8px 12px', borderRadius: 8, border: 'none', cursor: updating ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 700, transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: user.isActive ? 'rgba(239,68,68,0.15)' : 'rgba(76,211,137,0.15)', color: user.isActive ? '#fca5a5' : '#86efac' }}>
              {user.isActive ? '🔴 Deactivate' : '🟢 Activate'}
            </button>

            <select onChange={e => handleRoleChange(e.target.value)} value={user.role} disabled={updating}
              style={{ flex: 1, minWidth: 130, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', fontFamily: 'inherit', fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer', outline: 'none' }}>
              <option value="USER"       style={{ color: T.text }}>👤 USER</option>
              <option value="ADMIN"      style={{ color: T.text }}>🔑 ADMIN</option>
              <option value="INSTRUCTOR" style={{ color: T.text }}>🧘 INSTRUCTOR</option>
            </select>
          </div>
        </div>

        {/* ── Tab Switcher ── */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, background: '#fafffe', flexShrink: 0 }}>
          {[
            { id: 'info',     label: '👤 User Info'     },
            { id: 'payments', label: `💳 Payments (${payments.length})` },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ flex: 1, padding: '12px 8px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: activeTab === t.id ? T.accentMid : T.textLight, borderBottom: activeTab === t.id ? `2.5px solid ${T.accentMid}` : '2.5px solid transparent', transition: 'all .2s', marginBottom: -1 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '16px 20px 20px', overflowY: 'auto', flex: 1 }}>

          {/* ════ INFO TAB ════ */}
          {activeTab === 'info' && (
            <div className="modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px' }}>

              {/* Left */}
              <div>
                <SectionHead>👤 Personal Info</SectionHead>
                <InfoRow label="Full Name"  value={user.name} />
                <InfoRow label="Email"      value={user.email} />
                <InfoRow label="Phone"      value={user.phone} />
                <InfoRow label="Provider"   value={user.provider} />

                <SectionHead>📋 Registration</SectionHead>
                <InfoRow label="Health Problems"      value={addrParsed.problems || user.address} />
                <InfoRow label="How They Found Us"    value={addrParsed.source} />
                <InfoRow label="Preferred Time"       value={addrParsed.time} />

                <SectionHead>🕐 Activity</SectionHead>
                <InfoRow label="Joined"     value={new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
                <InfoRow label="Last Login" value={user.lastLogin ? new Date(user.lastLogin).toLocaleString('en-IN') : 'Never'} />
              </div>

              {/* Right */}
              <div>
                <SectionHead>📊 Account Status</SectionHead>
                <InfoRow label="Role"
                  badge={user.role}
                  badgeColor={user.role === 'ADMIN' ? { bg: 'rgba(239,68,68,0.1)', text: T.red } : { bg: T.accentPale, text: T.accentMid }}
                />
                <InfoRow label="Email Verified"
                  badge={user.isEmailVerified ? '✅ Yes' : '❌ No'}
                  badgeColor={user.isEmailVerified ? { bg: 'rgba(76,211,137,0.1)', text: T.accentMid } : { bg: 'rgba(239,68,68,0.08)', text: T.red }}
                />
                <InfoRow label="Phone Verified"
                  badge={user.isPhoneVerified ? '✅ Yes' : '❌ No'}
                  badgeColor={user.isPhoneVerified ? { bg: 'rgba(76,211,137,0.1)', text: T.accentMid } : { bg: 'rgba(239,68,68,0.08)', text: T.red }}
                />
                <InfoRow label="Account Active"
                  badge={user.isActive ? '🟢 Active' : '🔴 Inactive'}
                  badgeColor={user.isActive ? { bg: 'rgba(76,211,137,0.1)', text: T.accentMid } : { bg: 'rgba(239,68,68,0.08)', text: T.red }}
                />

                <SectionHead>👑 Subscription</SectionHead>
                {/* Plan display name */}
                <InfoRow label="Plan Name"
                  badge={subActive ? `👑 ${sub.planName || sub.plan}` : 'Free'}
                  badgeColor={subActive ? { bg: 'rgba(196,154,54,0.12)', text: T.gold } : { bg: 'rgba(107,90,62,0.08)', text: T.textLight }}
                />
                {/* Category */}
                {sub?.category && (
                  <InfoRow label="Category"
                    badge={`${sub.category}`}
                    badgeColor={{ bg: 'rgba(76,211,137,0.10)', text: T.accentMid }}
                  />
                )}
                {sub?.startDate && <InfoRow label="Start Date" value={new Date(sub.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />}
                {sub?.endDate   && (
                  <InfoRow label="End Date"
                    value={new Date(sub.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  />
                )}
                {/* Expiry status */}
                {sub?.endDate && (
                  <InfoRow label="Status"
                    badge={subActive ? `✅ Active · ${Math.max(0, Math.ceil((new Date(sub.endDate) - new Date()) / 86400000))} days left` : '🔴 Expired'}
                    badgeColor={subActive ? { bg: 'rgba(76,211,137,0.10)', text: T.accentMid } : { bg: 'rgba(239,68,68,0.08)', text: T.red }}
                  />
                )}
                {/* Razorpay payment ID */}
                {sub?.razorpayPaymentId && (
                  <InfoRow label="Payment ID" value={sub.razorpayPaymentId} />
                )}
              </div>
            </div>
          )}

          {/* ════ PAYMENTS TAB ════ */}
          {activeTab === 'payments' && (
            <div style={{ animation: 'fadeUp .3s ease' }}>
              {payments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: T.textLight }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>💳</div>
                  <p style={{ fontWeight: 600 }}>No payment records found</p>
                </div>
              ) : (
                <>
                  {/* Payment Summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                    {[
                      {
                        label: 'Total Paid',
                        value: `₹${payments.filter(p => p.status === 'PAID').reduce((s, p) => s + (p.amount || 0), 0).toLocaleString('en-IN')}`,
                        color: T.accentMid,
                        bg:    'rgba(76,211,137,0.06)',
                      },
                      {
                        label: 'Transactions',
                        value: payments.length,
                        color: T.text,
                        bg:    'rgba(0,0,0,0.03)',
                      },
                      {
                        label: 'Successful',
                        value: payments.filter(p => p.status === 'PAID').length,
                        color: '#16a34a',
                        bg:    'rgba(22,163,74,0.06)',
                      },
                    ].map(s => (
                      <div key={s.label} style={{ padding: '12px 14px', borderRadius: 10, background: s.bg, border: `1px solid ${T.border}`, textAlign: 'center' }}>
                        <p style={{ fontSize: 18, fontWeight: 800, color: s.color, margin: '0 0 2px' }}>{s.value}</p>
                        <p style={{ fontSize: 10, color: T.textLight, margin: 0, textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600 }}>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Payments Table */}
                  <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="modal-payment-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
                        <thead>
                          <tr style={{ background: 'rgba(76,211,137,0.06)', borderBottom: `1px solid ${T.border}` }}>
                            {['Date', 'Plan', 'Category', 'Amount', 'Status'].map(h => (
                              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((p, i) => (
                            <tr key={p.id} style={{ borderBottom: i < payments.length - 1 ? `1px solid ${T.border}` : 'none', background: i % 2 === 0 ? '#fff' : 'rgba(76,211,137,0.02)' }}>
                              <td style={{ padding: '10px 12px', fontSize: 12, color: T.textLight, whiteSpace: 'nowrap' }}>
                                {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td style={{ padding: '10px 12px', fontSize: 12, color: T.text, fontWeight: 600 }}>
                                {p.plan || '—'}
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                {p.category ? (
                                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 50, background: T.accentPale, color: T.accentMid }}>
                                    {p.category}
                                  </span>
                                ) : <span style={{ color: T.textLight, fontSize: 12 }}>—</span>}
                              </td>
                              <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: T.text, whiteSpace: 'nowrap' }}>
                                ₹{(p.amount || 0).toLocaleString('en-IN')}
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                <PaymentBadge status={p.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Mobile User Card ── */
function UserCard({ user, onClick }) {
  const subActive  = isSubReallyActive(user.subscription);
  const addrParsed = parseAddress(user.address);

  return (
    <div onClick={() => onClick(user)} className="user-card"
      style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 14, padding: 16, marginBottom: 12, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,95,43,0.05)', transition: 'all .2s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(76,211,137,0.18),rgba(0,95,43,0.12))', border: `1.5px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: T.accentMid, flexShrink: 0 }}>
          {user.name?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
          <div style={{ fontSize: 11, color: T.textLight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
        </div>
        <div style={{ flexShrink: 0, fontSize: 16 }}>{user.isVerified ? '✅' : '⭕'}</div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: addrParsed.time || subActive ? 8 : 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 50, background: user.role === 'ADMIN' ? 'rgba(239,68,68,0.08)' : T.accentPale, color: user.role === 'ADMIN' ? T.red : T.accentMid }}>
          {user.role}
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 50, background: subActive ? 'rgba(196,154,54,0.1)' : 'rgba(107,90,62,0.07)', color: subActive ? T.gold : T.textLight }}>
          {subActive
            ? `👑 ${user.subscription.planName || user.subscription.plan}${user.subscription.category ? ` · ${user.subscription.category}` : ''}`
            : '🆓 Free'
          }
        </span>
        <span style={{ fontSize: 10, color: T.textLight, padding: '2px 6px' }}>
          {new Date(user.createdAt).toLocaleDateString('en-IN')}
        </span>
      </div>

      {addrParsed.time && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: 'rgba(76,211,137,0.06)', border: '1px solid rgba(76,211,137,0.15)', marginTop: 4 }}>
          <span style={{ fontSize: 11 }}>⏰</span>
          <span style={{ fontSize: 11, color: T.accentMid, fontWeight: 600 }}>{addrParsed.time}</span>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════ */
export default function AdminUsersPage() {
  useStyles();

  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [roleFilter,   setRoleFilter]   = useState('ALL');
  const [planFilter,   setPlanFilter]   = useState('ALL');
  const [selectedUser, setSelectedUser] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const r = await axios.get('/api/admin/users');
      // API now returns array directly (or { users, stats } — handle both)
      const arr = Array.isArray(r.data) ? r.data : (r.data.users || []);
      setUsers(arr);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // Update user in local state after edit
  const handleUserUpdate = useCallback((updatedUser) => {
    setUsers(prev => prev.map(u =>
      (u.id || u._id) === (updatedUser.id || updatedUser._id)
        ? { ...u, ...updatedUser }
        : u
    ));
    setSelectedUser(prev => prev ? { ...prev, ...updatedUser } : null);
  }, []);

  // Live stats
  const liveStats = {
    total:    users.length,
    premium:  users.filter(u => isSubReallyActive(u.subscription)).length,
    verified: users.filter(u => u.isVerified).length,
    active:   users.filter(u => u.isActive).length,
  };

  // Filter
  const filtered = users.filter(u => {
    const q          = search.toLowerCase();
    const subActive  = isSubReallyActive(u.subscription);
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q) ||
      u.address?.toLowerCase().includes(q) ||
      u.subscription?.category?.toLowerCase().includes(q);
    const matchRole  = roleFilter === 'ALL' || u.role === roleFilter;
    const matchPlan  = planFilter === 'ALL' ? true : planFilter === 'PREMIUM' ? subActive : !subActive;
    return matchSearch && matchRole && matchPlan;
  });

  return (
    <div>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, fontFamily: "'Cormorant Garamond',serif", marginBottom: 4 }}>All Users</h2>
          <p style={{ fontSize: 13, color: T.textLight, margin: 0 }}>
            {liveStats.total} total · {liveStats.premium} premium · {liveStats.verified} verified · Click any user to manage
          </p>
        </div>
        <button onClick={() => { loadUsers(); toast.success('Refreshed!'); }}
          style={{ background: '#fff', border: `1.5px solid ${T.border}`, color: T.accentMid, padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
          onMouseEnter={e => e.currentTarget.style.borderColor = T.accentMid}
          onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
        >
          🔄 Refresh
        </button>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textLight, fontSize: 14, pointerEvents: 'none' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, phone, category…"
            style={{ width: '100%', padding: '10px 32px 10px 36px', border: `1.5px solid ${T.border}`, borderRadius: 10, background: '#fff', fontSize: 13, color: T.text, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color .2s' }}
            onFocus={e => e.target.style.borderColor = T.accentMid}
            onBlur={e => e.target.style.borderColor = T.border}
          />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: T.textLight, cursor: 'pointer', fontSize: 14 }}>
              ✕
            </button>
          )}
        </div>

        {/* Role */}
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          style={{ padding: '10px 14px', border: `1.5px solid ${T.border}`, borderRadius: 10, background: '#fff', fontSize: 13, color: T.text, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
          <option value="ALL">All Roles</option>
          <option value="USER">👤 User</option>
          <option value="ADMIN">🔑 Admin</option>
          <option value="INSTRUCTOR">🧘 Instructor</option>
        </select>

        {/* Plan */}
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
          style={{ padding: '10px 14px', border: `1.5px solid ${T.border}`, borderRadius: 10, background: '#fff', fontSize: 13, color: T.text, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
          <option value="ALL">All Plans</option>
          <option value="PREMIUM">👑 Premium</option>
          <option value="FREE">🆓 Free</option>
        </select>

        <span style={{ fontSize: 13, color: T.textLight, flexShrink: 0 }}>
          {loading ? 'Loading…' : `${filtered.length} / ${users.length}`}
        </span>
      </div>

      {/* ── Mobile Cards ── */}
      <div className="users-cards-wrap">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: T.textLight }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>Loading users…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: T.textLight }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
            <p style={{ fontWeight: 600 }}>{search ? 'No users match' : 'No users yet'}</p>
          </div>
        ) : filtered.map(u => (
          <UserCard key={u.id || u._id} user={u} onClick={setSelectedUser} />
        ))}
      </div>

      {/* ── Desktop Table ── */}
      <div className="users-table-wrap" style={{ background: '#fff', borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: '0 2px 8px rgba(0,95,43,0.05)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg,rgba(76,211,137,0.06),rgba(0,95,43,0.04))', borderBottom: `1px solid ${T.border}` }}>
                {['User', 'Email / Phone', 'Role', 'Subscription', 'Category', 'Preferred Time', 'Verified', 'Joined'].map(h => (
                  <th key={h} style={{ padding: '13px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} style={{ padding: 48, textAlign: 'center', color: T.textLight }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>Loading users…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 48, textAlign: 'center', color: T.textLight }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
                    <p style={{ fontWeight: 600 }}>{search ? 'No users match' : 'No users yet'}</p>
                  </td>
                </tr>
              )}

              {!loading && filtered.map(u => {
                const uid        = u.id || u._id;
                const subActive  = isSubReallyActive(u.subscription);
                const addrParsed = parseAddress(u.address);

                return (
                  <tr key={uid} className="user-row" onClick={() => setSelectedUser(u)}
                    style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', transition: 'background 0.15s' }}>

                    {/* User */}
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(76,211,137,0.18),rgba(0,95,43,0.12))', border: `1.5px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: T.accentMid, flexShrink: 0 }}>
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, whiteSpace: 'nowrap' }}>{u.name}</div>
                          <div style={{ fontSize: 10, color: u.isActive ? T.accentMid : T.red }}>
                            {u.isActive ? '🟢 Active' : '🔴 Inactive'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email / Phone */}
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ fontSize: 12, color: T.textLight, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                      {u.phone && <div style={{ fontSize: 11, color: T.textLight, marginTop: 2 }}>📱 {u.phone}</div>}
                    </td>

                    {/* Role */}
                    <td style={{ padding: '13px 14px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 50, background: u.role === 'ADMIN' ? 'rgba(239,68,68,0.08)' : T.accentPale, color: u.role === 'ADMIN' ? T.red : T.accentMid }}>
                        {u.role}
                      </span>
                    </td>

                    {/* Subscription (plan name) */}
                    <td style={{ padding: '13px 14px' }}>
                      {subActive ? (
                        <div>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 50, background: 'rgba(196,154,54,0.10)', color: T.gold, display: 'inline-block', whiteSpace: 'nowrap' }}>
                            👑 {u.subscription.planName || u.subscription.plan}
                          </span>
                          {u.subscription.endDate && (
                            <div style={{ fontSize: 10, color: T.textLight, marginTop: 3 }}>
                              Exp: {new Date(u.subscription.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 50, background: 'rgba(107,90,62,0.07)', color: T.textLight }}>
                          🆓 Free
                        </span>
                      )}
                    </td>

                    {/* Category */}
                    <td style={{ padding: '13px 14px' }}>
                      {u.subscription?.category ? (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 50, background: T.accentPale, color: T.accentMid, whiteSpace: 'nowrap' }}>
                          {u.subscription.category}
                        </span>
                      ) : <span style={{ color: T.textLight, fontSize: 12 }}>—</span>}
                    </td>

                    {/* Preferred Time */}
                    <td style={{ padding: '13px 14px' }}>
                      {addrParsed.time ? (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 50, background: 'rgba(76,211,137,0.08)', color: T.accentMid, whiteSpace: 'nowrap' }}>
                          ⏰ {addrParsed.time}
                        </span>
                      ) : <span style={{ color: T.textLight, fontSize: 12 }}>—</span>}
                    </td>

                    {/* Verified */}
                    <td style={{ padding: '13px 14px', fontSize: 16 }}>
                      {u.isVerified ? '✅' : '⭕'}
                    </td>

                    {/* Joined */}
                    <td style={{ padding: '13px 14px', fontSize: 11, color: T.textLight, whiteSpace: 'nowrap' }}>
                      {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedUser && (
        <UserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={handleUserUpdate}
        />
      )}
    </div>
  );
}