/**
 * Vercel Edge Middleware
 *
 * Flow: /sxsw/qr → /sxsw/jeremy → /sxsw
 *   /sxsw/qr     — Jeremy shows QR code on his phone
 *   /sxsw/jeremy — attendee scans QR, saves Jeremy's contact, taps through to form
 *   /sxsw/       — survey/capture form (static, untouched)
 *
 * Why middleware?
 * Vercel rewrites run AFTER static file matching and can't override physical files.
 * Middleware runs before everything, so it can serve /sxsw/jeremy (no static file
 * conflict) cleanly.
 *
 * Why Content-Disposition: inline?
 * "attachment" forces a file download. "inline" tells iOS to open the vCard with
 * its registered handler (Contacts), surfacing the native "Add Contact" sheet.
 */

const VCARD = [
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
// ---------------------------------------------------------------------------
function logScan(request, responseType) {
  // TODO: persist scan data
  // {
  //   timestamp:    new Date().toISOString(),
  //   ip:           request.headers.get('x-forwarded-for'),
  //   userAgent:    request.headers.get('user-agent'),
  //   responseType, // 'vcard' | 'html'
  // }
}

// ---------------------------------------------------------------------------
// iOS Safari → serve vCard inline so Contacts sheet opens immediately.
// Everyone else → HTML card with JS-triggered download + CTA to the form.
// ---------------------------------------------------------------------------
function shouldServeVCard(request) {
  const accept = (request.headers.get('accept') || '').toLowerCase();
  const ua     =  request.headers.get('user-agent') || '';

  if (accept.includes('text/vcard') || accept.includes('application/vcard+json')) return true;

  const isIOS    = /iPhone|iPad|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
}

// ---------------------------------------------------------------------------
// HTML contact card — auto-triggers vCard download, then CTA to the form
// ---------------------------------------------------------------------------
function htmlCard() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>Jeremy Boxer — Futuro</title>
  <meta name="description" content="Save Jeremy Boxer's contact and drop your info.">
  <meta property="og:title" content="Jeremy Boxer — Futuro">
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
    .card { text-align: center; max-width: 340px; width: 100%; }
    .avatar {
      width: 96px; height: 96px;
      border-radius: 50%;
      object-fit: cover;
      margin-bottom: 20px;
      border: 2px solid rgba(255,255,255,0.12);
    }
    .name  { font-size: 1.75rem; font-weight: 700; margin-bottom: 4px; }
    .title { font-size: 1rem; color: rgba(255,255,255,0.5); margin-bottom: 32px; }
    .save-btn {
      display: block; width: 100%;
      padding: 18px;
      background: #7054ea; color: #fff;
      font-size: 1.1rem; font-weight: 600;
      border-radius: 14px; text-decoration: none;
      -webkit-tap-highlight-color: transparent;
      margin-bottom: 12px;
    }
    .save-btn:active { background: #5a3fd6; }
    .form-btn {
      display: block; width: 100%;
      padding: 16px;
      background: transparent; color: rgba(255,255,255,0.7);
      font-size: 1rem; font-weight: 500;
      border-radius: 14px; text-decoration: none;
      border: 1px solid rgba(255,255,255,0.15);
      -webkit-tap-highlight-color: transparent;
    }
    .form-btn:active { background: rgba(255,255,255,0.05); }
    .meta {
      margin-top: 24px;
      font-size: 0.8rem; color: rgba(255,255,255,0.3);
      line-height: 1.8;
    }
  </style>
</head>
<body>
  <div class="card">
    <img class="avatar" src="/sxsw/assets/jeremy.jpeg" alt="Jeremy Boxer">
    <p class="name">Jeremy Boxer</p>
    <p class="title">Futuro</p>
    <a class="save-btn" href="/sxsw/jeremy.vcf" download="jeremy-boxer.vcf">Save to Contacts</a>
    <a class="form-btn" href="/sxsw/">Drop your info &rarr;</a>
    <p class="meta">+1 (310) 747-4475<br>Jeremy@futuro.so</p>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export default function middleware(request) {
  const { pathname } = new URL(request.url);

  if (pathname !== '/sxsw/jeremy') return;

  logScan(request, 'html');

  return new Response(htmlCard(), {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export const config = {
  matcher: '/sxsw/jeremy',
};
