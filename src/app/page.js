// src/app/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import axios from 'axios';

const yogaBenefits = [
  { icon:'🧠', title:'Mental Clarity',    desc:'Yoga calms the mind, sharpens focus, and reduces anxiety through mindful breathing and meditation.', stat:'72%', statLabel:'report reduced stress' },
  { icon:'💪', title:'Physical Strength', desc:'Build lean muscle, improve posture, and develop functional strength that supports daily life.',       stat:'85%', statLabel:'gain flexibility in 8 weeks' },
  { icon:'❤️', title:'Heart Health',      desc:'Regular yoga practice lowers blood pressure, improves circulation and promotes cardiovascular wellness.', stat:'40%', statLabel:'lower heart disease risk' },
  { icon:'😴', title:'Better Sleep',      desc:'Evening yoga routines and breathing exercises improve sleep quality and help overcome insomnia.',      stat:'65%', statLabel:'sleep better with yoga' },
  { icon:'🌿', title:'Immune Boost',      desc:'Yoga stimulates the lymphatic system, reduces inflammation, and strengthens natural immunity.',        stat:'50%', statLabel:'fewer sick days' },
  { icon:'🧘', title:'Inner Peace',       desc:'Connect with your true self through ancient yogic philosophy, self-awareness and spiritual growth.',   stat:'90%', statLabel:'feel more balanced' },
];

const yogaStyles = [
  { emoji:'🌅', name:'Hatha',      desc:'Gentle, foundational poses. Perfect for beginners.' },
  { emoji:'🌊', name:'Vinyasa',    desc:'Dynamic flow linking breath to movement.' },
  { emoji:'🔥', name:'Ashtanga',   desc:'Structured, intense series of poses.' },
  { emoji:'🌙', name:'Yin',        desc:'Slow stretches targeting connective tissue.' },
  { emoji:'🧠', name:'Meditation', desc:'Guided mindfulness for mental clarity.' },
  { emoji:'🌬️', name:'Pranayama', desc:'Breathing techniques for calm and energy.' },
];

const benefits = [
  { icon:'🧘', title:'Mind & Body Balance', desc:'Harmonize your mental and physical wellbeing through mindful practice.' },
  { icon:'💪', title:'Build Strength',       desc:'Develop core strength, flexibility and endurance with progressive classes.' },
  { icon:'🌿', title:'Reduce Stress',        desc:'Learn proven breathing techniques and meditation for daily stress relief.' },
  { icon:'🧘‍♂️', title:'Inner Energy',      desc:'Wellness and Health Inner Peace. Our inner energy can change our life.' },
];

const ALL_STYLES = `
  @keyframes fadeSlideUp  { from{opacity:0;transform:translateY(36px)} to{opacity:1;transform:translateY(0)} }
  @keyframes livePulse    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
  @keyframes bounce       { 0%,100%{transform:translateY(0)} 50%{transform:translateY(10px)} }
  @keyframes shimmer      { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes badgePop     { from{opacity:0;transform:scale(.8) translateY(-8px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes spin         { to{transform:rotate(360deg)} }
  @keyframes pulse        { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }
  @keyframes marquee      { from{transform:translateX(0)} to{transform:translateX(-50%)} }

  /* ══ HERO SECTION ══ */
  .hero-section {
    position: relative;
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    overflow: hidden;
  }

  /* ── Desktop/Tablet BG layer ── */
  .hero-bg-layer {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    width: 100%;
    height: 100%;
    background-size: cover !important;
    background-position: center center !important;
    background-repeat: no-repeat !important;
    will-change: transform, opacity;
    transition: opacity 1.4s ease;
  }

  /* Desktop: hide the <img> tag — use background-image */
  .hero-mobile-img {
    display: none;
  }

  /* Dark overlay */
  .hero-dark-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(0,30,15,.50) 0%,
      rgba(0,0,0,.25)   40%,
      rgba(0,20,10,.52) 100%
    );
    z-index: 1;
    pointer-events: none;
  }

  /* Center text */
  .hero-center {
    position: relative;
    z-index: 3;
    width: 100%;
    max-width: 700px;
    margin: 0 auto;
    padding: clamp(100px,14vw,150px) clamp(16px,4vw,24px) clamp(60px,8vw,100px);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    justify-content: center;
  }

  /* Desktop side cards */
  .hero-blink-left,
  .hero-blink-right {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 210px;
    z-index: 4;
  }
  .hero-blink-left  { left:  24px; }
  .hero-blink-right { right: 24px; }

  /* Tablet side cards */
  @media (max-width: 1100px) {
    .hero-blink-left,
    .hero-blink-right { width: 175px; }
    .hero-blink-left  { left:  12px; }
    .hero-blink-right { right: 12px; }
  }

  /* ══════════════════════════════════════════
     MOBILE HERO IMAGE FIX
     iPhone SE = 375×667, iPhone 12 = 390×844
     Key: use <img> with object-fit:cover
     The section height = 100vh of the phone screen
  ══════════════════════════════════════════ */
  @media (max-width: 768px) {

    /* Hero section: exact screen height on mobile */
    .hero-section {
      min-height: 100svh;
      min-height: 100vh;
      height: 100svh;
      height: 100vh;
    }

    /* BG layer: remove background-image on mobile */
    .hero-bg-layer {
      background-image: none !important;
      background-color: #003818;
    }

    /* <img> tag: fills hero section perfectly */
    .hero-mobile-img {
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center center;
      z-index: 0;
    }

    /* Hide desktop side cards */
    .hero-blink-left,
    .hero-blink-right {
      display: none !important;
    }

    /* Mobile center content padding */
    .hero-center {
      padding-top:    80px;
      padding-bottom: 48px;
      padding-left:   20px;
      padding-right:  20px;
    }
  }

  /* Mobile announcement cards below hero */
  .hero-mobile-cards {
    display: none;
  }
  @media (max-width: 768px) {
    .hero-mobile-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding: 16px 14px 4px;
      background: #faf7f2;
    }
  }
  @media (max-width: 400px) {
    .hero-mobile-cards {
      grid-template-columns: 1fr;
    }
  }

  /* Ribbon */
  .ribbon-text { font-size: clamp(10px, 1.3vw, 13px); }

  /* Benefits grid */
  .benefits-grid {
    display: grid;
    gap: 18px;
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 1024px) {
    .benefits-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 600px) {
    .benefits-grid { grid-template-columns: 1fr; }
  }

  /* Video preview grid */
  .preview-grid {
    display: grid;
    gap: clamp(14px, 2vw, 24px);
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  @media (max-width: 1024px) {
    .preview-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 580px) {
    .preview-grid { grid-template-columns: 1fr; }
  }

  /* Featured classes grid */
  .class-grid {
    display: grid;
    gap: clamp(14px, 2vw, 24px);
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  @media (max-width: 1024px) {
    .class-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 580px) {
    .class-grid { grid-template-columns: 1fr; }
  }

  /* Why choose us grid */
  .why-grid {
    display: grid;
    gap: clamp(12px, 2vw, 20px);
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  @media (max-width: 1024px) {
    .why-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 500px) {
    .why-grid { grid-template-columns: 1fr; }
  }

  /* Yoga styles grid */
  .style-grid {
    display: grid;
    gap: clamp(8px, 1.2vw, 14px);
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
  @media (max-width: 900px) {
    .style-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
  @media (max-width: 480px) {
    .style-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
`;

