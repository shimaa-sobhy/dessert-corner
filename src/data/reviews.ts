import type { Review } from '../lib/types';

export const REVIEWS: Review[] = [
  { id: 'r1', productId: 'donut-chocolate-sprinkle', author: 'Mona R.', rating: 5, date: '2026-05-14', title: 'Worth the trip', body: 'The chocolate glaze is unreal — not too sweet and the dough is so soft. My weekend ritual now.' },
  { id: 'r2', productId: 'donut-chocolate-sprinkle', author: 'Karim S.', rating: 5, date: '2026-04-02', title: 'Best donut in the city', body: 'Ordered a dozen for the office and they were gone in ten minutes. Will order again.' },
  { id: 'r3', productId: 'strawberry-glazed-donut', author: 'Layla H.', rating: 5, date: '2026-05-20', title: 'My daughter loves it', body: 'Real strawberry flavor, not artificial at all. Sprinkles are a nice touch for the kids.' },
  { id: 'r4', productId: 'pink-sprinkle-donut', author: 'Omar F.', rating: 5, date: '2026-06-01', title: 'Photogenic and delicious', body: 'Looks incredible on the box and tastes even better. The pink glaze makes it.' },
  { id: 'r5', productId: 'blueberry-cheesecake', author: 'Nadine K.', rating: 5, date: '2026-03-18', title: 'Showstopper for celebrations', body: 'Ordered for my mom\'s birthday, arrived exactly on time and looked stunning on the table.' },
  { id: 'r6', productId: 'blueberry-cheesecake', author: 'Youssef A.', rating: 4, date: '2026-02-27', title: 'Delicious, a touch sweet', body: 'Great texture and presentation. Slightly sweeter than I expected but still excellent.' },
  { id: 'r7', productId: 'butter-croissant', author: 'Sara M.', rating: 5, date: '2026-05-30', title: 'Actually flaky', body: 'Finally a croissant that shatters when you bite it. Worth ordering the night before.' },
  { id: 'r8', productId: 'double-chocolate-brownie', author: 'Hassan T.', rating: 5, date: '2026-04-22', title: 'Rich and fudgy', body: 'Dense in the best way. The sea salt on top is the perfect finishing touch.' },
  { id: 'r9', productId: 'belgian-waffle', author: 'Dina E.', rating: 4, date: '2026-06-10', title: 'Great for brunch', body: 'Reheated perfectly the next morning. Would love an option for more syrup.' },
  { id: 'r10', productId: 'gelato-sundae', author: 'Amir L.', rating: 5, date: '2026-06-15', title: 'Perfect summer treat', body: 'Pistachio and dark chocolate were my favorites. Arrived still perfectly frozen.' },
];

export function getReviewsForProduct(productId: string): Review[] {
  return REVIEWS.filter((r) => r.productId === productId);
}
