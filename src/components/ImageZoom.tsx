import { useRef, useState } from 'react';

/**
 * Large product image with a hover-magnify lens (desktop) — moves the
 * background position under the cursor at 2.2x zoom. Falls back to a
 * plain static image on touch devices.
 */
export default function ImageZoom({ src, alt }: { src: string; alt: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPos({ x, y });
  }

  return (
    <div
      ref={wrapRef}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onMouseMove={handleMove}
      style={{
        position: 'relative',
        borderRadius: '1.75rem',
        overflow: 'hidden',
        aspectRatio: '1/1',
        background: 'var(--cream-dim)',
        cursor: 'zoom-in',
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'opacity 200ms',
          opacity: active ? 0 : 1,
        }}
      />
      {active ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${src})`,
            backgroundSize: '220%',
            backgroundPosition: `${pos.x}% ${pos.y}%`,
            backgroundRepeat: 'no-repeat',
          }}
        />
      ) : null}
    </div>
  );
}
