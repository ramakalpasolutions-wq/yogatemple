// src/app/about/page.js
'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

/* ── Styles ── */
const STYLES = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}}
  @keyframes countUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes breathe{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(1.08);opacity:1}}
  @keyframes lineGrow{from{width:0}to{width:100%}}

  .about-benefit:hover { transform:translateY(-5px) !important; box-shadow:0 16px 48px rgba(0,95,43,.12) !important; border-color:rgba(76,211,137,.30) !important; }
  .about-style:hover   { transform:scale(1.04) !important; border-color:rgba(76,211,137,.35) !important; background:rgba(76,211,137,.06) !important; }
  .about-inst:hover    { transform:translateY(-6px) !important; box-shadow:0 20px 52px rgba(0,95,43,.14) !important; }
  .about-stat:hover    { transform:translateY(-4px) !important; }
  .about-cta-btn:hover { transform:translateY(-2px) !important; box-shadow:0 12px 32px rgba(0,0,0,.18) !important; }

  @media(max-width:768px){
    .about-grid-2{grid-template-columns:1fr !important;}
    .about-grid-4{grid-template-columns:repeat(2,1fr) !important;}
    .about-grid-3{grid-template-columns:1fr !important;}
    .about-stats {grid-template-columns:repeat(2,1fr) !important;}
    .about-steps {grid-template-columns:1fr !important;}
    .about-hero-h{font-size:clamp(28px,6vw,48px) !important;}
  }
  @media(max-width:480px){
    .about-grid-4{grid-template-columns:1fr !important;}
    .about-stats{grid-template-columns:1fr 1fr !important;}
  }
