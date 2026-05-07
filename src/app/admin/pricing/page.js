// src/app/admin/pricing/page.js
'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const T = {
  border: '#c8e6d4', borderFoc: '#2ea065',
  accentMid: '#2ea065', accentLight: '#4cd389',
  accentPale: 'rgba(76,211,137,0.10)',
  gold: '#c49a36', text: '#1a1208',
  textMuted: '#6b5a3e', textLight: '#9a8a6a',
  red: '#ef4444', orange: '#f59e0b', blue: '#3b82f6',
  purple: '#8b5cf6',
};

const YOGA_CATEGORIES = [
  { value: 'ALL',         label: '🧘 All Categories (user picks)' },
  { value: 'HATHA',       label: '🌅 Hatha'       },
  { value: 'VINYASA',     label: '🌊 Vinyasa'     },
  { value: 'ASHTANGA',    label: '🔥 Ashtanga'    },
  { value: 'YIN',         label: '🌙 Yin'         },
  { value: 'RESTORATIVE', label: '🌿 Restorative' },
  { value: 'POWER',       label: '⚡ Power'       },
  { value: 'KUNDALINI',   label: '✨ Kundalini'   },
  { value: 'PRENATAL',    label: '🤰 Prenatal'    },
  { value: 'KIDS',        label: '🧒 Kids'        },
  { value: 'MEDITATION',  label: '🧠 Meditation'  },
  { value: 'PRANAYAMA',   label: '🌬️ Pranayama'  },
];

