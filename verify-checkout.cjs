const { chromium, devices } = require('playwright');
const fs = require('fs');

const BASE = 'http://localhost:5173';
const FIXTURE = 'fixtures/checkout';

let pass = 0;
let fail = 0;
function ok(cond, label, detail) {
  if (cond) {
    pass++;
    console.log(`  PASS: ${label}${detail ? ' | ' + detail : ''}`);
  } else {
    fail++;
    console.log(`  FAIL: ${label}${detail ? ' | ' + detail : ''}`);
  }
}

(async () => {
  const browser = await chromium.launch();
  fs.mkdirSync(FIXTURE, { recursive: true });

  const seedItems = [
    { productId: 'celebration-layer-cake', quantity: 2 },
    { productId: 'gelato-sundae', quantity: 1 },
  ];

  async function seedAndGo(page, path) {
    await page.addInitScript((seed) => {
      localStorage.setItem('sucre_cart', JSON.stringify(seed));
      localStorage.removeItem('sucre_coupon');
    }, seedItems);
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('load');
    await page.waitForTimeout(600);
  }

  // ---- 1. GLOBAL circle proof: cursor elements zero, back-to-top exactly one ----
  console.log('\n########## 1. FLOATING CIRCLE — DOM PROOF ##########');
  for (const [name, path] of Object.entries({ cart: '/cart', categories: '/categories', checkout: '/checkout', account: '/account' })) {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    await seedAndGo(page, path);
    const proof = await page.evaluate(() => ({
      cursorDots: document.querySelectorAll('.cursor-dot').length,
      cursorRings: document.querySelectorAll('.cursor-ring').length,
      cursorEnabled: document.body.classList.contains('cursor-enabled'),
      backToTop: document.querySelectorAll('.back-to-top').length,
      circleEls: Array.from(document.querySelectorAll('body *')).filter((el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return (cs.borderRadius === '50%' || (cs.borderRadius + '').includes('999')) && r.width > 0 && r.width <= 100 && r.width === r.height;
      }).map((el) => (el.className && typeof el.className === 'string' ? el.className.split(' ')[0] : el.tagName.toLowerCase())).filter((c) => c.includes('cursor')),
    }));
    console.log(`  DOM[${name}] ${JSON.stringify(proof)}`);

    // also check desktop for the cursor dot (the historical offender)
    const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page2 = await ctx2.newPage();
    await seedAndGo(page2, path);
    const dp = await page2.evaluate(() => ({
      cursorDots: document.querySelectorAll('.cursor-dot').length,
      cursorRings: document.querySelectorAll('.cursor-ring').length,
      backToTop: document.querySelectorAll('.back-to-top').length,
    }));
    console.log(`  DOM[${name}@desktop] ${JSON.stringify(dp)}`);

    ok(proof.cursorDots === 0 && proof.cursorRings === 0 && !proof.cursorEnabled, `${name} mobile: zero cursor elements`, 'dots=' + proof.cursorDots + ' rings=' + proof.cursorRings);
    ok(dp.cursorDots === 0 && dp.cursorRings === 0, `${name} desktop: zero cursor elements`, 'dots=' + dp.cursorDots + ' rings=' + dp.cursorRings);
    ok(proof.backToTop === 0 || proof.backToTop === 1, `${name}: back-to-top at most once`, 'count=' + proof.backToTop);
    await ctx.close();
    await ctx2.close();
  }

  // ---- 2-6. checkout behaviour ----
  console.log('\n########## 2. CHECKOUT REDESIGN ##########');
  for (const [vpName, vp] of Object.entries({ mobile375: { width: 375, height: 812 }, desktop1440: { width: 1440, height: 900 } })) {
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    await seedAndGo(page, '/checkout');
    const url = new URL(page.url());
    ok(url.pathname === '/checkout', `${vpName}: lands on checkout (cart seeded)`, url.pathname);

    // stepper
    const steps = await page.evaluate(() => ({
      count: document.querySelectorAll('.co-steps .co-step').length,
      done: document.querySelectorAll('.co-step.done .co-label').length ? document.querySelector('.co-step.done .co-label').textContent : '',
      active: document.querySelector('.co-step.active .co-label')?.textContent || '',
    }));
    ok(steps.count === 4 && steps.done === 'Cart' && steps.active === 'Shipping', `${vpName}: stepper 4 steps, Cart done, Shipping active`, JSON.stringify(steps));

    // required legend + asterisks
    const req = await page.evaluate(() => ({
      legend: !!Array.from(document.querySelectorAll('p')).find((p) => /Required fields/.test(p.textContent)),
      stars: document.querySelectorAll('.required-star').length,
      phonePlaceholder: document.querySelector('#phone')?.getAttribute('placeholder') || '',
      hasId: ['fullName', 'email', 'phone', 'line1', 'city', 'postalCode', 'cardNumber', 'cardExpiry', 'cardCvc'].every((x) => document.getElementById(x)),
    }));
    ok(req.legend, `${vpName}: "* Required" legend shown`, '');
    ok(req.stars >= 7, `${vpName}: required asterisks on required fields`, 'stars=' + req.stars);
    ok(req.phonePlaceholder === '+20 1XX XXX XXXX', `${vpName}: phone format placeholder`, req.phonePlaceholder);
    ok(req.hasId, `${vpName}: all inputs have ids`, '');

    // card number placeholder-only proof
    const card = await page.evaluate(() => {
      const el = document.querySelector('#cardNumber');
      return { placeholder: el.getAttribute('placeholder'), value: el.value, defaultValue: el.defaultValue };
    });
    console.log(`  DOM[${vpName}#cardNumber] ${JSON.stringify(card)}`);
    ok(card.placeholder === '4242 4242 4242 4242' && card.value === '' && card.defaultValue === '', `${vpName}: card number is PLACEHOLDER-only (not a real value)`, 'value="' + card.value + '"');

    // trust signals
    const trust = await page.evaluate(() => {
      const secure = document.querySelector('.co-secure-line');
      return {
        lock: secure ? !!secure.querySelector('svg') : false,
        text: secure ? secure.textContent.trim() : '',
        brands: Array.from(document.querySelectorAll('.pay-brand')).map((b) => b.textContent.trim()),
      };
    });
    ok(trust.lock && /encrypted and secure/.test(trust.text), `${vpName}: lock icon + reassurance line`, trust.text);
    ok(trust.brands.includes('VISA') && trust.brands.includes('Mastercard'), `${vpName}: payment network chips`, trust.brands.join(','));

    // disabled until valid
    const disabledBefore = await page.evaluate(() => document.querySelector('.co-place-btn')?.disabled === true);
    ok(disabledBefore, `${vpName}: Place Order disabled when form incomplete`, '');

    // inline validation: invalid email
    await page.fill('#email', 'not-an-email');
    await page.evaluate(() => document.querySelector('#fullName').focus());
    await page.waitForTimeout(150);
    const emailErr = await page.evaluate(() => {
      const f = document.querySelector('#email').closest('.field');
      return { err: f ? f.querySelector('.field-error')?.textContent || '' : '', bad: document.querySelector('#email')?.classList.contains('input-invalid') || false };
    });
    ok(/valid email/.test(emailErr.err) && emailErr.bad, `${vpName}: inline error for invalid email`, emailErr.err);

    // inline validation: valid email -> green check
    await page.fill('#email', 'ada@sacre.example');
    await page.waitForTimeout(150);
    const emailOk = await page.evaluate(() => {
      const f = document.querySelector('#email').closest('.field');
      return (f ? f.querySelector('.field-hint')?.textContent || '' : '').includes('Looks good') && document.querySelector('#email')?.classList.contains('input-valid');
    });
    ok(emailOk, `${vpName}: green check when email valid`, '');

    // card masking
    await page.fill('#cardNumber', '4242424242424242');
    await page.fill('#cardExpiry', '1234');
    await page.fill('#cardCvc', '12a3');
    await page.waitForTimeout(200);
    const masked = await page.evaluate(() => ({
      card: document.querySelector('#cardNumber').value,
      exp: document.querySelector('#cardExpiry').value,
      cvc: document.querySelector('#cardCvc').value,
    }));
    console.log(`  DOM[${vpName} masked] ${JSON.stringify(masked)}`);
    ok(masked.card === '4242 4242 4242 4242' && masked.exp === '12/34' && masked.cvc === '123', `${vpName}: input masks (card groups, MM/YY, numeric CVC)`, JSON.stringify(masked));

    // still disabled (other fields empty), then complete the form -> enabled
    await page.fill('#fullName', 'Ada Lovelace');
    await page.fill('#phone', '+20 100 000 0000');
    await page.fill('#line1', '12 Rabbit Court');
    await page.fill('#city', 'Cairo');
    await page.fill('#postalCode', '11511');
    await page.fill('#cardExpiry', '1230');
    await page.fill('#cardCvc', '123');
    await page.waitForTimeout(300);
    const enabled = await page.evaluate(() => document.querySelector('.co-place-btn')?.disabled !== true);
    ok(enabled, `${vpName}: Place Order re-enabled once form valid`, '');

    await page.screenshot({ path: `${FIXTURE}/${vpName}-checkout.png`, fullPage: true });
    await ctx.close();
  }

  // ---- 6. processing / navigate to confirmation ----
  console.log('\n########## 6. LOADING STATE + CONFIRMATION ##########');
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await seedAndGo(page, '/checkout');
    await page.fill('#fullName', 'Ada Lovelace');
    await page.fill('#email', 'ada@sacre.example');
    await page.fill('#phone', '+20 100 000 0000');
    await page.fill('#line1', '12 Rabbit Court');
    await page.fill('#city', 'Cairo');
    await page.fill('#postalCode', '11511');
    await page.fill('#cardNumber', '4242424242424242');
    await page.fill('#cardExpiry', '1230');
    await page.fill('#cardCvc', '123');
    await page.waitForTimeout(250);
    const en = await page.evaluate(() => document.querySelector('.co-place-btn')?.disabled !== true);
    ok(en, 'processing-flow: Place Order enabled', '');

    await page.click('.co-place-btn');
    await page.waitForTimeout(400);
    const spinner = await page.evaluate(() => {
      const btn = document.querySelector('.co-place-btn');
      return { text: btn ? btn.textContent.trim() : '', hasSpinner: !!document.querySelector('.co-spinner'), disabled: btn ? btn.disabled : null };
    });
    console.log(`  DOM[processing] ${JSON.stringify(spinner)}`);
    ok(spinner.hasSpinner && /Processing/.test(spinner.text) && spinner.disabled === true, 'processing-flow: spinner + "Processing..." + disabled', spinner.text);

    await page.waitForURL('**/order-success', { timeout: 15000 });
    ok(page.url().includes('/order-success'), 'processing-flow: navigates to order confirmation page', page.url().split('/')[3] || page.url());
    const confirmH1 = await page.waitForSelector('h1', { timeout: 10000 }).then(
      () => page.evaluate(() => !!Array.from(document.querySelectorAll('h1')).find((h) => /Thank you/.test(h.textContent))),
      () => false
    );
    ok(confirmH1, 'processing-flow: order confirmation page rendered', '');

    const cartEmpty = await page.evaluate(() => {
      const c = localStorage.getItem('sucre_cart');
      return c ? JSON.parse(c).length === 0 : true;
    });
    ok(cartEmpty, 'processing-flow: cart cleared after order', '');
    await ctx.close();
  }

  // ---- 6b. COD path: card fields not required ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await seedAndGo(page, '/checkout');
    await page.evaluate(() => {
      const radios = Array.from(document.querySelectorAll('input[name="payment"]'));
      if (radios[1]) radios[1].click();
    });
    await page.fill('#fullName', 'Ada Lovelace');
    await page.fill('#email', 'ada@sacre.example');
    await page.fill('#phone', '+20 100 000 0000');
    await page.fill('#line1', '12 Rabbit Court');
    await page.fill('#city', 'Cairo');
    await page.fill('#postalCode', '11511');
    await page.waitForTimeout(250);
    const codEnabled = await page.evaluate(() => document.querySelector('.co-place-btn')?.disabled !== true);
    ok(codEnabled, 'COD: Place Order enabled without card fields', '');
    await ctx.close();
  }

  await browser.close();
  console.log(`\n${fail === 0 ? 'OUTCOME: ALL PASS' : 'OUTCOME: ' + fail + ' FAILURES'} (${pass} passed, ${fail} failed)`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });