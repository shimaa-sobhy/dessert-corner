import { memo, useEffect, useRef, useState } from 'react';
import Button from './Button';
import PcCard from './PcCard';
import type { Product } from '../lib/types';

interface Props {
  products: Product[];
}

function ProductCarousel({ products }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  // Index of the slide snapped to the viewport start (one dot per product).
  const [activeIndex, setActiveIndex] = useState(0);
  const P = products.length;

  // Live geometry of the clone strip, kept so click handlers and the
  // scroll remap always read current layout (no stale state involvement).
  const geomRef = useRef({ stride: 0, realStartSnap: 0, span: 0, count: 0 });

  function slides(): HTMLElement[] {
    const vp = viewportRef.current;
    return vp ? Array.from(vp.querySelectorAll<HTMLElement>('.pc-slide')) : [];
  }

  // Map any scrollLeft (including positions inside the clone buffers) to a
  // real product index using modulo geometry, mirroring the infinite loop.
  function realIndexFor(scrollLeft: number): number {
    const g = geomRef.current;
    if (g.count === 0 || g.stride <= 0) return 0;
    const rel = scrollLeft - g.realStartSnap;
    return (((Math.round(rel / g.stride) % g.count) + g.count) % g.count);
  }

  // Smooth-scroll ONLY the carousel viewport to a slide. Deliberately NOT
  // scrollIntoView(): that bubbles up to every scrollable ancestor (the
  // page), dragging the whole section — heading included — vertically and
  // horizontally while navigating. Element-scoped scrollTo keeps the
  // heading and the rest of the page pixel-static during navigation.
  function scrollToSlide(el: HTMLElement) {
    const vp = viewportRef.current;
    if (!vp) return;
    const pad = parseFloat(getComputedStyle(vp).scrollPaddingLeft) || 0;
    const target =
      el.getBoundingClientRect().left -
      vp.getBoundingClientRect().left +
      vp.scrollLeft -
      pad;
    vp.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }

  // Prev/Next — wraps around through the clone buffers so the motion is a
  // continuous flip (last card can keep moving left past the end). The
  // scrollend remap then snaps the (pixel-identical) clone back to the real
  // card with no visible jump.
  function scrollByCards(dir: 1 | -1) {
    const vp = viewportRef.current;
    if (!vp || P === 0) return;
    const s = slides();
    const ci = realIndexFor(vp.scrollLeft);
    const next = (ci + dir + P) % P;
    if (dir === 1) {
      // Not on the last real card -> next real card. On the last real card
      // -> first tail clone (renders product 0, px-identical to real 0).
      scrollToSlide(next > ci ? s[P + next] : s[2 * P]);
    } else {
      // Not on the first real card -> previous real card. On the first real
      // card -> last head clone (renders product P-1, px-identical to real P-1).
      scrollToSlide(next < ci ? s[P + next] : s[P - 1]);
    }
  }

  // Dots always target a REAL slide.
  function scrollToIndex(i: number) {
    if (i < 0 || i >= P) return;
    const s = slides();
    scrollToSlide(s[P + i]);
  }

  // Geometry + seamless infinite remap.
  //
  // Layout: [ P head clones (products 0..P-1) ][ P real slides ][ P tail
  // clones (products 0..P-1) ]. Swiping past either end lands on a clone
  // that is pixel-identical to a real card; on scrollend we instantly
  // translate scrollLeft by +-span to the corresponding real card. Because
  // the clones are visually identical the re-position is invisible.
  useEffect(() => {
    const vp = viewportRef.current!;
    if (!vp || P === 0) return;

    const scrollPad = () => parseFloat(getComputedStyle(vp).scrollPaddingLeft) || 0;

    function measure() {
      const s = Array.from(vp.querySelectorAll<HTMLElement>('.pc-slide'));
      if (s.length < P * 3) return;
      const stride = s[1].offsetLeft - s[0].offsetLeft;
      if (stride <= 0) return;
      geomRef.current = {
        stride,
        realStartSnap: s[P].offsetLeft - scrollPad(),
        span: P * stride,
        count: P,
      };
    }

    // Bring a clone-buffer scroll position back into the real region.
    function snapRemap(scrollLeft: number): number {
      const g = geomRef.current;
      if (g.span <= 0) return scrollLeft;
      if (scrollLeft >= g.realStartSnap + g.span - g.stride / 2) return scrollLeft - g.span;
      if (scrollLeft <= g.realStartSnap - g.stride / 2) return scrollLeft + g.span;
      return scrollLeft;
    }

    function updateActive() {
      setActiveIndex(realIndexFor(vp.scrollLeft));
    }

    measure();
    // Start snapped on the first REAL card (not the head clones).
    vp.scrollLeft = geomRef.current.realStartSnap;
    updateActive();

    const onScroll = () => updateActive();
    const onScrollEnd = () => {
      const target = snapRemap(vp.scrollLeft);
      if (target !== vp.scrollLeft) {
        vp.scrollLeft = target; // instant, single frame — clones are px-identical
        updateActive();
      }
    };
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    const pollSettle = () => {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(onScrollEnd, 400);
    };
    if ('onscrollend' in window) {
      vp.addEventListener('scrollend', onScrollEnd, { passive: true });
    }
    vp.addEventListener('scroll', onScroll, { passive: true });
    vp.addEventListener('scroll', pollSettle, { passive: true });

    const onResize = () => {
      const idx = realIndexFor(vp.scrollLeft);
      measure();
      vp.scrollLeft = geomRef.current.realStartSnap + idx * geomRef.current.stride;
      updateActive();
    };
    window.addEventListener('resize', onResize);

    return () => {
      if ('onscrollend' in window) vp.removeEventListener('scrollend', onScrollEnd);
      vp.removeEventListener('scroll', onScroll);
      vp.removeEventListener('scroll', pollSettle);
      window.removeEventListener('resize', onResize);
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, [P]);

  if (P === 0) return null;

  return (
    <section className="section product-carousel">
      <div className="pc-bg" aria-hidden="true" />
      <div className="pc-sparkles" aria-hidden="true">
        <i className="pc-sp pc-sp-1" />
        <i className="pc-sp pc-sp-2" />
        <i className="pc-sp pc-sp-3" />
        <i className="pc-sp pc-sp-4" />
        <i className="pc-sp pc-sp-5" />
        <i className="pc-sp pc-sp-6" />
      </div>

      <div className="section-head-row">
        <div>
          <span className="eyebrow">Fresh from the case</span>
          <h2>Best sellers &amp; new arrivals</h2>
        </div>
        <Button to="/shop" variant="outline">
          View All Products
        </Button>
      </div>

      <div className="pc-carousel-wrap">
        <div className="pc-viewport" ref={viewportRef}>
          <div className="pc-track">
            {/* Head clones — same order as products; the last head clone sits
                just left of real[0] and renders product P-1 (the visual
                "previous" card). aria-hidden so screen readers never
                announce duplicates. */}
            {products.map((p) => (
              <div className="pc-slide pc-c" key={'h' + p.id} data-pc-id={p.id} data-pc-region="head" aria-hidden="true">
                <PcCard product={p} />
              </div>
            ))}
            {/* Real slides */}
            {products.map((p) => (
              <div className="pc-slide" key={p.id} data-pc-id={p.id} data-pc-region="real">
                <PcCard product={p} />
              </div>
            ))}
            {/* Tail clones — first tail clone sits just right of real[P-1] and
                renders product 0 (the visual "next" card). */}
            {products.map((p) => (
              <div className="pc-slide pc-c" key={'t' + p.id} data-pc-id={p.id} data-pc-region="tail" aria-hidden="true">
                <PcCard product={p} />
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="pc-btn pc-btn-prev"
          onClick={() => scrollByCards(-1)}
          aria-label="Previous products"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5 L9 12 L15 19" />
          </svg>
        </button>
        <button
          type="button"
          className="pc-btn pc-btn-next"
          onClick={() => scrollByCards(1)}
          aria-label="Next products"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 5 L15 12 L9 19" />
          </svg>
        </button>
      </div>

      <div className="pc-dots" role="tablist" aria-label="Carousel position">
        {products.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={i === activeIndex}
            aria-label={`Go to product ${i + 1} of ${products.length}`}
            className={`pc-dot${i === activeIndex ? ' pc-dot-active' : ''}`}
            onClick={() => scrollToIndex(i)}
          />
        ))}
      </div>
    </section>
  );
}

export default memo(ProductCarousel);