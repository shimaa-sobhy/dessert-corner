// CART PAGE VERIFICATION — P1 overflow/overlap, P2 back-to-top vs footer,
// P3 custom cursor on touch + edge-clamp, P4 undo toast, P5 touch targets, P6 empty state
const { chromium, devices } = require('playwright');

const BASE = 'http://localhost:5173';
let failures = 0;
function ok(cond, label, extra) {
  if (cond) console.log('  PASS: ' + label + (extra ? ' | ' + extra : ''));
  else { failures++; console.log('  FAIL: ' + label + (extra ? ' | ' + extra : '')); }
}

const PRODUCTS = ['celebration-layer-cake', 'gelato-sundae', 'triple-chocolate-cake', 'double-chocolate-brownie-stack', 'mixed-ice-cream-scoops', 'berry-celebration-cake'];

function seedItems(count) {
  return PRODUCTS.slice(0, count).map((p, i) => ({ productId: p, quantity: (i % 3) + 1 }));
}

async function loadCart(page, items) {
  await page.addInitScript((seed) => {
    localStorage.setItem('sucre_cart', JSON.stringify(seed));
    localStorage.removeItem('sucre_coupon');
  }, items);
  await page.goto(BASE + '/cart', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('load');
  await page.waitForTimeout(450);
}

// ---------- P1: no overflow / no clip / no overlap across widths x item counts ----------
async function p1(browser) {
  console.log('\n########## P1 — no overflow / no clip / no overlap ##########');
  const widths = [320, 375, 390, 414, 430, 480, 768, 820, 900, 1024, 1440];
  const counts = [1, 3, 6];
  for (const count of counts) {
    for (const w of widths) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 844 } });
      const page = await ctx.newPage();
      page.on('console', (m) => { if (m.type() === 'error' && !/^Failed to load resource/.test(m.text())) console.log('    console-err:', m.text()); });
      await loadCart(page, seedItems(count));
      const r = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const hScroll = document.documentElement.scrollWidth > vw + 1;
        const cards = Array.from(document.querySelectorAll('.cart-items .cart-item'));
        const cardInfo = cards.map((c) => {
          const cr = c.getBoundingClientRect();
          const qty = c.querySelector('.qty-selector')?.getBoundingClientRect();
          const remove = c.querySelector('.ci-remove')?.getBoundingClientRect();
          const side = c.querySelector('.ci-side')?.getBoundingClientRect();
          const clipped = (qty && (qty.right > cr.right + 1 || qty.bottom > cr.bottom + 1 || qty.left < cr.left - 1)) ||
            (remove && (remove.right > cr.right + 1 || remove.bottom > cr.bottom + 1 || remove.left < cr.left - 1)) ||
            (side && (side.right > cr.right + 1 || side.bottom > cr.bottom + 1));
          return { top: cr.top, bottom: cr.bottom, height: cr.height, clipped, name: (c.querySelector('.ci-name') || {}).textContent?.trim().slice(0, 16) || '?' };
        });
        const summary = document.querySelector('.cart-grid > .surface:last-child')?.getBoundingClientRect();
        const lastCardRight = cardInfo.length ? Math.max(...Array.from(document.querySelectorAll('.cart-item')).map((c) => c.getBoundingClientRect().right)) : 0;
        const lastBottom = cardInfo.length ? Math.max(...cardInfo.map((c) => c.bottom)) : 0;
        const sideBySide = summary && lastCardRight && summary.left >= lastCardRight - 1;
        const overlap = summary ? summary.left < lastCardRight - 1 && summary.top < lastBottom : false;
        const gapTop = summary ? summary.top - lastBottom : null;
        return {
          hScroll,
          cardCount: cardInfo.length,
          clippedCards: cardInfo.filter((c) => c.clipped).map((c) => c.name),
          overlap,
          gapTop,
          sideBySide,
          summaryTop: summary ? Math.round(summary.top) : null,
          lastBottom: Math.round(lastBottom),
        };
      });
      const label = `width=${w} items=${r.cardCount}`;
      ok(!r.hScroll, label + ' no horizontal scroll', r.hScroll ? 'scrollW>' + w : '');
      ok(r.clippedCards.length === 0, label + ' no clipped Remove/qty/side', 'clipped=' + r.clippedCards.join(','));
      const sumOk = r.sideBySide ? !r.overlap : (r.gapTop !== null && r.gapTop >= 24 && !r.overlap);
      ok(sumOk, label + (r.sideBySide ? ' summary side-by-side no overlap' : ' summary cleared below last card'), r.sideBySide ? 'sideBySide' : 'gap=' + r.gapTop);
      await ctx.close();
    }
  }
}

