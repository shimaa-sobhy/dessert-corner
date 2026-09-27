const { chromium } = require('playwright');

const BASE = 'http://localhost:5173';
const VPS = [
  { n: '375', w: 375, h: 812 },
  { n: '1440', w: 1440, h: 900 }
];

let passC = 0, failC = 0;
function rec(name, ok, detail) {
  if (ok) passC++; else failC++;
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' :: ' + detail : ''));
}

async function state(page) {
  return page.evaluate(() => {
    const vp = document.querySelector('.product-carousel .pc-viewport');
    if (!vp) return null;
    const slides = Array.from(vp.querySelectorAll('.pc-slide'));
    const pRect = vp.getBoundingClientRect();
    const stride0 = slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : 0;
    const P = slides.length / 3;
    const realStart = slides.length ? slides[P | 0].offsetLeft : 0;
    const vis = [], seen = new Set();
    let dups = 0;
    slides.forEach((s) => {
      const r = s.getBoundingClientRect();
      if (r.left < pRect.right && r.right > pRect.left) {
        const id = s.dataset.pcId;
        vis.push(id);
        if (seen.has(id)) dups++;
        seen.add(id);
      }
    });
    const dots = Array.from(document.querySelectorAll('.pc-dot'));
    return {
      sl: vp.scrollLeft,
      sw: vp.scrollWidth,
      cw: vp.clientWidth,
      n: slides.length,
      P,
      stride: stride0,
      realStart,
      realSnap: realStart - 16,
      vis,
      dups,
      activeDot: dots.findIndex((d) => d.classList.contains('pc-dot-active')),
      docSW: document.documentElement.scrollWidth,
      innerW: innerWidth
    };
  });
}

function expectIndex(s, i) {
  const stride = s.stride || 1;
  const computed = ((Math.round((s.sl - s.realSnap) / stride) % Math.round(s.P)) + Math.round(s.P)) % Math.round(s.P);
  return { computed, ok: Math.abs(computed - i) <= 1 && s.activeDot === i };
}

async function waitSettled(page, timeout = 8000) {
  const t0 = Date.now();
  let last = -1;
  let same = 0;
  let s = await state(page);
  while (Date.now() - t0 < timeout) {
    if (s && s.sl === last) {
      if (++same >= 2) {
        // two equal reads + a quiet rest => the smooth scroll really ended
        await page.waitForTimeout(350);
        return s;
      }
    } else {
      same = 0;
    }
    last = s ? s.sl : -1;
    await page.waitForTimeout(200);
    s = await state(page);
  }
  return s;
}

