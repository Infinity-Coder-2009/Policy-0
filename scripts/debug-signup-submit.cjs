const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));

  try {
    console.log('=== Debugging Signup Submission ===');
    
    await page.goto('https://policy-0.vercel.app/signup', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    // Fill form
    await page.fill('input[name="emailAddress"]', `debug-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'TestPassword123!');
    
    // Try clicking the Continue button
    const buttons = await page.$$('button');
    console.log('Found', buttons.length, 'buttons');
    
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      const visible = await buttons[i].isVisible();
      console.log(`Button ${i+1}: "${text.trim()}" visible=${visible}`);
    }
    
    // Click the visible Continue button
    await page.click('button:has-text("Continue")', { force: true });
    console.log('Clicked Continue');
    
    await page.waitForTimeout(10000);
    
    const url = page.url();
    console.log('Final URL:', url);
    
    console.log('\n=== Console Errors ===');
    if (errors.length > 0) {
      errors.forEach(e => console.log('ERROR:', e));
    } else {
      console.log('No errors');
    }
    
    await page.screenshot({ path: 'debug-signup.png', fullPage: true });
    
  } catch (err) {
    console.error('Test failed:', err.message);
  } finally {
    await browser.close();
  }
})();
