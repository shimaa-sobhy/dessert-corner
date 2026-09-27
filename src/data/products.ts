import type { Product } from '../lib/types';

import cakeBlue from '../assets/cake-blue.webp';
import blueberryCheesecake from '../assets/Blueberry.webp';
import brownieImg from '../assets/brownie.webp';
import icecreamImg from '../assets/icecream.webp';
import waffleImg from '../assets/waffle.webp';
import tastyBlu from '../assets/tasty-blu.webp';
import shop1 from '../assets/shop1.webp';
import shop2 from '../assets/shop2.webp';
import shop3 from '../assets/shop3.webp';
import shop4 from '../assets/shop4.webp';
import shop5 from '../assets/shop5.webp';
import shop6 from '../assets/shop6.webp';
import shop7 from '../assets/shop7.webp';
import shop8 from '../assets/shop8.webp';
import shop9 from '../assets/shop9.webp';
import shop10 from '../assets/shop10.webp';
import shop12 from '../assets/shop12.webp';
import shop13 from '../assets/shop13.webp';
import shop14 from '../assets/shop14.webp';

/**
 * Retrieves a product from the PRODUCTS array by its unique ID (slug).
 * Returns undefined if no product matches the given ID.
 */
export function getProductById(id: string) {
  return PRODUCTS.find((product) => product.id === id);
}

export function getProduct(slug: string) {
  return PRODUCTS.find((product) => product.slug === slug);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return PRODUCTS.filter(
    (p) => p.categorySlug === product.categorySlug && p.id !== product.id
  ).slice(0, limit);
}

