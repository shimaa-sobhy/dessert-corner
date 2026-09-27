import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

interface DonutSpec {
  id: string;
  src: string;
  name: string;
}

const DONUT_STORE: DonutSpec[] = (() => {
  const modules = import.meta.glob<{ default: string }>('../assets/{donut,dount}*.webp', { eager: true });
  return Object.entries(modules)
    .filter(([key]) => /donut|dount/i.test(key))
    .map(([key, mod]) => {
      const name = key.replace(/^.*[\\/]/, '').replace(/\.\w+$/, '');
      return { id: name, src: mod.default, name };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
  // Keep exactly 4 donuts. We drop the middle one in the sorted set
  // (donut2) so the remaining 4 stay symmetrically distributed around
  // the center of the row — better visual balance than trimming the end.
})().filter((d) => d.id !== 'donut2');

export default function HeroDonutRow() {
  const prefersReduced = usePrefersReducedMotion();

  return (
    <div className={`hero-donut-row${prefersReduced ? ' hero-donut-row--reduced' : ''}`}>
      {DONUT_STORE.map((d, i) => (
        <div key={d.id} className="hero-donut">
          <img
            src={d.src}
            alt={d.name}
            width={300}
            height={300}
            draggable={false}
            {...({ fetchpriority: i === 1 || i === 2 ? 'high' : 'low' } as Record<string, string>)}
            className={`hero-donut-img hero-donut-img-${i + 1}`}
          />
        </div>
      ))}
    </div>
  );
}