function useStyles() {
  useEffect(() => {
    const id = 'hp-styles-v4';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id;
    el.textContent = ALL_STYLES;
    document.head.appendChild(el);
    return () => { try { document.head.removeChild(el); } catch {} };
  }, []);
}

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const d = +(e.target.dataset.delay || 0);
          setTimeout(() => {
            e.target.style.opacity = '1';
            e.target.style.transform = 'translateY(0)';
          }, d);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  });
}

function ShineLink({ href, style, children, onClick }) {
  const [h, setH] = useState(false);
  const Tag = href ? Link : 'button';
  return (
    <Tag href={href} onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        ...style, position:'relative', overflow:'hidden',
        transform: h ? 'translateY(-1px)' : 'translateY(0)',
        transition:'transform .2s ease, box-shadow .2s ease',
      }}
    >
      {children}
      <span style={{
        position:'absolute', top:'-50%',
        left: h ? '125%' : '-75%',
        width:'50%', height:'200%',
        background:'linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent)',
        transform:'skewX(-22deg)', transition:'left .55s ease', pointerEvents:'none',
      }} />
    </Tag>
  );
}

function BlinkCard({ data }) {
  const [dotOn,    setDotOn]    = useState(true);
  const [cardGlow, setCardGlow] = useState(true);
  const [hov,      setHov]      = useState(false);

  useEffect(() => {
    const t = setInterval(() => setDotOn(p => !p), 700);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setCardGlow(p => !p), 1800);
    return () => clearInterval(t);
  }, []);

  if (!data?.visible) return null;
  const color = data.color || '#ef4444';

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:`linear-gradient(135deg,${color}14,${color}07)`,
        border:`2px solid ${color}${hov ? '80' : '45'}`,
        borderRadius:18,
        padding:'clamp(14px,2vw,22px) clamp(12px,1.5vw,18px)',
        textAlign:'center', cursor:'default',
        boxShadow: cardGlow
          ? `0 12px 40px ${color}35,inset 0 0 20px ${color}08`
          : `0 4px 16px ${color}12`,
        transform: hov ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        transition:'transform .3s ease, border-color .3s ease, box-shadow .6s ease',
        position:'relative', overflow:'hidden',
        backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
      }}
    >
      <div style={{
        position:'absolute', inset:0, borderRadius:16, pointerEvents:'none',
        background:`linear-gradient(135deg,transparent 0%,${color}08 50%,transparent 100%)`,
        animation:'pulse 3s ease-in-out infinite',
      }} />
      <div style={{
        display:'inline-flex', alignItems:'center', gap:6,
        background:`${color}18`, border:`1px solid ${color}40`,
        borderRadius:50, padding:'4px 12px', marginBottom:10,
      }}>
        <div style={{
          width:8, height:8, borderRadius:'50%', background:color, flexShrink:0,
          opacity: dotOn ? 1 : 0.12, transition:'opacity .15s',
          boxShadow: dotOn ? `0 0 8px ${color},0 0 16px ${color}60` : 'none',
        }} />
        <span style={{
          fontSize:'clamp(10px,1.2vw,13px)', fontWeight:800,
          color, letterSpacing:0.8, textTransform:'uppercase',
        }}>
          {data.title}
        </span>
      </div>
      <h3 style={{
        fontSize:'clamp(13px,1.4vw,16px)', fontWeight:800, color:'#fff',
        marginBottom:4, lineHeight:1.35, fontFamily:'Times New Roman',
        textShadow:'0 2px 8px rgba(0,0,0,.3)',
      }}>
        {data.line1}
      </h3>
      <p style={{
        fontSize:'clamp(10px,1.1vw,13px)', color:'rgba(255,255,255,.75)',
        marginBottom:12, lineHeight:1.5,
      }}>
        {data.line2}
      </p>
      {data.badge && (
        <ShineLink href="/premium" style={{
          display:'inline-flex', alignItems:'center', gap:5,
          background:color, color:'#fff',
          fontSize:'clamp(9px,1vw,11px)', fontWeight:800,
          padding:'6px 14px', borderRadius:50,
          letterSpacing:1.5, textDecoration:'none',
          boxShadow:`0 4px 16px ${color}45`,
        }}>
          {data.badge} →
        </ShineLink>
      )}
    </div>
  );
}

