import { chromium } from 'playwright';

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));

  console.log('Navigating to live site...');
  await page.goto('https://www.aarthikafinance.com/passbook', { waitUntil: 'networkidle' });
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Done!');
  await browser.close();
})();
