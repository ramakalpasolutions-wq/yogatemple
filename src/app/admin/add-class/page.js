// src/app/admin/add-class/page.js
'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';

const T = {
  bgCard: '#ffffff', border: '#c8e6d4', borderFoc: '#2ea065',
  accent: '#005f2b', accentMid: '#2ea065', accentLight: '#4cd389',
  accentPale: 'rgba(76,211,137,0.10)',
  gold: '#c49a36', goldLight: '#f0c060',
  text: '#1a1208', textMuted: '#6b5a3e', textLight: '#9a8a6a',
  red: '#ef4444', blue: '#3b82f6',
  inputBg: '#fafffe',
};

const CATEGORIES = [
  { value: 'HATHA',       emoji: '🌅', label: 'Hatha',       desc: 'Gentle foundational' },
  { value: 'VINYASA',     emoji: '🌊', label: 'Vinyasa',     desc: 'Dynamic flowing'     },
  { value: 'ASHTANGA',    emoji: '🔥', label: 'Ashtanga',    desc: 'Structured powerful' },
  { value: 'YIN',         emoji: '🌙', label: 'Yin',         desc: 'Deep stretching'     },
  { value: 'RESTORATIVE', emoji: '🌿', label: 'Restorative', desc: 'Healing & rest'      },
  { value: 'POWER',       emoji: '⚡', label: 'Power',       desc: 'Strength building'   },
  { value: 'KUNDALINI',   emoji: '✨', label: 'Kundalini',   desc: 'Energy awakening'    },
  { value: 'PRENATAL',    emoji: '🤰', label: 'Prenatal',    desc: 'Safe for pregnancy'  },
  { value: 'KIDS',        emoji: '🧒', label: 'Kids',        desc: 'Fun for children'    },
  { value: 'MEDITATION',  emoji: '🧠', label: 'Meditation',  desc: 'Mindfulness'         },
  { value: 'PRANAYAMA',   emoji: '🌬️', label: 'Pranayama',  desc: 'Breathing techniques'},
];

const catEmoji = {
  HATHA:'🌅', VINYASA:'🌊', ASHTANGA:'🔥', POWER:'⚡',
  YIN:'🌙', RESTORATIVE:'🌿', KUNDALINI:'✨', PRENATAL:'🤰',
  KIDS:'🧒', MEDITATION:'🧠', PRANAYAMA:'🌬️',
};

const LEVELS = [
  { value: 'ALL_LEVELS',   label: '🧘 All Levels'   },
  { value: 'BEGINNER',     label: '🌱 Beginner'     },
  { value: 'INTERMEDIATE', label: '🌿 Intermediate' },
  { value: 'ADVANCED',     label: '🔥 Advanced'     },
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4','video/webm','video/quicktime',
  'video/x-msvideo','video/x-matroska',
];

/* ── Helpers ── */
function parsePreferredTimeToSchedule(preferredTime, date) {
  if (!preferredTime || !date) return '';
  const startPart = preferredTime.split(' - ')[0]?.trim();
  if (!startPart) return '';
  const parts = startPart.split(' ');
  if (parts.length < 2) return '';
  const meridiem = parts[1];
  const [hourStr, minStr] = parts[0].split(':');
  let hours = parseInt(hourStr, 10);
  const mins = parseInt(minStr || '0', 10);
  if (isNaN(hours)) return '';
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  const hh = String(hours).padStart(2, '0');
  const mm = String(mins).padStart(2, '0');
  return `${date}T${hh}:${mm}`;
}

function extractPreferredTime(address) {
  if (!address) return null;
  const parts = address.split(' | ');
  const found = parts.find(p => p.startsWith('Preferred Time:'));
  return found ? found.replace('Preferred Time:', '').trim() : null;
}

/* ── Responsive CSS ── */
const KF = `
  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes r2fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideDown{ from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }

  /* ── Responsive grid for type tiles ── */
  .add-type-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  @media (max-width: 480px) {
    .add-type-grid {
      grid-template-columns: 1fr;
    }
  }

  /* ── Responsive grid for category tiles ── */
  .add-cat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 10px;
  }
  @media (max-width: 400px) {
    .add-cat-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
  }

  /* ── Date + time row ── */
  .add-date-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  @media (max-width: 420px) {
    .add-date-row {
      grid-template-columns: 1fr;
    }
  }

  /* ── Level + duration row ── */
  .add-two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  @media (max-width: 460px) {
    .add-two-col {
      grid-template-columns: 1fr;
      gap: 0;
    }
  }

  /* ── Summary grid ── */
  .add-summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 16px;
  }
  @media (max-width: 420px) {
    .add-summary-grid {
      grid-template-columns: 1fr;
    }
  }

  /* ── Personal category grid ── */
  .add-personal-cat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 8px;
  }
  @media (max-width: 400px) {
    .add-personal-cat-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  /* ── Submit button row ── */
  .add-submit-row {
    display: flex;
    gap: 12px;
  }
  @media (max-width: 400px) {
    .add-submit-row {
      flex-direction: column;
    }
    .add-submit-row > * {
      flex: none !important;
      width: 100% !important;
    }
  }

  /* ── Step indicator ── */
  .add-steps {
    display: flex;
    align-items: center;
    margin-bottom: 32px;
    overflow-x: auto;
    padding-bottom: 4px;
  }
  .add-step-label {
    font-size: 12px;
    font-weight: 600;
    margin-left: 8px;
    white-space: nowrap;
  }
  @media (max-width: 380px) {
    .add-step-label { display: none; }
    .add-steps      { gap: 4px; }
  }

  /* ── Tab switcher ── */
  .add-tab-btn {
    padding: 12px 8px;
    flex: 1;
  }
  @media (max-width: 360px) {
    .add-tab-desc { display: none; }
  }

  /* ── User search info row ── */
  .add-user-info-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .add-user-info-col {
    flex: 1;
    min-width: 140px;
  }
`;

function useStyles() {
  useEffect(() => {
    const id = 'add-class-styles';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id; el.textContent = KF;
    document.head.appendChild(el);
    return () => { try { document.head.removeChild(el); } catch {} };
  }, []);
}

/* ─── Input Components ─── */
function Inp({ value, onChange, placeholder, type = 'text', min, step: s, readOnly }) {
  const [f, setF] = useState(false);
  return (
    <input
      type={type} value={value} onChange={onChange}
      placeholder={placeholder} min={min} step={s} readOnly={readOnly}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{
        width: '100%', padding: 'clamp(10px,1.5vw,12px) clamp(12px,2vw,16px)',
        boxSizing: 'border-box',
        background: readOnly ? '#f4faf6' : T.inputBg,
        border: `1.5px solid ${f ? T.accentMid : T.border}`,
        borderRadius: 10, color: T.text, fontSize: 'clamp(13px,1.5vw,14px)',
        outline: 'none', fontFamily: 'inherit',
        boxShadow: f ? '0 0 0 3px rgba(76,211,137,0.12)' : 'none',
        transition: 'all 0.2s',
        cursor: readOnly ? 'default' : 'text',
      }}
    />
  );
}

function Txt({ value, onChange, placeholder, rows = 3 }) {
  const [f, setF] = useState(false);
  return (
    <textarea
      value={value} onChange={onChange}
      placeholder={placeholder} rows={rows}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{
        width: '100%', padding: 'clamp(10px,1.5vw,12px) clamp(12px,2vw,16px)',
        boxSizing: 'border-box', background: T.inputBg,
        border: `1.5px solid ${f ? T.accentMid : T.border}`,
        borderRadius: 10, color: T.text, fontSize: 'clamp(13px,1.5vw,14px)',
        outline: 'none', resize: 'vertical', fontFamily: 'inherit',
        boxShadow: f ? '0 0 0 3px rgba(76,211,137,0.12)' : 'none',
        transition: 'border-color 0.2s',
      }}
    />
  );
}

