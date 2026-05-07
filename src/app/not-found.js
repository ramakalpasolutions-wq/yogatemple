import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', paddingTop: 72 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 80, marginBottom: 16 }}>🧘</div>
        <h1 style={{ fontSize: 60, marginBottom: 8, fontFamily: 'Cormorant Garamond, serif' }}>404</h1>
        <h2 style={{ marginBottom: 12 }}>Page Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>This path leads nowhere. Let us guide you back to your practice.</p>
        <Link href="/" className="btn btn-primary">Return Home →</Link>
      </div>
    </div>
  );
}
