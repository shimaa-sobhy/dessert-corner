const { chromium } = require('playwright');

const BASE = 'http://localhost:5173';
const SLUG = 'butter-croissant';
const RECENT_SEED = ['triple-chocolate-cake', 'celebration-layer-cake', 'blueberry-cheesecake', 'gelato-sundae'];

const CLIPPED_FN = `(function (el) {
  let p = el.parentElement;
  while (p && p !== document.body && p !== document.documentElement) {
    const cs = getComputedStyle(p);
    if (cs.overflow === 'clip' || cs.overflow === 'hidden' || cs.overflow === 'auto' || cs.overflow === 'scroll') return true;
    p = p.parentElement;
  }
  return false;
})`;

const FAILS = [];

(async () => {
  const browser = await chromium.launch();
  for (let w = 320; w <= 1560; w += 20) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript((seed) => {
      try { localStorage.setItem('sucre_recently_viewed', JSON.stringify(seed)); } catch {}
    }, RECENT_SEED);
    await page.goto(`${BASE}/product/${SLUG}?r=${Math.random()}`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready).catch(() => {});
    await page.waitForTimeout(200);

    const m = await page.evaluate(
      ({ w, CLIPPED_FN }) => {
        const clip = eval(CLIPPED_FN);
        const out = { scrollW: document.documentElement.scrollWidth, tabOver: false, tabClickable: true, actOver: false };
        // walk DOM for viewport overflow
        const walk = (el) => {
          if (!el) return;
          let r; try { r = el.getBoundingClientRect(); } catch { return; }
          if (r.width > 0 && r.height > 0 && (r.right > w + 1 || r.left < -1) && !clip(el)) out.vwOverflow = (out.vwOverflow || 0) + 1;
          for (const ch of el.children || []) walk(ch);
        };
        walk(document.body);
        // tabs
        const head = document.querySelector('.tabs-head');
        if (head) {
          out.tabOver = head.scrollWidth > head.clientWidth + 1;
          const hdRect = head.getBoundingClientRect();
          const btns = head.querySelectorAll('button');
          for (const b of btns) {
            const r = b.getBoundingClientRect();
            if (r.right > hdRect.right + 1 || r.left < hdRect.left - 1 || r.right > w + 1 || r.left < -1 || r.width === 0) out.tabOver = true;
          }
          out.tabScrollW = head.scrollWidth; out.tabClW = head.clientWidth;
        }
        // action row: all 3 items fit within viewport and column
        const info = document.querySelector('.prod-details-grid > div:nth-child(2)');
        const rowEl = info && Array.from(info.querySelectorAll('div')).find((d) => d.querySelector('.qty-selector') && d.querySelector('.btn-primary'));
        if (rowEl) {
          const row = rowEl.getBoundingClientRect();
          for (const sel of ['.qty-selector', '.btn-primary', '.btn-icon']) {
            const el = rowEl.querySelector(sel);
            if (!el) continue;
            const r = el.getBoundingClientRect();
            if (r.right > w + 1 || r.left < -1 || r.right > row.right + 1 || r.left < row.left - 1) out.actOver = true;
          }
        }
        return out;
      },
      { w, CLIPPED_FN }
    );
    if (m.scrollW > w + 1 || m.vwOverflow || m.tabOver || m.actOver) {
      FAILS.push({ w, ...m });
      console.log(`FAIL w=${w} scrollW=${m.scrollW} vwOver=${m.vwOverflow} tabOver=${m.tabOver} (${m.tabScrollW}/${m.tabClW}) actOver=${m.actOver}`);
    }
    await ctx.close();
  }
  await browser.close();
  if (FAILS.length === 0) {
    console.log('SWEEP: ALL PASS (320..1560 every 20px)');
  } else {
    console.log(`SWEEP: ${FAILS.length} FAILURES: ${FAILS.map((f) => f.w).join(', ')}`);
    process.exit(1);
  }
})();