const STYLES = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @media (max-width: 640px) { .pricing-grid { grid-template-columns: 1fr !important; } }
`;

function useStyles() {
  useEffect(() => {
    const id = 'pricing-styles';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id; el.textContent = STYLES;
    document.head.appendChild(el);
    return () => { try { document.head.removeChild(el); } catch {} };
  }, []);
}

/* ── Input ── */
function Inp({ value, onChange, placeholder, type = 'text', prefix, min }) {
  const [foc, setFoc] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
      {prefix && (
        <span style={{ position: 'absolute', left: 11, color: T.textLight, fontSize: 14, fontWeight: 700, pointerEvents: 'none', zIndex: 1 }}>
          {prefix}
        </span>
      )}
      <input
        type={type} value={value} min={min}
        onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
        style={{
          flex: 1, padding: prefix ? '11px 14px 11px 32px' : '11px 14px',
          background: '#fafffe',
          border: `1.5px solid ${foc ? T.accentMid : T.border}`,
          borderRadius: 10, color: T.text, fontSize: 14,
          outline: 'none', fontFamily: 'inherit',
          boxShadow: foc ? '0 0 0 3px rgba(76,211,137,0.12)' : 'none',
          transition: 'all .2s', width: '100%', boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

/* ── Select ── */
function Sel({ value, onChange, options }) {
  const [foc, setFoc] = useState(false);
  return (
    <select
      value={value} onChange={e => onChange(e.target.value)}
      onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
      style={{
        width: '100%', padding: '11px 14px',
        background: '#fafffe',
        border: `1.5px solid ${foc ? T.accentMid : T.border}`,
        borderRadius: 10, color: T.text, fontSize: 14,
        outline: 'none', fontFamily: 'inherit',
        boxShadow: foc ? '0 0 0 3px rgba(76,211,137,0.12)' : 'none',
        transition: 'all .2s', cursor: 'pointer',
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

/* ── Label ── */
function Label({ children, hint }) {
  return (
    <div style={{ marginBottom: 7 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>
        {children}
      </span>
      {hint && <span style={{ fontSize: 10, color: T.textLight, marginLeft: 6 }}>— {hint}</span>}
    </div>
  );
}

function Field({ label, hint, children, mb = 16 }) {
  return (
    <div style={{ marginBottom: mb }}>
      <Label hint={hint}>{label}</Label>
      {children}
    </div>
  );
}

/* ── Plan Type Selector ── */
function PlanTypeSelector({ value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
      {[
        {
          v: 'CATEGORY_DAYS',
          icon: '📅',
          label: 'Category + Days',
          desc: 'Access to a yoga category for N days',
          color: T.accentMid,
          bg: 'rgba(76,211,137,0.08)',
          border: T.border,
          activeBorder: T.accentMid,
        },
        {
          v: 'ENQUIRY',
          icon: '📋',
          label: 'Enquiry Only',
          desc: 'One-time fee — admin contacts user, no subscription',
          color: T.orange,
          bg: 'rgba(245,158,11,0.08)',
          border: 'rgba(245,158,11,0.2)',
          activeBorder: T.orange,
        },
      ].map(t => (
        <div
          key={t.v}
          onClick={() => onChange(t.v)}
          style={{
            padding: '14px 12px', borderRadius: 12, cursor: 'pointer',
            border: `2px solid ${value === t.v ? t.activeBorder : T.border}`,
            background: value === t.v ? t.bg : '#fafffe',
            transition: 'all .2s', textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 24, marginBottom: 6 }}>{t.icon}</div>
          <p style={{ fontSize: 12, fontWeight: 700, color: value === t.v ? t.color : T.text, margin: '0 0 4px' }}>
            {t.label}
          </p>
          <p style={{ fontSize: 10, color: T.textLight, margin: 0, lineHeight: 1.4 }}>{t.desc}</p>
          {value === t.v && (
            <div style={{
              marginTop: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 20, height: 20, borderRadius: '50%',
              background: value === 'ENQUIRY'
                ? 'linear-gradient(135deg,#f59e0b,#fbbf24)'
                : 'linear-gradient(135deg,#4cd389,#2ea065)',
              fontSize: 10, color: '#fff', fontWeight: 800,
            }}>✓</div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Save button ── */
function SaveBtn({ saving, onClick, label = '💾 Update' }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick} disabled={saving}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', padding: '12px',
        background: saving ? T.border : hov
          ? 'linear-gradient(135deg,#2ea065,#4cd389)'
          : 'linear-gradient(135deg,#4cd389,#2ea065)',
        color: saving ? T.textLight : '#fff',
        border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700,
        cursor: saving ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', transition: 'all .2s',
        boxShadow: saving ? 'none' : hov ? '0 8px 24px rgba(0,95,43,.25)' : '0 4px 14px rgba(0,95,43,.16)',
        transform: hov && !saving ? 'translateY(-1px)' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}
    >
      {saving
        ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Saving…</>
        : label}
    </button>
  );
}

/* ── Feature Row ── */
function FeatureRow({ value, index, onChange, onRemove }) {
  const [foc, setFoc] = useState(false);
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', animation: 'fadeUp .2s ease' }}>
      <span style={{ color: T.textLight, fontSize: 14, flexShrink: 0, cursor: 'grab' }}>⠿</span>
      <span style={{ color: T.accentMid, fontWeight: 800, flexShrink: 0, fontSize: 13, width: 16 }}>✓</span>
      <div style={{
        flex: 1, border: `1.5px solid ${foc ? T.accentMid : T.border}`,
        borderRadius: 9, overflow: 'hidden',
        boxShadow: foc ? '0 0 0 3px rgba(76,211,137,0.10)' : 'none',
        transition: 'all .2s', background: '#fafffe',
      }}>
        <input
          value={value}
          onChange={e => onChange(index, e.target.value)}
          placeholder={`Feature ${index + 1}`}
          onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
          style={{ width: '100%', padding: '9px 12px', border: 'none', outline: 'none', fontSize: 13, color: T.text, background: 'transparent', fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
      </div>
      <button
        onClick={() => onRemove(index)}
        style={{
          background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)',
          color: T.red, width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
          fontSize: 15, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .18s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; }}
      >×</button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   REORDER CONTROLS
══════════════════════════════════════════════════════ */
function ReorderControls({ index, total, onMove, reordering }) {
  const isFirst = index === 0;
  const isLast  = index === total - 1;

  const btnBase = {
    flex: 1, padding: '8px 0',
    border: `1.5px solid ${T.border}`, borderRadius: 9,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'inherit', transition: 'all .2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
  };

  return (
    <div style={{
      display: 'flex', gap: 6, marginBottom: 8,
      background: 'rgba(76,211,137,0.03)',
      border: `1px solid ${T.border}`, borderRadius: 10, padding: '6px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 36, height: 36, background: 'rgba(76,211,137,0.08)',
        border: `1px solid ${T.border}`, borderRadius: 8, flexShrink: 0,
        fontSize: 12, fontWeight: 800, color: T.accentMid,
      }}>#{index + 1}</div>

      <button
        disabled={isFirst || reordering} onClick={() => onMove(index, index - 1)}
        style={{
          ...btnBase,
          background: isFirst || reordering ? 'rgba(0,0,0,0.03)' : 'rgba(76,211,137,0.07)',
          color: isFirst || reordering ? T.textLight : T.accentMid,
          opacity: isFirst ? 0.4 : 1,
          cursor: isFirst || reordering ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={e => { if (!isFirst && !reordering) { e.currentTarget.style.background = 'rgba(76,211,137,0.15)'; e.currentTarget.style.borderColor = T.accentMid; }}}
        onMouseLeave={e => { e.currentTarget.style.background = isFirst ? 'rgba(0,0,0,0.03)' : 'rgba(76,211,137,0.07)'; e.currentTarget.style.borderColor = T.border; }}
      >
        ⬆ <span style={{ fontSize: 11 }}>Up</span>
      </button>

      <button
        disabled={isLast || reordering} onClick={() => onMove(index, index + 1)}
        style={{
          ...btnBase,
          background: isLast || reordering ? 'rgba(0,0,0,0.03)' : 'rgba(76,211,137,0.07)',
          color: isLast || reordering ? T.textLight : T.accentMid,
          opacity: isLast ? 0.4 : 1,
          cursor: isLast || reordering ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={e => { if (!isLast && !reordering) { e.currentTarget.style.background = 'rgba(76,211,137,0.15)'; e.currentTarget.style.borderColor = T.accentMid; }}}
        onMouseLeave={e => { e.currentTarget.style.background = isLast ? 'rgba(0,0,0,0.03)' : 'rgba(76,211,137,0.07)'; e.currentTarget.style.borderColor = T.border; }}
      >
        ⬇ <span style={{ fontSize: 11 }}>Down</span>
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PLAN CARD
══════════════════════════════════════════════════════ */
function PlanCard({ plan, onChange, onSave, saving }) {
  const isEnquiry  = plan.planType === 'ENQUIRY';
  const isBooking  = plan.key === 'booking';

  const updateFeature = (idx, val) => {
    const f = [...(plan.features || [])];
    f[idx] = val;
    onChange('features', f);
  };
  const addFeature    = () => onChange('features', [...(plan.features || []), '']);
  const removeFeature = idx => onChange('features', (plan.features || []).filter((_, i) => i !== idx));
  const featCount     = (plan.features || []).length;

  /* accent colors based on plan type */
  const accent = isEnquiry ? T.orange : T.accentMid;
  const accentBg = isEnquiry ? 'rgba(245,158,11,0.08)' : T.accentPale;

  return (
    <div style={{
      background: '#fff', borderRadius: 18,
      border: `1px solid ${isEnquiry ? 'rgba(245,158,11,0.25)' : T.border}`,
      boxShadow: '0 4px 20px rgba(0,95,43,0.07)',
      overflow: 'hidden', animation: 'fadeUp .4s ease both',
    }}>
      {/* Top accent bar */}
      <div style={{
        height: 4,
        background: isEnquiry
          ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
          : 'linear-gradient(90deg,#4cd389,#2ea065)',
      }} />

      {/* Card header */}
      <div style={{
        background: isEnquiry
          ? 'linear-gradient(135deg,rgba(245,158,11,0.06),rgba(245,158,11,0.02))'
          : 'linear-gradient(135deg,rgba(76,211,137,0.06),rgba(0,95,43,0.02))',
        padding: '14px 20px', borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: isEnquiry ? 'rgba(245,158,11,0.12)' : 'rgba(76,211,137,0.12)',
          border: `1.5px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>
          {plan.icon || (isEnquiry ? '📋' : '🧘')}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text, fontFamily: 'Georgia,serif' }}>
            {plan.name}
          </div>
          <div style={{ fontSize: 11, color: T.textLight, marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <code style={{ fontSize: 10, background: '#f4faf6', padding: '1px 6px', borderRadius: 4 }}>
              {plan.key}
            </code>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 50,
              background: isEnquiry ? 'rgba(245,158,11,0.12)' : T.accentPale,
              color: isEnquiry ? T.orange : T.accentMid,
            }}>
              {isEnquiry ? '📋 Enquiry' : `📅 ${plan.durationDays || '?'} days`}
            </span>
            {!isEnquiry && plan.planCategory && plan.planCategory !== 'ALL' && (
              <span style={{ fontSize: 10, fontWeight: 600, color: T.blue }}>
                🎯 {plan.planCategory}
              </span>
            )}
            {!isEnquiry && (!plan.planCategory || plan.planCategory === 'ALL') && (
              <span style={{ fontSize: 10, color: T.textLight }}>All categories</span>
            )}
          </div>
        </div>
        {plan.badge && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 50, flexShrink: 0,
            background: isEnquiry ? 'rgba(245,158,11,0.12)' : T.accentPale,
            color: isEnquiry ? T.orange : T.accentMid,
          }}>
            {plan.badge}
          </span>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '18px 20px' }}>

        {/* Plan Type */}
        <Field label="Plan Type" hint="defines behaviour after payment">
          <PlanTypeSelector
            value={plan.planType || 'CATEGORY_DAYS'}
            onChange={v => onChange('planType', v)}
          />
        </Field>

        {/* ENQUIRY info banner */}
        {isEnquiry && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, marginBottom: 16,
            background: 'rgba(245,158,11,0.07)',
            border: '1px solid rgba(245,158,11,0.2)',
            fontSize: 12, color: '#92400e', lineHeight: 1.6,
          }}>
            📋 <strong>Enquiry Plan:</strong> After payment, the user's details are sent to admin.
            No subscription is created. Admin will contact the customer manually.
            No category or duration required.
          </div>
        )}

        {/* Plan Name */}
        <Field label="Plan Name" hint="Displayed to users">
          <Inp value={plan.name} onChange={v => onChange('name', v)} placeholder="e.g. Registration Enquiry" />
        </Field>

        {/* Price + Period */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <Label>Price</Label>
            <Inp type="number" value={plan.price} min="0" onChange={v => onChange('price', v)} prefix="₹" />
          </div>
          <div>
            <Label hint="shown next to price">Period Label</Label>
            <Inp value={plan.period} onChange={v => onChange('period', v)} placeholder="e.g. /one-time" />
          </div>
        </div>

        {/* ── CATEGORY_DAYS specific ── */}
        {!isEnquiry && (
          <>
            {/* Duration Days */}
            <Field
              label="Duration (Days)"
              hint="How many days access is granted after payment"
            >
              <div style={{ position: 'relative' }}>
                <Inp
                  type="number"
                  value={plan.durationDays || ''}
                  min="1"
                  onChange={v => onChange('durationDays', v)}
                  placeholder="e.g. 41"
                />
                {plan.durationDays > 0 && (
                  <div style={{
                    marginTop: 6, padding: '6px 10px',
                    background: T.accentPale,
                    border: `1px solid rgba(76,211,137,0.2)`,
                    borderRadius: 8, fontSize: 11,
                    color: T.accentMid, fontWeight: 600,
                    display: 'flex', gap: 6, flexWrap: 'wrap',
                  }}>
                    <span>✅ Access for <strong>{plan.durationDays} days</strong></span>
                    {plan.durationDays >= 365 && <span>≈ {(plan.durationDays/365).toFixed(1)} years</span>}
                    {plan.durationDays >= 30 && plan.durationDays < 365 && <span>≈ {(plan.durationDays/30).toFixed(1)} months</span>}
                    {plan.durationDays < 30 && <span>≈ {plan.durationDays} days</span>}
                  </div>
                )}
              </div>
            </Field>

            {/* Category */}
            <Field
              label="Yoga Category"
              hint="Lock this plan to a specific category, or let user pick"
            >
              <Sel
                value={plan.planCategory || 'ALL'}
                onChange={v => onChange('planCategory', v)}
                options={YOGA_CATEGORIES}
              />
              {plan.planCategory && plan.planCategory !== 'ALL' ? (
                <div style={{
                  marginTop: 6, padding: '6px 10px',
                  background: 'rgba(59,130,246,0.06)',
                  border: '1px solid rgba(59,130,246,0.15)',
                  borderRadius: 8, fontSize: 11, color: T.blue, fontWeight: 600,
                }}>
                  🎯 This plan is locked to <strong>{plan.planCategory}</strong> yoga only
                </div>
              ) : (
                <div style={{
                  marginTop: 6, padding: '6px 10px',
                  background: T.accentPale, border: `1px solid rgba(76,211,137,0.2)`,
                  borderRadius: 8, fontSize: 11, color: T.accentMid, fontWeight: 600,
                }}>
                  🧘 User will choose their yoga category at checkout
                </div>
              )}
            </Field>
          </>
        )}

        {/* Badge + Icon */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <Label hint="optional">Badge</Label>
            <Inp value={plan.badge || ''} onChange={v => onChange('badge', v)} placeholder="Most Popular" />
          </div>
          <div>
            <Label>Icon / Emoji</Label>
            <Inp value={plan.icon || ''} onChange={v => onChange('icon', v)} placeholder="🌙" />
          </div>
        </div>

        {/* Sort Order */}
        <Field label="Sort Order" hint="lower = shown first" mb={20}>
          <Inp type="number" value={plan.sortOrder ?? 0} min="0" onChange={v => onChange('sortOrder', v)} />
        </Field>

        {/* Features */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>
                Features Included
              </span>
              <span style={{ fontSize: 10, color: T.textLight, marginLeft: 6 }}>— bullet points on plan card</span>
            </div>
            {featCount > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, background: accentBg, color: accent, padding: '2px 10px', borderRadius: 50 }}>
                {featCount} item{featCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {featCount === 0 && (
            <div style={{ textAlign: 'center', padding: '16px', border: `1.5px dashed ${T.border}`, borderRadius: 12, marginBottom: 10, background: 'rgba(76,211,137,0.02)' }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>📋</div>
              <p style={{ fontSize: 12, color: T.textLight, margin: 0 }}>No features yet. Add bullet points below.</p>
            </div>
          )}

          {(plan.features || []).map((f, i) => (
            <FeatureRow key={i} index={i} value={f} onChange={updateFeature} onRemove={removeFeature} />
          ))}

          <button
            onClick={addFeature}
            style={{
              width: '100%', padding: '9px',
              background: 'rgba(76,211,137,0.04)',
              border: `1.5px dashed ${T.border}`,
              color: T.textLight, borderRadius: 9,
              fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.accentMid; e.currentTarget.style.color = T.accentMid; e.currentTarget.style.background = 'rgba(76,211,137,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textLight; e.currentTarget.style.background = 'rgba(76,211,137,0.04)'; }}
          >
            <span style={{ fontSize: 16 }}>+</span> Add Feature Point
          </button>

          {/* Quick add */}
          {featCount === 0 && (
            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: 10, color: T.textLight, marginBottom: 6, textAlign: 'center' }}>Quick add:</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                {(isEnquiry
                  ? ['Free consultation', 'Course details', 'Schedule info', 'Pricing details', 'Instructor profile']
                  : ['Unlimited class access', 'Live sessions', 'Expert instructors', 'HD video quality', 'Cancel anytime']
                ).map(s => (
                  <button key={s}
                    onClick={() => onChange('features', [...(plan.features || []), s])}
                    style={{
                      fontSize: 10, padding: '4px 10px',
                      background: 'rgba(76,211,137,0.06)', border: `1px solid ${T.border}`,
                      borderRadius: 50, color: T.textMuted, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(76,211,137,0.14)'; e.currentTarget.style.color = T.accentMid; e.currentTarget.style.borderColor = T.accentMid; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(76,211,137,0.06)'; e.currentTarget.style.color = T.textMuted; e.currentTarget.style.borderColor = T.border; }}
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <SaveBtn saving={saving} onClick={onSave} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ADD NEW PLAN MODAL
══════════════════════════════════════════════════════ */
function AddPlanModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    key: '', name: '', price: 0, period: '', badge: '',
    icon: '🧘', features: [], sortOrder: 99,
    planType: 'CATEGORY_DAYS', durationDays: '', planCategory: 'ALL',
  });
  const [saving,     setSaving]     = useState(false);
  const [newFeature, setNewFeature] = useState('');

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const addFeature = () => {
    const t = newFeature.trim();
    if (!t) return;
    set('features', [...form.features, t]);
    setNewFeature('');
  };

  const handleKeyDown = e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } };

  const handleAdd = async () => {
    if (!form.key.trim())  return toast.error('Plan key is required');
    if (!form.name.trim()) return toast.error('Plan name is required');
    if (form.price < 0)    return toast.error('Price must be 0 or more');

    if (form.planType === 'CATEGORY_DAYS' && (!form.durationDays || Number(form.durationDays) < 1)) {
      return toast.error('Please enter the number of days for this plan');
    }

    const key = form.key.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!key) return toast.error('Invalid key');

    setSaving(true);
    try {
      await axios.put('/api/admin/pricing', { ...form, key });
      toast.success(`✅ Plan "${form.name}" created!`);
      onAdd(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create plan');
    } finally { setSaving(false); }
  };

  const isEnquiry = form.planType === 'ENQUIRY';

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,61,46,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 540, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.25)', animation: 'fadeUp .3s ease' }}
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#0a3d2e,#2ea065)', borderRadius: '20px 20px 0 0', padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 1 }}>
          <div>
            <h3 style={{ color: '#fff', fontSize: 17, fontWeight: 700, margin: 0 }}>➕ Add New Plan</h3>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, margin: '3px 0 0' }}>Create a category plan or enquiry plan</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.18)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <div style={{ padding: '20px 22px' }}>

          {/* Key warning */}
          <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 18, fontSize: 12, color: T.textMuted }}>
            ⚠️ <strong>Plan Key</strong> must be unique and lowercase (e.g. <code>enquiry_basic</code>). Cannot be changed later.
          </div>

          {/* Plan Type */}
          <Field label="Plan Type *">
            <PlanTypeSelector value={form.planType} onChange={v => set('planType', v)} />
          </Field>

          {isEnquiry && (
            <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 16, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12, color: '#92400e', lineHeight: 1.6 }}>
              📋 User pays a registration/enquiry fee. Admin gets notified and contacts the user. No subscription is created.
            </div>
          )}

          <Field label="Plan Key *" hint="unique identifier, lowercase">
            <Inp value={form.key} onChange={v => set('key', v)} placeholder={isEnquiry ? 'e.g. enquiry_basic' : 'e.g. hatha_41days'} />
          </Field>

          <Field label="Plan Name *">
            <Inp value={form.name} onChange={v => set('name', v)} placeholder={isEnquiry ? 'e.g. Course Enquiry' : 'e.g. Hatha 41 Days'} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <Label>Price *</Label>
              <Inp type="number" value={form.price} min="0" onChange={v => set('price', v)} prefix="₹" />
            </div>
            <div>
              <Label>Period Label</Label>
              <Inp value={form.period} onChange={v => set('period', v)} placeholder={isEnquiry ? '/one-time' : '/41 days'} />
            </div>
          </div>

          {/* CATEGORY_DAYS specific */}
          {!isEnquiry && (
            <>
              <Field label="Duration (Days) *" hint="how many days access is granted">
                <Inp type="number" value={form.durationDays} min="1" onChange={v => set('durationDays', v)} placeholder="e.g. 41" />
                {form.durationDays > 0 && (
                  <p style={{ fontSize: 11, color: T.accentMid, fontWeight: 600, marginTop: 5 }}>
                    ✅ Subscription active for <strong>{form.durationDays} days</strong> after payment
                  </p>
                )}
              </Field>

              <Field label="Yoga Category" hint="lock to category or let user pick">
                <Sel value={form.planCategory || 'ALL'} onChange={v => set('planCategory', v)} options={YOGA_CATEGORIES} />
                {form.planCategory && form.planCategory !== 'ALL' ? (
                  <p style={{ fontSize: 11, color: T.blue, fontWeight: 600, marginTop: 5 }}>
                    🎯 Locked to <strong>{form.planCategory}</strong> yoga
                  </p>
                ) : (
                  <p style={{ fontSize: 11, color: T.accentMid, fontWeight: 600, marginTop: 5 }}>
                    🧘 User picks category at checkout
                  </p>
                )}
              </Field>
            </>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div><Label>Icon</Label><Inp value={form.icon} onChange={v => set('icon', v)} placeholder="🧘" /></div>
            <div><Label>Badge</Label><Inp value={form.badge} onChange={v => set('badge', v)} placeholder={isEnquiry ? 'Enquiry' : 'Popular'} /></div>
          </div>

          <Field label="Sort Order" hint="display position" mb={20}>
            <Inp type="number" value={form.sortOrder} min="0" onChange={v => set('sortOrder', v)} />
          </Field>

          {/* Features */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>
                Feature Points
              </span>
              {form.features.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, background: T.accentPale, color: T.accentMid, padding: '2px 10px', borderRadius: 50 }}>
                  {form.features.length} item{form.features.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {form.features.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ color: T.accentMid, fontWeight: 800, flexShrink: 0, fontSize: 13, width: 16 }}>✓</span>
                <div style={{ flex: 1, padding: '8px 12px', background: 'rgba(76,211,137,0.05)', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.text }}>{f}</div>
                <button onClick={() => set('features', form.features.filter((_, j) => j !== i))} style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', color: T.red, width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                value={newFeature} onChange={e => setNewFeature(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={isEnquiry ? 'e.g. Free consultation included' : 'e.g. Unlimited class access'}
                style={{ flex: 1, padding: '9px 12px', border: `1.5px solid ${T.border}`, borderRadius: 9, fontSize: 13, color: T.text, background: '#fafffe', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = T.accentMid}
                onBlur={e => e.target.style.borderColor = T.border}
              />
              <button onClick={addFeature} style={{ background: 'linear-gradient(135deg,#4cd389,#2ea065)', border: 'none', color: '#fff', width: 38, borderRadius: 9, cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>+</button>
            </div>

            {/* Quick chips */}
            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: 10, color: T.textLight, marginBottom: 6 }}>Quick add:</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(isEnquiry
                  ? ['Free consultation', 'Course details explained', 'Schedule info', 'Pricing discussion', 'Instructor intro']
                  : ['Unlimited class access', 'Live sessions', 'Expert instructors', 'HD videos', 'Cancel anytime', 'Certificate']
                ).map(s => (
                  <button key={s}
                    onClick={() => { if (!form.features.includes(s)) set('features', [...form.features, s]); else toast('Already added!', { icon: 'ℹ️' }); }}
                    style={{
                      fontSize: 10, padding: '4px 10px',
                      background: form.features.includes(s) ? 'rgba(76,211,137,0.18)' : 'rgba(76,211,137,0.05)',
                      border: `1px solid ${form.features.includes(s) ? T.accentMid : T.border}`,
                      borderRadius: 50, color: form.features.includes(s) ? T.accentMid : T.textMuted,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {form.features.includes(s) ? '✓' : '+'} {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'transparent', border: `1.5px solid ${T.border}`, color: T.textLight, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <div style={{ flex: 2 }}>
              <SaveBtn saving={saving} onClick={handleAdd} label="✅ Create Plan" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════ */
export default function PricingAdminPage() {
  useStyles();

  const [plans,      setPlans]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState('');
  const [showAdd,    setShowAdd]    = useState(false);
  const [deleting,   setDeleting]   = useState('');
  const [reordering, setReordering] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const r = await axios.get('/api/admin/pricing');
      setPlans(r.data);
    } catch { toast.error('Failed to load plans'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const updatePlan = (key, field, value) =>
    setPlans(prev => prev.map(p => p.key === key ? { ...p, [field]: value } : p));

  const savePlan = async (plan) => {
    /* Validate CATEGORY_DAYS has durationDays */
    if ((plan.planType === 'CATEGORY_DAYS' || !plan.planType) && (!plan.durationDays || plan.durationDays < 1)) {
      return toast.error('Please set the duration (days) for this plan');
    }
    setSaving(plan.key);
    try {
      await axios.put('/api/admin/pricing', plan);
      toast.success(`✅ "${plan.name}" updated!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally { setSaving(''); }
  };

  const movePlan = async (fromIndex, toIndex) => {
    if (reordering) return;
    if (toIndex < 0 || toIndex >= plans.length) return;
    const updated = [...plans];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setPlans(updated);
    setReordering(true);
    try {
      await axios.patch('/api/admin/pricing', { orderedKeys: updated.map(p => p.key) });
      toast.success(`✅ Moved "${moved.name}" ${toIndex < fromIndex ? 'up' : 'down'}`);
    } catch {
      toast.error('Failed to update order');
      setPlans(plans);
    } finally { setReordering(false); }
  };

  const deletePlan = async (key, name) => {
    if (!confirm(`Delete plan "${name}"? This cannot be undone.`)) return;
    setDeleting(key);
    try {
      await axios.delete(`/api/admin/pricing?key=${key}`);
      toast.success(`Deleted "${name}"`);
      setPlans(prev => prev.filter(p => p.key !== key));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    } finally { setDeleting(''); }
  };

  /* ── Stats ── */
  const enquiryCount  = plans.filter(p => p.planType === 'ENQUIRY').length;
  const categoryCount = plans.filter(p => p.planType !== 'ENQUIRY').length;

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
      <p style={{ color: T.textLight }}>Loading plans…</p>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, fontFamily: 'Georgia,serif', marginBottom: 4 }}>
            💰 Pricing Plans
          </h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: T.textLight, fontWeight: 600 }}>{plans.length} total</span>
            <span style={{ fontSize: 12, color: T.accentMid, fontWeight: 600 }}>📅 {categoryCount} category plans</span>
            <span style={{ fontSize: 12, color: T.orange, fontWeight: 600 }}>📋 {enquiryCount} enquiry plans</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} style={{ background: '#fff', border: `1.5px solid ${T.border}`, color: T.accentMid, padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            🔄 Refresh
          </button>
          <button onClick={() => setShowAdd(true)} style={{ background: 'linear-gradient(135deg,#4cd389,#2ea065)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 14px rgba(76,211,137,0.25)' }}>
            ➕ Add New Plan
          </button>
        </div>
      </div>

     

      {/* Reorder indicator */}
      {reordering && (
        <div style={{ background: 'rgba(76,211,137,0.08)', border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.accentMid, fontWeight: 600 }}>
          <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
          Saving new order…
        </div>
      )}

      
      {/* No plans */}
      {plans.length === 0 && (
        <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 16, padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
          <h3 style={{ color: T.text, marginBottom: 8, fontFamily: 'Georgia,serif' }}>No Plans Yet</h3>
          <p style={{ color: T.textLight, fontSize: 14, marginBottom: 20 }}>Click "Add New Plan" to create your first pricing plan.</p>
          <button onClick={() => setShowAdd(true)} style={{ background: 'linear-gradient(135deg,#4cd389,#2ea065)', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            ➕ Add First Plan
          </button>
        </div>
      )}

      {/* Plans grid */}
      <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {plans.map((plan, index) => (
          <div key={plan.key} style={{ position: 'relative' }}>
            <ReorderControls index={index} total={plans.length} onMove={movePlan} reordering={reordering} />
            <PlanCard
              plan={plan}
              onChange={(field, value) => updatePlan(plan.key, field, value)}
              onSave={() => savePlan(plan)}
              saving={saving === plan.key}
            />
            <button
              onClick={() => deletePlan(plan.key, plan.name)}
              disabled={deleting === plan.key}
              style={{ width: '100%', marginTop: 8, padding: '9px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', color: T.red, borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: deleting === plan.key ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}
              onMouseEnter={e => { if (deleting !== plan.key) e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; }}
            >
              {deleting === plan.key ? '⏳ Deleting…' : '🗑️ Delete This Plan'}
            </button>
          </div>
        ))}
      </div>

      {showAdd && <AddPlanModal onClose={() => setShowAdd(false)} onAdd={load} />}
    </div>
  );
}