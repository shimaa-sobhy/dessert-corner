const { chromium } = require('playwright');

const BASE = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch();
  const vps = [
    { name: '375', width: 375, height: 812 },
    { name: '1440', width: 1440, height: 900 },
  ];
  let fail = 0;
  for (const vp of vps) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/?r=${Math.random()}`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready).catch(() => {});
    await page.waitForTimeout(400);

    const r = await page.evaluate(() => {
      const sec = document.querySelector('.testimonial-section');
      if (!sec) return { found: false };
      const arrows = sec.querySelectorAll('.testimonial-arrow, .testimonial-arrows');
      const cards = sec.querySelectorAll('.testimonial-card');
      const perCard = Array.from(cards).map((c) => {
        const avatars = c.querySelectorAll('.testimonial-card__avatar');
        const quotes = c.querySelectorAll('.testimonial-card__quote');
        const initials = Array.from(avatars).map((a) => (a.textContent || '').trim());
        const avBox = avatars[0] ? avatars[0].getBoundingClientRect() : null;
        const row = c.querySelector('.testimonial-card__author-row');
        const rowBox = row ? row.getBoundingClientRect() : null;
        const textBox = c.querySelector('.testimonial-card__author-text') ? c.querySelector('.testimonial-card__author-text').getBoundingClientRect() : null;
        return {
          avatars: avatars.length, quotes: quotes.length, initials,
          avatarInsideRow: avBox && rowBox ? (avBox.top >= rowBox.top - 2 && avBox.bottom <= rowBox.bottom + 2 && avBox.left >= rowBox.left - 2) : null,
          avatarNextToName: avBox && textBox ? avBox.right <= textBox.left + 4 : null,
          avatarIsChildOfRow: row ? row.contains(avatars[0]) : false,
          grayCircleLike: avBox ? avBox.width : null,
        };
      });
      const dots = sec.querySelectorAll('.testimonial-dot');
      return { found: true, arrowEls: arrows.length, cardCount: cards.length, dotCount: dots.length, perCard };
    });
    let ok = true;
    if (!r.found) { ok = false; console.log(`[${vp.name}] NO SECTION`); }
    if (r.arrowEls !== 0) { ok = false; console.log(`[${vp.name}] arrows still present: ${r.arrowEls}`); }
    if (r.perCard.length !== 4) { ok = false; console.log(`[${vp.name}] card count ${r.perCard.length}`); }
    for (const [i, c] of (r.perCard || []).entries()) {
      if (c.avatars !== 1 || c.quotes !== 0) { ok = false; console.log(`[${vp.name}] card ${i}: avatars=${c.avatars} quotes=${c.quotes}`); }
      if (!c.avatarInsideRow || !c.avatarNextToName || !c.avatarIsChildOfRow) { ok = false; console.log(`[${vp.name}] card ${i}: insideRow=${c.avatarInsideRow} nextToName=${c.avatarNextToName} childOfRow=${c.avatarIsChildOfRow}`); }
      if (c.initials.length !== 1 || !c.initials[0]) { ok = false; console.log(`[${vp.name}] card ${i}: initials ${JSON.stringify(c.initials)}`); }
    }
    if (r.dotCount < 1) { ok = false; console.log(`[${vp.name}] no dots`); }
    if (ok) fail = fail; else fail = 1;
    console.log(`[${vp.name}] ${ok ? 'PASS' : 'FAIL'} arrows=${r.arrowEls} cards=${r.perCard.length} dots=${r.dotCount} avatars=` + JSON.stringify((r.perCard || []).map((c) => c.initials)));

    if (vp.name === '375') {
      await page.evaluate(() => document.querySelector('.testimonial-section').scrollIntoView({ block: 'start' }));
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'fixtures/testi-375-verified.png', fullPage: false });
    }
    await ctx.close();
  }
  await browser.close();
  process.exit(fail ? 1 : 0);
})();