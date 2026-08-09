const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== Testing Login with Existing Account ===');
    
    await page.goto('https://policy-0.vercel.app/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    // Fill login form
    await page.waitForSelector('input[name="identifier"]', { timeout: 10000 });
    await page.fill('input[name="identifier"]', 'newuser@example.com');
    console.log('Email filled');
    
    await page.waitForSelector('input[name="password"]', { timeout: 10000 });
    await page.fill('input[name="password"]', 'Password123!');
    console.log('Password filled');
    
    // Click Continue button
    await page.click('button:has-text("Continue")');
    console.log('Continue clicked');
    
    // Wait for response
    await page.waitForTimeout(10000);
    
    const finalUrl = page.url();
    const content = await page.content();
    
    console.log('Final URL:', finalUrl);
    
    // Check for error messages
    if (content.includes('error') || content.includes('invalid') || content.includes('Incorrect')) {
      console.log('\n❌ Login failed - invalid credentials');
    } else if (content.includes('Dashboard') || finalUrl === 'https://policy-0.vercel.app/') {
      console.log('\n✅ Login successful!');
    } else {
      console.log('\n⚠️ Unknown state');
      console.log('Has Welcome:', content.includes('Welcome'));
      console.log('Has Dashboard:', content.includes('Dashboard'));
      console.log('URL:', finalUrl);
    }
    
    await page.screenshot({ path: 'login-result.png', fullPage: true });
    console.log('Screenshot saved: login-result.png');
    
  } catch (err) {
    console.error('Test failed:', err.message);
    await page.screenshot({ path: 'login-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
