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
    await page.waitForSelector('input[name="emailAddress"]', { timeout: 10000 });
    await page.fill('input[name="emailAddress"]', 'newuser@example.com');
    console.log('Email filled');
    
    await page.waitForSelector('input[name="password"]', { timeout: 10000 });
    await page.fill('input[name="password"]', 'Password123!');
    console.log('Password filled');
    
    // Press Enter to submit
    await page.keyboard.press('Enter');
    console.log('Enter pressed');
    
    // Wait for response
    await page.waitForTimeout(10000);
    
    const finalUrl = page.url();
    const content = await page.content();
    
    console.log('Final URL:', finalUrl);
    
    // Check for error messages
    if (content.includes('error') || content.includes('invalid') || content.includes('Incorrect')) {
      console.log('\n❌ Login failed - invalid credentials');
    } else if (content.includes('Dashboard') || finalUrl.includes('/')) {
      console.log('\n✅ Login successful!');
    } else {
      console.log('\n⚠️ Unknown state - checking content...');
      console.log('Has Welcome:', content.includes('Welcome'));
      console.log('Has Dashboard:', content.includes('Dashboard'));
    }
    
    await page.screenshot({ path: 'login-existing.png', fullPage: true });
    console.log('Screenshot saved: login-existing.png');
    
  } catch (err) {
    console.error('Test failed:', err.message);
    await page.screenshot({ path: 'login-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
