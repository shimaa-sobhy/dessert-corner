import row1 from '../assets/ROW1.webp';
import row2 from '../assets/ROW2.webp';
import row3 from '../assets/ROW3.avif';
import guide from '../assets/Guide.webp';
import donutSecret from '../assets/The Secret to Soft & Fluffy Donuts.webp';
import kitchenMorning from '../assets/kitchen-morning.webp';
import type { Article } from '../lib/types';

export const ARTICLES: Article[] = [
  {
    slug: 'how-we-bake-fresh-every-morning',
    title: 'How We Bake Fresh Every Morning',
    category: 'Behind the Counter',
    cover: row1,
    excerpt: 'A look inside our kitchen from 4am to opening — and why nothing is ever baked the day before.',
    author: 'Chef Amina Farid',
    date: '2026-06-10',
    readTime: '4 min read',
    content: [
      'Our first baker arrives at 4am, before the streetlights are off. The croissant dough that was shaped and chilled the night before goes straight into the proofer, and the day\'s cake orders are pulled from the schedule board.',
      'By 5am the donut dough is mixing, and the oven is coming up to temperature. Every batch is mixed, shaped, proofed, and baked within the same morning — nothing sits overnight, and nothing is baked more than a few hours before it hits the display case.',
      'We work in a tight window because freshness is the only advantage a bakery has over a factory. A croissant baked at 6am and eaten at 8am still has the moisture it lost during baking; by 4pm it has given half of that moisture back to the air.',
      'The kitchen is usually silent for the first two hours — just the sound of the mixer and the oven door. By the time we unlock the front door at 8am, we have already been baking for four hours, and the whole display case is full of things that were flour, butter, and eggs a few hours earlier.',
    ],
  },
  {
    slug: 'how-to-store-your-desserts',
    title: 'How to Store Every Dessert We Sell',
    category: 'Storage',
    cover: row2,
    excerpt: 'A quick reference so your order tastes as good on day two as it did on day one.',
    author: 'Chef Amina Farid',
    date: '2026-01-30',
    readTime: '2 min read',
    content: [
      'Donuts and croissants are best the day they arrive, kept at room temperature in a paper bag rather than sealed plastic, which keeps them from going soft.',
      'Cakes should stay refrigerated and are best brought to room temperature about 20 minutes before serving — this softens the mousse and brings out the flavor.',
      'Frozen items like the blueberry stack and gelato flight should go straight to the freezer on arrival and be moved to the fridge shortly before serving, following the instructions on the box.',
    ],
  },
  {
    slug: 'summer-gelato-guide',
    title: 'A Guide to Our Summer Gelato Flavors',
    category: 'Seasonal',
    cover: guide,
    excerpt: 'What is actually different between gelato and ice cream, and how our rotation works.',
    author: 'Chef Amina Farid',
    date: '2026-06-05',
    readTime: '3 min read',
    content: [
      'Gelato has less air churned into it than American-style ice cream, and typically less fat, which gives it a denser texture and a flavor that reads more intensely on the tongue.',
      'Our flavor rotation follows what is in season locally — stone fruit in early summer, berries mid-season, and citrus again as we move toward autumn. We rarely repeat the exact same flight twice in a month.',
      'If you want a preview of what is coming, follow along on our newsletter — we post the following week\'s flavors every Sunday.',
    ],
  },
  {
    slug: 'the-secret-to-soft-fluffy-donuts',
    title: 'The Secret to Soft & Fluffy Donuts',
    category: 'Baking',
    cover: donutSecret,
    excerpt: 'Why we proof our donuts twice, and what type of flour actually makes them tender.',
    author: 'Chef Amina Farid',
    date: '2026-05-22',
    readTime: '3 min read',
    content: [
      'The difference between a donut that feels light and one that feels greasy comes down to two things: flour protein content and proofing time. We use a lower-protein flour than our bread doughs — around 10.5% — which develops less gluten and keeps the crumb tender.',
      'After shaping, our donuts proof twice. The first proof develops the yeast activity and structure. The second proof, after shaping, allows the dough to relax and rise again before it hits the oil. Most donut shops skip the first proof to save time, but the texture suffers noticeably.',
      'Oil temperature is the second critical factor. We fry at 350°F and never crowd the pot — adding too many donuts at once drops the oil temperature and causes the dough to absorb more fat before it sets. A properly fried donut should feel clean to the touch, not slick.',
    ],
  },
  {
    slug: 'choosing-the-finest-ingredients',
    title: 'Choosing the Finest Ingredients for Every Dessert',
    category: 'Ingredients',
    cover: row3,
    excerpt: 'How we source butter, chocolate, and vanilla — and why the ingredient list matters more than the recipe.',
    author: 'Chef Amina Farid',
    date: '2026-06-01',
    readTime: '4 min read',
    content: [
      'A recipe is only as good as its weakest ingredient. We use European-style butter with 84% butterfat because the extra fat means less water, which gives pastry a flakier texture. Standard American butter, at 80% fat, introduces enough extra water to change the way dough behaves.',
      'Our chocolate comes from a single-origin supplier in Madagascar. The cocoa beans from that region have a natural fruitiness that carries through into the finished dessert, which lets us use less sugar and no artificial flavoring. We taste every new harvest batch before committing to it for the season.',
      'Vanilla is the ingredient that most bakeries cut corners on, and it is the one our customers notice most. We use whole Madagascar vanilla beans steeped in organic sugar rather than vanilla extract, which gives a more complex, floral note that you cannot replicate with syrup.',
      'None of these choices are cheap, and they make our cost per dessert higher than most bakeries. But we have found that customers who care about what they are eating are willing to pay for the difference, and that is the only customer we want to serve.',
    ],
  },
  {
    slug: 'inside-our-kitchen',
    title: 'A Morning Inside Our Kitchen',
    category: 'Behind the Counter',
    cover: kitchenMorning,
    excerpt: 'A walk-through of what actually happens between 4am and opening.',
    author: 'Chef Amina Farid',
    date: '2026-02-14',
    readTime: '5 min read',
    content: [
      'Our first team member arrives at 4am to start the croissant lamination that was shaped the night before. By 5am, the donut dough is proofing and the day\'s cake orders are being pulled from the schedule.',
      'Everything you see in the case by 8am was, at some point that morning, a mixing bowl of flour and butter. Nothing is baked more than a day ahead, and nothing frozen is served without being clearly labeled as such.',
      'By the time we open the doors, the kitchen has usually been running for four hours already — which is part of why we close the kitchen early and start the whole process again the next day.',
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function getRelatedArticles(article: Article, limit = 3): Article[] {
  return ARTICLES.filter((a) => a.slug !== article.slug && a.category === article.category)
    .concat(ARTICLES.filter((a) => a.slug !== article.slug && a.category !== article.category))
    .slice(0, limit);
}
