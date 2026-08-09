const { chromium } = require('playwright');

async function testApp() {
  console.log('=== Testing Policy-0 Application ===\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors = [];
  const screenshots = [];
  
  // Collect console errors
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  
  try {
    // Test 1: Frontend Home Page
    console.log('Test 1: Loading frontend...');
    await page.goto('https://policy-0.vercel.app', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    const homeTitle = await page.title();
    console.log(`  Page title: ${homeTitle}`);
    
    await page.screenshot({ path: 'screenshots/01-home-page.png', fullPage: true });
    screenshots.push('01-home-page.png');
    console.log('  Screenshot: 01-home-page.png\n');
    
    // Test 2: Login Page
    console.log('Test 2: Navigating to login page...');
    await page.goto('https://policy-0.vercel.app/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const loginTitle = await page.title();
    console.log(`  Login page title: ${loginTitle}`);
    
    // Check for Clerk components
    const hasClerkForm = await page.$('form') !== null || await page.$('.clerk') !== null;
    console.log(`  Has Clerk form: ${hasClerkForm}`);
    
    await page.screenshot({ path: 'screenshots/02-login-page.png', fullPage: true });
    screenshots.push('02-login-page.png');
    console.log('  Screenshot: 02-login-page.png\n');
    
    // Test 3: Signup Page
    console.log('Test 3: Navigating to signup page...');
    await page.goto('https://policy-0.vercel.app/signup', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const signupTitle = await page.title();
    console.log(`  Signup page title: ${signupTitle}`);
    
    await page.screenshot({ path: 'screenshots/03-signup-page.png', fullPage: true });
    screenshots.push('03-signup-page.png');
    console.log('  Screenshot: 03-signup-page.png\n');
    
    // Test 4: Backend Health Check
    console.log('Test 4: Checking backend health...');
    const backendResponse = await page.request.get('https://delightful-cooperation-production-a998.up.railway.app/api/health');
    const backendData = await backendResponse.json();
    console.log(`  Backend status: ${backendData.status}`);
    console.log(`  Pipeline version: ${backendData.pipelineVersion}`);
    
    await page.screenshot({ path: 'screenshots/04-backend-health.png', fullPage: true });
    screenshots.push('04-backend-health.png');
    
    // Test 5: API Key Check
    console.log('  Backend checks:', JSON.stringify(backendData.checks, null, 2));
    console.log();
    
    // Test 6: Generate Page (protected route - should redirect to login)
    console.log('Test 6: Checking protected route (generate)...');
    await page.goto('https://policy-0.vercel.app/generate', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log(`  Current URL: ${currentUrl}`);
    console.log(`  On login page: ${currentUrl.includes('login')}`);
    
    await page.screenshot({ path: 'screenshots/05-protected-route.png', fullPage: true });
    screenshots.push('05-protected-route.png');
    console.log('  Screenshot: 05-protected-route.png\n');
    
    console.log('=== Test Summary ===');
    console.log('Screenshots taken:', screenshots.length);
    console.log('Console errors:', errors.length);
    if (errors.length > 0) {
      console.log('Errors:');
      errors.forEach(e => console.log('  -', e));
    }
    
  } catch (err) {
    console.error('Test failed:', err.message);
    console.error(err.stack);
  } finally {
    await browser.close();
  }
}

testApp().catch(console.error);