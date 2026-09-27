// ACCOUNT CONTENT/STRUCTURE VERIFICATION — all breakpoints (375/768/1280)
const { chromium } = require('playwright');
const BASE = 'http://localhost:5173';
let failures = 0;
function ok(cond, label, extra) {
  if (cond) console.log('  PASS: ' + label + (extra ? ' | ' + extra : ''));
  else { failures++; console.log('  FAIL: ' + label + (extra ? ' | ' + extra : '')); }
}

async function seed(page, email) {
  await page.addInitScript((em) => {
    localStorage.setItem('sucre_users', JSON.stringify([{ name: 'Test User', email: em, password: 'old-pass', phone: '5551234' }]));
    localStorage.setItem('sucre_session', JSON.stringify({ name: 'Test User', email: em, phone: '5551234' }));
    localStorage.setItem('sucre_addresses', JSON.stringify([{ id: 'a1', label: 'Home', fullName: 'Test User', line1: '12 Dessert Lane', city: 'Cairo', postalCode: '12345', phone: '' }]));
  }, email);
}

async function main() {
  const browser = await chromium.launch();

  for (const vp of [{ name: '375', w: 375, h: 800 }, { name: '768', w: 768, h: 900 }, { name: '1280', w: 1280, h: 900 }]) {
    console.log(`\n########## ${vp.name}px ── /account ##########`);
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    page.on('pageerror', (e) => errs.push(String(e)));
    await seed(page, 'test@example.com');
    await page.goto(BASE + '/account', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');
    await page.waitForTimeout(350);

    const s = await page.evaluate(() => {
      const main2 = document.querySelector('.page-main');
      const text = main2 ? main2.textContent : '';
      const vw = document.documentElement.clientWidth;
      const hScroll = document.documentElement.scrollWidth > vw + 1;
      const orderLinks = Array.from(document.querySelectorAll('.page-main a')).filter((a) => a.getAttribute('href')?.startsWith('/account/orders'));
      const grid = document.querySelector('.account-grid');
      const gridChildren = grid ? Array.from(grid.children) : [];
      const seq = gridChildren.map((c) => {
        const h = c.querySelector('h3')?.textContent || c.className || c.tagName;
        return (c.textContent?.includes('Saved Addresses') && h !== undefined) ? 'addresses' : h;
      });
      // Profile card top-level block order
      const profileCard = gridChildren[0];
      let order = null;
      if (profileCard) {
        const marks = [];
        const kids = Array.from(profileCard.children);
        const formHeads = kids.map((k) => (k.tagName === 'H3' ? 'heading:Profile' : k.tagName === 'H4' ? 'heading:Change Password' : k.classList?.contains('field') ? 'field' : k.tagName === 'FORM' ? 'form' : k.tagName));
        order = formHeads.join(' > ');
      }
      const pwInputs = Array.from(document.querySelectorAll('.account-grid input[type="password"], .account-grid .pw-wrap input'));
      const toggles = document.querySelectorAll('.pw-toggle').length;
      const hasUpdPwd = Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.trim() === 'Update Password');
      const hasSave = Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.trim() === 'Save Changes');
      const hasViewLink = text.includes('View order history');
      const phonePresent = Array.from(document.querySelectorAll('label')).some((l) => l.textContent?.trim() === 'Phone');
      const btt = document.querySelectorAll('.back-to-top').length;
      const bbw = document.querySelector('.back-btn-wrap');
      const backDisplay = bbw ? getComputedStyle(bbw).display : 'absent';
      // stray static overflow
      const overfl = [];
      if (hScroll) {
        Array.from(document.querySelectorAll('main *')).forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.right > vw + 1 || r.left < -1) {
            if (getComputedStyle(el).position !== 'fixed') overfl.push(el.tagName + '(' + String(r.right - vw) + ')');
          }
        });
      }
      return {
        hScroll, orderLinks: orderLinks.map((a) => a.textContent.trim()), seq,
        profileOrder: order, pwInputCount: pwInputs.length, toggles,
        hasUpdPwd, hasSave, hasViewLink, phonePresent, btt, backDisplay,
        overfl: overfl.slice(0, 6),
      };
    });
    s.errs = errs.length;

    ok(!s.hScroll && s.overfl.length === 0, 'no horizontal overflow', s.overfl.join(','));
    ok(s.orderLinks.length === 1, 'exactly ONE order-history link', 'count=' + s.orderLinks.length);
    ok(!s.hasViewLink, 'no duplicate "View order history" text link');
    ok(s.profileOrder === 'heading:Profile > form > heading:Change Password > form', 'Profile card order: Profile h3, profile form, Change Password h4, password form', s.profileOrder);
    ok(s.seq[0] === 'Profile' && s.seq.includes('addresses'), 'account-grid: Profile card then Saved Addresses card', JSON.stringify(s.seq));
    ok(s.pwInputCount === 2, 'New Password + Confirm Password inputs present', 'count=' + s.pwInputCount);
    ok(s.toggles === 2, 'show/hide toggles present on both password fields', 'count=' + s.toggles);
    ok(s.hasUpdPwd && s.hasSave, '"Update Password" + "Save Changes" buttons both present');
    ok(!s.phonePresent, 'Phone field removed (Save Changes scoped to name/email only)');
    ok(s.btt === 1, 'single back-to-top', 'count=' + s.btt);
    const backExpected = vp.w <= 900 ? 'none' : 'block';
    ok(s.backDisplay === backExpected, 'Back button ' + (backExpected === 'none' ? 'hidden <=900px' : 'visible above 900px'), s.backDisplay);
    ok(s.errs === 0, 'zero console/page errors');

    await page.screenshot({ path: 'shots/account-content-' + vp.name + '.png', fullPage: true });
    await ctx.close();
  }

  // ---- FUNCTIONAL: show/hide toggle + validation + password update ----
  console.log('\n########## FUNCTIONAL CHECKS (375px) ##########');
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
  const page = await ctx.newPage();
  await seed(page, 'test@example.com');
  await page.goto(BASE + '/account', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load');
  await page.waitForTimeout(300);

  // toggle: input type flips
  const pw1 = page.locator('.account-grid .pw-wrap input').first();
  const before = await pw1.getAttribute('type');
  await page.locator('.account-grid .pw-wrap .pw-toggle').first().click();
  await page.waitForTimeout(150);
  const after = await pw1.getAttribute('type');
  ok(before === 'password' && after === 'text', 'show/hide toggle reveals password on click', before + ' -> ' + after);
  await page.locator('.account-grid .pw-wrap .pw-toggle').first().click();
  await page.waitForTimeout(150);

  // mismatch shows inline error
  const pws = page.locator('.account-grid .pw-wrap input');
  await pws.nth(0).fill('new-pass-123');
  await pws.nth(1).fill('new-pass-999');
  await page.locator('button', { hasText: 'Update Password' }).click();
  await page.waitForTimeout(200);
  const errEls = await page.locator('.field-error').count();
  const errText = await page.locator('.field-error').first().textContent().catch(() => '');
  ok(errEls === 1, 'mismatch shows inline error', String(errText.trim()));

  // match + submit updates stored password
  await pws.nth(1).fill('new-pass-123');
  await page.locator('button', { hasText: 'Update Password' }).click();
  await page.waitForTimeout(250);
  const users = await page.evaluate(() => JSON.parse(localStorage.getItem('sucre_users') || '[]'));
  const me = users.find((u) => u.email === 'test@example.com');
  ok(me && me.password === 'new-pass-123', 'password updated in stored users', me ? me.password : 'none');
  const errAfter = await page.locator('.field-error').count();
  const pwValAfter = await pws.nth(0).inputValue();
  ok(errAfter === 0 && pwValAfter === '', 'error cleared + fields reset after successful update');

  // blank passwords are a no-op (leave unchanged)
  await page.locator('button', { hasText: 'Update Password' }).click();
  await page.waitForTimeout(200);
  const users2 = await page.evaluate(() => JSON.parse(localStorage.getItem('sucre_users') || '[]'));
  const me2 = users2.find((u) => u.email === 'test@example.com');
  ok(me2 && me2.password === 'new-pass-123', 'blank submit keeps current password unchanged', me2.password);
  ok(await page.locator('.field-error').count() === 0, 'no error when both blank');

  // Save Changes still works (name only)
  await page.locator('.account-grid .field input').first().fill('Renamed User');
  await page.locator('button', { hasText: 'Save Changes' }).click();
  await page.waitForTimeout(250);
  const sess = await page.evaluate(() => JSON.parse(localStorage.getItem('sucre_session') || 'null'));
  ok(sess && sess.name === 'Renamed User', 'Save Changes still updates profile name', sess.name);
  ok(sess && sess.email === 'test@example.com', 'email untouched', sess.email);

  await browser.close();
  console.log('\nOUTCOME: ' + (failures === 0 ? 'ALL PASS' : failures + ' FAILURES'));
  process.exit(failures ? 1 : 0);
}
main();