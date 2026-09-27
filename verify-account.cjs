// ACCOUNT MOBILE FIX VERIFICATION — account family + global Back/BackToTop audit
const { chromium } = require('playwright');
const BASE = 'http://localhost:5173';
let failures = 0;
function ok(cond, label, extra) {
  if (cond) console.log('  PASS: ' + label + (extra ? ' | ' + extra : ''));
  else { failures++; console.log('  FAIL: ' + label + (extra ? ' | ' + extra : '')); }
}

async function seed(page, email) {
  await page.addInitScript((em) => {
    localStorage.setItem('sucre_users', JSON.stringify([{ name: 'Test User', email: em, password: 'pw' }]));
    localStorage.setItem('sucre_session', JSON.stringify({ name: 'Test User', email: em }));
    localStorage.setItem('sucre_addresses', JSON.stringify([{ id: 'a1', label: 'Home', fullName: 'Test User', line1: '12 Dessert Lane', city: 'Cairo', postalCode: '12345', phone: '' }]));
    localStorage.setItem('sucre_wishlist', JSON.stringify(['celebration-layer-cake', 'gelato-sundae']));
  }, email);
}

const PAGE_CHECKLIST = {
  '/account': [
    '.account-grid', '.account-grid .surface', '.account-grid .field input',
    '.account-grid form:not(.surface) input', '.account-grid .btn',
  ],
  '/account/orders': ['.surface', '.surface button'],
  '/wishlist': ['.product-grid', '.product-card'],
  '/cart': ['.surface, .cart-summary, .cart-item'],
};

async function checkPage(browser, vp, path, selectors) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error' && !/^Failed to load resource/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push(String(e)));
  await seed(page, 'test@example.com');
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load');
  await page.waitForTimeout(350);

  const state = await page.evaluate((path) => {
    const vw = document.documentElement.clientWidth;
    const hScroll = document.documentElement.scrollWidth > vw + 1;
    const overflOwners = [];
    if (hScroll) {
      Array.from(document.querySelectorAll('main *')).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > vw + 1 || r.left < -1) {
          const cs = getComputedStyle(el);
          if (cs.position !== 'fixed') {
            overflOwners.push({ tag: el.tagName, cls: (el.className || '').toString().slice(0, 40), l: Math.round(r.left), r: Math.round(r.right) });
          }
        }
      });
    }
    const btt = document.querySelectorAll('.back-to-top');
    const bttCS = btt[0] ? getComputedStyle(btt[0]) : null;
    const bbw = document.querySelector('.back-btn-wrap');
    const bbwCS = bbw ? getComputedStyle(bbw) : null;
    return {
      url: location.pathname,
      hScroll,
      overflOwners: overflOwners.slice(0, 8),
      bttCount: btt.length,
      bttFixed: bttCS ? bttCS.position === 'fixed' : false,
      bttBottomRight: bttCS ? (bttCS.position === 'fixed' && bttCS.right) : false,
      backBtnVisible: bbwCS ? bbwCS.display !== 'none' && bbw.getBoundingClientRect().height > 0 : false,
    };
  }, path);

  console.log('\n## ' + path + ' @' + vp.w + 'px | url=' + state.url);
  ok(!state.hScroll, 'no horizontal page scroll', state.overflOwners.length ? JSON.stringify(state.overflOwners) : '');
  ok(state.overflOwners.length === 0, 'no static element overflows viewport', '');
  ok(state.bttCount === 1 && state.bttFixed && state.bttBottomRight, 'single fixed bottom-right back-to-top', 'count=' + state.bttCount);
  ok(!state.backBtnVisible, 'Back button hidden on <=900px', 'display=none');
  ok(errs.length === 0, 'zero console/page errors', String(errs[0] || ''));

  // selector-specific within-viewport checks
  for (const sel of selectors) {
    const leak = await page.evaluate((sel) => {
      const vw = document.documentElement.clientWidth;
      const bad = [];
      document.querySelectorAll(sel).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0) return;
        if (r.right > vw + 1 || r.left < -1) bad.push({ t: el.tagName, c: (el.className || '').toString().slice(0, 30), l: Math.round(r.left), r: Math.round(r.right) });
      });
      return bad;
    }, sel);
    ok(leak.length === 0, 'no overflow: ' + sel, leak.length ? JSON.stringify(leak) : '');
  }
  await ctx.close();
}

async function desktopCheck(browser, path) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await seed(page, 'test@example.com');
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load');
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    const bbw = document.querySelector('.back-btn-wrap');
    const btn = document.querySelector('.back-btn');
    const legacy = document.querySelectorAll('[class*="back-btn"]');
    const vw = document.documentElement.clientWidth;
    const hScroll = document.documentElement.scrollWidth > vw + 1;
    return {
      display: bbw ? getComputedStyle(bbw).display : 'absent',
      semantic: !!btn && btn.getAttribute('aria-label') === 'Go back',
      legacyCount: legacy.length,
      hScroll,
      btt: document.querySelectorAll('.back-to-top').length,
    };
  });
  console.log('\n## ' + path + ' @1440px | back-btn display=' + r.display + ' legacy=' + r.legacyCount + ' hScroll=' + r.hScroll + ' btt=' + r.btt);
  ok(r.display === 'absent' && r.semantic === false, 'no Back button anywhere (removed)', r.display);
  ok(r.legacyCount === 0, 'no back-btn artifacts in DOM', 'count=' + r.legacyCount);
  ok(!r.hScroll, 'no desktop hScroll');
  await ctx.close();
}

async function main() {
  const browser = await chromium.launch();
  for (const vp of [{ w: 375, h: 800 }, { w: 430, h: 800 }]) {
    for (const [path, sels] of Object.entries(PAGE_CHECKLIST)) {
      await checkPage(browser, vp, path, sels);
    }
  }
  for (const path of ['/account', '/shop', '/about', '/wishlist']) {
    await desktopCheck(browser, path);
  }
  console.log('\nOUTCOME: ' + (failures === 0 ? 'ALL PASS' : failures + ' FAILURES'));
  await browser.close();
  process.exit(failures ? 1 : 0);
}
main();