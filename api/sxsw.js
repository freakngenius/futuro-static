/**
 * GET /sxsw — Smart contact-share endpoint for Jeremy's SXSW QR code.
 *
 * Routing logic:
 *   - iOS Safari (camera scan) → serve vCard directly with Content-Disposition: inline
 *     so iOS shows the native "Add to Contacts" sheet without leaving the browser.
 *   - Everything else → serve a minimal HTML page with a prominent "Save to Contacts"
 *     button that links to the raw vCard. This is more reliable than vCard sniffing on
 *     Android, where Chrome may silently drop the file into Downloads.
 *
 * Why Content-Disposition: inline (not attachment)?
 *   "attachment" forces a file download. "inline" tells the OS to open the content with
 *   a registered handler — on iOS that's the Contacts app. The result is the native
 *   "Would you like to add this contact?" prompt appearing directly in Safari.
 *
 * Splitting /sxsw vs /sxsw/contact.vcf later:
 *   If you want a clean separation, add a second Vercel function at api/contact.js and
 *   rewrite /sxsw/contact.vcf → /api/contact. That function just returns VCARD_DATA
 *   with the same headers. The HTML fallback below already links to /sxsw/jeremy.vcf
 *   (the static file) so you can also skip the second function entirely.
 */

// ---------------------------------------------------------------------------
// Contact data
// Keep it small — no base64 photo. Phones add the photo from the HTML fallback
// if the user saves from there, but inline vCard photos add 30 KB+ and slow
// iOS sheet rendering.
// ---------------------------------------------------------------------------
const VCARD_DATA = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  'N:Boxer;Jeremy;;;',
  'FN:Jeremy Boxer',
  'ORG:Futuro',
  'TEL;TYPE=CELL:+13107474475',
  'EMAIL;TYPE=INTERNET:Jeremy@futuro.so',
  'URL:https://www.futuro.so/sxsw',
  'END:VCARD',
].join('\r\n');

// ---------------------------------------------------------------------------
// Scan logging stub
// Replace this with your analytics/DB call when ready.
// ---------------------------------------------------------------------------
function logScan(req, responseType) {
  // TODO: persist to analytics or Google Sheets
  // {
  //   timestamp:    new Date().toISOString(),
  //   ip:           req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
  //   userAgent:    req.headers['user-agent'],
  //   responseType, // 'vcard' | 'html'
  // }
}

// ---------------------------------------------------------------------------
// UA detection — serve vCard directly only where it opens Contacts natively.
// iOS Safari is the reliable case. We send HTML to Android/desktop because
// Chrome on Android downloads .vcf silently; the HTML button is less friction.
// ---------------------------------------------------------------------------
function shouldServeVCard(req) {
  const accept = (req.headers['accept'] || '').toLowerCase();
  const ua     = (req.headers['user-agent'] || '');

  // Explicit vCard MIME type negotiation
  if (accept.includes('text/vcard') || accept.includes('application/vcard+json')) {
    return true;
  }

  // iOS Safari: Camera app opens scanned URLs in Safari (not WKWebView / Chrome)
  const isIOS    = /iPhone|iPad|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  if (isIOS && isSafari) return true;

  return false;
}

// ---------------------------------------------------------------------------
// HTML fallback — minimal, mobile-first contact card
// ---------------------------------------------------------------------------
function htmlFallback() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>Jeremy Boxer — Futuro</title>
  <meta name="description" content="Save Jeremy Boxer's contact info from Futuro.">
  <meta property="og:title" content="Jeremy Boxer — Futuro">
  <meta property="og:description" content="Save Jeremy Boxer's contact — Founder at Futuro.">
  <meta property="og:image" content="https://www.futuro.so/sxsw/assets/jeremy.jpeg">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif;
      background: #0a0a0f;
      color: #fff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px 24px;
    }
    .card {
      text-align: center;
      max-width: 340px;
      width: 100%;
    }
    .avatar {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      object-fit: cover;
      margin-bottom: 20px;
      border: 2px solid rgba(255, 255, 255, 0.12);
    }
    .name  { font-size: 1.75rem; font-weight: 700; margin-bottom: 4px; }
    .title { font-size: 1rem; color: rgba(255,255,255,0.5); margin-bottom: 36px; }
    .save-btn {
      display: block;
      width: 100%;
      padding: 18px;
      background: #7054ea;
      color: #fff;
      font-size: 1.1rem;
      font-weight: 600;
      border-radius: 14px;
      text-decoration: none;
      -webkit-tap-highlight-color: transparent;
    }
    .save-btn:active { background: #5a3fd6; }
    .meta {
      margin-top: 24px;
      font-size: 0.8rem;
      color: rgba(255,255,255,0.3);
      line-height: 1.8;
    }
  </style>
</head>
<body>
  <div class="card">
    <img class="avatar" src="/sxsw/assets/jeremy.jpeg" alt="Jeremy Boxer">
    <p class="name">Jeremy Boxer</p>
    <p class="title">Founder &middot; Futuro</p>
    <a class="save-btn" href="/sxsw/jeremy.vcf" download="jeremy-boxer.vcf">
      Save to Contacts
    </a>
    <p class="meta">
      +1 (310) 747-4475<br>
      Jeremy@futuro.so
    </p>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
module.exports = (req, res) => {
  const serveVCard = shouldServeVCard(req);
  logScan(req, serveVCard ? 'vcard' : 'html');

  if (serveVCard) {
    // inline tells iOS to open Contacts instead of downloading the file
    res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="jeremy-boxer.vcf"');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(VCARD_DATA);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(htmlFallback());
};
