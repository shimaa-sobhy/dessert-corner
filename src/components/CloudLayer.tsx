import { useMemo, useRef } from 'react';
import { useAmbientFloat } from '../hooks/useAmbientFloat';

interface CloudSpec {
  top: string;
  left?: string;
  right?: string;
  width: number;
  opacity: number;
  duration: number;
  delay: number;
}

function Cloud({ spec }: { spec: CloudSpec }) {
  const ref = useRef<HTMLDivElement>(null);
  useAmbientFloat([{ ref, x: 18, y: -6, duration: spec.duration, delay: spec.delay }]);

  return (
    <div
      className="cloud"
      aria-hidden="true"
      ref={ref}
      style={{
        top: spec.top,
        left: spec.left,
        right: spec.right,
        width: spec.width,
        height: spec.width * 0.55,
        opacity: spec.opacity,
      }}
    >
      <svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
        <path
          fill="#FFFFFF"
          d="M40 85c-16 0-29-12-29-27 0-14 11-26 25-27 4-16 19-28 37-28 17 0 32 11 37 27 15 0 27 12 27 27 0 15-12 27-27 27H40z"
        />
      </svg>
    </div>
  );
}




/**
 * A handful of soft, slowly-drifting cloud shapes for hero/page-header
 * backgrounds. `density="light"` renders fewer, smaller clouds for
 * secondary page headers; the default is used on the homepage hero.
 */
export default function CloudLayer({ density = 'full' }: { density?: 'full' | 'light' }) {
  const clouds = useMemo<CloudSpec[]>(() => {
    if (density === 'light') {
      return [
        { top: '10%', left: '6%', width: 90, opacity: 0.8, duration: 9, delay: 0 },
        { top: '18%', right: '8%', width: 110, opacity: 0.7, duration: 11, delay: 1.2 },
      ];
    }
    return [
      { top: '8%', left: '4%', width: 130, opacity: 0.9, duration: 10, delay: 0 },
      { top: '4%', left: '38%', width: 90, opacity: 0.7, duration: 8, delay: 0.6 },
      { top: '14%', right: '6%', width: 150, opacity: 0.85, duration: 12, delay: 1.1 },
      { top: '28%', right: '28%', width: 70, opacity: 0.6, duration: 7, delay: 1.8 },
      { top: '32%', left: '16%', width: 60, opacity: 0.55, duration: 9, delay: 0.3 },
    ];
  }, [density]);

  return (
    <>
      {clouds.map((c, i) => (
        <Cloud spec={c} key={i} />
      ))}
    </>
  );
}
