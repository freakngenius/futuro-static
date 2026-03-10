/**
 * Google Apps Script — Friends & Family 90-Day Promo Capture
 *
 * SETUP:
 * 1. Create a NEW Google Sheet for Friends & Family signups
 * 2. Open Extensions > Apps Script
 * 3. Paste this code
 * 4. Deploy > New deployment > Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the deployment URL and paste it into friends90.js as FRIENDS90_API_URL
 *
 * This is a SEPARATE sheet from the SXSW signups so you can track
 * which users qualify for the 90-day free tier.
 */

// Column headers — order matters (matches sheet columns left to right)
const HEADERS = [
  'created_at',
  'name',
  'email',
  'referral',
  'role',
  'industry',
  'howHeard',
  'agreedToTest',
  'invite_code',
  'code_group',
  'promo',
  'promo_days',
  'source',
  'page_path',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content'
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Basic server-side validation
    if (!data.name || !data.email) {
      return jsonResponse({ success: false, error: 'Name and email are required.' });
    }

    // Simple email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return jsonResponse({ success: false, error: 'Invalid email format.' });
    }

    // Sanitize strings
    const sanitize = (val) => String(val || '').replace(/[<>"']/g, '').trim();

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Auto-create headers if first row is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    }

    // Build row in header order
    const row = HEADERS.map(header => {
      switch (header) {
        case 'created_at':
          return data.created_at || new Date().toISOString();
        case 'name':
          return sanitize(data.name);
        case 'email':
          return sanitize(data.email).toLowerCase();
        case 'referral':
          return sanitize(data.referral) || 'Jeremy Boxer';
        case 'role':
          return sanitize(data.role);
        case 'industry':
          return sanitize(data.industry);
        case 'howHeard':
          return sanitize(data.howHeard);
        case 'agreedToTest':
          return data.agreedToTest ? 'Yes' : 'No';
        case 'invite_code':
          return sanitize(data.invite_code);
        case 'code_group':
          return sanitize(data.code_group);
        case 'promo':
          return sanitize(data.promo) || 'friends90';
        case 'promo_days':
          return Number(data.promo_days) || 90;
        case 'source':
          return sanitize(data.source) || 'friends90';
        case 'page_path':
          return sanitize(data.page_path) || '/friends90';
        default:
          // UTM params and any other fields
          return sanitize(data[header]);
      }
    });

    sheet.appendRow(row);

    return jsonResponse({ success: true });

  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// Handle CORS preflight / health check
function doGet(e) {
  return jsonResponse({ success: true, message: 'Friends & Family 90-day promo endpoint is live.' });
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