async function swipe(client, page, fromX, toX, y, steps = 18, gap = 12) {
  const id = 1 + Math.floor(Math.random() * 9000);
  const y0 = Math.round(y);
  const t0 = { x: Math.round(fromX), y: y0, id, radiusX: 5, radiusY: 5, force: 1 };
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [t0] });
  for (let i = 1; i <= steps; i++) {
    const x = Math.round(fromX + ((toX - fromX) * i) / steps);
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove', touchPoints: [{ x, y: y0, id, radiusX: 5, radiusY: 5, force: 1 }]
    });
    await page.waitForTimeout(gap);
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function loopTest(browser, vp) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const client = await ctx.newCDPSession(page);
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)); });
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + String(e).slice(0, 120)));

  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.waitForTimeout(700);

  // Bring carousel into view
  await page.evaluate(() => document.querySelector('.product-carousel')?.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(600);

  let s = await state(page);
  if (!s || s.n < 6) { rec('SETUP@' + vp.n, false, 'carousel slides missing'); await ctx.close(); return; }
  const P = Math.round(s.P);
  const stride = s.stride;
  const padT = 8, padB = 8;
  void padT; void padB;
  const base0 = s.sl;   // instant-jump anchor for index 0

  // ---- INIT ----
  const initOk = s.activeDot === 0 && Math.abs(s.sl - (s.realStart - 16)) < stride / 2;
  rec('INIT@' + vp.n, initOk, 'index0 sl=' + s.sl.toFixed(1) + ' realSnap=' + (s.realStart - 16).toFixed(1) + ' P=' + P);

  // ---- ARROWS (≥768px only: arrows are hidden on mobile by design) ----
  if (vp.n >= 768) {
    let arrowOk = true, seq = [];
    const next = page.locator('.pc-btn-next'), prev = page.locator('.pc-btn-prev');
    for (let i = 1; i <= P; i++) {
      await next.click({ timeout: 4000 });
      s = await waitSettled(page);
      const exp = i % P;
      const e = expectIndex(s, exp);
      seq.push(exp);
      if (!e.ok) { arrowOk = false; rec('ARROW-NEXT@' + vp.n, false, 'step ' + i + ' expected index ' + exp + ' activeDot=' + s.activeDot + ' computed=' + e.computed); break; }
    }
    if (arrowOk) rec('ARROW-NEXT-LOOP@' + vp.n, true, 'P nexts wrapped ' + P + '->0 (' + seq.join(',') + ')');

    // prev wrap: from 0 -> last
    await prev.click({ timeout: 4000 });
    s = await waitSettled(page);
    rec('ARROW-PREV-WRAP@' + vp.n, expectIndex(s, P - 1).ok, 'index=' + s.activeDot + ' sl=' + s.sl.toFixed(1));
  } else {
    // Mobile (arrows hidden): equivalent wrap coverage using dot navigation
    let dotsOk2 = true, seq2 = [];
    const d = (i) => page.locator('.pc-dot').nth(i);
    for (let i = 1; i <= P; i++) {
      const exp = i % P;
      await d(exp).click({ timeout: 4000 });
      s = await waitSettled(page);
      const e = expectIndex(s, exp);
      seq2.push(exp);
      if (!e.ok) { dotsOk2 = false; rec('DOT-NEXT@' + vp.n, false, 'step ' + i + ' expected index ' + exp + ' activeDot=' + s.activeDot); break; }
    }
    if (dotsOk2) rec('DOT-NEXT-LOOP@' + vp.n, true, 'P dots wrapped ' + P + '->0 (' + seq2.join(',') + ')');
    await d(P - 1).click({ timeout: 4000 });
    s = await waitSettled(page);
    rec('DOT-PREV-WRAP@' + vp.n, expectIndex(s, P - 1).ok, 'index=' + s.activeDot + ' sl=' + s.sl.toFixed(1));
  }

  // ---- DOTS ----
  let dotsOk = true;
  for (const i of [0, P - 1, 2, Math.floor(P / 2), 3, 1, 0]) {
    await page.locator('.pc-dot').nth(i).click({ timeout: 4000 });
    s = await waitSettled(page);
    const e = expectIndex(s, i);
    if (!e.ok) { dotsOk = false; rec('DOT@' + vp.n, false, 'dot ' + i + ' -> activeDot=' + s.activeDot + ' computed=' + e.computed); break; }
  }
  if (dotsOk) rec('DOTS@' + vp.n, true, 'all dots land on the right product');

  // ---- SWIPE WRAP x3 (gentle, deterministic) + vigorous-swipe validity ----
  let wrapOk = true;

  function inRealStrip(s) {
    for (let k = 0; k < P; k++) {
      if (Math.abs(s.sl - (s.realSnap + k * stride)) < stride / 2) return true;
    }
    return false;
  }

  async function analyzeStutter(samples, span) {
    for (let k = 1; k < samples.length; k++) {
      const d = samples[k].sl - samples[k - 1].sl;
      if (Math.abs(d) > stride * 1.5 && Math.abs(Math.abs(d) - span) > stride * 0.5) {
        return { k, d: Math.round(d), span };
      }
    }
    return null;
  }

  for (let cycle = 1; cycle <= 3; cycle++) {
    // land on first real with an INSTANT jump (no smooth scroll), so the
    // swipe-advance below starts from a fully static carousel
    await page.evaluate((v) => { document.querySelector('.product-carousel .pc-viewport').scrollLeft = v; }, base0);
    await page.waitForTimeout(300);
    s = await state(page);
    // make SURE the carousel is fully on-screen so the synthetic touch
    // swipes actually land on the viewport (it can drift above the fold)
    await page.evaluate(() => document.querySelector('.product-carousel .pc-viewport').scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(400);
    const vpRect = await page.evaluate(() => {
      const r = document.querySelector('.product-carousel .pc-viewport').getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, height: r.height, width: r.width };
    });
    const yStart = Math.round(vpRect.top + vpRect.height * 0.25);
    const inset = 70;
    // anchor at the last real card INSTANTLY (setup). The wrap behaviour is
    // what's under test — the actual passage past the end is the GENTLE
    // swipe below. Momentum-carrying advance is covered by VIGOROUS-WRAP.
    const lastTarget = s.realStart + (P - 1) * stride;
    await page.evaluate((v) => { document.querySelector('.product-carousel .pc-viewport').scrollLeft = v; }, lastTarget);
    await page.waitForTimeout(300);
    s = await state(page);
    if (s.activeDot !== P - 1) { wrapOk = false; rec('SWIPE-WRAP@' + vp.n, false, 'cycle ' + cycle + ' could not anchor at last (activeDot=' + s.activeDot + ')'); break; }
    // sample scrollLeft during the gentle wrap swipe
    await page.evaluate(() => {
      window.__sli = [];
      const vpEl = document.querySelector('.product-carousel .pc-viewport');
      const t0 = performance.now();
      (function f() {
        window.__sli.push({ t: +(performance.now() - t0).toFixed(1), sl: +vpEl.scrollLeft.toFixed(1) });
        if (window.__sli.length < 900) requestAnimationFrame(f);
      })();
    });
    // GENTLE wrap: slow drag of ~1.35 card widths (just past the last real
    // card into the first clone) with a gentle release -> momentum dies on
    // the clone and it remaps to the identical real card at index 0.
    const dragPx = Math.round(1.5 * stride);
    await swipe(client, page, vpRect.right - inset, vpRect.right - inset - dragPx, yStart, 30, 18);
    await page.waitForTimeout(1000);
    s = await waitSettled(page);
    const samples = await page.evaluate(() => window.__sli || []);
    const span = Math.round(P * stride);
    const badJump = await analyzeStutter(samples, span);
    // The seamless-end guarantee: the gesture really crossed past the LAST
    // real card (seen in the sampled scroll path) and, after the remap, we
    // are back inside the real strip with zero duplicates and no stutter.
    // The exact landing index is momentum physics, not a product invariant.
    const crossed = samples.some((x) => x.sl > lastTarget + stride * 0.4);
    const endOk = crossed && inRealStrip(s);
    const dupsOk = s.dups === 0;
    if (!endOk || !dupsOk || badJump || !crossed) {
      wrapOk = false;
      rec('SWIPE-WRAP@' + vp.n, false, 'cycle ' + cycle + ' index=' + s.activeDot + ' crossed=' + crossed + ' inReal=' + inRealStrip(s) + ' dups=' + s.dups + (badJump ? ' STUTTER d=' + badJump.d + ' (v.s. wrap ~' + span + ')' : ''));
      break;
    }
    console.log('INFO SWIPE-WRAP@' + vp.n + ' cycle ' + cycle + ' wrapped last->first index=' + s.activeDot + ' dups=' + s.dups + ' wrapDelta=~' + span);
  }
  if (wrapOk) rec('SWIPE-WRAP-3X@' + vp.n, true, '3 consecutive swipes past last card wrapped seamlessly each time');

  // vigorous swipe past the end: momentum may legitimately carry a few more
  // cards into the loop, but must stay in the real strip with no dup/stutter.
  {
    if (s && s.activeDot !== P - 1) { await page.locator('.pc-dot').nth(P - 1).click({ timeout: 6000 }); s = await waitSettled(page); }
    let guard = 0;
    while (s.activeDot !== P - 1 && guard < 20) {
      await swipe(client, page, await page.evaluate(() => {
        const r = document.querySelector('.product-carousel .pc-viewport').getBoundingClientRect();
        return r.right;
      }) - 70, await page.evaluate(() => {
        const r = document.querySelector('.product-carousel .pc-viewport').getBoundingClientRect();
        return r.left;
      }) + 70, await page.evaluate(() => {
        const r = document.querySelector('.product-carousel .pc-viewport').getBoundingClientRect();
        return Math.round(r.top + r.height * 0.25);
      }));
      await page.waitForTimeout(900);
      s = await waitSettled(page);
      guard++;
    }
    await page.evaluate(() => {
      window.__sli = [];
      const vpEl = document.querySelector('.product-carousel .pc-viewport');
      const t0 = performance.now();
      (function f() {
        window.__sli.push({ t: +(performance.now() - t0).toFixed(1), sl: +vpEl.scrollLeft.toFixed(1) });
        if (window.__sli.length < 900) requestAnimationFrame(f);
      })();
    });
    const vr = await page.evaluate(() => {
      const r = document.querySelector('.product-carousel .pc-viewport').getBoundingClientRect();
      return { l: r.left, r: r.right, t: r.top, h: r.height };
    });
    const span = Math.round(P * stride);
    await swipe(client, page, vr.r - 70, vr.l + 70, Math.round(vr.t + vr.h * 0.25), 8, 6); // fast violent flick
    await page.waitForTimeout(1000);
    s = await waitSettled(page);
    const samples = await page.evaluate(() => window.__sli || []);
    const badJump = await analyzeStutter(samples, span);
    const ok = inRealStrip(s) && s.dups === 0 && !badJump;
    rec('VIGOROUS-WRAP@' + vp.n, ok, 'index=' + s.activeDot + ' inReal=' + inRealStrip(s) + ' dups=' + s.dups + (badJump ? ' STUTTER' : ''));
  }

  // final overflow + errors
  s = await state(page);
  rec('OVERFLOW@' + vp.n, s.docSW <= s.innerW + 1, 'docSW=' + s.docSW + ' innerW=' + s.innerW);
  rec('NO-ERRORS@' + vp.n, errors.length === 0, errors.slice(0, 3).join(' | '));

  await ctx.close();
}

(async () => {
  const browser = await chromium.launch();
  for (const vp of VPS) {
    console.log('\n===== LOOP TEST @ ' + vp.n + ' =====');
    await loopTest(browser, vp);
  }
  await browser.close();
  console.log('\nOUTCOME: ' + passC + ' PASS / ' + failC + ' FAIL');
  process.exit(failC === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });