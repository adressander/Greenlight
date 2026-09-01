import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '110px 24px', textAlign: 'center' }}>
      <div className="display" style={{ fontSize: '1.3rem', marginBottom: 20, color: 'var(--signal-green-bright)' }}>
        Greenlight
      </div>
      <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', lineHeight: 1.05, marginBottom: 22 }}>
        Stay green. Stay rolling.
      </h1>
      <p style={{ color: 'var(--paper-dim)', fontSize: '1.1rem', maxWidth: '46ch', margin: '0 auto 36px' }}>
        Track UCR, IFTA, IRP, insurance, and medical card deadlines for every
        truck — and get texted before you're at risk of getting parked.
      </p>
      <Link href="/login">
        <button className="btn-primary" style={{ padding: '16px 30px', fontSize: '1rem' }}>
          Get started free
        </button>
      </Link>
    </main>
  );
}
