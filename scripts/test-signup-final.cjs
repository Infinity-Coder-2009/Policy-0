const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== Testing Signup Flow ===');
    
    await page.goto('https://policy-0.vercel.app/signup', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    // Fill email
    await page.waitForSelector('input[name="emailAddress"]', { timeout: 10000 });
    await page.fill('input[name="emailAddress"]', 'playwright-final@example.com');
    console.log('Email filled');
    
    // Fill password
    await page.waitForSelector('input[name="password"]', { timeout: 10000 });
    await page.fill('input[name="password"]', 'TestPassword123!');
    console.log('Password filled');
    
    // Press Enter to submit
    await page.keyboard.press('Enter');
    console.log('Enter pressed');
    
    // Wait for response
    await page.waitForTimeout(10000);
    
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);
    
    const content = await page.content();
    console.log('Has Dashboard:', content.includes('Dashboard'));
    console.log('Has Welcome:', content.includes('Welcome'));
    
    await page.screenshot({ path: 'final-result.png', fullPage: true });
    console.log('Screenshot saved: final-result.png');
    
  } catch (err) {
    console.error('Test failed:', err.message);
    await page.screenshot({ path: 'error-result.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
