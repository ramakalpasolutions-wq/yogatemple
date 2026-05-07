'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const T = {
  bgCard: '#ffffff', border: '#c8e6d4',
  accentMid: '#2ea065', accentLight: '#4cd389',
  text: '#1a1208', textMuted: '#6b5a3e', textLight: '#9a8a6a',
  red: '#ef4444',
};

export default function HeroImagesPage() {
  const [heroImages,    setHeroImages]    = useState([]);
  const [uploading,     setUploading]     = useState(false);
  const [progress,      setProgress]      = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [activePreview, setActivePreview] = useState(0);

  const load = async () => {
    try {
      setLoading(true);
      const r = await axios.get('/api/admin/hero');
      setHeroImages(r.data || []);
    } catch { setHeroImages([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const t = setInterval(() => setActivePreview(p => (p + 1) % heroImages.length), 3000);
    return () => clearInterval(t);
  }, [heroImages.length]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file');
    if (file.size > 10 * 1024 * 1024) return toast.error('Image must be under 10 MB');

    setUploading(true); setProgress(0);
    const fd = new FormData();
    fd.append('file', file); fd.append('type', 'image');

    try {
      const uploadRes = await axios.post('/api/upload', fd, {
        timeout: 120_000,
        onUploadProgress: evt => setProgress(Math.round((evt.loaded * 100) / (evt.total || 1))),
      });
      await axios.post('/api/admin/hero', {
        imageUrl: uploadRes.data.url,
        publicId: uploadRes.data.publicId || '',
        title: file.name.replace(/\.[^.]+$/, ''),
      });
      toast.success('✅ Hero image uploaded!');
      load();
    } catch (err) {
      toast.error(`❌ ${err.response?.data?.error || err.message || 'Upload failed'}`);
    } finally {
      setUploading(false); setProgress(0); e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this hero image?')) return;
    try {
      await axios.delete(`/api/admin/hero?id=${id}`);
      toast.success('Image removed');
      setActivePreview(0);
      load();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, fontFamily: "'Cormorant Garamond',serif", marginBottom: 4 }}>
            Hero Section Images
          </h2>
          <p style={{ fontSize: 13, color: T.textLight }}>
            {heroImages.length} image{heroImages.length !== 1 ? 's' : ''} · Auto-slides every 5s on homepage
          </p>
        </div>
        <button
          onClick={() => !uploading && document.getElementById('hero-upload').click()}
          disabled={uploading}
          style={{
            background: uploading ? 'rgba(76,211,137,0.3)' : 'linear-gradient(135deg,#4cd389,#2ea065)',
            color: uploading ? T.textLight : '#fff', border: 'none',
            padding: '10px 22px', borderRadius: 10,
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: uploading ? 'none' : '0 4px 16px rgba(76,211,137,0.25)',
            transition: 'all 0.2s',
          }}
        >
          {uploading ? `⬆️ ${progress}%` : '🖼️ Upload Image'}
        </button>
        <input id="hero-upload" type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
      </div>

      {/* Progress */}
      {uploading && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ background: T.border, borderRadius: 6, height: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 6, background: 'linear-gradient(90deg,#4cd389,#2ea065)', width: `${progress}%`, transition: 'width .3s ease' }} />
          </div>
          <p style={{ fontSize: 12, color: T.textLight, marginTop: 6 }}>
            {progress < 100 ? `Uploading… ${progress}%` : 'Processing…'}
          </p>
        </div>
      )}

      {/* Live Preview */}
      {heroImages.length > 0 && (
        <div style={{ marginBottom: 28, background: '#fff', borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: '0 4px 16px rgba(0,95,43,0.07)' }}>
          <div style={{ padding: '12px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(76,211,137,0.03)' }}>
            <span style={{ fontWeight: 700, color: T.accentMid, fontSize: 14 }}>📱 Homepage Preview</span>
            {heroImages.length > 1 && (
              <div style={{ display: 'flex', gap: 6 }}>
                {heroImages.map((_, i) => (
                  <button key={i} onClick={() => setActivePreview(i)} style={{
                    width: i === activePreview ? 20 : 8, height: 8, borderRadius: 4, border: 'none',
                    background: i === activePreview ? T.accentMid : T.border,
                    cursor: 'pointer', transition: 'all .3s', padding: 0,
                  }} />
                ))}
              </div>
            )}
          </div>
          <div style={{ height: 280, position: 'relative', overflow: 'hidden' }}>
            {heroImages.map((img, i) => (
              <img key={img.id || i} src={img.imageUrl} alt=""
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === activePreview ? 1 : 0, transition: 'opacity .8s ease' }}
              />
            ))}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,40,20,.52),rgba(0,0,0,.38))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: '#fff', padding: '0 20px' }}>
                <div style={{ fontSize: 11, color: '#4cd389', fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>🧘 ONLINE YOGA CLASSES</div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, marginBottom: 6 }}>
                  Find Your <em style={{ color: '#4cd389', fontStyle: 'normal' }}>Inner Peace</em>
                </h2>
                <p style={{ fontSize: 12, opacity: 0.7 }}>This is how the background looks on the homepage</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ color: T.textLight }}>Loading…</p>
        </div>
      ) : heroImages.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🖼️</div>
          <h3 style={{ color: T.text, fontFamily: "'Cormorant Garamond',serif", fontSize: 22, marginBottom: 8 }}>No Hero Images Yet</h3>
          <p style={{ color: T.textLight, marginBottom: 20, fontSize: 14 }}>Upload images to display as the homepage background slideshow.</p>
          <button onClick={() => document.getElementById('hero-upload').click()} style={{
            background: 'rgba(76,211,137,0.10)', color: T.accentMid,
            border: `1px solid rgba(76,211,137,0.25)`,
            padding: '10px 24px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          }}>
            Upload First Image
          </button>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 12, fontWeight: 700, color: T.textLight, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
            UPLOADED ({heroImages.length})
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
            {heroImages.map((img, i) => (
              <div key={img._id || img.id || i}
                onClick={() => setActivePreview(i)}
                style={{
                  background: '#fff', borderRadius: 14, overflow: 'hidden',
                  border: `2px solid ${i === activePreview ? T.accentMid : T.border}`,
                  cursor: 'pointer', transition: 'all .25s',
                  boxShadow: i === activePreview ? '0 8px 24px rgba(0,95,43,0.12)' : '0 2px 8px rgba(0,95,43,0.05)',
                  transform: i === activePreview ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <img src={img.imageUrl} alt={img.title || `Hero ${i + 1}`} style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />
                  {i === activePreview && (
                    <div style={{ position: 'absolute', top: 8, left: 8, background: 'linear-gradient(135deg,#4cd389,#2ea065)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 50 }}>
                      ✓ PREVIEW
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 11, fontWeight: 700, width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {i + 1}
                  </div>
                </div>
                <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>
                      {img.title || `Hero Image ${i + 1}`}
                    </p>
                    <p style={{ fontSize: 10, color: T.textLight }}>
                      {i === 0 ? '🏠 Shown first' : `Slide ${i + 1}`}
                    </p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(img._id || img.id); }}
                    style={{
                      background: 'rgba(239,68,68,0.08)', color: T.red,
                      border: '1px solid rgba(239,68,68,0.18)',
                      borderRadius: 8, padding: '6px 10px',
                      fontSize: 12, cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div style={{ marginTop: 20, background: 'rgba(76,211,137,0.06)', border: '1px solid rgba(76,211,137,0.20)', borderRadius: 12, padding: '14px 18px' }}>
            <p style={{ fontSize: 13, color: T.accentMid, fontWeight: 700, marginBottom: 8 }}>💡 Tips for best results</p>
            <ul style={{ fontSize: 12, color: T.textMuted, paddingLeft: 18, margin: 0, lineHeight: 2 }}>
              <li>Use landscape images (16:9 or wider) — they fill the screen better</li>
              <li>Recommended: 1920 × 1080 px or higher</li>
              <li>Keep file size under 10 MB</li>
              <li>Images auto-slide every 5 seconds on the homepage</li>
              <li>First image loads immediately on page load</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}