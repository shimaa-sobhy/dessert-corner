const { chromium } = require('playwright');

const BASE = 'http://localhost:5173';
const FIXTURE = 'fixtures/categories';

let pass = 0;
let fail = 0;
function ok(cond, label, detail) {
  if (cond) {
    pass++;
    console.log(`  PASS: ${label}${detail ? ' | ' + detail : ''}`);
  } else {
    fail++;
    console.log(`  FAIL: ${label}${detail ? ' | ' + detail : ''}`);
  }
}

(async () => {
  const browser = await chromium.launch();
  const fs = require('fs');
  fs.mkdirSync(FIXTURE, { recursive: true });

  for (const [name, vp] of Object.entries({
    mobile375: { width: 375, height: 812 },
    desktop: { width: 1440, height: 900 },
  })) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(BASE + '/categories', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('load');
    await page.waitForTimeout(600);

    const r = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.categories-grid .product-card'));
      const pag = document.querySelector('.pagination');
      const pagVisible = pag && getComputedStyle(pag).display !== 'none' && pag.getBoundingClientRect().height > 0;
      const hScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      const clipped = cards.filter((c) => {
        const cr = c.getBoundingClientRect();
        return cr.right > window.innerWidth + 1 || cr.left < -1;
      });
      const names = cards.map((c) => (c.querySelector('.product-card-name') || {}).textContent);
      const badges = cards.map((c) => (c.querySelector('.badge') || {}).textContent);
      const bodyText = document.body.innerText;
      return { cardCount: cards.length, pagVisible, hScroll, clipped: clipped.length, names, badges, pagMarkup: bodyText.includes('‹') && bodyText.includes('›') };
    });

    ok(r.cardCount === 7, `${name}: all 7 categories rendered`, 'cards=' + r.cardCount);
    ok(!r.pagVisible && !r.pagMarkup, `${name}: no pagination controls`, 'pagination=' + r.pagVisible);
    ok(!r.hScroll, `${name}: no horizontal scroll`, 'scrollW=' + (await page.evaluate(() => document.documentElement.scrollWidth)));
    ok(r.clipped === 0, `${name}: no card clipped off-viewport`, 'clipped=' + r.clipped);
    ok(r.names.includes('Cakes') && r.names.includes('Ice Cream'), `${name}: expected categories present`, r.names.join(','));
    ok(r.badges.every((b) => /items$/.test(b || '')), `${name}: item count badges`, r.badges.join(','));

    await page.screenshot({ path: `${FIXTURE}/${name}-categories.png`, fullPage: true });
    await ctx.close();
  }

  await browser.close();
  console.log(`\n${fail === 0 ? 'OUTCOME: ALL PASS' : 'OUTCOME: ' + fail + ' FAILURES'} (${pass} passed, ${fail} failed)`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});