// ---------- P2: back-to-top hidden when footer on screen ----------
async function p2(browser) {
  console.log('\n########## P2 — back-to-top vs footer ##########');
  for (const vp of [{ w: 390, h: 844 }, { w: 1440, h: 900 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    const page = await ctx.newPage();
    await loadCart(page, seedItems(3));

    // mid-page: button should be visible past threshold, with footer still below viewport
    const target = await page.evaluate(() => {
      const footer = document.querySelector('footer.site-footer');
      const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
      const absTop = footer.getBoundingClientRect().top + window.scrollY;
      return Math.min(absTop - window.innerHeight - 300, scrollable);
    });
    if (target >= 500) {
      await page.evaluate((y) => window.scrollTo(0, y), target);
      await page.waitForTimeout(300);
      const midVisible = await page.evaluate(() => document.querySelector('.back-to-top').classList.contains('visible'));
      ok(midVisible, `P2 @${vp.w}px back-to-top visible mid-page`, '');
    } else {
      ok(true, `P2 @${vp.w}px back-to-top visible mid-page (SKIP: short page)`, 'scrollable=' + target);
    }

    // bottom: button must not overlap any footer text/link
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(350);
    const r = await page.evaluate(() => {
      const btt = document.querySelector('.back-to-top');
      const bttR = btt.getBoundingClientRect();
      const visible = btt.classList.contains('visible');
      const foot = document.querySelector('footer.site-footer');
      const overlaps = [];
      if (foot) {
        for (const el of foot.querySelectorAll('a, p, span, h3, h4')) {
          const r2 = el.getBoundingClientRect();
          const t = (el.textContent || '').trim().replace(/\s+/g, ' ');
          if (!t || r2.width < 4 || r2.height < 4) continue;
          if (!(r2.top > bttR.bottom || r2.bottom < bttR.top || r2.left > bttR.right || r2.right < bttR.left)) {
            overlaps.push(t.slice(0, 30));
          }
        }
      }
      return { visible, overlaps };
    });
    ok(!r.visible && r.overlaps.length === 0, `P2 @${vp.w}px hidden/clear of footer text at page bottom`, 'visible=' + r.visible + ' overlaps=' + r.overlaps.join('|'));
    await ctx.close();
  }
}

// ---------- P3: no floating gray circle (custom cursor removed at root) ----------
async function p3(browser) {
  console.log('\n########## P3 — no floating gray circle ##########');

  // all devices/layouts: cursor elements must never exist in the DOM
  for (const [name, ctxOpts] of Object.entries({
    iPhone: { ...devices['iPhone 12'] },
    iPadTablet: { viewport: { width: 834, height: 1112 }, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
    touchLaptop: { viewport: { width: 1280, height: 800 }, hasTouch: true },
    desktop: { viewport: { width: 1280, height: 800 } },
  })) {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    await loadCart(page, seedItems(2));
    const r = await page.evaluate(() => ({
      dots: document.querySelectorAll('.cursor-dot').length,
      rings: document.querySelectorAll('.cursor-ring').length,
      backTop: document.querySelectorAll('.back-to-top').length,
      cursorEnabled: document.body.classList.contains('cursor-enabled'),
    }));
    ok(r.dots === 0 && r.rings === 0 && !r.cursorEnabled, `P3 ${name} zero cursor elements in DOM`, 'dots=' + r.dots + ' rings=' + r.rings);
    ok(r.backTop === 1, `P3 ${name} single working back-to-top`, 'backTop=' + r.backTop);
    await ctx.close();
  }
}

// ---------- P4: undo toast ----------
async function p4(browser) {
  console.log('\n########## P4 — remove / undo ##########');
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await loadCart(page, seedItems(3));
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('sucre_cart')));

  // click Remove on first card
  await page.click('.cart-items .cart-item:nth-child(1) .ci-remove');
  await page.waitForTimeout(350);
  const afterRemove = await page.evaluate(() => {
    const carts = JSON.parse(localStorage.getItem('sucre_cart'));
    const toast = document.querySelector('.toast');
    return { count: carts.length, ids: carts.map((c) => c.productId), toastText: toast ? toast.textContent : '' };
  });
  ok(afterRemove.count === before.length - 1, 'P4 Remove removes item', 'count=' + before.length + '->' + afterRemove.count);
  ok(afterRemove.toastText.includes('Removed') && afterRemove.toastText.includes('Undo'), 'P4 toast shows message + Undo', afterRemove.toastText);

  await page.click('.toast .toast-action');
  await page.waitForTimeout(350);
  const afterUndo = await page.evaluate(() => {
    const carts = JSON.parse(localStorage.getItem('sucre_cart'));
    const addedToast = Array.from(document.querySelectorAll('.toast')).some((t) => t.textContent.includes('Added to cart'));
    return { carts, addedToast };
  });
  const removedEntry = before[0];
  const restoredEntry = afterUndo.carts.find((c) => c.productId === removedEntry.productId);
  ok(afterUndo.carts.length === before.length && restoredEntry && restoredEntry.quantity === removedEntry.quantity, 'P4 Undo restores item with same qty', JSON.stringify(restoredEntry));
  ok(!afterUndo.addedToast, 'P4 restore does not fire "Added to cart"', '');

  // auto-dismiss
  await page.click('.cart-items .cart-item:nth-child(1) .ci-remove');
  await page.waitForTimeout(300);
  let toastGone = await page.evaluate(() => document.querySelectorAll('.toast .toast-action').length === 0);
  ok(!toastGone, 'P4 undo toast appears', '');
  await page.waitForTimeout(5000);
  toastGone = await page.evaluate(() => document.querySelectorAll('.toast .toast-action').length === 0);
  ok(toastGone, 'P4 toast auto-dismisses after ~5s', '');
  await ctx.close();
}

// ---------- P5: touch targets ----------
async function p5(browser) {
  console.log('\n########## P5 — touch targets ##########');
  const ctx = await browser.newContext({ ...devices['iPhone 12'] });
  const page = await ctx.newPage();
  await loadCart(page, seedItems(2));
  const r = await page.evaluate(() => {
    const qtyBtns = Array.from(document.querySelectorAll('.cart-items .qty-selector button')).map((b) => {
      const r2 = b.getBoundingClientRect();
      return { w: r2.width, h: r2.height };
    });
    const remove = (() => {
      const b = document.querySelector('.cart-items .ci-remove');
      const r2 = b.getBoundingClientRect();
      return { w: r2.width, h: r2.height };
    })();
    return { qtyBtns, remove };
  });
  ok(r.qtyBtns.every((b) => b.w >= 44 && b.h >= 44), 'P5 qty +/- buttons >= 44x44', JSON.stringify(r.qtyBtns));
  ok(r.remove.w >= 44 && r.remove.h >= 44, 'P5 Remove hit area >= 44x44', `${Math.round(r.remove.w)}x${Math.round(r.remove.h)}`);
  await ctx.close();
}

// ---------- P6: empty state ----------
async function p6(browser) {
  console.log('\n########## P6 — empty cart state ##########');
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await loadCart(page, []);
  const r = await page.evaluate(() => {
    const hs = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    const empty = document.querySelector('.empty-state');
    return { hScroll: hs, hasEmpty: !!empty, title: empty ? empty.querySelector('h3')?.textContent : '', cta: empty ? empty.querySelector('a, button')?.textContent.trim() : '' };
  });
  ok(r.hasEmpty && /empty/i.test(r.title), 'P6 empty state message shown', r.title);
  ok(r.cta === 'Continue Shopping', 'P6 CTA label is Continue Shopping', r.cta);
  await page.click('.empty-state a, .empty-state button');
  await page.waitForURL('**/shop', { timeout: 10000 });
  ok(page.url().includes('/shop'), 'P6 CTA routes to product listing', page.url().split('/')[3] || page.url());

  // UI-based: remove all items, empty state appears
  await page.evaluate(() => {
    localStorage.setItem('sucre_cart', JSON.stringify([{ productId: 'gelato-sundae', quantity: 1 }, { productId: 'triple-chocolate-cake', quantity: 2 }]));
  });
  await page.goto(BASE + '/cart', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('load');
  await page.waitForTimeout(300);
  for (let i = 2; i >= 1; i--) {
    const nth = await page.evaluate(() => document.querySelectorAll('.cart-items .cart-item').length);
    if (nth === 0) break;
    const btn = page.locator('.cart-items .cart-item .ci-remove').first();
    if (await btn.count()) { await btn.click(); await page.waitForTimeout(250); }
  }
  const emptyShown = await page.evaluate(() => !!document.querySelector('.empty-state'));
  ok(emptyShown, 'P6 empty state shown after removing all items', '');
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch();
  await p1(browser);
  await p2(browser);
  await p3(browser);
  await p4(browser);
  await p5(browser);
  await p6(browser);
  await browser.close();
  console.log('\nOUTCOME: ' + (failures === 0 ? 'ALL PASS' : failures + ' FAILURES'));
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });