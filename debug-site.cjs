const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  console.log('Navigating to https://aarthikafinance.com/passbook ...');
  await page.goto('https://aarthikafinance.com/passbook', { waitUntil: 'networkidle0' });
  
  console.log('Page loaded. Evaluating body...');
  const html = await page.evaluate(() => document.body.innerHTML.substring(0, 500));
  console.log('Body HTML preview:', html);
  
  await browser.close();
})();
