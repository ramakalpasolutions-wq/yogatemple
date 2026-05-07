// src/components/R2VideoUploader.js
'use client';
import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const T = {
  border: '#c8e6d4', accentMid: '#2ea065', accentLight: '#4cd389',
  accentPale: 'rgba(76,211,137,0.10)', text: '#1a1208',
  textMuted: '#6b5a3e', textLight: '#9a8a6a', red: '#ef4444',
  orange: '#f59e0b',
};

const KF = `
  @keyframes r2spin { to { transform: rotate(360deg); } }
  @keyframes r2bar  { from { width: 0% } to { width: 100% } }
  @keyframes r2fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes r2pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
`;

function useKF() {
  if (typeof window === 'undefined') return;
  const id = 'r2-uploader-kf';
  if (document.getElementById(id)) return;
  const el = document.createElement('style');
  el.id = id; el.textContent = KF;
  document.head.appendChild(el);
}

/**
 * R2VideoUploader
 *
 * Props:
 *   classId    {string}   — required, the class to attach video to
 *   category   {string}   — e.g. "HATHA" (used for R2 folder structure)
 *   isPremium  {boolean}  — for display info
 *   currentUrl {string}   — existing video URL
 *   onSuccess  {fn}       — called with { url, key } after upload
 */
export default function R2VideoUploader({
  classId,
  category = 'general',
  isPremium = false,
  currentUrl,
  onSuccess,
}) {
  useKF();

  const inputRef = useRef(null);

  const [file,        setFile]        = useState(null);
  const [progress,    setProgress]    = useState(0);   // 0-100
  const [stage,       setStage]       = useState('idle'); // idle|presigning|uploading|saving|done|error
  const [dragOver,    setDragOver]    = useState(false);
  const [previewUrl,  setPreviewUrl]  = useState(currentUrl || null);
  const [uploadedKey, setUploadedKey] = useState(null);

  /* ── File validation ── */
  const validate = (f) => {
    const MAX = 500 * 1024 * 1024; // 500 MB
    const TYPES = ['video/mp4','video/webm','video/quicktime','video/x-msvideo','video/x-matroska'];
    if (!TYPES.includes(f.type)) {
      toast.error('Invalid file type. Use MP4, WebM, MOV, AVI or MKV.');
      return false;
    }
    if (f.size > MAX) {
      toast.error(`File too large. Max 500 MB. Your file: ${(f.size/1024/1024).toFixed(0)} MB`);
      return false;
    }
    return true;
  };

  const pickFile = (f) => {
    if (!f || !validate(f)) return;
    setFile(f);
    setStage('idle');
    setProgress(0);
    setPreviewUrl(URL.createObjectURL(f));
  };

  /* ── Drag & Drop ── */
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);

  /* ── Main upload flow ── */
  const handleUpload = async () => {
    if (!file) { toast.error('Select a video file first'); return; }
    if (!classId) { toast.error('Class ID missing'); return; }

    try {
      /* 1. Get presigned PUT URL from our API */
      setStage('presigning');
      setProgress(0);

      const { data: presignData } = await axios.post('/api/upload-r2/presign', {
        fileName:    file.name,
        contentType: file.type,
        fileSize:    file.size,
        category,
        uploadType:  'video',
      });

      const { presignedUrl, key, publicUrl } = presignData;

      /* 2. Upload directly to R2 using presigned URL */
      setStage('uploading');
      setProgress(1);

      await axios.put(presignedUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (evt) => {
          const pct = Math.round((evt.loaded / evt.total) * 100);
          setProgress(pct);
        },
      });

      /* 3. Save videoKey + videoUrl to DB via PATCH */
      setStage('saving');
      setProgress(100);

      const videoUrl = publicUrl || `r2://${key}`; // fallback if no public URL

      await axios.patch(`/api/admin/classes?id=${classId}`, {
        videoUrl,
        videoKey: key,
      });

      /* 4. Done */
      setStage('done');
      setUploadedKey(key);
      setPreviewUrl(publicUrl || previewUrl);
      toast.success('✅ Video uploaded & saved!');
      onSuccess?.({ url: videoUrl, key });

    } catch (err) {
      console.error('R2 upload error:', err);
      setStage('error');
      toast.error(
        err.response?.data?.error ||
        err.message ||
        'Upload failed'
      );
    }
  };

  const reset = () => {
    setFile(null);
    setStage('idle');
    setProgress(0);
    setPreviewUrl(currentUrl || null);
    setUploadedKey(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  /* ── Helpers ── */
  const fmtSize  = (b) => b > 1048576 ? `${(b/1048576).toFixed(1)} MB` : `${(b/1024).toFixed(0)} KB`;
  const fmtStage = {
    idle:       null,
    presigning: { label: 'Getting upload permission…', color: T.accentMid },
    uploading:  { label: `Uploading to R2… ${progress}%`, color: T.accentMid },
    saving:     { label: 'Saving to database…', color: T.accentMid },
    done:       { label: '✅ Upload complete!', color: '#16a34a' },
    error:      { label: '❌ Upload failed — try again', color: T.red },
  }[stage];

  const isBusy = ['presigning','uploading','saving'].includes(stage);

  return (
    <div style={{ fontFamily: 'inherit' }}>

      {/* ── Current video indicator ── */}
      {currentUrl && stage !== 'done' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 10, marginBottom: 12,
          background: 'rgba(76,211,137,0.06)',
          border: `1px solid rgba(76,211,137,0.18)`,
          fontSize: 12,
        }}>
          <span style={{ color: '#16a34a', fontWeight: 700 }}>✅</span>
          <span style={{ color: T.textMuted, flex: 1 }}>
            Current video attached
          </span>
          <a
            href={currentUrl} target="_blank" rel="noopener noreferrer"
            style={{ color: T.accentMid, fontWeight: 700, fontSize: 11, textDecoration: 'none' }}
          >
            Preview ↗
          </a>
        </div>
      )}

      {/* ── Drop zone ── */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !isBusy && inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? T.accentMid : file ? '#16a34a' : T.border}`,
          borderRadius: 14,
          padding: '28px 20px',
          textAlign: 'center',
          cursor: isBusy ? 'not-allowed' : 'pointer',
          background: dragOver
            ? 'rgba(76,211,137,0.07)'
            : file
              ? 'rgba(22,163,74,0.04)'
              : 'rgba(76,211,137,0.02)',
          transition: 'all .22s ease',
          position: 'relative',
          animation: 'r2fadeUp .3s ease',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
          style={{ display: 'none' }}
          onChange={e => pickFile(e.target.files?.[0])}
          disabled={isBusy}
        />

        {/* Icon */}
        <div style={{ fontSize: 40, marginBottom: 10 }}>
          {stage === 'done' ? '✅' : stage === 'error' ? '❌' : file ? '🎬' : '☁️'}
        </div>

        {/* File info or prompt */}
        {file ? (
          <div style={{ animation: 'r2fadeUp .25s ease' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>
              {file.name}
            </p>
            <p style={{ fontSize: 12, color: T.textLight }}>
              {fmtSize(file.size)} · {file.type}
            </p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.textMuted, marginBottom: 4 }}>
              Drag & drop video here, or click to browse
            </p>
            <p style={{ fontSize: 11, color: T.textLight }}>
              MP4, WebM, MOV, AVI, MKV · Max 500 MB
            </p>
          </div>
        )}
      </div>

      {/* ── Progress bar ── */}
      {isBusy && (
        <div style={{ marginTop: 12, animation: 'r2fadeUp .2s ease' }}>
          <div style={{
            height: 6, borderRadius: 3,
            background: 'rgba(76,211,137,0.12)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg,#4cd389,#2ea065)',
              borderRadius: 3,
              transition: 'width .3s ease',
            }} />
          </div>
          <p style={{
            fontSize: 11, color: T.accentMid,
            fontWeight: 600, marginTop: 5, textAlign: 'center',
          }}>
            {stage === 'presigning' && '🔑 Getting secure upload permission…'}
            {stage === 'uploading' && `☁️ Uploading … ${progress}%`}
            {stage === 'saving' && '💾 Saving video URL to database…'}
          </p>
        </div>
      )}

      {/* ── Status message ── */}
      {fmtStage && !isBusy && (
        <p style={{
          fontSize: 12, fontWeight: 600, textAlign: 'center',
          color: fmtStage.color, marginTop: 8,
          animation: 'r2fadeUp .25s ease',
        }}>
          {fmtStage.label}
        </p>
      )}

      {/* ── Info banner ── */}
      {file && stage === 'idle' && (
        <div style={{
          marginTop: 10, padding: '8px 14px',
          background: 'rgba(59,130,246,0.05)',
          border: '1px solid rgba(59,130,246,0.15)',
          borderRadius: 10, fontSize: 11, color: '#3b82f6',
          animation: 'r2fadeUp .25s ease',
        }}>
          ℹ️ Video uploads directly.
          {isPremium
            ? ` This is a 👑 Premium (${category}) video.`
            : ' This is a 🆓 Free video.'}
        </div>
      )}

      {/* ── Action buttons ── */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {/* Upload button */}
        {file && stage !== 'done' && (
          <button
            onClick={handleUpload}
            disabled={isBusy}
            style={{
              flex: 2, padding: '11px',
              background: isBusy
                ? T.border
                : 'linear-gradient(135deg,#4cd389,#2ea065)',
              color: isBusy ? T.textLight : '#fff',
              border: 'none', borderRadius: 10,
              fontSize: 13, fontWeight: 700,
              cursor: isBusy ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'all .2s',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
              boxShadow: isBusy ? 'none' : '0 4px 14px rgba(0,95,43,.18)',
            }}
            onMouseEnter={e => {
              if (!isBusy) e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
            }}
          >
            {isBusy
              ? <><span style={{ animation: 'r2spin 1s linear infinite', display: 'inline-block' }}>⏳</span> {stage === 'presigning' ? 'Preparing…' : stage === 'uploading' ? `Uploading ${progress}%` : 'Saving…'}</>
              : <>☁️ Upload</>
            }
          </button>
        )}

        {/* Reset button */}
        {(file || stage === 'done') && (
          <button
            onClick={reset}
            disabled={isBusy}
            style={{
              flex: 1, padding: '11px',
              background: 'transparent',
              border: `1.5px solid ${T.border}`,
              color: T.textLight, borderRadius: 10,
              fontSize: 12, fontWeight: 600,
              cursor: isBusy ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'all .2s',
            }}
            onMouseEnter={e => {
              if (!isBusy) {
                e.currentTarget.style.borderColor = T.accentMid;
                e.currentTarget.style.color = T.accentMid;
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = T.border;
              e.currentTarget.style.color = T.textLight;
            }}
          >
            {stage === 'done' ? '🔄 Replace' : '✕ Clear'}
          </button>
        )}
      </div>

      {/* ── Done — show key info ── */}
      {stage === 'done' && uploadedKey && (
        <div style={{
          marginTop: 12, padding: '10px 14px',
          background: 'rgba(22,163,74,0.06)',
          border: '1px solid rgba(22,163,74,0.18)',
          borderRadius: 10, animation: 'r2fadeUp .3s ease',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>
            ✅ Saved
          </p>
          <code style={{
            fontSize: 10, color: T.textMuted,
            wordBreak: 'break-all', display: 'block',
          }}>
            {uploadedKey}
          </code>
        </div>
      )}
    </div>
  );
}