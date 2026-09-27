import { memo } from 'react';

interface Props {
  rating: number;
  size?: number;
  showValue?: boolean;
  reviewCount?: number;
}

function StarRating({ rating, size = 14, showValue = false, reviewCount }: Props) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span className="stars" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = rounded >= i;
        const half = !filled && rounded >= i - 0.5;
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill={filled ? 'currentColor' : 'none'}>
            {half ? (
              <defs>
                <linearGradient id={`half-${i}`}>
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
            ) : null}
            <path
              d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.8L10 14.77l-5.2 2.75.99-5.8-4.21-4.1 5.82-.85L10 1.5z"
              fill={half ? `url(#half-${i})` : filled ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
        );
      })}
      {showValue ? (
        <span style={{ color: 'var(--ink-soft)', fontSize: 12, marginLeft: 4, fontWeight: 600 }}>
          {rating.toFixed(1)} {reviewCount !== undefined ? `(${reviewCount})` : ''}
        </span>
      ) : null}
    </span>
  );
}

export default memo(StarRating);
