// PRE-LAUNCH AUDIT — Section 3: carousels (ProductCarousel, Testimonials, Category marquee)
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.AUDIT_BASE || 'http://localhost:4174';
const OUT = 'audit-carousels.log';

let failures = 0;
const lines = [];
function log(s) { lines.push(s); console.log(s); }
function ok(cond, label, extra) {
  const line = (cond ? '  PASS: ' : '  FAIL: ') + label + (extra ? ' | ' + extra : '');
  if (!cond) failures++;
  log(line);
}

// Home sections below the fold mount lazily (IO-gated). Walk to the bottom,
// letting mounts grow the document, until the layout stabilizes — then every
// section exists for counting/interaction.
async function mountAll(page) {
  let prev = -1, guard = 0, stable = 0;
  while (guard++ < 14 && stable < 2) {
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    if (h === prev) stable++; else stable = 0;
    prev = h;
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(400);
  }
}

async function pcTests(page, isMobile) {
  log('\n## ProductCarousel (loop / arrows / dots / heading stability) ' + (isMobile ? '@ mobile (swipe+dots)' : '@ desktop'));
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error' && !/^Failed to load resource/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push(String(e)));

  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load');
  await page.waitForTimeout(700);
  await mountAll(page);
  // Bring the carousel into view BEFORE measuring so Playwright's own
  // auto-scroll never pollutes the page-pin measurement below.
  await page.evaluate(() => document.querySelector('.product-carousel').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(900);

  const btnState = await page.evaluate(() => ({
    prev: getComputedStyle(document.querySelector('.pc-btn-prev')).display,
    next: getComputedStyle(document.querySelector('.pc-btn-next')).display,
  }));
  if (isMobile) {
    ok(btnState.prev === 'none' && btnState.next === 'none', 'mobile hides arrows (swipe + dots only)', JSON.stringify(btnState));
  } else {
    ok(btnState.prev !== 'none' && btnState.next !== 'none', 'desktop shows arrows', JSON.stringify(btnState));
  }

  const base = await page.evaluate(() => {
    const slides = Array.from(document.querySelectorAll('.pc-slide'));
    const dots = Array.from(document.querySelectorAll('.pc-dot'));
    const widths = [...new Set(slides.map((s) => Math.round(s.getBoundingClientRect().width)))];
    const tops = [...new Set(slides.map((s) => Math.round(s.getBoundingClientRect().top)))];
    const rects = slides.map((s) => s.getBoundingClientRect());
    const gaps = slides.slice(0, -1).map((_, i) => Math.round(rects[i + 1].left - (rects[i].left + rects[i].width)));
    return {
      slides: slides.length,
      real: document.querySelectorAll('.pc-slide[data-pc-region="real"]').length,
      head: document.querySelectorAll('.pc-slide[data-pc-region="head"]').length,
      tail: document.querySelectorAll('.pc-slide[data-pc-region="tail"]').length,
      dots: dots.length,
      dotSel: dots.filter((d) => d.getAttribute('aria-selected') === 'true').length,
      widths, tops, gaps,
    };
  });
  ok(base.slides === 24 && base.real === 8 && base.head === 8 && base.tail === 8, 'loop structure 8 real + 8 head + 8 tail', 'total=' + base.slides);
  ok(base.dots === 8, 'one dot per real product', 'dots=' + base.dots);
  ok(base.dotSel === 1, 'exactly one active dot at start', 'selected=' + base.dotSel);
  ok(base.widths.length === 1, 'uniform card widths', 'widths=' + JSON.stringify(base.widths));
  ok(base.tops.length === 1, 'uniform card alignment (same top)', 'tops=' + JSON.stringify(base.tops));
  ok(base.gaps.every((g) => g === base.gaps[0]), 'no gaps: constant inter-card gap', 'gaps=' + JSON.stringify(base.gaps));

  async function active() {
    return page.evaluate(() => Array.from(document.querySelectorAll('.pc-dot')).findIndex((d) => d.getAttribute('aria-selected') === 'true'));
  }
  async function headingY() {
    return page.evaluate(() => Math.round(document.querySelector('.product-carousel h2').getBoundingClientRect().top));
  }
  const headY0 = await headingY();

  async function navPin(clicker) {
    const yBefore = await headingY();
    await clicker();
    await page.waitForTimeout(1000);
    const yAfter = await headingY();
    ok(Math.abs(yAfter - yBefore) <= 2, 'carousel navigation keeps heading vertical-pinned', 'dy=' + (yAfter - yBefore));
  }

  if (isMobile) {
    await navPin(() => page.click('.pc-dot >> nth=7'));
    ok((await active()) === 7, 'mobile: dot 7 navigates to last product', 'active=' + (await active()));
    await navPin(() => page.click('.pc-dot >> nth=0'));
    ok((await active()) === 0, 'mobile: dot 0 wraps back to first product', 'active=' + (await active()));
  } else {
    await navPin(() => page.click('.pc-btn-next'));
    ok((await active()) === 1, 'next: active dot advances to 1', 'active=' + (await active()));

    for (let i = 0; i < 8; i++) { await page.click('.pc-btn-next'); await page.waitForTimeout(1000); }
    ok((await active()) === 1, 'wrap-forward loops (active returns to product index 1)', 'active=' + (await active()));

    await navPin(() => page.click('.pc-btn-prev'));
    ok((await active()) === 0, 'prev: wraps back to index 0', 'active=' + (await active()));
    await page.click('.pc-btn-prev');
    await page.waitForTimeout(1000);
    ok((await active()) === 7, 'prev at start wraps to last product (index 7)', 'active=' + (await active()));

    await navPin(() => page.click('.pc-dot >> nth=4'));
    ok((await active()) === 4, 'dot click navigates to matching product', 'active=' + (await active()));
  }
  ok(errs.length === 0, 'zero console/page errors during carousel interaction', String(errs[0] || ''));
}

async function testiTests(page, isMobile) {
  log('\n## Testimonials (dots / uniformity / page pinned) ' + (isMobile ? '@ mobile snap-carousel' : '@ desktop 2x2 grid'));
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load');
  await page.waitForTimeout(600);
  await mountAll(page);
  // Let lazy-loaded images above the fold settle, then bring the section
  // into view so the page-pin measurement starts from a stable position.
  await page.waitForTimeout(1200);
  await page.evaluate(() => document.querySelector('.testimonial-grid').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(1500);

  const base = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.testimonial-card'));
    const h = cards.map((c) => Math.round(c.getBoundingClientRect().height));
    return { cards: cards.length, dots: document.querySelectorAll('.testimonial-dot').length, heights: h };
  });
  ok(base.cards === 4 && base.dots === 4, '4 cards / 4 dots', JSON.stringify({ c: base.cards, d: base.dots }));
  if (isMobile) {
    ok(base.heights.length > 0 && base.heights.every((x) => x === base.heights[0]), 'mobile snap carousel: uniform card heights', 'heights=' + JSON.stringify(base.heights));
  } else {
    const row1 = [base.heights[0], base.heights[1]];
    const row2 = [base.heights[2], base.heights[3]];
    ok(row1[0] === row1[1] && row2[0] === row2[1], 'desktop 2x2 grid: equal heights within each row', 'heights=' + JSON.stringify(base.heights));
  }

  if (!isMobile) {
    const dotsVisible = await page.evaluate(() => getComputedStyle(document.querySelector('.testimonial-dots')).display !== 'none');
    ok(!dotsVisible, 'desktop hides testimonial dots (2x2 grid has no pagination)', '');
    return;
  }

  // Click dot 2, window must not move, card 2 becomes active
  const before = await page.evaluate(() => Math.round(window.pageYOffset));
  const dotsV = await page.evaluate(() => getComputedStyle(document.querySelector('.testimonial-dots')).display !== 'none');
  ok(dotsV, 'mobile shows testimonial dots', '');
  await page.evaluate(() => { document.querySelectorAll('.testimonial-dot')[2].click(); });
  await page.waitForTimeout(2000);
  const after = await page.evaluate(() => {
    const grid = document.querySelector('.testimonial-grid');
    const dots = Array.from(document.querySelectorAll('.testimonial-dot'));
    const active = dots.findIndex((d) => d.classList.contains('active'));
    const card = document.querySelectorAll('.testimonial-card')[2].getBoundingClientRect();
    const g = grid.getBoundingClientRect();
    const inH = card.left >= g.left - 2 && card.right <= g.right + 2;
    return { active, inView: inH, y: Math.round(window.pageYOffset) };
  });
  ok(after.active === 2, 'dot 2 becomes active', 'active=' + after.active);
  ok(after.inView, 'clicked card scrolled into testimonial viewport', '');
  ok(Math.abs(after.y - before) <= 2, 'page scroll position unchanged by testimonial dots', 'dy=' + (after.y - before));
}