function LiveSessionRibbon({ left, right }) {
  const [dot, setDot] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setDot(p => !p), 600);
    return () => clearInterval(t);
  }, []);

  const buildItems = () => {
    const items = [];
    if (left?.visible && left?.title) {
      items.push({ text:left.title,  highlight:true,  color:left.color  });
      if (left.line1) items.push({ text:left.line1,  highlight:false });
      if (left.line2) items.push({ text:left.line2,  highlight:false });
      if (left.badge) items.push({ text:`👉 ${left.badge}`, highlight:true, color:left.color });
    }
    if (right?.visible && right?.title) {
      items.push({ text:right.title, highlight:true,  color:right.color });
      if (right.line1) items.push({ text:right.line1, highlight:false });
      if (right.line2) items.push({ text:right.line2, highlight:false });
      if (right.badge) items.push({ text:`👉 ${right.badge}`, highlight:true, color:right.color });
    }
    if (items.length === 0) {
      return [
        { text:'🔴 LIVE SESSION',   highlight:true  },
        { text:'New Batch Starts',   highlight:false },
        { text:'🧘 JOIN ONLINE',     highlight:true  },
        { text:'All Levels Welcome', highlight:false },
      ];
    }
    return items;
  };

  const items    = buildItems();
  const repeated = [...items, ...items, ...items];

  return (
    <div style={{
      background:'linear-gradient(135deg,#1a0800,#2c1000,#1a0800)',
      padding:'clamp(8px,1.2vw,12px) 0',
      overflow:'hidden', position:'relative',
      borderTop:'1px solid rgba(239,68,68,.20)',
      borderBottom:'1px solid rgba(239,68,68,.20)',
    }}>
      <div style={{
        position:'absolute', left:'clamp(8px,1.5vw,16px)', top:'50%',
        transform:'translateY(-50%)', zIndex:2,
        width:'clamp(6px,1vw,10px)', height:'clamp(6px,1vw,10px)',
        borderRadius:'50%', background:'#ef4444',
        opacity: dot ? 1 : 0.1, transition:'opacity .15s',
        boxShadow: dot ? '0 0 10px #ef4444,0 0 20px rgba(239,68,68,.5)' : 'none',
      }} />
      <div style={{ display:'flex', overflow:'hidden', whiteSpace:'nowrap' }}>
        <div style={{
          display:'inline-flex',
          gap:'clamp(20px,3vw,40px)',
          paddingLeft:'100%',
          animation:'marquee 30s linear infinite',
        }}>
          {repeated.map((item, i) => (
            <span key={i} className="ribbon-text" style={{
              fontWeight:700, letterSpacing:1.5, textTransform:'uppercase',
              color: item.highlight ? (item.color||'#ef4444') : 'rgba(255,200,150,.85)',
            }}>
              {item.text}
              <span style={{ marginLeft:'clamp(20px,3vw,40px)', color:'rgba(239,68,68,.35)' }}>•</span>
            </span>
          ))}
        </div>
      </div>
      <div style={{
        position:'absolute', right:'clamp(8px,1.5vw,16px)', top:'50%',
        transform:'translateY(-50%)', zIndex:2,
        width:'clamp(6px,1vw,10px)', height:'clamp(6px,1vw,10px)',
        borderRadius:'50%', background:'#ef4444',
        opacity: dot ? 0.1 : 1, transition:'opacity .15s',
        boxShadow: dot ? 'none' : '0 0 10px #ef4444,0 0 20px rgba(239,68,68,.5)',
      }} />
    </div>
  );
}

