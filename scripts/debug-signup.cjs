const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== Debugging Signup Form ===');
    
    await page.goto('https://policy-0.vercel.app/signup', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(8000);
    
    // Get all input fields
    const inputs = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      return Array.from(inputs).map(input => ({
        name: input.name,
        type: input.type,
        placeholder: input.placeholder
      }));
    });
    
    console.log('Input fields:');
    inputs.forEach((input, i) => {
      console.log(`  ${i+1}. name="${input.name}" type="${input.type}" placeholder="${input.placeholder}"`);
    });
    
    // Try to fill using type=email
    try {
      await page.waitForSelector('input[type=email]', { timeout: 5000 });
      await page.fill('input[type=email]', `clerk-${Date.now()}@example.com`);
      console.log('Email filled via type=email');
    } catch {
      console.log('No email field found');
    }
    
    await page.screenshot({ path: 'signup-debug.png', fullPage: true });
    
  } catch (err) {
    console.error('Test failed:', err.message);
  } finally {
    await browser.close();
  }
})();