async function catTests(page) {
  log('\n## Category marquee (seamless animation / hover pause / no blank gap)');
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load');
  await page.waitForTimeout(800);
  // The marquee only starts after the section scrolls into view (isInView gate).
  await page.evaluate(() => document.querySelector('.cat-section').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(1200);

  const base = await page.evaluate(() => {
    const track = document.querySelector('.cat-section .flex');
    const card = track.querySelector('.cat-slide');
    return {
      items: track.children.length,
      cardW: Math.round(card.getBoundingClientRect().width),
    };
  });
  ok(base.items === 28, 'marquee renders duplicated 14-item set', 'items=' + base.items);

  const t0 = await page.evaluate(() => document.querySelector('.cat-section .flex').style.transform);
  await page.waitForTimeout(400);
  const t1 = await page.evaluate(() => document.querySelector('.cat-section .flex').style.transform);
  ok(t0 !== t1, 'marquee is animating (transform changes)', (t0 || t1 || '').slice(0, 60));

  // Hover pause
  await page.hover('.cat-fade');
  await page.waitForTimeout(300);
  const p1 = await page.evaluate(() => document.querySelector('.cat-section .flex').style.transform);
  await page.waitForTimeout(350);
  const p2 = await page.evaluate(() => document.querySelector('.cat-section .flex').style.transform);
  ok(p1 === p2, 'marquee pauses on hover', '');
  await page.mouse.move(2, 2);
  await page.waitForTimeout(350);
  const r1 = await page.evaluate(() => document.querySelector('.cat-section .flex').style.transform);
  await page.waitForTimeout(300);
  const r2 = await page.evaluate(() => document.querySelector('.cat-section .flex').style.transform);
  ok(r1 !== r2, 'marquee resumes after hover leaves', '');

  // No blank gap at two sampling moments
  for (const t of [0, 300]) {
    await page.waitForTimeout(Math.max(0, t));
    const cover = await page.evaluate(() => {
      const fade = document.querySelector('.cat-fade');
      const track = document.querySelector('.cat-section .flex');
      const slides = Array.from(track.children);
      const vw = fade.getBoundingClientRect().width + 1;
      const covered = slides.filter((s) => {
        const r = s.getBoundingClientRect();
        return r.right > 0 && r.left < vw;
      });
      const seen = new Set(covered.map((s) => s.querySelector('.cat-name').textContent.trim())).size;
      return { covered: covered.length, unique: seen, count: slides.length };
    });
    ok(cover.covered >= 4, 'no blank gap — ≥4 cards visible in viewport', JSON.stringify(cover));
  }
}

async function main() {
  const browser = await chromium.launch();
  for (const vp of [{ w: 1280, h: 900 }, { w: 430, h: 900 }]) {
    log(`\n===== BREAKPOINT ${vp.w}px =====`);
    {
      const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
      const page = await ctx.newPage();
      await pcTests(page, vp.w <= 767);
      await ctx.close();
    }
    {
      const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
      const page = await ctx.newPage();
      await testiTests(page, vp.w <= 767);
      await ctx.close();
    }
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await catTests(page);
    await ctx.close();
  }
  log('\nCAROUSEL OUTCOME: ' + (failures === 0 ? 'ALL PASS' : failures + ' FAILURES'));
  fs.writeFileSync(OUT, lines.join('\n'));
  await browser.close();
  process.exit(failures ? 1 : 0);
}
main();