import { useEffect, useMemo, useState } from 'react';
import type { Product } from '../../lib/types';
import Button from '../Button';
import StarRating from '../StarRating';
import blueberryImg from '../../assets/Blueberry.webp';
import blueberry1 from '../../assets/blueberry-1.webp';
import blueberry2 from '../../assets/blueberry-2.webp';
import mintLeaf1 from '../../assets/mint-leaf-1.webp';
import mintLeaf2 from '../../assets/mint-leaf-2.webp';

interface DecoItem {
  src: string; t?: string; l?: string;
  sz: number; rot: number; sc: number;
  op: number; br: number; bl: number;
  d: number; du: number; a: string;
  ly: 1|2|3; fl?: boolean;
}

interface SparkItem {
  t: number; l: number; sz: number;
  du: number; d: number; gold: boolean;
}

function generateFeaturedDecorations(): DecoItem[] {
  const R=(a:number,b:number)=>Math.random()*(b-a)+a;
  const pick=<T,>(a:T[])=>a[Math.floor(Math.random()*a.length)];
  const items:DecoItem[]=[];

  const b1=blueberry1,b2=blueberry2,m1=mintLeaf1,m2=mintLeaf2;
  const singleLeaf=()=>Math.random()<0.5?m1:m2;
  // Ambient garnish motion: one calm float family only (gentle vertical
  // drift ±8px + very subtle ±3° rotation, ease-in-out, always on).
  // Durations cycle 4s/5s/6s and each element gets its own delay so the
  // set drifts organically instead of pulsing in unison.
  const gentleAnims=['deco-float-a','deco-float-b'];
  const floatDurations=[4,5,6];

  // Zone configs: [lMin,lMax, tMin,tMax, layerBitmask, srcCode, szMin,szMax, count]
  // layerBitmask: bit 0=bg(1), bit 1=mid(2), bit 2=front(4)
  // srcCode: 0=b1, 1=b2, 2=mixed leaf, 3=mixed berry(0/1)
  const zones:[number,number,number,number,number,number,number,number,number][]=[
    // ── FAR TOP (above everything) ──
    [-5,105, -8,5,    1,  3, 16,28, 5],
    // ── TOP-LEFT (above cake left) ──
    [-4,14,   6,16,   3,  2, 16,32, 3],
    [10,36,   4,16,   1,  3, 16,26, 3],
    // ── TOP GAP ──
    [40,52,   4,14,   1,  2, 16,24, 2],
    // ── TOP-RIGHT (above text, bg only) ──
    [52,104,  2,12,   1,  2, 16,28, 3],
    // ── LEFT EDGE (beside cake) ──
    [-8,8,    16,40,  7,  0, 28,56, 4],
    [-8,8,    42,60,  7,  1, 40,80, 3],
    [-8,8,    62,78,  3,  2, 20,40, 3],
    // ── NEAR CAKE LEFT ──
    [8,18,    22,40,  3,  2, 20,36, 3],
    [8,18,    44,58,  2,  0, 28,50, 2],
    // ── GAP ──
    [40,52,   18,40,  3,  3, 18,34, 3],
    [40,52,   44,64,  2,  2, 20,40, 2],
    // ── RIGHT FAR EDGE (beside text) ──
    [88,105,  14,36,  3,  2, 18,34, 3],
    [88,105,  40,62,  2,  0, 20,40, 3],
    [90,105,  64,78,  3,  3, 22,44, 2],
    // ── BELOW PLATE ──
    [6,38,    58,76,  7,  0, 28,56, 3],
    [4,36,    60,78,  7,  1, 50,90, 3],
    [8,34,    62,76,  3,  2, 22,44, 2],
    // ── BELOW GAP ──
    [36,52,   62,78,  3,  3, 22,44, 3],
    // ── BELOW TEXT ──
    [54,86,   66,84,  3,  2, 20,40, 3],
    [54,86,   84,98,  2,  0, 28,50, 2],
    // ── FAR BOTTOM ──
    [-6,105,  84,106, 7,  3, 20,48, 5],
    // ── BOTTOM-LEFT ──
    [-8,14,   74,100, 7,  1, 40,90, 4],
    [-6,10,   78,102, 3,  0, 30,60, 3],
    // ── BOTTOM-RIGHT ──
    [78,104,  74,96,  3,  2, 22,44, 3],
    [82,104,  96,106, 2,  3, 28,56, 2],
  ];

  function resolveSrc(code:number):string{
    if(code===0) return b1;
    if(code===1) return b2;
    if(code===2) return singleLeaf();
    return Math.random()<0.6?b1:b2;
  }

  function pickLayer(mask:number):1|2|3{
    const layers:number[]=[];
    if(mask&1) layers.push(1);
    if(mask&2) layers.push(2);
    if(mask&4) layers.push(3);
    return pick(layers as (1|2|3)[]);
  }

  for(const z of zones){
    const count=z[8];
    const srcCode=z[5];
    for(let i=0;i<count;i++){
      const ly=pickLayer(z[4]);
      const l=R(z[0],z[1]);
      const t=R(z[2],z[3]);
      const sz=Math.round(R(z[6],z[7]));

      // Every garnish uses the same gentle float family; only duration
      // (4/5/6s) and start delay are staggered per element.
      const anim: string = pick(gentleAnims);

      items.push({
        src:resolveSrc(srcCode), t:`${t}%`, l:`${l}%`, sz,
        rot:R(-180,180), sc:R(0.85,1.15),
        op:ly===1?R(0.10,0.30):ly===3?R(0.60,0.95):R(0.30,0.70),
        br:ly===1?R(0.35,0.65):R(0.80,1.20),
        bl:ly===1?R(2,5):0,
        d:R(0,3.6), du:pick(floatDurations),
        a:anim, ly, fl:Math.random()<0.35,
      });
    }
  }

  for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]]}
  return items;
}

