// src/app/classes/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import LiveClassJoinButton from '@/components/LiveClassJoinButton';

// Add this temporarily at the TOP of your FreeClassCard and PremiumClassCard
// to see what data is actually coming from the API

function DebugCard({ cls }) {
  return (
    <div style={{
      background: '#fff3cd',
      border: '2px solid #ff0',
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      fontSize: 11,
      fontFamily: 'monospace',
    }}>
      <strong>DEBUG - Class: {cls.title}</strong><br/>
      image: {cls.image || 'MISSING'}<br/>
      thumbnail: {cls.thumbnail || 'MISSING'}<br/>
      videoUrl: {cls.videoUrl || 'MISSING'}<br/>
      type: {cls.type}<br/>
      id: {cls.id}
    </div>
  );
}

const KEYFRAMES = `
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
`;

function useKF() {
  useEffect(() => {
    const id = 'free-classes-kf';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id; el.textContent = KEYFRAMES;
    document.head.appendChild(el);
  }, []);
}

const lvlDisp = {
  BEGINNER:'Beginner', INTERMEDIATE:'Intermediate',
  ADVANCED:'Advanced', ALL_LEVELS:'All Levels',
};

const catEmoji = {
  HATHA:'🌅', VINYASA:'🌊', ASHTANGA:'🔥', POWER:'⚡',
  YIN:'🌙', RESTORATIVE:'🌿', KUNDALINI:'✨', PRENATAL:'🤰',
  KIDS:'🧒', MEDITATION:'🧠', PRANAYAMA:'🌬️',
};

