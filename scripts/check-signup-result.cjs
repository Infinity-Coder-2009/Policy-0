const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== Checking Signup Result ===');
    
    await page.goto('https://policy-0.vercel.app/signup', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    await page.waitForSelector('input[name="emailAddress"]', { timeout: 10000 });
    await page.fill('input[name="emailAddress"]', `verify-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button:has-text("Continue")');
    
    await page.waitForTimeout(10000);
    
    const url = page.url();
    const content = await page.content();
    
    console.log('URL:', url);
    
    // Check for verification message
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('\nPage text:');
    console.log(pageText.substring(0, 500));
    
    await page.screenshot({ path: 'signup-result.png', fullPage: true });
    
  } catch (err) {
    console.error('Test failed:', err.message);
  } finally {
    await browser.close();
  }
})();