/* Tiny pure-CSS sparkle dots scattered near the cake: no images, just a
   radial gradient dot that breathes opacity+scale on a long, staggered
   cycle. Reinforces the "dreamy magical particles" feel alongside the
   floating garnishes, with zero JS and zero pointer input. */
function generateFeaturedSparks(): SparkItem[] {
  const R=(a:number,b:number)=>Math.random()*(b-a)+a;
  const n=4;
  const sparks:SparkItem[]=[];
  for(let i=0;i<n;i++){
    sparks.push({
      t:R(18,72),
      l:R(14,90),
      sz:R(4,8),
      du:R(3.6,5.8),
      d:R(0,4.8),
      gold:Math.random()<0.5,
    });
  }
  return sparks;
}

/* Mobile-only (375-430px) side-flank garnish set. Opposite direction
   from the cut-back: this version fills the LEFT and RIGHT margin edges
   of the section with a richer, larger wave of fruit/leaf pieces (each
   roughly +30-40% bigger than the trimmed set) while still never
   entering the centre text block. Slot maths is pinned to real 375/430
   measurements: EVERY flank fruit's bottom stays above the heading
   (T<49), the top row lives in the small frieze above the cake, and the
   two mid pieces hug the extreme gutters (≤12px) beside the paragraph.
   Each keeps the magical float+pulse+glow animation with its own
   duration/delay. Tablet/desktop keep the full set untouched.
   Priority order won't hurt: no fruit ever crosses readable text. */
