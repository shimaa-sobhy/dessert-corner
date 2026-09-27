const { chromium } = require('playwright');
const BASE = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch();
  let allPass = true;
  for (const w of [320, 375, 390, 430, 500, 767]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 812 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/?r=${Math.random()}`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready).catch(() => {});
    await page.waitForTimeout(400);

    const res = await page.evaluate(async () => {
      const sec = document.querySelector('.testimonial-section');
      const grid = document.querySelector('.testimonial-grid');
      const cards = Array.from(grid.querySelectorAll('.testimonial-card'));
      const gr = grid.getBoundingClientRect();
      const per = (c) => {
        const b = c.getBoundingClientRect();
        return { l: Math.round(b.left), r: Math.round(b.right), w: Math.round(b.width) };
      };
      // measure at each snap position by programmatically scrolling the grid
      const positions = [];
      for (let i = 0; i < cards.length; i++) {
        grid.scrollLeft = cards[i].offsetLeft;
        await new Promise((r) => setTimeout(r, 120));
        const box = per(cards[i]);
        const next = cards[i + 1] ? per(cards[i + 1]) : null;
        const prev = cards[i - 1] ? per(cards[i - 1]) : null;
        const nextVisible = next ? Math.max(0, Math.min(next.r, gr.right) - Math.max(next.l, gr.left)) : 0;
        const prevVisible = prev ? Math.max(0, Math.min(prev.r, gr.right) - Math.max(prev.l, gr.left)) : 0;
        positions.push({ i, cardEdgeInside: box.l >= gr.left - 1 && box.r <= gr.right + 1, nextVisiblePx: nextVisible, prevVisiblePx: prevVisible });
      }
      // page-level horizontal overflow (body wider than viewport)
      const doc = document.documentElement;
      return {
        sectionBox: { l: Math.round(gr.left), r: Math.round(gr.right) },
        vw: window.innerWidth,
        pageOverflow: doc.scrollWidth - doc.clientWidth,
        gap: getComputedStyle(grid).columnGap,
        positions,
      };
    });

    let ok = res.positions.every((p) => p.nextVisiblePx === 0 && p.prevVisiblePx === 0 && p.cardEdgeInside) && res.pageOverflow <= 0;
    if (!ok) allPass = false;
    console.log(`[${w}] ${ok ? 'PASS' : 'FAIL'} overflow=${res.pageOverflow}px positions=` + JSON.stringify(res.positions));
    await ctx.close();
  }
  await browser.close();
  process.exit(allPass ? 0 : 1);
})();