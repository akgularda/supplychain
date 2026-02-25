const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8889;
const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

server.listen(PORT, async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  // Check subtitle
  const subtitle = await page.textContent('#subtitle');
  console.log('Subtitle:', subtitle.substring(0, 50) + '...');
  
  const subtitleVisible = await page.isVisible('#subtitle');
  console.log('Subtitle visible:', subtitleVisible);
  
  // Screenshot of top area
  await page.screenshot({ 
    path: 'subtitle-check.png',
    clip: { x: 0, y: 0, width: 1920, height: 100 }
  });
  
  await browser.close();
  server.close();
  console.log('Screenshot saved: subtitle-check.png');
});
