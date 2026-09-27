// PRE-LAUNCH AUDIT — Section 1+2: responsive grid + stray elements
// 7 pages x 8 breakpoints x 100%/200% CSS zoom (emulated via viewport = bp/zoom)
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.AUDIT_BASE || 'http://localhost:4174';
const OUT = 'audit-launch.log';

let failures = 0;
const lines = [];
function log(s) { lines.push(s); console.log(s); }
function ok(cond, label, extra) {
  const line = (cond ? '  PASS: ' : '  FAIL: ') + label + (extra ? ' | ' + extra : '');
  if (!cond) failures++;
  log(line);
}

const PAGES = [
  { path: '/', label: 'home' },
  { path: '/shop', label: 'shop' },
  { path: '/product/butter-croissant', label: 'pdp' },
  { path: '/cart', label: 'cart' },
  { path: '/checkout', label: 'checkout' },
  { path: '/account', label: 'account' },
  { path: '/categories', label: 'categories' },
];
const BREAKPOINTS = [375, 430, 768, 900, 1024, 1280, 1440, 1920];
const DECO_TOKENS = ['blob', 'pulse', 'sparkle', 'orb', 'shimmer', 'accent-dot', 'cursor-dot', 'cursor-ring'];

function seedScript() {
  return (em) => {
    localStorage.setItem('sucre_users', JSON.stringify([{ name: 'Test User', email: em, password: 'pw' }]));
    localStorage.setItem('sucre_session', JSON.stringify({ name: 'Test User', email: em }));
    localStorage.setItem('sucre_addresses', JSON.stringify([{ id: 'a1', label: 'Home', fullName: 'Test User', line1: '12 Dessert Lane', city: 'Cairo', postalCode: '12345', phone: '' }]));
    localStorage.setItem('sucre_cart', JSON.stringify([{ productId: 'celebration-layer-cake', quantity: 1 }]));
  };
}

