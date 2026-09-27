import type { Review } from '../lib/types';
import StarRating from './StarRating';

export default function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <p style={{ color: 'var(--ink-soft)' }}>No reviews yet — be the first to leave one.</p>;
  }
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {reviews.map((r) => (
        <div className="review-card" key={r.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{r.author}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                {new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <StarRating rating={r.rating} size={13} />
          </div>
          <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, marginTop: 12, color: 'var(--ink)' }}>{r.title}</div>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.7, marginTop: 6 }}>{r.body}</p>
        </div>
      ))}
    </div>
  );
}
