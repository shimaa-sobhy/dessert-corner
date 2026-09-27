const { chromium } = require('playwright');
const BASE = 'http://localhost:5173';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch();
  const out = {};

  for (const w of [375, 430, 768, 1280]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 812 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/?r=${Math.random()}`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready).catch(() => {});
    await page.waitForTimeout(600);
    await page.evaluate(() => document.querySelector('.product-carousel').scrollIntoView({ block: 'center' }));
    await sleep(500);

    // ---- A. bleed / snap at every slide ----
    const bleed = await page.evaluate(async () => {
      const sec = document.querySelector('.product-carousel');
      const vp = sec.querySelector('.pc-viewport');
      const slides = Array.from(vp.querySelectorAll('.pc-slide'));
      const dots = Array.from(sec.querySelectorAll('.pc-dot'));
      const out = [];
      for (let i = 0; i < slides.length; i++) {
        if (i === 0 || i === slides.length - 1) {
          // programmatic nav (token of arrows/dots) — skip-guarded by the app
          if (dots[i % dots.length]) dots[i % dots.length].click();
          await new Promise((r) => setTimeout(r, 1100));
        } else {
          vp.scrollLeft = slides[i].offsetLeft;
          await new Promise((r) => setTimeout(r, 450));
        }
        const vr = vp.getBoundingClientRect();
        const cur = slides[i].getBoundingClientRect();
        const prev = slides[i - 1] ? slides[i - 1].getBoundingClientRect() : null;
        const prevV = prev ? Math.max(0, Math.min(prev.right, vr.right) - Math.max(prev.left, vr.left)) : 0;
        out.push({
          i,
          name: (slides[i].querySelector('.pc-name') || {}).textContent,
          prevVisible: Math.round(prevV * 10) / 10,
          snappedAt16: Math.round(Math.abs(cur.left - vr.left - 16) * 10) / 10 <= 2,
        });
      }
      return out;
    });

    // ---- B. arrows loop over 2 full cycles ----
    const loop = await page.evaluate(async () => {
      const sec = document.querySelector('.product-carousel');
      const next = sec.querySelector('.pc-btn-next');
      const prev = sec.querySelector('.pc-btn-prev');
      const dots = Array.from(sec.querySelectorAll('.pc-dot'));
      const idx = () => dots.findIndex((d) => d.classList.contains('pc-dot-active'));
      const seq = [];
      const n = dots.length;
      for (let k = 0; k < n * 2; k++) { next.click(); await new Promise((r) => setTimeout(r, 800)); seq.push(idx()); }
      const back = [];
      for (let k = 0; k < n + 1; k++) { prev.click(); await new Promise((r) => setTimeout(r, 800)); back.push(idx()); }
      return { seq, back, n };
    });

    // ---- C. VISIBLE overlap: media rect clipped to the viewport, vs buttons ----
    const overlap = await page.evaluate(async () => {
      const sec = document.querySelector('.product-carousel');
      const vp = sec.querySelector('.pc-viewport');
      const btns = Array.from(sec.querySelectorAll('.pc-btn'));
      const slides = Array.from(vp.querySelectorAll('.pc-slide'));
      const dots = Array.from(sec.querySelectorAll('.pc-dot'));
      let worst = 0;
      for (let i = 0; i < slides.length; i++) {
        if (i === 0 || i === slides.length - 1) {
          if (dots[i % dots.length]) dots[i % dots.length].click();
          await new Promise((r) => setTimeout(r, 1000));
        } else {
          vp.scrollLeft = slides[i].offsetLeft;
          await new Promise((r) => setTimeout(r, 120));
        }
        const vr = vp.getBoundingClientRect();
        const media = Array.from(sec.querySelectorAll('.pc-card-media'));
        for (const b of btns) {
          const br = b.getBoundingClientRect();
          for (const m of media) {
            const mr = m.getBoundingClientRect();
            const clipL = Math.max(mr.left, vr.left);
            const clipR = Math.min(mr.right, vr.right);
            const clipT = Math.max(mr.top, vr.top);
            const clipB = Math.min(mr.bottom, vr.bottom);
            if (clipL >= clipR || clipT >= clipB) continue;
            const ovW = Math.max(0, Math.min(br.right, clipR) - Math.max(br.left, clipL));
            const ovH = Math.max(0, Math.min(br.bottom, clipB) - Math.max(br.top, clipT));
            const ov = ovW * ovH;
            if (ov > worst) worst = ov;
          }
        }
      }
      const bPrev = btns[0].getBoundingClientRect();
      const bNext = btns[1].getBoundingClientRect();
      const vs = vp.getBoundingClientRect();
      return {
        worstOverlapPx2: Math.round(worst),
        prevBtn: { x: Math.round(bPrev.left - vs.left), y: Math.round(bPrev.top - vs.top) },
        nextBtn: { x: Math.round(bNext.left - vs.left), y: Math.round(bNext.top - vs.top) },
        vpW: Math.round(vs.width),
      };
    });

    out[w] = { bleed, loop, overlap };
    await ctx.close();
  }

  // ---- D. swipe fling wrap via CDP touch at 375 ----
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await page.goto(`${BASE}/?r=${Math.random()}`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.waitForTimeout(600);
  const box = await page.evaluate(async () => {
    const sec = document.querySelector('.product-carousel');
    const vp = sec.querySelector('.pc-viewport');
    sec.scrollIntoView({ block: 'center' });
    await new Promise((r) => setTimeout(r, 400));
    const r = vp.getBoundingClientRect();
    const dots = Array.from(sec.querySelectorAll('.pc-dot'));
    const idx = () => dots.findIndex((d) => d.classList.contains('pc-dot-active'));
    return { l: r.left, t: r.top, w: r.width, startIdx: idx() };
  });
  async function drag(x0, x1, y) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y }] });
    await sleep(50);
    for (let i = 1; i <= 10; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + ((x1 - x0) * i) / 10, y }] });
      await sleep(18);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await sleep(750);
  }
  const idxNow = () => page.evaluate(() => {
    const sec = document.querySelector('.product-carousel');
    const dots = Array.from(sec.querySelectorAll('.pc-dot'));
    return dots.findIndex((d) => d.classList.contains('pc-dot-active'));
  });
  const y = box.t + 120;
  const swipe = { startIdx: box.startIdx, steps: [] };
  for (let k = 0; k < 10; k++) {
    await drag(box.l + box.w - 30, box.l + 15, y);
    swipe.steps.push(await idxNow());
  }
  for (let k = 0; k < 3; k++) {
    await drag(box.l + 15, box.l + box.w - 30, y);
    swipe.steps.push(await idxNow());
  }
  await ctx.close();
  out.swipe = swipe;

  // ---- E. screenshots ----
  for (const [w, i, name] of [[375, 7, 'pc-375-last'], [375, 0, 'pc-375-first'], [768, 6, 'pc-768-mid'], [1280, 6, 'pc-1280-mid']]) {
    const c2 = await browser.newContext({ viewport: { width: w, height: 900 } });
    const p2 = await c2.newPage();
    await p2.goto(`${BASE}/?r=${Math.random()}`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await p2.evaluate(() => document.fonts.ready).catch(() => {});
    await p2.waitForTimeout(600);
    await p2.evaluate((idx) => {
      const sec = document.querySelector('.product-carousel');
      sec.scrollIntoView({ block: 'center' });
      sec.querySelectorAll('.pc-dot')[idx].click();
    }, i);
    await p2.waitForTimeout(1200);
    await p2.screenshot({ path: `fixtures/${name}.png`, fullPage: false });
    await c2.close();
  }

  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();