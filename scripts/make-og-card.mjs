// scripts/make-og-card.mjs  — run once: node scripts/make-og-card.mjs ; commit assets/og-card.png
// Renders a 1200x630 dark-theme social card with the already-installed Playwright chromium.
// The committed assets/og-card.png is the deliverable; this script reproduces it.
import { chromium } from "playwright";

const html = `<!doctype html><html><head><meta charset="utf-8"></head>
<body style="margin:0">
  <div style="position:relative;width:1200px;height:630px;background:#0a0a0a;color:#fff;
    font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
    display:flex;flex-direction:column;justify-content:center;padding:72px;box-sizing:border-box;overflow:hidden">

    <!-- supply-chain network motif (decorative, top-right) -->
    <svg width="520" height="520" viewBox="0 0 520 520"
      style="position:absolute;top:-40px;right:-40px;opacity:0.28">
      <g stroke="#3b82f6" stroke-width="2" fill="none">
        <line x1="260" y1="260" x2="120" y2="120"/>
        <line x1="260" y1="260" x2="400" y2="110"/>
        <line x1="260" y1="260" x2="430" y2="300"/>
        <line x1="260" y1="260" x2="120" y2="380"/>
        <line x1="260" y1="260" x2="280" y2="450"/>
        <line x1="120" y1="120" x2="60" y2="260"/>
        <line x1="400" y1="110" x2="430" y2="300"/>
        <line x1="120" y1="380" x2="280" y2="450"/>
      </g>
      <g fill="#60a5fa">
        <circle cx="260" cy="260" r="14"/>
        <circle cx="120" cy="120" r="9"/>
        <circle cx="400" cy="110" r="9"/>
        <circle cx="430" cy="300" r="9"/>
        <circle cx="120" cy="380" r="9"/>
        <circle cx="280" cy="450" r="9"/>
        <circle cx="60" cy="260" r="7"/>
      </g>
    </svg>

    <div style="font-size:18px;letter-spacing:3px;color:#888;text-transform:uppercase;position:relative">Monarch Castle Technologies</div>
    <div style="font-size:64px;font-weight:700;margin-top:16px;position:relative">Market Intelligence</div>
    <div style="font-size:26px;color:#a8a8a8;margin-top:22px;max-width:760px;line-height:1.4;position:relative">Supply chains of the top 100 public companies by market cap — with source-linked provenance and confidence levels.</div>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.screenshot({ path: "assets/og-card.png" });
await browser.close();
console.log("wrote assets/og-card.png");
