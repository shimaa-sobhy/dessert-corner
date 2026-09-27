import type { Category } from '../lib/types';

import cakeBlue from '../assets/cake-blue.webp';
import blueberryCheesecake from '../assets/Blueberry.webp';
import shop3 from '../assets/shop3.webp';
import shop7 from '../assets/shop7.webp';
import shop9 from '../assets/shop9.webp';
import shop5 from '../assets/shop5.webp';
import shop2 from '../assets/shop2.webp';

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export const CATEGORIES: Category[] = [
  { slug: 'cakes', name: 'Cakes', image: cakeBlue, description: 'Layered cakes for every occasion, made from scratch.' },
  { slug: 'pastries', name: 'Pastries', image: shop3, description: '72-hour laminated dough, butter-forward and flaky.' },
  { slug: 'cupcakes', name: 'Cupcakes', image: shop7, description: 'Light sponges topped with silky buttercream.' },
  { slug: 'cheesecakes', name: 'Cheesecakes', image: blueberryCheesecake, description: 'Dense, creamy slices on a buttery crust.' },
  { slug: 'waffles', name: 'Waffles', image: shop9, description: 'Brown-butter batter waffles, stacked and syrup-ready.' },
  { slug: 'brownies', name: 'Brownies', image: shop5, description: 'Dense, fudgy squares finished with dark ganache.' },
  { slug: 'ice-cream', name: 'Ice Cream', image: shop2, description: 'Small-batch ice cream in rotating seasonal fruit flavors.' },
];