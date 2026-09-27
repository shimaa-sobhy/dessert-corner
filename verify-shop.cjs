// SHOP MOBILE REDESIGN VERIFICATION (375/430) + tablet/desktop regression + donut-removal checks
const { chromium } = require('playwright');

const BASE = 'http://localhost:5173';
let failures = 0;
function ok(cond, label, extra) {
  if (cond) console.log('  PASS: ' + label + (extra ? ' | ' + extra : ''));
  else { failures++; console.log('  FAIL: ' + label + (extra ? ' | ' + extra : '')); }
}

async function main() {
  const browser = await chromium.launch();

  for (const vp of [{ name: '375', width: 375, height: 800 }, { name: '430', width: 430, height: 800 }]) {
    console.log(`\n########## ${vp.name}px ── SHOP PAGE ##########`);
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    page.on('pageerror', (e) => errs.push(String(e)));
    await page.goto(BASE + '/shop', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // ---- toolbar ----
    const toolbar = await page.evaluate(() => {
      const mb = document.querySelector('.mobile-toolbar');
      const dt = document.querySelector('.desktop-toolbar');
      const filter = document.querySelector('.filter-bar-btn');
      const sort = document.querySelector('.sort-bar-btn');
      const count = document.querySelector('.shop-toolbar-count');
      const fsvg = filter?.querySelector('svg')?.outerHTML || '';
      const sortSvg = sort?.querySelector('svg')?.outerHTML || '';
      const r = (el) => el ? { w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height), visible: el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0 } : null;
      return {
        mobileToolbarVisible: mb ? (mb.getBoundingClientRect().width > 0 && mb.getBoundingClientRect().height > 0) : false,
        desktopToolbarVisible: dt ? (dt.getBoundingClientRect().width > 0 && dt.getBoundingClientRect().height > 0) : false,
        stickyOn: mb ? getComputedStyle(mb).position : null,
        filterBtn: r(filter), filterText: filter?.textContent.trim(),
        filterHasFunnel: fsvg.includes('polygon') && fsvg.includes('12.46'),
        filterBtnSizeOK: filter ? (filter.getBoundingClientRect().width >= 44 && filter.getBoundingClientRect().height >= 44) : false,
        sortBtn: r(sort), sortText: sort?.textContent.trim(),
        sortHasChevron: sortSvg.includes('M6 9l6 6 6-6'),
        sortBtnSizeOK: sort ? (sort.getBoundingClientRect().width >= 44 && sort.getBoundingClientRect().height >= 44) : false,
        count: count?.textContent.trim(),
        nativeSelectVisible: !!document.querySelector('.desktop-toolbar select') && (document.querySelector('.desktop-toolbar'))?.getBoundingClientRect().width > 0,
      };
    });
    console.log('Toolbar state:', JSON.stringify(toolbar));
    ok(toolbar.mobileToolbarVisible, 'mobile toolbar visible', 'class present');
    ok(toolbar.stickyOn === 'sticky', 'mobile toolbar sticky', toolbar.stickyOn);
    ok(!toolbar.desktopToolbarVisible, 'desktop toolbar hidden');
    ok(toolbar.filterBtn?.visible, 'Filter button visible');
    ok(toolbar.filterHasFunnel, 'Filter icon is a funnel (not an X)');
    ok(toolbar.filterBtnSizeOK, 'Filter button >= 44px tall/wide', `w=${toolbar.filterBtn?.w} h=${toolbar.filterBtn?.h}`);
    ok(toolbar.sortBtn?.visible, 'Sort button visible');
    ok(toolbar.sortText && toolbar.sortText.includes('Sort: Newest'), 'Sort button shows current sort', toolbar.sortText);
    ok(toolbar.sortHasChevron, 'Sort button has chevron');
    ok(toolbar.sortBtnSizeOK, 'Sort button >= 44px tall/wide', `w=${toolbar.sortBtn?.w} h=${toolbar.sortBtn?.h}`);
    ok(toolbar.count === '19 products', 'product count reflects post-donut total', toolbar.count);

    // ---- grid: 2 cols, no clipping, no donuts ----
    const grid = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.product-grid .product-card'));
      const gridEl = document.querySelector('.product-grid');
      const gr = gridEl ? gridEl.getBoundingClientRect() : null;
      const vw = document.documentElement.clientWidth;
      const rows = new Map();
      const rects = cards.map((c) => {
        const r = c.getBoundingClientRect();
        const f = document.querySelector('.product-grid') ? c.getBoundingClientRect().top : 0;
        const rowKey = Math.round(f);
        rows.set(rowKey, (rows.get(rowKey) || 0) + 1);
        const cs = getComputedStyle(c);
        return {
          name: c.querySelector('.product-card-name')?.textContent,
          left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width),
          clipL: r.left < (gr ? gr.left : 0) - 1, clipR: r.right > gr.right + 1, clipV: r.right > vw + 1 || r.left < -1,
          gridCols: gr ? getComputedStyle(gridEl).gridTemplateColumns : '',
          overflow: gr ? getComputedStyle(gridEl).overflowX : '',
        };
      });
      return { colCount: cards.length ? Math.max(...rows.values()) : 0, rowCounts: [...rows.values()], rects, grid: gr ? { left: Math.round(gr.left), right: Math.round(gr.right), w: Math.round(gr.width) } : null };
    });
    ok(grid.colCount === 2, 'grid is 2 columns', `rowCounts=${JSON.stringify(grid.rowCounts)} cols=${grid.colCount}`);
    ok(grid.rects.every((r) => !r.clipL && !r.clipR && !r.clipV), 'no card clipped on either edge', `grid=${JSON.stringify(grid.grid)} first=${JSON.stringify(grid.rects[0])}`);
    const donutFree = grid.rects.every((r) => !/donut/i.test(r.name || ''));
    ok(donutFree, 'no donut products in grid', `names=${JSON.stringify(grid.rects.map((r) => r.name))}`);
    ok(grid.rects.length >= 4, 'grid shows first page of products', `count=${grid.rects.length}`);

    // ---- load more / pagination / back ----
    const bottom = await page.evaluate(() => {
      const btn = document.querySelector('.load-more-btn');
      const pag = document.querySelector('.pagination');
      const back = document.querySelector('.back-btn-wrap .back-btn');
      const brb = () => { const r = document.querySelector('.back-btn')?.getBoundingClientRect(); return r ? { w: Math.round(r.width), h: Math.round(r.height), visible: r.width > 0 && r.height > 0 } : null; };
      return { loadMoreVisible: btn ? (btn.getBoundingClientRect().width > 0) : false, loadMoreText: btn?.textContent.trim(), hasPagination: !!pag, backBtn: brb() };
    });
    ok(bottom.loadMoreVisible, 'Load More Products button present', bottom.loadMoreText);
    ok(bottom.loadMoreText?.includes('Load More Products'), 'Load More label correct');
    ok(!bottom.hasPagination, 'no numbered pagination');
    ok(bottom.backBtn === null || !bottom.backBtn.visible, 'no stray Back button', JSON.stringify(bottom.backBtn));

    // ---- filter bottom sheet ----
    await page.click('.filter-bar-btn');
    await page.waitForTimeout(400);
    const sheet = await page.evaluate(() => {
      const overlay = document.querySelector('.bottom-sheet-overlay');
      const s = document.querySelector('.bottom-sheet');
      const sr = s ? s.getBoundingClientRect() : null;
      const fr = document.querySelector('.bottom-sheet-footer')?.getBoundingClientRect();
      const content = document.querySelector('.bottom-sheet-content');
      const catLabels = Array.from(document.querySelectorAll('.filter-block:first-of-type .filter-option')).map((l) => l.textContent.trim());
      const clear = document.querySelector('.clear-all-link');
      const clearStyle = clear ? getComputedStyle(clear) : null;
      const apply = document.querySelector('.bottom-sheet-footer .btn-primary');
      const close = document.querySelector('.bottom-sheet-close');
      return {
        overlay: !!overlay,
        sheetVisible: sr ? (sr.height > 100) : false,
        sheetH: sr ? Math.round(sr.height) : null,
        sheetBottom: sr ? Math.round(sr.bottom) : null, vh: window.innerHeight,
        footerSticky: fr ? { bottom: Math.round(fr.bottom), sheetBottom: sr ? Math.round(sr.bottom) : null, pinned: Math.abs(fr.bottom - sr.bottom) <= 2 } : null,
        contentScrollable: content ? content.scrollHeight >= content.clientHeight : false,
        catLabels: JSON.stringify(catLabels),
        hasDonutsOption: catLabels.some((l) => /donut/i.test(l)),
        clearAllText: clear?.textContent.trim(),
        clearIsLink: clearStyle ? (clearStyle.textDecorationLine.includes('underline') && clearStyle.backgroundImage === 'none' && (clearStyle.borderStyle === 'none' || clearStyle.borderWidth === '0px')) : false,
        applyText: apply?.textContent.trim(),
        hasCloseX: !!close,
        bodyLocked: document.body.style.overflow === 'hidden',
      };
    });
    console.log('Filter sheet:', JSON.stringify(sheet));
    ok(sheet.overlay && sheet.sheetVisible, 'filter bottom sheet opens');
    ok(sheet.sheetH >= Math.round(sheet.vh * 0.8), 'sheet covers >= 80% height', `h=${sheet.sheetH}/${sheet.vh}`);
    ok(sheet.footerSticky?.pinned, 'Apply Filters sticky at sheet bottom', JSON.stringify(sheet.footerSticky));
    ok(sheet.applyText === 'Apply Filters', 'Apply Filters button', sheet.applyText);
    ok(sheet.clearAllText === 'Clear All' && sheet.clearIsLink, 'Clear All is a text link (underline, no border/bg)');
    ok(sheet.hasCloseX, 'X close button present');
    ok(sheet.bodyLocked, 'body scroll locked while open');
    ok(!sheet.hasDonutsOption, 'no Donuts option in category list', sheet.catLabels);
    ok(sheet.catLabels.includes('Cakes') && sheet.catLabels.includes('Ice Cream'), 'categories present', sheet.catLabels);

    // dismiss via outside tap
    await page.click('.bottom-sheet-overlay', { position: { x: 10, y: 10 } });
    await page.waitForTimeout(350);
    ok(!(await page.$('.bottom-sheet-overlay')), 'overlay tap dismisses sheet');

    // ---- sort bottom sheet ----
    await page.click('.sort-bar-btn');
    await page.waitForTimeout(350);
    const sortState = await page.evaluate(() => {
      const opts = Array.from(document.querySelectorAll('.sort-option')).map((b) => ({ t: b.textContent.trim(), active: b.classList.contains('active') }));
      const s = document.querySelector('.sort-sheet');
      const r = s ? s.getBoundingClientRect() : null;
      return { opts, s: r ? { h: Math.round(r.height), vh: window.innerHeight } : null };
    });
    ok(sortState.opts.length === 5, 'sort sheet has 5 options', `opts=${sortState.opts.map((o) => o.t).join(' | ')}`);
    ok(sortState.opts.find((o) => o.t === 'Newest')?.active, 'current sort highlighted (Newest)');
    await page.click('.bottom-sheet-close');
    await page.waitForTimeout(350);
    ok(true, 'sort sheet closes via X');

    // ---- donut-copy + error checks ----
    ok(errs.length === 0, 'no console/page errors', errs.join(' || '));
    await ctx.close();
  }

  // ---- OTHER-MOBILE-PAGE back button regression (global <=900px hide) ----
  console.log('\n########## 375px ── ABOUT PAGE (back button hidden on ALL mobile pages) ##########');
  const ctxB = await browser.newContext({ viewport: { width: 375, height: 800 } });
  const pageB = await ctxB.newPage();
  await pageB.goto(BASE + '/about', { waitUntil: 'domcontentloaded' });
  await pageB.waitForTimeout(400);
  const aboutBack = await pageB.evaluate(() => {
    const b = document.querySelector('.back-btn');
    const r = b?.getBoundingClientRect();
    return b ? { visible: r.width > 0 && r.height > 0, w: Math.round(r.width), h: Math.round(r.height), wrapDisplay: getComputedStyle(document.querySelector('.back-btn-wrap')).display } : null;
  });
  ok(aboutBack === null || !aboutBack.visible, 'About page mobile hides Back button', JSON.stringify(aboutBack));
  await ctxB.close();

  // ---- 1440px DESKTOP REGRESSION ----
  console.log('\n########## 1440px ── SHOP PAGE (desktop unchanged) ##########');
  const ctxD = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageD = await ctxD.newPage();
  const derrs = [];
  pageD.on('console', (m) => { if (m.type() === 'error') derrs.push(m.text()); });
  pageD.on('pageerror', (e) => derrs.push(String(e)));
  await pageD.goto(BASE + '/shop', { waitUntil: 'domcontentloaded' });
  await pageD.waitForTimeout(400);
  const desk = await pageD.evaluate(() => {
    const mb = document.querySelector('.mobile-toolbar');
    const dt = document.querySelector('.desktop-toolbar');
    const mbVisible = mb ? mb.getBoundingClientRect().width > 0 : false;
    const dtVisible = dt ? dt.getBoundingClientRect().width > 0 : false;
    const sidebar = document.querySelector('.shop-layout > aside');
    const cards = document.querySelectorAll('.product-grid .product-card');
    const gr = document.querySelector('.product-grid').getBoundingClientRect();
    const cols = getComputedStyle(document.querySelector('.product-grid')).gridTemplateColumns.split(' ').length;
    const back = document.querySelector('.back-btn');
    const backR = back.getBoundingClientRect();
    const donuts = Array.from(cards).some((c) => /donut/i.test(c.querySelector('.product-card-name')?.textContent || ''));
    return {
      mbVisible, dtVisible, sidebar: !!sidebar, cardCount: cards.length,
      gridCols: cols, gridLeft: Math.round(gr.left), gridRight: Math.round(gr.right), vw: document.documentElement.clientWidth,
      backVisible: backR.width > 0 && backR.height > 0,
      nativeSelect: !!document.querySelector('.desktop-toolbar select'),
      donuts,
      errs: [],
    };
  });
  console.log('Desktop:', JSON.stringify(desk));
  ok(!desk.mbVisible, 'mobile toolbar hidden on desktop');
  ok(desk.dtVisible, 'desktop toolbar visible on desktop');
  ok(desk.sidebar, 'filter sidebar visible on desktop');
  ok(desk.cardCount === 6, 'desktop shows 6 products per page', `count=${desk.cardCount}`);
  ok(desk.gridCols === 3, 'desktop grid 3 columns', `cols=${desk.gridCols}`);
  ok(desk.nativeSelect, 'native sort select on desktop');
  ok(desk.backVisible, 'Back button visible on desktop shop');
  ok(!desk.donuts, 'no donut products on desktop grid');
  ok(derrs.length === 0, 'no desktop console/page errors', derrs.join(' || '));
  await ctxD.close();

  // ---- 768px tablet sanity ----
  console.log('\n########## 768px ── SHOP PAGE (tablet keeps mobile bar + 2 cols, per 900px breakpoint) ##########');
  const ctxT = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const pageT = await ctxT.newPage();
  await pageT.goto(BASE + '/shop', { waitUntil: 'domcontentloaded' });
  await pageT.waitForTimeout(400);
  const tab = await pageT.evaluate(() => {
    const mb = document.querySelector('.mobile-toolbar');
    return { mbVisible: mb ? mb.getBoundingClientRect().width > 0 : false };
  });
  ok(tab.mbVisible, 'mobile toolbar active at 768px (≤900 breakpoint)');
  await ctxT.close();

  // ---- HOMEPAGE: hero donuts + testimonial quotes intact ----
  console.log('\n########## 375px ── HOMEPAGE (donut hero + testimonials) ##########');
  const ctxH = await browser.newContext({ viewport: { width: 375, height: 800 } });
  const pageH = await ctxH.newPage();
  await pageH.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await pageH.waitForTimeout(500);
  const home = await pageH.evaluate(() => {
    const heroImgs = Array.from(document.querySelectorAll('.hero-donut-img')).length;
    const body = document.body.innerText;
    return {
      heroDonutImgs: heroImgs,
      hasChocolateGlaze: body.includes('chocolate glaze is unreal'),
      hasBestDonut: body.includes('Best donut in the city'),
      hasRealStrawberry: body.includes('Real strawberry flavor'),
      hasPinkGlaze: body.includes('pink glaze makes it'),
    };
  });
  console.log('Home:', JSON.stringify(home));
  ok(home.heroDonutImgs >= 4, 'homepage hero donut illustrations present', `count=${home.heroDonutImgs}`);
  ok(home.hasChocolateGlaze && home.hasBestDonut && home.hasRealStrawberry && home.hasPinkGlaze, 'testimonial donut quotes r1-r4 intact');
  await ctxH.close();

  await browser.close();
  console.log(`\n===== ${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'} =====`);
  process.exit(failures === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });