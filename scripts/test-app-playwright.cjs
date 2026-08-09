const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  try {
    console.log('=== Testing Login Page ===');
    await page.goto('https://policy-0.vercel.app/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    const loginUrl = page.url();
    const loginTitle = await page.title();
    const loginContent = await page.content();
    
    console.log('URL:', loginUrl);
    console.log('Title:', loginTitle);
    console.log('Has Clerk form:', loginContent.includes('clerk') || loginContent.includes('sign-in'));
    console.log('Has root div:', loginContent.includes('id="root"'));
    
    // Take screenshot
    await page.screenshot({ path: 'login-page.png', fullPage: true });
    console.log('Screenshot saved: login-page.png');
    
    console.log('\n=== Testing Signup Page ===');
    await page.goto('https://policy-0.vercel.app/signup', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    const signupUrl = page.url();
    const signupContent = await page.content();
    
    console.log('URL:', signupUrl);
    console.log('Has Clerk form:', signupContent.includes('clerk') || loginContent.includes('sign-up'));
    
    await page.screenshot({ path: 'signup-page.png', fullPage: true });
    console.log('Screenshot saved: signup-page.png');
    
    console.log('\n=== Console Errors ===');
    if (errors.length > 0) {
      errors.forEach(e => console.log('ERROR:', e));
    } else {
      console.log('No console errors');
    }
    
  } catch (err) {
    console.error('Test failed:', err.message);
  } finally {
    await browser.close();
  }
})();