function generateMobileFeaturedDecorations(): DecoItem[] {
  const R=(a:number,b:number)=>Math.random()*(b-a)+a;
  const pick=<T,>(a:T[])=>a[Math.floor(Math.random()*a.length)];
  const gentleAnims=['deco-float-a','deco-float-b'];
  const floatDurations=[4,5,6,7];
  const srcs=[blueberry1,blueberry2,mintLeaf1,mintLeaf2];
  // [lMin,lMax, tMin,tMax, layer(1=bg,2=mid,3=front), szMin,szMax]
  const spots:[number,number,number,number,1|2|3,number,number][]=[
    // ── LEFT flank (x 0-16%, y 3-47%) ──
    [0,6,  3,10,  2, 26,36],
    [1,8,  12,20, 3, 34,48],
    [0,7,  22,30, 2, 28,40],
    [4,16, 26,34, 2, 24,36],
    [0,7,  33,41, 1, 30,44],
    [2,16, 34,40, 3, 24,36],
    [0,5,  42,47, 2, 20,30],
    // ── RIGHT flank (x 84-99%, y 2-45%) ──
    [93,99, 2,8,  2, 22,34],
    [88,98, 12,20, 3, 34,50],
    [90,99, 24,32, 2, 28,42],
    [84,93, 30,38, 2, 26,38],
    [86,97, 35,41, 1, 30,44],
    [90,99, 38,42, 3, 20,30],
    [94,99, 42,44, 2, 18,28],
    // ── TOP frieze (above the cake) ──
    [30,60, 0,4,  2, 20,30],
    [70,92, 1,5,  3, 18,26],
    // ── Extreme gutters beside the paragraph (tiny, never touch text) ──
    [0.4,1.4, 52,70, 3, 9,12],
    [98,99.3, 60,84, 3, 9,12],
  ];
  const items:DecoItem[]=[];
  for(const [lMin,lMax,tMin,tMax,ly,szMin,szMax] of spots){
    items.push({
      src:pick(srcs),
      t:`${R(tMin,tMax)}%`, l:`${R(lMin,lMax)}%`,
      sz:Math.round(R(szMin,szMax)),
      rot:R(-40,40), sc:R(0.9,1.18),
      op:ly===1?R(0.3,0.52):ly===3?R(0.6,0.9):R(0.42,0.74),
      br:ly===1?R(0.5,0.7):R(0.85,1.15),
      bl:ly===1?R(2,4):0,
      d:R(0,3.8), du:pick(floatDurations),
      a:pick(gentleAnims), ly, fl:Math.random()<0.3,
    });
  }
  for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]]}
  return items;
}

function generateMobileFeaturedSparks(): SparkItem[] {
  const R=(a:number,b:number)=>Math.random()*(b-a)+a;
  // small sparkles in the same empty bands, away from any text
  const spots:[number,number,number,number,boolean][]=[
    [12,40, 1,7,  true],
    [58,88, 2,9,  false],
    [1,7,   28,44, true],
    [92,99, 26,42, false],
  ];
  return spots.slice(0,3).map(([lMin,lMax,tMin,tMax,gold])=>({
    t:R(tMin,tMax), l:R(lMin,lMax), sz:R(4,7),
    du:R(3.6,5.8), d:R(0,4.8), gold,
  }));
}

interface FeaturedSectionProps {
  product: Product;
}

