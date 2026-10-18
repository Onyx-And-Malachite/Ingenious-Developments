import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
);
await page.setViewport({ width: 1440, height: 900 });

console.log('Loading Zillow listing...');
await page.goto(
  'https://www.zillow.com/homedetails/157-E-Wilson-St-Clayton-NC-27520/337082442_zpid/',
  { waitUntil: 'networkidle2', timeout: 45000 }
);

// Wait a moment for lazy images
await new Promise(r => setTimeout(r, 3000));

// Scroll to trigger lazy loading
await page.evaluate(() => window.scrollTo(0, 800));
await new Promise(r => setTimeout(r, 1500));
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 1000));

const images = await page.evaluate(() => {
  const found = new Set();
  document.querySelectorAll('img').forEach(img => {
    if (img.src && img.src.startsWith('http')) found.add(img.src);
    if (img.dataset && img.dataset.src) found.add(img.dataset.src);
  });
  document.querySelectorAll('source').forEach(src => {
    if (src.srcset) src.srcset.split(',').forEach(s => {
      const url = s.trim().split(' ')[0];
      if (url.startsWith('http')) found.add(url);
    });
  });
  return [...found];
});

const propertyImgs = images.filter(url =>
  url.includes('zillowstatic') ||
  url.includes('photos') ||
  url.includes('p_e') ||
  url.includes('_UHD') ||
  url.includes('_FMK') ||
  url.includes('cc_ft') ||
  url.includes('uncropped')
);

console.log('\n=== ALL PROPERTY IMAGES ===');
propertyImgs.forEach(u => console.log(u));
console.log('\n=== ALL IMAGES (first 30) ===');
images.slice(0, 30).forEach(u => console.log(u));

await page.screenshot({ path: 'temporary screenshots/zillow-page.png', fullPage: false });
console.log('\nScreenshot saved.');

await browser.close();