function Sel({ value, onChange, options, placeholder }) {
  const [f, setF] = useState(false);
  return (
    <select
      value={value} onChange={onChange}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{
        width: '100%', padding: 'clamp(10px,1.5vw,12px) clamp(12px,2vw,16px)',
        boxSizing: 'border-box', background: T.inputBg,
        border: `1.5px solid ${f ? T.accentMid : T.border}`,
        borderRadius: 10, color: value ? T.text : T.textLight,
        fontSize: 'clamp(13px,1.5vw,14px)',
        outline: 'none', fontFamily: 'inherit',
        boxShadow: f ? '0 0 0 3px rgba(76,211,137,0.12)' : 'none',
        transition: 'all 0.2s', cursor: 'pointer',
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div style={{ marginBottom: 'clamp(14px,2vw,20px)' }}>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 700,
        color: T.textMuted, marginBottom: 8,
        letterSpacing: 1, textTransform: 'uppercase',
      }}>
        {label}
        {required && <span style={{ color: T.red, marginLeft: 4 }}>*</span>}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: 11, color: T.textLight, marginTop: 5, lineHeight: 1.5 }}>{hint}</p>
      )}
    </div>
  );
}

function StepDot({ n, current }) {
  const done   = current > n;
  const active = current === n;
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
      background: done   ? 'linear-gradient(135deg,#4cd389,#2ea065)'
                : active ? 'linear-gradient(135deg,#005f2b,#2ea065)'
                :          '#f4faf6',
      border: active || done ? 'none' : '2px solid #c8e6d4',
      color: (done || active) ? '#fff' : T.textLight,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: 13,
      boxShadow: active ? '0 4px 16px rgba(0,95,43,0.20)' : 'none',
      transition: 'all .3s',
    }}>
      {done ? '✓' : n}
    </div>
  );
}

/* ─── Image Upload Box ─── */
function ImageUploadBox({ onFile, preview, uploading, progress }) {
  const [drag, setDrag] = useState(false);
  const handleDrop = e => {
    e.preventDefault(); setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };
  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && document.getElementById('thumb-input').click()}
      style={{
        border: `2px dashed ${drag ? T.accentMid : preview ? T.accentLight : T.border}`,
        borderRadius: 12,
        padding: 'clamp(16px,3vw,24px) clamp(12px,2vw,16px)',
        textAlign: 'center',
        cursor: uploading ? 'wait' : 'pointer',
        background: preview ? 'rgba(76,211,137,0.04)' : drag ? 'rgba(76,211,137,0.06)' : T.inputBg,
        transition: 'all .25s', minHeight: 100,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {uploading ? (
        <>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⬆️</div>
          <p style={{ fontSize: 13, color: T.accentMid, marginBottom: 10, fontWeight: 600 }}>
            Uploading… {progress}%
          </p>
          <div style={{ width: '100%', maxWidth: 200, height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#4cd389,#2ea065)', borderRadius: 3, transition: 'width .3s' }} />
          </div>
        </>
      ) : preview ? (
        <>
          <img src={preview} alt="preview" style={{ height: 80, borderRadius: 8, objectFit: 'cover', marginBottom: 8, maxWidth: '100%' }} />
          <p style={{ fontSize: 11, color: T.accentMid, fontWeight: 600 }}>✅ Uploaded — click to replace</p>
        </>
      ) : (
        <>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(76,211,137,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 10 }}>🖼️</div>
          <p style={{ fontSize: 'clamp(12px,1.5vw,13px)', color: T.text, fontWeight: 600, marginBottom: 4 }}>Click or drag thumbnail here</p>
          <p style={{ fontSize: 11, color: T.textLight }}>JPG, PNG, WebP · Max 10 MB</p>
        </>
      )}
      <input id="thumb-input" type="file" accept="image/*"
        onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); }}
        style={{ display: 'none' }}
      />
    </div>
  );
}

