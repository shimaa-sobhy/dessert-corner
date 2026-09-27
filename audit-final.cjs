const { chromium } = require('playwright');

const BASE = 'http://localhost:5173';
const SLUG = 'butter-croissant';
const RECENT = ['triple-chocolate-cake', 'celebration-layer-cake', 'blueberry-cheesecake', 'gelato-sundae'];

const VPS = [
  { n: '375',  w: 375,  h: 812 },
  { n: '430',  w: 430,  h: 900 },
  { n: '768',  w: 768,  h: 1024 },
  { n: '1024', w: 1024, h: 800 },
  { n: '1280', w: 1280, h: 800 },
  { n: '1440', w: 1440, h: 900 }
];
const TAB_EXPECT = ['Description', 'Ingredients', 'Nutrition', 'Delivery'];
const GRID_COLS = { 375: 2, 430: 2, 768: 3, 1024: 4, 1280: 4, 1440: 4 };

let passC = 0;
let failC = 0;
const results = {};

function rec(check, vp, ok, detail) {
  if (!results[check]) results[check] = {};
  results[check][vp] = ok;
  if (ok) passC++; else failC++;
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + check + '@' + vp + ' ' + (detail || ''));
}

async function settle(page) {
  try { await page.evaluate(() => document.fonts.ready); } catch (e) {}
  await page.waitForTimeout(400);
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
}

