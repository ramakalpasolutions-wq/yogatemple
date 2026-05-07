// src/app/admin/videos/page.js
'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const T = {
  bgCard: '#ffffff', border: '#c8e6d4', borderHov: '#2ea065',
  accentMid: '#2ea065', accentLight: '#4cd389', accentPale: 'rgba(76,211,137,0.10)',
  text: '#1a1208', textMuted: '#6b5a3e', textLight: '#9a8a6a',
};

export default function VideosPage() {
  const [classes,        setClasses]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [uploadState,    setUploadState]    = useState({}); // { [classId]: { progress, status, error } }

  const loadClasses = async () => {
    try {
      setLoading(true);
      const r = await axios.get('/api/admin/classes');
      setClasses(r.data.filter(c =>
        c.type === 'RECORDED' || c.type === 'recorded'
      ));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClasses(); }, []);

  const setUpload = (classId, patch) =>
    setUploadState(prev => ({
      ...prev,
      [classId]: { ...prev[classId], ...patch },
    }));

  const handleVideoUpload = async (classId, category, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset input so same file can be re-selected
    e.target.value = '';

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file (MP4, WebM, MOV, etc.)');
      return;
    }

    const MAX_SIZE = 500 * 1024 * 1024; // 500 MB
    if (file.size > MAX_SIZE) {
      toast.error(`File too large. Maximum 500 MB. Your file: ${(file.size / 1024 / 1024).toFixed(0)} MB`);
      return;
    }

    setUpload(classId, { progress: 0, status: 'presigning', error: null });

    try {
      // ── Step 1: Get presigned PUT URL ──────────────────────────────
      const presignRes = await axios.post('/api/upload-r2/presign', {
        fileName:    file.name,
        contentType: file.type,
        fileSize:    file.size,
        category:    category || 'general',
      });

      const { presignedUrl, key, publicUrl } = presignRes.data;

      if (!presignedUrl || !key) {
        throw new Error('Failed to get upload URL from server');
      }

      setUpload(classId, { status: 'uploading', progress: 0 });

      // ── Step 2: Upload directly to R2 via presigned URL ───────────
      await axios.put(presignedUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (evt) => {
          const pct = evt.total
            ? Math.round((evt.loaded * 100) / evt.total)
            : 0;
          setUpload(classId, { progress: pct });
        },
        // Don't send cookies/auth to R2
        withCredentials: false,
      });

      setUpload(classId, { status: 'saving', progress: 100 });

      // ── Step 3: Save videoKey (and publicUrl) to the class ────────
      await axios.patch(`/api/admin/classes?id=${classId}`, {
        videoKey: key,
        videoUrl: publicUrl || null,
      });

      setUpload(classId, { status: 'done', progress: 100 });
      toast.success('✅ Video uploaded successfully!');
      await loadClasses();

    } catch (err) {
      console.error('Upload error:', err);

      let msg = 'Upload failed';
      if (err.response?.status === 403) {
        msg = 'Admin authentication required. Please re-login.';
      } else if (err.response?.status === 413) {
        msg = err.response.data?.error || 'File too large';
      } else if (err.response?.status === 400) {
        msg = err.response.data?.error || 'Invalid file type';
      } else if (err.code === 'ERR_NETWORK') {
        msg = 'Network error. Check your connection and R2 CORS settings.';
      } else if (err.response?.data?.error) {
        msg = err.response.data.error;
      } else if (err.message) {
        msg = err.message;
      }

      setUpload(classId, { status: 'error', error: msg });
      toast.error(msg);
    } finally {
      // Clear status after 4 seconds
      setTimeout(() => {
        setUploadState(prev => {
          const next = { ...prev };
          delete next[classId];
          return next;
        });
      }, 4000);
    }
  };

  const getStatusLabel = (state) => {
    if (!state) return null;
    switch (state.status) {
      case 'presigning': return '🔑 Preparing…';
      case 'uploading':  return `⬆️ ${state.progress}%`;
      case 'saving':     return '💾 Saving…';
      case 'done':       return '✅ Done!';
      case 'error':      return `❌ ${state.error}`;
      default:           return null;
    }
  };

  return (
    <div>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 24,
        flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h2 style={{
            fontSize: 22, fontWeight: 700, color: T.text,
            fontFamily: "'Cormorant Garamond',serif", marginBottom: 4,
          }}>
            Video Management
          </h2>
          <p style={{ fontSize: 13, color: T.textLight }}>
            {classes.length} recorded classes ·{' '}
            {classes.filter(c => c.videoUrl || c.videoKey).length} have videos
          </p>
        </div>

        <button
          onClick={() => { loadClasses(); toast.success('Refreshed!'); }}
          style={{
            background: '#fff', border: `1.5px solid ${T.border}`,
            color: T.accentMid, padding: '10px 18px', borderRadius: 10,
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* ── Info Banner ── */}
      <div style={{
        background: 'rgba(76,211,137,0.06)',
        border: '1px solid rgba(76,211,137,0.20)',
        borderRadius: 12, padding: '12px 18px', marginBottom: 24,
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 20 }}>💡</span>
        <div>
          <p style={{ fontSize: 13, color: T.textMuted, margin: 0, marginBottom: 4 }}>
            Videos upload (max 500 MB).
            Only <strong>Recorded</strong> classes appear here.
          </p>
          <p style={{ fontSize: 12, color: T.textLight, margin: 0 }}>
            Supported formats: MP4, WebM, MOV, AVI, MKV
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
          <p style={{ color: T.textLight }}>Loading classes…</p>
        </div>
      ) : classes.length === 0 ? (
        <div style={{
          background: '#fff', borderRadius: 16, padding: '60px 20px',
          textAlign: 'center', border: `1px solid ${T.border}`,
        }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎬</div>
          <h3 style={{
            color: T.text, fontFamily: "'Cormorant Garamond',serif",
            fontSize: 22, marginBottom: 8,
          }}>
            No Recorded Classes
          </h3>
          <p style={{ color: T.textLight, fontSize: 14 }}>
            Add a <strong>Recorded</strong> type class first, then upload its video here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {classes.map(cls => {
            const classId  = cls._id || cls.id;
            const hasVideo = !!(cls.videoUrl || cls.videoKey);
            const state    = uploadState[classId];
            const isActive = state && state.status !== 'done' && state.status !== 'error';

            return (
              <div
                key={classId}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: '18px 22px',
                  border: `1px solid ${hasVideo ? 'rgba(76,211,137,0.30)' : T.border}`,
                  boxShadow: hasVideo
                    ? '0 4px 16px rgba(0,95,43,0.07)'
                    : '0 2px 8px rgba(0,95,43,0.04)',
                  display: 'flex', alignItems: 'center',
                  gap: 18, flexWrap: 'wrap', transition: 'all 0.2s',
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  width: 96, height: 64, borderRadius: 10, overflow: 'hidden',
                  background: 'linear-gradient(135deg,rgba(76,211,137,0.12),rgba(0,95,43,0.08))',
                  flexShrink: 0, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', border: `1px solid ${T.border}`,
                }}>
                  {cls.image || cls.thumbnail ? (
                    <img
                      src={cls.image || cls.thumbnail}
                      alt={cls.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: 26 }}>🧘</span>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 180 }}>
                  <h3 style={{
                    fontSize: 15, fontWeight: 700, color: T.text,
                    marginBottom: 4, fontFamily: "'Cormorant Garamond',serif",
                  }}>
                    {cls.title}
                  </h3>
                  <p style={{ fontSize: 12, color: T.textLight, marginBottom: 6 }}>
                    {cls.category} · {cls.level} · {cls.duration}m
                    {cls.isPremium && (
                      <span style={{
                        marginLeft: 8, fontSize: 10, fontWeight: 700,
                        color: '#d97706', background: 'rgba(217,119,6,0.08)',
                        padding: '1px 8px', borderRadius: 50,
                      }}>
                        ⭐ Premium
                      </span>
                    )}
                  </p>

                  {/* Status badge */}
                  {hasVideo ? (
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: T.accentMid,
                      background: 'rgba(76,211,137,0.10)', padding: '2px 10px',
                      borderRadius: 50, display: 'inline-block',
                    }}>
                      ✅ Video attached
                    </span>
                  ) : (
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: '#f59e0b',
                      background: 'rgba(245,158,11,0.08)', padding: '2px 10px',
                      borderRadius: 50, display: 'inline-block',
                    }}>
                      ⚠️ No video yet
                    </span>
                  )}

                  {/* Upload progress bar */}
                  {isActive && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        marginBottom: 4,
                      }}>
                        <span style={{ fontSize: 11, color: T.accentMid, fontWeight: 600 }}>
                          {getStatusLabel(state)}
                        </span>
                        {state.status === 'uploading' && (
                          <span style={{ fontSize: 11, color: T.textLight }}>
                            {state.progress}%
                          </span>
                        )}
                      </div>
                      <div style={{
                        height: 4, background: T.border,
                        borderRadius: 2, overflow: 'hidden', width: '100%', maxWidth: 240,
                      }}>
                        <div style={{
                          height: '100%',
                          width: state.status === 'uploading'
                            ? `${state.progress}%`
                            : state.status === 'saving' ? '100%' : '0%',
                          background: 'linear-gradient(90deg,#4cd389,#2ea065)',
                          borderRadius: 2,
                          transition: 'width 0.3s ease',
                        }} />
                      </div>
                    </div>
                  )}

                  {/* Error message */}
                  {state?.status === 'error' && (
                    <p style={{
                      fontSize: 11, color: '#ef4444', marginTop: 6,
                      maxWidth: 280,
                    }}>
                      ❌ {state.error}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex', gap: 8,
                  alignItems: 'center', flexWrap: 'wrap',
                }}>
                  {hasVideo && cls.videoUrl && (
                    <a
                      href={cls.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: 'rgba(76,211,137,0.10)', color: T.accentMid,
                        border: '1px solid rgba(76,211,137,0.25)',
                        borderRadius: 8, padding: '8px 14px',
                        fontSize: 12, fontWeight: 600, textDecoration: 'none',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}
                    >
                      ▶️ Preview
                    </a>
                  )}

                  {!isActive && (
                    <button
                      onClick={() =>
                        document.getElementById(`vid-${classId}`)?.click()
                      }
                      style={{
                        background: hasVideo
                          ? '#fff'
                          : 'linear-gradient(135deg,#4cd389,#2ea065)',
                        color: hasVideo ? T.accentMid : '#fff',
                        border: hasVideo ? `1.5px solid ${T.border}` : 'none',
                        borderRadius: 8, padding: '8px 16px',
                        fontSize: 12, cursor: 'pointer', fontWeight: 700,
                        fontFamily: 'inherit', transition: 'all 0.2s',
                        boxShadow: hasVideo
                          ? 'none'
                          : '0 4px 12px rgba(76,211,137,0.25)',
                      }}
                    >
                      {hasVideo ? '🔄 Replace Video' : '⬆️ Upload Video'}
                    </button>
                  )}

                  <input
                    id={`vid-${classId}`}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
                    onChange={(e) =>
                      handleVideoUpload(classId, cls.category, e)
                    }
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}