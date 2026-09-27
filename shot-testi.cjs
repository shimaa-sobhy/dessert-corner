const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 } });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5173/?r=' + Math.random(), { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await p.evaluate(() => document.fonts.ready).catch(() => {});
  await p.waitForTimeout(400);
  await p.evaluate(() => {
    document.querySelector('.testimonial-section').scrollIntoView({ block: 'start' });
  });
  await p.waitForTimeout(600);
  await p.screenshot({ path: 'fixtures/testi-375-bleed-fixed.png' });
  // also capture card-2 snapped state
  await p.evaluate(() => {
    const grid = document.querySelector('.testimonial-grid');
    grid.scrollLeft = document.querySelectorAll('.testimonial-card')[1].offsetLeft;
  });
  await p.waitForTimeout(500);
  await p.screenshot({ path: 'fixtures/testi-375-snap2.png' });
  await ctx.close();
  await b.close();
  console.log('done');
})();