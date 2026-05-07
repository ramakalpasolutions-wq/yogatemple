// src/app/admin/classes/page.js
'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter }           from 'next/navigation';
import axios                   from 'axios';
import toast                   from 'react-hot-toast';

const T = {
  bgCard:'#ffffff', border:'#c8e6d4', borderHov:'#2ea065',
  accent:'#005f2b', accentMid:'#2ea065', accentLight:'#4cd389',
  accentPale:'rgba(76,211,137,0.10)',
  gold:'#c49a36', text:'#1a1208', textMuted:'#6b5a3e', textLight:'#9a8a6a',
  red:'#ef4444', blue:'#3b82f6', inputBg:'#fafffe',
};

const catEmoji = {
  HATHA:'🌅', VINYASA:'🌊', ASHTANGA:'🔥', POWER:'⚡',
  YIN:'🌙', RESTORATIVE:'🌿', KUNDALINI:'✨', PRENATAL:'🤰',
  KIDS:'🧒', MEDITATION:'🧠', PRANAYAMA:'🌬️',
};

const lvlDisp = {
  BEGINNER:'Beginner', INTERMEDIATE:'Intermediate',
  ADVANCED:'Advanced', ALL_LEVELS:'All Levels',
};

const ALLOWED_VIDEO_TYPES = [
  'video/mp4','video/webm','video/quicktime',
  'video/x-msvideo','video/x-matroska',
];

const KF = `
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes r2fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
`;

