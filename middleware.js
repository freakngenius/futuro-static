/**
 * Vercel Edge Middleware
 *
 * Flow: /sxsw/qr → /sxsw/jeremy → /sxsw/jeremy/save → /sxsw
 *   /sxsw/qr          — Jeremy shows QR code on his phone
 *   /sxsw/jeremy      — attendee scans QR, sees contact card, taps "Save to Contacts"
 *   /sxsw/jeremy/save — intermediate page: navigates to .vcf (iOS intercepts → Contacts),
 *                        meta-refresh sends browser to /sxsw/ after 3 s
 *   /sxsw/            — survey/capture form (static, untouched)
 *
 * Why middleware?
 * Vercel rewrites run AFTER static file matching and can't override physical files.
 * Middleware runs before everything, so it can serve /sxsw/jeremy (no static file
 * conflict) cleanly.
 *
 * Why the /save intermediate page?
 * iOS intercepts a text/vcard response and opens the Contacts sheet WITHOUT
 * navigating the browser away from the current page. Because the page stays loaded,
 * the <meta http-equiv="refresh"> in /save fires after 3 s and sends the user to
 * /sxsw/ automatically — zero extra taps.
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
// Contact card page — shown when user first scans QR code
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
      border: none; cursor: pointer;
      font-family: inherit;
      -webkit-tap-highlight-color: transparent;
      margin-bottom: 12px;
    }
    .save-btn:active { background: #5a3fd6; }
    .hint {
      font-size: 0.75rem; color: rgba(255,255,255,0.4);
      margin-top: 8px; line-height: 1.4;
    }
    .actions {
      display: flex; justify-content: center; gap: 20px;
      margin-top: 20px; margin-bottom: 20px;
    }
    .actions a {
      font-size: 0.9rem; color: rgba(255,255,255,0.7);
      text-decoration: underline;
    }
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
    .footer-note {
      margin-top: 24px;
      font-size: 0.65rem; color: rgba(255,255,255,0.25);
    }
  </style>
</head>
<body>
  <div class="card">
    <img class="avatar" src="/sxsw/assets/jeremy.jpeg" alt="Jeremy Boxer">
    <p class="name">Jeremy Boxer</p>
    <p class="title">Futuro</p>
    <button class="save-btn" onclick="saveContact()">Save to Contacts</button>
    <p class="hint">Tap above to add Jeremy directly to your Contacts.</p>
    <div class="actions">
      <a href="tel:+13107474475">Call</a>
      <a href="sms:+13107474475">Text</a>
      <a href="mailto:Jeremy@futuro.so">Email</a>
      <a href="https://www.futuro.so" target="_blank" rel="noreferrer">Visit Futuro</a>
    </div>
    <a class="form-btn" href="/sxsw/">Drop your info &rarr;</a>
    <p class="footer-note">Built with Futuro &middot; SXSW</p>
  </div>
  <script>
    var VCARD_TEXT = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Boxer;Jeremy;;;',
      'FN:Jeremy Boxer',
      'ORG:Futuro',
      'TEL;TYPE=CELL:+13107474475',
      'EMAIL;TYPE=INTERNET:Jeremy@futuro.so',
      'URL:https://www.futuro.so/sxsw',
      'END:VCARD'
    ].join('\\r\\n');

    function saveContact() {
      var ua = navigator.userAgent || '';

      // Android: intent URL opens Contacts directly, bypassing Chrome download manager
      if (/Android/.test(ua)) {
        var vcfUrl = 'https://www.futuro.so/sxsw/jeremy.vcf';
        window.location.href = 'intent:' + vcfUrl +
          '#Intent;action=android.intent.action.VIEW;type=text/vcard' +
          ';S.browser_fallback_url=' + encodeURIComponent(vcfUrl) + ';end';
        return;
      }

      // iOS: Web Share API with a VCF File object
      // The iOS share sheet prominently shows "Add to Contacts" for .vcf files —
      // one tap there opens the Contacts import dialog.
      var file = new File([VCARD_TEXT], 'jeremy-boxer.vcf', { type: 'text/vcard' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'Jeremy Boxer \u2014 Futuro' })
          .catch(function() {}); // user cancelled — do nothing
        return;
      }

      // Fallback for older browsers: direct navigation to the VCF endpoint
      window.location.href = '/sxsw/jeremy.vcf';
    }
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export default function middleware(request) {
  const { pathname } = new URL(request.url);

  // Serve clean vCard (no embedded photo — large base64 photo causes iOS
  // to open in Files/Preview instead of triggering the Contacts sheet)
  if (pathname === '/sxsw/jeremy.vcf') {
    return new Response(VCARD, {
      status: 200,
      headers: {
        'Content-Type': 'text/vcard; charset=utf-8',
        'Content-Disposition': 'inline; filename="jeremy-boxer.vcf"',
        'Cache-Control': 'no-store',
      },
    });
  }

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
  matcher: ['/sxsw/jeremy', '/sxsw/jeremy.vcf'],
};