`;
function useStyles(){
  useEffect(()=>{
    const id='about-styles';
    if(document.getElementById(id))return;
    const el=document.createElement('style');
    el.id=id;el.textContent=STYLES;
    document.head.appendChild(el);
    return()=>{try{document.head.removeChild(el)}catch{}};
  },[]);
}

/* ── Data ── */
const BENEFITS = [
  { icon:'🧠', title:'Mental Clarity',     stat:'72%', statLabel:'report reduced anxiety',  desc:'Yoga regulates the nervous system, reducing cortisol levels and sharpening focus through mindful breathwork and meditation.' },
  { icon:'💪', title:'Physical Strength',  stat:'85%', statLabel:'gain flexibility in 8 weeks', desc:'Progressive postures build lean muscle, improve posture, and develop functional strength that protects joints and supports daily life.' },
  { icon:'❤️', title:'Heart Health',       stat:'40%', statLabel:'lower cardiovascular risk', desc:'Regular practice lowers blood pressure, reduces inflammation, and improves circulation — key markers for long-term heart health.' },
  { icon:'😴', title:'Better Sleep',       stat:'65%', statLabel:'sleep quality improved',  desc:'Evening yoga calms the sympathetic nervous system, regulates melatonin, and reduces the racing thoughts that keep you awake.' },
  { icon:'🌿', title:'Immune System',      stat:'50%', statLabel:'fewer sick days reported', desc:'Yoga stimulates the lymphatic system, reduces oxidative stress, and activates the relaxation response — all boosting immunity.' },
  { icon:'🧘', title:'Inner Peace',        stat:'90%', statLabel:'feel more balanced',       desc:'Through self-awareness, breathwork and philosophy, yoga builds emotional resilience and a lasting sense of inner contentment.' },
];

const STYLES_DATA = [
  { emoji:'🌅', name:'Hatha',      level:'Beginner',     duration:'60 min', desc:'The foundation of all yoga. Slow-paced postures with alignment focus — perfect for newcomers.' },
  { emoji:'🌊', name:'Vinyasa',    level:'Intermediate',  duration:'60 min', desc:'Dynamic sequences linking breath to movement. Builds strength, flexibility and cardiovascular fitness.' },
  { emoji:'🔥', name:'Ashtanga',   level:'Advanced',      duration:'90 min', desc:'A rigorous, structured series of poses practiced in exact sequence. Builds discipline and stamina.' },
  { emoji:'🌙', name:'Yin',        level:'All Levels',    duration:'75 min', desc:'Long-held floor postures targeting deep connective tissue. Deeply relaxing and meditative.' },
  { emoji:'🌿', name:'Restorative',level:'All Levels',    duration:'60 min', desc:'Fully supported postures held for deep rest and healing. Ideal for recovery and stress relief.' },
  { emoji:'🧠', name:'Meditation', level:'All Levels',    duration:'45 min', desc:'Guided mindfulness sessions for mental clarity, emotional regulation and lasting inner calm.' },
  { emoji:'🌬️', name:'Pranayama', level:'All Levels',    duration:'45 min', desc:'Ancient breathing science that energises, calms or balances the body-mind system.' },
  { emoji:'⚡', name:'Power',      level:'Intermediate',  duration:'60 min', desc:'Athletic, high-energy practice combining strength, balance and endurance training.' },
];

const INSTRUCTORS = [
  { name:'Maya Johnson',  role:'Founder & Lead Instructor', exp:'15 years', spec:'Hatha & Pranayama',      emoji:'🧘‍♀️', bio:'Maya founded Yoga Temple after training in Rishikesh. She holds an E-RYT 500 certification and has taught thousands of students across India and abroad.', cert:'E-RYT 500' },
  { name:'Alex Rivera',   role:'Senior Instructor',         exp:'12 years', spec:'Vinyasa & Power',       emoji:'🏋️', bio:'Alex brings an athletic approach to yoga, blending strength training with fluid movement. Former professional athlete turned dedicated yogi.', cert:'RYT 300' },
  { name:'Priya Sharma',  role:'Specialist Instructor',     exp:'10 years', spec:'Yin & Prenatal',        emoji:'🌸', bio:'Priya specialises in restorative practices and is a certified prenatal yoga instructor with deep expertise in therapeutic applications.', cert:'RPYT Certified' },
  { name:'Rohan Verma',   role:'Meditation Teacher',        exp:'8 years',  spec:'Meditation & Mindfulness', emoji:'🧠', bio:'Rohan trained in Vipassana and brings deep wisdom to his mindfulness sessions. He spent 3 years in silent retreat studying with Himalayan masters.', cert:'MBSR Trained' },
];

const RESULTS = [
  { icon:'📉', title:'Reduces Stress', body:'Yoga reduces cortisol by up to 30% after just 8 weeks of consistent practice, according to Harvard Medical School research.' },
  { icon:'🩺', title:'Improves Posture', body:'Corrects spinal misalignments and strengthens the core, reducing back pain in 80% of practitioners within 12 weeks.' },
  { icon:'🧬', title:'Anti-Aging', body:'Regular yoga practice slows cellular aging by protecting telomeres — the DNA caps that shorten with stress and inflammation.' },
  { icon:'⚖️', title:'Weight Balance', body:'Mindful movement and reduced cortisol help regulate appetite hormones, supporting healthy weight management naturally.' },
  { icon:'🫁', title:'Lung Capacity', body:'Pranayama techniques increase lung capacity by up to 15%, improving oxygen delivery to every cell in the body.' },
  { icon:'🧘', title:'Neuroplasticity', body:'MRI studies show yoga practitioners have more gray matter in brain regions controlling attention, awareness, and compassion.' },
];

const JOURNEY_STEPS = [
  { n:1, icon:'🎯', title:'Choose Your Style',   desc:'Explore our 11 yoga categories and find the style that resonates with your goals and personality.' },
  { n:2, icon:'📅', title:'Book Your Session',   desc:'Join a live Google Meet class or access recorded sessions anytime that fits your schedule.' },
  { n:3, icon:'🧘', title:'Practice Consistently', desc:'Our instructors guide you through a progressive journey that deepens with every class.' },
  { n:4, icon:'✨', title:'Transform',            desc:'Experience lasting changes in your body, mind and spirit that ripple into every area of life.' },
];

const STATS = [
  { value:'5,000+', label:'Happy Practitioners', icon:'👥' },
  { value:'200+',   label:'Live Classes/Month',  icon:'🔴' },
  { value:'11',     label:'Yoga Styles',          icon:'🧘' },
  { value:'4.9★',   label:'Average Rating',       icon:'⭐' },
  { value:'2018',   label:'Founded',              icon:'📅' },
  { value:'E-RYT',  label:'Certified Teachers',   icon:'🏅' },
];

/* ── Animated counter ── */
function CounterStat({ value, label, icon, delay=0 }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(()=>{
    const io = new IntersectionObserver(([e])=>{ if(e.isIntersecting) setVisible(true); },{threshold:.2});
    if(ref.current) io.observe(ref.current);
    return()=>io.disconnect();
  },[]);
  return (
    <div ref={ref} className="about-stat" style={{
      textAlign:'center', padding:'clamp(18px,3vw,28px) 16px',
      background:'#fff', borderRadius:16, border:'1px solid #c8e6d4',
      boxShadow:'0 2px 8px rgba(0,95,43,.05)',
      animation: visible ? `countUp .5s ease ${delay}ms both` : 'none',
      opacity: visible ? 1 : 0, transition:'transform .25s, box-shadow .25s',
    }}>
      <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
      <div style={{ fontSize:'clamp(20px,3.5vw,28px)', fontWeight:800, color:'#005f2b', fontFamily:'Times New Roman', lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:11, color:'#9a8a6a', marginTop:6, fontWeight:500, lineHeight:1.3 }}>{label}</div>
    </div>
  );
}

/* ── Section reveal ── */
function useReveal() {
  useEffect(()=>{
    const els = document.querySelectorAll('[data-reveal]');
    const io = new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          e.target.style.opacity='1'; e.target.style.transform='translateY(0)';
          io.unobserve(e.target);
        }
      });
    },{threshold:.12,rootMargin:'0px 0px -40px 0px'});
    els.forEach(el=>io.observe(el));
    return()=>io.disconnect();
  });
}

const badge = { display:'inline-block', background:'linear-gradient(135deg,rgba(76,211,137,.14),rgba(36,180,101,.09))', color:'#2ea065', borderRadius:50, padding:'5px 18px', fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:14 };
const heading = (size='clamp(28px,4vw,44px)') => ({ fontSize:size, fontFamily:'Times New Roman', color:'#1a1208', fontWeight:700, marginBottom:14, lineHeight:1.15 });
const reveal = (delay=0) => ({ opacity:0, transform:'translateY(28px)', transition:`opacity .65s ease ${delay}ms, transform .65s ease ${delay}ms` });

export default function AboutPage() {
  useStyles();
  useReveal();
  const [activeStyle, setActiveStyle] = useState(0);

  return (
    <>
      {/* ══ HERO ══ */}
      <div style={{
        background:'linear-gradient(135deg,#005f2b 0%,#2ea065 55%,#4cd389 100%)',
        padding:'clamp(100px,14vw,140px) 0 clamp(60px,8vw,80px)',
        textAlign:'center', position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:-80, right:'5%', width:320, height:320, borderRadius:'50%', background:'rgba(255,255,255,.05)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-60, left:'8%', width:240, height:240, borderRadius:'50%', background:'rgba(255,255,255,.04)', pointerEvents:'none' }} />

        <div style={{ maxWidth:860, margin:'0 auto', padding:'0 24px', position:'relative', zIndex:1 }}>
          <span style={{ display:'inline-block', background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.20)', color:'#fff', borderRadius:50, padding:'5px 20px', fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:20 }}>
         About YOGA
          </span>
          <h1 className="about-hero-h" style={{
            fontSize:'clamp(32px,6.5vw,68px)',
            fontFamily:'Times New Roman', color:'#fff', fontWeight:700,
            marginBottom:18, textShadow:'0 4px 28px rgba(0,0,0,.18)', lineHeight:1.08,
          }}>
            About <em style={{ fontStyle:'normal', color:'rgba(255,255,255,.75)' }}>Yoga Temple</em>
          </h1>
          <p style={{ fontSize:'clamp(15px,1.8vw,18px)', color:'rgba(255,255,255,.80)', maxWidth:560, margin:'0 auto 36px', lineHeight:1.75 }}>
            A sanctuary born from passion, built on tradition, powered by community.
          </p>
          
        </div>
      </div>

      {/* ══ MISSION ══ */}
      <section style={{ background:'#faf7f2', padding:'clamp(56px,8vw,90px) 0' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 clamp(12px,3vw,24px)' }}>
          <div className="about-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'clamp(32px,5vw,72px)', alignItems:'center' }}>
            <div data-reveal style={reveal(0)}>
              <span style={badge}>Our Mission</span>
              <h2 style={heading()}>A Sanctuary for Every Soul</h2>
              <p style={{ color:'#6b5a3e', lineHeight:1.9, marginBottom:16, fontSize:16 }}>
                Founded in 2018, Yoga Temple was born from a deep conviction that yoga's transformative power should be accessible to everyone — regardless of age, fitness level, or schedule.
              </p>
              <p style={{ color:'#6b5a3e', lineHeight:1.9, marginBottom:24, fontSize:16 }}>
                We've built a digital sanctuary where ancient wisdom meets modern convenience. Our live Google Meet sessions bring the energy of a studio class to your home, while our growing library of recorded content lets you practice on your own terms.
              </p>
              <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                {[{icon:'🌏',label:'100% Online'},{icon:'🔴',label:'Live Classes'},{icon:'📹',label:'On Demand'}].map(b=>(
                  <div key={b.label} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(76,211,137,.08)', border:'1px solid rgba(76,211,137,.20)', borderRadius:50, padding:'6px 14px', fontSize:12, fontWeight:600, color:'#005f2b' }}>
                    <span>{b.icon}</span>{b.label}
                  </div>
                ))}
              </div>
            </div>
            <div data-reveal style={{ ...reveal(120), borderRadius:20, overflow:'hidden', boxShadow:'0 12px 48px rgba(0,95,43,.12)' }}>
              <img
                src="https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&h=600&fit=crop"
                alt="Yoga studio" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
              />
            </div>
          </div>
        </div>
      </section>

     
      {/* ══ WHAT IS YOGA ══ */}
      <section style={{ background:'#f4faf6', padding:'clamp(56px,8vw,90px) 0' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 clamp(12px,3vw,24px)' }}>
          <div data-reveal style={{ textAlign:'center', marginBottom:56, ...reveal(0) }}>
            <span style={badge}>The Ancient Science</span>
            <h2 style={heading()}>What is Yoga?</h2>
            <p style={{ color:'#6b5a3e', fontSize:16, maxWidth:680, margin:'0 auto', lineHeight:1.8 }}>
              Yoga is a 5,000-year-old holistic system originating in ancient India. The word "yoga" means union — the union of body, mind and spirit. Far more than physical exercise, yoga is a complete science of life.
            </p>
          </div>

          {/* 4 pillars */}
          <div className="about-grid-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, marginBottom:56 }}>
            {[
              { icon:'🤸', title:'Asana',     subtitle:'Physical Postures', desc:'Systematic movement of the body to build strength, flexibility, balance and body awareness.' },
              { icon:'🌬️', title:'Pranayama', subtitle:'Breath Control',    desc:'Ancient techniques for controlling life-force energy through breathing patterns and rhythms.' },
              { icon:'📖', title:'Philosophy', subtitle:'Yogic Wisdom',      desc:'Eight-limbed path (Ashtanga) guiding ethical living, self-discipline and spiritual growth.' },
              { icon:'🧘', title:'Dhyana',    subtitle:'Meditation',         desc:'Training the mind to achieve clarity, concentration and inner stillness through focused awareness.' },
            
            ].map((p,i) => (
              <div key={p.title} data-reveal style={{
                ...reveal(i*80), background:'#fff', borderRadius:18,
                padding:'clamp(20px,3vw,28px) clamp(16px,2.5vw,24px)',
                border:'1px solid #c8e6d4', textAlign:'center',
                boxShadow:'0 2px 8px rgba(0,95,43,.04)',
              }}>
                <div style={{ fontSize:40, marginBottom:14, animation:'float 4s ease-in-out infinite', display:'inline-block' }}>{p.icon}</div>
                <h3 style={{ fontSize:'clamp(16px,2vw,20px)', fontWeight:700, color:'#005f2b', fontFamily:'Times New Roman', marginBottom:4 }}>{p.title}</h3>
                <div style={{ fontSize:11, fontWeight:600, color:'#9a8a6a', letterSpacing:1, textTransform:'uppercase', marginBottom:10 }}>{p.subtitle}</div>
                <p style={{ fontSize:13, color:'#6b5a3e', lineHeight:1.7 }}>{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Science section */}
          <div className="about-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'clamp(24px,4vw,56px)', alignItems:'center' }}>
            <div data-reveal style={reveal(0)}>
              <span style={badge}>Science-Backed</span>
              <h2 style={heading('clamp(24px,3.5vw,38px)')}>Why Yoga Works</h2>
              <p style={{ color:'#6b5a3e', lineHeight:1.85, marginBottom:16, fontSize:15 }}>
                Modern science now confirms what yogis have known for millennia. Neuroimaging studies show yoga physically changes the brain — increasing grey matter in regions governing attention, awareness and compassion while shrinking the amygdala (the brain's fear centre).
              </p>
              <p style={{ color:'#6b5a3e', lineHeight:1.85, fontSize:15 }}>
                The combination of movement, controlled breathing and meditation activates the parasympathetic nervous system, reduces cortisol, and creates measurable improvements in mental and physical health within just 8 weeks.
              </p>
            </div>
            <div className="about-grid-2" data-reveal style={{ ...reveal(100), display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                { label:'Child Brain Improvement (Knowledge Improvement)',  val:'75%', bg:'rgba(76,211,137,.08)'  },
                { label:'Stress Relief',        val:'85%', bg:'rgba(59,130,246,.08)'  },
                { label:'Sleep Improvement',    val:'65%', bg:'rgba(139,92,246,.08)'  },
                { label:'Pain Reduction',       val:'70%', bg:'rgba(239,68,68,.08)'   },
              ].map(s => (
                <div key={s.label} style={{ background:s.bg, borderRadius:14, padding:'18px 14px', textAlign:'center', border:'1px solid #c8e6d4' }}>
                  <div style={{ fontSize:'clamp(24px,3.5vw,32px)', fontWeight:800, color:'#005f2b', fontFamily:'Times New Roman' }}>{s.val}</div>
                  <div style={{ fontSize:15, color:'#9a8a6a', fontWeight:600, lineHeight:1.3, marginTop:4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ BENEFITS ══ */}
      <section style={{ background:'#fff', padding:'clamp(56px,8vw,90px) 0' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 clamp(12px,3vw,24px)' }}>
          <div data-reveal style={{ textAlign:'center', marginBottom:56, ...reveal(0) }}>
            <span style={badge}>Health Benefits</span>
            <h2 style={heading()}>What Yoga Does For You</h2>
            <p style={{ color:'#6b5a3e', fontSize:16, maxWidth:600, margin:'0 auto', lineHeight:1.8 }}>
              Evidence-based benefits reported by thousands of practitioners across studies from Harvard, Oxford and leading research institutions worldwide.
            </p>
          </div>
          <div className="about-grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
            {BENEFITS.map((b,i) => (
              <div key={b.title} className="about-benefit" data-reveal style={{
                ...reveal(i*60),
                background:'linear-gradient(180deg,rgba(76,211,137,.06),#fff)',
                borderRadius:18, padding:'clamp(20px,3vw,28px)',
                border:'1px solid rgba(76,211,137,.10)',
                boxShadow:'0 2px 8px rgba(0,0,0,.04)',
                transition:'all .28s cubic-bezier(.4,0,.2,1)', cursor:'default',
              }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                  <span style={{ fontSize:36, flexShrink:0, display:'inline-block' }}>{b.icon}</span>
                  <div>
                    <h3 style={{ fontSize:'clamp(15px,1.8vw,18px)', fontWeight:700, color:'#1a1208', marginBottom:5, fontFamily:'Times New Roman' }}>{b.title}</h3>
                    <div style={{ display:'inline-flex', alignItems:'baseline', gap:5, background:'rgba(76,211,137,.08)', padding:'3px 10px', borderRadius:50, marginBottom:10 }}>
                      <span style={{ fontSize:18, fontWeight:800, color:'#2ea065' }}>{b.stat}</span>
                      <span style={{ fontSize:10, color:'#6b5a3e' }}>{b.statLabel}</span>
                    </div>
                    <p style={{ fontSize:13, color:'#6b5a3e', lineHeight:1.7 }}>{b.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ REAL RESULTS ══ */}
      <section style={{ background:'#f4faf6', padding:'clamp(56px,8vw,90px) 0' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 clamp(12px,3vw,24px)' }}>
          <div data-reveal style={{ textAlign:'center', marginBottom:52, ...reveal(0) }}>
            <span style={badge}>Research-Backed</span>
            <h2 style={heading()}>Real Results, Proven Science</h2>
          </div>
          <div className="about-grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18 }}>
            {RESULTS.map((r,i) => (
              <div key={r.title} data-reveal style={{
                ...reveal(i*60), background:'#fff', borderRadius:16, padding:'22px 20px',
                border:'1px solid #c8e6d4', boxShadow:'0 2px 8px rgba(0,95,43,.04)',
              }}>
                <div style={{ fontSize:32, marginBottom:12 }}>{r.icon}</div>
                <h3 style={{ fontSize:16, fontWeight:700, color:'#005f2b', marginBottom:8, fontFamily:'Times New Roman' }}>{r.title}</h3>
                <p style={{ fontSize:13, color:'#6b5a3e', lineHeight:1.7 }}>{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ YOGA STYLES ══ */}
      <section style={{ background:'#fff', padding:'clamp(56px,8vw,90px) 0' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 clamp(12px,3vw,24px)' }}>
          <div data-reveal style={{ textAlign:'center', marginBottom:48, ...reveal(0) }}>
            <span style={badge}>Our Curriculum</span>
            <h2 style={heading()}>Yoga Styles We Teach</h2>
            <p style={{ color:'#6b5a3e', fontSize:16, maxWidth:560, margin:'0 auto', lineHeight:1.8 }}>
              Eight distinct styles, each offering a unique path to wellness. Click to explore.
            </p>
          </div>

          {/* Style selector */}
          <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:4, marginBottom:28, scrollbarWidth:'none' }}>
            {STYLES_DATA.map((s,i) => (
              <button key={s.name} onClick={() => setActiveStyle(i)} style={{
                display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
                borderRadius:50, border:'none', cursor:'pointer', fontFamily:'inherit',
                background: activeStyle===i ? 'linear-gradient(135deg,#4cd389,#2ea065)' : 'rgba(76,211,137,.06)',
                color: activeStyle===i ? '#fff' : '#6b5a3e',
                fontSize:13, fontWeight: activeStyle===i ? 700 : 500, flexShrink:0,
                boxShadow: activeStyle===i ? '0 4px 16px rgba(76,211,137,.28)' : 'none',
                border: activeStyle===i ? 'none' : '1px solid #c8e6d4',
                transition:'all .22s ease',
              }}>
                <span>{s.emoji}</span>{s.name}
              </button>
            ))}
          </div>

          {/* Active style detail */}
          <div style={{
            background:'linear-gradient(135deg,rgba(76,211,137,.07),rgba(0,95,43,.03))',
            border:'1px solid rgba(76,211,137,.20)',
            borderRadius:20, padding:'clamp(24px,4vw,40px)',
            display:'flex', gap:'clamp(20px,3vw,40px)', alignItems:'center', flexWrap:'wrap',
            animation:'fadeUp .3s ease both',
            minHeight:160,
          }}>
            <div style={{ fontSize:'clamp(48px,8vw,72px)', animation:'breathe 4s ease-in-out infinite', display:'inline-block' }}>
              {STYLES_DATA[activeStyle].emoji}
            </div>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:10 }}>
                <h3 style={{ fontSize:'clamp(20px,3vw,28px)', fontFamily:'Times New Roman', color:'#005f2b', fontWeight:700, margin:0 }}>
                  {STYLES_DATA[activeStyle].name} Yoga
                </h3>
                <span style={{ fontSize:11, fontWeight:700, background:'rgba(0,95,43,.08)', color:'#005f2b', padding:'3px 10px', borderRadius:50, alignSelf:'center' }}>
                  {STYLES_DATA[activeStyle].level}
                </span>
                <span style={{ fontSize:11, fontWeight:600, background:'#f5efe0', color:'#6b5a3e', padding:'3px 10px', borderRadius:50, alignSelf:'center' }}>
                  ⏱ {STYLES_DATA[activeStyle].duration}
                </span>
              </div>
              <p style={{ fontSize:15, color:'#6b5a3e', lineHeight:1.8, margin:0 }}>
                {STYLES_DATA[activeStyle].desc}
              </p>
            </div>
            <Link href="/classes" style={{
              display:'inline-flex', alignItems:'center', gap:6,
              background:'linear-gradient(135deg,#005f2b,#2ea065)', color:'#fff',
              padding:'11px 22px', borderRadius:50, fontSize:13, fontWeight:700,
              textDecoration:'none', boxShadow:'0 4px 14px rgba(0,95,43,.22)', flexShrink:0,
            }}>
              Try This Style →
            </Link>
          </div>

          {/* Style grid */}
          <div className="about-grid-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginTop:20 }}>
            {STYLES_DATA.map((s,i) => (
              <div key={s.name} className="about-style"
                onClick={() => setActiveStyle(i)}
                style={{
                  padding:'18px 12px', borderRadius:14, textAlign:'center', cursor:'pointer',
                  border: activeStyle===i ? '2px solid #2ea065' : '1px solid #c8e6d4',
                  background: activeStyle===i ? 'rgba(76,211,137,.07)' : '#fff',
                  transition:'all .22s ease',
                  boxShadow:'0 2px 6px rgba(0,0,0,.04)',
                }}
              >
                <div style={{ fontSize:26, marginBottom:6 }}>{s.emoji}</div>
                <div style={{ fontSize:13, fontWeight:700, color: activeStyle===i ? '#005f2b' : '#1a1208', marginBottom:3 }}>{s.name}</div>
                <div style={{ fontSize:10, color:'#9a8a6a', fontWeight:500 }}>{s.level}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ YOUR JOURNEY ══ */}
      <section style={{ background:'#f4faf6', padding:'clamp(56px,8vw,90px) 0' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 clamp(12px,3vw,24px)' }}>
          <div data-reveal style={{ textAlign:'center', marginBottom:52, ...reveal(0) }}>
            <span style={badge}>Your Path</span>
            <h2 style={heading()}>How Your Journey Unfolds</h2>
            <p style={{ color:'#6b5a3e', fontSize:16, maxWidth:520, margin:'0 auto', lineHeight:1.8 }}>
              From first class to lasting transformation — here's what to expect.
            </p>
          </div>
          <div className="about-steps" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'clamp(16px,2.5vw,28px)', position:'relative' }}>
            {/* Connecting line (desktop) */}
            <div style={{ position:'absolute', top:36, left:'12.5%', right:'12.5%', height:2, background:'linear-gradient(90deg,#4cd389,#2ea065,#4cd389)', borderRadius:1, zIndex:0 }} />
            {JOURNEY_STEPS.map((s,i) => (
              <div key={s.n} data-reveal style={{
                ...reveal(i*80), textAlign:'center',
                background:'#fff', borderRadius:18, padding:'clamp(20px,3vw,30px) clamp(14px,2vw,20px)',
                border:'1px solid #c8e6d4', boxShadow:'0 2px 8px rgba(0,95,43,.04)',
                position:'relative', zIndex:1,
              }}>
                <div style={{
                  width:52, height:52, borderRadius:'50%', margin:'0 auto 16px',
                  background:'linear-gradient(135deg,#4cd389,#2ea065)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:22, boxShadow:'0 4px 16px rgba(0,95,43,.22)',
                }}>
                  {s.icon}
                </div>
                <div style={{ fontSize:10, fontWeight:700, color:'#9a8a6a', letterSpacing:1.5, textTransform:'uppercase', marginBottom:6 }}>Step {s.n}</div>
                <h3 style={{ fontSize:16, fontWeight:700, color:'#1a1208', marginBottom:8, fontFamily:'Times New Roman' }}>{s.title}</h3>
                <p style={{ fontSize:13, color:'#6b5a3e', lineHeight:1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

     

      {/* ══ CTA ══ */}
      <section style={{
        background:'linear-gradient(135deg,#005f2b 0%,#2ea065 60%,#4cd389 100%)',
        padding:'clamp(56px,8vw,90px) 0', textAlign:'center', position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,.06)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-50, left:-50, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,.04)', pointerEvents:'none' }} />
        <div style={{ maxWidth:720, margin:'0 auto', padding:'0 24px', position:'relative', zIndex:1 }}>
          <div style={{ fontSize:52, marginBottom:18, animation:'float 3s ease-in-out infinite', display:'inline-block' }}>🧘</div>
          <h2 style={{ fontSize:'clamp(24px,4.5vw,44px)', fontFamily:'Times New Roman', color:'#fff', marginBottom:14, fontWeight:700 }}>
            Ready to Begin Your Yoga Journey?
          </h2>
          <p style={{ color:'rgba(255,255,255,.80)', fontSize:'clamp(14px,1.6vw,17px)', marginBottom:32, lineHeight:1.8, maxWidth:500, margin:'0 auto 32px' }}>
            Join thousands of practitioners already transforming their lives — body, mind and soul.
          </p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/auth" className="about-cta-btn" style={{
              display:'inline-flex', alignItems:'center', gap:8,
              background:'#fff', color:'#005f2b',
              padding:'clamp(12px,1.8vw,15px) clamp(24px,4vw,36px)',
              borderRadius:50, fontSize:'clamp(13px,1.5vw,15px)', fontWeight:700,
              textDecoration:'none', boxShadow:'0 6px 20px rgba(0,0,0,.15)',
              transition:'all .25s ease',
            }}>
              Start Free Today →
            </Link>
            <Link href="/classes" className="about-cta-btn" style={{
              display:'inline-flex', alignItems:'center', gap:8,
              background:'rgba(255,255,255,.12)', color:'#fff',
              border:'1.5px solid rgba(255,255,255,.35)',
              padding:'clamp(12px,1.8vw,15px) clamp(24px,4vw,36px)',
              borderRadius:50, fontSize:'clamp(13px,1.5vw,15px)', fontWeight:600,
              textDecoration:'none', transition:'all .25s ease',
            }}>
              Explore Classes
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}