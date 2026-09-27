import { useState, useMemo, type FormEvent } from 'react';
import { useToast } from '../context/ToastContext';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

function generateRaindrops(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: ((i * 37 + 13) % 100),
    delay: (i * 0.23) % 3,
    duration: 1.2 + (i % 5) * 0.25,
    opacity: 0.06 + (i % 4) * 0.04,
    height: 14 + (i % 3) * 6,
  }));
}

function generateSparkles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: ((i * 53 + 7) % 100),
    top: ((i * 41 + 19) % 80),
    delay: (i * 0.7) % 4,
    size: 2 + (i % 3),
  }));
}

const CLOUDS = [
  { id: 1, w: 300, h: 130, t: -6, l: -8, op: 0.12, du: 28, d: 0 },
  { id: 2, w: 220, h: 100, t: 4, l: 18, op: 0.1, du: 32, d: 4 },
  { id: 3, w: 280, h: 120, t: -2, l: 62, op: 0.14, du: 26, d: 2 },
  { id: 4, w: 200, h: 90, t: 10, l: 82, op: 0.08, du: 30, d: 6 },
  { id: 5, w: 250, h: 110, t: 18, l: 42, op: 0.1, du: 34, d: 8 },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const { showToast } = useToast();
  const prefersReduced = usePrefersReducedMotion();

  const raindrops = useMemo(() => generateRaindrops(18), []);
  const sparkles = useMemo(() => generateSparkles(6), []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = email.trim();
    if (!EMAIL_RE.test(clean)) {
      showToast('Enter a valid email address');
      return;
    }
    showToast('You are subscribed! Welcome to the list.');
    setEmail('');
  }

  return (
    <div className="newsletter">
      <div className="newsletter-sky" aria-hidden="true">
        {/* Clouds */}
        {CLOUDS.map((c) => (
          <div
            key={c.id}
            className="newsletter-cloud"
            style={{
              width: c.w, height: c.h, top: `${c.t}%`, left: `${c.l}%`,
              opacity: c.op, '--du': `${c.du}s`, '--d': `${c.d}s`,
            } as React.CSSProperties}
          />
        ))}

        {/* Rain drops */}
        {!prefersReduced && raindrops.map((r) => (
          <div
            key={r.id}
            className="newsletter-rain-drop"
            style={{
              left: `${r.left}%`,
              animationDelay: `${r.delay}s`,
              animationDuration: `${r.duration}s`,
              opacity: r.opacity,
              height: r.height,
            }}
          />
        ))}

        {/* Sparkles */}
        {!prefersReduced && sparkles.map((s) => (
          <div
            key={s.id}
            className="newsletter-sparkle"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              animationDelay: `${s.delay}s`,
              width: s.size,
              height: s.size,
            }}
          />
        ))}
      </div>

      <span className="eyebrow">Stay in the loop</span>
      <h2>Get next week&apos;s flavors first</h2>
      <p>New drops, seasonal specials, and the occasional discount code — no more than one email a week.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={254}
          aria-label="Email address"
        />
        <button type="submit" className="btn btn-primary">
          Subscribe
        </button>
      </form>
    </div>
  );
}
