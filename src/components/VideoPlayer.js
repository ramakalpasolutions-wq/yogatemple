// src/components/VideoPlayer.js
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

export default function VideoPlayer({
  classId,
  isPremium = false,
  videoUrl,
  title = '',
  thumbnail,
  category,
  onClose,
  autoplay = false,
}) {
  const videoRef     = useRef(null);
  const containerRef = useRef(null);

  const [src,               setSrc]               = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState(null);
  const [expired,           setExpired]           = useState(false);
  const [isPlaying,         setIsPlaying]         = useState(false);
  const [videoReady,        setVideoReady]        = useState(false); // ← NEW: first frame loaded
  const [isFullscreen,      setIsFullscreen]      = useState(false);
  const [screenshotBlocked, setScreenshotBlocked] = useState(false);
  const [isMobile,          setIsMobile]          = useState(false);
  const [thumbError,        setThumbError]        = useState(false);

  // Normalize thumbnail — handles undefined/null/empty string
  const thumbSrc = (thumbnail && typeof thumbnail === 'string' && thumbnail.trim() && !thumbError)
    ? thumbnail.trim()
    : null;

  // ── Detect mobile ──
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Inject CSS once ──
  useEffect(() => {
    const id = 'vp-styles-v4';
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = `
      @keyframes vp-spin { to { transform: rotate(360deg); } }
      @keyframes vp-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      video::-webkit-media-controls-picture-in-picture-button { display: none !important; }
      @media print { .vp-wrap { display: none !important; } }
      .vp-wrap video { display: block; }
      .vp-secure {
        -webkit-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
    `;
    document.head.appendChild(s);
  }, []);

  // ── Load source ──
  useEffect(() => {
    let cancelled = false;
    setVideoReady(false); // reset when src changes

    const load = async () => {
      setLoading(true);
      setError(null);
      setExpired(false);
      setSrc(null);

      try {
        if (isPremium && classId) {
          const { data } = await axios.get(`/api/video/${classId}`);
          if (!cancelled) {
            setSrc(data.url);
            if (data.type === 'presigned' && data.expiresIn) {
              const ms = Math.max((data.expiresIn - 600) * 1000, 60_000);
              setTimeout(() => { if (!cancelled) setExpired(true); }, ms);
            }
          }
        } else if (videoUrl) {
          if (!cancelled) setSrc(videoUrl);
        } else if (classId) {
          try {
            const { data } = await axios.get(`/api/video/${classId}`);
            if (!cancelled) setSrc(data.url);
          } catch {
            if (!cancelled) setSrc(null);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || 'Failed to load video');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [classId, isPremium, videoUrl]);

  // ── Autoplay ──
  useEffect(() => {
    if (!src || !autoplay || !videoRef.current) return;
    const t = setTimeout(() => {
      videoRef.current?.play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [src, autoplay]);

  // ── Security ──
  useEffect(() => {
    if (!src) return;
    const container = containerRef.current;
    const video     = videoRef.current;
    if (!container) return;

    const triggerProtection = () => {
      setScreenshotBlocked(true);
      container.classList.add('capture-detected');
      if (video && !video.paused) { video.pause(); setIsPlaying(false); }
      setTimeout(() => {
        setScreenshotBlocked(false);
        container.classList.remove('capture-detected');
      }, 3000);
    };

    const blockCtx  = (e) => { e.preventDefault(); e.stopPropagation(); };
    const blockKeys = (e) => {
      const bad =
        e.key === 'PrintScreen' ||
        (e.metaKey && e.shiftKey && ['3','4','5'].includes(e.key)) ||
        (e.ctrlKey && ['p','P'].includes(e.key)) ||
        (e.ctrlKey && e.shiftKey && ['S','I'].includes(e.key));
      if (bad) { e.preventDefault(); e.stopPropagation(); triggerProtection(); }
    };
    const onKeyUp       = (e) => { if (e.key === 'PrintScreen') triggerProtection(); };
    const detectDevTools = () => {
      if (window.outerWidth  - window.innerWidth  > 160 ||
          window.outerHeight - window.innerHeight > 160) triggerProtection();
    };

    container.addEventListener('contextmenu', blockCtx);
    document.addEventListener('keydown', blockKeys, true);
    document.addEventListener('keyup',   onKeyUp,   true);

    if (video) {
      video.disablePictureInPicture = true;
      video.addEventListener('enterpictureinpicture', () => {
        document.exitPictureInPicture?.().catch(() => {});
      });
    }

    const devInterval = setInterval(detectDevTools, 2000);
    return () => {
      container.removeEventListener('contextmenu', blockCtx);
      document.removeEventListener('keydown', blockKeys, true);
      document.removeEventListener('keyup',   onKeyUp,   true);
      clearInterval(devInterval);
    };
  }, [src]);

  // ── Fullscreen ──
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange',       onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange',       onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else (el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.());
  }, []);

  const handleRefresh = useCallback(async () => {
    setSrc(null);
    setExpired(false);
    setLoading(true);
    setError(null);
    setVideoReady(false);
    try {
      if (isPremium && classId) {
        const { data } = await axios.get(`/api/video/${classId}`);
        setSrc(data.url);
      } else {
        setSrc(videoUrl ?? null);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Refresh failed');
    } finally {
      setLoading(false);
    }
  }, [classId, isPremium, videoUrl]);

  // ─────────────────────────────────────────────
  // SHARED LAYOUT HELPERS
  // ─────────────────────────────────────────────

  // 16:9 wrapper — paddingBottom trick gives real height
  const aspectBox = {
    position:      'relative',
    width:         '100%',
    paddingBottom: '56.25%',
    background:    '#000',
    overflow:      'hidden',
  };

  // Any child that fills the aspect box
  const fillBox = {
    position: 'absolute',
    top:      0,
    left:     0,
    width:    '100%',
    height:   '100%',
  };

  // ─────────────────────────────────────────────
  // THUMBNAIL COMPONENT
  // The thumbnail sits in FRONT of the video (higher z-index)
  // and fades out only after the video signals it has a frame
  // ready to display (onLoadedData). This is the ONLY reliable
  // way to prevent the black-flash between src-set and play.
  // ─────────────────────────────────────────────
  const ThumbnailOverlay = ({ zIndex = 10, opacity = 1, blur = false }) => {
    if (!thumbSrc) return null;
    return (
      <img
        src={thumbSrc}
        alt={title || 'Class thumbnail'}
        onError={() => setThumbError(true)}
        style={{
          ...fillBox,
          objectFit:     'cover',
          objectPosition:'center',
          zIndex,
          opacity,
          filter:        blur ? 'blur(10px) brightness(0.3)' : 'none',
          transition:    'opacity 0.35s ease',
          pointerEvents: 'none',
          display:       'block',
        }}
      />
    );
  };

  // ─────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="vp-wrap" style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }}>
        <div style={aspectBox}>

          {/* Show thumbnail clearly in background while loading */}
          {thumbSrc ? (
            <img
              src={thumbSrc}
              alt=""
              onError={() => setThumbError(true)}
              style={{
                ...fillBox,
                objectFit: 'cover',
                zIndex:    1,
                opacity:   1,
              }}
            />
          ) : null}

          {/* Dark overlay on top of thumbnail */}
          <div style={{
            ...fillBox,
            zIndex:     2,
            background: thumbSrc
              ? 'rgba(0,0,0,0.55)'
              : 'linear-gradient(135deg,#0d0d0d,#1a1a2e)',
          }} />

          {/* Spinner + text on top */}
          <div style={{
            ...fillBox,
            zIndex:         3,
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            14,
          }}>
            <div style={{
              width:           52,
              height:          52,
              borderRadius:    '50%',
              border:          '3px solid rgba(255,255,255,0.12)',
              borderTopColor:  isPremium ? '#f0c060' : '#4cd389',
              animation:       'vp-spin 0.75s linear infinite',
            }} />
            <p style={{
              color:      'rgba(255,255,255,0.85)',
              fontSize:   isMobile ? 12 : 14,
              fontWeight: 600,
              margin:     0,
              textAlign:  'center',
              padding:    '0 16px',
            }}>
              {isPremium ? '🔒 Generating secure link…' : 'Loading video…'}
            </p>
            {thumbSrc && (
              <p style={{
                color:    'rgba(255,255,255,0.4)',
                fontSize: 11,
                margin:   0,
              }}>
                {title}
              </p>
            )}
          </div>

        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // ERROR STATE
  // ─────────────────────────────────────────────
  if (error) {
    const isSubError  = /subscription|subscribe/i.test(error);
    const isAuthError = /login|required/i.test(error);
    const isCatError  = /category|cannot access/i.test(error);

    return (
      <div className="vp-wrap" style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{
          ...aspectBox,
          background: isSubError
            ? 'linear-gradient(135deg,#1a0f00,#2d1800)'
            : 'linear-gradient(135deg,#1a0a0a,#2d0000)',
        }}>

          {thumbSrc && (
            <img
              src={thumbSrc}
              alt=""
              onError={() => setThumbError(true)}
              style={{
                ...fillBox,
                objectFit: 'cover',
                zIndex:    1,
                opacity:   0.12,
                filter:    'blur(8px) brightness(0.4)',
              }}
            />
          )}

          <div style={{
            ...fillBox,
            zIndex:         2,
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            14,
            padding:        '20px 24px',
            textAlign:      'center',
          }}>
            <div style={{ fontSize: isMobile ? 38 : 50 }}>
              {isSubError ? '👑' : isCatError ? '🏷️' : isAuthError ? '🔐' : '⚠️'}
            </div>
            <p style={{
              fontSize:   isMobile ? 13 : 15,
              fontWeight: 700,
              color:      '#fff',
              maxWidth:   300,
              lineHeight: 1.55,
              margin:     0,
            }}>
              {error}
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {(isSubError || isCatError) && (
                <a href="/premium" style={{
                  padding:        '9px 22px',
                  background:     'linear-gradient(135deg,#c49a36,#f0c060)',
                  color:          '#000',
                  borderRadius:   50,
                  fontSize:       13,
                  fontWeight:     700,
                  textDecoration: 'none',
                }}>
                  👑 Get Premium
                </a>
              )}
              {isAuthError && (
                <a href="/auth" style={{
                  padding:        '9px 22px',
                  background:     'linear-gradient(135deg,#4cd389,#2ea065)',
                  color:          '#fff',
                  borderRadius:   50,
                  fontSize:       13,
                  fontWeight:     700,
                  textDecoration: 'none',
                }}>
                  🔐 Sign In
                </a>
              )}
              <button onClick={handleRefresh} style={{
                padding:     '9px 22px',
                background:  'rgba(255,255,255,0.1)',
                color:       '#fff',
                border:      '1px solid rgba(255,255,255,0.22)',
                borderRadius: 50,
                fontSize:    13,
                fontWeight:  600,
                cursor:      'pointer',
                fontFamily:  'inherit',
              }}>
                🔄 Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // EXPIRED STATE
  // ─────────────────────────────────────────────
  if (expired) {
    return (
      <div className="vp-wrap" style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ ...aspectBox, background: 'linear-gradient(135deg,#1a1400,#2d2200)' }}>
          <div style={{
            ...fillBox,
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            14,
          }}>
            <div style={{ fontSize: 48 }}>⏰</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#fbbf24', margin: 0 }}>
              Playback link expired
            </p>
            <button onClick={handleRefresh} style={{
              padding:      '11px 26px',
              background:   'linear-gradient(135deg,#4cd389,#2ea065)',
              color:        '#fff',
              border:       'none',
              borderRadius: 50,
              fontSize:     14,
              fontWeight:   700,
              cursor:       'pointer',
              fontFamily:   'inherit',
            }}>
              🔄 Refresh & Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // NO VIDEO SOURCE (Live class or missing video)
  // ─────────────────────────────────────────────
  if (!src) {
    return (
      <div className="vp-wrap" style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ ...aspectBox, background: '#0d0d0d' }}>

          {/* Show thumbnail clearly — this is the main fix for Live thumbnails */}
          {thumbSrc ? (
            <img
              src={thumbSrc}
              alt={title || 'Class thumbnail'}
              onError={() => setThumbError(true)}
              style={{
                ...fillBox,
                objectFit:      'cover',
                objectPosition: 'center',
                zIndex:         1,
                opacity:        1,
                display:        'block',
              }}
            />
          ) : null}

          {/* Semi-transparent overlay so text is readable */}
          <div style={{
            ...fillBox,
            zIndex:     2,
            background: thumbSrc ? 'rgba(0,0,0,0.45)' : '#111',
          }} />

          {/* Content */}
          <div style={{
            ...fillBox,
            zIndex:         3,
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            10,
            padding:        '20px',
            textAlign:      'center',
          }}>
            <div style={{
              width:          64,
              height:         64,
              borderRadius:   '50%',
              background:     'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       28,
              marginBottom:   4,
            }}>
              🎬
            </div>
            <p style={{
              fontSize:   isMobile ? 13 : 15,
              fontWeight: 700,
              color:      '#fff',
              margin:     0,
            }}>
              {title || 'Video coming soon'}
            </p>
            {title && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                Video will be available soon
              </p>
            )}
          </div>

        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // ★★★ MAIN PLAYER ★★★
  //
  // KEY INSIGHT: The thumbnail sits ABOVE the video (higher z-index).
  // It fades out only when `videoReady` becomes true, which is set
  // by `onLoadedData` — meaning the browser has decoded the first
  // video frame and is ready to display it. This eliminates the
  // black flash entirely regardless of browser/codec.
  // ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="vp-wrap vp-secure"
      style={{
        width:         '100%',
        borderRadius:  isFullscreen ? 0 : 12,
        overflow:      'hidden',
        background:    '#000',
        display:       'flex',
        flexDirection: 'column',
      }}
    >

      {/* ── 16:9 video area ── */}
      <div
        ref={containerRef}
        style={{
          ...aspectBox,
          borderRadius: 0,
          flexShrink:   0,
        }}
      >

        {/* ── VIDEO (z-index: 1, always below thumbnail overlay) ── */}
        <video
          ref={videoRef}
          src={src}
          controls
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          playsInline
          onContextMenu={(e) => e.preventDefault()}
          onPlay={()        => setIsPlaying(true)}
          onPause={()       => setIsPlaying(false)}
          onEnded={()       => setIsPlaying(false)}
          onLoadedData={()  => setVideoReady(true)}  // ← First frame decoded
          onError={()       => setVideoReady(false)}
          style={{
            ...fillBox,
            zIndex:    1,
            objectFit: 'contain',
            // Must be black (not transparent) — the thumbnail
            // overlay on top will cover this until videoReady
            background: '#000',
            display:    'block',
          }}
        />

        {/*
          ── THUMBNAIL OVERLAY (z-index: 5, ABOVE video) ──
          Visible:  before video first frame is ready (!videoReady)
          Hidden:   after first frame decoded  (videoReady === true)

          Using `visibility` + `opacity` together:
          - opacity:0 makes it invisible
          - visibility:hidden removes it from pointer-events
            AND tells the browser it doesn't need to paint it
        */}
        {thumbSrc && (
          <img
            src={thumbSrc}
            alt={title || 'Class thumbnail'}
            onError={() => setThumbError(true)}
            style={{
              ...fillBox,
              objectFit:      'cover',
              objectPosition: 'center',
              zIndex:         5,
              opacity:        videoReady ? 0 : 1,
              visibility:     videoReady ? 'hidden' : 'visible',
              transition:     'opacity 0.4s ease, visibility 0.4s ease',
              pointerEvents:  'none',
              display:        'block',
            }}
          />
        )}

        {/*
          ── NO-THUMBNAIL FALLBACK (z-index: 4) ──
          When no thumbnail: show gradient + title until video ready
        */}
        {!thumbSrc && !videoReady && (
          <div style={{
            ...fillBox,
            zIndex:         4,
            background:     'linear-gradient(135deg,#0d0d0d 0%,#1a1a1a 100%)',
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            10,
          }}>
            <div style={{
              width:          64,
              height:         64,
              borderRadius:   '50%',
              background:     isPremium
                ? 'rgba(196,154,54,0.15)'
                : 'rgba(76,211,137,0.15)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       28,
            }}>
              {isPremium ? '👑' : '🎬'}
            </div>
            {title && (
              <p style={{
                color:      'rgba(255,255,255,0.5)',
                fontSize:   13,
                margin:     0,
                textAlign:  'center',
                padding:    '0 20px',
              }}>
                {title}
              </p>
            )}
          </div>
        )}

        {/* ── SCREENSHOT BLOCKED OVERLAY (z-index: 20) ── */}
        {screenshotBlocked && (
          <div style={{
            ...fillBox,
            zIndex:         20,
            background:     'rgba(0,0,0,0.97)',
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            14,
            padding:        24,
            textAlign:      'center',
          }}>
            <div style={{ fontSize: isMobile ? 44 : 64 }}>🚫</div>
            <p style={{
              fontSize:   isMobile ? 16 : 20,
              fontWeight: 700,
              color:      '#ef4444',
              maxWidth:   280,
              margin:     0,
            }}>
              Screen capture not allowed
            </p>
            <p style={{
              fontSize: isMobile ? 12 : 13,
              color:    'rgba(255,255,255,0.5)',
              maxWidth: 260,
              margin:   0,
            }}>
              This content is protected by Yoga Temple.
            </p>
          </div>
        )}

        {/* ── PREMIUM WATERMARK (z-index: 6, above thumb) ── */}
        {isPremium && isPlaying && (
          <div style={{
            ...fillBox,
            zIndex:        6,
            pointerEvents: 'none',
            overflow:      'hidden',
          }}>
            <div style={{
              position:       'absolute',
              inset:          '-50%',
              display:        'flex',
              flexWrap:       'wrap',
              gap:            '50px 70px',
              alignContent:   'center',
              justifyContent: 'center',
              transform:      'rotate(-22deg)',
              opacity:        0.02,
              color:          '#fff',
              fontSize:       isMobile ? 10 : 12,
              fontWeight:     700,
              letterSpacing:  2,
              userSelect:     'none',
              whiteSpace:     'nowrap',
            }}>
              {Array.from({ length: 40 }).map((_, i) => (
                <span key={i}>YOGA TEMPLE PREMIUM</span>
              ))}
            </div>
          </div>
        )}

      </div>
      {/* ── end 16:9 area ── */}

      {/* ── INFO BAR (outside aspect-box, no z-index issues) ── */}
      <div style={{
        padding:        isMobile ? '7px 12px' : '9px 16px',
        background:     isPremium
          ? 'linear-gradient(90deg,rgba(196,154,54,.16),rgba(196,154,54,.05))'
          : 'linear-gradient(90deg,rgba(76,211,137,.13),rgba(76,211,137,.04))',
        borderTop:      `1px solid ${isPremium
          ? 'rgba(196,154,54,.18)'
          : 'rgba(76,211,137,.16)'}`,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        gap:            8,
        flexWrap:       'wrap',
        flexShrink:     0,
      }}>

        {/* Title */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        6,
          fontSize:   isMobile ? 10 : 11,
          color:      isPremium ? '#c49a36' : '#2ea065',
          fontWeight: 600,
          minWidth:   0,
          flex:       1,
        }}>
          <span style={{ flexShrink: 0 }}>{isPremium ? '👑' : '🆓'}</span>
          <span style={{
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
          }}>
            {title || (isPremium ? 'Premium Content' : 'Free Class')}
          </span>
        </div>

        {/* Right controls */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        8,
          flexShrink: 0,
        }}>
          {isPremium && (
            <span style={{
              fontSize:   isMobile ? 9 : 10,
              color:      'rgba(196,154,54,.6)',
              fontWeight: 500,
            }}>
              🔒 Protected
            </span>
          )}
          <button
            onClick={toggleFullscreen}
            style={{
              background:   'rgba(255,255,255,.08)',
              border:       '1px solid rgba(255,255,255,.12)',
              color:        'rgba(255,255,255,.8)',
              borderRadius: 6,
              padding:      isMobile ? '3px 7px' : '4px 9px',
              fontSize:     isMobile ? 10 : 11,
              cursor:       'pointer',
              fontFamily:   'inherit',
              display:      'flex',
              alignItems:   'center',
              gap:          4,
            }}
          >
            {isFullscreen ? '⛶ Exit' : '⛶ Full'}
          </button>
        </div>

      </div>
    </div>
  );
}