/* ─── R2 Video Uploader ─── */
function R2VideoUploader({ category, isPremium, onSuccess }) {
  const inputRef       = useRef(null);
  const [file,        setFile]        = useState(null);
  const [progress,    setProgress]    = useState(0);
  const [stage,       setStage]       = useState('idle');
  const [dragOver,    setDragOver]    = useState(false);
  const [previewName, setPreviewName] = useState('');

  const validate = useCallback((f) => {
    if (!ALLOWED_VIDEO_TYPES.includes(f.type)) { toast.error('Invalid file type.'); return false; }
    if (f.size > 500 * 1024 * 1024) { toast.error('Too large. Max 500 MB.'); return false; }
    return true;
  }, []);

  const pickFile = useCallback((f) => {
    if (!f || !validate(f)) return;
    setFile(f); setPreviewName(f.name); setStage('idle'); setProgress(0);
  }, [validate]);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  }, [pickFile]);

  const fmtSize = (b) =>
    b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`;

  const handleUpload = async () => {
    if (!file) { toast.error('Select a video file first'); return; }
    try {
      setStage('presigning'); setProgress(0);
      const { data: p } = await axios.post('/api/upload-r2/presign', {
        fileName: file.name, contentType: file.type,
        fileSize: file.size, category: category || 'general', uploadType: 'video',
      });
      setStage('uploading'); setProgress(1);
      await axios.put(p.presignedUrl, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: (evt) => setProgress(Math.round((evt.loaded / evt.total) * 100)),
      });
      setStage('done'); setProgress(100);
      onSuccess({ url: p.publicUrl || `https://r2/${p.key}`, key: p.key, videoProvider: 'r2' });
      toast.success('✅ Video uploaded!');
    } catch (err) {
      setStage('error');
      toast.error(err.response?.data?.error || 'Upload failed');
    }
  };

  const reset = () => {
    setFile(null); setStage('idle'); setProgress(0); setPreviewName('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const isBusy = ['presigning', 'uploading'].includes(stage);

  return (
    <div>
      <div
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !isBusy && stage !== 'done' && inputRef.current?.click()}
        style={{
          border: `2px dashed ${stage === 'done' ? '#16a34a' : stage === 'error' ? T.red : dragOver ? T.accentMid : file ? T.accentLight : T.border}`,
          borderRadius: 12, padding: 'clamp(20px,3vw,28px) clamp(14px,2vw,20px)',
          textAlign: 'center',
          cursor: isBusy || stage === 'done' ? 'default' : 'pointer',
          background: stage === 'done' ? 'rgba(22,163,74,0.04)' : dragOver ? 'rgba(76,211,137,0.07)' : file ? 'rgba(76,211,137,0.03)' : T.inputBg,
          transition: 'all .22s ease',
        }}
      >
        <input ref={inputRef} type="file"
          accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
          style={{ display: 'none' }}
          onChange={e => pickFile(e.target.files?.[0])}
          disabled={isBusy}
        />
        <div style={{ fontSize: 36, marginBottom: 10 }}>
          {stage === 'done' ? '✅' : stage === 'error' ? '❌' : file ? '🎬' : '☁️'}
        </div>
        {file ? (
          <div>
            <p style={{ fontSize: 'clamp(12px,1.5vw,14px)', fontWeight: 700, color: T.text, marginBottom: 4 }}>
              {previewName}
            </p>
            <p style={{ fontSize: 11, color: T.textLight }}>{fmtSize(file.size)}</p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 'clamp(12px,1.5vw,14px)', fontWeight: 700, color: T.textMuted, marginBottom: 4 }}>
              Drag & drop video or click to browse
            </p>
            <p style={{ fontSize: 11, color: T.textLight }}>MP4, WebM, MOV · Max 500 MB</p>
          </div>
        )}
      </div>

      {isBusy && (
        <div style={{ marginTop: 12 }}>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(76,211,137,0.12)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#4cd389,#2ea065)', borderRadius: 3, transition: 'width .3s ease' }} />
          </div>
          <p style={{ fontSize: 11, color: T.accentMid, fontWeight: 600, marginTop: 5, textAlign: 'center' }}>
            {stage === 'presigning' ? '🔑 Preparing…' : `☁️ Uploading… ${progress}%`}
          </p>
        </div>
      )}

      {stage === 'done' && (
        <p style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, textAlign: 'center', marginTop: 8 }}>
          ✅ Video uploaded
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {file && stage !== 'done' && (
          <button onClick={handleUpload} disabled={isBusy} style={{
            flex: 2, minWidth: 0, padding: '11px',
            background: isBusy ? T.border : 'linear-gradient(135deg,#4cd389,#2ea065)',
            color: isBusy ? T.textLight : '#fff',
            border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700,
            cursor: isBusy ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          }}>
            {isBusy
              ? (stage === 'presigning' ? 'Preparing…' : `${progress}%`)
              : '☁️ Upload to Cloud'
            }
          </button>
        )}
        {(file || stage === 'done') && (
          <button onClick={reset} disabled={isBusy} style={{
            flex: stage === 'done' ? 2 : 1, minWidth: 0, padding: '11px',
            background: 'transparent', border: `1.5px solid ${T.border}`,
            color: T.textLight, borderRadius: 10, fontSize: 12, fontWeight: 600,
            cursor: isBusy ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          }}>
            {stage === 'done' ? '🔄 Replace' : '✕ Clear'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── User Search Component ─── */
function UserSearch({ selectedUser, onSelect }) {
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [showList, setShowList] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef     = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowList(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const search = useCallback(async (q) => {
    if (!q || q.length < 2) { setResults([]); setShowList(false); return; }
    setLoading(true);
    try {
      const r = await axios.get('/api/admin/users');
      const all = r.data || [];
      const filtered = all.filter(u =>
        u.role === 'USER' && (
          u.name?.toLowerCase().includes(q.toLowerCase()) ||
          u.email?.toLowerCase().includes(q.toLowerCase()) ||
          u.phone?.includes(q)
        )
      ).slice(0, 8);
      setResults(filtered);
      setShowList(filtered.length > 0);
    } catch { toast.error('Failed to search users'); }
    finally { setLoading(false); }
  }, []);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    if (selectedUser) onSelect(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 350);
  };

  const handleSelect = (user) => {
    onSelect(user);
    setQuery(''); setShowList(false); setResults([]);
  };

  const handleClear = () => {
    onSelect(null);
    setQuery(''); setResults([]); setShowList(false);
  };

  const CATEGORY_LABELS = {
    HATHA:'🌅 Hatha', VINYASA:'🌊 Vinyasa', ASHTANGA:'🔥 Ashtanga',
    POWER:'⚡ Power', YIN:'🌙 Yin', RESTORATIVE:'🌿 Restorative',
    KUNDALINI:'✨ Kundalini', PRENATAL:'🤰 Prenatal', KIDS:'🧒 Kids',
    MEDITATION:'🧠 Meditation', PRANAYAMA:'🌬️ Pranayama',
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {!selectedUser && (
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: T.textLight, pointerEvents: 'none' }}>🔍</span>
          <input
            value={query}
            onChange={handleChange}
            onFocus={e => {
              if (results.length > 0) setShowList(true);
              e.target.style.borderColor = T.accentMid;
              e.target.style.boxShadow   = '0 0 0 3px rgba(76,211,137,0.12)';
            }}
            onBlur={e => {
              e.target.style.borderColor = T.border;
              e.target.style.boxShadow   = 'none';
            }}
            placeholder="Type name, email or phone…"
            style={{
              width: '100%', padding: '12px 16px 12px 38px',
              boxSizing: 'border-box', background: T.inputBg,
              border: `1.5px solid ${T.border}`,
              borderRadius: 10, color: T.text, fontSize: 14,
              outline: 'none', fontFamily: 'inherit', transition: 'all 0.2s',
            }}
          />
          {loading && (
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', animation: 'spin 1s linear infinite', display: 'inline-block', fontSize: 14 }}>
              ⏳
            </span>
          )}
        </div>
      )}

      {/* Dropdown */}
      {showList && results.length > 0 && !selectedUser && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          background: '#fff', border: `1.5px solid ${T.border}`,
          borderRadius: 10, boxShadow: '0 8px 32px rgba(0,95,43,0.15)',
          maxHeight: 300, overflowY: 'auto', marginTop: 4,
        }}>
          {results.map((u, idx) => {
            const prefTime = extractPreferredTime(u.address);
            const sub      = u.subscription;
            const subCat   = sub?.isActive && sub?.category ? sub.category.toUpperCase() : null;
            return (
              <div key={u.id || u._id} onClick={() => handleSelect(u)}
                style={{ padding: 'clamp(10px,1.5vw,12px) clamp(12px,2vw,16px)', cursor: 'pointer', borderBottom: idx < results.length - 1 ? `1px solid ${T.border}` : 'none', transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(76,211,137,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,rgba(76,211,137,0.2),rgba(0,95,43,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: T.accentMid, border: `1.5px solid ${T.border}` }}>
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                    <p style={{ fontSize: 11, color: T.textLight, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.email}{u.phone ? ` · ${u.phone}` : ''}
                    </p>
                  </div>
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
                    {subCat && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 50, background: 'rgba(196,154,54,0.12)', color: T.gold }}>👑 {subCat}</span>}
                    {prefTime
                      ? <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 50, background: 'rgba(76,211,137,0.10)', color: T.accentMid }}>⏰ {prefTime}</span>
                      : <span style={{ fontSize: 9, color: T.textLight, padding: '2px 7px', borderRadius: 50, background: 'rgba(0,0,0,0.04)' }}>No time</span>
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected user card */}
      {selectedUser && (() => {
        const prefTime = extractPreferredTime(selectedUser.address);
        const sub      = selectedUser.subscription;
        const subCat   = sub?.isActive && sub?.category ? sub.category.toUpperCase() : null;
        return (
          <div style={{ padding: 'clamp(12px,2vw,16px)', borderRadius: 12, background: 'rgba(76,211,137,0.05)', border: `2px solid ${T.accentMid}`, animation: 'slideDown .25s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#4cd389,#2ea065)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff' }}>
                {selectedUser.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 'clamp(13px,1.6vw,15px)', fontWeight: 700, color: T.text, margin: '0 0 2px' }}>✅ {selectedUser.name}</p>
                <p style={{ fontSize: 11, color: T.textLight, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedUser.email}{selectedUser.phone ? ` · ${selectedUser.phone}` : ''}
                </p>
              </div>
              <button type="button" onClick={handleClear}
                style={{ flexShrink: 0, padding: '6px 12px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: T.textLight, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.red; e.currentTarget.style.color = T.red; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textLight; }}
              >
                ✕ Change
              </button>
            </div>

            <div className="add-user-info-row">
              <div className="add-user-info-col" style={{ padding: '10px 12px', borderRadius: 10, background: prefTime ? 'rgba(76,211,137,0.08)' : 'rgba(0,0,0,0.03)', border: `1px solid ${prefTime ? 'rgba(76,211,137,0.25)' : 'rgba(0,0,0,0.08)'}` }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: T.textLight, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>⏰ Preferred Time</p>
                <p style={{ fontSize: 'clamp(12px,1.5vw,14px)', fontWeight: 700, color: prefTime ? T.accentMid : T.textLight, margin: 0 }}>{prefTime || 'Not set'}</p>
                {prefTime && <p style={{ fontSize: 10, color: T.textLight, margin: '3px 0 0' }}>✅ Auto-fills on date select</p>}
              </div>
              <div className="add-user-info-col" style={{ padding: '10px 12px', borderRadius: 10, background: subCat ? 'rgba(196,154,54,0.08)' : 'rgba(0,0,0,0.03)', border: `1px solid ${subCat ? 'rgba(196,154,54,0.25)' : 'rgba(0,0,0,0.08)'}` }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: T.textLight, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>👑 Subscription</p>
                <p style={{ fontSize: 'clamp(12px,1.5vw,14px)', fontWeight: 700, color: subCat ? T.gold : T.textLight, margin: 0 }}>
                  {subCat ? (CATEGORY_LABELS[subCat] || subCat) : 'No subscription'}
                </p>
                {subCat && <p style={{ fontSize: 10, color: T.textLight, margin: '3px 0 0' }}>✅ Category auto-selected</p>}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* ── Sub-components ── */
function CatTile({ cat, selected, onSelect }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onSelect} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: 'clamp(10px,1.5vw,14px) clamp(6px,1vw,8px)',
        borderRadius: 12, textAlign: 'center', cursor: 'pointer',
        border: selected ? '2px solid #2ea065' : `1.5px solid ${h ? 'rgba(46,160,101,0.3)' : '#c8e6d4'}`,
        background: selected ? 'rgba(76,211,137,0.10)' : h ? 'rgba(76,211,137,0.04)' : '#fafffe',
        transform: selected ? 'scale(1.04)' : h ? 'scale(1.02)' : 'scale(1)',
        boxShadow: selected ? '0 4px 16px rgba(0,95,43,0.12)' : 'none',
        transition: 'all .22s ease',
      }}
    >
      <div style={{ fontSize: 'clamp(20px,3vw,26px)', marginBottom: 5 }}>{cat.emoji}</div>
      <div style={{ fontSize: 'clamp(10px,1.2vw,12px)', fontWeight: 700, color: selected ? '#005f2b' : '#1a1208', marginBottom: 2 }}>{cat.label}</div>
      <div style={{ fontSize: 'clamp(9px,1vw,10px)', color: '#9a8a6a', lineHeight: 1.3 }}>{cat.desc}</div>
      {selected && (
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'linear-gradient(135deg,#4cd389,#2ea065)', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '6px auto 0' }}>✓</div>
      )}
    </div>
  );
}

function TypeTile({ t, selected, onSelect }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onSelect} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: 'clamp(14px,2vw,20px)',
        borderRadius: 14, cursor: 'pointer',
        border: selected ? '2px solid #2ea065' : `1.5px solid ${h ? 'rgba(46,160,101,0.25)' : '#c8e6d4'}`,
        background: selected ? 'rgba(76,211,137,0.06)' : h ? 'rgba(76,211,137,0.03)' : '#fafffe',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
        boxShadow: selected ? '0 8px 24px rgba(0,95,43,0.10)' : 'none',
        transition: 'all .25s ease', position: 'relative',
      }}
    >
      {selected && (
        <div style={{ position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#4cd389,#2ea065)', color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
      )}
      <div style={{ fontSize: 'clamp(26px,4vw,32px)', marginBottom: 10 }}>{t.icon}</div>
      <h4 style={{ fontSize: 'clamp(13px,1.6vw,15px)', fontWeight: 700, marginBottom: 6, color: selected ? '#005f2b' : '#1a1208' }}>{t.label}</h4>
      <p style={{ fontSize: 'clamp(11px,1.3vw,12px)', color: '#9a8a6a', lineHeight: 1.6, marginBottom: 10 }}>{t.desc}</p>
      {t.bullets.map(b => (
        <div key={b} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
          <span style={{ color: '#2ea065', fontWeight: 700, flexShrink: 0 }}>✓</span>
          <span style={{ fontSize: 'clamp(11px,1.3vw,12px)', color: '#6b5a3e' }}>{b}</span>
        </div>
      ))}
    </div>
  );
}

function NextBtn({ onClick, disabled, label }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: 'clamp(10px,1.5vw,12px) clamp(20px,3vw,28px)',
        background: disabled ? '#c8e6d4' : h ? 'linear-gradient(135deg,#2ea065,#005f2b)' : 'linear-gradient(135deg,#4cd389,#2ea065)',
        color: disabled ? '#9a8a6a' : '#fff',
        border: 'none', borderRadius: 10, fontWeight: 700,
        fontSize: 'clamp(13px,1.5vw,14px)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all .2s', fontFamily: 'inherit',
        boxShadow: disabled ? 'none' : h ? '0 8px 24px rgba(0,95,43,0.22)' : '0 4px 14px rgba(0,95,43,0.16)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick}
      style={{ flex: 1, padding: 'clamp(10px,1.5vw,13px)', background: 'transparent', border: '1.5px solid #c8e6d4', color: '#9a8a6a', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#2ea065'; e.currentTarget.style.color = '#2ea065'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#c8e6d4'; e.currentTarget.style.color = '#9a8a6a'; }}
    >
      ← Back
    </button>
  );
}

/* ─── DD/MM/YYYY helpers ─── */
function isoDateToDDMMYYYY(iso) {
  // '2025-06-15' → '15/06/2025'
  if (!iso || iso.length < 10) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

function ddmmyyyyToIso(str) {
  // '15/06/2025' → '2025-06-15'
  const digits = str.replace(/\D/g, '');
  if (digits.length < 8) return '';
  const d = digits.slice(0, 2);
  const m = digits.slice(2, 4);
  const y = digits.slice(4, 8);
  const iso = `${y}-${m}-${d}`;
  const dt  = new Date(iso);
  if (isNaN(dt.getTime())) return '';
  return iso;
}

function autoSlashDate(raw) {
  // Insert slashes automatically as user types
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    if (i === 2 || i === 4) out += '/';
    out += digits[i];
  }
  return out;
}

/* ─── Date-only input: shows DD/MM/YYYY, stores YYYY-MM-DD ─── */
function DateOnlyInput({ value, onChange, min }) {
  const [foc,     setFoc]     = useState(false);
  const [display, setDisplay] = useState(isoDateToDDMMYYYY(value));

  // Keep display in sync when value changes externally
  useEffect(() => {
    setDisplay(isoDateToDDMMYYYY(value));
  }, [value]);

  const handleChange = (e) => {
    const formatted = autoSlashDate(e.target.value);
    setDisplay(formatted);

    if (formatted.length === 10) {
      const iso = ddmmyyyyToIso(formatted);
      if (iso) {
        // Enforce min date
        if (min && iso < min) return;
        onChange(iso);
      }
    } else {
      onChange('');
    }
  };

  const handleBlur = () => {
    setFoc(false);
    if (display.length > 0 && display.length < 10) {
      setDisplay('');
      onChange('');
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder="DD/MM/YYYY"
      value={display}
      maxLength={10}
      onChange={handleChange}
      onFocus={() => setFoc(true)}
      onBlur={handleBlur}
      style={{
        width: '100%',
        padding: 'clamp(10px,1.5vw,12px) clamp(12px,2vw,16px)',
        boxSizing: 'border-box',
        background: T.inputBg,
        border: `1.5px solid ${foc ? T.accentMid : T.border}`,
        borderRadius: 10,
        color: T.text,
        fontSize: 'clamp(13px,1.5vw,14px)',
        outline: 'none',
        fontFamily: 'inherit',
        boxShadow: foc ? '0 0 0 3px rgba(76,211,137,0.12)' : 'none',
        transition: 'all 0.2s',
        letterSpacing: display.length > 0 ? '1.5px' : 'normal',
      }}
    />
  );
}

/* ─── DateTime input: shows DD/MM/YYYY HH:MM, stores YYYY-MM-DDTHH:MM ─── */
function DateTimeInput({ value, onChange, min }) {
  // Split stored value into date and time parts
  const [datePart, setDatePart] = useState('');
  const [timePart, setTimePart] = useState('');

  // Sync from external value (ISO datetime string)
  useEffect(() => {
    if (value && value.length >= 16) {
      const [isoDate, isoTime] = value.split('T');
      setDatePart(isoDateToDDMMYYYY(isoDate));
      setTimePart(isoTime?.slice(0, 5) || '');
    } else {
      setDatePart('');
      setTimePart('');
    }
  }, [value]);

  // Recombine and fire onChange
  const combine = (dateDisplay, time) => {
    if (dateDisplay.length === 10 && time.length === 5) {
      const isoDate = ddmmyyyyToIso(dateDisplay);
      if (isoDate) {
        const combined = `${isoDate}T${time}`;
        // Enforce min
        if (min && combined < min) return;
        onChange(combined);
        return;
      }
    }
    onChange('');
  };

  const [dateFoc, setDateFoc] = useState(false);
  const [timeFoc, setTimeFoc] = useState(false);

  const handleDateChange = (e) => {
    const formatted = autoSlashDate(e.target.value);
    setDatePart(formatted);
    if (formatted.length === 10) {
      combine(formatted, timePart);
    } else {
      onChange('');
    }
  };

  const handleDateBlur = () => {
    setDateFoc(false);
    if (datePart.length > 0 && datePart.length < 10) {
      setDatePart('');
      onChange('');
    }
  };

  const handleTimeChange = (e) => {
    setTimePart(e.target.value);
    combine(datePart, e.target.value);
  };

  const inputStyle = (foc) => ({
    width: '100%',
    padding: 'clamp(10px,1.5vw,12px) clamp(12px,2vw,16px)',
    boxSizing: 'border-box',
    background: T.inputBg,
    border: `1.5px solid ${foc ? T.accentMid : T.border}`,
    borderRadius: 10,
    color: T.text,
    fontSize: 'clamp(13px,1.5vw,14px)',
    outline: 'none',
    fontFamily: 'inherit',
    boxShadow: foc ? '0 0 0 3px rgba(76,211,137,0.12)' : 'none',
    transition: 'all 0.2s',
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
      {/* Date: DD/MM/YYYY */}
      <div>
        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: T.textLight, marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' }}>
          📅 Date (DD/MM/YYYY)
        </label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="DD/MM/YYYY"
          value={datePart}
          maxLength={10}
          onChange={handleDateChange}
          onFocus={() => setDateFoc(true)}
          onBlur={handleDateBlur}
          style={{
            ...inputStyle(dateFoc),
            letterSpacing: datePart.length > 0 ? '1.5px' : 'normal',
          }}
        />
      </div>

      {/* Time: HH:MM */}
      <div style={{ minWidth: 120 }}>
        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: T.textLight, marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' }}>
          ⏰ Time
        </label>
        <input
          type="time"
          value={timePart}
          onChange={handleTimeChange}
          onFocus={() => setTimeFoc(true)}
          onBlur={() => setTimeFoc(false)}
          style={inputStyle(timeFoc)}
        />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════ */
export default function AddClassPage() {
  useStyles();
  const router = useRouter();
  const [tab,  setTab]  = useState('public');
  const [step, setStep] = useState(1);

  /* ── Public class state ── */
  const [category,     setCategory]     = useState('');
  const [classType,    setClassType]    = useState('');
  const [title,        setTitle]        = useState('');
  const [description,  setDescription]  = useState('');
  const [level,        setLevel]        = useState('ALL_LEVELS');
  const [scheduledAt,  setScheduledAt]  = useState('');
  const [isPremium,    setIsPremium]    = useState(false);
  const [thumbnail,    setThumbnail]    = useState('');
  const [videoUrl,     setVideoUrl]     = useState('');
  const [videoKey,     setVideoKey]     = useState('');
  const [videoProvider,setVideoProvider]= useState('');
  const [videoReady,   setVideoReady]   = useState(false);
  const [imgUpl,       setImgUpl]       = useState(false);
  const [imgPct,       setImgPct]       = useState(0);
  const [submitting,   setSubmitting]   = useState(false);

  /* ── Personal class state ── */
  const [selectedUser,       setSelectedUser]       = useState(null);
  const [personalTitle,      setPersonalTitle]      = useState('');
  const [personalDesc,       setPersonalDesc]       = useState('');
  const [personalLevel,      setPersonalLevel]      = useState('ALL_LEVELS');
  const [personalCategory,   setPersonalCategory]   = useState('');
  const [personalDate,       setPersonalDate]       = useState('');
  const [personalScheduledAt,setPersonalScheduledAt]= useState('');
  const [personalMeetLink,   setPersonalMeetLink]   = useState('');
  const [personalDuration,   setPersonalDuration]   = useState(60);
  const [personalSubmitting, setPersonalSubmitting] = useState(false);

  /* ── Auto-fill when user selected ── */
  useEffect(() => {
    if (!selectedUser) {
      setPersonalCategory(''); setPersonalDate('');
      setPersonalScheduledAt(''); setPersonalTitle(''); setPersonalDesc('');
      return;
    }
    const subCat = selectedUser.subscription?.category?.toUpperCase();
    if (subCat) setPersonalCategory(subCat);
    if (personalDate) {
      const prefTime = extractPreferredTime(selectedUser.address);
      if (prefTime) {
        const dt = parsePreferredTimeToSchedule(prefTime, personalDate);
        if (dt) setPersonalScheduledAt(dt);
      }
    }
  }, [selectedUser]);

  /* ── Auto-fill time when date changes ── */
  useEffect(() => {
    if (!selectedUser || !personalDate) return;
    const prefTime = extractPreferredTime(selectedUser.address);
    if (prefTime) {
      const dt = parsePreferredTimeToSchedule(prefTime, personalDate);
      if (dt) setPersonalScheduledAt(dt);
    }
  }, [personalDate]);

  const preferredTime     = extractPreferredTime(selectedUser?.address);
  const selectedCat       = CATEGORIES.find(c => c.value === category);
  const selectedPersonalCat = CATEGORIES.find(c => c.value === personalCategory);
  const minDt = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  const handleImageFile = async (file) => {
    if (!file.type.startsWith('image/')) return toast.error('Select an image file');
    if (file.size > 10 * 1024 * 1024) return toast.error('Max 10 MB');
    setImgUpl(true); setImgPct(0);
    const fd = new FormData(); fd.append('file', file); fd.append('type', 'image');
    try {
      const r = await axios.post('/api/upload', fd, { onUploadProgress: e => setImgPct(Math.round(e.loaded * 100 / e.total)) });
      setThumbnail(r.data.url); toast.success('✅ Thumbnail uploaded');
    } catch { toast.error('Image upload failed'); }
    finally { setImgUpl(false); setImgPct(0); }
  };

  const handleVideoSuccess = useCallback(({ url, key, videoProvider: provider }) => {
    setVideoUrl(url); setVideoKey(key); setVideoProvider(provider); setVideoReady(true);
  }, []);

  /* ── Submit: Public ── */
  const handleSubmitPublic = async () => {
    if (!title.trim())    return toast.error('Title required');
    if (!category)        return toast.error('Select a category');
    if (classType === 'live'     && !scheduledAt) return toast.error('Set date & time');
    if (classType === 'recorded' && !videoReady)  return toast.error('Upload video first');

    setSubmitting(true);
    try {
      const payload = {
        title:          title.trim(),
        description:    description.trim(),
        category,
        type:           classType.toUpperCase(),
        level,
        instructor:     'Yoga Temple',
        duration:       60,
        maxParticipants:30,
        isPremium,
        image:          thumbnail || null,
        thumbnail:      thumbnail || null,
        videoUrl:       classType === 'recorded' ? videoUrl      : null,
        videoKey:       classType === 'recorded' ? videoKey      : null,
        videoProvider:  classType === 'recorded' ? videoProvider : null,
        scheduledAt:    classType === 'live'     ? scheduledAt   : null,
        price:          0,
        tags:           [category.toLowerCase()],
        isPersonal:     false,
      };
      await axios.post('/api/classes', payload);
      toast.success('✅ Class created!');
      router.push('/admin/classes');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Submit: Personal ── */
  const handleSubmitPersonal = async () => {
    if (!selectedUser)          return toast.error('Select a user');
    if (!personalTitle.trim())  return toast.error('Title required');
    if (!personalCategory)      return toast.error('Select a category');
    if (!personalScheduledAt)   return toast.error('Set date');

    setPersonalSubmitting(true);
    try {
      await axios.post('/api/classes', {
        title:          personalTitle.trim(),
        description:    personalDesc.trim(),
        category:       personalCategory,
        type:           'LIVE',
        level:          personalLevel,
        instructor:     'Yoga Temple',
        duration:       Number(personalDuration) || 60,
        maxParticipants:1,
        isPremium:      true,
        image:          thumbnail || null,
        thumbnail:      thumbnail || null,
        scheduledAt:    personalScheduledAt,
        price:          0,
        tags:           [personalCategory.toLowerCase(), 'personal'],
        isPersonal:     true,
        targetUserId:   selectedUser.id || selectedUser._id,
        ...(personalMeetLink ? { googleMeetLink: personalMeetLink } : {}),
      });
      toast.success(`✅ Personal class for ${selectedUser.name}!`);
      router.push('/admin/classes');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setPersonalSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, paddingBottom: 48 }}>

      {/* Header */}
      <div style={{ marginBottom: 'clamp(16px,2vw,24px)' }}>
        <h2 style={{ fontSize: 'clamp(18px,3vw,22px)', fontWeight: 700, color: '#1a1208', fontFamily: "'Cormorant Garamond',serif", marginBottom: 4 }}>
          Add New Class
        </h2>
        <p style={{ fontSize: 'clamp(12px,1.4vw,13px)', color: '#9a8a6a' }}>
          Create a public class for all users, or a personal class for a specific subscriber.
        </p>
      </div>

      {/* ── TAB SWITCHER ── */}
      <div style={{ display: 'flex', background: 'rgba(76,211,137,.05)', borderRadius: 14, padding: 4, marginBottom: 'clamp(18px,3vw,28px)', border: '1px solid rgba(76,211,137,.15)' }}>
        {[
          { value:'public',   label:'🌍 Public Class',   desc:'For all / category users' },
          { value:'personal', label:'🎯 Personal Class',  desc:'For one specific user'    },
        ].map(t => (
          <button key={t.value}
            onClick={() => { setTab(t.value); setStep(1); }}
            style={{
              flex: 1, padding: 'clamp(10px,1.5vw,12px) 8px',
              borderRadius: 10, border: 'none', cursor: 'pointer',
              background: tab === t.value ? 'linear-gradient(135deg,#4cd389,#2ea065)' : 'transparent',
              color: tab === t.value ? '#fff' : T.textLight,
              fontFamily: 'inherit', transition: 'all .25s ease',
              boxShadow: tab === t.value ? '0 4px 14px rgba(0,95,43,.22)' : 'none',
            }}
          >
            <div style={{ fontSize: 'clamp(12px,1.5vw,14px)', fontWeight: 700 }}>{t.label}</div>
            <div className="add-tab-desc" style={{ fontSize: 'clamp(10px,1.2vw,11px)', opacity: .8, marginTop: 2 }}>{t.desc}</div>
          </button>
        ))}
      </div>

      {/* ═══ PUBLIC CLASS FORM ═══ */}
      {tab === 'public' && (
        <div style={{ background: '#fff', borderRadius: 20, padding: 'clamp(16px,3vw,32px)', border: '1px solid #c8e6d4', boxShadow: '0 4px 24px rgba(0,95,43,0.07)' }}>

          {/* Step indicator */}
          <div className="add-steps">
            {[{ n:1, label:'Category' }, { n:2, label:'Class Type' }, { n:3, label:'Details' }].map((s, i) => (
              <div key={s.n} style={{ display:'flex', alignItems:'center', flex: i < 2 ? 1 : 'none' }}>
                <StepDot n={s.n} current={step} />
                <span className="add-step-label" style={{ color: step >= s.n ? '#005f2b' : '#9a8a6a' }}>{s.label}</span>
                {i < 2 && (
                  <div style={{ flex:1, height:2, margin:'0 8px', background: step > s.n ? 'linear-gradient(90deg,#4cd389,#2ea065)' : '#c8e6d4', borderRadius:1, transition:'background .4s', minWidth: 12 }} />
                )}
              </div>
            ))}
          </div>

          {/* ── Step 1: Category ── */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: 'clamp(16px,2.5vw,18px)', fontWeight: 700, color: '#1a1208', marginBottom: 6, fontFamily: "'Cormorant Garamond',serif" }}>
                Select Yoga Category
              </h3>
              <p style={{ fontSize: 13, color: '#9a8a6a', marginBottom: 20 }}>
                Choose the style of yoga for this class.
              </p>
              <div className="add-cat-grid">
                {CATEGORIES.map(cat => (
                  <CatTile key={cat.value} cat={cat} selected={category === cat.value} onSelect={() => setCategory(cat.value)} />
                ))}
              </div>
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                <NextBtn disabled={!category} onClick={() => setStep(2)} label="Next: Class Type →" />
              </div>
            </div>
          )}

          {/* ── Step 2: Class Type ── */}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: 'clamp(16px,2.5vw,18px)', fontWeight: 700, color: '#1a1208', marginBottom: 6, fontFamily: "'Cormorant Garamond',serif" }}>
                Select Class Type
              </h3>
              <p style={{ fontSize: 13, color: '#9a8a6a', marginBottom: 20 }}>
                Category: <strong style={{ color: '#005f2b' }}>{selectedCat?.emoji} {selectedCat?.label}</strong>
              </p>
              <div className="add-type-grid">
                {[
                  { value:'live',     icon:'🔴', label:'Live Class',     desc:'Schedule a real-time session.', bullets:['✅ Auto Meet link', 'Schedule date & time', 'Real-time interaction'] },
                  { value:'recorded', icon:'📹', label:'Recorded Class', desc:'Upload video.',                 bullets:['☁️ Upload to Cloud', 'Up to 500 MB', 'Watch anytime'] },
                ].map(t => (
                  <TypeTile key={t.value} t={t} selected={classType === t.value} onSelect={() => setClassType(t.value)} />
                ))}
              </div>
              <div className="add-submit-row" style={{ marginTop: 24 }}>
                <BackBtn onClick={() => setStep(1)} />
                <NextBtn disabled={!classType} onClick={() => setStep(3)} label="Next: Details →" />
              </div>
            </div>
          )}

          {/* ── Step 3: Details ── */}
          {step === 3 && (
            <div>
              <h3 style={{ fontSize: 'clamp(16px,2.5vw,18px)', fontWeight: 700, color: '#1a1208', marginBottom: 8, fontFamily: "'Cormorant Garamond',serif" }}>
                Class Details
              </h3>

              {/* Tags */}
              <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
                <span style={{ fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:50, background:'rgba(0,95,43,0.08)', color:'#005f2b' }}>
                  {selectedCat?.emoji} {selectedCat?.label}
                </span>
                <span style={{ fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:50, background: classType==='live' ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)', color: classType==='live' ? '#ef4444' : '#3b82f6' }}>
                  {classType === 'live' ? '🔴 Live' : '📹 Recorded'}
                </span>
              </div>

              <Field label="Class Title" required>
                <Inp value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Morning Hatha Flow" />
              </Field>

              <Field label="Description">
                <Txt value={description} onChange={e => setDescription(e.target.value)} placeholder="A gentle class focusing on breath…" />
              </Field>

              <Field label="Level">
                <Sel value={level} onChange={e => setLevel(e.target.value)} options={LEVELS} />
              </Field>

                           {classType === 'live' && (
                <>
                  <Field label="Schedule Date & Time" required hint="Date in DD/MM/YYYY format">
                    <DateTimeInput
                      value={scheduledAt}
                      onChange={setScheduledAt}
                      min={minDt}
                    />
                    {scheduledAt && (
                      <p style={{ fontSize:11, color:'#2ea065', marginTop:5, fontWeight:600 }}>
                        📅 {new Date(scheduledAt).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' })}
                      </p>
                    )}
                  </Field>
                  <Field label="Google Meet Link" hint="Auto-generated when you save.">
                    <div style={{ padding:'12px 16px', borderRadius:12, background:'rgba(76,211,137,0.05)', border:'1.5px solid rgba(76,211,137,0.22)', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg,#4cd389,#2ea065)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🔗</div>
                      <div style={{ flex:1, minWidth:120 }}>
                        <p style={{ fontSize:13, fontWeight:700, color:'#005f2b', margin:0 }}>Automatically Generated</p>
                        <p style={{ fontSize:11, color:'#9a8a6a', margin:'3px 0 0' }}>Unique Meet link created on save.</p>
                      </div>
                      <span style={{ fontSize:10, fontWeight:700, flexShrink:0, background:'rgba(76,211,137,0.12)', color:'#2ea065', padding:'3px 10px', borderRadius:50 }}>✅ Auto</span>
                    </div>
                  </Field>
                </>
              )}

              <Field label="Thumbnail" hint="Max 10 MB">
                <ImageUploadBox onFile={handleImageFile} preview={thumbnail} uploading={imgUpl} progress={imgPct} />
              </Field>

              {classType === 'recorded' && (
                <Field label="Class Video" required hint="Max 500 MB">
                  <R2VideoUploader category={category} isPremium={isPremium} onSuccess={handleVideoSuccess} />
                  {videoReady && (
                    <div style={{ marginTop:12, padding:'10px 14px', background:'rgba(22,163,74,0.06)', border:'1px solid rgba(22,163,74,0.18)', borderRadius:10 }}>
                      <p style={{ fontSize:11, fontWeight:700, color:'#16a34a', margin:'0 0 4px' }}>✅ Video Ready</p>
                      <code style={{ fontSize:10, color:T.textMuted, wordBreak:'break-all' }}>Key: {videoKey}</code>
                    </div>
                  )}
                </Field>
              )}

              {/* Premium toggle */}
              <div
                onClick={() => setIsPremium(p => !p)}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'clamp(12px,2vw,16px) clamp(14px,2vw,18px)', borderRadius:12, border:`1.5px solid ${isPremium ? 'rgba(196,154,54,0.4)' : T.border}`, background: isPremium ? 'rgba(196,154,54,0.06)' : '#fafffe', cursor:'pointer', marginBottom:24, transition:'all .25s', flexWrap:'wrap', gap:10 }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:44, height:44, borderRadius:12, flexShrink:0, background: isPremium ? 'rgba(196,154,54,0.12)' : 'rgba(76,211,137,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>👑</div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color: isPremium ? '#c49a36' : '#1a1208' }}>Premium Only</div>
                    <div style={{ fontSize:12, color:'#9a8a6a', marginTop:2 }}>Only subscribed members</div>
                  </div>
                </div>
                <div style={{ width:48, height:26, borderRadius:13, flexShrink:0, background: isPremium ? 'linear-gradient(135deg,#c49a36,#f0c060)' : '#c8e6d4', position:'relative', transition:'background .25s' }}>
                  <div style={{ position:'absolute', top:3, left: isPremium ? 26 : 3, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left .25s', boxShadow:'0 1px 6px rgba(0,0,0,0.15)' }} />
                </div>
              </div>

              {/* Submit row */}
              <div className="add-submit-row">
                <BackBtn onClick={() => setStep(2)} />
                <button
                  onClick={handleSubmitPublic}
                  disabled={submitting || imgUpl || (classType === 'recorded' && !videoReady)}
                  style={{
                    flex: 2, padding: 'clamp(12px,1.8vw,14px)',
                    background: (submitting || imgUpl || (classType==='recorded' && !videoReady))
                      ? '#c8e6d4'
                      : 'linear-gradient(135deg,#4cd389,#2ea065)',
                    color: (submitting || imgUpl || (classType==='recorded' && !videoReady))
                      ? '#9a8a6a' : '#fff',
                    border:'none', borderRadius:10, fontWeight:700,
                    fontSize:'clamp(13px,1.6vw,15px)',
                    cursor: (submitting || imgUpl || (classType==='recorded' && !videoReady))
                      ? 'not-allowed' : 'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    fontFamily:'inherit', transition:'all .2s',
                    boxShadow: submitting ? 'none' : '0 4px 16px rgba(76,211,137,0.28)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {submitting
                    ? <><span style={{ animation:'spin 1s linear infinite', display:'inline-block' }}>⏳</span> Creating…</>
                    : imgUpl
                      ? '⏳ Uploading…'
                      : classType === 'recorded' && !videoReady
                        ? '⬆️ Upload video first'
                        : `✅ Create ${classType === 'live' ? 'Live' : 'Recorded'} Class`
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ PERSONAL CLASS FORM ═══ */}
      {tab === 'personal' && (
        <div style={{ background:'#fff', borderRadius:20, padding:'clamp(16px,3vw,32px)', border:'1px solid rgba(196,154,54,0.25)', boxShadow:'0 4px 24px rgba(196,154,54,0.08)' }}>

          {/* Header */}
          <div style={{ marginBottom:20, padding:'clamp(12px,2vw,16px) clamp(14px,2vw,18px)', background:'linear-gradient(135deg,rgba(196,154,54,0.08),rgba(196,154,54,0.04))', borderRadius:12, border:'1px solid rgba(196,154,54,0.2)' }}>
            <h3 style={{ fontSize:'clamp(16px,2.5vw,18px)', fontWeight:700, color:'#1a1208', margin:'0 0 6px', fontFamily:"'Cormorant Garamond',serif" }}>
              🎯 Schedule a Personal Class
            </h3>
            <p style={{ fontSize:'clamp(12px,1.4vw,13px)', color:T.textMuted, margin:0 }}>
              Create a private live class for a specific subscriber. Only they will see it.
            </p>
          </div>

          <Field label="1. Select Subscriber" required hint="Search for the user. Preferred time and category auto-fill.">
            <UserSearch selectedUser={selectedUser} onSelect={setSelectedUser} />
          </Field>

          {selectedUser && (
            <div style={{ animation:'r2fadeUp .3s ease' }}>

              {/* Category */}
              <Field
                label="2. Yoga Category" required
                hint={selectedUser.subscription?.isActive && selectedUser.subscription?.category
                  ? `✅ Auto-selected from user's active ${selectedUser.subscription.category} subscription`
                  : 'Select the category for this session'
                }
              >
                {selectedUser.subscription?.isActive && selectedUser.subscription?.category && personalCategory && (
                  <div style={{ padding:'clamp(10px,1.5vw,12px) clamp(12px,2vw,16px)', borderRadius:10, marginBottom:12, background:'rgba(196,154,54,0.08)', border:'1.5px solid rgba(196,154,54,0.3)', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', animation:'slideDown .25s ease' }}>
                    <span style={{ fontSize:22 }}>{catEmoji[personalCategory] || '🧘'}</span>
                    <div style={{ flex:1, minWidth:120 }}>
                      <p style={{ fontSize:11, fontWeight:700, color:T.gold, margin:'0 0 2px', textTransform:'uppercase', letterSpacing:1 }}>Auto-Selected from Subscription</p>
                      <p style={{ fontSize:'clamp(13px,1.6vw,15px)', fontWeight:700, color:T.text, margin:0 }}>{catEmoji[personalCategory]} {personalCategory}</p>
                    </div>
                    <button type="button" onClick={() => setPersonalCategory('')}
                      style={{ fontSize:11, color:T.textLight, background:'transparent', border:`1px solid ${T.border}`, borderRadius:8, padding:'4px 10px', cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}
                      onMouseEnter={e => { e.currentTarget.style.color = T.red; e.currentTarget.style.borderColor = T.red; }}
                      onMouseLeave={e => { e.currentTarget.style.color = T.textLight; e.currentTarget.style.borderColor = T.border; }}
                    >
                      Override ↓
                    </button>
                  </div>
                )}

                {(!selectedUser.subscription?.isActive || !selectedUser.subscription?.category || !personalCategory) && (
                  <div className="add-personal-cat-grid">
                    {CATEGORIES.map(cat => (
                      <div key={cat.value} onClick={() => setPersonalCategory(cat.value)}
                        style={{ padding:'10px 6px', borderRadius:10, textAlign:'center', cursor:'pointer', border: personalCategory === cat.value ? '2px solid #2ea065' : '1.5px solid #c8e6d4', background: personalCategory === cat.value ? 'rgba(76,211,137,0.10)' : '#fafffe', transform: personalCategory === cat.value ? 'scale(1.03)' : 'scale(1)', transition:'all .2s ease' }}
                      >
                        <div style={{ fontSize:'clamp(18px,2.5vw,22px)', marginBottom:4 }}>{cat.emoji}</div>
                        <div style={{ fontSize:'clamp(10px,1.2vw,11px)', fontWeight:700, color: personalCategory === cat.value ? '#005f2b' : '#1a1208' }}>{cat.label}</div>
                        {personalCategory === cat.value && (
                          <div style={{ width:16, height:16, borderRadius:'50%', background:'linear-gradient(135deg,#4cd389,#2ea065)', color:'#fff', fontSize:9, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', margin:'4px auto 0' }}>✓</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Field>

              <Field label="3. Class Title" required>
                <Inp value={personalTitle} onChange={e => setPersonalTitle(e.target.value)} placeholder={selectedPersonalCat ? `e.g., Personal ${selectedPersonalCat.label} for ${selectedUser.name}` : 'Class title…'} />
              </Field>

              <Field label="Description">
                <Txt value={personalDesc} onChange={e => setPersonalDesc(e.target.value)} placeholder="What will this session cover?" />
              </Field>

              <div className="add-two-col">
                <Field label="4. Level">
                  <Sel value={personalLevel} onChange={e => setPersonalLevel(e.target.value)} options={LEVELS} />
                </Field>
                <Field label="Duration (min)">
                  <Inp type="number" value={personalDuration} onChange={e => setPersonalDuration(e.target.value)} min="15" />
                </Field>
              </div>

              <Field
                label="5. Select Date" required
                hint={preferredTime
                  ? `⏰ Time will auto-fill to "${preferredTime}" from this user's preference`
                  : '⚠️ This user has no preferred time — you can adjust the time below'
                }
              >
                                <div style={{ marginBottom: 10 }}>
                  <DateOnlyInput
                    value={personalDate}
                    onChange={setPersonalDate}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {personalDate && preferredTime && personalScheduledAt && (
                  <div style={{ padding:'clamp(10px,1.5vw,12px) clamp(12px,2vw,16px)', borderRadius:10, background:'rgba(76,211,137,0.06)', border:'1px solid rgba(76,211,137,0.2)', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', animation:'slideDown .2s ease' }}>
                    <span style={{ fontSize:18 }}>✅</span>
                    <div style={{ flex:1, minWidth:120 }}>
                      <p style={{ fontSize:11, fontWeight:700, color:T.accentMid, margin:'0 0 2px', textTransform:'uppercase', letterSpacing:1 }}>Auto-Filled Schedule</p>
                      <p style={{ fontSize:'clamp(13px,1.5vw,15px)', fontWeight:700, color:T.text, margin:0 }}>
                        {new Date(personalScheduledAt).toLocaleString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                      </p>
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:50, background:'rgba(76,211,137,0.12)', color:T.accentMid, flexShrink:0 }}>
                      ⏰ {preferredTime.split(' - ')[0]}
                    </span>
                  </div>
                )}

                {personalDate && !preferredTime && (
                  <div style={{ marginTop:8 }}>
                    <p style={{ fontSize:11, color:'#f59e0b', fontWeight:600, marginBottom:6 }}>⚠️ No preferred time set — please select time manually:</p>
                                       <DateTimeInput
                      value={personalScheduledAt}
                      onChange={setPersonalScheduledAt}
                      min={minDt}
                    />
                  </div>
                )}

                {!personalDate && (
                  <div style={{ marginTop:8, padding:'10px 14px', borderRadius:10, background:'rgba(59,130,246,0.05)', border:'1px solid rgba(59,130,246,0.15)' }}>
                    <p style={{ fontSize:12, color:'#3b82f6', margin:0 }}>
                      📅 Select a date above — time will auto-fill from {preferredTime ? <strong>"{preferredTime}"</strong> : "user's preferred time"}
                    </p>
                  </div>
                )}
              </Field>

              <Field label="6. Meet Link (Optional)" hint="Leave empty to auto-generate. Or paste a custom link.">
                <Inp value={personalMeetLink} onChange={e => setPersonalMeetLink(e.target.value)} placeholder="https://meet.google.com/abc-defg (optional)" />
              </Field>

              {/* Summary */}
              <div style={{ padding:'clamp(14px,2vw,16px) clamp(14px,2vw,18px)', borderRadius:12, background:'linear-gradient(135deg,rgba(196,154,54,0.08),rgba(196,154,54,0.04))', border:'1px solid rgba(196,154,54,0.2)', marginBottom:20 }}>
                <p style={{ fontSize:12, fontWeight:700, color:T.gold, margin:'0 0 10px', textTransform:'uppercase', letterSpacing:1 }}>📋 Personal Class Summary</p>
                <div className="add-summary-grid">
                  {[
                    ['👤 For',           selectedUser.name],
                    ['📧 Email',         selectedUser.email],
                    ['🧘 Category',      selectedPersonalCat ? `${selectedPersonalCat.emoji} ${selectedPersonalCat.label}` : '—'],
                    ['⏰ Preferred Time', preferredTime || 'Not set'],
                    ['📅 Scheduled',     personalScheduledAt ? new Date(personalScheduledAt).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' }) : '—'],
                    ['⏱ Duration',       `${personalDuration} min`],
                  ].map(([label, value]) => (
                    <div key={label} style={{ padding:'5px 0' }}>
                      <span style={{ fontSize:11, color:T.textLight }}>{label}</span><br />
                      <span style={{ fontSize:'clamp(12px,1.4vw,13px)', fontWeight:600, color:T.text, wordBreak:'break-word' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div style={{ padding:'12px 16px', borderRadius:10, background:'rgba(59,130,246,0.05)', border:'1px solid rgba(59,130,246,0.15)', marginBottom:20 }}>
                <p style={{ fontSize:'clamp(11px,1.3vw,12px)', color:'#3b82f6', margin:0, lineHeight:1.6 }}>
                  ℹ️ This class will <strong>only be visible to {selectedUser.name}</strong> in their Premium Classes page. A notification email will be sent automatically.
                </p>
              </div>

              <button
                onClick={handleSubmitPersonal}
                disabled={personalSubmitting || !personalTitle || !personalCategory || !personalScheduledAt}
                style={{
                  width:'100%', padding:'clamp(12px,1.8vw,14px)',
                  background: (personalSubmitting || !personalTitle || !personalCategory || !personalScheduledAt)
                    ? '#c8e6d4' : 'linear-gradient(135deg,#c49a36,#f0c060)',
                  color: (personalSubmitting || !personalTitle || !personalCategory || !personalScheduledAt)
                    ? '#9a8a6a' : '#000',
                  border:'none', borderRadius:10, fontWeight:700,
                  fontSize:'clamp(13px,1.6vw,15px)',
                  cursor: (personalSubmitting || !personalTitle || !personalCategory || !personalScheduledAt)
                    ? 'not-allowed' : 'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  fontFamily:'inherit', transition:'all .2s',
                  boxShadow: personalSubmitting ? 'none' : '0 4px 16px rgba(196,154,54,0.28)',
                  whiteSpace: 'nowrap', overflow: 'hidden',
                }}
              >
                {personalSubmitting
                  ? <><span style={{ animation:'spin 1s linear infinite', display:'inline-block' }}>⏳</span> Scheduling…</>
                  : `🎯 Schedule for ${selectedUser.name} →`
                }
              </button>
            </div>
          )}

          {!selectedUser && (
            <div style={{ textAlign:'center', padding:'clamp(28px,4vw,40px) 20px', color:T.textLight }}>
              <div style={{ fontSize:'clamp(36px,6vw,48px)', marginBottom:12 }}>🔍</div>
              <p style={{ fontSize:'clamp(13px,1.5vw,14px)', fontWeight:600 }}>Search and select a subscriber above to continue</p>
              <p style={{ fontSize:'clamp(11px,1.3vw,12px)' }}>Their preferred time and subscription category will auto-fill</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}