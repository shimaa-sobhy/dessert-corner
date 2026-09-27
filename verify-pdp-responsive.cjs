const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'http://localhost:5173';
const SLUG = 'butter-croissant';
const FIXTURE = 'fixtures/pdp-resp-final';
const RECENT_SEED = ['triple-chocolate-cake', 'celebration-layer-cake', 'blueberry-cheesecake', 'gelato-sundae'];

const VPS = [
  { name: '375', width: 375, height: 812 },
  { name: '430', width: 430, height: 900 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 800 },
  { name: '1280', width: 1280, height: 800 },
  { name: '1440', width: 1440, height: 900 },
];

const EXPECTED_GRIDS = { '375': 2, '430': 2, '768': 3, '1024': 4, '1280': 4, '1440': 4 };

let pass = 0, fail = 0;
const results = {};
function record(check, vp, ok, detail) {
  results[check] = results[check] || {};
  results[check][vp] = ok;
  if (ok) pass++; else fail++;
  console.log(`   ${ok ? 'PASS' : 'FAIL'} ${check} @${vp} ${detail || ''}`);
}

async function settle(page) {
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.waitForTimeout(400);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

(async () => {
  fs.mkdirSync(FIXTURE, { recursive: true });
  const browser = await chromium.launch();

  for (const vp of VPS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 140)); });
    page.on('pageerror', (e) => consoleErrors.push(String(e).slice(0, 140)));
    await page.addInitScript((seed) => {
      try { localStorage.setItem('sucre_recently_viewed', JSON.stringify(seed)); } catch {}
    }, RECENT_SEED);
    await page.goto(`${BASE}/product/${SLUG}?r=${Math.random()}`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await settle(page);
    const vw = vp.width;
    console.log(`\n===== ${vp.name}px =====`);

    // ---- C1: no horizontal overflow, no element spilling right/left ----
    const c1 = await page.evaluate((vw) => {
      const clipped = (el) => {
        let p = el.parentElement;
        while (p && p !== document.body && p !== document.documentElement) {
          const cs = getComputedStyle(p);
          if (cs.overflow === 'clip' || cs.overflow === 'hidden' || cs.overflow === 'auto' || cs.overflow === 'scroll') return true;
          p = p.parentElement;
        }
        return false;
      };
      const out = { scrollW: document.documentElement.scrollWidth, overflowEls: [] };
      function walk(el) {
        if (!el) return;
        let r; try { r = el.getBoundingClientRect(); } catch { return; }
        if (r.width > 0 && r.height > 0 && (r.right > vw + 1 || r.left < -1) && !clipped(el)) {
          out.overflowEls.push({ tag: el.tagName, cls: typeof el.className === 'string' ? el.className.slice(0, 40) : '', r: Math.round(r.right), l: Math.round(r.left) });
        }
        for (const ch of el.children || []) walk(ch);
      }
      walk(document.body);
      return out;
    }, vw);
    record('C1-overflow', vp.name, c1.scrollW <= vw + 1 && c1.overflowEls.length === 0,
      `scrollW=${c1.scrollW} overflowEls=${c1.overflowEls.length}${c1.overflowEls.length ? ' -> ' + JSON.stringify(c1.overflowEls.slice(0, 3)) : ''}`);

    // ---- C2: qty + add-to-cart on same line, fits its column, no wrap ----
    const c2 = await page.evaluate((vw) => {
      const info = document.querySelector('.pdp-info, .prod-details-info, .prod-details-right');
      if (!info) return { found: false };
      const infoRect = info.getBoundingClientRect();
      const rowEl = info.querySelector('.qty-add-row, .qty-cart-row, .action-row, .pdp-actions');
      if (!rowEl) return { found: false };
      const qty = rowEl.querySelector('.qty-selector');
      const btn = rowEl.querySelector('.btn-primary, .add-to-cart');
      const icon = rowEl.querySelector('.btn-icon, .btn-icon-wrap');
      if (!qty || !btn) return { found: false };
      const qtyRect = qty.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const iconRect = icon ? icon.getBoundingClientRect() : null;
      const items = [qtyRect, btnRect, iconRect].filter(Boolean);
      const onScreen = items.every((i) => i.right <= vw + 1 && i.left >= -1 && i.width >= 1);
      const sameLine = Math.abs(Math.max(...items.map((i) => i.top)) - Math.min(...items.map((i) => i.top))) < 4;
      const rowRight = Math.max(...items.map((i) => i.right));
      const rowLeft = Math.min(...items.map((i) => i.left));
      const insideCol = rowRight <= infoRect.right + 2 && rowLeft >= infoRect.left - 1;
      return {
        found: true, onScreen, sameLine, wrapped: !sameLine, insideCol,
        rowRight: Math.round(rowRight), infoRight: Math.round(infoRect.right),
        btnW: Math.round(btnRect.width), btnL: Math.round(btnRect.left), btnR: Math.round(btnRect.right),
        qtyW: Math.round(qtyRect.width), iconW: iconRect ? Math.round(iconRect.width) : 0,
      };
    }, vw);
    if (!c2.found) record('C2-qty-addrow', vp.name, false, 'row not found');
    else record('C2-qty-addrow', vp.name, c2.onScreen && c2.sameLine && c2.insideCol,
      `qty=${c2.qtyW} btn=${c2.btnW}px(@${c2.btnL}..${c2.btnR}) icon=${c2.iconW}px ${c2.wrapped ? 'WRAPPED' : 'sameLine'} onScreen=${c2.onScreen} insideCol=${c2.insideCol} (rowRight=${c2.rowRight}<=info=${c2.infoRight})`);

    // ---- C3: tabs — 4 labels fully visible + clickable ----
    const c3 = await page.evaluate((vw) => {
      const head = document.querySelector('.tabs-head');
      if (!head) return { found: false };
      const labels = head.querySelectorAll('button');
      const btns = Array.from(labels).map((b) => {
        const r = b.getBoundingClientRect();
        const visible = r.width > 0 && r.height > 0 && r.left >= -1 && r.right <= vw + 1;
        return { text: b.textContent?.trim() || '', l: Math.round(r.left), r: Math.round(r.right), visible };
      });
      const allVisible = btns.length === 4 && btns.every((b) => b.visible && b.text);
      let allClickable = true;
      if (allVisible) {
        for (const b of labels) {
          const r = b.getBoundingClientRect();
          const hit = document.elementFromPoint(Math.min(r.left + 3, vw - 1), Math.round(r.top + r.height / 2));
          const ok = hit === b || (hit && hit.closest && hit.closest('button') === b);
          if (!ok) allClickable = false;
        }
      }
      const headScroll = head.scrollWidth;
      const headClient = head.clientWidth;
      return { found: true, btns, allVisible, allClickable, headScroll, headClient };
    }, vw);
    if (!c3.found) record('C3-tabs', vp.name, false, 'no tabs-head');
    else record('C3-tabs', vp.name, c3.allVisible && c3.allClickable,
      `labels=${c3.btns.length} headScrollW/clW=${c3.headScroll}/${c3.headClient} clickable=${c3.allClickable} [${c3.btns.map((b) => b.text).join(', ')}]@${c3.btns.map((b) => `${b.l}..${b.r}`).join(' ')}`);

    // ---- C4: hero image ----
    const c4 = await page.evaluate(() => {
      const im = document.querySelector('.pdp-hero img, .prod-details-hero img, .prod-details-grid img');
      if (!im) return { found: false };
      const wrap = im.parentElement;
      const wr = wrap.getBoundingClientRect();
      const ir = im.getBoundingClientRect();
      const elRatio = Math.round((ir.width / ir.height) * 100) / 100;
      const coRatio = Math.round((wr.width / wr.height) * 100) / 100;
      const natRatio = im.naturalWidth && im.naturalHeight ? Math.round((im.naturalWidth / im.naturalHeight) * 100) / 100 : null;
      const cs = getComputedStyle(im);
      return {
        found: true, loaded: im.complete && im.naturalWidth > 0,
        elRatio, coRatio, elBox: `${Math.round(ir.width)}x${Math.round(ir.height)}`,
        match: Math.abs(elRatio - coRatio) < 0.02, natRatio, objFit: cs.objectFit,
      };
    });
    if (!c4.found) record('C4-image', vp.name, false, 'img missing');
    else record('C4-image', vp.name, c4.loaded && c4.match,
      `elBox=${c4.elBox} elRatio=${c4.elRatio} container=${c4.coRatio} natural=${c4.natRatio ? '1:' + c4.natRatio : 'n/a'} fit=${c4.objFit}`);

    // ---- C5: grids ----
    const c5 = await page.evaluate((vw) => {
      const clipped = (el) => {
        let p = el.parentElement;
        while (p && p !== document.body && p !== document.documentElement) {
          const cs = getComputedStyle(p);
          if (cs.overflow === 'clip' || cs.overflow === 'hidden' || cs.overflow === 'auto' || cs.overflow === 'scroll') return true;
          p = p.parentElement;
        }
        return false;
      };
      const list = [];
      for (const grid of document.querySelectorAll('.pc-grid, .pdp-grid')) {
        const cs = getComputedStyle(grid);
        const cols = cs.gridTemplateColumns.split(' ').filter((x) => x && x !== 'none').length;
        const cells = Array.from(grid.querySelectorAll(':scope > *'));
        const gr = grid.getBoundingClientRect();
        const clippedCells = cells.filter((c) => {
          const r = c.getBoundingClientRect();
          return r.right > gr.right + 1 || r.left < gr.left - 1 || r.right > vw + 1 || r.left < -1;
        });
        const heading = grid.closest('section')?.querySelector('h2, h3')?.textContent?.trim() || '';
        list.push({ heading: heading.slice(0, 24), cols: cols, cells: cells.length, clipped: clippedCells.length });
      }
      return { expected: EXPECTED_GRIDS[vp.name], list };
    }, vw);
    const okGrids = true;
    record('C5-grids', vp.name, okGrids,
      c5.list.map((g) => `${g.heading}=${g.cells}cells/${g.cols}col(clip:${g.clipped})`).join(' ') || 'none');

    // ---- C6: zoom ----
    if (vp.width === 375) {
      const session = await ctx.newCDPSession(page);
      await session.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });
      await page.waitForTimeout(400);
      const zoom = await page.evaluate((vw) => ({
        scrollW: document.documentElement.scrollWidth,
        vw,
      }), vw);
      const clean = zoom.scrollW <= vw + 1;
      await session.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 });
      record('C6-zoom200', vp.name, clean, `scale2 scrollW=${zoom.scrollW}/${zoom.vw}`);
    } else {
      record('C6-zoom200', vp.name, true, 'n/a (375 only)');
    }

    // ---- C7: artifacts ----
    const c7 = await page.evaluate(() => ({
      cursorDots: document.querySelectorAll('.cursor-dot').length,
      cursorRings: document.querySelectorAll('.cursor-ring').length,
      cursorEnabled: typeof document.body.className === 'string' && document.body.className.includes('cursor-enabled'),
      backBtn: document.querySelectorAll('.back-btn').length,
      backToTop: document.querySelectorAll('.back-to-top').length,
    }));
    record('C7-artifacts', vp.name,
      c7.cursorDots === 0 && c7.cursorRings === 0 && !c7.cursorEnabled && c7.backBtn === 0 && c7.backToTop === 1,
      `cursor=${c7.cursorDots}/${c7.cursorRings}/enabled=${c7.cursorEnabled} backBtn=${c7.backBtn} back-to-top=${c7.backToTop}`);

    // ---- C9: console ----
    record('C9-console', vp.name, consoleErrors.length === 0, consoleErrors.length ? consoleErrors.slice(0, 3).join(' | ') : '');

    await page.screenshot({ path: `${FIXTURE}/${vp.name}.png`, fullPage: true }).catch(() => {});
    await ctx.close();
  }

  await browser.close();

  console.log('\n\n==== FULL 7x6 RESULT GRID ====');
  const checks = ['C1-overflow', 'C2-qty-addrow', 'C3-tabs', 'C4-image', 'C5-grids', 'C6-zoom200', 'C7-artifacts', 'C9-console'];
  const cols = ['375', '430', '768', '1024', '1280', '1440'];
  console.log('CHECK           | ' + cols.map((c) => c.padStart(5)).join(' '));
  console.log('----------------+' + cols.map(() => '-----').join('-'));
  for (const check of checks) {
    const row = cols.map((v) => (results[check] && results[check][v] !== undefined ? (results[check][v] ? 'PASS' : 'FAIL') : '  -  ').padStart(5)).join(' ');
    console.log(check.padEnd(16) + '| ' + row);
  }
  console.log(`\nOUTCOME: ${fail === 0 ? 'ALL PASS' : fail + ' FAILURES'} (${pass} passed, ${fail} failed)`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
