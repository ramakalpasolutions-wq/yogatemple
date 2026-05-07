// src/app/premium/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';

const CATEGORIES = [
  { value:'HATHA',       label:'Hatha',       emoji:'🌅', desc:'Gentle & foundational'  },
  { value:'VINYASA',     label:'Vinyasa',     emoji:'🌊', desc:'Dynamic flow'            },
  { value:'ASHTANGA',    label:'Ashtanga',    emoji:'🔥', desc:'Structured & powerful'   },
  { value:'POWER',       label:'Power',       emoji:'⚡', desc:'Strength building'       },
  { value:'YIN',         label:'Yin',         emoji:'🌙', desc:'Deep stretching'         },
  { value:'RESTORATIVE', label:'Restorative', emoji:'🌿', desc:'Healing & rest'          },
  { value:'KUNDALINI',   label:'Kundalini',   emoji:'✨', desc:'Energy awakening'        },
  { value:'PRENATAL',    label:'Prenatal',    emoji:'🤰', desc:'Safe for pregnancy'      },
  { value:'KIDS',        label:'Kids',        emoji:'🧒', desc:'Fun for children'        },
  { value:'MEDITATION',  label:'Meditation',  emoji:'🧠', desc:'Mindfulness & calm'      },
  { value:'PRANAYAMA',   label:'Pranayama',   emoji:'🌬️', desc:'Breathing techniques'   },
];

const lvlDisp = {
  BEGINNER:'Beginner', INTERMEDIATE:'Intermediate',
  ADVANCED:'Advanced', ALL_LEVELS:'All Levels',
};

const C = {
  bg:'#faf7f2', bgAlt:'#f4faf6', card:'#ffffff',
  border:'#c8e6d4', accent:'#005f2b', mid:'#2ea065',
  light:'#4cd389', pale:'rgba(76,211,137,0.10)',
  text:'#1a1208', muted:'#6b5a3e', dim:'#9a8a6a',
  gold:'#c49a36', goldLight:'#f0c060', red:'#ef4444',
  orange:'#f59e0b',
};

const KF = `
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes checkPop{0%{transform:scale(0);opacity:0}60%{transform:scale(1.2);opacity:1}100%{transform:scale(1);opacity:1}}
  @keyframes stepPulse{0%,100%{box-shadow:0 0 0 0 rgba(76,211,137,.35)}50%{box-shadow:0 0 0 10px rgba(76,211,137,0)}}
  @keyframes floatEmoji{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes glowPulse{0%,100%{box-shadow:0 0 20px rgba(76,211,137,.15)}50%{box-shadow:0 0 40px rgba(76,211,137,.35)}}
  @keyframes cardFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes ribbonShine{0%{left:-75%}100%{left:125%}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
  @keyframes slideInUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
  @keyframes enquiryPop{0%{transform:scale(0);opacity:0}60%{transform:scale(1.15);opacity:1}100%{transform:scale(1);opacity:1}}

  @media(max-width:900px){
    .prem-plans-grid{grid-template-columns:1fr 1fr !important;}
  }
  @media(max-width:600px){
    .prem-plans-grid{grid-template-columns:1fr !important;}
    .prem-cat-grid{grid-template-columns:repeat(auto-fill,minmax(100px,1fr)) !important;gap:10px !important;}
    .prem-hero-title{font-size:32px !important;}
    .prem-step-label{display:none !important;}
    .prem-payment-card{margin:0 -8px !important;}
  }
  @media(max-width:380px){
    .prem-cat-grid{grid-template-columns:repeat(3,1fr) !important;}
  }
`;

function useKF() {
  useEffect(() => {
    const id = 'prem-kf';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id; el.textContent = KF;
    document.head.appendChild(el);
    return () => { try { document.head.removeChild(el); } catch {} };
  }, []);
}

