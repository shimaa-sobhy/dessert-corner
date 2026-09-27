import { memo, useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

import iconCake1 from '../assets/icon cake.webp'
import iconCake2 from '../assets/icon cake2.webp'
import iconCake3 from '../assets/icon cake3.webp'
import iconCake4 from '../assets/icon cake4.webp'
import iconCake5 from '../assets/icon cake5.webp'
import iconCake6 from '../assets/icon cake6.webp'
import iconCake7 from '../assets/icon cake7.webp'
import iconCake8 from '../assets/icon cake8.webp'
import iconCake9 from '../assets/icon cake9.webp'
import iconCake10 from '../assets/icon cake10.webp'
import iconCake11 from '../assets/icon cake11.webp'
import iconCake12 from '../assets/icon cake12.webp'
import iconCake13 from '../assets/icon cake13.webp'
import iconCake14 from '../assets/icon cake14.webp'

const CATEGORY_ITEMS = [
  { image: iconCake1, name: 'Classic Vanilla' },
  { image: iconCake2, name: 'Chocolate Dream' },
  { image: iconCake3, name: 'Berry Bliss' },
  { image: iconCake4, name: 'Layer Cake' },
  { image: iconCake5, name: 'Cheesecake' },
  { image: iconCake6, name: 'Dessert Cup' },
  { image: iconCake7, name: 'Celebration Cake' },
  { image: iconCake8, name: 'Pie Slice' },
  { image: iconCake9, name: 'Layer Cake Slice' },
  { image: iconCake10, name: 'Chocolate Cake' },
  { image: iconCake11, name: 'Cookie' },
  { image: iconCake12, name: 'Pie' },
  { image: iconCake13, name: 'Cupcake' },
  { image: iconCake14, name: 'Matcha Mochi' },
]

const DECO_CLOUDS = [
  { top: 8, left: 4, w: 220, d: 0 },
  { top: 55, left: 70, w: 260, d: -3 },
  { top: 80, left: 12, w: 180, d: -6 },
]

export default memo(function CategoryCarousel() {
  const sectionRef = useRef<HTMLElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const prefersReduced = usePrefersReducedMotion()

  const trackRef = useRef<HTMLDivElement>(null)
  const posRef = useRef(0)
  const rafRef = useRef(0)
  const pausedRef = useRef(false)
  const touchStartRef = useRef<{ x: number; pos: number } | null>(null)
  const shouldRun = useRef(false)

  const marqueeItems = [...CATEGORY_ITEMS, ...CATEGORY_ITEMS]

  useEffect(() => {
    if (prefersReduced) return
    const el = trackRef.current!
    const sec = sectionRef.current!
    // Start the marquee when the section nears the viewport (native IO,
    // replaces framer's useInView gate).
    const io = new IntersectionObserver(([entry]) => {
      shouldRun.current = entry.isIntersecting
    }, { rootMargin: '120px 0px', threshold: 0.05 })
    io.observe(sec)
    let last = performance.now()
    function tick(now: number) {
      const dt = now - last
      last = now
      if (shouldRun.current && !pausedRef.current && !touchStartRef.current) {
        const half = el.scrollWidth / 2
        if (half > 0) {
          posRef.current -= dt * 0.00002 * half
          if (posRef.current <= -half) posRef.current += half
          el.style.transform = `translate3d(${posRef.current}px, 0, 0)`
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      io.disconnect()
      cancelAnimationFrame(rafRef.current)
    }
  }, [prefersReduced])

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden cat-section"
      style={{
        background: 'linear-gradient(180deg, #EAF6FF 0%, #F2FAFF 50%, #EAF6FF 100%)',
        paddingTop: 'var(--space-lg)',
        paddingBottom: 'var(--space-lg)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full cat-pulse-dot"
            style={{
              width: `${3 + (i % 3) * 2}px`,
              height: `${3 + (i % 3) * 2}px`,
              top: `${5 + i * 11}%`,
              left: `${3 + (i * 13) % 94}%`,
              background: 'rgba(248, 175, 203, 0.25)',
              animationDuration: `${4 + i * 0.4}s`,
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}
        {DECO_CLOUDS.map((c, i) => (
          <div
            key={`dc-${i}`}
            className="absolute opacity-[0.05] cat-cloud"
            style={{
              top: `${c.top}%`,
              left: `${c.left}%`,
              width: `${c.w}px`,
              animationDuration: `${14 + i * 3}s`,
              animationDelay: `${c.d}s`,
            }}
          >
            <svg viewBox="0 0 200 80" fill="#2D5E74">
              <path d="M40 70 C10 70 0 55 10 40 C0 25 15 5 35 15 C40 0 65 0 75 15 C85 0 115 5 120 20 C135 5 160 10 165 25 C180 15 200 25 195 40 C200 55 185 70 160 70 Z" />
            </svg>
          </div>
        ))}
      </div>

      <div className="relative z-10 cat-shell">
        <div className="text-center mb-10 sm:mb-14 cat-head-in">
          <span className="inline-block text-xs font-semibold tracking-[0.25em] uppercase mb-3"
            style={{ color: 'var(--ink-soft)' }}
          >
            Explore our goodies
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight"
            style={{ fontFamily: "'Fraunces', serif", color: 'var(--ink)' }}
          >
            Shop by <span style={{ color: 'var(--accent-deep)', fontStyle: 'italic' }}>category</span>
          </h2>
        </div>

        <div className="relative select-none">
          <div
            className="overflow-hidden px-0 cat-fade"
            onMouseEnter={() => { pausedRef.current = true }}
            onMouseLeave={() => { pausedRef.current = false }}
            onTouchStart={(e) => {
              pausedRef.current = true
              touchStartRef.current = { x: e.touches[0].clientX, pos: posRef.current }
            }}
            onTouchMove={(e) => {
              if (!touchStartRef.current || !trackRef.current) return
              const half = trackRef.current.scrollWidth / 2
              if (half <= 0) return
              const dx = e.touches[0].clientX - touchStartRef.current.x
              let np = touchStartRef.current.pos + dx
              if (np > 0) np -= half
              if (np <= -half) np += half
              posRef.current = np
              trackRef.current.style.transform = `translate3d(${np}px, 0, 0)`
            }}
            onTouchEnd={() => {
              touchStartRef.current = null
              pausedRef.current = false
            }}
          >
            <div
              ref={trackRef}
              className="flex cat-track-in"
              style={{ backfaceVisibility: 'hidden', willChange: 'transform' }}
            >
              {marqueeItems.map((item, index) => (
                <div
                  key={index}
                  className="cat-slide flex-[0_0_33.333%] sm:flex-[0_0_25%] lg:flex-[0_0_16.666%] min-w-0 px-2 sm:px-4 lg:px-6"
                >
                  <Link
                    to="/shop?category=cakes"
                    className="cat-card-wrap flex flex-col items-center gap-2 sm:gap-4 lg:gap-5 py-1 sm:py-2 select-none group"
                    onMouseEnter={() => setHoveredIndex(index % CATEGORY_ITEMS.length)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div className="cat-img-wrap relative w-full max-w-[80px] sm:max-w-[130px] lg:max-w-[150px] flex items-center justify-center">
                      <img
                        src={item.image}
                        alt={item.name}
                        draggable={false}
                        width={150}
                        height={150}
                        className={`cat-float w-full h-auto object-contain`}
                        style={{
                          animationDuration: `${4 + ((index % CATEGORY_ITEMS.length) % 3) * 0.5}s`,
                          animationDelay: `${(index % CATEGORY_ITEMS.length) * 0.2}s`,
                          filter: hoveredIndex === (index % CATEGORY_ITEMS.length)
                            ? 'drop-shadow(0 10px 24px rgba(45,94,116,0.2)) drop-shadow(0 3px 8px rgba(45,94,116,0.1))'
                            : 'drop-shadow(0 6px 16px rgba(45,94,116,0.10)) drop-shadow(0 2px 4px rgba(45,94,116,0.04))',
                          transition: 'filter 0.5s cubic-bezier(0.16,1,0.3,1)',
                        }}
                      />
                    </div>

                    <span
                      className="cat-name text-[10px] sm:text-sm font-semibold text-center leading-tight"
                      style={{
                        fontFamily: "'Fraunces', serif",
                        color: hoveredIndex === (index % CATEGORY_ITEMS.length) ? 'var(--accent-deep)' : 'var(--ink)',
                        transition: 'color 0.4s cubic-bezier(0.16,1,0.3,1)',
                      }}
                    >
                      {item.name}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
})