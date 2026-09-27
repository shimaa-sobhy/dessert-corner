import Button from '../components/Button';

export default function NotFound() {
  return (
    <section className="section" style={{ textAlign: 'center', paddingTop: 100, paddingBottom: 120 }}>
      <span className="eyebrow">404</span>
      <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 'clamp(30px,4vw,48px)', margin: '10px 0 16px', color: 'var(--ink)' }}>
        This page isn't on the menu
      </h1>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 28 }}>The page you're looking for doesn't exist or may have moved.</p>
      <Button to="/">Back to Home</Button>
    </section>
  );
}