(async () => {
  const browser = await chromium.launch();

  for (const vp of VPS) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 140)); });
    page.on('pageerror', e => errors.push(String(e).slice(0, 140)));

    await page.addInitScript(seed => {
      try { localStorage.setItem('sucre_recently_viewed', JSON.stringify(seed)); } catch (e) {}
    }, RECENT);

    await page.goto(BASE + '/product/' + SLUG + '?r=' + Math.floor(Math.random() * 1e9), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await settle(page);
    const vw = vp.w;
    console.log('\n===== viewport ' + vp.n + ' (' + vp.w + 'x' + vp.h + ') =====');

    // C1 horizontal overflow (no clipped ancestor)
    const c1 = await page.evaluate(vw => {
      const clipped = el => {
        let p = el.parentElement;
        while (p && p !== document.documentElement && p !== document.body) {
          const ov = getComputedStyle(p).overflow;
          if (ov === 'hidden' || ov === 'clip' || ov === 'auto' || ov === 'scroll') return true;
          p = p.parentElement;
        }
        return false;
      };
      const bad = [];
      (function walk(el) {
        if (!el) return;
        let r;
        try { r = el.getBoundingClientRect(); } catch (e) { return; }
        if (r.width > 0 && r.height > 0 && (r.right > vw + 2 || r.left < -2) && !clipped(el)) {
          bad.push({ tag: el.tagName, cls: typeof el.className === 'string' ? String(el.className).slice(0, 30) : '' });
        }
        for (const ch of Array.from(el.children || [])) walk(ch);
      })(document.body);
      return { sw: document.documentElement.scrollWidth, bad };
    }, vw);
    rec('C1', vp.n, c1.sw <= vw + 2 && c1.bad.length === 0,
      'sw=' + c1.sw + ' bad=' + c1.bad.length + (c1.bad.length ? ' ' + JSON.stringify(c1.bad.slice(0, 2)) : ''));

    // C2 qty + add button: same line OR intentional stacked full-width (mobile), inside column, no overflow
    const c2 = await page.evaluate(vw => {
      const row = document.querySelector('.qty-add-row, .qty-cart-row, .action-row, .pdp-actions');
      if (!row) return { found: false };
      const qty = row.querySelector('.qty-selector');
      const btn = row.querySelector('.btn-primary, .add-to-cart, .btn');
      if (!qty || !btn) return { found: false };
      const qr = qty.getBoundingClientRect();
      const br = btn.getBoundingClientRect();
      const rr = row.getBoundingClientRect();
      const qMid = qr.top + qr.height / 2;
      const bMid = br.top + br.height / 2;
      const sameLine = Math.abs(qMid - bMid) < 5;
      const onScreen = qr.right <= vw + 1 && qr.left >= -1 && br.right <= vw + 1 && br.left >= -1;
      const withinRow = br.right <= rr.right + 1 && br.left >= rr.left - 1;
      const col = row.closest('.prod-details-info, .pdp-info, .prod-details-right, .pc-info, .pdp-info-col');
      const colRect = col ? col.getBoundingClientRect() : null;
      const inside = !colRect || (br.right <= colRect.right + 2 && br.left >= colRect.left - 1);
      const ric = getComputedStyle(row);
      const stacked = !sameLine && ric.flexWrap === 'wrap' && Math.round(br.width) >= Math.round(row.clientWidth) - 1;
      const ok = sameLine || stacked;
      return { found: true, sameLine, stacked, onScreen, withinRow, inside, ok, btnW: Math.round(br.width) };
    }, vw);
    rec('C2', vp.n, c2.found && c2.onScreen && c2.withinRow && c2.inside && c2.ok,
      c2.found ? 'btn=' + c2.btnW + 'px same=' + c2.sameLine + (c2.stacked ? ' stackfull' : '') + ' on=' + c2.onScreen + ' inside=' + c2.inside : 'row missing');

    // C3 tabs
    const c3 = await page.evaluate(expected => {
      const head = document.querySelector('.tabs-head');
      if (!head) return { found: false };
      const hr = head.getBoundingClientRect();
      const btns = Array.from(head.querySelectorAll('button'));
      const vis = btns.map(b => {
        const r = b.getBoundingClientRect();
        return {
          t: (b.textContent || '').trim(),
          vis: r.width > 0 && r.height > 0 && r.left >= hr.left - 1 && r.right <= hr.right + 1
        };
      });
      return { found: true, labels: vis.map(v => v.t), labelsOk: vis.length === expected.length && vis.every(v => expected.indexOf(v.t) >= 0), allVisible: vis.every(v => v.vis) };
    }, TAB_EXPECT);
    let c3click = false;
    try {
      await page.locator('.tabs-head button').nth(1).scrollIntoViewIfNeeded({ timeout: 3000 });
      await page.waitForTimeout(250);
      await page.locator('.tabs-head button').nth(1).click({ timeout: 5000 });
      await page.waitForTimeout(150);
      c3click = await page.evaluate(() => {
        const a = document.querySelector('.tabs-head button.active');
        return !!a && (a.textContent || '').trim() === 'Ingredients';
      });
    } catch (e) { c3click = false; }
    rec('C3', vp.n, c3.found && c3.labelsOk && c3.allVisible && c3click,
      c3.found ? '[' + c3.labels.join(', ') + '] vis=' + c3.allVisible + ' clickSwitch=' + c3click : 'no tabs-head');

    // C4 hero image
    const c4 = await page.evaluate(() => {
      const im = document.querySelector('.pdp-hero img, .prod-details-hero img, .prod-details-grid img');
      if (!im) return { found: false };
      const wrap = im.parentElement;
      const ir = im.getBoundingClientRect();
      const wr = wrap.getBoundingClientRect();
      const elRatio = ir.height ? Math.round((ir.width / ir.height) * 100) / 100 : null;
      const coRatio = wr.height ? Math.round((wr.width / wr.height) * 100) / 100 : null;
      const match = elRatio !== null && coRatio !== null && Math.abs(elRatio - coRatio) < 0.03;
      return { found: true, loaded: im.complete && im.naturalWidth > 0, elRatio, coRatio, box: Math.round(ir.width) + 'x' + Math.round(ir.height), match, fit: getComputedStyle(im).objectFit };
    });
    rec('C4', vp.n, c4.found && c4.loaded && c4.match,
      c4.found ? 'box=' + c4.box + ' elR=' + c4.elRatio + ' coR=' + c4.coRatio + ' (fit=' + c4.fit + ')' : 'img missing');

    // C5 grids
    const c5 = await page.evaluate(() => {
      const list = [];
      for (const g of document.querySelectorAll('.pc-grid, .pdp-grid, .products-grid')) {
        const cols = getComputedStyle(g).gridTemplateColumns.split(' ').filter(x => x && x !== 'none').length;
        const cells = Array.from(g.querySelectorAll(':scope > *'));
        const gr = g.getBoundingClientRect();
        const clipN = cells.filter(c => {
          const r = c.getBoundingClientRect();
          return r.right > gr.right + 1 || r.left < gr.left - 1;
        }).length;
        const sec = g.closest('section');
        const h = sec ? sec.querySelector('h2, h3') : null;
        list.push({ heading: h ? (h.textContent || '').trim().slice(0, 26) : '', cols, cells: cells.length, clipN });
      }
      return list;
    });
    const expCols = GRID_COLS[vp.w];
    rec('C5', vp.n, c5.length > 0 && c5.every(x => x.cols === expCols && x.clipN === 0),
      c5.length ? c5.map(x => x.heading + '=' + x.cols + 'c/' + x.cells + (x.clipN ? ' CLIP' : '')).join(' ') + ' expect=' + expCols : 'no grids');

    // C6 zoom 200% at 375 only
    if (vp.n === '375') {
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });
      await page.waitForTimeout(400);
      const z = await page.evaluate(() => document.documentElement.scrollWidth);
      await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 });
      rec('C6', vp.n, z <= vw + 2, 'scale=2 sw=' + z);
    } else {
      rec('C6', vp.n, true, 'n/a');
    }

    // C7 artifacts
    const c7 = await page.evaluate(() => ({
      dot: document.querySelectorAll('.cursor-dot, .cursor-ring').length,
      cur: (document.body.className || '').includes('cursor-enabled'),
      backBtn: document.querySelectorAll('.back-btn, .back-btn-wrap').length,
      top: document.querySelectorAll('.back-to-top').length
    }));
    rec('C7', vp.n, c7.dot === 0 && !c7.cur && c7.backBtn === 0 && c7.top === 1,
      'cursor=' + c7.dot + '/enabled=' + c7.cur + ' backBtn=' + c7.backBtn + ' back2top=' + c7.top);

    // C9 console
    rec('C9', vp.n, errors.length === 0, errors.length ? errors.slice(0, 3).join(' | ') : '');

    await ctx.close();
  }

  await browser.close();

  console.log('\n\n===== 7x6 RESULT GRID =====');
  const colsV = ['375', '430', '768', '1024', '1280', '1440'];
  const checks = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C9'];
  console.log('CHECK   | ' + colsV.map(c => c.padStart(6)).join(' '));
  console.log('--------+-' + colsV.map(() => '------').join('-'));
  for (const ch of checks) {
    const row = colsV.map(c => {
      const v = results[ch] && results[ch][c];
      return (v === undefined ? '  -  ' : (v ? 'PASS' : 'FAIL')).padStart(6);
    }).join(' ');
    console.log(ch.padEnd(7) + '| ' + row);
  }
  console.log('\nOUTCOME: ' + passC + ' PASS / ' + failC + ' FAIL -> exit ' + (failC === 0 ? 0 : 1));
  process.exit(failC === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