export default function FeaturedSection({ product }: FeaturedSectionProps) {
  const [isMobileFeat, setIsMobileFeat] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 480px)').matches
  );
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 480px)');
    const cb = () => setIsMobileFeat(mql.matches);
    mql.addEventListener('change', cb);
    return () => mql.removeEventListener('change', cb);
  }, []);
  const featuredDecos = useMemo(
    () => (isMobileFeat ? generateMobileFeaturedDecorations() : generateFeaturedDecorations()),
    [isMobileFeat]
  );
  const featuredSparks = useMemo(
    () => (isMobileFeat ? generateMobileFeaturedSparks() : generateFeaturedSparks()),
    [isMobileFeat]
  );

  return (
    <section
      className="section"
      style={{
        paddingTop:'var(--section-y)',
        paddingBottom:'var(--section-y)',
        paddingLeft:'var(--page-pad)',
        paddingRight:'var(--page-pad)',
        background:'radial-gradient(ellipse 600px 420px at 25% 48%, rgba(255,215,228,0.6) 0%, transparent 62%), linear-gradient(180deg, #FFF0F5 0%, #FFE8EF 50%, #FFF0F5 100%)',
        overflow:'hidden',
      }}
    >
      {/* soft glow behind cake */}
      <div style={{
        position:'absolute', top:'28%', left:'12%', width:'42%', paddingBottom:'34%',
        borderRadius:'50%',
        background:'radial-gradient(circle, rgba(255,200,218,0.4) 0%, transparent 68%)',
        filter:'blur(60px)', pointerEvents:'none', zIndex:0,
      }} />

      {/* natural garnishes — pure CSS magical float; motion comes only
          from @keyframes (drift + breathe + glow + tilt), zero JS and
          zero pointer input. blur/brightness sit on the inner img so
          the wrapper animation owns the pulsing drop-shadow freely. */}
      {featuredDecos.map((d,i) => {
        const trfBase = `rotate(${d.rot}deg) scale(${d.sc})${d.fl?' scaleX(-1)':''}`;
        return (
          <div
            key={i}
            className={d.ly===1?'deco-png-bg':d.ly===3?'deco-png-front':'deco-png'}
            style={{
              top:d.t, left:d.l, opacity:d.op,
              animation:`${d.a} ${d.du}s ease-in-out ${d.d}s infinite both`,
              willChange:'transform',
            }}
          >
            <img src={d.src} alt=""
              style={{
                width:d.sz, height:'auto', display:'block',
                filter:d.bl?`blur(${d.bl}px) brightness(${d.br})`:`brightness(${d.br})`,
                transform: trfBase,
              }} />
          </div>
        );
      })}
      {/* magical sparkle dots — CSS-only glow dots, staggered fade */}
      {featuredSparks.map((s,i) => (
        <span
          key={'spark'+i}
          className="deco-spark"
          style={{
            top:s.t+'%', left:s.l+'%',
            width:s.sz+'px', height:s.sz+'px',
            background: s.gold
              ? 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.95), rgba(255,214,170,0.55) 45%, rgba(255,190,140,0) 75%)'
              : 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.95), rgba(255,190,205,0.55) 45%, rgba(255,150,190,0) 75%)',
            animation:`sparkle-fade ${s.du}s ease-in-out ${s.d}s infinite both`,
          }}
        />
      ))}

      <div className="featured-grid">
        <div className="featured-in-l" style={{ position:'relative' }}>
          {/* plate shadow */}
          <div style={{
            position:'absolute', bottom:'4%', left:'6%', width:'88%', paddingBottom:'16%',
            borderRadius:'50%',
            background:'radial-gradient(ellipse at center, rgba(53,80,112,0.22) 0%, transparent 68%)',
            filter:'blur(14px)', pointerEvents:'none', zIndex:0,
          }} />
          <div className="featured-image-wrap">
            <img src={blueberryImg} alt={product.name} width={500} height={500} />
          </div>
        </div>

        <div className="featured-in-r" style={{ position: 'relative', zIndex: 6 }}>
          <span className="featured-badge">Our Star Treat</span>
          <h2 className="featured-heading">{product.name}</h2>
          <div className="featured-rating">
            <StarRating rating={product.rating} showValue reviewCount={product.reviewCount} />
          </div>
          <p className="featured-desc">{product.description}</p>
          <div className="featured-actions">
            <span className="featured-price">${product.price.toFixed(2)}</span>
            <div className="featured-btn-wrap">
              <Button to={`/product/${product.slug}`} className="featured-btn">
                View Product
              </Button>
              {/* Decorative fruit/berry elements around the button */}
              <img
                src={blueberry1}
                alt=""
                className="deco-btn deco-btn--bl"
                aria-hidden="true"
              />
              <img
                src={mintLeaf1}
                alt=""
                className="deco-btn deco-btn--tl"
                aria-hidden="true"
              />
              <img
                src={blueberry2}
                alt=""
                className="deco-btn deco-btn--tr"
                aria-hidden="true"
              />
              <img
                src={mintLeaf2}
                alt=""
                className="deco-btn deco-btn--br"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}