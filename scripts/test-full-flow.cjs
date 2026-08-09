const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== Testing Full Signup → Login Flow ===');
    
    // Step 1: Sign up
    console.log('\n1. Signing up...');
    await page.goto('https://policy-0.vercel.app/signup', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    const testEmail = `clerk-test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    await page.waitForSelector('input[name="identifier"]', { timeout: 10000 });
    await page.fill('input[name="identifier"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button:has-text("Continue")');
    
    console.log('Signup submitted');
    await page.waitForTimeout(10000);
    
    const signupUrl = page.url();
    const signupContent = await page.content();
    console.log('After signup URL:', signupUrl);
    
    // Check if verification is needed
    if (signupContent.includes('verify') || signupContent.includes('verification')) {
      console.log('⚠️ Email verification required');
    }
    
    // Step 2: Try to login
    console.log('\n2. Logging in...');
    await page.goto('https://policy-0.vercel.app/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    await page.waitForSelector('input[name="identifier"]', { timeout: 10000 });
    await page.fill('input[name="identifier"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button:has-text("Continue")');
    
    await page.waitForTimeout(10000);
    
    const loginUrl = page.url();
    const loginContent = await page.content();
    console.log('After login URL:', loginUrl);
    
    if (loginContent.includes('Dashboard') || loginUrl === 'https://policy-0.vercel.app/') {
      console.log('\n✅ Full flow works!');
    } else if (loginContent.includes('verify')) {
      console.log('\n⚠️ Email verification required before login');
    } else {
      console.log('\n❌ Login failed after signup');
    }
    
    await page.screenshot({ path: 'full-flow.png', fullPage: true });
    console.log('Screenshot saved: full-flow.png');
    
  } catch (err) {
    console.error('Test failed:', err.message);
    await page.screenshot({ path: 'full-flow-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
