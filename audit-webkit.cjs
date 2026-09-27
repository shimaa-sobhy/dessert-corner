// PRE-LAUNCH AUDIT — Section 6: WebKit cross-browser spot check
const { webkit } = require('playwright');
const fs = require('fs');
const BASE = process.env.AUDIT_BASE || 'http://localhost:4174';
const OUT = 'audit-webkit.log';

let failures = 0;
const lines = [];
function log(s) { lines.push(s); console.log(s); }
function ok(cond, label, extra) {
  const line = (cond ? '  PASS: ' : '  FAIL: ') + label + (extra ? ' | ' + extra : '');
  if (!cond) failures++;
  log(line);
}

function watchErrors(page, arr) {
  page.on('console', (m) => { if (m.type() === 'error' && !/^Failed to load resource/.test(m.text())) arr.push(m.text()); });
  page.on('pageerror', (e) => arr.push(String(e)));
}

async function main() {
  const browser = await webkit.launch();
  const errs = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  watchErrors(page, errs);

  log('\n## WebKit: Home');
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load');
  await page.waitForTimeout(800);
  // Below-fold sections mount lazily; walk to the bottom so everything
  // exists, then bring the carousel in-view so its lazy images load.
  let prev = -1, guard = 0, stable = 0;
  while (guard++ < 14 && stable < 2) {
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    if (h === prev) stable++; else stable = 0;
    prev = h;
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(400);
  }
  await page.evaluate(() => document.querySelector('.product-carousel').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(1200);
  const home = await page.evaluate(() => ({
    h1: (document.querySelector('h1') || {}).textContent || '',
    heroSearch: !!document.querySelector('.hero-search input'),
    pcSlides: document.querySelectorAll('.pc-slide').length,
    pcDots: document.querySelectorAll('.pc-dot').length,
    catSlides: document.querySelectorAll('.cat-slide').length,
    testiCards: document.querySelectorAll('.testimonial-card').length,
    cardsLoaded: Array.from(document.querySelectorAll('.product-card-media img')).map((i) => i.complete && i.naturalWidth > 0).every(Boolean),
  }));
  ok(home.h1.length > 0 && /dreams|dessert/i.test(home.h1), 'home hero renders', home.h1.slice(0, 40));
  ok(home.heroSearch, 'hero search present', '');
  ok(home.pcSlides === 24 && home.pcDots === 8, 'product carousel renders', 'slides=' + home.pcSlides + ' dots=' + home.pcDots);
  ok(home.catSlides === 28, 'category marquee renders', 'slides=' + home.catSlides);
  ok(home.testiCards === 4, 'testimonials render', 'cards=' + home.testiCards);
  ok(home.cardsLoaded, 'home media images loaded', '');

  log('\n## WebKit: Search');
  await page.fill('.hero-search input', 'chocolate');
  await page.click('.hero-search .hero-search-btn');
  await page.waitForLoadState('load');
  await page.waitForTimeout(600);
  ok(page.url().includes('/search?q=chocolate'), 'search navigates', page.url());
  const n = await page.locator('.product-grid .product-card').count();
  ok(n > 0, 'search returns products', 'cards=' + n);

  log('\n## WebKit: Cart -> Checkout -> Order success');
  await page.goto(BASE + '/product/celebration-layer-cake', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.pdp-actions .btn');
  await page.click('.pdp-actions .btn');
  await page.waitForTimeout(700);
  const badge = await page.locator('a[aria-label="Cart"] .navbar-badge').textContent().catch(() => null);
  ok(badge !== null && parseInt(badge, 10) === 1, 'cart badge updates', 'badge=' + badge);
  await page.goto(BASE + '/cart', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.cart-item');
  await page.click('text=Proceed to Checkout');
  await page.waitForLoadState('load');
  await page.waitForTimeout(700);
  ok(page.url().endsWith('/checkout'), 'reaches checkout', page.url());
  await page.fill('#fullName', 'Safari User');
  await page.fill('#email', 'safari@example.com');
  await page.fill('#phone', '+20 100 000 0000');
  await page.fill('#line1', '1 Dessert Lane');
  await page.fill('#city', 'Cairo');
  await page.fill('#postalCode', '12345');
  await page.click('input[name="delivery"] >> nth=0').catch(() => {});
  await page.click('input[name="payment"] >> nth=1');
  await page.waitForTimeout(300);
  const enabled = await page.locator('.co-place-btn').isEnabled();
  ok(enabled, 'place order enabled with valid fields', 'enabled=' + enabled);
  await page.click('.co-place-btn');
  await page.waitForTimeout(1800);
  ok(page.url().includes('/order-success'), 'order placed', page.url());
  const confirm = await page.evaluate(() => {
    const el = document.getElementById('co-demo-note');
    return { demo: el ? getComputedStyle(el).display !== 'none' : false, badge: document.querySelectorAll('a[aria-label="Cart"] .navbar-badge').length };
  });
  ok(confirm.demo, 'demo disclaimer visible on confirmation', '');
  ok(confirm.badge === 0, 'cart cleared after order', 'badge=' + confirm.badge);

  ok(errs.length === 0, 'zero console/page errors under WebKit', String(errs.slice(0, 3) || ''));

  log('\nWEBKIT OUTCOME: ' + (failures === 0 ? 'ALL PASS' : failures + ' FAILURES'));
  fs.writeFileSync(OUT, lines.join('\n'));
  await browser.close();
  process.exit(failures ? 1 : 0);
}
main();