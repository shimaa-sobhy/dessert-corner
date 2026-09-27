// Focused Playwright verification: check footer, decorative elements, overflow at multiple viewports
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:5173';
const SHOTS_DIR = path.join(__dirname, 'shots');
if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR);

const VIEWPORTS = [
  { name: '375', width: 375, height: 800 },
  { name: '430', width: 430, height: 800 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 800 },
  { name: '1440', width: 1440, height: 900 },
];

async function checkOverflow(page, label) {
  return await page.evaluate(() => {
    const docW = document.documentElement.clientWidth;
    const results = { docW, winW: window.innerWidth, overflowing: [] };
    function walk(el) {
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.right > docW + 1 || r.left < -1) {
        const tag = el.tagName.toLowerCase();
        const cls = (el.className && typeof el.className === 'string') ? el.className.slice(0, 60) : '';
        results.overflowing.push({ tag, cls, left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) });
      }
      for (const c of el.children || []) walk(c);
    }
    walk(document.body);
    // also check horizontal scroll
    results.hasHorizontalScroll = document.documentElement.scrollWidth > docW;
    results.scrollWidth = document.documentElement.scrollWidth;
    return results;
  });
}

async function main() {
  const browser = await chromium.launch();
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    for (const url of ['/', '/shop']) {
      const name = url === '/' ? 'home' : 'shop';
      await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(800);

      // full page screenshot (don't hang on slow external fonts)
      const fullPath = path.join(SHOTS_DIR, `${name}-${vp.name}-full.png`);
      try {
        await page.evaluate(() => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 4000))]));
        await page.screenshot({ path: fullPath, fullPage: true, timeout: 15000 });
      } catch {}

// footer screenshot
      try {
        const footer = await page.$('footer.site-footer');
        if (footer) {
          await footer.scrollIntoViewIfNeeded();
          await page.waitForTimeout(300);
          const fpath = path.join(SHOTS_DIR, `${name}-${vp.name}-footer.png`);
          await footer.screenshot({ path: fpath, timeout: 10000 }).catch(() => {});
        }
      } catch {}

      // check overflow
      const overflow = await checkOverflow(page, `${name}-${vp.name}`);
      console.log(`[${vp.name}] ${name}: scrollW=${overflow.scrollWidth} docW=${overflow.docW} hScroll=${overflow.hasHorizontalScroll} overflowEls=${overflow.overflowing.length}`);
      if (overflow.overflowing.length) {
        console.log('  overflowing:', overflow.overflowing.slice(0, 8));
      }
    }
    await ctx.close();
  }
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
