const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== Checking Signup Result ===');
    
    await page.goto('https://policy-0.vercel.app/signup', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    // Fill and submit
    await page.waitForSelector('input[name="emailAddress"]', { timeout: 10000 });
    await page.fill('input[name="emailAddress"]', 'test-verification@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.keyboard.press('Enter');
    
    // Wait longer
    await page.waitForTimeout(15000);
    
    const finalUrl = page.url();
    const content = await page.content();
    
    console.log('Final URL:', finalUrl);
    console.log('Page text:', content.substring(0, 1000));
    
    // Check for verification message
    if (content.includes('verify') || content.includes('verification') || content.includes('email')) {
      console.log('\n⚠️ Email verification required');
    }
    
    await page.screenshot({ path: 'verification-check.png', fullPage: true });
    
  } catch (err) {
    console.error('Test failed:', err.message);
  } finally {
    await browser.close();
  }
})();
