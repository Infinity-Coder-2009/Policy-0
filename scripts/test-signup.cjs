const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== Testing Full Registration Flow ===');
    
    await page.goto('https://policy-0.vercel.app/signup', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    // Take screenshot of signup page
    await page.screenshot({ path: 'signup-page.png', fullPage: true });
    console.log('Signup page screenshot saved');
    
    // Try to find and fill email
    try {
      await page.waitForSelector('input[type=email]', { timeout: 5000 });
      await page.fill('input[type=email]', 'playwright-test@example.com');
      console.log('Email filled');
    } catch (e) {
      console.log('Email field not found, trying name=');
      await page.waitForSelector('input[name="emailAddress"]', { timeout: 5000 });
      await page.fill('input[name="emailAddress"]', 'playwright-test@example.com');
      console.log('Email filled via name');
    }
    
    // Try to find and fill password
    try {
      await page.waitForSelector('input[type=password]', { timeout: 5000 });
      await page.fill('input[type=password]', 'TestPassword123!');
      console.log('Password filled');
    } catch (e) {
      console.log('Password field not found');
    }
    
    // Click submit
    await page.click('button[type=submit]');
    console.log('Submit clicked');
    
    // Wait for response
    await page.waitForTimeout(8000);
    
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);
    
    await page.screenshot({ path: 'after-signup.png', fullPage: true });
    console.log('Final screenshot saved');
    
  } catch (err) {
    console.error('Test failed:', err.message);
    await page.screenshot({ path: 'error-page.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
