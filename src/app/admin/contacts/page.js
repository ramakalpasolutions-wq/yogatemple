'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const T = {
  bgCard: '#ffffff', border: '#c8e6d4',
  accentMid: '#2ea065', accentLight: '#4cd389',
  gold: '#c49a36', text: '#1a1208', textMuted: '#6b5a3e', textLight: '#9a8a6a',
  red: '#ef4444',
};

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('ALL');

  const loadContacts = async () => {
    try {
      setLoading(true);
      const r = await axios.get('/api/admin/contacts');
      setContacts(r.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadContacts(); }, []);

  const handleMarkRead = async (id) => {
    try {
      await axios.patch(`/api/admin/contacts?id=${id}`, { status: 'read' });
      toast.success('Marked as read');
      loadContacts();
    } catch { toast.error('Failed to update'); }
  };

  const newCount = contacts.filter(c => c.status === 'NEW').length;

  const filtered = contacts.filter(c => {
    if (filter === 'NEW')  return c.status === 'NEW';
    if (filter === 'READ') return c.status !== 'NEW';
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, fontFamily: "'Cormorant Garamond',serif", marginBottom: 4 }}>
            Contact Messages
          </h2>
          <p style={{ fontSize: 13, color: T.textLight }}>
            {contacts.length} total · <span style={{ color: T.red, fontWeight: 600 }}>{newCount} unread</span>
          </p>
        </div>
        <button onClick={() => { loadContacts(); toast.success('Refreshed!'); }} style={{
          background: '#fff', border: `1.5px solid ${T.border}`,
          color: T.accentMid, padding: '10px 18px', borderRadius: 10,
          cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          🔄 Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { v: 'ALL',  label: `All (${contacts.length})`  },
          { v: 'NEW',  label: `🔔 Unread (${newCount})`   },
          { v: 'READ', label: `✅ Read`                    },
        ].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: filter === f.v ? 'linear-gradient(135deg,#4cd389,#2ea065)' : '#fff',
            color: filter === f.v ? '#fff' : T.textMuted,
            fontSize: 12, fontWeight: filter === f.v ? 700 : 500,
            cursor: 'pointer', fontFamily: 'inherit',
            border: filter === f.v ? 'none' : `1px solid ${T.border}`,
            boxShadow: filter === f.v ? '0 4px 12px rgba(76,211,137,0.25)' : 'none',
            transition: 'all 0.2s',
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📨</div>
          <p style={{ color: T.textLight }}>Loading messages…</p>
        </div>
      )}

      {/* Empty */}
      {!loading && contacts.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>✉️</div>
          <h3 style={{ color: T.text, fontFamily: "'Cormorant Garamond',serif", fontSize: 22, marginBottom: 8 }}>No Messages Yet</h3>
          <p style={{ color: T.textLight, fontSize: 14 }}>Messages from your contact form will appear here.</p>
        </div>
      )}

      {/* Messages */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(c => {
            const id = c._id || c.id;
            const isNew = c.status === 'NEW';
            return (
              <div key={id} style={{
                background: '#fff', borderRadius: 16, padding: '22px 24px',
                border: `1px solid ${isNew ? 'rgba(76,211,137,0.35)' : T.border}`,
                boxShadow: isNew ? '0 4px 16px rgba(0,95,43,0.07)' : '0 2px 8px rgba(0,95,43,0.04)',
                position: 'relative', overflow: 'hidden',
              }}>
                {isNew && (
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'linear-gradient(180deg,#4cd389,#2ea065)', borderRadius: '4px 0 0 4px' }} />
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 10, paddingLeft: isNew ? 8 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg,rgba(76,211,137,0.15),rgba(0,95,43,0.08))',
                      border: `1.5px solid ${T.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 700, color: T.accentMid,
                    }}>
                      {c.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{c.name}</span>
                      <div style={{ fontSize: 12, color: T.textLight, marginTop: 2 }}>
                        {c.email}
                        {c.phone && <span style={{ marginLeft: 10 }}>📞 {c.phone}</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 11, padding: '4px 12px', borderRadius: 50, fontWeight: 700,
                      background: isNew ? 'rgba(76,211,137,0.12)' : 'rgba(107,90,62,0.08)',
                      color: isNew ? T.accentMid : T.textLight,
                    }}>
                      {isNew ? '🔔 New' : '✅ Read'}
                    </span>
                    <span style={{ fontSize: 11, color: T.textLight }}>
                      {new Date(c.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </span>
                    {isNew && (
                      <button onClick={() => handleMarkRead(id)} style={{
                        fontSize: 11, background: 'rgba(76,211,137,0.10)',
                        color: T.accentMid, border: `1px solid rgba(76,211,137,0.25)`,
                        borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
                        fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.2s',
                      }}>
                        Mark Read ✓
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ paddingLeft: isNew ? 8 : 0 }}>
                  {c.subject && (
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 8, fontFamily: "'Cormorant Garamond',serif" }}>
                      📌 {c.subject}
                    </div>
                  )}
                  <div style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.7 }}>{c.message}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}