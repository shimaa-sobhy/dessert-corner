import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import type { Review } from '../../lib/types';
import StarRating from '../StarRating';
import FloatingOrnaments from '../FloatingOrnaments';
import { getProductById } from '../../data/products';

const ORNAMENTS_TESTIMONIALS = [
  { type: 'sparkle' as const, top: '5%', right: '12%', delay: 0.6, size: 10 },
  { type: 'sparkle' as const, top: '45%', right: '3%', delay: 1.8, size: 8 },
  { type: 'sparkle' as const, bottom: '28%', left: '2%', delay: 0.2, size: 9 },
  { type: 'dot' as const, top: '62%', right: '8%', delay: 1.2 },
  { type: 'dot' as const, top: '15%', left: '6%', delay: 2.4 },
];

interface TestimonialsSectionProps {
  reviews: Review[];
  avgRating: number;
  reviewCount: number;
}

export default function TestimonialsSection({ reviews, avgRating, reviewCount }: TestimonialsSectionProps) {
  const reviewsRef = useRef<HTMLElement>(null);
  const testimonialGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = testimonialGridRef.current;
    if (!grid) return;
    // Dots live next to the grid as a sibling inside .testimonial-inner.
    // (Previously they were inside .testimonial-left, which we removed.)
    const dots = grid.parentElement?.querySelectorAll<HTMLElement>('.testimonial-dot');
    if (!dots || dots.length === 0) return;
    const cards = grid.querySelectorAll<HTMLElement>('.testimonial-card');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Array.from(cards).indexOf(entry.target as HTMLElement);
            dots.forEach((d, i) => d.classList.toggle('active', i === idx));
          }
        });
      },
      { root: grid, threshold: 0.6 }
    );
    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={reviewsRef} className="section testimonial-section">
      <div aria-hidden="true" className="testimonial-bg">
        <div className="testimonial-blob testimonial-blob--tl" />
        <div className="testimonial-blob testimonial-blob--br" />
        <div className="testimonial-blob testimonial-blob--cm" />
      </div>

      <div className="testimonial-inner">
        <div className="section-head section-head--center">
          <span className="eyebrow">Loved by regulars</span>
          <h2>What our <i>customers</i> say</h2>
          {/* Trust summary: aggregate rating over the full review set.
              Computed at render from REVIEWS so the headline is always
              in sync with the data. */}
          <div className="testimonial-trust" aria-label={`Average rating ${avgRating.toFixed(1)} out of 5 from ${reviewCount} reviews`}>
            <StarRating rating={avgRating} size={16} />
            <span className="testimonial-trust__score">{avgRating.toFixed(1)}</span>
            <span className="testimonial-trust__divider" aria-hidden="true">·</span>
            <span className="testimonial-trust__count">Based on {reviewCount}+ reviews</span>
          </div>
        </div>

        <div className="testimonial-grid" ref={testimonialGridRef}>
          {reviews.map((r, i) => {
            const p = r && getProductById(r.productId);
            return (
              <motion.article
                key={r.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.55, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="testimonial-card"
              >
                <div className="testimonial-card__rating">
                  <StarRating rating={r.rating} size={18} />
                </div>

                <div className="testimonial-card__title">{r.title}</div>
                <p className="testimonial-card__body">{r.body}</p>

                <div className="testimonial-card__author-row">
                  <span className="testimonial-card__avatar" aria-hidden="true">
                    {r.author.trim().charAt(0).toUpperCase()}
                  </span>
                  <div className="testimonial-card__author-text">
                    <div className="testimonial-card__author">{r.author}</div>
                    {p && <div className="testimonial-card__product">on {p.name}</div>}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        <div className="testimonial-dots" role="tablist" aria-label="Review pagination">
          {reviews.map((_, i) => (
            <button
              key={i}
              className={`testimonial-dot${i === 0 ? ' active' : ''}`}
              aria-label={`Review ${i + 1}`}
              aria-selected={i === 0}
              role="tab"
              onClick={() => {
                const grid = testimonialGridRef.current;
                if (!grid) return;
                const cards = grid.querySelectorAll('.testimonial-card');
                const count = cards.length;
                if (count === 0) return;
                // INFINITE LOOP: allow clicking any dot even if we artificially mark
                // only the first one as active initially. Each dot represents the
                // position in the sequence, and we can navigate to any of them
                // regardless of current scroll position.
                const target = cards[i] as HTMLElement | undefined;
                if (target) {
                  // Deliberately NOT scrollIntoView(): that bubbles up to every
                  // scrollable ancestor (the page) and yanks the whole section —
                  // heading included — vertically while navigating. Scoping the
                  // scroll to the grid keeps the page pixel-static (same pattern
                  // as the product carousel).
                  const g = grid.getBoundingClientRect();
                  const delta = target.getBoundingClientRect().left - g.left + grid.scrollLeft;
                  grid.scrollTo({ left: delta, behavior: 'smooth' });
                }
              }}
            />
          ))}
        </div>
      </div>

      <FloatingOrnaments items={ORNAMENTS_TESTIMONIALS} />
    </section>
  );
}