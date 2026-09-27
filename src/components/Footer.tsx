import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Col {
  key: string;
  title: string;
  content: ReactNode;
}

// Hook to detect if viewport is desktop (>= 1024px)
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isDesktop;
}

export default function Footer() {
  const isDesktop = useIsDesktop();
  const desktopSocialRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const el = desktopSocialRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('footer-social--visible');
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const cols: Col[] = [
    {
      key: 'shop',
      title: 'Shop',
      content: (
        <>
          <Link to="/shop">All Products</Link>
          <Link to="/categories">Categories</Link>
          <Link to="/wishlist">Wishlist</Link>
          <Link to="/cart">Cart</Link>
        </>
      ),
    },
    {
      key: 'company',
      title: 'Company',
      content: (
        <>
          <Link to="/about">About Us</Link>
          <Link to="/blog">Blog</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/faq">FAQ</Link>
        </>
      ),
    },
    {
      key: 'account',
      title: 'Account',
      content: (
        <>
          <Link to="/login">Sign In</Link>
          <Link to="/register">Create Account</Link>
          <Link to="/account/orders">Track Order</Link>
        </>
      ),
    },
    {
      key: 'visit',
      title: 'Visit',
      content: (
        <>
          <p>14 Rue de Miel, Cairo</p>
          <p>Tue–Sun, 8am – 6pm</p>
          <p>hello@sucre.bakery</p>
        </>
      ),
    },
  ];

  const toggle = (k: string) =>
    setOpen((o) => ({ ...o, [k]: !o[k] }));


  return (
    <footer className="site-footer">
      {/* DESKTOP LAYOUT (1024px and up) — accordion structure */}
      {isDesktop && (
        <div className="footer-desktop">
          <div className="footer-top">
            <div className="footer-brand">
              SUCR<em>É</em>
              <p>Small-batch cakes, donuts, and pastries — baked fresh every morning and delivered the same day.</p>
            </div>
            <div className="footer-cols">
              {cols.map((col) => (
                <div className={`footer-col${open[col.key] ? ' open' : ''}`} key={col.key}>
                  <button
                    type="button"
                    className="footer-col-head"
                    aria-expanded={!!open[col.key]}
                    onClick={() => toggle(col.key)}
                  >
                    <span>{col.title}</span>
                    <svg
                      className="footer-chevron"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  <h4 className="footer-col-title">{col.title}</h4>
                  <div className="footer-col-body">{col.content}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="footer-social" ref={desktopSocialRef}>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none"/></svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Facebook">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Pinterest">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12c0 4.2 2.6 7.8 6.3 9.3-.1-.8-.2-2.1 0-3 .2-.8 1.3-5.4 1.3-5.4s-.3-.7-.3-1.7c0-1.6.9-2.8 2-2.8.9 0 1.4.7 1.4 1.6 0 1-.6 2.4-.9 3.7-.3 1.1.6 2 1.6 2 1.9 0 3.4-2 3.4-5 0-2.6-1.9-4.4-4.6-4.4-3.1 0-4.9 2.3-4.9 4.7 0 .9.4 1.9.8 2.4.1.1.1.2.1.4-.1.4-.3 1.2-.3 1.4-.1.2-.3.3-.4.2-1.4-.6-2.2-2.6-2.2-4.2 0-3.4 2.5-6.5 7.1-6.5 3.7 0 6.6 2.6 6.6 6.2 0 3.7-2.3 6.6-5.6 6.6-1.3 0-2.5-.6-2.9-1.4 0 0-.7 2.6-.8 3.2-.3 1.1-1.1 2.5-1.6 3.4A10 10 0 0 0 22 12c0-5.5-4.5-10-10-10z"/></svg>
            </a>
          </div>

          <div className="footer-bottom">
            <span>Designed &amp; Developed by Shaimaa Zahra © 2026</span>
            <span style={{ display: 'flex', gap: 16 }}>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
            </span>
          </div>
        </div>
      )}

      {/* MOBILE + TABLET LAYOUT (under 1024px) — flat 4-zone structure */}
      {!isDesktop && (
        <div className="footer-mobile">
          {/* 1. Brand block — logo + one-line tagline + social icons */}
          <div className="fm-brand">
            <div className="fm-logo" aria-label="Sucré">
              SUCR<em>É</em>
            </div>
            <p className="fm-tagline">Small-batch cakes, donuts & pastries</p>

            <div className="footer-social footer-social--visible">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none"/></svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Pinterest">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12c0 4.2 2.6 7.8 6.3 9.3-.1-.8-.2-2.1 0-3 .2-.8 1.3-5.4 1.3-5.4s-.3-.7-.3-1.7c0-1.6.9-2.8 2-2.8.9 0 1.4.7 1.4 1.6 0 1-.6 2.4-.9 3.7-.3 1.1.6 2 1.6 2 1.9 0 3.4-2 3.4-5 0-2.6-1.9-4.4-4.6-4.4-3.1 0-4.9 2.3-4.9 4.7 0 .9.4 1.9.8 2.4.1.1.1.2.1.4-.1.4-.3 1.2-.3 1.4-.1.2-.3.3-.4.2-1.4-.6-2.2-2.6-2.2-4.2 0-3.4 2.5-6.5 7.1-6.5 3.7 0 6.6 2.6 6.6 6.2 0 3.7-2.3 6.6-5.6 6.6-1.3 0-2.5-.6-2.9-1.4 0 0-.7 2.6-.8 3.2-.3 1.1-1.1 2.5-1.6 3.4A10 10 0 0 0 22 12c0-5.5-4.5-10-10-10z"/></svg>
              </a>
            </div>
          </div>

          {/* 2. Two-column link grid */}
          <div className="fm-grid">
            <div className="fm-col">
              <div className="fm-label">Account</div>
              <nav className="fm-list" aria-label="Account">
                <Link to="/login">Sign In</Link>
                <Link to="/register">Create Account</Link>
                <Link to="/account/orders">Track Order</Link>
                <Link to="/faq">FAQ</Link>
              </nav>
            </div>

            <div className="fm-col">
              <div className="fm-label">Visit Us</div>
              <div className="fm-list fm-list--static">
                <p>14 Rue de Miel, Cairo</p>
                <p>Tue–Sun, 8am – 6pm</p>
                <p>
                  <a href="mailto:hello@sucre.bakery">hello@sucre.bakery</a>
                </p>
              </div>
            </div>
          </div>

          {/* 3. Divider */}
          <div className="fm-divider" aria-hidden="true" />

          {/* 4. Bottom bar — copyright + credit */}
          <div className="fm-bottom">
            <span className="fm-copy">Designed &amp; Developed by Shaimaa Zahra © 2026</span>
          </div>
        </div>
      )}
    </footer>
  );
}