function SkeletonCard() {
  return (
    <div style={{ borderRadius:16, overflow:'hidden', background:'#fff', border:'1px solid #e8f5ee' }}>
      <div style={{ height:200, background:'linear-gradient(90deg,#e8f5ee,#d4ede0,#e8f5ee)', backgroundSize:'200% 100%', animation:'shimmer 1.6s infinite linear' }} />
      <div style={{ padding:18 }}>
        {[55,80,40].map((w,i) => (
          <div key={i} style={{ height:10, borderRadius:6, marginBottom:10, background:'linear-gradient(90deg,#e8f5ee,#d4ede0,#e8f5ee)', backgroundSize:'200% 100%', animation:'shimmer 1.6s infinite linear', width:`${w}%` }} />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   VIDEO MODAL — self-contained, no VideoPlayer import issues
───────────────────────────────────────────────────── */
function VideoModal({ isOpen, onClose, cls }) {
  const [src, setSrc]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (!isOpen || !cls?.id) return;
    setLoading(true); setError(null); setSrc(null); setVideoReady(false);
    axios.get(`/api/video/${cls.id}`)
      .then(r => setSrc(r.data.url))
      .catch(e => setError(e.response?.data?.error || 'Failed'))
      .finally(() => setLoading(false));
  }, [isOpen, cls?.id]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // ★ Direct access to cls.image
  const imageUrl = cls?.image || null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, boxSizing: 'border-box',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 900,
          background: '#111', borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
          display: 'flex', flexDirection: 'column', maxHeight: '95vh',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          gap: 10, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 50,
              background: 'linear-gradient(135deg,#2ea065,#4cd389)',
              color: '#fff', flexShrink: 0,
            }}>🆓 FREE</span>
            <h3 style={{
              fontSize: 14, fontWeight: 700, color: '#fff', margin: 0,
              fontFamily: 'Times New Roman',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{cls?.title}</h3>
          </div>
          <button onClick={onClose} style={{
            flexShrink: 0, width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* ★ VIDEO AREA with 16:9 ratio */}
        <div style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '56.25%',
          background: '#000',
          flexShrink: 0,
        }}>

          {/* ★ THUMBNAIL — shown until video first frame loads */}
          {imageUrl && (
            <img
              src={imageUrl}
              alt={cls?.title || ''}
              style={{
                position: 'absolute',
                top: 0, left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                // Above video (z:3) until ready, then hidden
                zIndex: videoReady ? 0 : 6,
                opacity: videoReady ? 0 : 1,
                transition: 'opacity 0.5s ease',
              }}
            />
          )}

          {/* Loading spinner */}
          {loading && (
            <div style={{
              position: 'absolute', inset: 0,
              zIndex: 8,
              background: imageUrl ? 'rgba(0,0,0,0.55)' : '#111',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                border: '3px solid rgba(255,255,255,0.15)',
                borderTopColor: '#4cd389',
                animation: 'spin 0.8s linear infinite',
              }} />
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, margin: 0 }}>
                Loading video…
              </p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 8,
              background: 'rgba(0,0,0,0.88)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 12, padding: 24, textAlign: 'center',
            }}>
              <div style={{ fontSize: 44 }}>⚠️</div>
              <p style={{ color: '#fff', fontSize: 14, fontWeight: 700, maxWidth: 280, margin: 0 }}>
                {error}
              </p>
            </div>
          )}

          {/* Video element */}
          {src && !loading && (
            <video
              src={src}
              controls
              autoPlay
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              playsInline
              onContextMenu={e => e.preventDefault()}
              onLoadedData={() => setVideoReady(true)}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'contain',
                background: '#000',
                zIndex: 3,
                display: 'block',
              }}
            />
          )}
        </div>

        {/* Meta */}
        <div style={{
          padding: '10px 16px',
          background: 'rgba(255,255,255,0.02)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: 16,
          flexWrap: 'wrap', flexShrink: 0,
        }}>
          {cls?.instructor && (
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
              👤 {cls.instructor}
            </span>
          )}
          {cls?.duration && (
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              ⏱ {cls.duration} min
            </span>
          )}
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' }}>
            Press Esc to close
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   PREMIUM VIDEO MODAL
───────────────────────────────────────────────────── */
function PremiumVideoModal({ isOpen, onClose, cls }) {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoReady, setVideoReady] = useState(false);

  const imageUrl = cls?.image || null;

  useEffect(() => {
    if (!isOpen || !cls?.id) return;
    setLoading(true);
    setError(null);
    setSrc(null);
    setVideoReady(false);

    axios.get(`/api/video/${cls.id}`)
      .then(r => setSrc(r.data.url))
      .catch(e => setError(e.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [isOpen, cls?.id]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isSubError = error && /subscription|subscribe|category|cannot access/i.test(error);
  const isAuthError = error && /login|required/i.test(error);

  return (
    <div
      onClick={onClose}
      style={{
        position:'fixed', inset:0, zIndex:9999,
        background:'rgba(0,0,0,0.92)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:16, boxSizing:'border-box',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:'100%', maxWidth:900,
          background:'#0f0f0f',
          borderRadius:16,
          overflow:'hidden',
          boxShadow:'0 40px 100px rgba(0,0,0,0.9), 0 0 0 1px rgba(196,154,54,0.15)',
          display:'flex', flexDirection:'column',
          maxHeight:'95vh',
        }}
      >
        {/* Header */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'12px 16px',
          background:'rgba(196,154,54,0.06)',
          borderBottom:'1px solid rgba(196,154,54,0.15)',
          flexShrink:0,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
            <span style={{
              fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:50,
              background:'linear-gradient(135deg,#c49a36,#f0c060)', color:'#000',
              flexShrink:0,
            }}>👑 PREMIUM</span>
            <h3 style={{
              fontSize:14, fontWeight:700, color:'#fff', margin:0,
              fontFamily:'Times New Roman',
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            }}>
              {cls?.title}
            </h3>
          </div>
          <button onClick={onClose} style={{
            flexShrink:0, width:34, height:34, borderRadius:'50%',
            background:'rgba(255,255,255,0.07)',
            border:'1px solid rgba(255,255,255,0.13)',
            color:'#fff', fontSize:16, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'inherit',
          }}>✕</button>
        </div>

        {/* Video area */}
        <div style={{
          position:'relative', width:'100%',
          paddingBottom:'56.25%', background:'#000', flexShrink:0,
        }}>

          {/* ★ THUMBNAIL */}
          {imageUrl && (
            <img
              src={imageUrl}
              alt={cls?.title || ''}
              style={{
                position:'absolute', inset:0,
                width:'100%', height:'100%',
                objectFit:'cover',
                zIndex: videoReady ? 0 : 5,
                opacity: videoReady ? 0 : 1,
                transition:'opacity 0.4s ease',
                display:'block',
              }}
            />
          )}

          {/* Loading */}
          {loading && (
            <div style={{
              position:'absolute', inset:0, zIndex:10,
              background: imageUrl ? 'rgba(0,0,0,0.6)' : 'linear-gradient(135deg,#1a1208,#2d1800)',
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', gap:12,
            }}>
              <div style={{
                width:48, height:48, borderRadius:'50%',
                border:'3px solid rgba(255,255,255,0.12)',
                borderTopColor:'#f0c060',
                animation:'spin 0.8s linear infinite',
              }} />
              <p style={{ color:'rgba(255,255,255,0.8)', fontSize:14, margin:0, fontWeight:600 }}>
                🔒 Generating secure link…
              </p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div style={{
              position:'absolute', inset:0, zIndex:10,
              background: imageUrl ? 'rgba(0,0,0,0.85)' : 'linear-gradient(135deg,#1a0f00,#2d1800)',
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', gap:12,
              padding:24, textAlign:'center',
            }}>
              <div style={{ fontSize:44 }}>
                {isSubError ? '👑' : isAuthError ? '🔐' : '⚠️'}
              </div>
              <p style={{ color:'#fff', fontSize:14, fontWeight:700, maxWidth:300, margin:0 }}>
                {error}
              </p>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
                {isSubError && (
                  <a href="/premium" style={{
                    padding:'9px 20px',
                    background:'linear-gradient(135deg,#c49a36,#f0c060)',
                    color:'#000', borderRadius:50, fontSize:13,
                    fontWeight:700, textDecoration:'none',
                  }}>👑 Get Premium</a>
                )}
                {isAuthError && (
                  <a href="/auth" style={{
                    padding:'9px 20px',
                    background:'linear-gradient(135deg,#4cd389,#2ea065)',
                    color:'#fff', borderRadius:50, fontSize:13,
                    fontWeight:700, textDecoration:'none',
                  }}>🔐 Sign In</a>
                )}
              </div>
            </div>
          )}

          {/* Video */}
          {src && !loading && (
            <video
              src={src}
              controls
              autoPlay
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              playsInline
              onContextMenu={e => e.preventDefault()}
              onLoadedData={() => setVideoReady(true)}
              style={{
                position:'absolute', inset:0,
                width:'100%', height:'100%',
                objectFit:'contain', background:'#000',
                zIndex:3, display:'block',
              }}
            />
          )}
        </div>

        {/* Meta bar */}
        <div style={{
          padding:'10px 16px',
          background:'rgba(196,154,54,0.04)',
          borderTop:'1px solid rgba(196,154,54,0.1)',
          display:'flex', alignItems:'center', gap:16,
          flexWrap:'wrap', flexShrink:0,
        }}>
          {cls?.instructor && (
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.7)', fontWeight:600 }}>
              👤 {cls.instructor}
            </span>
          )}
          {cls?.duration && (
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>
              ⏱ {cls.duration} min
            </span>
          )}
          <span style={{ fontSize:10, color:'rgba(196,154,54,0.5)', marginLeft:'auto' }}>
            🔒 Protected Content
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   THUMBNAIL COMPONENT — used in cards
───────────────────────────────────────────────────── */
function CardThumbnail({ imageUrl, title, category, isLive, hasVideo, isClickable, hov }) {
  const emoji = catEmoji[category] || '🧘';
  const [imgError, setImgError] = useState(false);

  return (
    <div style={{ position:'relative', width:'100%' }}>
      {/* Image or gradient fallback */}
      {imageUrl && !imgError ? (
        <img
          src={imageUrl}
          alt={title}
          onError={() => setImgError(true)}
          style={{
            width:'100%',
            height:200,
            objectFit:'cover',
            display:'block',
          }}
        />
      ) : (
        <div style={{
          height:200,
          background:'linear-gradient(135deg,#005f2b,#2ea065)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:54,
        }}>
          {emoji}
        </div>
      )}

      {/* Play button overlay for recorded + has video */}
      {!isLive && hasVideo && (
        <div style={{
          position:'absolute', inset:0,
          background: hov ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.2)',
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'background 0.25s',
        }}>
          <div style={{
            width: hov ? 68 : 58,
            height: hov ? 68 : 58,
            borderRadius:'50%',
            background: hov
              ? 'linear-gradient(135deg,#2ea065,#4cd389)'
              : 'rgba(255,255,255,0.92)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 4px 24px rgba(0,0,0,0.4)',
            transition:'all 0.25s',
          }}>
            <div style={{
              width:0, height:0,
              borderTop:`${hov ? 12 : 10}px solid transparent`,
              borderBottom:`${hov ? 12 : 10}px solid transparent`,
              borderLeft:`${hov ? 20 : 16}px solid ${hov ? '#fff' : '#2ea065'}`,
              marginLeft: hov ? 5 : 4,
              transition:'all 0.25s',
            }} />
          </div>
        </div>
      )}

      {/* LIVE badge */}
      {isLive && (
        <div style={{
          position:'absolute', top:10, left:10,
          background:'rgba(239,68,68,0.92)',
          color:'#fff', fontSize:10, fontWeight:700,
          padding:'3px 10px', borderRadius:50,
          display:'flex', alignItems:'center', gap:5,
          backdropFilter:'blur(4px)',
        }}>
          <span style={{
            width:6, height:6, borderRadius:'50%',
            background:'#fff', display:'inline-block',
            animation:'spin 2s linear infinite',
          }} />
          LIVE
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   FREE CLASS CARD
───────────────────────────────────────────────────── */
function FreeClassCard({ cls, onBook, booking }) {
  const [hov, setHov]           = useState(false);
  const [btnHov, setBtnHov]     = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [imgErr, setImgErr]     = useState(false);

  const isLive     = cls.type === 'LIVE';
  const isRecorded = cls.type === 'RECORDED';
  const hasVideo   = !!cls.videoUrl;
  const emoji      = catEmoji[cls.category] || '🧘';

  // ★ Direct field access — no prop chain, no transformation
  const imageUrl = cls.image && !imgErr ? cls.image : null;

  return (
    <>
      {showModal && (
        <VideoModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          cls={cls}
        />
      )}

      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          borderRadius: 16, overflow: 'hidden', background: '#fff',
          border: `1px solid ${hov ? 'rgba(76,211,137,.4)' : 'rgba(0,0,0,.06)'}`,
          boxShadow: hov ? '0 20px 52px rgba(0,95,43,.12)' : '0 2px 12px rgba(0,0,0,.05)',
          transform: hov ? 'translateY(-5px)' : 'translateY(0)',
          transition: 'all .3s cubic-bezier(.4,0,.2,1)',
          animation: 'fadeUp .5s ease both',
        }}
      >
        {/* ── THUMBNAIL SECTION ── */}
        <div
          style={{ position: 'relative', cursor: isRecorded && hasVideo ? 'pointer' : 'default' }}
          onClick={() => { if (isRecorded && hasVideo) setShowModal(true); }}
        >
          {/* ★ ALWAYS render the img tag if we have a URL */}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={cls.title}
              onError={() => setImgErr(true)}
              style={{
                width: '100%',
                height: 200,
                objectFit: 'cover',
                display: 'block',
                // Force visibility — override any inherited styles
                opacity: 1,
                visibility: 'visible',
                filter: 'none',
              }}
            />
          ) : (
            // Fallback when no image
            <div style={{
              height: 200,
              background: 'linear-gradient(135deg,#005f2b,#2ea065)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 56,
            }}>
              {emoji}
            </div>
          )}

          {/* Play button overlay for recorded videos */}
          {isRecorded && hasVideo && (
            <div style={{
              position: 'absolute', inset: 0,
              background: hov ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.25s',
            }}>
              <div style={{
                width: hov ? 68 : 58,
                height: hov ? 68 : 58,
                borderRadius: '50%',
                background: hov
                  ? 'linear-gradient(135deg,#2ea065,#4cd389)'
                  : 'rgba(255,255,255,0.92)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                transition: 'all 0.25s',
              }}>
                <div style={{
                  width: 0, height: 0,
                  borderTop: `${hov ? 12 : 10}px solid transparent`,
                  borderBottom: `${hov ? 12 : 10}px solid transparent`,
                  borderLeft: `${hov ? 20 : 16}px solid ${hov ? '#fff' : '#2ea065'}`,
                  marginLeft: hov ? 5 : 4,
                  transition: 'all 0.25s',
                }} />
              </div>
            </div>
          )}

          {/* Live badge */}
          {isLive && (
            <div style={{
              position: 'absolute', top: 10, left: 10,
              background: 'rgba(239,68,68,0.92)',
              color: '#fff', fontSize: 10, fontWeight: 700,
              padding: '3px 10px', borderRadius: 50,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#fff', display: 'inline-block',
              }} />
              LIVE
            </div>
          )}
        </div>
        {/* ── END THUMBNAIL ── */}

        <div style={{ padding: '16px 18px 18px' }}>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
            <span style={{
              fontSize: 10, padding: '2px 9px', borderRadius: 50, fontWeight: 700,
              background: 'rgba(34,197,94,.12)', color: '#16a34a',
            }}>🆓 FREE</span>
            <span style={{
              fontSize: 10, padding: '2px 9px', borderRadius: 50, fontWeight: 700,
              background: isLive ? 'rgba(239,68,68,.08)' : 'rgba(59,130,246,.08)',
              color: isLive ? '#ef4444' : '#3b82f6',
            }}>
              {isLive ? '🔴 Live' : '📹 Recorded'}
            </span>
            <span style={{
              fontSize: 10, padding: '2px 9px', borderRadius: 50,
              background: 'rgba(76,211,137,.08)', color: '#2ea065', fontWeight: 600,
            }}>
              {lvlDisp[cls.level] || cls.level}
            </span>
            <span style={{
              fontSize: 10, padding: '2px 9px', borderRadius: 50,
              background: '#f5efe0', color: '#6b5a3e', fontWeight: 600,
            }}>
              ⏱ {cls.duration}m
            </span>
          </div>

          <h3 style={{
            fontSize: 17, fontWeight: 700, color: '#1a1208', marginBottom: 6,
            fontFamily: 'Times New Roman', lineHeight: 1.3,
          }}>
            {cls.title}
          </h3>

          {cls.description && (
            <p style={{ fontSize: 12, color: '#6b5a3e', marginBottom: 7, lineHeight: 1.6 }}>
              {cls.description.length > 82
                ? cls.description.slice(0, 82) + '…'
                : cls.description}
            </p>
          )}

          <p style={{ fontSize: 12, color: '#2ea065', fontWeight: 600, marginBottom: 10 }}>
            👤 {cls.instructor}
          </p>

          {isLive && cls.scheduledAt && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#f0faf4', borderRadius: 8, padding: '5px 12px',
              fontSize: 11, color: '#2d7a4f', marginBottom: 12, fontWeight: 600,
            }}>
              📅 {new Date(cls.scheduledAt).toLocaleString('en-IN', {
                dateStyle: 'medium', timeStyle: 'short',
              })}
            </div>
          )}

          {isLive && (
            <div>
              {cls.googleMeetLink ? (
                <a
                  href={cls.googleMeetLink}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => onBook(cls)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    background: 'linear-gradient(135deg,#005f2b,#2ea065)',
                    color: '#fff', padding: '11px', borderRadius: 10,
                    fontSize: 13, fontWeight: 700, textDecoration: 'none',
                  }}
                >
                  🎥 Join Free Live Class →
                </a>
              ) : (
                <>
                  <LiveClassJoinButton
                    classId={cls.id}
                    scheduledAt={cls.scheduledAt}
                    title={cls.title}
                    size="md"
                  />
                  <button
                    onClick={() => onBook(cls)}
                    disabled={booking === cls.id}
                    style={{
                      width: '100%', padding: '10px', marginTop: 8,
                      background: 'rgba(76,211,137,.08)',
                      color: '#2ea065', border: '1px solid rgba(76,211,137,.25)',
                      borderRadius: 10, fontSize: 12, fontWeight: 600,
                      cursor: booking === cls.id ? 'wait' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {booking === cls.id ? '⏳ Booking…' : '📅 Book Free Class'}
                  </button>
                </>
              )}
            </div>
          )}

          {isRecorded && (
            <div style={{ marginTop: 4 }}>
              {!hasVideo ? (
                <div style={{
                  padding: '11px', background: 'rgba(0,0,0,.03)',
                  borderRadius: 10, textAlign: 'center', fontSize: 12, color: '#9a8a6a',
                }}>
                  🎬 Video coming soon
                </div>
              ) : (
                <button
                  onClick={() => setShowModal(true)}
                  onMouseEnter={() => setBtnHov(true)}
                  onMouseLeave={() => setBtnHov(false)}
                  style={{
                    width: '100%', padding: '11px',
                    background: btnHov
                      ? 'linear-gradient(135deg,#2ea065,#4cd389)'
                      : 'rgba(59,130,246,.07)',
                    color: btnHov ? '#fff' : '#3b82f6',
                    border: btnHov ? 'none' : '1px solid rgba(59,130,246,.22)',
                    borderRadius: 10, fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  }}
                >
                  ▶ Watch Free Class
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function TypeBtn({ label, selected, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding:'8px 18px', borderRadius:10,
        border: selected ? 'none' : '1px solid #c8e6d4',
        background: selected
          ? 'linear-gradient(135deg,#4cd389,#2ea065)'
          : hov ? 'rgba(76,211,137,.08)' : '#fff',
        color: selected ? '#fff' : '#6b5a3e',
        fontSize:12, fontWeight: selected ? 700 : 500,
        cursor:'pointer', transition:'all .22s ease',
        boxShadow: selected ? '0 4px 14px rgba(76,211,137,.28)' : '0 1px 4px rgba(0,0,0,.05)',
        fontFamily:'inherit',
      }}
    >
      {label}
    </button>
  );
}

/* ─────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────── */
export default function FreeClassesPage() {
  useKF();
  const { data: session, status } = useSession();

  const [classType, setClassType] = useState('ALL');
  const [search, setSearch]       = useState('');
  const [classes, setClasses]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [bookingId, setBookingId] = useState(null);
  const [searchFoc, setSearchFoc] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      const params = ['isPremium=false'];
      if (classType !== 'ALL') params.push(`type=${classType}`);
      const r = await axios.get('/api/classes?' + params.join('&'));
      setClasses(r.data || []);
    } catch {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, [classType]);

  useEffect(() => {
    if (status === 'loading') return;
    fetchClasses();
  }, [fetchClasses, status]);

  const handleBook = async (cls) => {
    if (!session) { toast.error('Please sign in to book'); return; }
    setBookingId(cls.id);
    try {
      await axios.post('/api/bookings', {
        classId: cls.id, sessionTitle: cls.title,
        type: cls.type, meetLink: cls.googleMeetLink,
        scheduledAt: cls.scheduledAt,
      });
      toast.success(`✅ Booked: ${cls.title}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Booking failed';
      if (msg.toLowerCase().includes('already booked')) toast.success('Already booked!');
      else toast.error(msg);
    } finally { setBookingId(null); }
  };

  const filtered = classes.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.title?.toLowerCase().includes(q) ||
           c.instructor?.toLowerCase().includes(q) ||
           c.description?.toLowerCase().includes(q);
  });

  if (status === 'loading') {
    return (
      <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🧘</div>
          <p style={{ color:'#9a8a6a' }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* HERO */}
      <div style={{
        background:'linear-gradient(135deg,#005f2b 0%,#2ea065 55%,#4cd389 100%)',
        padding:'clamp(100px,14vw,130px) 0 clamp(48px,6vw,64px)',
        textAlign:'center', position:'relative', overflow:'hidden',
      }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', position:'relative', zIndex:1 }}>
          <span style={{
            display:'inline-block', background:'rgba(255,255,255,.12)',
            border:'1px solid rgba(255,255,255,.18)', color:'#fff',
            borderRadius:50, padding:'5px 20px', fontSize:11, fontWeight:700,
            letterSpacing:2, textTransform:'uppercase', marginBottom:18,
          }}>
            🆓 Free Classes
          </span>
          <h1 style={{
            fontSize:'clamp(30px,6vw,58px)', fontFamily:'Times New Roman',
            color:'#fff', marginBottom:14, fontWeight:700, lineHeight:1.1,
          }}>
            Free <em style={{ fontStyle:'normal', color:'#4cd389' }}>Yoga</em> Classes
          </h1>
          <p style={{
            fontSize:'clamp(14px,1.8vw,17px)', color:'rgba(255,255,255,.82)',
            maxWidth:500, margin:'0 auto 32px', lineHeight:1.75,
          }}>
            Access our free live sessions and recorded classes — no subscription needed!
          </p>

          {/* Search */}
          <div style={{ maxWidth:460, margin:'0 auto 24px', position:'relative' }}>
            <span style={{
              position:'absolute', left:18, top:'50%', transform:'translateY(-50%)',
              fontSize:16, pointerEvents:'none', color:'#9a8a6a',
            }}>🔍</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search free classes…"
              onFocus={() => setSearchFoc(true)}
              onBlur={() => setSearchFoc(false)}
              style={{
                width:'100%', padding:'14px 18px 14px 48px', borderRadius:50,
                border: searchFoc ? '2px solid #4cd389' : '2px solid rgba(255,255,255,.28)',
                background:'rgba(255,255,255,.97)', fontSize:14, color:'#1a1208',
                outline:'none', boxSizing:'border-box', fontFamily:'inherit',
                boxShadow: searchFoc
                  ? '0 0 0 4px rgba(76,211,137,.20)'
                  : '0 4px 20px rgba(0,0,0,.15)',
                transition:'all .25s ease',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{
                position:'absolute', right:16, top:'50%', transform:'translateY(-50%)',
                background:'none', border:'none', color:'#9a8a6a', cursor:'pointer', fontSize:16,
              }}>✕</button>
            )}
          </div>

          <div style={{
            display:'inline-flex', alignItems:'center', gap:10,
            background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.25)',
            borderRadius:50, padding:'10px 22px',
          }}>
            <span style={{ color:'#fff', fontSize:13 }}>Want premium classes?</span>
            <Link href="/premium" style={{
              background:'linear-gradient(135deg,#c49a36,#f0c060)', color:'#000',
              borderRadius:50, padding:'6px 18px', fontSize:12, fontWeight:700,
              textDecoration:'none',
            }}>
              👑 Go Premium →
            </Link>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <section style={{ background:'#faf7f2', padding:'clamp(28px,4vw,44px) 0 clamp(60px,8vw,88px)' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px' }}>

          {!session && (
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              flexWrap:'wrap', gap:12,
              background:'rgba(76,211,137,.05)', border:'1px solid rgba(76,211,137,.18)',
              borderRadius:16, padding:'14px 20px', marginBottom:24,
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:22 }}>🔓</span>
                <p style={{ fontSize:13, color:'#1a1208', margin:0 }}>
                  <strong>Sign in free</strong> to book live classes and track your progress.
                </p>
              </div>
              <Link href="/auth" style={{
                fontSize:12, fontWeight:700, color:'#fff', textDecoration:'none',
                borderRadius:50, padding:'8px 18px',
                background:'linear-gradient(135deg,#005f2b,#2ea065)', flexShrink:0,
              }}>
                Sign In Free →
              </Link>
            </div>
          )}

          {/* Filters */}
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            flexWrap:'wrap', gap:12, marginBottom:28,
          }}>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {[
                {v:'ALL',      label:'All Types'   },
                {v:'LIVE',     label:'🔴 Live'     },
                {v:'RECORDED', label:'📹 Recorded' },
              ].map(t => (
                <TypeBtn
                  key={t.v} label={t.label}
                  selected={classType===t.v}
                  onClick={() => setClassType(t.v)}
                />
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:13, color:'#9a8a6a' }}>
                {loading ? 'Loading…' : `${filtered.length} free class${filtered.length!==1?'es':''}`}
              </span>
              <button onClick={fetchClasses} style={{
                background:'rgba(76,211,137,.08)', border:'1px solid rgba(76,211,137,.20)',
                color:'#2ea065', padding:'6px 14px', borderRadius:8,
                fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:600,
              }}>
                🔄 Refresh
              </button>
            </div>
          </div>

          {loading && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:20 }}>
              {[...Array(6)].map((_,i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && classes.length === 0 && (
            <div style={{
              textAlign:'center', padding:'80px 20px', background:'#fff',
              borderRadius:20, border:'1px solid #c8e6d4',
            }}>
              <div style={{ fontSize:60, marginBottom:16 }}>🧘</div>
              <h3 style={{ color:'#1a1208', marginBottom:10, fontFamily:'Times New Roman', fontSize:26 }}>
                No Free Classes Yet
              </h3>
              <p style={{ color:'#6b5a3e', fontSize:14 }}>
                Free classes are being prepared. Check back soon!
              </p>
            </div>
          )}

          {!loading && classes.length > 0 && filtered.length === 0 && (
            <div style={{
              textAlign:'center', padding:'60px 20px', background:'#fff',
              borderRadius:20, border:'1px solid #c8e6d4',
            }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
              <h3 style={{ color:'#1a1208', marginBottom:8, fontFamily:'Times New Roman', fontSize:24 }}>
                No Classes Match
              </h3>
              <button onClick={() => setSearch('')} style={{
                marginTop:16, padding:'11px 28px',
                background:'linear-gradient(135deg,#4cd389,#2ea065)',
                color:'#fff', border:'none', borderRadius:50,
                fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
              }}>
                Clear Search
              </button>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:22 }}>
              {filtered.map(cls => (
                <FreeClassCard
                  key={cls.id}
                  cls={cls}
                  onBook={handleBook}
                  booking={bookingId}
                />
              ))}
            </div>
          )}

          {!loading && (
            <div style={{
              marginTop:52,
              background:'linear-gradient(135deg,#1a1208,#2c1810)',
              borderRadius:20, padding:'clamp(28px,4vw,44px) 24px',
              textAlign:'center', color:'#fff',
            }}>
              <div style={{ fontSize:44, marginBottom:14 }}>👑</div>
              <h3 style={{
                fontSize:'clamp(20px,4vw,30px)', fontFamily:'Times New Roman',
                marginBottom:10, fontWeight:700,
              }}>
                Unlock Premium Yoga Classes
              </h3>
              <p style={{
                color:'rgba(255,255,255,.7)', fontSize:14,
                maxWidth:420, margin:'0 auto 24px', lineHeight:1.7,
              }}>
                Subscribe to a yoga category and get unlimited access to all premium sessions.
              </p>
              <Link href="/premium" style={{
                display:'inline-flex', alignItems:'center', gap:8,
                background:'linear-gradient(135deg,#c49a36,#f0c060)', color:'#000',
                padding:'13px 30px', borderRadius:50, fontWeight:700,
                fontSize:14, textDecoration:'none',
              }}>
                👑 View Premium Plans →
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}