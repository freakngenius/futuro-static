/**
 * Google Apps Script — SXSW Contact Capture
 *
 * Deploy as a Web App (Execute as: Me, Access: Anyone).
 * Paste this into Extensions > Apps Script in your Google Sheet.
 *
 * Target Sheet: https://docs.google.com/spreadsheets/d/1HOtsyGq7O1xvTpvegRy6EzT6LdLWSk2Wb4ZZAsNmEas/
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
        case 'source':
          return sanitize(data.source) || 'sxsw';
        case 'role':
          return sanitize(data.role);
        case 'industry':
          return sanitize(data.industry);
        case 'howHeard':
          return sanitize(data.howHeard);
        case 'agreedToTest':
          return data.agreedToTest ? 'Yes' : 'No';
        case 'page_path':
          return sanitize(data.page_path) || '/sxsw';
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

// Handle CORS preflight
function doGet(e) {
  return jsonResponse({ success: true, message: 'SXSW signup endpoint is live.' });
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