function loadRzp() {
  return new Promise(resolve => {
    if (typeof window !== 'undefined' && window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/* ══════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════ */
export default function PremiumPage() {
  useKF();
  const { data:session, status, update:updateSession } = useSession();
  const router = useRouter();

  /* ── Subscription state ── */
  const subscription    = session?.user?.subscription ?? null;
  const isActive        = subscription?.isActive === true &&
                          subscription?.endDate &&
                          new Date(subscription.endDate) > new Date();
  const userCategory    = subscription?.category?.toUpperCase() ?? null;
  /* planName from session (set by NextAuth callback) or fallback to plan enum */
  const planDisplayName = subscription?.planName || subscription?.plan || 'Premium';
  const subCatData      = CATEGORIES.find(c => c.value === userCategory);

  const [step,          setStep]          = useState('category');
  const [selCategory,   setSelCategory]   = useState('');
  const [selPlan,       setSelPlan]       = useState(null);
  const [paying,        setPaying]        = useState(false);
  const [plans,         setPlans]         = useState([]);
  const [loadingPlans,  setLoadingPlans]  = useState(true);
  /* Store verify response for success screens */
  const [verifyData,    setVerifyData]    = useState(null);

  const fetchPlans = useCallback(async () => {
    try {
      setLoadingPlans(true);
      const r = await axios.get('/api/admin/pricing');
      setPlans(r.data);
    } catch { toast.error('Failed to load plans'); }
    finally { setLoadingPlans(false); }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  /* ── Payment handler ── */
  const handleSubscribe = async () => {
    if (!session) { router.push('/auth'); return; }
    if (!selCategory && selPlan?.planType !== 'ENQUIRY') {
      toast.error('Please select a category first'); return;
    }
    if (!selPlan) { toast.error('Please select a plan'); return; }

    setPaying(true);
    try {
      const ok = await loadRzp();
      if (!ok) { toast.error('Payment gateway failed to load'); setPaying(false); return; }

      const { data } = await axios.post('/api/payment/create-order', {
        plan:     selPlan.key,
        category: selCategory || null,
        planType: selPlan.planType,
      });

      const catLabel = CATEGORIES.find(c => c.value === selCategory)?.label || '';
      const desc = selPlan.planType === 'ENQUIRY'
        ? `${selPlan.name} — Enquiry Registration`
        : `${selPlan.name} — ${catLabel} Yoga`;

      const rzp = new window.Razorpay({
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      data.amount,
        currency:    data.currency,
        name:        'Yoga Temple',
        description: desc,
        order_id:    data.orderId,
        prefill:     { name: session.user.name, email: session.user.email },
        theme:       { color: '#2ea065' },

        handler: async resp => {
          try {
            const verifyRes = await axios.post('/api/payment/verify', {
              ...resp,
              plan:     selPlan.key,
              category: selCategory || null,
              planType: selPlan.planType,
            });

            const resData = verifyRes.data;
            setVerifyData(resData);

            toast.success(resData.message || '🎉 Payment successful!');

            if (resData.type === 'ENQUIRY') {
              setStep('enquiry-success');
            } else {
              setStep('success');
              /* Force session refresh — retry twice with delay */
              await updateSession();
              setTimeout(() => updateSession(), 2000);
            }
          } catch (e) {
            toast.error(e.response?.data?.error || 'Payment verification failed');
            setPaying(false);
          }
        },

        modal: { ondismiss: () => setPaying(false) },
      });

      rzp.on('payment.failed', r => {
        toast.error(r.error?.description || 'Payment failed');
        setPaying(false);
      });

      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
      setPaying(false);
    }
  };

  const selectedCatData = CATEGORIES.find(c => c.value === selCategory);

  /* ── Loading ── */
  if (status === 'loading') {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:C.bg }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:56, marginBottom:16, animation:'floatEmoji 2s ease-in-out infinite' }}>🧘</div>
          <p style={{ color:C.dim, fontSize:15 }}>Loading your experience…</p>
        </div>
      </div>
    );
  }

  /* ── Already subscribed ── */
  if (isActive && userCategory) {
    const catData = CATEGORIES.find(c => c.value === userCategory);
    return (
      <SubscribedView
        catData={catData}
        subscription={subscription}
        planDisplayName={planDisplayName}
        session={session}
      />
    );
  }

  /* ── Enquiry success ── */
  if (step === 'enquiry-success') {
    return <EnquirySuccessView plan={selPlan} verifyData={verifyData} />;
  }

  /* ── Subscription success ── */
  if (step === 'success') {
    return (
      <SuccessView
        catData={selectedCatData}
        plan={selPlan}
        verifyData={verifyData}
      />
    );
  }

  const stepNum = step === 'category' ? 1 : step === 'plan' ? 2 : 3;

  return (
    <>
      {/* ══ HERO ══ */}
      <div style={{
        background:'linear-gradient(135deg,#0a3d2e 0%,#005f2b 30%,#2ea065 70%,#4cd389 100%)',
        padding:'clamp(100px,14vw,150px) 0 clamp(50px,7vw,70px)',
        textAlign:'center', position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:-100, left:'5%', width:350, height:350, borderRadius:'50%', background:'rgba(255,255,255,.04)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-80, right:'8%', width:280, height:280, borderRadius:'50%', background:'rgba(255,255,255,.03)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'20%', right:'15%', width:120, height:120, borderRadius:'50%', background:'rgba(76,211,137,.08)', pointerEvents:'none', animation:'floatEmoji 6s ease-in-out infinite' }} />
        <div style={{ position:'absolute', bottom:'25%', left:'12%', width:80, height:80, borderRadius:'50%', background:'rgba(255,215,140,.06)', pointerEvents:'none', animation:'floatEmoji 8s ease-in-out 1s infinite' }} />

        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', position:'relative', zIndex:1 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:8,
            background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.22)',
            borderRadius:50, padding:'6px 22px', marginBottom:24,
            backdropFilter:'blur(10px)',
          }}>
            <span style={{ fontSize:16 }}>👑</span>
            <span style={{ color:'#fff', fontSize:12, fontWeight:700, letterSpacing:2.5, textTransform:'uppercase' }}>
              Premium Membership
            </span>
          </div>

          <h1 className="prem-hero-title" style={{
            fontSize:'clamp(34px,6.5vw,68px)', fontFamily:'Times New Roman',
            color:'#fff', marginBottom:18, lineHeight:1.08,
            textShadow:'0 4px 40px rgba(0,0,0,.25)',
          }}>
            Unlock Your{' '}
            <em style={{ color:'rgba(255,215,140,.85)', fontStyle:'normal' }}>Full Potential</em>
          </h1>

          <p style={{
            fontSize:'clamp(14px,1.8vw,18px)', color:'rgba(255,255,255,.78)',
            maxWidth:540, margin:'0 auto 40px', lineHeight:1.7,
          }}>
            Choose your yoga style, pick a plan, and get unlimited access to premium classes, live sessions & expert guidance.
          </p>

          {/* Step indicator */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
            {[
              { n:1, label:'Choose Category', icon:'📚' },
              { n:2, label:'Select Plan',     icon:'💎' },
              { n:3, label:'Subscribe',       icon:'🚀' },
            ].map((s, i) => {
              const done   = stepNum > s.n;
              const active = stepNum === s.n;
              return (
                <div key={s.n} style={{ display:'flex', alignItems:'center' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <div style={{
                      width:42, height:42, borderRadius:'50%',
                      background: done ? 'rgba(255,255,255,.95)' : active ? 'rgba(255,255,255,.20)' : 'rgba(255,255,255,.06)',
                      border: active ? '2.5px solid rgba(255,255,255,.85)' : done ? '2px solid rgba(255,255,255,.5)' : '1.5px solid rgba(255,255,255,.15)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize: done ? 16 : 15, fontWeight:800,
                      color: done ? C.accent : active ? '#fff' : 'rgba(255,255,255,.30)',
                      animation: active ? 'stepPulse 2.5s infinite' : 'none',
                      transition:'all .35s',
                      boxShadow: done ? '0 4px 16px rgba(0,95,43,.25)' : 'none',
                    }}>
                      {done ? '✓' : s.icon}
                    </div>
                    <span className="prem-step-label" style={{
                      fontSize:10, fontWeight:700, whiteSpace:'nowrap',
                      color: active ? '#fff' : done ? 'rgba(255,255,255,.80)' : 'rgba(255,255,255,.30)',
                      transition:'color .3s',
                    }}>
                      {s.label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div style={{
                      width:'clamp(30px,5vw,70px)', height:2.5, margin:'0 6px', marginBottom:22,
                      borderRadius:2,
                      background: done ? 'rgba(255,255,255,.60)' : 'rgba(255,255,255,.10)',
                      transition:'background .4s',
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══ STEP 1: CATEGORY ══ */}
      {step === 'category' && (
        <section style={{ background:C.bg, padding:'clamp(40px,6vw,70px) 0 clamp(50px,7vw,80px)' }}>
          <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 24px' }}>
            <div style={{ textAlign:'center', marginBottom:40, animation:'fadeUp .5s ease' }}>
              <span style={{
                display:'inline-block', background:C.pale,
                color:C.mid, borderRadius:50, padding:'5px 18px',
                fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:14,
              }}>
                Step 1 of 3
              </span>
              <h2 style={{ fontSize:'clamp(24px,4vw,42px)', fontFamily:'Times New Roman', color:C.text, marginBottom:10 }}>
                Which Yoga Style Calls to You?
              </h2>
              <p style={{ color:C.muted, fontSize:'clamp(13px,1.5vw,15px)', maxWidth:500, margin:'0 auto', lineHeight:1.7 }}>
                Select the category you want to subscribe to. Your premium access will be exclusive to this style.
              </p>
            </div>

            <div className="prem-cat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:14 }}>
              {CATEGORIES.map((cat, idx) => (
                <CategoryTile
                  key={cat.value} cat={cat} idx={idx}
                  selected={selCategory===cat.value}
                  onSelect={() => setSelCategory(cat.value)}
                />
              ))}
            </div>

            <div style={{ textAlign:'center', marginTop:40 }}>
              {selCategory && (
                <div style={{
                  display:'inline-flex', alignItems:'center', gap:10,
                  background:'rgba(76,211,137,.07)', border:`1.5px solid ${C.border}`,
                  borderRadius:14, padding:'12px 22px', marginBottom:22,
                  fontSize:14, color:C.muted, animation:'scaleIn .3s ease',
                }}>
                  <span style={{ fontSize:24 }}>{selectedCatData?.emoji}</span>
                  <span>You selected: <strong style={{ color:C.accent }}>{selectedCatData?.label} Yoga</strong></span>
                  <span style={{ width:22, height:22, borderRadius:'50%', background:'linear-gradient(135deg,#4cd389,#2ea065)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#fff', fontWeight:800 }}>✓</span>
                </div>
              )}
              <br />
              <GreenBtn
                label="Continue to Plans →"
                disabled={!selCategory}
                onClick={() => selCategory ? setStep('plan') : toast.error('Please select a yoga category')}
              />
            </div>
          </div>
        </section>
      )}

      {/* ══ STEP 2: PLAN ══ */}
      {step === 'plan' && (
        <section style={{ background:C.bg, padding:'clamp(40px,6vw,70px) 0 clamp(50px,7vw,80px)' }}>
          <div style={{ maxWidth:1500, margin:'0 auto', padding:'0 24px' }}>

            <div style={{
              display:'flex', alignItems:'center', gap:16,
              marginBottom:40, flexWrap:'wrap', animation:'fadeUp .4s ease',
            }}>
              <BackBtn onClick={() => setStep('category')} />
              <div style={{ flex:1, minWidth:200 }}>
                <span style={{
                  display:'inline-block', background:C.pale, color:C.mid,
                  borderRadius:50, padding:'4px 14px', fontSize:10, fontWeight:700,
                  letterSpacing:2, textTransform:'uppercase', marginBottom:6,
                }}>
                  Step 2 of 3
                </span>
                <h2 style={{
                  fontSize:'clamp(22px,4vw,40px)', fontFamily:'Times New Roman',
                  color:C.text, margin:0, lineHeight:1.2,
                }}>
                  Choose Your Plan
                </h2>
              </div>
              <div style={{
                display:'flex', alignItems:'center', gap:8,
                background:'rgba(76,211,137,.07)',
                border:`1.5px solid ${C.border}`,
                borderRadius:12, padding:'10px 18px', flexShrink:0,
              }}>
                <span style={{ fontSize:22 }}>{selectedCatData?.emoji}</span>
                <div>
                  <p style={{ fontSize:10, color:C.dim, margin:0, fontWeight:600, textTransform:'uppercase', letterSpacing:.5 }}>Category</p>
                  <p style={{ fontSize:14, color:C.accent, margin:0, fontWeight:700 }}>{selectedCatData?.label} Yoga</p>
                </div>
              </div>
            </div>

            <div style={{ textAlign:'center', marginBottom:36, animation:'fadeUp .5s ease .1s both' }}>
              <p style={{ color:C.muted, fontSize:'clamp(13px,1.5vw,15px)', maxWidth:520, margin:'0 auto', lineHeight:1.7 }}>
                Pick the perfect plan for your yoga journey. All plans include full access to{' '}
                <strong style={{ color:C.mid }}>{selectedCatData?.label}</strong> premium content.
              </p>
            </div>

            {/* Plans grid */}
            {loadingPlans ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:20 }}>
                {[1,2,3].map(i => <PlanSkeleton key={i} />)}
              </div>
            ) : plans.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:20, border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:52, marginBottom:16 }}>📭</div>
                <h3 style={{ color:C.text, fontFamily:'Times New Roman', marginBottom:8 }}>No Plans Available</h3>
                <p style={{ color:C.dim, fontSize:14 }}>Plans are being set up. Please check back soon!</p>
              </div>
            ) : (
              <div
                className="prem-plans-grid"
                style={{
                  display:'grid',
                  gridTemplateColumns: plans.length <= 3
                    ? `repeat(${plans.length}, 1fr)`
                    : 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap:'clamp(16px,2.5vw,24px)',
                  maxWidth: plans.length <= 3 ? 1000 : 1200,
                  margin:'0 auto',
                }}
              >
                {plans.map((plan, idx) => (
                  <PlanCard
                    key={plan.key} plan={plan} idx={idx}
                    selected={selPlan?.key===plan.key}
                    onSelect={() => {
                      setSelPlan(plan);
                      /* For ENQUIRY plans, clear category requirement */
                      if (plan.planType === 'ENQUIRY') setSelCategory('ENQUIRY');
                    }}
                    totalPlans={plans.length}
                  />
                ))}
              </div>
            )}

            {/* What's included */}
            {selPlan && (
              <div style={{
                marginTop:36, animation:'slideInUp .4s ease',
                background:'#fff', borderRadius:18,
                border:`1.5px solid ${selPlan.planType === 'ENQUIRY' ? 'rgba(245,158,11,.3)' : C.border}`,
                padding:'clamp(20px,3vw,32px)',
                maxWidth:700, margin:'36px auto 0',
                boxShadow:'0 4px 20px rgba(0,95,43,.06)',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, flexWrap:'wrap' }}>
                  <span style={{ fontSize:28 }}>{selPlan.icon || (selPlan.planType === 'ENQUIRY' ? '📋' : '🧘')}</span>
                  <div style={{ flex:1 }}>
                    <h3 style={{ fontSize:18, fontWeight:700, color:C.text, margin:0, fontFamily:'Times New Roman' }}>
                      {selPlan.name}
                      {selPlan.planType === 'ENQUIRY' && (
                        <span style={{ fontSize:11, marginLeft:8, color:C.orange, fontWeight:600, fontFamily:'inherit' }}>
                          📋 Enquiry Plan
                        </span>
                      )}
                    </h3>
                    {selPlan.planType === 'ENQUIRY' && (
                      <p style={{ fontSize:12, color:C.dim, margin:'4px 0 0', lineHeight:1.5 }}>
                        One-time registration fee. Our team will contact you to discuss course details.
                      </p>
                    )}
                    {selPlan.durationDays && selPlan.planType !== 'ENQUIRY' && (
                      <p style={{ fontSize:12, color:C.mid, margin:'4px 0 0', fontWeight:600 }}>
                        ✅ {selPlan.durationDays} days of premium access
                      </p>
                    )}
                  </div>
                  <div style={{
                    fontSize:'clamp(22px,3vw,30px)', fontWeight:800,
                    color: selPlan.planType === 'ENQUIRY' ? C.orange : C.accent,
                    fontFamily:'Times New Roman',
                  }}>
                    ₹{selPlan.price?.toLocaleString()}
                    <span style={{ fontSize:12, color:C.dim, fontWeight:500 }}> {selPlan.period}</span>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:10 }}>
                  {(selPlan.features || []).map((f, i) => (
                    <div key={i} style={{
                      display:'flex', alignItems:'center', gap:10,
                      padding:'10px 14px', borderRadius:10,
                      background: selPlan.planType === 'ENQUIRY' ? 'rgba(245,158,11,.04)' : 'rgba(76,211,137,.04)',
                      border:`1px solid ${selPlan.planType === 'ENQUIRY' ? 'rgba(245,158,11,.10)' : 'rgba(76,211,137,.10)'}`,
                    }}>
                      <span style={{
                        width:22, height:22, borderRadius:'50%', flexShrink:0,
                        background: selPlan.planType === 'ENQUIRY'
                          ? 'linear-gradient(135deg,#f59e0b,#fbbf24)'
                          : 'linear-gradient(135deg,#4cd389,#2ea065)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:10, color:'#fff', fontWeight:800,
                      }}>✓</span>
                      <span style={{ fontSize:13, color:C.muted, fontWeight:500 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <PreviewClasses category={selCategory !== 'ENQUIRY' ? selCategory : ''} />

            <div style={{ textAlign:'center', marginTop:44 }}>
              {selPlan && (
                <p style={{ fontSize:13, color:C.dim, marginBottom:16, animation:'fadeIn .3s ease' }}>
                  Selected: <strong style={{ color: selPlan.planType === 'ENQUIRY' ? C.orange : C.accent }}>
                    {selPlan.icon} {selPlan.name}
                  </strong> · ₹{selPlan.price?.toLocaleString()} {selPlan.period}
                </p>
              )}
              <GreenBtn
                label={selPlan ? `Continue with ${selPlan.name} →` : 'Select a Plan Above'}
                disabled={!selPlan}
                onClick={() => selPlan ? setStep('payment') : toast.error('Please select a plan')}
              />
            </div>
          </div>
        </section>
      )}

      {/* ══ STEP 3: PAYMENT ══ */}
      {step === 'payment' && (
        <section style={{ background:C.bg, padding:'clamp(40px,6vw,70px) 0 clamp(50px,7vw,80px)' }}>
          <div className="prem-payment-card" style={{ maxWidth:560, margin:'0 auto', padding:'0 24px' }}>
            <BackBtn onClick={() => setStep('plan')} label="← Back to Plans" />

            <div style={{
              background:C.card, borderRadius:22,
              border:`1px solid ${selPlan?.planType === 'ENQUIRY' ? 'rgba(245,158,11,.3)' : C.border}`,
              boxShadow:'0 12px 40px rgba(0,95,43,.10)',
              overflow:'hidden', marginTop:20,
              animation:'slideInUp .4s ease',
            }}>
              {/* Header */}
              <div style={{
                background: selPlan?.planType === 'ENQUIRY'
                  ? 'linear-gradient(135deg,#92400e,#f59e0b)'
                  : 'linear-gradient(135deg,#0a3d2e,#2ea065)',
                padding:'clamp(20px,3vw,28px) clamp(22px,3.5vw,32px)',
                position:'relative', overflow:'hidden',
              }}>
                <div style={{ position:'absolute', top:-40, right:-40, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,.05)', pointerEvents:'none' }} />
                <div style={{ position:'absolute', bottom:-20, left:-20, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,.08)', pointerEvents:'none' }} />

                <div style={{
                  display:'inline-flex', alignItems:'center', gap:8,
                  background:'rgba(255,255,255,.15)', borderRadius:50,
                  padding:'4px 14px', marginBottom:16,
                  fontSize:11, fontWeight:700, color:'#fff', letterSpacing:1.5,
                }}>
                  {selPlan?.planType === 'ENQUIRY' ? '📋 ENQUIRY REGISTRATION' : '👑 ORDER SUMMARY'}
                </div>
                <h2 style={{ color:'#fff', fontSize:'clamp(20px,3vw,24px)', fontFamily:'Times New Roman', margin:0, marginBottom:6 }}>
                  {selPlan?.name}
                </h2>
                <p style={{ color:'rgba(255,255,255,.70)', fontSize:13, margin:0 }}>
                  {selPlan?.planType === 'ENQUIRY'
                    ? 'One-time registration · Admin will contact you'
                    : `${selectedCatData?.emoji} ${selectedCatData?.label} Yoga · ${selPlan?.durationDays ? selPlan.durationDays + ' days' : selPlan?.period}`
                  }
                </p>
              </div>

              <div style={{ padding:'clamp(20px,3vw,28px) clamp(22px,3.5vw,32px)' }}>

                {/* Details rows */}
                {selPlan?.planType === 'ENQUIRY' ? (
                  /* Enquiry details */
                  [
                    ['📋 Plan Type', 'Enquiry / Registration'],
                    ['📦 Plan',      selPlan?.name],
                    ['💰 Amount',   `₹${selPlan?.price?.toLocaleString()}`],
                    ['📞 After Pay', 'Admin contacts you within 24h'],
                  ].map(([label, val]) => (
                    <div key={label} style={{
                      display:'flex', justifyContent:'space-between', alignItems:'center',
                      padding:'11px 0', borderBottom:`1px solid ${C.border}`, fontSize:13,
                    }}>
                      <span style={{ color:C.dim }}>{label}</span>
                      <span style={{ color:C.text, fontWeight:700 }}>{val}</span>
                    </div>
                  ))
                ) : (
                  /* Subscription details */
                  [
                    ['📚 Category', `${selectedCatData?.emoji} ${selectedCatData?.label} Yoga`],
                    ['📦 Plan',     selPlan?.name],
                    ['📅 Duration', selPlan?.durationDays ? `${selPlan.durationDays} days` : selPlan?.period?.replace('/','')],
                    ['💰 Amount',  `₹${selPlan?.price?.toLocaleString()}`],
                  ].map(([label, val]) => (
                    <div key={label} style={{
                      display:'flex', justifyContent:'space-between', alignItems:'center',
                      padding:'11px 0', borderBottom:`1px solid ${C.border}`, fontSize:13,
                    }}>
                      <span style={{ color:C.dim }}>{label}</span>
                      <span style={{ color:C.text, fontWeight:700 }}>{val}</span>
                    </div>
                  ))
                )}

                {/* Features */}
                {(selPlan?.features || []).length > 0 && (
                  <div style={{ marginTop:18, marginBottom:22 }}>
                    <p style={{ fontSize:11, fontWeight:700, color:C.dim, letterSpacing:1, textTransform:'uppercase', marginBottom:12 }}>
                      ✨ WHAT YOU GET
                    </p>
                    {(selPlan?.features || []).map((f, i) => (
                      <div key={i} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
                        <span style={{ color: selPlan.planType === 'ENQUIRY' ? C.orange : C.mid, fontWeight:800, flexShrink:0 }}>✓</span>
                        <span style={{ fontSize:13, color:C.muted }}>{f}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Enquiry notice */}
                {selPlan?.planType === 'ENQUIRY' && (
                  <div style={{
                    marginTop:16, marginBottom:22, padding:'14px 16px',
                    borderRadius:12, background:'rgba(245,158,11,.06)',
                    border:'1px solid rgba(245,158,11,.20)',
                  }}>
                    <p style={{ fontSize:12, color:'#92400e', margin:0, lineHeight:1.6, fontWeight:600 }}>
                      📋 This is a registration/enquiry fee.
                    </p>
                    <p style={{ fontSize:11, color:'#78350f', margin:'4px 0 0', lineHeight:1.6 }}>
                      After payment, our team will contact you within 24 hours to discuss course details, schedule, and enrollment.
                    </p>
                  </div>
                )}

                {/* Total */}
                <div style={{
                  background: selPlan?.planType === 'ENQUIRY'
                    ? 'linear-gradient(135deg,rgba(245,158,11,.08),rgba(245,158,11,.04))'
                    : 'linear-gradient(135deg,rgba(76,211,137,.06),rgba(0,95,43,.03))',
                  border:`1.5px solid ${selPlan?.planType === 'ENQUIRY' ? 'rgba(245,158,11,.25)' : C.border}`,
                  borderRadius:16, padding:'18px 22px',
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  marginBottom:22,
                }}>
                  <span style={{ fontWeight:700, color:C.text, fontSize:16 }}>Total Due</span>
                  <span style={{
                    fontFamily:'Times New Roman',
                    fontSize:'clamp(28px,4vw,36px)', fontWeight:700,
                    color: selPlan?.planType === 'ENQUIRY' ? C.orange : C.accent,
                  }}>
                    ₹{selPlan?.price?.toLocaleString()}
                  </span>
                </div>

                <PayBtn paying={paying} onClick={handleSubscribe} plan={selPlan} />

                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:14, opacity:.45 }}>
                  <span style={{ fontSize:12 }}>🔒</span>
                  <span style={{ fontSize:11, color:C.muted }}>Secured by Razorpay · {selPlan?.planType === 'ENQUIRY' ? 'Instant confirmation' : 'Instant activation'}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════
   PLAN CARD
══════════════════════════════════════════════════════ */
function PlanCard({ plan, selected, onSelect, idx }) {
  const [hov, setHov] = useState(false);
  const highlight  = selected;
  const isEnquiry  = plan.planType === 'ENQUIRY';
  const delay      = idx * 100;

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius:22, position:'relative', cursor:'pointer',
        overflow:'hidden',
        background: highlight
          ? isEnquiry
            ? 'linear-gradient(145deg,#92400e,#b45309,#f59e0b)'
            : 'linear-gradient(145deg,#0a3d2e,#005f2b,#2ea065)'
          : '#fff',
        border: highlight
          ? isEnquiry ? '2px solid #fbbf24' : '2px solid #4cd389'
          : hov
            ? isEnquiry ? `2px solid ${C.orange}` : `2px solid ${C.mid}`
            : `1.5px solid ${C.border}`,
        boxShadow: highlight
          ? isEnquiry
            ? '0 20px 60px rgba(245,158,11,.30), inset 0 1px 0 rgba(255,255,255,.1)'
            : '0 20px 60px rgba(0,95,43,.28), inset 0 1px 0 rgba(255,255,255,.1)'
          : hov ? '0 16px 44px rgba(0,95,43,.12)' : '0 4px 16px rgba(0,95,43,.06)',
        transform: highlight ? 'scale(1.02)' : hov ? 'translateY(-6px)' : 'none',
        transition:'all .3s cubic-bezier(.4,0,.2,1)',
        animation:`slideInUp .5s ease ${delay}ms both`,
      }}
    >
      {/* Top accent bar */}
      <div style={{
        height:4,
        background: highlight
          ? isEnquiry
            ? 'linear-gradient(90deg,#f59e0b,#fbbf24,#f59e0b)'
            : 'linear-gradient(90deg,#4cd389,#ffd78c,#4cd389)'
          : isEnquiry
            ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
            : 'linear-gradient(90deg,#4cd389,#2ea065)',
        backgroundSize:'200% 100%',
        animation: highlight ? 'shimmer 3s linear infinite' : 'none',
      }} />

      {/* Enquiry badge */}
      {isEnquiry && (
        <div style={{
          position:'absolute', top:16, left:16, zIndex:2,
          background: highlight ? 'rgba(255,255,255,.2)' : 'rgba(245,158,11,.12)',
          color: highlight ? '#fff' : C.orange,
          fontSize:9, fontWeight:800, padding:'3px 8px',
          borderRadius:50, letterSpacing:.5,
          border: `1px solid ${highlight ? 'rgba(255,255,255,.3)' : 'rgba(245,158,11,.25)'}`,
        }}>
          📋 ENQUIRY
        </div>
      )}

      {/* Selected / badge */}
      {(selected || plan.badge) && (
        <div style={{
          position:'absolute', top:16, right:16, zIndex:2,
          background: selected
            ? isEnquiry
              ? 'linear-gradient(135deg,#fbbf24,#f59e0b)'
              : 'linear-gradient(135deg,#4cd389,#2ea065)'
            : 'linear-gradient(135deg,#ffd78c,#c49a36)',
          color: selected ? (isEnquiry ? '#1a1208' : '#fff') : '#1a1208',
          fontSize:10, fontWeight:800, padding:'4px 12px',
          borderRadius:50, letterSpacing:.5,
          boxShadow:'0 4px 12px rgba(0,0,0,.15)',
          animation: selected ? 'scaleIn .3s ease' : 'none',
        }}>
          {selected ? '✓ Selected' : plan.badge}
        </div>
      )}

      <div style={{ padding:'clamp(22px,3vw,30px) clamp(18px,2.5vw,24px)', paddingTop: isEnquiry ? 'clamp(38px,4vw,46px)' : 'clamp(22px,3vw,30px)' }}>

        {/* Icon */}
        <div style={{
          width:56, height:56, borderRadius:16, marginBottom:16,
          background: highlight
            ? 'rgba(255,255,255,.15)'
            : isEnquiry ? 'rgba(245,158,11,.08)' : 'rgba(76,211,137,.08)',
          border: highlight ? '1px solid rgba(255,255,255,.15)' : `1px solid ${C.border}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:28, transition:'transform .3s',
          transform: hov ? 'scale(1.1) rotate(-5deg)' : 'scale(1)',
        }}>
          {plan.icon || (isEnquiry ? '📋' : '🧘')}
        </div>

        {/* Name */}
        <h3 style={{
          fontSize:'clamp(18px,2vw,22px)', fontWeight:700, marginBottom:6,
          color: highlight ? '#fff' : C.text,
          fontFamily:'Times New Roman',
        }}>
          {plan.name}
        </h3>

        {/* Duration badge (for CATEGORY_DAYS) */}
        {!isEnquiry && plan.durationDays && (
          <div style={{
            display:'inline-flex', alignItems:'center', gap:5,
            marginBottom:10,
            background: highlight ? 'rgba(255,255,255,.15)' : 'rgba(76,211,137,.08)',
            border: highlight ? '1px solid rgba(255,255,255,.2)' : `1px solid rgba(76,211,137,.2)`,
            borderRadius:50, padding:'3px 12px', fontSize:11, fontWeight:700,
            color: highlight ? '#fff' : C.mid,
          }}>
            📅 {plan.durationDays} days access
          </div>
        )}

        {/* Category badge */}
        {!isEnquiry && plan.planCategory && plan.planCategory !== 'ALL' && (
          <div style={{
            display:'inline-flex', alignItems:'center', gap:5,
            marginBottom:10, marginLeft:6,
            background: highlight ? 'rgba(255,255,255,.12)' : 'rgba(59,130,246,.06)',
            border: highlight ? '1px solid rgba(255,255,255,.15)' : '1px solid rgba(59,130,246,.2)',
            borderRadius:50, padding:'3px 10px', fontSize:10, fontWeight:600,
            color: highlight ? '#fff' : '#3b82f6',
          }}>
            🎯 {plan.planCategory}
          </div>
        )}

        {/* Price */}
        <div style={{ display:'flex', alignItems:'baseline', gap:5, marginBottom:20 }}>
          <span style={{
            fontFamily:'Times New Roman',
            fontSize:'clamp(34px,5vw,48px)', fontWeight:700,
            color: highlight ? '#fff' : isEnquiry ? C.orange : C.accent,
            lineHeight:1,
          }}>
            ₹{plan.price?.toLocaleString()}
          </span>
          <span style={{
            color: highlight ? 'rgba(255,255,255,.50)' : C.dim,
            fontSize:13, fontWeight:500,
          }}>
            {plan.period}
          </span>
        </div>

        {/* Divider */}
        <div style={{
          height:1.5, borderRadius:1,
          background: highlight
            ? 'linear-gradient(90deg,rgba(255,255,255,.08),rgba(255,255,255,.20),rgba(255,255,255,.08))'
            : `linear-gradient(90deg,transparent,${C.border},transparent)`,
          marginBottom:18,
        }} />

        {/* Features */}
        <ul style={{ listStyle:'none', margin:0, padding:0, marginBottom:20 }}>
          {(plan.features || []).slice(0,6).map((f, i) => (
            <li key={i} style={{
              display:'flex', alignItems:'center', gap:10,
              marginBottom:10, fontSize:13,
              color: highlight ? 'rgba(255,255,255,.82)' : C.muted,
            }}>
              <span style={{
                width:18, height:18, borderRadius:'50%', flexShrink:0,
                background: highlight
                  ? 'rgba(255,255,255,.20)'
                  : isEnquiry ? 'rgba(245,158,11,.12)' : 'rgba(76,211,137,.10)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:9, fontWeight:800,
                color: highlight ? '#fff' : isEnquiry ? C.orange : C.mid,
              }}>✓</span>
              {f}
            </li>
          ))}
          {(plan.features || []).length > 6 && (
            <li style={{ fontSize:11, color: highlight ? 'rgba(255,255,255,.5)' : C.dim, paddingLeft:28 }}>
              +{plan.features.length - 6} more…
            </li>
          )}
        </ul>

        {/* Select button */}
        <div style={{
          padding:'12px', borderRadius:12, textAlign:'center',
          fontWeight:700, fontSize:14, letterSpacing:.3,
          background: highlight
            ? 'rgba(255,255,255,.15)'
            : hov
              ? isEnquiry
                ? 'linear-gradient(135deg,#f59e0b,#fbbf24)'
                : 'linear-gradient(135deg,#4cd389,#2ea065)'
              : isEnquiry ? 'rgba(245,158,11,.08)' : 'rgba(76,211,137,.08)',
          color: highlight ? '#fff' : hov ? (isEnquiry ? '#1a1208' : '#fff') : isEnquiry ? C.orange : C.mid,
          border: highlight
            ? '1.5px solid rgba(255,255,255,.25)'
            : hov ? 'none'
            : isEnquiry ? '1.5px solid rgba(245,158,11,.25)' : `1.5px solid ${C.border}`,
          transition:'all .25s', cursor:'pointer',
        }}>
          {selected ? '✅ Selected' : isEnquiry ? '📋 Register Enquiry' : 'Select This Plan'}
        </div>
      </div>
    </div>
  );
}

/* ── Plan skeleton ── */
function PlanSkeleton() {
  return (
    <div style={{ borderRadius:22, overflow:'hidden', background:'#fff', border:`1.5px solid ${C.border}` }}>
      <div style={{ height:4, background:'linear-gradient(90deg,#e8f5ee,#c8e6d4,#e8f5ee)', backgroundSize:'200% 100%', animation:'shimmer 1.6s infinite' }} />
      <div style={{ padding:28 }}>
        <div style={{ width:56, height:56, borderRadius:16, background:'linear-gradient(90deg,#e8f5ee,#d4ede0,#e8f5ee)', backgroundSize:'200% 100%', animation:'shimmer 1.6s infinite', marginBottom:16 }} />
        {[60,40,80,50].map((w,i) => (
          <div key={i} style={{ height:12, borderRadius:6, marginBottom:12, width:`${w}%`, background:'linear-gradient(90deg,#e8f5ee,#d4ede0,#e8f5ee)', backgroundSize:'200% 100%', animation:'shimmer 1.6s infinite' }} />
        ))}
        <div style={{ height:44, borderRadius:12, marginTop:20, background:'linear-gradient(90deg,#e8f5ee,#d4ede0,#e8f5ee)', backgroundSize:'200% 100%', animation:'shimmer 1.6s infinite' }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SUBSCRIBED VIEW — shows real plan name + days
══════════════════════════════════════════════════════ */
function SubscribedView({ catData, subscription, planDisplayName, session }) {
  const [navHov, setNavHov] = useState('');

  const endDateStr  = subscription?.endDate
    ? new Date(subscription.endDate).toLocaleDateString('en-IN', { dateStyle:'long' })
    : null;
  const startDateStr = subscription?.startDate
    ? new Date(subscription.startDate).toLocaleDateString('en-IN', { dateStyle:'medium' })
    : null;
  const daysLeft = subscription?.endDate
    ? Math.max(0, Math.ceil((new Date(subscription.endDate) - new Date()) / (1000*60*60*24)))
    : null;
  const totalDays = (subscription?.startDate && subscription?.endDate)
    ? Math.ceil((new Date(subscription.endDate) - new Date(subscription.startDate)) / (1000*60*60*24))
    : null;
  const progressPct = (totalDays && daysLeft !== null)
    ? Math.round(((totalDays - daysLeft) / totalDays) * 100)
    : 0;

  return (
    <>
      <div style={{
        background:'linear-gradient(135deg,#0a3d2e 0%,#005f2b 30%,#2ea065 70%,#4cd389 100%)',
        padding:'clamp(100px,14vw,150px) 0 clamp(60px,8vw,80px)',
        textAlign:'center', position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:-80, left:'10%', width:300, height:300, borderRadius:'50%', background:'rgba(255,255,255,.04)', pointerEvents:'none' }} />
        <div style={{ maxWidth:800, margin:'0 auto', padding:'0 24px', position:'relative', zIndex:1 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:8,
            background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.25)',
            color:'#fff', borderRadius:50, padding:'6px 22px',
            marginBottom:24, fontSize:12, fontWeight:700,
            animation:'glowPulse 3s ease-in-out infinite',
          }}>
            ✅ Active Premium Member
          </div>
          <div style={{ fontSize:'clamp(56px,10vw,88px)', marginBottom:16, animation:'floatEmoji 3s ease-in-out infinite' }}>
            {catData?.emoji}
          </div>
          <h1 style={{ fontSize:'clamp(28px,5vw,54px)', fontFamily:'Times New Roman', color:'#fff', marginBottom:12, lineHeight:1.1 }}>
            Welcome back, <em style={{ color:'rgba(255,215,140,.85)', fontStyle:'normal' }}>{session?.user?.name?.split(' ')[0]}</em>!
          </h1>
          <p style={{ fontSize:'clamp(14px,1.8vw,17px)', color:'rgba(255,255,255,.72)', maxWidth:460, margin:'0 auto', lineHeight:1.7 }}>
            You have premium access to <strong style={{ color:'#fff' }}>{catData?.label} Yoga</strong> classes.
          </p>
        </div>
      </div>

      <section style={{ background:'#faf7f2', padding:'clamp(40px,6vw,70px) 0' }}>
        <div style={{ maxWidth:700, margin:'0 auto', padding:'0 24px' }}>

          {/* Plan card */}
          <div style={{
            background:'#fff', borderRadius:20,
            border:`1px solid ${C.border}`,
            boxShadow:'0 8px 32px rgba(0,95,43,.08)',
            overflow:'hidden', marginBottom:32,
          }}>
            <div style={{ height:4, background:'linear-gradient(90deg,#4cd389,#2ea065,#005f2b)' }} />
            <div style={{ padding:'24px 28px' }}>

              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:22, flexWrap:'wrap' }}>
                <div style={{
                  width:56, height:56, borderRadius:14, flexShrink:0,
                  background:'linear-gradient(135deg,rgba(76,211,137,.15),rgba(0,95,43,.08))',
                  border:`1.5px solid ${C.border}`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:28,
                }}>
                  {catData?.emoji}
                </div>
                <div style={{ flex:1 }}>
                  <h2 style={{ fontSize:20, fontWeight:700, color:C.text, margin:0, fontFamily:'Times New Roman' }}>
                    👑 {planDisplayName}
                  </h2>
                  <p style={{ fontSize:13, color:C.dim, margin:'4px 0 0' }}>
                    {catData?.label} Yoga — Premium Subscription
                  </p>
                </div>
                <span style={{
                  fontSize:11, fontWeight:700, padding:'4px 14px', borderRadius:50,
                  background:'rgba(76,211,137,.10)', color:C.mid,
                }}>
                  ● Active
                </span>
              </div>

              {/* Info rows */}
              {[
                ['📚 Category',  `${catData?.emoji} ${catData?.label} Yoga`],
                ['📦 Plan',      planDisplayName],  /* ← real plan name */
                ['📅 Started',   startDateStr || '—'],
                ['📅 Expires',   endDateStr || '—'],
                ['⏳ Remaining', daysLeft !== null ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''}` : '—'],
              ].map(([label, val]) => (
                <div key={label} style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'10px 0', borderBottom:`1px solid ${C.border}`, fontSize:13,
                }}>
                  <span style={{ color:C.dim }}>{label}</span>
                  <span style={{ color:C.text, fontWeight:700 }}>{val}</span>
                </div>
              ))}

              {/* Progress bar */}
              {totalDays && daysLeft !== null && (
                <div style={{ marginTop:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <span style={{ fontSize:11, color:C.dim }}>Plan usage</span>
                    <span style={{ fontSize:11, color:C.mid, fontWeight:700 }}>{progressPct}% used</span>
                  </div>
                  <div style={{ height:6, borderRadius:3, background:'rgba(76,211,137,.12)', overflow:'hidden' }}>
                    <div style={{
                      height:'100%', width:`${progressPct}%`,
                      background: daysLeft <= 7
                        ? 'linear-gradient(90deg,#ef4444,#f87171)'
                        : 'linear-gradient(90deg,#4cd389,#2ea065)',
                      borderRadius:3, transition:'width 1s ease',
                    }} />
                  </div>
                </div>
              )}

              {/* Expiry warning */}
              {daysLeft !== null && daysLeft <= 7 && (
                <div style={{
                  marginTop:14, padding:'10px 16px', borderRadius:10,
                  background:'rgba(239,68,68,.05)', border:'1px solid rgba(239,68,68,.15)',
                  fontSize:12, color:C.red, fontWeight:600, textAlign:'center',
                }}>
                  ⚠️ Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}. Renew soon!
                </div>
              )}
            </div>
          </div>

          {/* Navigation cards */}
          <h3 style={{ fontSize:18, fontFamily:'Times New Roman', color:C.text, marginBottom:20, textAlign:'center', fontWeight:700 }}>
            Go to Your {catData?.label} Content
          </h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:16, marginBottom:28 }}>
            <NavCard icon="🧘" title={`${catData?.label} Classes`} desc="Browse all your premium classes" href="/classes" gradientFrom="#005f2b" gradientTo="#2ea065" hov={navHov==='classes'} onHov={v => setNavHov(v?'classes':'')} />
            <NavCard icon="📅" title="Live Schedule" desc={`Upcoming ${catData?.label} sessions`} href="/schedule" gradientFrom="#2ea065" gradientTo="#4cd389" hov={navHov==='schedule'} onHov={v => setNavHov(v?'schedule':'')} />
          </div>

          <div style={{ display:'flex', justifyContent:'center', gap:14, flexWrap:'wrap' }}>
            {[
              { href:'/dashboard', icon:'👤', label:'My Profile' },
              { href:'/contact',   icon:'📧', label:'Support'    },
            ].map(link => (
              <Link key={link.href} href={link.href}
                style={{
                  display:'inline-flex', alignItems:'center', gap:6,
                  fontSize:13, fontWeight:600, color:C.dim, textDecoration:'none',
                  padding:'8px 18px', borderRadius:50,
                  border:`1px solid ${C.border}`, background:C.card, transition:'all .2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=C.mid; e.currentTarget.style.color=C.mid; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.dim; }}
              >
                <span>{link.icon}</span>{link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/* ── Nav Card ── */
function NavCard({ icon, title, desc, href, gradientFrom, gradientTo, hov, onHov }) {
  return (
    <Link href={href} onMouseEnter={() => onHov(true)} onMouseLeave={() => onHov(false)}
      style={{
        display:'block', textDecoration:'none',
        background: hov ? `linear-gradient(135deg,${gradientFrom},${gradientTo})` : '#fff',
        borderRadius:18, padding:'26px 22px',
        border: hov ? 'none' : `1px solid ${C.border}`,
        boxShadow: hov ? '0 16px 48px rgba(0,95,43,.18)' : '0 4px 16px rgba(0,95,43,.05)',
        transform: hov ? 'translateY(-6px)' : 'translateY(0)',
        transition:'all .28s cubic-bezier(.4,0,.2,1)', textAlign:'center',
      }}
    >
      <div style={{ fontSize:42, marginBottom:12, transform:hov?'scale(1.15)':'scale(1)', transition:'transform .3s', display:'inline-block' }}>{icon}</div>
      <h3 style={{ fontSize:17, fontWeight:700, marginBottom:7, color:hov?'#fff':C.text, fontFamily:'Times New Roman', transition:'color .25s' }}>{title}</h3>
      <p style={{ fontSize:13, lineHeight:1.6, marginBottom:14, color:hov?'rgba(255,255,255,.80)':C.dim, transition:'color .25s' }}>{desc}</p>
      <div style={{ fontSize:13, fontWeight:700, color:hov?'#fff':C.mid, transition:'color .25s' }}>Open →</div>
    </Link>
  );
}

/* ── Subscription Success View ── */
function SuccessView({ catData, plan, verifyData }) {
  const days    = verifyData?.days;
  const endDate = verifyData?.endDate
    ? new Date(verifyData.endDate).toLocaleDateString('en-IN', { dateStyle:'long' })
    : null;

  return (
    <div style={{ minHeight:'80vh', display:'flex', alignItems:'center', justifyContent:'center', background:C.bg, padding:'40px 20px' }}>
      <div style={{
        background:C.card, borderRadius:24, padding:'clamp(32px,5vw,52px)',
        textAlign:'center', maxWidth:500, width:'100%',
        boxShadow:'0 16px 60px rgba(0,95,43,.12)',
        border:`1px solid ${C.border}`,
        animation:'fadeUp .5s ease', overflow:'hidden', position:'relative',
      }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:'linear-gradient(90deg,#4cd389,#2ea065,#005f2b)' }} />

        <div style={{
          width:88, height:88, borderRadius:'50%',
          background:'linear-gradient(135deg,#4cd389,#2ea065)',
          display:'flex', alignItems:'center', justifyContent:'center',
          margin:'0 auto 22px', fontSize:44,
          animation:'checkPop .5s cubic-bezier(.34,1.56,.64,1)',
          boxShadow:'0 8px 28px rgba(0,95,43,.25)', color:'#fff',
        }}>✓</div>

        <h2 style={{ fontSize:28, fontFamily:'Times New Roman', color:C.text, marginBottom:8 }}>
          🎉 Premium Activated!
        </h2>
        <p style={{ color:C.muted, fontSize:14, marginBottom:16, lineHeight:1.7 }}>
          You now have premium access to{' '}
          <strong style={{ color:C.mid }}>{catData?.emoji} {catData?.label}</strong>{' '}
          yoga classes with your <strong style={{ color:C.accent }}>{plan?.name}</strong> plan.
        </p>

        {/* Plan details */}
        {(days || endDate) && (
          <div style={{
            background:'rgba(76,211,137,.06)', border:`1px solid ${C.border}`,
            borderRadius:14, padding:'14px 20px', marginBottom:24,
          }}>
            {days && (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:`1px solid ${C.border}`, fontSize:13 }}>
                <span style={{ color:C.dim }}>📅 Duration</span>
                <span style={{ fontWeight:700, color:C.text }}>{days} days</span>
              </div>
            )}
            {endDate && (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', fontSize:13 }}>
                <span style={{ color:C.dim }}>⏰ Expires</span>
                <span style={{ fontWeight:700, color:C.text }}>{endDate}</span>
              </div>
            )}
          </div>
        )}

        <div style={{ display:'flex', gap:12, flexDirection:'column' }}>
          <Link href="/classes" style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            background:'linear-gradient(135deg,#4cd389,#2ea065)',
            color:'#fff', padding:'14px', borderRadius:12,
            fontSize:15, fontWeight:700, textDecoration:'none',
            boxShadow:'0 6px 20px rgba(0,95,43,.22)',
          }}>
            🧘 Go to My Classes →
          </Link>
          <Link href="/schedule" style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            background:'rgba(76,211,137,.08)', color:C.accent,
            border:`1.5px solid ${C.border}`, padding:'14px', borderRadius:12,
            fontSize:15, fontWeight:700, textDecoration:'none',
          }}>
            📅 View Live Schedule →
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Enquiry Success View ── */
function EnquirySuccessView({ plan, verifyData }) {
  return (
    <div style={{ minHeight:'80vh', display:'flex', alignItems:'center', justifyContent:'center', background:C.bg, padding:'40px 20px' }}>
      <div style={{
        background:C.card, borderRadius:24, padding:'clamp(32px,5vw,52px)',
        textAlign:'center', maxWidth:520, width:'100%',
        boxShadow:'0 16px 60px rgba(245,158,11,.12)',
        border:'1px solid rgba(245,158,11,.25)',
        animation:'fadeUp .5s ease', overflow:'hidden', position:'relative',
      }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:'linear-gradient(90deg,#f59e0b,#fbbf24,#f59e0b)' }} />

        <div style={{
          width:88, height:88, borderRadius:'50%',
          background:'linear-gradient(135deg,#f59e0b,#fbbf24)',
          display:'flex', alignItems:'center', justifyContent:'center',
          margin:'0 auto 22px', fontSize:44,
          animation:'enquiryPop .5s cubic-bezier(.34,1.56,.64,1)',
          boxShadow:'0 8px 28px rgba(245,158,11,.30)',
        }}>📋</div>

        <h2 style={{ fontSize:28, fontFamily:'Times New Roman', color:C.text, marginBottom:8 }}>
          Enquiry Registered!
        </h2>
        <p style={{ color:C.muted, fontSize:14, marginBottom:12, lineHeight:1.7 }}>
          Your payment of <strong style={{ color:C.orange }}>₹{plan?.price?.toLocaleString()}</strong> for{' '}
          <strong>{plan?.name}</strong> has been received.
          Our team will contact you <strong style={{ color:C.orange }}>within 24 hours</strong>.
        </p>

        {verifyData?.leadId && (
          <p style={{ fontSize:11, color:C.dim, marginBottom:20 }}>
            Reference: <code style={{ background:'#f4f4f4', padding:'2px 8px', borderRadius:4, fontSize:10 }}>
              {verifyData.leadId}
            </code>
          </p>
        )}

        {/* Steps */}
        <div style={{
          background:'rgba(245,158,11,.07)', border:'1px solid rgba(245,158,11,.20)',
          borderRadius:14, padding:'16px 20px', marginBottom:24, textAlign:'left',
        }}>
          <p style={{ fontSize:12, fontWeight:700, color:'#92400e', marginBottom:10 }}>📞 What happens next?</p>
          {[
            'Our team reviews your enquiry',
            'Admin contacts you within 24 hours',
            'Discuss course details, schedule & pricing',
            'Get enrolled in your chosen yoga programme',
          ].map((s, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <span style={{
                width:22, height:22, borderRadius:'50%', flexShrink:0,
                background:'rgba(245,158,11,.15)', display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:10, fontWeight:800, color:'#92400e',
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize:13, color:C.muted }}>{s}</span>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:12, flexDirection:'column' }}>
          <Link href="/dashboard" style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            background:'linear-gradient(135deg,#f59e0b,#fbbf24)',
            color:'#1a1208', padding:'14px', borderRadius:12,
            fontSize:15, fontWeight:700, textDecoration:'none',
            boxShadow:'0 6px 20px rgba(245,158,11,.25)',
          }}>
            👤 View My Dashboard →
          </Link>
          <Link href="/" style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            background:'rgba(76,211,137,.08)', color:C.accent,
            border:`1.5px solid ${C.border}`, padding:'14px', borderRadius:12,
            fontSize:15, fontWeight:700, textDecoration:'none',
          }}>
            🏠 Back to Home
          </Link>
        </div>

        <p style={{ fontSize:11, color:C.dim, marginTop:16 }}>
          📧 Confirmation email sent to your registered email address
        </p>
      </div>
    </div>
  );
}

/* ── Category Tile ── */
function CategoryTile({ cat, selected, onSelect, idx }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onSelect} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding:'clamp(14px,2vw,20px) clamp(8px,1vw,12px)',
        borderRadius:16, textAlign:'center', cursor:'pointer',
        border: selected ? `2px solid ${C.mid}` : `1.5px solid ${hov?'rgba(76,211,137,.35)':C.border}`,
        background: selected ? 'linear-gradient(135deg,rgba(76,211,137,.12),rgba(0,95,43,.06))' : hov ? 'rgba(76,211,137,.04)' : '#fff',
        transform: selected ? 'scale(1.04)' : hov ? 'scale(1.02)' : 'scale(1)',
        boxShadow: selected ? '0 8px 24px rgba(0,95,43,.14)' : '0 2px 8px rgba(0,0,0,.04)',
        transition:'all .22s ease', position:'relative',
        animation:`slideInUp .4s ease ${idx * 50}ms both`,
      }}
    >
      {selected && (
        <div style={{ position:'absolute', top:6, right:6, width:18, height:18, borderRadius:'50%', background:'linear-gradient(135deg,#4cd389,#2ea065)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:'#fff' }}>✓</div>
      )}
      <div style={{ fontSize:'clamp(24px,3vw,32px)', marginBottom:6, transform:selected?'scale(1.15)':'scale(1)', transition:'transform .25s', display:'inline-block' }}>{cat.emoji}</div>
      <div style={{ fontSize:'clamp(11px,1.3vw,13px)', fontWeight:700, color:selected?C.accent:C.text, marginBottom:3 }}>{cat.label}</div>
      <div style={{ fontSize:'clamp(9px,1vw,10px)', color:C.dim, lineHeight:1.4 }}>{cat.desc}</div>
    </div>
  );
}

/* ── Buttons ── */
function PayBtn({ paying, onClick, plan }) {
  const [hov, setHov] = useState(false);
  const isEnquiry = plan?.planType === 'ENQUIRY';
  return (
    <button onClick={onClick} disabled={paying}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width:'100%', padding:'16px',
        background: paying ? C.border
          : hov
            ? isEnquiry ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : 'linear-gradient(135deg,#2ea065,#4cd389)'
            : isEnquiry ? 'linear-gradient(135deg,#f59e0b,#fbbf24)' : 'linear-gradient(135deg,#005f2b,#2ea065)',
        color: paying ? C.dim : isEnquiry ? '#1a1208' : '#fff',
        border:'none', borderRadius:12,
        fontSize:16, fontWeight:700, cursor: paying?'not-allowed':'pointer',
        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        transform: hov&&!paying?'translateY(-1px)':'none',
        boxShadow: hov&&!paying
          ? isEnquiry ? '0 8px 28px rgba(245,158,11,.35)' : '0 8px 28px rgba(0,95,43,.30)'
          : isEnquiry ? '0 4px 16px rgba(245,158,11,.25)' : '0 4px 16px rgba(0,95,43,.20)',
        transition:'all .22s ease', fontFamily:'inherit',
      }}
    >
      {paying
        ? '⏳ Processing…'
        : isEnquiry
          ? `📋 Register Enquiry — ₹${plan?.price?.toLocaleString()}`
          : `👑 Subscribe — ₹${plan?.price?.toLocaleString()}`
      }
    </button>
  );
}

function GreenBtn({ label, disabled, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: disabled ? 'rgba(0,0,0,.08)' : hov ? 'linear-gradient(135deg,#2ea065,#4cd389)' : 'linear-gradient(135deg,#005f2b,#2ea065)',
        color: disabled ? C.dim : '#fff', border:'none', borderRadius:50,
        padding:'15px 48px', fontSize:15, fontWeight:700,
        cursor: disabled?'not-allowed':'pointer', fontFamily:'inherit',
        boxShadow: disabled ? 'none' : hov ? '0 10px 32px rgba(0,95,43,.30)' : '0 6px 22px rgba(0,95,43,.22)',
        transform: hov&&!disabled ? 'translateY(-2px)' : 'none',
        transition:'all .25s',
      }}
    >
      {label}
    </button>
  );
}

function BackBtn({ onClick, label = '← Back' }) {
  return (
    <button onClick={onClick} style={{
      background:'rgba(76,211,137,.08)', border:`1.5px solid ${C.border}`,
      color:C.mid, borderRadius:10, padding:'9px 18px',
      fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
      display:'inline-flex', alignItems:'center', gap:6, transition:'all .2s',
    }}
    onMouseEnter={e => { e.currentTarget.style.background='rgba(76,211,137,.15)'; e.currentTarget.style.borderColor=C.mid; }}
    onMouseLeave={e => { e.currentTarget.style.background='rgba(76,211,137,.08)'; e.currentTarget.style.borderColor=C.border; }}
    >
      {label}
    </button>
  );
}

function PreviewClasses({ category }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!category || category === 'ENQUIRY') return setLoading(false);
    setLoading(true);
    axios.get(`/api/classes?isPremium=true&category=${category}`)
      .then(r => setClasses((r.data || []).slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category]);

  if (loading || classes.length === 0) return null;

  const catEmoji = {
    HATHA:'🌅', VINYASA:'🌊', ASHTANGA:'🔥', POWER:'⚡',
    YIN:'🌙', RESTORATIVE:'🌿', KUNDALINI:'✨', PRENATAL:'🤰',
    KIDS:'🧒', MEDITATION:'🧠', PRANAYAMA:'🌬️',
  };

  return (
    <div style={{ marginTop:44, animation:'fadeUp .5s ease' }}>
      <h3 style={{ fontSize:18, fontFamily:'Times New Roman', color:C.text, marginBottom:18, textAlign:'center' }}>
        Preview {CATEGORIES.find(c=>c.value===category)?.emoji} Premium Classes
      </h3>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:16 }}>
        {classes.map(cls => {
          const emoji = catEmoji[cls.category] || '🧘';
          return (
            <div key={cls.id} style={{ borderRadius:16, overflow:'hidden', background:'#fff', border:`1px solid ${C.border}`, boxShadow:'0 2px 8px rgba(0,95,43,.05)', position:'relative' }}>
              {cls.image
                ? <img src={cls.image} alt={cls.title} style={{ width:'100%', height:130, objectFit:'cover', display:'block', filter:'blur(1px) brightness(.7)' }} />
                : <div style={{ height:130, background:'linear-gradient(135deg,#005f2b,#2ea065)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>{emoji}</div>
              }
              <div style={{ position:'absolute', top:0, left:0, right:0, height:130, background:'rgba(0,40,20,.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ background:'rgba(76,211,137,.90)', borderRadius:50, padding:'5px 14px', fontSize:11, fontWeight:700, color:'#fff' }}>
                  🔒 Subscribe to Unlock
                </div>
              </div>
              <div style={{ padding:'12px 14px' }}>
                <div style={{ display:'flex', gap:4, marginBottom:5, flexWrap:'wrap' }}>
                  <span style={{ fontSize:9, padding:'2px 7px', borderRadius:50, fontWeight:700, background:cls.type==='LIVE'?'rgba(239,68,68,.08)':'rgba(59,130,246,.08)', color:cls.type==='LIVE'?'#ef4444':'#3b82f6' }}>
                    {cls.type==='LIVE'?'🔴 Live':'📹 Recorded'}
                  </span>
                  <span style={{ fontSize:9, padding:'2px 7px', borderRadius:50, background:'rgba(76,211,137,.08)', color:C.mid, fontWeight:600 }}>
                    {lvlDisp[cls.level] || cls.level}
                  </span>
                </div>
                <h4 style={{ fontSize:13, fontWeight:700, color:C.text, margin:0, fontFamily:'Times New Roman' }}>{cls.title}</h4>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}