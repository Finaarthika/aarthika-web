import fetch from 'node-fetch';

(async () => {
  try {
    const r = await fetch('https://www.aarthikafinance.com/passbook');
    const html = await r.text();
    const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
    if(match) {
      console.log('Found JS:', match[1]);
      const r2 = await fetch('https://www.aarthikafinance.com' + match[1]);
      console.log('JS Status:', r2.status);
    } else {
      console.log('No JS found. HTML preview:', html.substring(0, 300));
    }
  } catch (e) {
    console.error(e);
  }
})();
