'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import VideoPlayer from '@/components/VideoPlayer';

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

// Add at top of src/app/premium-classes/page.js after imports

function PremiumVideoModal({ isOpen, onClose, cls }) {
  const [src, setSrc]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [videoReady, setVideoReady] = useState(false);

  // ★ cls.image is the exact Prisma field name
  const imageUrl = cls?.image || null;

  useEffect(() => {
    if (!isOpen || !cls?.id) return;
    setLoading(true); setError(null); setSrc(null); setVideoReady(false);
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

  const isSubError  = error && /subscription|subscribe|category|cannot access/i.test(error);
  const isAuthError = error && /login|required/i.test(error);

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'rgba(0,0,0,0.92)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:16, boxSizing:'border-box',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width:'100%', maxWidth:900,
        background:'#0f0f0f', borderRadius:16, overflow:'hidden',
        boxShadow:'0 40px 100px rgba(0,0,0,0.9), 0 0 0 1px rgba(196,154,54,0.15)',
        display:'flex', flexDirection:'column', maxHeight:'95vh',
      }}>
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
              background:'linear-gradient(135deg,#c49a36,#f0c060)', color:'#000', flexShrink:0,
            }}>👑 PREMIUM</span>
            <h3 style={{
              fontSize:14, fontWeight:700, color:'#fff', margin:0,
              fontFamily:'Times New Roman',
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            }}>{cls?.title}</h3>
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
          {/* ★ THUMBNAIL — shown until video first frame */}
          {imageUrl && (
            <img
              src={imageUrl}
              alt={cls?.title || ''}
              style={{
                position:'absolute', inset:0,
                width:'100%', height:'100%',
                objectFit:'cover', display:'block',
                zIndex: videoReady ? 0 : 5,
                opacity: videoReady ? 0 : 1,
                transition:'opacity 0.4s ease',
              }}
            />
          )}

          {/* Loading */}
          {loading && (
            <div style={{
              position:'absolute', inset:0, zIndex:10,
              background: imageUrl ? 'rgba(0,0,0,0.65)' : 'linear-gradient(135deg,#1a1208,#2d1800)',
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
              background: imageUrl ? 'rgba(0,0,0,0.88)' : 'linear-gradient(135deg,#1a0f00,#2d1800)',
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center',
              gap:12, padding:24, textAlign:'center',
            }}>
              <div style={{ fontSize:44 }}>{isSubError ? '👑' : isAuthError ? '🔐' : '⚠️'}</div>
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
              controls autoPlay
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

        {/* Meta */}
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
            🔒 Protected · Press Esc to close
          </span>
        </div>
      </div>
    </div>
  );
}

const KEYFRAMES = `
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes personalGlow{0%,100%{box-shadow:0 0 12px rgba(196,154,54,.2)}50%{box-shadow:0 0 28px rgba(196,154,54,.45)}}
`;

function useKF() {
  useEffect(() => {
    const id = 'premium-classes-kf';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id; el.textContent = KEYFRAMES;
    document.head.appendChild(el);
  }, []);
}

const lvlDisp = {
  BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced', ALL_LEVELS: 'All Levels',
};

const catEmoji = {
  HATHA: '🌅', VINYASA: '🌊', ASHTANGA: '🔥', POWER: '⚡',
  YIN: '🌙', RESTORATIVE: '🌿', KUNDALINI: '✨', PRENATAL: '🤰',
  KIDS: '🧒', MEDITATION: '🧠', PRANAYAMA: '🌬️',
};

const CATEGORIES_LIST = [
  { value: 'ALL',         label: 'All Categories'  },
  { value: 'HATHA',       label: '🌅 Hatha'        },
  { value: 'VINYASA',     label: '🌊 Vinyasa'      },
  { value: 'ASHTANGA',    label: '🔥 Ashtanga'     },
  { value: 'POWER',       label: '⚡ Power'        },
  { value: 'YIN',         label: '🌙 Yin'          },
  { value: 'RESTORATIVE', label: '🌿 Restorative'  },
  { value: 'KUNDALINI',   label: '✨ Kundalini'    },
  { value: 'PRENATAL',    label: '🤰 Prenatal'     },
  { value: 'KIDS',        label: '🧒 Kids'         },
  { value: 'MEDITATION',  label: '🧠 Meditation'   },
  { value: 'PRANAYAMA',   label: '🌬️ Pranayama'   },
];

