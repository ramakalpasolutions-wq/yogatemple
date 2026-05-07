// src/app/admin/announcements/page.js
'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const T = {
  bgCard:'#ffffff', border:'#c8e6d4', accentMid:'#2ea065',
  accentLight:'#4cd389', text:'#1a1208', textMuted:'#6b5a3e', textLight:'#9a8a6a',
  red:'#ef4444',
};

function Inp({ label, value, onChange, placeholder }) {
  const [f, setF] = useState(false);
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:11, fontWeight:700, color:T.textMuted, marginBottom:6, letterSpacing:1, textTransform:'uppercase' }}>
        {label}
      </label>
      <input
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{
          width:'100%', padding:'10px 14px', boxSizing:'border-box',
          border:`1.5px solid ${f ? T.accentMid : T.border}`,
          borderRadius:10, background:'#fafffe', color:T.text,
          fontSize:14, outline:'none', fontFamily:'inherit',
          boxShadow: f ? '0 0 0 3px rgba(76,211,137,0.12)' : 'none',
          transition:'all .2s',
        }}
      />
    </div>
  );
}

function AnnouncementEditor({ side, label }) {
  const [data, setData] = useState({ title:'', line1:'', line2:'', badge:'', color:'#ef4444', visible:true });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [preview, setPreview] = useState(true);

  useEffect(() => {
    axios.get('/api/admin/announcements')
      .then(r => setData(r.data[side]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [side]);

  const update = (field, value) => setData(p => ({ ...p, [field]: value }));

  const save = async () => {
    setSaving(true);
    try {
      await axios.put('/api/admin/announcements', { side, data });
      toast.success(`✅ ${label} updated!`);
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ textAlign:'center', padding:40, color:T.textLight }}>Loading…</div>;

  return (
    <div style={{ background:'#fff', borderRadius:16, border:`1px solid ${T.border}`, padding:24, boxShadow:'0 4px 16px rgba(0,95,43,0.06)' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h3 style={{ fontSize:16, fontWeight:700, color:T.text, fontFamily:"'Cormorant Garamond',serif", margin:0 }}>
          {label}
        </h3>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setPreview(p => !p)} style={{
            padding:'6px 14px', borderRadius:8, border:`1px solid ${T.border}`,
            background:'#fff', color:T.textMuted, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
          }}>
            {preview ? '✏️ Edit' : '👁️ Preview'}
          </button>
          <div
            onClick={() => update('visible', !data.visible)}
            style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'6px 14px', borderRadius:8, cursor:'pointer',
              border:`1px solid ${data.visible ? 'rgba(76,211,137,0.30)' : T.border}`,
              background: data.visible ? 'rgba(76,211,137,0.08)' : '#fff',
              fontSize:12, fontWeight:700,
              color: data.visible ? T.accentMid : T.textLight,
            }}
          >
            {data.visible ? '✅ Visible' : '🔲 Hidden'}
          </div>
        </div>
      </div>

      {preview ? (
        /* ── Live Preview ── */
        <BlinkCard data={data} />
      ) : (
        /* ── Editor ── */
        <>
          <Inp label="Title"      value={data.title}  onChange={v => update('title', v)}  placeholder="🔴 Live Session" />
          <Inp label="Line 1"     value={data.line1}  onChange={v => update('line1', v)}  placeholder="New Batch Starts" />
          <Inp label="Line 2"     value={data.line2}  onChange={v => update('line2', v)}  placeholder="First Monday of Every Month" />
          <Inp label="Badge Text" value={data.badge}  onChange={v => update('badge', v)}  placeholder="JOIN NOW" />

          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:T.textMuted, marginBottom:6, letterSpacing:1, textTransform:'uppercase' }}>
              Accent Color
            </label>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <input type="color" value={data.color} onChange={e => update('color', e.target.value)}
                style={{ width:48, height:36, border:'none', borderRadius:8, cursor:'pointer', padding:2 }}
              />
              <input value={data.color} onChange={e => update('color', e.target.value)}
                style={{ flex:1, padding:'10px 14px', border:`1.5px solid ${T.border}`, borderRadius:10, background:'#fafffe', color:T.text, fontSize:14, outline:'none', fontFamily:'inherit' }}
              />
            </div>
          </div>
        </>
      )}

      <button onClick={save} disabled={saving} style={{
        width:'100%', marginTop:16, padding:'12px',
        background: saving ? T.border : 'linear-gradient(135deg,#4cd389,#2ea065)',
        color: saving ? T.textLight : '#fff',
        border:'none', borderRadius:10, fontSize:14, fontWeight:700,
        cursor: saving ? 'not-allowed' : 'pointer', fontFamily:'inherit',
        boxShadow: saving ? 'none' : '0 4px 14px rgba(76,211,137,0.25)',
        transition:'all .2s',
      }}>
        {saving ? '⏳ Saving…' : '💾 Save Changes'}
      </button>
    </div>
  );
}

function BlinkCard({ data }) {
  const [vis, setVis] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setVis(p => !p), 900);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      background: `linear-gradient(135deg,${data.color}15,${data.color}08)`,
      border: `2px solid ${data.color}40`,
      borderRadius:14, padding:'20px 18px', textAlign:'center',
      position:'relative', overflow:'hidden',
      boxShadow: `0 8px 24px ${data.color}20`,
    }}>
      {/* Blink dot */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:10 }}>
        <div style={{
          width:10, height:10, borderRadius:'50%',
          background: data.color,
          opacity: vis ? 1 : 0.2,
          transition:'opacity .2s',
          boxShadow: `0 0 8px ${data.color}`,
        }} />
        <span style={{ fontSize:13, fontWeight:800, color:data.color, letterSpacing:1 }}>
          {data.title}
        </span>
      </div>
      <p style={{ fontSize:15, fontWeight:700, color:'#1a1208', marginBottom:4 }}>{data.line1}</p>
      <p style={{ fontSize:13, color:'#6b5a3e', marginBottom:12 }}>{data.line2}</p>
      {data.badge && (
        <div style={{
          display:'inline-block', background:data.color, color:'#fff',
          fontSize:11, fontWeight:800, padding:'4px 14px', borderRadius:50,
          letterSpacing:1.5,
        }}>
          {data.badge}
        </div>
      )}
    </div>
  );
}

export default function AnnouncementsAdminPage() {
  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:22, fontWeight:700, color:'#1a1208', fontFamily:"'Cormorant Garamond',serif", marginBottom:4 }}>
          Homepage Announcements
        </h2>
        <p style={{ fontSize:13, color:'#9a8a6a' }}>
          Edit the blinking announcement cards shown on the left and right sides of the homepage.
        </p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:24 }}>
        <AnnouncementEditor side="left"  label="📍 Left Card"  />
        <AnnouncementEditor side="right" label="📍 Right Card" />
      </div>
    </div>
  );
}