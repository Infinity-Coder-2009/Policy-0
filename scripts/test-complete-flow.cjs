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
    
    const testEmail = `clerk-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    await page.waitForSelector('input[name="emailAddress"]', { timeout: 10000 });
    await page.fill('input[name="emailAddress"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    
    // Fill optional names
    try { await page.fill('input[name="firstName"]', 'Test'); } catch {}
    try { await page.fill('input[name="lastName"]', 'User'); } catch {}
    
    await page.click('button:has-text("Continue")');
    console.log('Signup submitted');
    
    await page.waitForTimeout(15000);
    
    const signupUrl = page.url();
    const signupContent = await page.content();
    console.log('After signup URL:', signupUrl);
    
    // Check for verification
    if (signupContent.includes('verify') || signupContent.includes('verification')) {
      console.log('⚠️ Email verification required');
    }
    
    // Step 2: Login
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
      console.log('\n⚠️ Email verification required');
    } else {
      console.log('\n❌ Login failed');
      console.log('Content includes Welcome:', loginContent.includes('Welcome'));
    }
    
    await page.screenshot({ path: 'full-flow-result.png', fullPage: true });
    
  } catch (err) {
    console.error('Test failed:', err.message);
  } finally {
    await browser.close();
  }
})();