export default function HomePage() {
  useStyles();
  useScrollReveal();

  const { data: session } = useSession();

  const [heroImages,    setHeroImages]    = useState([]);
  const [heroIdx,       setHeroIdx]       = useState(0);
  const [classes,       setClasses]       = useState([]);
  const [videos,        setVideos]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [liveClass,     setLiveClass]     = useState(null);
  const [scrollY,       setScrollY]       = useState(0);
  const [yogaTab,       setYogaTab]       = useState(0);
  const [playingId,     setPlayingId]     = useState(null);
  const [mounted,       setMounted]       = useState(false);
  const [announcements, setAnnouncements] = useState({ left:null, right:null });
  const [isMobile,      setIsMobile]      = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', fn, { passive:true });
    return () => window.removeEventListener('scroll', fn);
  }, [mounted]);

  const fetchHero = useCallback(async () => {
    try {
      const r = await axios.get('/api/admin/hero');
      if (r.data?.length) setHeroImages(r.data);
    } catch {}
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      const r   = await axios.get('/api/classes');
      const all = r.data || [];
      setClasses(all.slice(0, 6));
      setVideos(all.filter(c => c.type==='RECORDED' && c.videoUrl && !c.isPremium).slice(0, 3));
      const now = new Date();
      const up  = all
        .filter(c => c.type==='LIVE' && c.scheduledAt && new Date(c.scheduledAt) > now)
        .sort((a,b) => new Date(a.scheduledAt)-new Date(b.scheduledAt));
      setLiveClass(up[0] || null);
    } catch {} finally { setLoading(false); }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const r = await axios.get('/api/admin/announcements');
      setAnnouncements(r.data);
    } catch {
      setAnnouncements({
        left:  { title:'🔴 Live Session',   line1:'New Batch Starts',        line2:'First Monday of Every Month', badge:'JOIN NOW', color:'#ef4444', visible:true },
        right: { title:'🧘 Online Classes', line1:'Morning & Evening Batches', line2:'All Levels Welcome',         badge:'ENROLL',   color:'#2ea065', visible:true },
      });
    }
  }, []);

  useEffect(() => {
    fetchHero();
    fetchClasses();
    fetchAnnouncements();
  }, [fetchHero, fetchClasses, fetchAnnouncements]);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const t = setInterval(() => setHeroIdx(p => (p+1) % heroImages.length), 5000);
    return () => clearInterval(t);
  }, [heroImages.length]);

  useEffect(() => {
    const t = setInterval(() => setYogaTab(p => (p+1) % yogaBenefits.length), 4000);
    return () => clearInterval(t);
  }, []);

  // Parallax desktop only
  const isDesktop = mounted && !isMobile;
  const px = isDesktop ? scrollY * 0.28 : 0;

  const badge = {
    display:'inline-block',
    background:'linear-gradient(135deg,rgba(76,211,137,.14),rgba(36,180,101,.09))',
    color:'#2ea065', borderRadius:50, padding:'6px 20px',
    fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:14,
  };

  const heading = (size='clamp(28px,4vw,46px)') => ({
    fontSize:size, fontFamily:'Times New Roman',
    color:'#1a1208', marginBottom:16, fontWeight:700,
  });

  const bgList = heroImages.length > 0
    ? heroImages
    : [{ imageUrl:'', id:'fb' }];

  return (
    <>
      {/* ════ HERO ════ */}
      <section className="hero-section">

        {/* BG layers — desktop uses background-image, mobile uses <img> */}
        {bgList.map((img, i) => (
          <div
            key={img.id || i}
            className="hero-bg-layer"
            style={{
              // Desktop only — mobile overrides to none via CSS
              backgroundImage: img.imageUrl
                ? `url('${img.imageUrl}')`
                : 'linear-gradient(135deg,#003818 0%,#005f2b 50%,#2ea065 100%)',
              transform: isDesktop ? `translateY(${px}px)` : 'none',
              opacity: heroImages.length > 0 ? (i === heroIdx ? 1 : 0) : 1,
            }}
          >
            {/*
              ★ MOBILE ONLY IMAGE TAG
              Shown via CSS only on ≤768px
              object-fit:cover fills 375×667 perfectly
            */}
            {img.imageUrl && (
              <img
                src={img.imageUrl}
                alt=""
                aria-hidden="true"
                className="hero-mobile-img"
              />
            )}
          </div>
        ))}

        {/* Dark overlay */}
        <div className="hero-dark-overlay" />

        {/* Desktop/tablet side cards */}
        {mounted && (
          <>
            <div className="hero-blink-left">
              <BlinkCard data={announcements.left} />
            </div>
            <div className="hero-blink-right">
              <BlinkCard data={announcements.right} />
            </div>
          </>
        )}

        {/* Center content */}
        <div className="hero-center">
          <div style={{
            display:'inline-flex', alignItems:'center', gap:8,
            background:'rgba(255,255,255,.10)', backdropFilter:'blur(14px)',
            border:'1px dashed rgba(255,255,255,.40)',
            borderRadius:50, padding:'8px 22px', marginBottom:28,
            animation:'badgePop .6s ease .1s both',
          }}>
            {liveClass ? (
              <>
                <span style={{ width:9, height:9, borderRadius:'50%', background:'#02ff2c', display:'inline-block', flexShrink:0, animation:'livePulse 1s infinite' }} />
                <span style={{ color:'#fff', fontSize:'clamp(10px,1.4vw,12px)', fontWeight:600, letterSpacing:1.5, textTransform:'uppercase' }}>
                  Yoga Temple
                </span>
              </>
            ) : (
              <span style={{ color:'#4cd389', fontSize:'clamp(10px,1.4vw,12px)', fontWeight:700, letterSpacing:2 }}>
                🧘 ONLINE YOGA CLASSES
              </span>
            )}
          </div>

          <h1 style={{
            fontSize:'clamp(30px,6vw,72px)',
            color:'#fff', fontFamily:'Times New Roman',
            lineHeight:1.08, marginBottom:20,
            textShadow:'0 4px 40px rgba(0,0,0,.4)', fontWeight:700,
            animation:'fadeSlideUp .8s ease .25s both',
          }}>
            Find Your{' '}
            <em style={{ color:'#4cd389', fontStyle:'normal' }}>Inner Energy</em>
            <br />Through Yoga
          </h1>

          <p style={{
            fontSize:'clamp(14px,1.8vw,18px)', color:'rgba(255,255,255,.82)',
            lineHeight:1.8, maxWidth:480, margin:'0 auto 32px',
            animation:'fadeSlideUp .8s ease .45s both',
          }}>
            Transform your mind, body and soul with expert-led live and recorded yoga classes.
          </p>

          <div style={{
            display:'flex', gap:'clamp(8px,1.5vw,14px)', justifyContent:'center',
            flexWrap:'wrap', marginBottom:36,
            animation:'fadeSlideUp .8s ease .6s both',
          }}>
            <ShineLink href="/classes" style={{
              background:'linear-gradient(135deg,#4cd389,#2ea065)',
              color:'#fff', padding:'clamp(12px,1.8vw,16px) clamp(22px,4vw,36px)',
              borderRadius:50, fontWeight:700, fontSize:'clamp(13px,1.6vw,15px)',
              textDecoration:'none', boxShadow:'0 8px 32px rgba(76,211,137,.35)',
              display:'inline-flex', alignItems:'center',
            }}>
              Explore Classes →
            </ShineLink>
            {!session && (
              <ShineLink href="/auth" style={{
                background:'rgba(255,255,255,.12)', backdropFilter:'blur(12px)',
                border:'1px solid rgba(255,255,255,.3)',
                color:'#fff', padding:'clamp(12px,1.8vw,16px) clamp(22px,4vw,36px)',
                borderRadius:50, fontWeight:600, fontSize:'clamp(13px,1.6vw,15px)',
                textDecoration:'none', display:'inline-flex', alignItems:'center',
              }}>
                Join Free 🙏
              </ShineLink>
            )}
          </div>

          {heroImages.length > 1 && (
            <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:16, animation:'fadeSlideUp .8s ease .75s both' }}>
              {heroImages.map((_, i) => (
                <button key={i} onClick={() => setHeroIdx(i)} style={{
                  width: i===heroIdx ? 36 : 10, height:5, borderRadius:3,
                  border:'none', cursor:'pointer',
                  background: i===heroIdx ? '#4cd389' : 'rgba(255,255,255,.3)',
                  transition:'width .4s ease, background .4s ease', padding:0,
                }} />
              ))}
            </div>
          )}

          <div style={{ fontSize:24, color:'rgba(255,255,255,.35)', animation:'bounce 2.5s ease-in-out infinite' }}>↓</div>
        </div>
      </section>

      {/* Mobile announcement cards */}
      <div className="hero-mobile-cards">
        {announcements.left?.visible  && <BlinkCard data={announcements.left}  />}
        {announcements.right?.visible && <BlinkCard data={announcements.right} />}
      </div>

      {/* Ribbon */}
      <LiveSessionRibbon left={announcements.left} right={announcements.right} />

      {/* Live banner */}
      {liveClass && (
        <section style={{ background:'linear-gradient(135deg,#005f2b,#2ea065)', padding:'clamp(10px,1.5vw,14px) 0' }}>
          <div style={{
            maxWidth:1200, margin:'0 auto', padding:'0 clamp(12px,2vw,24px)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            flexWrap:'wrap', gap:10,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, color:'#fff' }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#ef4444', display:'inline-block', animation:'livePulse 1.5s infinite' }} />
              <span style={{ fontWeight:600, fontSize:'clamp(11px,1.4vw,14px)' }}>
                Next Live: <strong>{liveClass.title}</strong> —{' '}
                {new Date(liveClass.scheduledAt).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' })}
              </span>
            </div>
            <ShineLink href="/classes" style={{
              background:'#fff', color:'#005f2b', padding:'7px 18px', borderRadius:50,
              fontSize:'clamp(11px,1.3vw,13px)', fontWeight:700, textDecoration:'none', display:'inline-flex',
            }}>
              View Details →
            </ShineLink>
          </div>
        </section>
      )}

      {/* About Yoga */}
      <section style={{ padding:'clamp(48px,8vw,90px) 0', background:'#faf7f2' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 clamp(12px,2vw,24px)' }}>
          <div data-reveal data-delay="0" style={{ textAlign:'center', marginBottom:'clamp(32px,5vw,56px)', opacity:0, transform:'translateY(36px)', transition:'opacity .7s ease, transform .7s ease' }}>
            <span style={badge}>The Ancient Science</span>
            <h2 style={heading()}>What is Yoga &amp; Why Practice?</h2>
            <p style={{ color:'#6b5a3e', fontSize:'clamp(14px,1.6vw,16px)', maxWidth:640, margin:'0 auto', lineHeight:1.8 }}>
              Yoga is a 5,000-year-old practice uniting body, mind, and spirit through postures, breathing, and meditation.
            </p>
          </div>

          <div className="benefits-grid" style={{ marginBottom:'clamp(32px,4vw,48px)' }}>
            {yogaBenefits.map((b, i) => {
              const active = i === yogaTab;
              return (
                <div key={i} data-reveal data-delay={i*80} onClick={() => setYogaTab(i)} style={{
                  opacity:0,
                  background: active ? 'linear-gradient(135deg,#005f2b,#2ea065)' : '#fff',
                  borderRadius:16, padding:'clamp(18px,2.5vw,26px) clamp(16px,2vw,22px)',
                  cursor:'pointer',
                  border: active ? 'none' : '1px solid rgba(0,0,0,.05)',
                  transform: active ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: active ? '0 16px 48px rgba(0,95,43,.22)' : '0 2px 8px rgba(0,0,0,.04)',
                  transition:'background .35s, transform .35s, box-shadow .35s',
                }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:'clamp(10px,1.5vw,14px)' }}>
                    <span style={{ fontSize:'clamp(26px,3.5vw,34px)', flexShrink:0, transform:active?'scale(1.15)':'scale(1)', transition:'transform .3s', display:'inline-block' }}>{b.icon}</span>
                    <div>
                      <h3 style={{ fontSize:'clamp(14px,1.6vw,17px)', fontWeight:700, marginBottom:6, color:active?'#fff':'#1a1208', fontFamily:'Times New Roman', transition:'color .3s' }}>{b.title}</h3>
                      <p style={{ fontSize:'clamp(11px,1.3vw,13px)', lineHeight:1.7, marginBottom:10, color:active?'rgba(255,255,255,.8)':'#6b5a3e', transition:'color .3s' }}>{b.desc}</p>
                      <div style={{ display:'inline-flex', alignItems:'baseline', gap:6, background:active?'rgba(255,255,255,.15)':'rgba(76,211,137,.08)', padding:'4px 12px', borderRadius:50 }}>
                        <span style={{ fontSize:'clamp(16px,2vw,20px)', fontWeight:800, color:active?'#4cd389':'#2ea065' }}>{b.stat}</span>
                        <span style={{ fontSize:11, color:active?'rgba(255,255,255,.7)':'#6b5a3e' }}>{b.statLabel}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div data-reveal data-delay="100" style={{ background:'#fff', borderRadius:20, padding:'clamp(20px,3vw,32px) clamp(16px,2.5vw,28px)', boxShadow:'0 2px 20px rgba(0,0,0,.04)', opacity:0, transform:'translateY(36px)', transition:'opacity .7s ease 100ms, transform .7s ease 100ms' }}>
            <h3 style={{ fontSize:'clamp(18px,2.5vw,22px)', fontWeight:700, textAlign:'center', marginBottom:'clamp(16px,2.5vw,24px)', fontFamily:'Times New Roman', color:'#1a1208' }}>
              Yoga Styles We Teach
            </h3>
            <div className="style-grid">
              {yogaStyles.map((s, i) => <StyleTile key={i} s={s} />)}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section style={{ padding:'clamp(48px,8vw,80px) 0', background:'#fff' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 clamp(12px,2vw,24px)' }}>
          <div data-reveal data-delay="0" style={{ textAlign:'center', marginBottom:'clamp(28px,4vw,48px)', opacity:0, transform:'translateY(36px)', transition:'opacity .7s ease, transform .7s ease' }}>
            <span style={badge}>Why Choose Us</span>
            <h2 style={heading('clamp(22px,3.5vw,40px)')}>Benefits of Practicing With Us</h2>
          </div>
          <div className="why-grid">
            {benefits.map((b, i) => <BenefitCard key={i} b={b} delay={i*80} />)}
          </div>
        </div>
      </section>

      {/* Free Video Previews */}
      {videos.length > 0 && (
        <section style={{ padding:'clamp(48px,8vw,80px) 0', background:'#f4faf6' }}>
          <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 clamp(12px,2vw,24px)' }}>
            <div data-reveal data-delay="0" style={{ textAlign:'center', marginBottom:'clamp(28px,4vw,48px)', opacity:0, transform:'translateY(36px)', transition:'opacity .7s ease, transform .7s ease' }}>
              <span style={badge}>Free Preview</span>
              <h2 style={heading('clamp(22px,3.5vw,42px)')}>Sample Yoga Sessions</h2>
              <p style={{ color:'#6b5a3e', fontSize:'clamp(13px,1.5vw,15px)', maxWidth:500, margin:'0 auto', lineHeight:1.7 }}>
                Watch free recorded classes from our expert instructors.
              </p>
            </div>
            <div className="preview-grid">
              {videos.map((v, i) => (
                <VideoCard
                  key={v.id} vid={v} delay={i*80}
                  playing={playingId === v.id}
                  onPlay={() => setPlayingId(v.id)}
                  onEnd={() => setPlayingId(null)}
                />
              ))}
            </div>
            <div data-reveal data-delay="0" style={{ textAlign:'center', marginTop:36, opacity:0, transform:'translateY(36px)', transition:'opacity .7s ease, transform .7s ease' }}>
              <OutlineLink href="/classes">View All Classes →</OutlineLink>
            </div>
          </div>
        </section>
      )}

      {/* Featured Classes */}
      <section style={{ padding:'clamp(48px,8vw,80px) 0', background:'#faf7f2' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 clamp(12px,2vw,24px)' }}>
          <div data-reveal data-delay="0" style={{ textAlign:'center', marginBottom:'clamp(28px,4vw,48px)', opacity:0, transform:'translateY(36px)', transition:'opacity .7s ease, transform .7s ease' }}>
            <span style={badge}>Our Classes</span>
            <h2 style={heading('clamp(22px,3.5vw,44px)')}>
              {classes.length > 0 ? 'Featured Yoga Classes' : 'Classes Coming Soon'}
            </h2>
          </div>

          {loading && !classes.length && (
            <div className="class-grid">
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{ borderRadius:16, overflow:'hidden', background:'#fff' }}>
                  <div style={{ aspectRatio:'16/9', background:'linear-gradient(90deg,#f0e8d0,#e8ddc0,#f0e8d0)', backgroundSize:'200% 100%', animation:'shimmer 1.6s infinite linear' }} />
                  <div style={{ padding:'clamp(14px,2vw,20px)' }}>
                    {[50,80,60].map((w,j) => (
                      <div key={j} style={{ height:10, background:'#f0e8d0', borderRadius:6, marginBottom:10, width:`${w}%`, backgroundSize:'200% 100%', animation:'shimmer 1.6s infinite linear' }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {classes.length > 0 && (
            <div className="class-grid">
              {classes.map((c, i) => <ClassCard key={c.id} cls={c} delay={i*80} />)}
            </div>
          )}

          {!loading && !classes.length && (
            <div data-reveal data-delay="0" style={{ textAlign:'center', padding:'clamp(40px,6vw,60px) 20px', background:'#fff', borderRadius:16, border:'1px solid rgba(76,211,137,.12)', opacity:0, transform:'translateY(36px)', transition:'opacity .7s ease, transform .7s ease' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🧘</div>
              <h3 style={{ color:'#1a1208', marginBottom:8 }}>Classes Coming Soon</h3>
              <p style={{ color:'#6b5a3e', fontSize:14 }}>Our instructors are preparing amazing content!</p>
            </div>
          )}

          {classes.length > 0 && (
            <div data-reveal data-delay="0" style={{ textAlign:'center', marginTop:'clamp(24px,4vw,40px)', opacity:0, transform:'translateY(36px)', transition:'opacity .7s ease, transform .7s ease' }}>
              <ShineLink href="/classes" style={{
                display:'inline-flex', alignItems:'center', gap:8,
                background:'linear-gradient(135deg,#4cd389,#2ea065)', color:'#fff',
                padding:'clamp(12px,1.8vw,14px) clamp(28px,4vw,38px)', borderRadius:50,
                fontWeight:700, fontSize:'clamp(13px,1.5vw,15px)', textDecoration:'none',
                boxShadow:'0 8px 28px rgba(76,211,137,.25)',
              }}>
                Browse All Classes →
              </ShineLink>
            </div>
          )}
        </div>
      </section>

      {/* Premium CTA */}
      <section style={{ padding:'clamp(48px,8vw,80px) 0', background:'#fff' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 clamp(12px,2vw,24px)' }}>
          <div data-reveal data-delay="0" style={{
            background:'linear-gradient(135deg,#005f2b 0%,#2ea065 60%,#4cd389 100%)',
            borderRadius:'clamp(16px,2.5vw,24px)',
            padding:'clamp(28px,5vw,60px) clamp(16px,3vw,48px)',
            textAlign:'center', color:'#fff', position:'relative', overflow:'hidden',
            opacity:0, transform:'translateY(36px)', transition:'opacity .7s ease, transform .7s ease',
          }}>
            <div style={{ position:'absolute', top:-60, right:-60, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,.06)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', bottom:-50, left:-50, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,.04)', pointerEvents:'none' }} />
            <div style={{ position:'relative', zIndex:1 }}>
              <div style={{ fontSize:'clamp(36px,5vw,52px)', marginBottom:16 }}>🧘</div>
              <h2 style={{ fontSize:'clamp(22px,4vw,44px)', fontFamily:'Times New Roman', marginBottom:16, fontWeight:700 }}>
                Begin Your Yoga Journey Today
              </h2>
              <p style={{ color:'rgba(255,255,255,.8)', fontSize:'clamp(13px,1.5vw,16px)', maxWidth:480, margin:'0 auto clamp(24px,4vw,36px)', lineHeight:1.8 }}>
                Start free. Upgrade for unlimited live classes, recordings and personal coaching.
              </p>
              <div style={{ display:'flex', gap:'clamp(8px,1.5vw,14px)', justifyContent:'center', flexWrap:'wrap' }}>
                <ShineLink href={session ? '/classes' : '/auth'} style={{
                  background:'#fff', color:'#005f2b',
                  padding:'clamp(11px,1.6vw,14px) clamp(24px,4vw,38px)', borderRadius:50,
                  fontWeight:700, fontSize:'clamp(13px,1.5vw,15px)', textDecoration:'none',
                  boxShadow:'0 4px 16px rgba(0,0,0,.15)', display:'inline-flex',
                }}>
                  {session ? 'Browse Classes →' : 'Sign Up Free →'}
                </ShineLink>
                <CtaOutlineLink href="/premium">View Premium Plans</CtaOutlineLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ════════════════════════════════════════
   SUB-COMPONENTS
════════════════════════════════════════ */
function StyleTile({ s }) {
  const [h, setH] = useState(false);
  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        textAlign:'center', padding:'clamp(14px,2vw,20px) clamp(8px,1vw,10px)', borderRadius:14,
        background: h ? 'linear-gradient(135deg,rgba(76,211,137,.10),rgba(0,95,43,.06))' : 'linear-gradient(135deg,rgba(76,211,137,.05),rgba(0,95,43,.03))',
        border: h ? '1px solid rgba(76,211,137,.25)' : '1px solid rgba(76,211,137,.10)',
        transform: h ? 'translateY(-4px) scale(1.03)' : 'scale(1)',
        boxShadow: h ? '0 10px 28px rgba(0,95,43,.10)' : 'none',
        transition:'all .32s cubic-bezier(.4,0,.2,1)', cursor:'default',
      }}
    >
      <span style={{ fontSize:'clamp(22px,3vw,30px)', marginBottom:8, display:'block', transform:h?'scale(1.18) rotate(-5deg)':'scale(1)', transition:'transform .35s ease' }}>{s.emoji}</span>
      <h4 style={{ fontSize:'clamp(11px,1.3vw,14px)', fontWeight:700, color:'#1a1208', marginBottom:4 }}>{s.name}</h4>
      <p style={{ fontSize:'clamp(9px,1vw,11px)', color:'#6b5a3e', lineHeight:1.5 }}>{s.desc}</p>
    </div>
  );
}

function BenefitCard({ b, delay }) {
  const [h, setH] = useState(false);
  return (
    <div
      data-reveal data-delay={delay}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        textAlign:'center', padding:'clamp(24px,3.5vw,36px) clamp(16px,2.5vw,24px)',
        background:'linear-gradient(180deg,rgba(76,211,137,.08),#fff)', borderRadius:16,
        border: h ? '1px solid rgba(76,211,137,.2)' : '1px solid rgba(76,211,137,.08)',
        transform: h ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: h ? '0 20px 48px rgba(0,95,43,.10)' : '0 2px 8px rgba(0,0,0,.03)',
        opacity:0,
        transitionProperty:'opacity,transform,box-shadow,border-color',
        transitionDuration:'.7s,.32s,.32s,.32s',
        transitionDelay:`${delay}ms,0ms,0ms,0ms`,
      }}
    >
      <div style={{ fontSize:'clamp(32px,4.5vw,42px)', marginBottom:16, transform:h?'scale(1.12)':'scale(1)', transition:'transform .3s ease', display:'inline-block' }}>{b.icon}</div>
      <h3 style={{ fontSize:'clamp(15px,1.8vw,18px)', fontWeight:700, color:'#1a1208', marginBottom:10, fontFamily:'Times New Roman' }}>{b.title}</h3>
      <p style={{ fontSize:'clamp(12px,1.4vw,14px)', color:'#6b5a3e', lineHeight:1.7 }}>{b.desc}</p>
    </div>
  );
}

function VideoCard({ vid, delay, playing, onPlay, onEnd }) {
  const [h,  setH]  = useState(false);
  const [bh, setBh] = useState(false);
  const em = { HATHA:'🌅',VINYASA:'🌊',ASHTANGA:'🔥',POWER:'⚡',YIN:'🌙',RESTORATIVE:'🌿',KUNDALINI:'✨',PRENATAL:'🤰',KIDS:'🧒',MEDITATION:'🧠',PRANAYAMA:'🌬️' };
  const lv = { BEGINNER:'Beginner',INTERMEDIATE:'Intermediate',ADVANCED:'Advanced',ALL_LEVELS:'All Levels' };
  return (
    <div
      data-reveal data-delay={delay}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        borderRadius:16, overflow:'hidden', background:'#fff', width:'100%',
        boxShadow: h ? '0 18px 48px rgba(0,95,43,.12)' : '0 2px 12px rgba(0,0,0,.05)',
        transform: h ? 'translateY(-6px)' : 'translateY(0)',
        opacity:0,
        transitionProperty:'opacity,transform,box-shadow',
        transitionDuration:'.7s,.32s,.32s',
        transitionDelay:`${delay}ms,0ms,0ms`,
      }}
    >
      <div style={{ position:'relative', background:'#000', aspectRatio:'16/9', overflow:'hidden' }}>
        {playing ? (
          <video src={vid.videoUrl} controls autoPlay
            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
            onEnded={onEnd}
          />
        ) : (
          <>
            {vid.image
              ? <img src={vid.image} alt={vid.title} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#005f2b,#2ea065)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'clamp(36px,5vw,48px)' }}>{em[vid.category]||'🧘'}</div>
            }
            <button onClick={onPlay} onMouseEnter={() => setBh(true)} onMouseLeave={() => setBh(false)} style={{
              position:'absolute', top:'50%', left:'50%',
              transform: bh ? 'translate(-50%,-50%) scale(1.14)' : 'translate(-50%,-50%) scale(1)',
              width:'clamp(44px,5.5vw,56px)', height:'clamp(44px,5.5vw,56px)', borderRadius:'50%',
              background: bh ? 'rgba(46,160,101,.96)' : 'rgba(76,211,137,.90)',
              border:'3px solid #fff', color:'#fff', fontSize:'clamp(16px,2vw,20px)', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow: bh ? '0 8px 32px rgba(76,211,137,.45)' : '0 4px 24px rgba(0,0,0,.28)',
              transition:'transform .2s ease, background .2s ease, box-shadow .2s ease',
            }}>▶</button>
            <span style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,.6)', color:'#fff', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:6 }}>⏱ {vid.duration}m</span>
            <span style={{ position:'absolute', top:8, left:8, background:'#4cd389', color:'#fff', fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:50 }}>✨ FREE</span>
          </>
        )}
      </div>
      <div style={{ padding:'clamp(12px,2vw,18px)' }}>
        <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap' }}>
          <span style={{ fontSize:10, padding:'2px 8px', borderRadius:50, background:'#3b82f615', color:'#3b82f6', fontWeight:700 }}>📹 Recorded</span>
          <span style={{ fontSize:10, padding:'2px 8px', borderRadius:50, background:'#f5efe0', color:'#6b5a3e', fontWeight:600 }}>{lv[vid.level]||vid.level}</span>
        </div>
        <h3 style={{ fontSize:'clamp(14px,1.6vw,16px)', fontWeight:700, color:'#1a1208', marginBottom:4, fontFamily:'Times New Roman' }}>{vid.title}</h3>
        <p style={{ fontSize:12, color:'#2ea065', fontWeight:600 }}>👤 {vid.instructor}</p>
      </div>
    </div>
  );
}

function ClassCard({ cls, delay }) {
  const [h,  setH]  = useState(false);
  const [bh, setBh] = useState(false);
  const live = cls.type === 'LIVE';
  const em = { HATHA:'🌅',VINYASA:'🌊',ASHTANGA:'🔥',POWER:'⚡',YIN:'🌙',RESTORATIVE:'🌿',KUNDALINI:'✨',PRENATAL:'🤰',KIDS:'🧒',MEDITATION:'🧠',PRANAYAMA:'🌬️' };
  const lv = { BEGINNER:'Beginner',INTERMEDIATE:'Intermediate',ADVANCED:'Advanced',ALL_LEVELS:'All Levels' };
  return (
    <div
      data-reveal data-delay={delay}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        borderRadius:16, overflow:'hidden', background:'#fff', width:'100%',
        boxShadow: h ? '0 20px 52px rgba(0,95,43,.13)' : '0 2px 12px rgba(0,0,0,.05)',
        border:'1px solid rgba(0,0,0,.05)',
        transform: h ? 'translateY(-6px)' : 'translateY(0)',
        position:'relative', opacity:0,
        transitionProperty:'opacity,transform,box-shadow',
        transitionDuration:'.7s,.32s,.32s',
        transitionDelay:`${delay}ms,0ms,0ms`,
      }}
    >
      {cls.isPremium && (
        <div style={{ position:'absolute', top:10, right:10, zIndex:2, background:'linear-gradient(135deg,#c49a36,#f0c060)', color:'#fff', fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:50 }}>
          👑 PREMIUM
        </div>
      )}
      <div style={{ aspectRatio:'16/9', overflow:'hidden', background:'#000' }}>
        {cls.image
          ? <img src={cls.image} alt={cls.title} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#005f2b,#2ea065)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'clamp(40px,5vw,52px)' }}>{em[cls.category]||'🧘'}</div>
        }
      </div>
      <div style={{ padding:'clamp(12px,2vw,18px)' }}>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
          <span style={{ fontSize:10, padding:'2px 8px', borderRadius:50, fontWeight:700, background:live?'#ef444412':'#3b82f612', color:live?'#ef4444':'#3b82f6' }}>{live?'🔴 Live':'📹 Recorded'}</span>
          <span style={{ fontSize:10, padding:'2px 8px', borderRadius:50, background:'#f5efe0', color:'#6b5a3e', fontWeight:600 }}>{lv[cls.level]||cls.level}</span>
          <span style={{ fontSize:10, padding:'2px 8px', borderRadius:50, background:'#f5efe0', color:'#6b5a3e', fontWeight:600 }}>⏱ {cls.duration}m</span>
        </div>
        <h3 style={{ fontSize:'clamp(14px,1.7vw,17px)', fontWeight:700, color:'#1a1208', marginBottom:5, fontFamily:'Times New Roman' }}>{cls.title}</h3>
        <p style={{ fontSize:12, color:'#6b5a3e', marginBottom:6, lineHeight:1.6 }}>
          {cls.description ? cls.description.slice(0,75)+(cls.description.length>75?'…':'') : 'Expert-led yoga class.'}
        </p>
        <p style={{ fontSize:12, color:'#2ea065', fontWeight:600, marginBottom:10 }}>👤 {cls.instructor}</p>
        {live && cls.scheduledAt && (
          <div style={{ background:'#f0faf4', borderRadius:8, padding:'4px 10px', fontSize:11, color:'#2d7a4f', marginBottom:10, display:'inline-block' }}>
            📅 {new Date(cls.scheduledAt).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' })}
          </div>
        )}
        <Link href="/classes" onMouseEnter={() => setBh(true)} onMouseLeave={() => setBh(false)} style={{
          display:'block', textAlign:'center',
          background: bh ? 'linear-gradient(135deg,#2ea065,#4cd389)' : 'linear-gradient(135deg,rgba(76,211,137,.10),rgba(36,180,101,.06))',
          color: bh ? '#fff' : '#2ea065',
          padding:'clamp(8px,1.2vw,10px)', borderRadius:10,
          fontSize:'clamp(12px,1.3vw,13px)', fontWeight:700, textDecoration:'none',
          transition:'background .25s ease, color .25s ease',
        }}>
          View Class →
        </Link>
      </div>
    </div>
  );
}

function OutlineLink({ href, children }) {
  const [h, setH] = useState(false);
  return (
    <Link href={href} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      display:'inline-flex', alignItems:'center', gap:8,
      border:'2px solid #2ea065', background: h ? '#2ea065' : 'transparent',
      color: h ? '#fff' : '#2ea065',
      padding:'clamp(10px,1.5vw,12px) clamp(24px,3.5vw,32px)', borderRadius:50,
      fontWeight:700, fontSize:'clamp(12px,1.4vw,14px)', textDecoration:'none',
      transition:'background .25s ease, color .25s ease',
    }}>
      {children}
    </Link>
  );
}

function CtaOutlineLink({ href, children }) {
  const [h, setH] = useState(false);
  return (
    <Link href={href} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      background: h ? 'rgba(255,255,255,.12)' : 'transparent',
      border: h ? '2px solid rgba(255,255,255,.6)' : '2px solid rgba(255,255,255,.4)',
      color:'#fff',
      padding:'clamp(11px,1.6vw,14px) clamp(24px,4vw,38px)', borderRadius:50,
      fontWeight:600, fontSize:'clamp(13px,1.5vw,15px)', textDecoration:'none',
      display:'inline-flex', alignItems:'center',
      transition:'background .25s ease, border-color .25s ease',
    }}>
      {children}
    </Link>
  );
}