/* ── Time-based access status ── */
function useLiveClassStatus(scheduledAt, duration = 60) {
  const [status, setStatus] = useState('loading');
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!scheduledAt) { setStatus('no_schedule'); return; }

    function compute() {
      const now             = Date.now();
      const start           = new Date(scheduledAt).getTime();
      const end             = start + duration * 60 * 1000;
      const oneHourBefore   = start - 60 * 60 * 1000;
      const threeHoursAfter = end + 3 * 60 * 60 * 1000;

      if (now < oneHourBefore) {
        setStatus('too_early'); setTimeLeft(start - now);
      } else if (now >= oneHourBefore && now < start) {
        setStatus('alert'); setTimeLeft(start - now);
      } else if (now >= start && now < end) {
        setStatus('live'); setTimeLeft(end - now);
      } else if (now >= end && now < threeHoursAfter) {
        setStatus('ended'); setTimeLeft(null);
      } else {
        setStatus('over'); setTimeLeft(null);
      }
    }

    compute();
    const timer = setInterval(compute, 10000);
    return () => clearInterval(timer);
  }, [scheduledAt, duration]);

  return { status, timeLeft };
}

function formatTimeLeft(ms) {
  if (!ms) return '';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function SkeletonCard() {
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', background: '#fff', border: '1px solid #e8f5ee' }}>
      <div style={{ height: 188, background: 'linear-gradient(90deg,#e8f5ee,#d4ede0,#e8f5ee)', backgroundSize: '200% 100%', animation: 'shimmer 1.6s infinite linear' }} />
      <div style={{ padding: 18 }}>
        {[55, 80, 40].map((w, i) => (
          <div key={i} style={{ height: 10, borderRadius: 6, marginBottom: 10, background: 'linear-gradient(90deg,#e8f5ee,#d4ede0,#e8f5ee)', backgroundSize: '200% 100%', animation: 'shimmer 1.6s infinite linear', width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

/* ── Premium Live Join Button ── */
function PremiumLiveJoinButton({ cls, canAccess }) {
  const { status, timeLeft } = useLiveClassStatus(cls.scheduledAt, cls.duration);

  if (!canAccess) {
    return (
      <div style={{ padding: '12px', borderRadius: 10, textAlign: 'center', background: 'rgba(196,154,54,.06)', border: '1px solid rgba(196,154,54,.2)' }}>
        <p style={{ fontSize: 12, color: '#c49a36', fontWeight: 600, margin: 0 }}>
          👑 Subscribe to this category to join
        </p>
      </div>
    );
  }

  if (status === 'loading') return null;

  if (status === 'too_early') {
    return (
      <div style={{ padding: '12px', borderRadius: 10, textAlign: 'center', background: 'rgba(59,130,246,.05)', border: '1px solid rgba(59,130,246,.15)' }}>
        <p style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600, margin: '0 0 4px' }}>
          ⏰ Class starts in {formatTimeLeft(timeLeft)}
        </p>
        <p style={{ fontSize: 11, color: '#9a8a6a', margin: 0 }}>
          Join link available 1 hour before class
        </p>
      </div>
    );
  }

  if (status === 'alert') {
    return (
      <div>
        <div style={{ padding: '8px 12px', borderRadius: 8, marginBottom: 8, background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#d97706', fontWeight: 700, margin: 0, animation: 'pulse 2s infinite' }}>
            🔔 Class starts in {formatTimeLeft(timeLeft)} — Get Ready!
          </p>
        </div>
        {cls.googleMeetLink ? (
          <a href={cls.googleMeetLink} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', padding: '12px', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            🎥 Joining Opens in {formatTimeLeft(timeLeft)}
          </a>
        ) : (
          <div style={{ padding: '11px', background: 'rgba(245,158,11,.08)', borderRadius: 10, textAlign: 'center', fontSize: 12, color: '#d97706', fontWeight: 600 }}>
            🔔 Meet link will appear when class starts
          </div>
        )}
      </div>
    );
  }

  if (status === 'live') {
    if (!cls.googleMeetLink) {
      return (
        <div style={{ padding: '12px', borderRadius: 10, textAlign: 'center', background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)' }}>
          <p style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, margin: 0 }}>🔴 Live now — Meet link not set yet</p>
        </div>
      );
    }
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px', marginBottom: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite', display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>LIVE NOW · Ends in {formatTimeLeft(timeLeft)}</span>
        </div>
        <a href={cls.googleMeetLink} target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', padding: '12px', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(239,68,68,.35)' }}>
          🔴 Join Live Class Now →
        </a>
      </div>
    );
  }

  if (status === 'ended') {
    return (
      <div style={{ padding: '12px', borderRadius: 10, textAlign: 'center', background: 'rgba(107,90,62,.06)', border: '1px solid rgba(107,90,62,.15)' }}>
        <p style={{ fontSize: 12, color: '#9a8a6a', fontWeight: 600, margin: 0 }}>✅ Class ended — Recording may be available soon</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px', borderRadius: 10, textAlign: 'center', background: 'rgba(0,0,0,.03)', border: '1px solid rgba(0,0,0,.06)' }}>
      <p style={{ fontSize: 12, color: '#9a8a6a', margin: 0 }}>🔒 This class has ended</p>
    </div>
  );
}

/* ── Premium Class Card ── */
// Replace PremiumClassCard in src/app/premium-classes/page.js

function PremiumClassCard({ cls, canAccess, isPersonalClass = false }) {
  const [hov, setHov]             = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [btnHov, setBtnHov]       = useState(false);
  const [imgError, setImgError]   = useState(false);

  const isLive     = cls.type === 'LIVE';
  const isRecorded = cls.type === 'RECORDED';
  const emoji      = catEmoji[cls.category] || '🧘';
  const hasVideo   = !!cls.videoUrl;

  // ★ Direct from DB field — no transformation needed
  const imageUrl = cls.image || null;

  return (
    <>
      {/* Modal */}
      {showModal && (
        <PremiumVideoModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          cls={cls}
        />
      )}

      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          borderRadius:16, overflow:'hidden', background:'#fff',
          border: isPersonalClass
            ? '2px solid rgba(196,154,54,.5)'
            : `1px solid ${hov ? 'rgba(196,154,54,.4)' : 'rgba(196,154,54,.15)'}`,
          boxShadow: isPersonalClass
            ? (hov ? '0 20px 52px rgba(196,154,54,.22)' : '0 4px 20px rgba(196,154,54,.15)')
            : (hov ? '0 20px 52px rgba(196,154,54,.12)' : '0 2px 12px rgba(0,0,0,.05)'),
          transform: hov ? 'translateY(-5px)' : 'translateY(0)',
          transition:'all .3s cubic-bezier(.4,0,.2,1)',
          position:'relative', animation:'fadeUp .5s ease both',
        }}
      >
        {isPersonalClass && (
          <div style={{
            position:'absolute', top:0, left:0, right:0, zIndex:3,
            background:'linear-gradient(135deg,#c49a36,#f0c060)',
            padding:'5px 12px', textAlign:'center',
            fontSize:11, fontWeight:700, color:'#000', letterSpacing:.5,
          }}>
            🎯 Personally Scheduled For You
          </div>
        )}

        <div style={{
          position:'absolute',
          top: isPersonalClass ? 34 : 12,
          right:12, zIndex:4,
          background:'linear-gradient(135deg,#c49a36,#f0c060)',
          color:'#000', fontSize:10, fontWeight:700,
          padding:'3px 10px', borderRadius:50,
          boxShadow:'0 2px 8px rgba(196,154,54,.35)',
        }}>
          👑 PREMIUM
        </div>

        {/* ★ Thumbnail area */}
        <div
          onClick={() => { if (isRecorded && hasVideo && canAccess) setShowModal(true); }}
          style={{
            position:'relative',
            marginTop: isPersonalClass ? 28 : 0,
            cursor: isRecorded && hasVideo && canAccess ? 'pointer' : 'default',
          }}
        >
          {/* Image or emoji fallback */}
          {imageUrl && !imgError ? (
            <img
              src={imageUrl}
              alt={cls.title}
              onError={() => setImgError(true)}
              style={{
                width:'100%',
                height: isPersonalClass ? 168 : 188,
                objectFit:'cover',
                display:'block',
              }}
            />
          ) : (
            <div style={{
              height: isPersonalClass ? 168 : 188,
              background:'linear-gradient(135deg,#1a1208,#c49a36)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:54,
            }}>
              {emoji}
            </div>
          )}

          {/* Play overlay */}
          {isRecorded && hasVideo && canAccess && (
            <div style={{
              position:'absolute', inset:0,
              background: hov ? 'rgba(0,0,0,.45)' : 'rgba(0,0,0,.2)',
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'background .25s',
            }}>
              <div style={{
                width: hov ? 68 : 58,
                height: hov ? 68 : 58,
                borderRadius:'50%',
                background: hov
                  ? 'linear-gradient(135deg,#c49a36,#f0c060)'
                  : 'rgba(255,255,255,.92)',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 4px 24px rgba(0,0,0,.4)',
                transition:'all .25s',
              }}>
                <div style={{
                  width:0, height:0,
                  borderTop:`${hov?12:10}px solid transparent`,
                  borderBottom:`${hov?12:10}px solid transparent`,
                  borderLeft:`${hov?20:16}px solid ${hov?'#000':'#c49a36'}`,
                  marginLeft: hov?5:4, transition:'all .25s',
                }} />
              </div>
            </div>
          )}

          {/* Lock overlay */}
          {isRecorded && !canAccess && (
            <div style={{
              position:'absolute', inset:0,
              background:'rgba(0,0,0,.55)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <span style={{ fontSize:36 }}>🔒</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding:'16px 18px 18px' }}>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
            <span style={{
              fontSize:10, padding:'2px 9px', borderRadius:50, fontWeight:700,
              background: isLive ? 'rgba(239,68,68,.08)' : 'rgba(59,130,246,.08)',
              color: isLive ? '#ef4444' : '#3b82f6',
            }}>
              {isLive ? '🔴 Live' : '📹 Recorded'}
            </span>
            <span style={{
              fontSize:10, padding:'2px 9px', borderRadius:50,
              background:'rgba(196,154,54,.1)', color:'#c49a36', fontWeight:600,
            }}>
              {catEmoji[cls.category]} {cls.category}
            </span>
            <span style={{
              fontSize:10, padding:'2px 9px', borderRadius:50,
              background:'rgba(76,211,137,.08)', color:'#2ea065', fontWeight:600,
            }}>
              {lvlDisp[cls.level] || cls.level}
            </span>
            <span style={{
              fontSize:10, padding:'2px 9px', borderRadius:50,
              background:'#f5efe0', color:'#6b5a3e', fontWeight:600,
            }}>
              ⏱ {cls.duration}m
            </span>
          </div>

          <h3 style={{
            fontSize:17, fontWeight:700, color:'#1a1208', marginBottom:6,
            fontFamily:'Times New Roman', lineHeight:1.3,
          }}>
            {cls.title}
          </h3>

          {cls.description && (
            <p style={{ fontSize:12, color:'#6b5a3e', marginBottom:7, lineHeight:1.6 }}>
              {cls.description.length > 82 ? cls.description.slice(0,82)+'…' : cls.description}
            </p>
          )}

          <p style={{ fontSize:12, color:'#2ea065', fontWeight:600, marginBottom:10 }}>
            👤 {cls.instructor}
          </p>

          {isLive && cls.scheduledAt && (
            <div style={{
              display:'inline-flex', alignItems:'center', gap:6,
              background: isPersonalClass ? 'rgba(196,154,54,.08)' : '#f0faf4',
              borderRadius:8, padding:'5px 12px',
              fontSize:11, color: isPersonalClass ? '#c49a36' : '#2d7a4f',
              marginBottom:12, fontWeight:600,
              border: isPersonalClass ? '1px solid rgba(196,154,54,.2)' : 'none',
            }}>
              📅 {new Date(cls.scheduledAt).toLocaleString('en-IN', {
                dateStyle:'medium', timeStyle:'short',
              })}
            </div>
          )}

          {isLive && <PremiumLiveJoinButton cls={cls} canAccess={canAccess} />}

          {isRecorded && (
            <div style={{ marginTop:4 }}>
              {!hasVideo ? (
                <div style={{
                  padding:'11px', background:'rgba(0,0,0,.03)',
                  borderRadius:10, textAlign:'center', fontSize:12, color:'#9a8a6a',
                }}>
                  🎬 Video coming soon
                </div>
              ) : canAccess ? (
                <button
                  onClick={() => setShowModal(true)}
                  onMouseEnter={() => setBtnHov(true)}
                  onMouseLeave={() => setBtnHov(false)}
                  style={{
                    width:'100%', padding:'11px',
                    background: btnHov
                      ? 'linear-gradient(135deg,#c49a36,#f0c060)'
                      : 'rgba(196,154,54,.07)',
                    color: btnHov ? '#000' : '#c49a36',
                    border: btnHov ? 'none' : '1px solid rgba(196,154,54,.22)',
                    borderRadius:10, fontSize:13, fontWeight:700,
                    cursor:'pointer', fontFamily:'inherit', transition:'all .2s',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                  }}
                >
                  ▶ Watch Premium Class
                </button>
              ) : (
                <Link href="/premium" style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                  background:'linear-gradient(135deg,rgba(196,154,54,.12),rgba(196,154,54,.06))',
                  border:'1px solid rgba(196,154,54,.35)',
                  color:'#c49a36', padding:'11px', borderRadius:10,
                  fontSize:13, fontWeight:700, textDecoration:'none',
                }}>
                  👑 Subscribe to {cls.category} to Watch →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════ */
export default function PremiumClassesPage() {
  useKF();
  const { data: session, status } = useSession();

  const [classType, setClassType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFoc, setSearchFoc] = useState(false);

  const [personalClasses, setPersonalClasses] = useState([]);
  const [personalLoading, setPersonalLoading] = useState(true);

  /* ── Subscription info ── */
  const subscription    = session?.user?.subscription ?? null;
  const isActive        = subscription?.isActive === true &&
                          subscription?.endDate &&
                          new Date(subscription.endDate) > new Date();
  const subCategory     = subscription?.category?.toUpperCase() ?? null;
  const planDisplayName = subscription?.planName || subscription?.plan || 'Premium';
  const subCatData      = CATEGORIES_LIST.find(c => c.value === subCategory);

  /* ════════════════════════════════════════════════════
     KEY FIX:
     Fetch ONLY the classes matching the user's category.
     If no subscription → fetch nothing (empty).
     If subscribed → fetch only their category.
  ════════════════════════════════════════════════════ */
  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);

      // ── Not logged in OR no active subscription → show nothing ──
      if (!session?.user?.id || !isActive || !subCategory) {
        setClasses([]);
        setLoading(false);
        return;
      }

      // ── Build params: always filter by user's subscription category ──
      const params = [
        'isPremium=true',
        `category=${subCategory}`,   // ← KEY: only their category
      ];
      if (classType !== 'ALL') params.push(`type=${classType}`);

      const r = await axios.get('/api/classes?' + params.join('&'));
      setClasses(r.data || []);
    } catch {
      toast.error('Failed to load premium classes');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, [classType, isActive, subCategory, session?.user?.id]);

  /* ── Fetch personal classes for this user ── */
  const fetchPersonalClasses = useCallback(async () => {
    if (!session?.user?.id) {
      setPersonalClasses([]);
      setPersonalLoading(false);
      return;
    }
    try {
      setPersonalLoading(true);
      const r = await axios.get('/api/classes?personal=true');
      setPersonalClasses(r.data || []);
    } catch {
      setPersonalClasses([]);
    } finally {
      setPersonalLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (status === 'loading') return;
    fetchClasses();
    fetchPersonalClasses();
  }, [fetchClasses, fetchPersonalClasses, status]);

  /* ── Search filter (client-side) ── */
  const filtered = classes.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.title?.toLowerCase().includes(q) ||
      c.instructor?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
  });

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👑</div>
          <p style={{ color: '#9a8a6a' }}>Loading premium classes…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ════ HERO ════ */}
      <div style={{ background: 'linear-gradient(135deg,#1a1208 0%,#3d2b00 50%,#c49a36 100%)', padding: 'clamp(100px,14vw,130px) 0 clamp(48px,6vw,64px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: '5%', width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: '5%', width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,.03)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          <span style={{ display: 'inline-block', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,215,140,.3)', color: '#f0c060', borderRadius: 50, padding: '5px 20px', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 18 }}>
            {isActive && subCatData ? `${subCatData.label} Premium` : '👑 Premium Classes'}
          </span>

          <h1 style={{ fontSize: 'clamp(30px,6vw,58px)', fontFamily: 'Times New Roman', color: '#fff', marginBottom: 14, fontWeight: 700, lineHeight: 1.1 }}>
            {isActive && subCatData
              ? <><em style={{ fontStyle: 'normal', color: '#f0c060' }}>{subCatData.label}</em> Premium Classes</>
              : <>👑 <em style={{ fontStyle: 'normal', color: '#f0c060' }}>Premium</em> Classes</>
            }
          </h1>

          <p style={{ fontSize: 'clamp(14px,1.8vw,17px)', color: 'rgba(255,255,255,.82)', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.75 }}>
            {isActive && subCatData
              ? `Your ${planDisplayName} gives you full access to all ${subCatData.label} live and recorded premium classes.`
              : 'Exclusive live sessions and recorded classes for subscribed members.'
            }
          </p>

          {/* Search */}
          <div style={{ maxWidth: 460, margin: '0 auto', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none', color: '#9a8a6a' }}>🔍</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder={isActive && subCatData ? `Search ${subCatData.label} classes…` : 'Search premium classes…'}
              onFocus={() => setSearchFoc(true)} onBlur={() => setSearchFoc(false)}
              style={{ width: '100%', padding: '14px 18px 14px 48px', borderRadius: 50, border: searchFoc ? '2px solid #f0c060' : '2px solid rgba(255,255,255,.28)', background: 'rgba(255,255,255,.97)', fontSize: 14, color: '#1a1208', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', boxShadow: searchFoc ? '0 0 0 4px rgba(240,192,96,.20)' : '0 4px 20px rgba(0,0,0,.15)', transition: 'all .25s ease' }}
            />
            {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9a8a6a', cursor: 'pointer', fontSize: 16 }}>✕</button>}
          </div>
        </div>
      </div>

      {/* ════ MAIN ════ */}
      <section style={{ background: '#faf7f2', padding: 'clamp(28px,4vw,44px) 0 clamp(60px,8vw,88px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

          {/* ── Active subscription banner ── */}
          {isActive && subCatData && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, background: 'linear-gradient(135deg,rgba(196,154,54,.10),rgba(196,154,54,.05))', border: '1px solid rgba(196,154,54,.25)', borderRadius: 16, padding: '16px 22px', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: 'rgba(196,154,54,.12)', border: '1.5px solid rgba(196,154,54,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                  {catEmoji[subCategory] || '🧘'}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1208', margin: 0 }}>
                    👑 {planDisplayName} — {subCatData.label}
                  </p>
                  <p style={{ fontSize: 12, color: '#9a8a6a', margin: '3px 0 0' }}>
                    Showing only your <strong>{subCatData.label}</strong> classes (live + recorded).
                    {subscription?.endDate && <> Expires {new Date(subscription.endDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}.</>}
                  </p>
                </div>
              </div>
              <Link href="/premium" style={{ fontSize: 12, fontWeight: 700, color: '#c49a36', textDecoration: 'none', border: '1px solid rgba(196,154,54,.30)', borderRadius: 50, padding: '6px 16px', background: 'rgba(196,154,54,.08)', flexShrink: 0 }}>
                Manage Plan →
              </Link>
            </div>
          )}

          {/* ── Not subscribed notice ── */}
          {!isActive && session && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, background: 'rgba(196,154,54,.05)', border: '1px solid rgba(196,154,54,.2)', borderRadius: 16, padding: '14px 20px', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>👑</span>
                <p style={{ fontSize: 13, color: '#1a1208', margin: 0 }}>Subscribe to unlock premium live & recorded classes.</p>
              </div>
              <Link href="/premium" style={{ fontSize: 12, fontWeight: 700, color: '#000', textDecoration: 'none', borderRadius: 50, padding: '8px 18px', background: 'linear-gradient(135deg,#c49a36,#f0c060)', flexShrink: 0 }}>
                👑 Get Premium →
              </Link>
            </div>
          )}

          {/* ── Guest notice ── */}
          {!session && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, background: 'rgba(196,154,54,.05)', border: '1px solid rgba(196,154,54,.2)', borderRadius: 16, padding: '14px 20px', marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: '#1a1208', margin: 0 }}>👑 Sign in and subscribe to access premium classes</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <Link href="/auth" style={{ fontSize: 12, fontWeight: 700, color: '#2ea065', textDecoration: 'none', border: '1px solid rgba(76,211,137,.3)', borderRadius: 50, padding: '6px 16px', background: 'rgba(76,211,137,.08)' }}>Sign In</Link>
                <Link href="/premium" style={{ fontSize: 12, fontWeight: 700, color: '#000', textDecoration: 'none', borderRadius: 50, padding: '6px 16px', background: 'linear-gradient(135deg,#c49a36,#f0c060)' }}>👑 Subscribe</Link>
              </div>
            </div>
          )}

          {/* ════ PERSONAL CLASSES ════ */}
          {session && (personalLoading || personalClasses.length > 0) && (
            <div style={{ marginBottom: 44 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, padding: '16px 20px', borderRadius: 14, background: 'linear-gradient(135deg,rgba(196,154,54,.12),rgba(196,154,54,.06))', border: '1.5px solid rgba(196,154,54,.3)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#c49a36,#f0c060)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🎯</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#1a1208', margin: '0 0 3px' }}>Personally Scheduled For You</p>
                  <p style={{ fontSize: 12, color: '#9a8a6a', margin: 0 }}>Classes your instructor created specifically based on your preferred time and category</p>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#c49a36', background: 'rgba(196,154,54,.1)', padding: '4px 14px', borderRadius: 50, flexShrink: 0 }}>
                  {personalLoading ? '…' : personalClasses.length} class{personalClasses.length !== 1 ? 'es' : ''}
                </span>
              </div>

              {personalLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
                  {[...Array(2)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : personalClasses.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 22 }}>
                  {personalClasses.map(cls => (
                    <PremiumClassCard key={cls.id} cls={cls} canAccess={true} isPersonalClass={true} />
                  ))}
                </div>
              ) : null}

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '36px 0 0' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(196,154,54,.2)' }} />
                <span style={{ fontSize: 12, color: '#c49a36', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  👑 {isActive && subCatData ? `${subCatData.label} Premium Classes` : 'All Premium Classes'}
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(196,154,54,.2)' }} />
              </div>
            </div>
          )}

          {/* ── Type filters + count ── */}
          {isActive && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[{ v: 'ALL', label: 'All Types' }, { v: 'LIVE', label: '🔴 Live' }, { v: 'RECORDED', label: '📹 Recorded' }].map(t => (
                  <button key={t.v} onClick={() => setClassType(t.v)} style={{ padding: '8px 18px', borderRadius: 10, border: classType === t.v ? 'none' : '1px solid rgba(196,154,54,.25)', background: classType === t.v ? 'linear-gradient(135deg,#c49a36,#f0c060)' : '#fff', color: classType === t.v ? '#000' : '#6b5a3e', fontSize: 12, fontWeight: classType === t.v ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: '#9a8a6a' }}>
                  {loading ? 'Loading…' : `${filtered.length} ${subCatData?.label || ''} class${filtered.length !== 1 ? 'es' : ''}`}
                </span>
                <button
                  onClick={() => { fetchClasses(); fetchPersonalClasses(); }}
                  style={{ background: 'rgba(196,154,54,.08)', border: '1px solid rgba(196,154,54,.2)', color: '#c49a36', padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                  🔄 Refresh
                </button>
              </div>
            </div>
          )}

          {/* ── Loading ── */}
          {loading && isActive && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* ── No subscription — only show CTA, no classes ── */}
          {!loading && !isActive && session && (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: 20, border: '1px solid rgba(196,154,54,.2)' }}>
              <div style={{ fontSize: 60, marginBottom: 16 }}>👑</div>
              <h3 style={{ color: '#1a1208', marginBottom: 10, fontFamily: 'Times New Roman', fontSize: 26 }}>
                Subscribe to Access Premium Classes
              </h3>
              <p style={{ color: '#6b5a3e', fontSize: 14, maxWidth: 380, margin: '0 auto 24px', lineHeight: 1.7 }}>
                Choose your yoga style and get unlimited access to all premium live and recorded sessions in that category.
              </p>
              <Link href="/premium" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#c49a36,#f0c060)', color: '#000', padding: '13px 30px', borderRadius: 50, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                👑 View Premium Plans →
              </Link>
            </div>
          )}

          {/* ── Subscribed but no classes in their category yet ── */}
          {!loading && isActive && classes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: 20, border: '1px solid rgba(196,154,54,.2)' }}>
              <div style={{ fontSize: 60, marginBottom: 16 }}>{catEmoji[subCategory] || '👑'}</div>
              <h3 style={{ color: '#1a1208', marginBottom: 10, fontFamily: 'Times New Roman', fontSize: 26 }}>
                No {subCatData?.label} Classes Yet
              </h3>
              <p style={{ color: '#6b5a3e', fontSize: 14, maxWidth: 380, margin: '0 auto' }}>
                New {subCatData?.label} classes are being prepared. Check back soon!
              </p>
            </div>
          )}

          {/* ── No search results ── */}
          {!loading && isActive && classes.length > 0 && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 20, border: '1px solid rgba(196,154,54,.2)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <h3 style={{ color: '#1a1208', marginBottom: 8, fontFamily: 'Times New Roman', fontSize: 24 }}>No Classes Match</h3>
              <button onClick={() => setSearch('')} style={{ marginTop: 16, padding: '11px 28px', background: 'linear-gradient(135deg,#c49a36,#f0c060)', color: '#000', border: 'none', borderRadius: 50, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Clear Search
              </button>
            </div>
          )}

          {/* ── Class grid — only user's subscribed category ── */}
          {!loading && isActive && filtered.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 22 }}>
              {filtered.map(cls => (
                <PremiumClassCard
                  key={cls.id}
                  cls={cls}
                  canAccess={true}  // always true — they're already filtered to their category
                  isPersonalClass={false}
                />
              ))}
            </div>
          )}

          {/* ── Guest CTA ── */}
          {!session && (
            <div style={{ marginTop: 52, background: 'linear-gradient(135deg,#005f2b,#2ea065)', borderRadius: 20, padding: 'clamp(28px,4vw,44px) 24px', textAlign: 'center', color: '#fff' }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>🧘</div>
              <h3 style={{ fontSize: 'clamp(20px,4vw,30px)', fontFamily: 'Times New Roman', marginBottom: 10, fontWeight: 700 }}>
                Ready to Start Your Premium Yoga Journey?
              </h3>
              <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 14, maxWidth: 420, margin: '0 auto 24px', lineHeight: 1.7 }}>
                Sign up free, then subscribe to your preferred yoga category for full access.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/auth" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#005f2b', padding: '13px 30px', borderRadius: 50, fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 6px 20px rgba(0,0,0,.15)' }}>
                  Join Free →
                </Link>
                <Link href="/premium" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#c49a36,#f0c060)', color: '#000', padding: '13px 30px', borderRadius: 50, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                  👑 View Plans
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}