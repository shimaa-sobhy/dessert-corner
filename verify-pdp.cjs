const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'http://localhost:5173';
const FIXTURE = 'fixtures/pdp';

const src = fs.readFileSync('src/data/products.ts', 'utf8');
const lines = src.split('\n');
const products = [];
let cur = null;
for (const line of lines) {
  const id = line.match(/^\s*id:\s*'([^']+)'/);
  if (id) { if (cur) products.push(cur); cur = { id: id[1] }; continue; }
  if (!cur) continue;
  const slug = line.match(/^\s*slug:\s*'([^']+)'/);
  if (slug) cur.slug = slug[1];
  const name = line.match(/^\s*name:\s*'([^']+)'/);
  if (name) cur.name = name[1];
}
if (cur) products.push(cur);

let pass = 0, fail = 0;
function ok(cond, label, detail) {
  if (cond) { pass++; console.log(`  PASS: ${label}${detail ? ' | ' + detail : ''}`); }
  else { fail++; console.log(`  FAIL: ${label}${detail ? ' | ' + detail : ''}`); }
}

(async () => {
  const browser = await chromium.launch();
  fs.mkdirSync(FIXTURE, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();

  async function go(path) {
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('load');
    await page.waitForTimeout(450);
  }

  // ---- 1. STRAY WAVE / divider removed (between description & wishlist) ----
  console.log('\n########## 1. STRAY WAVE / DIVIDER ##########');
  await go('/product/blueberry-cheesecake');
  const div = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.divider'));
    const actionRow = Array.from(document.querySelectorAll('*')).find((el) => el.textContent && el.textContent.trim().includes('Add to Cart') && el.children.length === 3 && el.querySelector('button') && !el.querySelector('.divider'));
    const desc = Array.from(document.querySelectorAll('p')).find((p) => /Creamy baked cheesecake/.test(p.textContent));
    return {
      dividerCount: rows.length,
      betweenDescAndActions: (() => {
        const action = document.querySelector('.prod-details-grid .btn');
        const parent = action ? action.parentElement : null;
        if (!parent) return null;
        const prev = parent.previousElementSibling;
        return prev && prev.className === 'divider';
      })(),
    };
  });
  console.log(`  DOM[divider] ${JSON.stringify(div)}`);
  ok(div.dividerCount === 1, 'stray divider removed (only the pre-tabs one remains)', 'count=' + div.dividerCount);
  ok(div.betweenDescAndActions === false, 'no divider between description and Add-to-Cart/wishlist row', '');
  await page.screenshot({ path: `${FIXTURE}/1-info-area-375.png`, fullPage: true });

  // ---- 2. RATING/REVIEWS CONSISTENCY — audit every product ----
  console.log('\n########## 2. REVIEW SUMMARY vs REVIEWS SECTION (ALL PRODUCTS) ##########');
  let consistent = 0;
  let inconsistent = [];
  for (const p of products) {
    await go(`/product/${p.slug}`);
    const r = await page.evaluate(() => {
      const noReviews = document.querySelector('.pdp-no-reviews');
      const stars = document.querySelector('.prod-details-grid .stars');
      const starText = stars ? (stars.textContent || '').trim() : '';
      const countMatch = starText.match(/\((\d+)\)\s*$/);
      const shownCount = countMatch ? parseInt(countMatch[1], 10) : null;
      const shownRating = starText.match(/^(\d+\.\d)/);
      const reviewCards = document.querySelectorAll('.review-card').length;
      const emptyMsg = !!Array.from(document.querySelectorAll('.container p')).find((p) => /No reviews yet/.test(p.textContent));
      return { noReviews: !!noReviews, shownCount, shownRating: shownRating ? shownRating[1] : null, reviewCards, emptyMsg };
    });
    const okFor = r.noReviews ? (r.reviewCards === 0 && r.emptyMsg) : (r.shownCount === r.reviewCards && r.reviewCards > 0 && !r.emptyMsg);
    if (okFor) consistent++;
    else inconsistent.push(`${p.slug}:${JSON.stringify(r)}`);
    console.log(`  ${p.slug.padEnd(28)} noReviews=${r.noReviews} shown=(${r.shownRating}${r.shownCount !== null ? ',' + r.shownCount : ''}) cards=${r.reviewCards} emptyMsg=${r.emptyMsg} -> ${okFor ? 'CONSISTENT' : '*** INCONSISTENT ***'}`);
  }
  ok(consistent === products.length && inconsistent.length === 0, `review summary matches reviews section across ALL ${products.length} products`, 'consistent=' + consistent);
  if (inconsistent.length) console.log('  inconsistent: ' + inconsistent.join(' | '));

  // screenshots for a with-reviews + a no-reviews product
  await go('/product/blueberry-cheesecake');
  await page.screenshot({ path: `${FIXTURE}/2-with-reviews-mobile375.png`, fullPage: true });
  await go('/product/celebration-layer-cake');
  await page.screenshot({ path: `${FIXTURE}/2-no-reviews-mobile375.png`, fullPage: true });

  // ---- 3. TABS — real structured content ----
  console.log('\n########## 3. TABS CONTAIN REAL STRUCTURED CONTENT ##########');
  await go('/product/blueberry-cheesecake');
  await page.click('.tabs-head button:has-text("Ingredients")');
  await page.waitForTimeout(250);
  const ing = await page.evaluate(() => ({
    items: document.querySelectorAll('.pdp-ingredients li').length,
    texts: Array.from(document.querySelectorAll('.pdp-ingredients li')).map((li) => li.textContent.trim()),
  }));
  ok(ing.items >= 5, 'Ingredients tab: bulleted structured list', 'items=' + ing.items);
  await page.screenshot({ path: `${FIXTURE}/3-ingredients-375.png`, fullPage: true });

  await page.click('.tabs-head button:has-text("Nutrition")');
  await page.waitForTimeout(250);
  const nut = await page.evaluate(() => ({
    title: !!Array.from(document.querySelectorAll('.pdp-facts .pdp-facts-title')).find((t) => /Nutrition Facts/.test(t.textContent)),
    rows: document.querySelectorAll('.pdp-facts-row').length,
    serving: (document.querySelector('.pdp-facts-serving') || {}).textContent || '',
    labels: Array.from(document.querySelectorAll('.pdp-facts-row span')).map((s) => s.textContent),
  }));
  ok(nut.title && nut.rows === 4 && nut.serving.includes('Serving size'), 'Nutrition tab: nutrition-facts panel with 4 rows + serving size', `rows=${nut.rows} labels=${nut.labels.join(',')}`);
  await page.screenshot({ path: `${FIXTURE}/3-nutrition-375.png`, fullPage: true });

  await page.click('.tabs-head button:has-text("Delivery")');
  await page.waitForTimeout(250);
  const del = await page.evaluate(() => {
    const el = document.querySelector('.pdp-delivery p');
    return { len: el ? el.textContent.trim().length : 0 };
  });
  ok(del.len > 40, 'Delivery tab: real delivery info text', 'chars=' + del.len);
  await page.screenshot({ path: `${FIXTURE}/3-delivery-375.png`, fullPage: true });

  // ---- 4. CARDS — identical to Home best-sellers ----
  console.log('\n########## 4. PDP CARDS IDENTICAL TO HOME BEST-SELLERS ##########');
  await go('/');
  const homeRef = await page.evaluate(() => {
    const c = document.querySelector('.pc-card');
    if (!c) return null;
    const media = c.querySelector('.pc-card-media');
    const badge = c.querySelector('.pc-badge');
    const name = c.querySelector('.pc-name');
    const btn = c.querySelector('.pc-add-btn');
    const cs = (el) => el ? getComputedStyle(el) : null;
    const mediaCs = cs(media), nameCs = cs(name), btnCs = cs(btn), cardCs = cs(c), badgeCs = cs(badge);
    return {
      className: c.className,
      card: { radius: cardCs.borderRadius, shadow: cardCs.boxShadow, bg: cardCs.backgroundColor, padding: cardCs.padding },
      media: { radius: mediaCs.borderRadius, ratio: media.getBoundingClientRect().width / media.getBoundingClientRect().height },
      name: { font: nameCs.fontFamily, size: nameCs.fontSize, lines: nameCs.webkitLineClamp },
      badge: { top: badgeCs.top, left: badgeCs.left, radius: badgeCs.borderRadius, bg: badgeCs.backgroundColor },
      btn: { w: btn.getBoundingClientRect().width, h: btn.getBoundingClientRect().height, radius: btnCs.borderRadius },
      cat: !!c.querySelector('.pc-cat'), rating: !!c.querySelector('.pc-rating'), footer: !!c.querySelector('.pc-footer'), price: !!c.querySelector('.pc-price'),
    };
  });
  ok(homeRef !== null, 'homepage best-sellers card found', '');

  await go('/product/berry-celebration-cake');
  const pdpRef = await page.evaluate(() => {
    const all = document.querySelectorAll('.pc-card');
    const c = Array.from(all).find((card) => card.querySelector('.pc-badge')) || all[0];
    if (!c) return { count: all.length };
    const media = c.querySelector('.pc-card-media');
    const badge = c.querySelector('.pc-badge');
    const name = c.querySelector('.pc-name');
    const btn = c.querySelector('.pc-add-btn');
    const cs = (el) => el ? getComputedStyle(el) : null;
    const mediaCs = cs(media), nameCs = cs(name), btnCs = cs(btn), cardCs = cs(c), badgeCs = cs(badge);
    return {
      count: all.length,
      hasBadge: !!badge,
      className: c.className,
      card: { radius: cardCs.borderRadius, shadow: cardCs.boxShadow, bg: cardCs.backgroundColor, padding: cardCs.padding },
      media: { radius: mediaCs.borderRadius, ratio: media.getBoundingClientRect().width / media.getBoundingClientRect().height },
      name: { font: nameCs.fontFamily, size: nameCs.fontSize, lines: nameCs.webkitLineClamp },
      badge: badgeCs ? { top: badgeCs.top, left: badgeCs.left, radius: badgeCs.borderRadius, bg: badgeCs.backgroundColor } : null,
      btn: { w: btn.getBoundingClientRect().width, h: btn.getBoundingClientRect().height, radius: btnCs.borderRadius },
      cat: !!c.querySelector('.pc-cat'), rating: !!c.querySelector('.pc-rating'), footer: !!c.querySelector('.pc-footer'), price: !!c.querySelector('.pc-price'),
    };
  });
  console.log('  home:', JSON.stringify(homeRef));
  console.log('  pdp :', JSON.stringify(pdpRef));
  ok(pdpRef.count > 0, 'you-might-also-like grid renders pc-cards', 'count=' + pdpRef.count);
  ok(pdpRef.hasBadge === true, 'PDP sample card has badge (for exact comparison)', '');
  ok(JSON.stringify(pdpRef.className) === JSON.stringify(homeRef.className) && JSON.stringify(pdpRef.card) === JSON.stringify(homeRef.card) && JSON.stringify(pdpRef.media) === JSON.stringify(homeRef.media) && JSON.stringify(pdpRef.name) === JSON.stringify(homeRef.name) && pdpRef.badge !== null && JSON.stringify(pdpRef.badge) === JSON.stringify(homeRef.badge) && JSON.stringify(pdpRef.btn) === JSON.stringify(homeRef.btn) && pdpRef.cat === homeRef.cat && pdpRef.rating === homeRef.rating && pdpRef.footer === homeRef.footer && pdpRef.price === homeRef.price, 'PDP pc-card computed styles EXACTLY equal Home best-sellers pc-card', '');
  await page.screenshot({ path: `${FIXTURE}/4-related-mobile375.png`, fullPage: true });

  // recently-viewed grid
  await page.addInitScript(() => localStorage.setItem('sucre_recently_viewed', JSON.stringify(['triple-chocolate-cake', 'blueberry-cheesecake', 'gelato-sundae', 'double-chocolate-brownie'])));
  await go('/product/celebration-layer-cake');
  const recent = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('h2'));
    const sec = sections.find((h) => /Recently viewed/.test(h.textContent));
    if (!sec) return { found: false };
    const grid = sec.nextElementSibling;
    return { found: true, cards: grid ? grid.querySelectorAll('.pc-card').length : 0, gridClass: grid ? grid.className : '' };
  });
  ok(recent.found && recent.cards > 0 && recent.gridClass === 'pc-grid', 'recently-viewed grid renders same pc-cards', JSON.stringify(recent));
  await page.screenshot({ path: `${FIXTURE}/4-recently-viewed-mobile375.png`, fullPage: true });

  await ctx.close();
  await browser.close();
  console.log(`\n${fail === 0 ? 'OUTCOME: ALL PASS' : 'OUTCOME: ' + fail + ' FAILURES'} (${pass} passed, ${fail} failed)`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });