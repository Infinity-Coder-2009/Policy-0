const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== Debugging Clerk Form ===');
    
    await page.goto('https://policy-0.vercel.app/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(8000);
    
    // Get all input fields
    const inputs = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      return Array.from(inputs).map(input => ({
        name: input.name,
        type: input.type,
        placeholder: input.placeholder,
        id: input.id,
        className: input.className.substring(0, 50)
      }));
    });
    
    console.log('\nInput fields found:');
    inputs.forEach((input, i) => {
      console.log(`  ${i+1}. name="${input.name}" type="${input.type}" placeholder="${input.placeholder}"`);
    });
    
    // Get all buttons
    const buttons = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      return Array.from(buttons).map(btn => ({
        text: btn.textContent.trim().substring(0, 30),
        type: btn.type,
        className: btn.className.substring(0, 50)
      }));
    });
    
    console.log('\nButtons found:');
    buttons.forEach((btn, i) => {
      console.log(`  ${i+1}. text="${btn.text}" type="${btn.type}"`);
    });
    
    await page.screenshot({ path: 'debug-form.png', fullPage: true });
    console.log('\nScreenshot saved: debug-form.png');
    
  } catch (err) {
    console.error('Test failed:', err.message);
  } finally {
    await browser.close();
  }
})();