export const PRODUCTS: Product[] = [
  // ────────── CAKES & CHEESECAKES ──────────
  {
    id: 'celebration-layer-cake',
    slug: 'celebration-layer-cake',
    name: 'Celebration Layer Cake',
    categorySlug: 'cakes',
    price: 46,
    image: cakeBlue,
    rating: 4.9,
    reviewCount: 56,
    shortDescription: 'Elegant multi-layer cake with vanilla buttercream and a pastel finish.',
    description:
      'A stunning celebration cake featuring multiple layers of tender vanilla sponge, each filled with silky vanilla buttercream. The exterior is finished with a smooth pastel blue frosting and topped with decorative piping. Perfect for birthdays and special occasions. Serves 10–12.',
    ingredients: ['Wheat flour', 'Butter', 'Cane sugar', 'Free-range eggs', 'Vanilla bean', 'Whole milk', 'Powdered sugar', 'Natural food coloring'],
    nutrition: { calories: 440, fat: '22g', sugar: '33g', protein: '4g', servingSize: '1 slice (120g)' },
    deliveryInfo: 'Made to order with 48 hours notice. Delivered chilled in a rigid box. Keep refrigerated and consume within 4 days.',
    isBestSeller: true,
    inStock: true,
    tags: ['celebration', 'layer cake', 'vanilla'],
  },
  {
    id: 'blueberry-cheesecake',
    slug: 'blueberry-cheesecake',
    name: 'Blueberry Cheesecake',
    categorySlug: 'cheesecakes',
    price: 45,
    image: blueberryCheesecake,
    rating: 4.8,
    reviewCount: 62,
    shortDescription: 'Creamy baked cheesecake topped with blueberry compote.',
    description:
      'A dense, velvety baked cheesecake on a buttery graham cracker crust, topped with a generous layer of house-made blueberry compote. Made with premium cream cheese and slow-baked for a perfectly smooth texture. Serves 8–10.',
    ingredients: ['Cream cheese', 'Cane sugar', 'Sour cream', 'Free-range eggs', 'Vanilla bean', 'Fresh blueberries', 'Lemon juice', 'Graham crackers', 'Butter'],
    nutrition: { calories: 450, fat: '26g', sugar: '30g', protein: '7g', servingSize: '1 slice (120g)' },
    deliveryInfo: 'Made to order with 24 hours notice. Delivered chilled — keep refrigerated and consume within 5 days.',
    isBestSeller: true,
    inStock: true,
    tags: ['cheesecake', 'blueberry', 'baked'],
  },
  {
    id: 'berry-celebration-cake',
    slug: 'berry-celebration-cake',
    name: 'Berry Celebration Cake',
    categorySlug: 'cakes',
    price: 44,
    image: shop12,
    rating: 4.7,
    reviewCount: 41,
    shortDescription: 'Mixed berry-studded vanilla cake with berry buttercream.',
    description:
      'A beautiful celebration cake with a tender vanilla crumb studded with raspberries and blueberries. Layered with berry-swirled buttercream and topped with a cascade of fresh berries. Serves 8–10.',
    ingredients: ['Wheat flour', 'Butter', 'Cane sugar', 'Raspberries', 'Blueberries', 'Free-range eggs', 'Vanilla bean', 'Whole milk'],
    nutrition: { calories: 400, fat: '20g', sugar: '29g', protein: '5g', servingSize: '1 slice (115g)' },
    deliveryInfo: 'Made to order with 24 hours notice. Keep refrigerated and consume within 3 days.',
    inStock: true,
    tags: ['berry', 'celebration', 'mixed fruit'],
  },
  {
    id: 'triple-chocolate-cake',
    slug: 'triple-chocolate-cake',
    name: 'Triple Chocolate Cake',
    categorySlug: 'cakes',
    price: 48,
    image: shop13,
    rating: 4.9,
    reviewCount: 73,
    shortDescription: 'Dark, milk, and white chocolate layers in one showstopping cake.',
    description:
      'Three distinct layers — dark chocolate sponge, milk chocolate mousse, and white chocolate ganache — stacked into one decadent cake. Finished with chocolate shards, curls, and a glossy dark chocolate drip. Serves 10–12.',
    ingredients: ['Dark chocolate 70%', 'Milk chocolate', 'White chocolate', 'Wheat flour', 'Butter', 'Cane sugar', 'Free-range eggs', 'Fresh cream', 'Vanilla extract'],
    nutrition: { calories: 520, fat: '30g', sugar: '38g', protein: '7g', servingSize: '1 slice (130g)' },
    deliveryInfo: 'Made to order with 48 hours notice. Keep refrigerated and consume within 4 days. Best served at room temperature.',
    isBestSeller: true,
    inStock: true,
    tags: ['chocolate', 'triple layer', 'celebration'],
  },
  // ────────── BROWNIES ──────────
  {
    id: 'double-chocolate-brownie',
    slug: 'double-chocolate-brownie',
    name: 'Double Chocolate Brownie',
    categorySlug: 'brownies',
    price: 6.5,
    image: brownieImg,
    rating: 4.9,
    reviewCount: 143,
    shortDescription: 'Dense, fudgy brownie made with two kinds of dark chocolate.',
    description:
      'A deliberately dense, fudgy brownie made with two kinds of dark chocolate — cocoa powder and melted chocolate — for an intensely rich flavor. Finished with a warm ganache pour and flaked sea salt. Cut thick and satisfying.',
    ingredients: ['Dark chocolate 70%', 'Cocoa powder', 'Butter', 'Cane sugar', 'Free-range eggs', 'Wheat flour', 'Sea salt'],
    nutrition: { calories: 390, fat: '21g', sugar: '28g', protein: '5g', servingSize: '1 brownie (80g)' },
    deliveryInfo: 'Shelf-stable for 5 days at room temperature in the box provided. Freezes well for up to a month.',
    isBestSeller: true,
    inStock: true,
    tags: ['chocolate', 'brownie', 'fudgy'],
  },
  {
    id: 'brownie-stack',
    slug: 'brownie-stack',
    name: 'Double Chocolate Brownie Stack',
    categorySlug: 'brownies',
    price: 8.5,
    image: shop5,
    rating: 4.8,
    reviewCount: 87,
    shortDescription: 'Two stacked fudge brownie squares with dark ganache drizzle.',
    description:
      'A generous stack of two thick, fudgy dark chocolate brownie squares, drizzled with dark chocolate ganache and finished with flaked sea salt. The ultimate chocolate indulgence for true brownie lovers.',
    ingredients: ['Dark chocolate 70%', 'Cocoa powder', 'Butter', 'Cane sugar', 'Free-range eggs', 'Wheat flour', 'Sea salt', 'Fresh cream'],
    nutrition: { calories: 520, fat: '28g', sugar: '36g', protein: '7g', servingSize: '1 stack (2 brownies)' },
    deliveryInfo: 'Shelf-stable for 5 days at room temperature in the box provided. Freezes well for up to a month.',
    isBestSeller: true,
    inStock: true,
    tags: ['chocolate', 'brownie', 'stacked'],
  },
  // ────────── ICE CREAM ──────────
  {
    id: 'gelato-sundae',
    slug: 'gelato-sundae',
    name: 'Gelato Sundae',
    categorySlug: 'ice-cream',
    price: 12,
    image: icecreamImg,
    rating: 4.8,
    reviewCount: 39,
    shortDescription: 'Two scoops of artisanal gelato with whipped cream and toppings.',
    description:
      'A classic sundae with two generous scoops of our rotating gelato selection — choose from pistachio, stracciatella, or vanilla bean — topped with fresh whipped cream, a cherry, and your choice of hot fudge or caramel drizzle.',
    ingredients: ['Whole milk', 'Fresh cream', 'Cane sugar', 'Seasonal fruit', 'Pistachio', 'Vanilla bean', 'Dark chocolate', 'Whipped cream'],
    nutrition: { calories: 420, fat: '22g', sugar: '34g', protein: '6g', servingSize: '1 sundae' },
    deliveryInfo: 'Delivered frozen in an insulated box with ice packs. Local delivery only, within a 15km radius.',
    isNew: true,
    inStock: true,
    tags: ['gelato', 'sundae', 'frozen'],
  },
  {
    id: 'mixed-ice-cream-scoops',
    slug: 'mixed-ice-cream-scoops',
    name: 'Mixed Ice Cream Scoops',
    categorySlug: 'ice-cream',
    price: 7,
    image: shop1,
    rating: 4.6,
    reviewCount: 32,
    shortDescription: 'Two creamy scoops of mixed berry ice cream in a chilled cup.',
    description:
      'Two generous scoops of our house-made mixed berry ice cream, crafted with fresh cream and a blend of raspberries, strawberries, and blueberries. Served in a chilled cup with a crisp wafer.',
    ingredients: ['Fresh cream', 'Whole milk', 'Cane sugar', 'Raspberries', 'Strawberries', 'Blueberries', 'Vanilla extract'],
    nutrition: { calories: 280, fat: '16g', sugar: '24g', protein: '4g', servingSize: '2 scoops' },
    deliveryInfo: 'Delivered frozen in an insulated cup. Best enjoyed within 1 hour of serving. Keep frozen until ready.',
    inStock: true,
    tags: ['ice cream', 'mixed berry', 'creamy'],
  },
  {
    id: 'berry-ice-cream-scoops',
    slug: 'berry-ice-cream-scoops',
    name: 'Berry Ice Cream Scoops',
    categorySlug: 'ice-cream',
    price: 8,
    image: shop2,
    rating: 4.7,
    reviewCount: 44,
    shortDescription: 'Rich berry ice cream served in a take-home cup.',
    description:
      'A generous serving of our signature berry ice cream, made with a creamy custard base and generous swirls of raspberry and blueberry compote. Served in a chilled cup ready to enjoy.',
    ingredients: ['Fresh cream', 'Whole milk', 'Cane sugar', 'Free-range egg yolks', 'Raspberry compote', 'Blueberry compote', 'Vanilla bean'],
    nutrition: { calories: 320, fat: '18g', sugar: '28g', protein: '5g', servingSize: '1 cup' },
    deliveryInfo: 'Delivered frozen in an insulated cup. Keep frozen and let soften 5 minutes before serving.',
    inStock: true,
    tags: ['ice cream', 'berry', 'creamy'],
  },
  // ────────── PASTRIES ──────────
  {
    id: 'butter-croissant',
    slug: 'butter-croissant',
    name: 'Butter Croissant',
    categorySlug: 'pastries',
    price: 5.25,
    image: shop3,
    rating: 4.9,
    reviewCount: 210,
    shortDescription: '72-hour laminated dough, all butter, baked to order.',
    description:
      'Our croissant dough rests for 72 hours across three lamination sessions with cultured French-style butter. The result: a shatter-crisp exterior and an open, honeycombed crumb. Sold in pairs.',
    ingredients: ['Wheat flour', 'Cultured butter', 'Whole milk', 'Cane sugar', 'Yeast', 'Sea salt'],
    nutrition: { calories: 290, fat: '17g', sugar: '4g', protein: '6g', servingSize: '1 croissant (70g)' },
    deliveryInfo: 'Baked fresh each morning — order by 9pm for next-day morning delivery. Best eaten the day of arrival.',
    isBestSeller: true,
    inStock: true,
    tags: ['pastry', 'breakfast', 'laminated dough'],
  },
  {
    id: 'chocolate-danish',
    slug: 'chocolate-danish',
    name: 'Chocolate Danish',
    categorySlug: 'pastries',
    price: 5.5,
    image: shop4,
    rating: 4.7,
    reviewCount: 76,
    shortDescription: 'Flaky Danish dough twisted with dark chocolate and baked golden.',
    description:
      'A buttery laminated Danish dough twisted with a rich dark chocolate filling, then baked until the edges caramelize and the chocolate stays molten at the center. Finished with a light dusting of powdered sugar.',
    ingredients: ['Wheat flour', 'Butter', 'Dark chocolate 60%', 'Cane sugar', 'Whole milk', 'Yeast', 'Free-range eggs'],
    nutrition: { calories: 350, fat: '19g', sugar: '16g', protein: '6g', servingSize: '1 Danish (90g)' },
    deliveryInfo: 'Baked fresh each morning — order by 9pm for next-day morning delivery. Best eaten the day of arrival.',
    inStock: true,
    tags: ['danish', 'chocolate', 'pastry'],
  },
  {
    id: 'cinnamon-roll',
    slug: 'cinnamon-roll',
    name: 'Braided Sweet Bread',
    categorySlug: 'pastries',
    price: 5.5,
    image: shop6,
    rating: 4.7,
    reviewCount: 88,
    shortDescription: 'Round braided sweet bread with a soft, airy crumb and a light dusting of powdered sugar.',
    description:
      'A round, golden braided bread with a tender airy crumb, gently sweet and finished with a soft snowfall of powdered sugar. Pull-apart friendly — lovely toasted, or with butter and jam.',
    ingredients: ['Wheat flour', 'Butter', 'Cane sugar', 'Whole milk', 'Free-range eggs', 'Fresh yeast', 'Powdered sugar', 'Sea salt'],
    nutrition: { calories: 380, fat: '18g', sugar: '28g', protein: '5g', servingSize: '1 slice (95g)' },
    deliveryInfo: 'Baked fresh each morning — order by 9pm for next-day morning delivery. Best eaten the day of arrival.',
    isBestSeller: true,
    inStock: true,
    tags: ['pastry', 'braided', 'bread', 'sweet bread', 'breakfast'],
  },
  {
    id: 'chocolate-croissant',
    slug: 'chocolate-croissant',
    name: 'Berry Chocolate Croissant',
    categorySlug: 'pastries',
    price: 5.75,
    image: shop8,
    rating: 4.8,
    reviewCount: 165,
    shortDescription: 'Buttery laminated croissant topped with dark chocolate drizzle and fresh berries.',
    description:
      'The same 72-hour laminated dough as our classic croissant, baked golden and finished with a glossy dark chocolate drizzle and a crown of fresh blackberries and strawberries. Crisp, buttery layers with juicy berries in every bite.',
    ingredients: ['Wheat flour', 'Cultured butter', 'Dark chocolate 60%', 'Fresh blackberries', 'Fresh strawberries', 'Whole milk', 'Cane sugar', 'Yeast', 'Sea salt'],
    nutrition: { calories: 340, fat: '19g', sugar: '12g', protein: '7g', servingSize: '1 croissant (80g)' },
    deliveryInfo: 'Baked fresh each morning — order by 9pm for next-day morning delivery. Best eaten the day of arrival.',
    isBestSeller: true,
    inStock: true,
    tags: ['pastry', 'chocolate', 'berry', 'breakfast', 'laminated dough'],
  },
  // ────────── CUPCAKES ──────────
  {
    id: 'chocolate-frosting-cupcake',
    slug: 'chocolate-frosting-cupcake',
    name: 'Chocolate Frosting Cupcake',
    categorySlug: 'cupcakes',
    price: 3.75,
    image: shop7,
    rating: 4.7,
    reviewCount: 91,
    shortDescription: 'Dark chocolate sponge with fudge frosting and chocolate shards.',
    description:
      'A deeply chocolaty sponge made with Dutch-process cocoa, crowned with a glossy dark chocolate fudge frosting and a delicate chocolate curl on top.',
    ingredients: ['Wheat flour', 'Dark chocolate 60%', 'Cocoa powder', 'Butter', 'Cane sugar', 'Free-range eggs', 'Whole milk', 'Vanilla extract'],
    nutrition: { calories: 310, fat: '16g', sugar: '26g', protein: '4g', servingSize: '1 cupcake (80g)' },
    deliveryInfo: 'Best eaten within 24 hours. Shelf-stable for one day at room temperature.',
    isBestSeller: true,
    inStock: true,
    tags: ['cupcake', 'chocolate', 'fudge'],
  },
  {
    id: 'pistachio-frosting-cupcake',
    slug: 'pistachio-frosting-cupcake',
    name: 'Blue Frosting Cupcake',
    categorySlug: 'cupcakes',
    price: 4,
    image: tastyBlu,
    rating: 4.6,
    reviewCount: 63,
    shortDescription: 'Fluffy vanilla sponge crowned with a swirl of blue-teal buttercream.',
    description:
      'A fluffy vanilla bean cupcake topped with a tall, glossy swirl of blue-teal buttercream. Bright, soft, and photogenic — a cheerful modern twist on the classic cupcake.',
    ingredients: ['Wheat flour', 'Butter', 'Cane sugar', 'Vanilla bean', 'Free-range eggs', 'Whole milk', 'Powdered sugar', 'Natural blue food coloring'],
    nutrition: { calories: 290, fat: '15g', sugar: '22g', protein: '4g', servingSize: '1 cupcake (80g)' },
    deliveryInfo: 'Best eaten within 24 hours. Shelf-stable for one day at room temperature.',
    isNew: true,
    inStock: true,
    tags: ['cupcake', 'blue frosting', 'buttercream', 'vanilla'],
  },
  {
    id: 'blueberry-frosting-cupcake',
    slug: 'blueberry-frosting-cupcake',
    name: 'Pistachio Frosting Cupcake',
    categorySlug: 'cupcakes',
    price: 4,
    image: shop10,
    rating: 4.5,
    reviewCount: 55,
    shortDescription: 'Vanilla sponge topped with soft green pistachio buttercream and crushed pistachios.',
    description:
      'A tender vanilla bean cupcake crowned with a soft green pistachio buttercream and a delicate finish of crushed pistachios. Fragrant and gently nutty — an elegant twist on the classic.',
    ingredients: ['Wheat flour', 'Butter', 'Cane sugar', 'Pistachio paste', 'Free-range eggs', 'Whole milk', 'Powdered sugar', 'Crushed pistachios'],
    nutrition: { calories: 285, fat: '14g', sugar: '23g', protein: '3g', servingSize: '1 cupcake (80g)' },
    deliveryInfo: 'Best eaten within 24 hours. Shelf-stable for one day at room temperature.',
    inStock: true,
    tags: ['cupcake', 'pistachio', 'pistachio frosting', 'buttercream'],
  },
  {
    id: 'blue-frosting-cupcake',
    slug: 'blue-frosting-cupcake',
    name: 'Mixed Berry Tart',
    categorySlug: 'pastries',
    price: 3.75,
    image: shop14,
    rating: 4.6,
    reviewCount: 48,
    shortDescription: 'Buttery tart shell heaped with fresh blackberries and blueberries.',
    description:
      'A buttery tart shell generously piled with glossy fresh blackberries and blueberries, brightened with mint leaves and finished with a scatter of pistachios. A jewel-box of fresh berries in every bite.',
    ingredients: ['Wheat flour', 'Butter', 'Cane sugar', 'Fresh blackberries', 'Fresh blueberries', 'Fresh mint', 'Pistachios', 'Powdered sugar'],
    nutrition: { calories: 280, fat: '14g', sugar: '22g', protein: '3g', servingSize: '1 slice (75g)' },
    deliveryInfo: 'Best eaten within 24 hours. Shelf-stable for one day at room temperature.',
    inStock: true,
    tags: ['tart', 'berry', 'mixed berry', 'fruit', 'pastry'],
  },
  // ────────── WAFFLES ──────────
  {
    id: 'belgian-waffle',
    slug: 'belgian-waffle',
    name: 'Belgian Waffle',
    categorySlug: 'waffles',
    price: 10.5,
    image: waffleImg,
    rating: 4.7,
    reviewCount: 68,
    shortDescription: 'Golden Belgian waffle with deep pockets, served with toppings.',
    description:
      'A thick, golden Belgian waffle with deep pockets made from a pearl-sugar-laced batter. Served with fresh strawberries, blueberries, a cloud of whipped cream, and a drizzle of warm maple syrup.',
    ingredients: ['Wheat flour', 'Pearl sugar', 'Butter', 'Whole milk', 'Free-range eggs', 'Maple syrup', 'Fresh strawberries', 'Blueberries', 'Whipped cream'],
    nutrition: { calories: 480, fat: '22g', sugar: '26g', protein: '8g', servingSize: '1 waffle' },
    deliveryInfo: 'Delivered warm within city limits. Reheat in a toaster for best texture. Best eaten the day of delivery.',
    isBestSeller: true,
    inStock: true,
    tags: ['waffle', 'belgian', 'breakfast'],
  },
  {
    id: 'belgian-waffle-stack',
    slug: 'belgian-waffle-stack',
    name: 'Belgian Waffle Stack',
    categorySlug: 'waffles',
    price: 8.5,
    image: shop9,
    rating: 4.6,
    reviewCount: 52,
    shortDescription: 'Classic Belgian waffle stack, golden and crisp, served with syrup.',
    description:
      'A pair of classic Belgian waffles with a caramelized crispy exterior and a soft, airy interior thanks to pearl sugar in the batter. Served with a side of warm maple syrup and a pat of butter.',
    ingredients: ['Wheat flour', 'Pearl sugar', 'Butter', 'Whole milk', 'Free-range eggs', 'Yeast', 'Maple syrup'],
    nutrition: { calories: 420, fat: '20g', sugar: '22g', protein: '7g', servingSize: '2 waffles' },
    deliveryInfo: 'Delivered warm within city limits. Reheat in a toaster for best texture. Best eaten the day of delivery.',
    inStock: true,
    tags: ['waffle', 'belgian', 'classic'],
  },
];