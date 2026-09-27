// PRE-LAUNCH AUDIT — Section 4: core functional flows
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = 'http://localhost:5173';
const OUT = 'audit-flows.log';

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

async function searchFlow(page) {
  log('\n## Search');
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.hero-search input');
  await page.fill('.hero-search input', 'chocolate');
  await page.click('.hero-search .hero-search-btn');
  await page.waitForLoadState('load');
  await page.waitForTimeout(600);
  ok(page.url().includes('/search?q=chocolate'), 'hero search navigates to results', page.url());
  const n = await page.locator('.product-grid .product-card').count();
  ok(n > 0, 'chocolate search returns products', 'cards=' + n);

  await page.goto(BASE + '/search?q=zzzzquerysentinel', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  const empty = await page.evaluate(() => ({
    cards: document.querySelectorAll('.product-grid .product-card').length,
    emptyTitle: (document.querySelector('.empty-state h3, .empty-state h2, .product-grid + *, .empty-title, h2') || {}).textContent || '',
  }));
  ok(empty.cards === 0, 'garbage query returns no products', 'cards=' + empty.cards);
}

async function cartFlow(page) {
  log('\n## Cart add / badge / persistence');
  await page.goto(BASE + '/product/celebration-layer-cake', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.pdp-actions .btn');
  await page.click('.pdp-actions .btn');
  await page.waitForTimeout(700);
  const badge1 = await page.locator('a[aria-label="Cart"] .navbar-badge').textContent().catch(() => null);
  ok(badge1 !== null && parseInt(badge1, 10) >= 1, 'cart badge shows added item', 'badge=' + badge1);

  await page.goto(BASE + '/cart', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.cart-item');
  let item1 = await page.evaluate(() => ({
    qty: document.querySelector('.cart-item .qty-selector span').textContent.trim(),
    total: document.querySelector('.cart-item .ci-total').textContent.trim(),
  }));
  ok(item1.qty === '1' && item1.total === '$46.00', 'cart shows 1x celebration cake $46.00', JSON.stringify(item1));

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.cart-item');
  const qty2 = await page.evaluate(() => document.querySelector('.cart-item .qty-selector span').textContent.trim());
  ok(qty2 === '1', 'cart persists across reload (localStorage)', 'qty=' + qty2);

  log('## Cart quantity + totals');
  await page.click('[aria-label="Increase quantity"]');
  await page.waitForTimeout(400);
  let q3 = await page.evaluate(() => ({
    qty: document.querySelector('.cart-item .qty-selector span').textContent.trim(),
    line: document.querySelector('.cart-item .ci-total').textContent.trim(),
  }));
  ok(q3.qty === '2' && q3.line === '$92.00', 'increase qty -> 2 and line total updates', JSON.stringify(q3));
  await page.click('[aria-label="Increase quantity"]');
  await page.waitForTimeout(400);
  let q4 = await page.evaluate(() => document.querySelector('.cart-item .qty-selector span').textContent.trim());
  ok(q4 === '3', 'increase qty -> 3', 'qty=' + q4);
  await page.click('[aria-label="Decrease quantity"]');
  await page.waitForTimeout(400);
  let q5 = await page.evaluate(() => document.querySelector('.cart-item .qty-selector span').textContent.trim());
  ok(q5 === '2', 'decrease qty -> 2', 'qty=' + q5);

  log('## Cart remove');
  const subtotalBefore = await page.evaluate(() => document.body.textContent.includes('$92.00'));
  await page.click('.cart-item .ci-remove');
  await page.waitForTimeout(800);
  const afterRemove = await page.evaluate(() => ({
    items: document.querySelectorAll('.cart-item').length,
    empty: document.body.textContent.includes('Your cart is empty'),
    badge: document.querySelectorAll('a[aria-label="Cart"] .navbar-badge').length,
  }));
  ok(afterRemove.items === 0 && afterRemove.empty, 'remove clears item -> empty cart state', JSON.stringify(afterRemove));
  ok(afterRemove.badge === 0, 'cart badge hidden after removal', 'badgeCount=' + afterRemove.badge);
}

async function checkoutFlow(page) {
  log('\n## Checkout validation + demo disclaimer + success');
  // cartFlow emptied the cart, so seed a fresh item through the real PDP path.
  await page.goto(BASE + '/product/celebration-layer-cake', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.pdp-actions .btn');
  await page.click('.pdp-actions .btn');
  await page.waitForTimeout(700);
  await page.goto(BASE + '/cart', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.cart-item');
  await page.click('text=Proceed to Checkout');
  await page.waitForLoadState('load');
  await page.waitForTimeout(700);
  ok(page.url().endsWith('/checkout'), 'lands on checkout', page.url());

  const demoNote = await page.evaluate(() => {
    const el = document.getElementById('co-demo-note');
    return el ? { vis: getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden', txt: el.textContent.trim() } : null;
  });
  ok(demoNote && demoNote.vis, 'demo disclaimer visible on checkout', demoNote ? demoNote.txt.slice(0, 60) : '');
  ok(demoNote && /demo/i.test(demoNote.txt), 'demo disclaimer mentions demo', demoNote ? demoNote.txt.slice(0, 60) : '');

  const disabled0 = await page.locator('.co-place-btn').isDisabled();
  ok(disabled0, 'Place Order disabled while form incomplete', 'disabled=' + disabled0);

  await page.fill('#fullName', 'Test User');
  await page.fill('#email', 'test@example.com');
  await page.fill('#phone', '+20 100 000 0000');
  await page.fill('#line1', '12 Dessert Lane');
  await page.fill('#city', 'Cairo');
  await page.fill('#postalCode', '12345');
  await page.click('input[name="delivery"] >> nth=0').catch(() => {});
  await page.click('input[name="payment"] >> nth=1');
  await page.waitForTimeout(300);
  const enabled1 = await page.locator('.co-place-btn').isEnabled();
  ok(enabled1, 'Place Order enabled once required fields valid (COD)', 'enabled=' + enabled1);

  await page.click('.co-place-btn');
  await page.waitForTimeout(1800);
  ok(page.url().includes('/order-success'), 'valid submit lands on order confirmation', page.url());
  const confirm = await page.evaluate(() => ({
    h1: (document.querySelector('h1') || {}).textContent || '',
    demo: (() => { const el = document.getElementById('co-demo-note'); return el ? getComputedStyle(el).display !== 'none' : false; })(),
    badge: document.querySelectorAll('a[aria-label="Cart"] .navbar-badge').length,
  }));
  ok(confirm.h1.length > 0, 'order success page renders heading', confirm.h1.slice(0, 50));
  ok(confirm.demo, 'demo disclaimer visible on confirmation page', '');
  ok(confirm.badge === 0, 'cart cleared after order placed', 'badgeCount=' + confirm.badge);
}

async function wishlistFlow(page) {
  log('\n## Wishlist toggle + count');
  await page.goto(BASE + '/shop', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.product-card-wish');
  const firstId = await page.evaluate(() => {
    const card = document.querySelector('.product-card');
    return card.querySelector('.product-card-media img').alt;
  });
  await page.click('.product-card-wish >> nth=0');
  await page.waitForTimeout(600);
  const badgeW = await page.locator('a[aria-label="Wishlist"] .navbar-badge').textContent().catch(() => null);
  ok(badgeW !== null && parseInt(badgeW, 10) === 1, 'wishlist count badge shows 1', 'badge=' + badgeW);

  await page.goto(BASE + '/wishlist', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  const wc = await page.evaluate(() => document.querySelectorAll('.product-card').length);
  ok(wc === 1, 'wishlist page lists the toggled product', 'cards=' + wc);

  const label = await page.locator('.product-card-wish').first().getAttribute('aria-label');
  ok(label === 'Remove from wishlist', 'wishlisted card offers removal', label);
  await page.click('.product-card-wish >> nth=0');
  await page.waitForTimeout(700);
  const after = await page.evaluate(() => ({
    cards: document.querySelectorAll('.product-card').length,
    badge: document.querySelectorAll('a[aria-label="Wishlist"] .navbar-badge').length,
  }));
  ok(after.cards === 0 && after.badge === 0, 'untoggle empties wishlist + badge', JSON.stringify(after));
}

async function filterFlow(page, vp) {
  log('\n## Shop filters @' + vp.w + 'px');
  await page.goto(BASE + '/shop', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  if (vp.w >= 901) {
    await page.click('.filter-option:has-text("Cakes")');
    await page.waitForTimeout(700);
    const st = await page.evaluate(() => ({
      url: location.search,
      cats: Array.from(document.querySelectorAll('.product-card-cat')).map((e) => e.textContent.trim()),
    }));
    ok(st.url.includes('category=cakes'), 'desktop filter sets category=cakes in URL', st.url);
    ok(st.cats.length > 0 && st.cats.every((c) => c === 'cakes'), 'all visible cards are cakes', JSON.stringify([...new Set(st.cats)]));
    await page.click('.filter-option:has-text("Cakes")');
    await page.waitForTimeout(500);
    const cleared = await page.evaluate(() => location.search);
    ok(cleared === '', 'untoggle clears URL param', cleared);
  } else {
    await page.click('.filter-bar-btn');
    await page.waitForTimeout(500);
    const sheetOpen = await page.evaluate(() => {
      const s = document.querySelector('.filter-sheet');
      const cs = getComputedStyle(s);
      return s && cs.display !== 'none' && s.getBoundingClientRect().height > 40;
    });
    ok(sheetOpen, 'mobile filter sheet opens', '');
    await page.click('.filter-sheet .filter-option:has-text("Cakes")');
    await page.waitForTimeout(300);
    await page.click('.filter-sheet .btn-primary');
    await page.waitForTimeout(700);
    const st = await page.evaluate(() => ({
      url: location.search,
      sheetGone: !document.querySelector('.filter-sheet') || getComputedStyle(document.querySelector('.filter-sheet')).visibility === 'hidden' || document.querySelector('.bottom-sheet-overlay') === null,
      cats: Array.from(document.querySelectorAll('.product-card-cat')).map((e) => e.textContent.trim()),
    }));
    ok(st.url.includes('category=cakes'), 'mobile apply filter sets category=cakes', st.url);
    ok(st.cats.length > 0 && st.cats.every((c) => c === 'cakes'), 'mobile filtered cards are cakes', JSON.stringify([...new Set(st.cats)]));
  }
}

async function navSweep(page) {
  log('\n## Navigation sweep (all header/footer links)');
  const errs = [];
  watchErrors(page, errs);
  const hrefs = await page.evaluate(() => {
    const sels = ['header a[href]', 'footer a[href]', '.section-head-row a[href]', '.hero-search', '.page-hero a[href]', '.breadcrumbs a[href]'];
    const out = [];
    for (const sel of sels) {
      document.querySelectorAll(sel).forEach((a) => {
        const h = a.getAttribute('href');
        if (h && h.startsWith('/')) out.push(h);
      });
    }
    return [...new Set(out)];
  });
  ok(hrefs.length >= 12, 'collected internal header/footer links', 'links=' + hrefs.length);
  let bad = [];
  for (const href of hrefs) {
    const resp = await page.goto(BASE + href, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');
    await page.waitForTimeout(350);
    const st = await page.evaluate(() => ({
      h1: (document.querySelector('h1') || {}).textContent || '',
      ready: document.readyState,
    }));
    if (!resp || resp.status() >= 400 || !st.h1) bad.push(href + ' status=' + (resp && resp.status()));
  }
  ok(bad.length === 0, 'every header/footer link renders a valid page', bad.length ? JSON.stringify(bad) : '');
  const social = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a.footer-social-link'));
    return {
      count: links.length,
      ok: links.every((a) => a.target === '_blank' && a.rel.includes('noopener') && /^https:\/\//.test(a.href)),
    };
  });
  ok(social.count >= 3 && social.ok, 'social links target=_blank + noopener', JSON.stringify(social));
}

async function mobileNav(page) {
  log('\n## Mobile menu');
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.navbar-mobile-toggle');
  await page.click('.navbar-mobile-toggle');
  await page.waitForTimeout(500);
  const hasLinks = await page.evaluate(() => {
    const menu = document.querySelector('.mobile-menu, nav[class*="mobile"], .mobile-nav');
    const links = menu ? Array.from(menu.querySelectorAll('a[href^="/"]')) : [];
    return { menu: !!menu, links: links.map((a) => a.getAttribute('href')) };
  });
  ok(hasLinks.menu && hasLinks.links.length >= 4, 'mobile menu opens with nav links', 'links=' + JSON.stringify(hasLinks.links));
  const first = hasLinks.links[0];
  await page.click('.mobile-menu a[href="' + first + '"], nav[class*="mobile"] a[href="' + first + '"], .mobile-nav a[href="' + first + '"]');
  await page.waitForTimeout(800);
  ok(page.url().includes(first), 'clicking a mobile menu link navigates', page.url());
  const closed = await page.evaluate(() => !document.querySelector('.navbar-mobile-toggle') || !document.querySelector('header [aria-expanded="true"]'));
  ok(closed, 'mobile menu closes after navigation', '');
}

async function main() {
  const browser = await chromium.launch();
  const errs = [];
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    watchErrors(page, errs);
    await searchFlow(page);
    await cartFlow(page);
    await checkoutFlow(page);
    await wishlistFlow(page);
    await filterFlow(page, { w: 1440 });
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 430, height: 900 } });
    const page = await ctx.newPage();
    watchErrors(page, errs);
    await filterFlow(page, { w: 430 });
    await mobileNav(page);
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    watchErrors(page, errs);
    await page.addInitScript(() => { localStorage.setItem('sucre_session', JSON.stringify({ name: 'Test User', email: 't@e.com' })); });
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    await navSweep(page);
    await ctx.close();
  }
  ok(errs.length === 0, 'zero console/page errors across flow harness', String(errs.slice(0, 3) || ''));
  log('\nFLOWS OUTCOME: ' + (failures === 0 ? 'ALL PASS' : failures + ' FAILURES'));
  fs.writeFileSync(OUT, lines.join('\n'));
  await browser.close();
  process.exit(failures ? 1 : 0);
}
main();