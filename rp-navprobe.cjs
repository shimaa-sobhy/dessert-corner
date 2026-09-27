const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await page.addInitScript((seed) => { try { localStorage.setItem('sucre_recently_viewed', JSON.stringify(seed)); } catch {} }, ['triple-chocolate-cake','celebration-layer-cake','blueberry-cheesecake','gelato-sundae']);
  const url = `http://localhost:5173/product/butter-croissant?r=${Math.random()}`;
  const nav = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).then(r => ({ ok: r && r.ok(), status: r && r.status(), final: page.url() })).catch((e) => ({ err: String(e).slice(0, 140) }));
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.waitForTimeout(500);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const c = await page.evaluate(() => ({
    finalUrl: location.href,
    title: document.title,
    h1: (document.querySelector('h1') || {}).textContent || null,
    imgs: document.querySelectorAll('img').length,
    heroImg: !!document.querySelector('.pdp-hero img, .prod-details-hero img, .prod-details-grid img'),
    tabs: !!document.querySelector('.tabs-head'),
    qty: !!document.querySelector('.qty-selector'),
    bodyTextLen: (document.body.innerText || '').length,
  }));
  console.log(JSON.stringify({ nav, c }, null, 2));
  await b.close();
})().catch((e) => { console.error('PROBE FAILED:', e); process.exit(1); });
