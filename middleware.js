/**
 * Vercel Edge Middleware — runs BEFORE filesystem routing.
 * Intercepts GET /sxsw and serves either a vCard or an HTML fallback
 * depending on the requesting device.
 *
 * Why middleware instead of a rewrite in vercel.json?
 * Vercel rewrites are applied AFTER static file matching, so they can't
 * override a path that has a physical file (sxsw/index.html). Middleware
 * runs before all of that.
 *
 * Why Content-Disposition: inline?
 * "attachment" forces a download. "inline" tells the OS to open the file
 * with its registered handler — on iOS that's Contacts, which surfaces
 * the native "Add Contact" sheet directly in Safari.
 *
 * Splitting /sxsw (smart) vs /sxsw/contact.vcf (raw) later:
 * The HTML fallback already links to /sxsw/jeremy.vcf (the static file).
 * To add a separate clean URL, add another middleware branch for
 * /sxsw/contact.vcf and return the same vCard Response there.
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
// Scan logging stub — replace with your analytics/DB call when ready
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
// UA detection
// iOS Safari is the reliable vCard path — camera opens URLs in Safari and
// iOS handles text/vcard inline via the Contacts sheet.
// Android Chrome silently drops .vcf files into Downloads, so HTML is better.
// ---------------------------------------------------------------------------
function shouldServeVCard(request) {
  const accept = (request.headers.get('accept') || '').toLowerCase();
  const ua     =  request.headers.get('user-agent') || '';

  if (accept.includes('text/vcard') || accept.includes('application/vcard+json')) {
    return true;
  }

  const isIOS    = /iPhone|iPad|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
}

// ---------------------------------------------------------------------------
// HTML fallback — minimal contact card with a single Save button
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
  <meta property="og:description" content="Founder at Futuro — agentic production management for GenAI creators.">
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
      width: 96px;
      height: 96px;
      border-radius: 50%;
      object-fit: cover;
      margin-bottom: 20px;
      border: 2px solid rgba(255,255,255,0.12);
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
// Middleware entry point
// ---------------------------------------------------------------------------
export default function middleware(request) {
  const { pathname } = new URL(request.url);

  // Only intercept exactly /sxsw — let /sxsw/ and all sub-paths serve static files
  if (pathname !== '/sxsw') return;

  const serveVCard = shouldServeVCard(request);
  logScan(request, serveVCard ? 'vcard' : 'html');

  if (serveVCard) {
    return new Response(VCARD, {
      status: 200,
      headers: {
        'Content-Type': 'text/vcard; charset=utf-8',
        'Content-Disposition': 'inline; filename="jeremy-boxer.vcf"',
        'Cache-Control': 'no-store',
      },
    });
  }

  return new Response(htmlFallback(), {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export const config = {
  matcher: '/sxsw',
};