/* ══════════════════════════════════════════════════════
   INLINE R2 VIDEO UPLOADER (used inside ClassCard)
══════════════════════════════════════════════════════ */
function InlineR2Uploader({ classId, category, isPremium, currentUrl, onSuccess }) {
  const inputRef = useRef(null);

  const [file,       setFile]       = useState(null);
  const [progress,   setProgress]   = useState(0);
  const [stage,      setStage]      = useState('idle');
  const [dragOver,   setDragOver]   = useState(false);

  const validate = (f) => {
    if (!ALLOWED_VIDEO_TYPES.includes(f.type)) {
      toast.error('Invalid type. Use MP4, WebM, MOV, AVI or MKV.'); return false;
    }
    if (f.size > 500 * 1024 * 1024) {
      toast.error(`Too large. Max 500 MB. Your file: ${(f.size/1024/1024).toFixed(0)} MB`); return false;
    }
    return true;
  };

  const pickFile = (f) => {
    if (!f || !validate(f)) return;
    setFile(f); setStage('idle'); setProgress(0);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  }, []);

  const handleUpload = async () => {
    if (!file) { toast.error('Select a video first'); return; }
    try {
      /* 1. Presign */
      setStage('presigning'); setProgress(0);
      const { data: p } = await axios.post('/api/upload-r2/presign', {
        fileName: file.name, contentType: file.type,
        fileSize: file.size, category: category || 'general',
        uploadType: 'video',
      });

      /* 2. PUT to R2 */
      setStage('uploading'); setProgress(1);
      await axios.put(p.presignedUrl, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: e => setProgress(Math.round(e.loaded / e.total * 100)),
      });

      /* 3. Save to DB */
      setStage('saving');
      await axios.patch(`/api/admin/classes?id=${classId}`, {
        videoUrl:      p.publicUrl || `r2://${p.key}`,
        videoKey:      p.key,
        videoProvider: 'r2',
      });

      setStage('done');
      onSuccess?.({ url: p.publicUrl, key: p.key });
      toast.success('✅ Video uploaded & saved!');
    } catch (err) {
      setStage('error');
      toast.error(err.response?.data?.error || 'Upload failed');
    }
  };

  const reset = () => {
    setFile(null); setStage('idle'); setProgress(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  const isBusy = ['presigning','uploading','saving'].includes(stage);
  const fmtSize = b => b > 1048576 ? `${(b/1048576).toFixed(1)} MB` : `${(b/1024).toFixed(0)} KB`;

  return (
    <div style={{ animation: 'r2fadeUp .3s ease' }}>

      {/* Current video indicator */}
      {currentUrl && stage !== 'done' && (
        <div style={{
          display:'flex', alignItems:'center', gap:8,
          padding:'6px 10px', borderRadius:8, marginBottom:8,
          background:'rgba(76,211,137,0.06)',
          border:'1px solid rgba(76,211,137,0.18)',
          fontSize:11,
        }}>
          <span style={{ color:'#16a34a', fontWeight:700 }}>✅</span>
          <span style={{ color:T.textMuted, flex:1 }}>Video already attached</span>
          <a href={currentUrl} target="_blank" rel="noopener noreferrer"
            style={{ color:T.accentMid, fontWeight:700, fontSize:10, textDecoration:'none' }}>
            Preview ↗
          </a>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !isBusy && stage !== 'done' && inputRef.current?.click()}
        style={{
          border:`2px dashed ${
            stage === 'done' ? '#16a34a'
            : stage === 'error' ? T.red
            : dragOver ? T.accentMid
            : file ? T.accentLight
            : T.border
          }`,
          borderRadius:10, padding:'18px 14px', textAlign:'center',
          cursor: isBusy || stage==='done' ? 'default' : 'pointer',
          background: stage==='done' ? 'rgba(22,163,74,0.04)'
            : dragOver ? 'rgba(76,211,137,0.07)'
            : file ? 'rgba(76,211,137,0.03)'
            : T.inputBg,
          transition:'all .2s',
        }}
      >
        <input ref={inputRef} type="file"
          accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
          style={{ display:'none' }}
          onChange={e => pickFile(e.target.files?.[0])}
          disabled={isBusy}
        />
        <div style={{ fontSize:28, marginBottom:6 }}>
          {stage==='done' ? '✅' : stage==='error' ? '❌' : file ? '🎬' : '☁️'}
        </div>
        {file ? (
          <div>
            <p style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:2 }}>{file.name}</p>
            <p style={{ fontSize:10, color:T.textLight }}>{fmtSize(file.size)}</p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize:12, fontWeight:600, color:T.textMuted, marginBottom:2 }}>
              {stage==='done' ? 'Upload complete!' : 'Drag & drop or click to browse'}
            </p>
            <p style={{ fontSize:10, color:T.textLight }}>MP4, WebM, MOV · Max 500 MB</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {isBusy && (
        <div style={{ marginTop:8 }}>
          <div style={{ height:4, borderRadius:2, background:'rgba(76,211,137,0.12)', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${progress}%`, background:'linear-gradient(90deg,#4cd389,#2ea065)', borderRadius:2, transition:'width .3s' }} />
          </div>
          <p style={{ fontSize:10, color:T.accentMid, fontWeight:600, marginTop:4, textAlign:'center' }}>
            {stage==='presigning' && '🔑 Getting permission…'}
            {stage==='uploading'  && `☁️ Uploading… ${progress}%`}
            {stage==='saving'     && '💾 Saving to database…'}
          </p>
        </div>
      )}

      {/* Info */}
      {file && stage === 'idle' && (
        <p style={{ fontSize:10, color:T.blue, marginTop:6, lineHeight:1.5 }}>
          ℹ️ Uploads directly browser → R2. Bypasses Vercel limits.
          {isPremium ? ' 👑 Premium video.' : ' 🆓 Free video.'}
        </p>
      )}

      {/* Buttons */}
      <div style={{ display:'flex', gap:6, marginTop:8 }}>
        {file && stage !== 'done' && (
          <button
            onClick={handleUpload} disabled={isBusy}
            style={{
              flex:2, padding:'8px',
              background: isBusy ? T.border : 'linear-gradient(135deg,#4cd389,#2ea065)',
              color: isBusy ? T.textLight : '#fff',
              border:'none', borderRadius:8, fontSize:11, fontWeight:700,
              cursor: isBusy ? 'not-allowed' : 'pointer',
              fontFamily:'inherit', transition:'all .2s',
              display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            }}
          >
            {isBusy
              ? <><span style={{ animation:'spin 1s linear infinite', display:'inline-block' }}>⏳</span>
                  {stage==='presigning' ? 'Preparing…' : stage==='uploading' ? `${progress}%` : 'Saving…'}</>
              : '☁️ Upload to R2'
            }
          </button>
        )}
        {(file || stage==='done') && (
          <button
            onClick={reset} disabled={isBusy}
            style={{
              flex:1, padding:'8px', background:'transparent',
              border:`1px solid ${T.border}`, color:T.textLight,
              borderRadius:8, fontSize:11, fontWeight:600,
              cursor: isBusy ? 'not-allowed' : 'pointer',
              fontFamily:'inherit', transition:'all .2s',
            }}
            onMouseEnter={e => { if (!isBusy) { e.currentTarget.style.borderColor=T.accentMid; e.currentTarget.style.color=T.accentMid; }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.textLight; }}
          >
            {stage==='done' ? '🔄 Replace' : '✕ Clear'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════ */
export default function AdminClassesPage() {
  const router = useRouter();

  const [classes,   setClasses]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('ALL');
  const [catFilter, setCatFilter] = useState('ALL');

  const loadClasses = async () => {
    try {
      setLoading(true);
      const r = await axios.get('/api/admin/classes');
      setClasses(r.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClasses(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this class? This cannot be undone.')) return;
    try {
      await axios.delete(`/api/admin/classes?id=${id}`);
      toast.success('Class deleted');
      loadClasses();
    } catch { toast.error('Delete failed'); }
  };

  /* ── Handle video replaced in card ── */
  const handleVideoReplaced = (classId, url) => {
    setClasses(prev => prev.map(c =>
      (c._id || c.id) === classId ? { ...c, videoUrl: url } : c
    ));
  };

  /* ── Filtering ── */
  const filtered = classes.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      c.title?.toLowerCase().includes(q) ||
      c.instructor?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q);
    const matchType =
      filter === 'ALL'      ? true :
      filter === 'LIVE'     ? c.type === 'LIVE' :
      filter === 'RECORDED' ? c.type === 'RECORDED' :
      filter === 'PREMIUM'  ? c.isPremium : true;
    const matchCat =
      catFilter === 'ALL' ? true : c.category === catFilter;
    return matchSearch && matchType && matchCat;
  });

  const liveCount     = classes.filter(c => c.type === 'LIVE').length;
  const recordedCount = classes.filter(c => c.type === 'RECORDED').length;
  const premiumCount  = classes.filter(c => c.isPremium).length;

  const catCounts = classes.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <style suppressHydrationWarning>{KF}</style>

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:700, color:T.text, marginBottom:4, fontFamily:"'Cormorant Garamond',serif" }}>
            All Classes
          </h2>
          <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
            {[
              { label:`${classes.length} total`, color:T.textLight },
              { label:`${liveCount} live`,        color:'#ef4444'   },
              { label:`${recordedCount} recorded`, color:'#3b82f6' },
              { label:`${premiumCount} premium`,  color:T.gold      },
            ].map(s => (
              <span key={s.label} style={{ fontSize:12, color:s.color, fontWeight:600 }}>{s.label}</span>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <RefreshBtn onClick={() => { loadClasses(); toast.success('Refreshed!'); }} />
          <button
            onClick={() => router.push('/admin/add-class')}
            style={{
              background:'linear-gradient(135deg,#4cd389,#2ea065)', color:'#fff',
              border:'none', padding:'10px 20px', borderRadius:10,
              cursor:'pointer', fontWeight:700, fontSize:13,
              display:'flex', alignItems:'center', gap:6,
              fontFamily:'inherit', boxShadow:'0 4px 16px rgba(76,211,137,0.25)',
              transition:'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(76,211,137,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 4px 16px rgba(76,211,137,0.25)'; }}
          >
            ➕ Add New Class
          </button>
        </div>
      </div>

      {/* ── Category strip ── */}
      {!loading && classes.length > 0 && (
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:6, marginBottom:20, scrollbarWidth:'none' }}>
          <CatFilterBtn label="All" value="ALL" active={catFilter==='ALL'} count={classes.length} onClick={() => setCatFilter('ALL')} />
          {Object.entries(catCounts)
            .sort((a,b) => b[1]-a[1])
            .map(([cat, cnt]) => (
              <CatFilterBtn
                key={cat} value={cat}
                label={`${catEmoji[cat] || '🧘'} ${cat}`}
                active={catFilter===cat} count={cnt}
                onClick={() => setCatFilter(cat)}
              />
            ))
          }
        </div>
      )}

      {/* ── Search + filters ── */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:'1 1 220px', minWidth:180 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:14, pointerEvents:'none', color:T.textLight }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, instructor or category…"
            style={{
              width:'100%', padding:'10px 12px 10px 36px',
              border:`1.5px solid ${T.border}`, borderRadius:10,
              background:'#fff', fontSize:13, color:T.text,
              outline:'none', fontFamily:'inherit', transition:'border-color 0.2s',
              boxSizing:'border-box',
            }}
            onFocus={e => e.target.style.borderColor=T.accentMid}
            onBlur={e => e.target.style.borderColor=T.border}
          />
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {[
            {v:'ALL',      label:'All Types'   },
            {v:'LIVE',     label:'🔴 Live'     },
            {v:'RECORDED', label:'📹 Recorded' },
            {v:'PREMIUM',  label:'👑 Premium'  },
          ].map(f => (
            <FilterBtn key={f.v} label={f.label} selected={filter===f.v} onClick={() => setFilter(f.v)} />
          ))}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:20 }}>
          {[...Array(6)].map((_,i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* ── Empty states ── */}
      {!loading && classes.length===0 && (
        <EmptyState
          icon="🧘" title="No Classes Yet" desc="Add your first yoga class to get started!"
          action={
            <button onClick={() => router.push('/admin/add-class')} style={{ marginTop:16, padding:'10px 24px', background:'linear-gradient(135deg,#4cd389,#2ea065)', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              Add First Class
            </button>
          }
        />
      )}
      {!loading && filtered.length===0 && classes.length>0 && (
        <EmptyState icon="🔍" title="No Matches" desc="Try adjusting your search or filters" />
      )}

      {/* ── Grid ── */}
      {!loading && filtered.length>0 && (
        <>
          <p style={{ fontSize:12, color:T.textLight, marginBottom:14, fontWeight:600 }}>
            Showing {filtered.length} of {classes.length} classes
            {catFilter !== 'ALL' && ` · ${catEmoji[catFilter]} ${catFilter}`}
            {filter !== 'ALL'    && ` · ${filter}`}
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:20 }}>
            {filtered.map(cls => (
              <ClassCard
                key={cls._id || cls.id}
                cls={cls}
                onDelete={handleDelete}
                onVideoReplaced={handleVideoReplaced}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   CLASS CARD
══════════════════════════════════════════════════════ */
function ClassCard({ cls, onDelete, onVideoReplaced }) {
  const [hov,          setHov]          = useState(false);
  const [confirmDel,   setConfirmDel]   = useState(false);
  const [expanded,     setExpanded]     = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [localVideoUrl,setLocalVideoUrl]= useState(cls.videoUrl || '');

  const id     = cls._id || cls.id;
  const isLive = cls.type === 'LIVE';
  const emoji  = catEmoji[cls.category] || '🧘';

  const handleVideoSuccess = ({ url }) => {
    setLocalVideoUrl(url);
    setShowUploader(false);
    onVideoReplaced?.(id, url);
  };

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setConfirmDel(false); }}
      style={{
        background:'#fff', borderRadius:16, overflow:'hidden',
        border:`1px solid ${hov ? '#2ea065' : '#c8e6d4'}`,
        boxShadow: hov ? '0 16px 40px rgba(0,95,43,0.12)' : '0 2px 8px rgba(0,95,43,0.05)',
        transform: hov ? 'translateY(-4px)' : 'none',
        transition:'all 0.25s ease',
      }}
    >
      {/* ── Image ── */}
      <div style={{ position:'relative' }}>
        {cls.image
          ? <img src={cls.image} alt={cls.title} style={{ width:'100%', height:170, objectFit:'cover', display:'block' }} />
          : <div style={{ height:170, background:'linear-gradient(135deg,#005f2b,#4cd389)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48 }}>{emoji}</div>
        }
        {/* Type badge */}
        <div style={{ position:'absolute', top:10, left:10, display:'flex', gap:5 }}>
          <span style={{
            fontSize:10, padding:'3px 10px', borderRadius:50, fontWeight:700,
            background: isLive ? 'rgba(239,68,68,0.9)' : 'rgba(59,130,246,0.9)',
            color:'#fff', backdropFilter:'blur(4px)',
          }}>
            {isLive ? '🔴 Live' : '📹 Recorded'}
          </span>
        </div>
        {/* Premium badge */}
        {cls.isPremium && (
          <div style={{ position:'absolute', top:10, right:10 }}>
            <span style={{ fontSize:10, padding:'3px 10px', borderRadius:50, fontWeight:700, background:'rgba(196,154,54,0.92)', color:'#fff' }}>
              👑 Premium
            </span>
          </div>
        )}
        {/* Category badge */}
        <div style={{ position:'absolute', bottom:10, left:10 }}>
          <span style={{ fontSize:10, padding:'3px 10px', borderRadius:50, fontWeight:700, background:'rgba(0,0,0,.55)', color:'#fff', backdropFilter:'blur(4px)' }}>
            {emoji} {cls.category}
          </span>
        </div>
        {/* Video provider badge */}
        {cls.videoProvider && (
          <div style={{ position:'absolute', bottom:10, right:10 }}>
            <span style={{
              fontSize:9, padding:'2px 8px', borderRadius:50, fontWeight:700,
              background: cls.videoProvider === 'r2' ? 'rgba(245,158,11,0.9)' : 'rgba(76,211,137,0.9)',
              color:'#fff', backdropFilter:'blur(4px)',
            }}>
              {cls.videoProvider === 'r2' ? '☁️ R2' : '🎨 CDN'}
            </span>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ padding:'16px 18px' }}>
        <h3 style={{ fontSize:16, fontWeight:700, color:'#1a1208', marginBottom:6, fontFamily:"'Cormorant Garamond',serif", lineHeight:1.3 }}>
          {cls.title}
        </h3>

        {/* Tags */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
          <span style={{ fontSize:11, padding:'2px 8px', borderRadius:50, background:'rgba(76,211,137,0.10)', color:'#2ea065', fontWeight:600 }}>
            {lvlDisp[cls.level] || cls.level}
          </span>
          <span style={{ fontSize:11, padding:'2px 8px', borderRadius:50, background:'#f5efe0', color:'#6b5a3e', fontWeight:600 }}>
            ⏱ {cls.duration}m
          </span>
          {cls.maxParticipants && (
            <span style={{ fontSize:11, padding:'2px 8px', borderRadius:50, background:'rgba(59,130,246,.08)', color:'#3b82f6', fontWeight:600 }}>
              👥 Max {cls.maxParticipants}
            </span>
          )}
        </div>

        <p style={{ fontSize:12, color:'#9a8a6a', marginBottom:8 }}>
          👤 {cls.instructor}
        </p>

        {/* Scheduled */}
        {cls.scheduledAt && (
          <p style={{ fontSize:11, color:'#2ea065', marginBottom:8, fontWeight:600 }}>
            📅 {new Date(cls.scheduledAt).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' })}
          </p>
        )}

        {/* Meet link */}
        {isLive && cls.googleMeetLink && (
          <div style={{ marginBottom:10 }}>
            <p style={{ fontSize:10, color:'#9a8a6a', marginBottom:3, fontWeight:600, textTransform:'uppercase', letterSpacing:.5 }}>
              Meet Link
            </p>
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <code style={{ fontSize:10, color:'#2ea065', background:'rgba(76,211,137,.06)', border:'1px solid rgba(76,211,137,.15)', borderRadius:6, padding:'3px 8px', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {cls.googleMeetLink}
              </code>
              <a href={cls.googleMeetLink} target="_blank" rel="noopener noreferrer" style={{ fontSize:10, fontWeight:700, color:'#fff', background:'#2ea065', borderRadius:6, padding:'4px 8px', textDecoration:'none', flexShrink:0 }}>
                Open
              </a>
            </div>
          </div>
        )}

        {/* Description */}
        {cls.description && (
          <div style={{ marginBottom:10 }}>
            <p style={{ fontSize:12, color:'#6b5a3e', lineHeight:1.6 }}>
              {expanded ? cls.description : cls.description.slice(0,80) + (cls.description.length > 80 ? '…' : '')}
            </p>
            {cls.description.length > 80 && (
              <button onClick={() => setExpanded(e => !e)} style={{ fontSize:10, color:'#2ea065', background:'none', border:'none', cursor:'pointer', fontWeight:600, padding:0, fontFamily:'inherit' }}>
                {expanded ? 'Show less ▲' : 'Show more ▼'}
              </button>
            )}
          </div>
        )}

        {/* ── Video section (recorded only) ── */}
        {!isLive && (
          <div style={{ marginBottom:10 }}>

            {/* Current video status */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              {localVideoUrl ? (
                <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                  <span style={{ fontSize:10, fontWeight:700, color:'#2ea065', background:'rgba(76,211,137,.08)', border:'1px solid rgba(76,211,137,.2)', borderRadius:50, padding:'2px 10px' }}>
                    ✅ Video attached
                    {cls.videoProvider === '' && ' · ☁️'}
                    {cls.videoProvider === '' && ' · 🎨 '}
                  </span>
                  <a href={localVideoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize:10, color:'#3b82f6', textDecoration:'underline' }}>
                    Preview
                  </a>
                </div>
              ) : (
                <span style={{ fontSize:10, fontWeight:600, color:'#f59e0b', background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.2)', borderRadius:50, padding:'2px 10px' }}>
                  ⚠️ No video yet
                </span>
              )}

              {/* Toggle upload button */}
              <button
                onClick={() => setShowUploader(v => !v)}
                style={{
                  fontSize:10, fontWeight:700, padding:'3px 10px',
                  background: showUploader ? 'rgba(76,211,137,0.15)' : 'rgba(76,211,137,0.06)',
                  border:`1px solid ${showUploader ? T.accentMid : T.border}`,
                  color: showUploader ? T.accentMid : T.textMuted,
                  borderRadius:50, cursor:'pointer', fontFamily:'inherit',
                  transition:'all .2s', flexShrink:0, marginLeft:8,
                }}
              >
                {showUploader ? '▲ Hide' : '☁️ Upload'}
              </button>
            </div>

            {/* R2 Uploader (expandable) */}
            {showUploader && (
              <div style={{
                background:'rgba(76,211,137,0.02)',
                border:`1px solid ${T.border}`,
                borderRadius:10, padding:'12px',
                marginTop:4,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                  <span style={{ fontSize:14 }}>☁️</span>
                  <p style={{ fontSize:11, fontWeight:700, color:T.accentMid, margin:0 }}>
                    Upload 
                  </p>
                  <span style={{ fontSize:10, color:T.textLight, marginLeft:'auto' }}>
                    Max 500 MB · Bypasses Vercel limits
                  </span>
                </div>
                <InlineR2Uploader
                  classId={id}
                  category={cls.category}
                  isPremium={cls.isPremium}
                  currentUrl={localVideoUrl}
                  onSuccess={handleVideoSuccess}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Delete ── */}
        {confirmDel ? (
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={() => onDelete(id)} style={{ flex:1, padding:'9px', background:'rgba(239,68,68,0.12)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.25)', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              Yes, Delete
            </button>
            <button onClick={() => setConfirmDel(false)} style={{ flex:1, padding:'9px', background:'rgba(76,211,137,0.08)', color:'#2ea065', border:'1px solid rgba(76,211,137,0.20)', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDel(true)}
            style={{ width:'100%', background:'rgba(239,68,68,0.06)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.15)', borderRadius:8, padding:'9px', fontSize:12, cursor:'pointer', fontWeight:600, fontFamily:'inherit', transition:'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(239,68,68,0.06)'}
          >
            🗑️ Delete Class
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Helper components ── */
function CatFilterBtn({ label, value, active, count, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:5,
      padding:'7px 14px', borderRadius:50,
      background: active ? 'linear-gradient(135deg,#4cd389,#2ea065)' : '#fff',
      color: active ? '#fff' : '#6b5a3e',
      fontSize:12, fontWeight: active ? 700 : 500,
      cursor:'pointer', fontFamily:'inherit', flexShrink:0,
      border: active ? 'none' : '1px solid #c8e6d4',
      boxShadow: active ? '0 4px 12px rgba(76,211,137,0.25)' : 'none',
      transition:'all 0.2s',
    }}>
      {label}
      <span style={{ fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:50, background: active ? 'rgba(255,255,255,.2)' : 'rgba(76,211,137,.1)', color: active ? '#fff' : '#2ea065' }}>
        {count}
      </span>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div style={{ borderRadius:16, overflow:'hidden', background:'#fff', border:'1px solid #c8e6d4' }}>
      <div style={{ height:170, background:'linear-gradient(90deg,#e8f5ee,#d4ede0,#e8f5ee)', backgroundSize:'200% 100%', animation:'shimmer 1.6s infinite' }} />
      <div style={{ padding:18 }}>
        {[70,50,60].map((w,i) => (
          <div key={i} style={{ height:10, background:'linear-gradient(90deg,#e8f5ee,#d4ede0,#e8f5ee)', backgroundSize:'200% 100%', animation:'shimmer 1.6s infinite', borderRadius:6, marginBottom:10, width:`${w}%` }} />
        ))}
      </div>
    </div>
  );
}

function FilterBtn({ label, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding:'8px 14px', borderRadius:8,
      background: selected ? 'linear-gradient(135deg,#4cd389,#2ea065)' : '#fff',
      color: selected ? '#fff' : '#6b5a3e',
      fontSize:12, fontWeight: selected ? 700 : 500,
      cursor:'pointer', fontFamily:'inherit',
      border: selected ? 'none' : '1px solid #c8e6d4',
      boxShadow: selected ? '0 4px 12px rgba(76,211,137,0.25)' : 'none',
      transition:'all 0.2s',
    }}>
      {label}
    </button>
  );
}

function RefreshBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
      background:'#fff', border:'1.5px solid #c8e6d4',
      color:'#2ea065', padding:'10px 16px', borderRadius:10,
      cursor:'pointer', fontSize:13, fontWeight:600,
      display:'flex', alignItems:'center', gap:6,
      fontFamily:'inherit', transition:'all 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor='#2ea065'}
    onMouseLeave={e => e.currentTarget.style.borderColor='#c8e6d4'}
    >
      🔄 Refresh
    </button>
  );
}

function EmptyState({ icon, title, desc, action }) {
  return (
    <div style={{ background:'#fff', borderRadius:16, padding:'60px 20px', textAlign:'center', border:'1px solid #c8e6d4' }}>
      <div style={{ fontSize:52, marginBottom:16 }}>{icon}</div>
      <h3 style={{ color:'#1a1208', marginBottom:8, fontFamily:"'Cormorant Garamond',serif", fontSize:22 }}>{title}</h3>
      <p style={{ color:'#9a8a6a', fontSize:14 }}>{desc}</p>
      {action}
    </div>
  );
}