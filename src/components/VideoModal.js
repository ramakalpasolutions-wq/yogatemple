// src/components/VideoModal.js
'use client';
import { useEffect, useCallback } from 'react';
import VideoPlayer from './VideoPlayer';

export default function VideoModal({
  isOpen,
  onClose,
  classId,
  isPremium = false,
  title = '',
  thumbnail,
  category,
  instructor,
  duration,
  level,
}) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const lvlDisp = {
    BEGINNER:'Beginner', INTERMEDIATE:'Intermediate',
    ADVANCED:'Advanced',  ALL_LEVELS:'All Levels',
  };
  const catEmoji = {
    HATHA:'🌅', VINYASA:'🌊', ASHTANGA:'🔥', POWER:'⚡',
    YIN:'🌙',   RESTORATIVE:'🌿', KUNDALINI:'✨', PRENATAL:'🤰',
    KIDS:'🧒',  MEDITATION:'🧠', PRANAYAMA:'🌬️',
  };

  return (
    <>
      <style>{`
        @keyframes vm-fade  { from{opacity:0}           to{opacity:1} }
        @keyframes vm-slide { from{opacity:0;transform:translateY(32px) scale(.97)}
                              to  {opacity:1;transform:translateY(0)    scale(1)}  }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        onClick={onClose}
        style={{
          position:'fixed', inset:0, zIndex:9000,
          background:'rgba(0,0,0,.88)',
          backdropFilter:'blur(8px)',
          WebkitBackdropFilter:'blur(8px)',
          animation:'vm-fade .2s ease',
          display:'flex', alignItems:'center', justifyContent:'center',
          padding: '12px',
          boxSizing: 'border-box',
        }}
      >
        {/* ── Modal ── */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width:'100%',
            maxWidth: 920,
            background:'#0f0f0f',
            borderRadius: 16,
            overflow:'hidden',
            boxShadow:'0 40px 100px rgba(0,0,0,.9), 0 0 0 1px rgba(255,255,255,.07)',
            animation:'vm-slide .25s cubic-bezier(.4,0,.2,1)',
            zIndex:9001,
            display:'flex',
            flexDirection:'column',
            // Let it shrink on small screens
            maxHeight: '95vh',
          }}
        >
          {/* ── Header ── */}
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'12px 16px',
            background:'rgba(255,255,255,.03)',
            borderBottom:'1px solid rgba(255,255,255,.07)',
            flexShrink:0, gap:10, minWidth:0,
          }}>
            {/* Left: badges + title */}
            <div style={{
              display:'flex', alignItems:'center', gap:8,
              minWidth:0, overflow:'hidden',
            }}>
              <span style={{
                flexShrink:0, fontSize:10, fontWeight:700,
                padding:'3px 10px', borderRadius:50,
                background: isPremium
                  ? 'linear-gradient(135deg,#c49a36,#f0c060)'
                  : 'linear-gradient(135deg,#2ea065,#4cd389)',
                color: isPremium ? '#000' : '#fff',
                whiteSpace:'nowrap',
              }}>
                {isPremium ? '👑 PREMIUM' : '🆓 FREE'}
              </span>

              {category && (
                <span style={{
                  flexShrink:0, fontSize:10, padding:'3px 10px', borderRadius:50,
                  background:'rgba(255,255,255,.09)',
                  color:'rgba(255,255,255,.75)', fontWeight:600,
                  whiteSpace:'nowrap',
                }}>
                  {catEmoji[category]} {category}
                </span>
              )}

              <h3 style={{
                fontSize:14, fontWeight:700, color:'#fff',
                margin:0, fontFamily:'Times New Roman',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              }}>
                {title}
              </h3>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              title="Close (Esc)"
              style={{
                flexShrink:0, width:34, height:34, borderRadius:'50%',
                background:'rgba(255,255,255,.07)',
                border:'1px solid rgba(255,255,255,.13)',
                color:'rgba(255,255,255,.8)', fontSize:17,
                cursor:'pointer', display:'flex',
                alignItems:'center', justifyContent:'center',
                fontFamily:'inherit', lineHeight:1,
                transition:'background .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.18)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,.07)'}
            >
              ✕
            </button>
          </div>

          {/* 
            ★ VIDEO PLAYER
            No extra wrapper with aspectRatio here —
            VideoPlayer manages its own 16:9 sizing via paddingBottom trick
          */}
          <div style={{ flexShrink:0 }}>
            <VideoPlayer
              classId={classId}
              isPremium={isPremium}
              title={title}
              thumbnail={thumbnail}
              category={category}
              autoplay={true}
              onClose={onClose}
            />
          </div>

          {/* ── Meta bar ── */}
          <div style={{
            padding:'10px 16px',
            background:'rgba(255,255,255,.02)',
            borderTop:'1px solid rgba(255,255,255,.06)',
            display:'flex', alignItems:'center',
            gap:16, flexWrap:'wrap', flexShrink:0,
          }}>
            {instructor && (
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span>👤</span>
                <span style={{ fontSize:12, color:'rgba(255,255,255,.75)', fontWeight:600 }}>
                  {instructor}
                </span>
              </div>
            )}
            {duration && (
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span>⏱</span>
                <span style={{ fontSize:12, color:'rgba(255,255,255,.6)' }}>
                  {duration} min
                </span>
              </div>
            )}
            {level && (
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span>📊</span>
                <span style={{ fontSize:12, color:'rgba(255,255,255,.6)' }}>
                  {lvlDisp[level] || level}
                </span>
              </div>
            )}
            <div style={{ marginLeft:'auto', fontSize:11, color:'rgba(255,255,255,.28)' }}>
              Press{' '}
              <kbd style={{
                background:'rgba(255,255,255,.07)',
                border:'1px solid rgba(255,255,255,.14)',
                borderRadius:4, padding:'1px 5px',
                fontSize:10, fontFamily:'inherit',
                color:'rgba(255,255,255,.35)',
              }}>Esc</kbd>
              {' '}to close
            </div>
          </div>
        </div>
      </div>
    </>
  );
}