async function runPage(ctx, page, pageDef, bp, zoom) {
  const vwLabel = zoom === 1 ? `${bp}px` : `${bp}px @200% (emulated ${Math.round(bp / 2)})`;
  log(`\n## ${pageDef.label} @ ${vwLabel}`);
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error' && !/^Failed to load resource/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push(String(e)));

  const resp = await page.goto(BASE + pageDef.path, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load');
  await page.waitForTimeout(350);

  if (pageDef.path === '/') {
    // Home mounts sections below the fold lazily (IO-gated). Walk to the
    // bottom until the layout stabilizes (2 consecutive equal heights, so
    // in-flight mounts get time to land) — then the scan + counts below
    // cover the fully-rendered page like they used to.
    let prev = -1, guard = 0, stable = 0;
    while (guard++ < 14 && stable < 2) {
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      if (h === prev) stable++; else stable = 0;
      prev = h;
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(450);
    }
  }

  const state = await page.evaluate(({ deco }) => {
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const hScroll = document.documentElement.scrollWidth > vw + 1;
    const overflOwners = [];
    if (hScroll) {
      Array.from(document.querySelectorAll('body *')).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0) return;
        if (r.right > vw + 1 || r.left < -1) {
          const cs = getComputedStyle(el);
          if (cs.position !== 'fixed' && cs.position !== 'sticky') {
            overflOwners.push({ tag: el.tagName, cls: (el.className || '').toString().slice(0, 40), l: Math.round(r.left), r: Math.round(r.right) });
          }
        }
      });
    }
    const stray = [];
    Array.from(document.querySelectorAll('body [class]')).forEach((el) => {
      const cls = (el.className || '').toString();
      if (!deco.some((t) => cls.includes(t))) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      const isHidden = el.hasAttribute('aria-hidden') || !!el.closest('[aria-hidden="true"]');
      if (!isHidden) stray.push({ tag: el.tagName, cls: cls.slice(0, 40) });
    });
    const btts = document.querySelectorAll('.back-to-top');
    const bttCS = btts[0] ? getComputedStyle(btts[0]) : null;
    return {
      url: location.pathname,
      status: document.readyState,
      hScroll,
      overflOwners: overflOwners.slice(0, 6),
      stray: stray.slice(0, 6),
      btt: btts.length,
      bttFixed: bttCS ? bttCS.position === 'fixed' : false,
      legacyBack: document.querySelectorAll('.back-btn-wrap, .back-btn').length,
      vw, vh,
    };
  }, { deco: DECO_TOKENS });

  ok(resp && resp.status() < 400, 'route responds ok', resp ? 'status=' + resp.status() : 'no response');
  ok(state.url === pageDef.path, 'lands on expected route', state.url);
  ok(!state.hScroll, 'no horizontal scroll', state.overflOwners.length ? JSON.stringify(state.overflOwners) : '');
  ok(state.overflOwners.length === 0, 'no static element overflows viewport', '');
  ok(state.stray.length === 0, 'no stray decorative circles outside aria-hidden', state.stray.length ? JSON.stringify(state.stray) : '');
  ok(state.btt === 1 && state.bttFixed, 'exactly one fixed scroll-to-top', 'count=' + state.btt);
  ok(state.legacyBack === 0, 'no Back button artifact', 'count=' + state.legacyBack);
  ok(errs.length === 0, 'zero console/page errors', String(errs[0] || ''));

  if (pageDef.path === '/') {
    const pc = await page.evaluate(() => ({
      slides: document.querySelectorAll('.pc-slide').length,
      dots: document.querySelectorAll('.pc-dot').length,
      catSlides: document.querySelectorAll('.cat-slide').length,
      testiCards: document.querySelectorAll('.testimonial-card').length,
    }));
    ok(pc.slides === 24, 'home product carousel renders 24 loop slides', 'slides=' + pc.slides);
    ok(pc.dots === 8, 'home product carousel renders 8 dots', 'dots=' + pc.dots);
    ok(pc.catSlides === 28, 'category marquee renders 28 items', 'catSlides=' + pc.catSlides);
    ok(pc.testiCards === 4, 'testimonials render 4 cards', 'cards=' + pc.testiCards);
  }
  if (pageDef.path === '/shop') {
    // Product images are loading="lazy", so walk each card into view the way a
    // shopper scrolling the grid would — that is what triggers their loads.
    await page.evaluate(async () => {
      const cards = Array.from(document.querySelectorAll('.product-card'));
      for (const c of cards) {
        c.scrollIntoView({ block: 'center' });
        await new Promise((r) => setTimeout(r, 300));
      }
    });
    // Once requested, lazy fetches complete in the background; give them time
    // to finish before sampling (esp. the last card on small viewports).
    await page.waitForTimeout(3000);
    const img = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.product-card'));
      const okImg = cards.filter((c) => {
        const im = c.querySelector('img');
        return im && im.complete && im.naturalWidth > 0;
      }).length;
      return { total: cards.length, okImg, broken: cards.filter((c) => { const im = c.querySelector('img'); return im && im.complete && im.naturalWidth === 0; }).length };
    });
    ok(img.okImg >= 4, 'product card images loaded (visible page)', JSON.stringify(img));
    ok(img.broken === 0, 'no broken product images', 'broken=' + img.broken);
  }
}

async function main() {
  const browser = await chromium.launch();
  for (const bp of BREAKPOINTS) {
    for (const zoom of [1, 2]) {
      const vw = zoom === 1 ? bp : Math.round(bp / 2);
      const ctx = await browser.newContext({ viewport: { width: vw, height: zoom === 1 ? 900 : 720 } });
      await ctx.addInitScript(seedScript());
      const page = await ctx.newPage();
      for (const p of PAGES) {
        await runPage(ctx, page, p, bp, zoom);
      }
      await ctx.close();
    }
  }
  log('\nGRID OUTCOME: ' + (failures === 0 ? 'ALL PASS' : failures + ' FAILURES'));
  fs.writeFileSync(OUT, lines.join('\n'));
  await browser.close();
  process.exit(failures ? 1 : 0);
}
main();