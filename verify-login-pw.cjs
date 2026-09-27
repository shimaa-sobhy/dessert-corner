const { chromium } = require('playwright');

const BASE = 'http://localhost:5173';
const OLD = 'old-pass-1';
const NEW = 'brand-new-pass';

function log(msg) {
  console.log('  ' + msg);
}
let failed = 0;

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(([old]) => {
    localStorage.setItem('sucre_users', JSON.stringify([{ name: 'E2E Tester', email: 'e2e@test.com', password: old }]));
    localStorage.removeItem('sucre_session');
  }, [OLD]);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  // 1. login with OLD password -> success, redirect to /account
  await page.fill('input[type="email"]', 'e2e@test.com');
  await page.fill('input[type="password"]', OLD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/account', { timeout: 10000 });
  const sess1 = await page.evaluate(() => JSON.parse(localStorage.getItem('sucre_session') || 'null'));
  const ok1 = sess1 && sess1.email === 'e2e@test.com';
  log(`[PASS] login with old password works | ${ok1 ? 'session ok' : 'FAIL no session'}`);
  if (!ok1) failed++;

  // 2. update password on /account
  await page.waitForSelector('.pw-wrap input', { timeout: 10000 });
  await page.fill('.pw-wrap input', NEW);
  await page.fill('.pw-wrap input >> nth=1', NEW);
  await page.click('button:has-text("Update Password")');
  await page.waitForTimeout(600);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('sucre_users') || '[]')[0]);
  const ok2 = stored && stored.password === NEW;
  log(`[PASS] account page persists new password | stored=${stored ? stored.password : 'none'}`);
  if (!ok2) failed++;

  // 3. sign out via quick-action button
  await page.click('button:has-text("Sign Out")');
  await page.waitForTimeout(500);
  const sess3 = await page.evaluate(() => localStorage.getItem('sucre_session'));
  const ok3 = sess3 === null || sess3 === 'null';
  log(`[PASS] Sign Out clears session | ${ok3 ? 'session cleared' : 'FAIL'}`);
  if (!ok3) failed++;

  // 4. login with OLD password -> must FAIL (stays on /login)
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.fill('input[type="email"]', 'e2e@test.com');
  await page.fill('input[type="password"]', OLD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(800);
  const stillLogin = page.url().includes('/login');
  const toast = await page.evaluate(() => document.body.innerText.includes('Invalid email or password'));
  const ok4 = stillLogin && toast;
  log(`[PASS] old password rejected => stays on login + error toast | ${ok4 ? 'yes' : 'FAIL'}`);
  if (!ok4) failed++;

  // 5. login with NEW password -> success
  await page.fill('input[type="password"]', NEW);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/account', { timeout: 10000 });
  const sess5 = await page.evaluate(() => JSON.parse(localStorage.getItem('sucre_session') || 'null'));
  const ok5 = sess5 && sess5.email === 'e2e@test.com';
  log(`[PASS] login works with the updated password | ${ok5 ? 'session ok' : 'FAIL'}`);
  if (!ok5) failed++;

  await browser.close();
  console.log(failed === 0 ? '\n===== LOGIN-PASSWORD E2E: ALL PASS =====' : `\n===== FAILURES: ${failed} =====`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});