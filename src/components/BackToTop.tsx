import { useCallback, useEffect, useRef, useState } from 'react';

const THRESHOLD = 450;

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const rafRef = useRef(0);

  useEffect(() => {
    function evaluate() {
      rafRef.current = 0;
      const pastThreshold = window.scrollY > THRESHOLD;
      const footer = document.querySelector('footer.site-footer');
      const footerOnScreen = footer ? footer.getBoundingClientRect().top <= window.innerHeight : false;
      setVisible(pastThreshold && !footerOnScreen);
    }
    function schedule() {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(evaluate);
    }
    evaluate();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <button
      type="button"
      className={`back-to-top${visible ? ' visible' : ''}`}
      onClick={scrollToTop}
      aria-label="Back to top"
    >
      <span className="btt-inner">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </span>
    </button>
  );
}