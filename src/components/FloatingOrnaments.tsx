import { memo } from 'react';

type DecoT = 'sparkle' | 'berry' | 'leaf' | 'petal' | 'circle' | 'dot';

interface Item {
  type: DecoT;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  delay?: number;
  duration?: number;
  size?: number;
  color?: string;
}

interface Props {
  items: Item[];
}

function Sparkle({ size }: { size: number; color?: string }) {
  const s = size || 16;
  return (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M10 0l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

function Berry({ size, color }: { size: number; color?: string }) {
  const s = size || 18;
  const c = color || '#9BAFD9';
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="15" r="7" fill={c} opacity="0.5" />
      <circle cx="12" cy="15" r="4.5" fill={c} opacity="0.15" />
      <path d="M12 8q1-3 2-1" stroke={c} strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.6" />
    </svg>
  );
}

function Leaf({ size, color }: { size: number; color?: string }) {
  const s = size || 16;
  const c = color || '#B5D6C4';
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 22C6 18 4 10 12 2c8 8 6 16 0 20z" fill={c} opacity="0.45" />
      <path d="M12 22V2" stroke={c} strokeWidth="1.2" opacity="0.6" />
    </svg>
  );
}

function Petal({ size, color }: { size: number; color?: string }) {
  const s = size || 12;
  const c = color || '#FFD6E7';
  return (
    <svg width={s} height={s * 1.6} viewBox="0 0 16 26" fill="none">
      <path d="M8 2c5 6 6 14 0 22C2 16 3 8 8 2z" fill={c} opacity="0.55" />
      <path d="M8 2c-1 4-1 12 0 22" stroke={c} strokeWidth="0.8" opacity="0.3" />
    </svg>
  );
}

function Circle({ size, color }: { size: number; color?: string }) {
  const s = size || 40;
  const c = color || '#F8AFCB';
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" fill={c} opacity="0.08" />
      <circle cx="20" cy="20" r="12" fill={c} opacity="0.05" />
    </svg>
  );
}

function Dot({ size, color }: { size: number; color?: string }) {
  const s = size || 5;
  const c = color || '#CBD8E8';
  return (
    <svg width={s} height={s} viewBox="0 0 6 6" fill="none">
      <circle cx="3" cy="3" r="2.5" fill={c} opacity="0.4" />
    </svg>
  );
}

const EL: Record<DecoT, (p: { size: number; color?: string }) => JSX.Element> = {
  sparkle: Sparkle,
  berry: Berry,
  leaf: Leaf,
  petal: Petal,
  circle: Circle,
  dot: Dot,
};

export default memo(function FloatingOrnaments({ items }: Props) {
  return (
    <>
      {items.map((item, i) => {
        const Tag = EL[item.type];
        const anim = item.type === 'circle' ? 'bob' : item.type === 'petal' ? 'float-reverse' : item.type === 'dot' ? 'sway' : item.type === 'sparkle' ? 'twinkle' : 'float';
        return (
          <div
            key={i}
            aria-hidden="true"
            className={`deco deco-${item.type}`}
            style={{
              top: item.top,
              left: item.left,
              right: item.right,
              bottom: item.bottom,
              animation: `${anim} ${item.duration ?? (item.type === 'sparkle' ? 3 : item.type === 'dot' ? 4 : 5)}s ease-in-out infinite`,
              animationDelay: `${item.delay ?? i * 0.6}s`,
              color: item.color,
            }}
          >
            <Tag size={item.size ?? 16} color={item.color} />
          </div>
        );
      })}
    </>
  );
});
