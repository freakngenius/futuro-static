# SXSW Landing Page — Setup Guide

## 1. Deploy the Google Apps Script

The SXSW page stores signups in the linked Google Sheet via a Google Apps Script webhook.

**Target Sheet:** https://docs.google.com/spreadsheets/d/1HOtsyGq7O1xvTpvegRy6EzT6LdLWSk2Wb4ZZAsNmEas/edit

### Steps:

1. Open the Google Sheet above
2. Go to **Extensions > Apps Script**
3. Delete any existing code in the editor
4. Paste the entire contents of `apps-script.js` (included in this directory)
5. Click **Deploy > New deployment**
6. Choose type: **Web app**
7. Set:
   - **Description:** "SXSW Signups"
   - **Execute as:** Me
   - **Who has access:** Anyone
8. Click **Deploy**
9. **Authorize** when prompted (you'll need to click through the "unsafe" warning since it's your own script)
10. Copy the **Web app URL** (looks like `https://script.google.com/macros/s/XXXXX/exec`)

### Update the landing page:

Open `sxsw.js` and replace this line:

```js
const SXSW_API_URL = 'REPLACE_WITH_YOUR_APPS_SCRIPT_URL';
```

With your deployed URL:

```js
const SXSW_API_URL = 'https://script.google.com/macros/s/YOUR_ID_HERE/exec';
```

## 2. Verify

1. Open `https://futuro.so/sxsw` (or locally)
2. Fill in the form and submit
3. Check the Google Sheet — a new row should appear with all fields

## 3. Sheet Columns

The script auto-creates these headers on first submission:

| Column | Description |
|--------|-------------|
| created_at | ISO timestamp |
| name | Contact name |
| email | Contact email |
| referral | Who referred them (default: "Jeremy Boxer") |
| source | Always "sxsw" |
| page_path | Always "/sxsw" |
| utm_source | UTM source param (if present) |
| utm_medium | UTM medium param (if present) |
| utm_campaign | UTM campaign param (if present) |
| utm_term | UTM term param (if present) |
| utm_content | UTM content param (if present) |

## 4. QR Code

QR code assets are in `sxsw/assets/`:
- `qr-code.png` — crisp PNG for printing/sharing
- `qr-code.svg` — scalable SVG

The QR code points to: `https://futuro.so/sxsw`

A phone-friendly QR display page is available at `/sxsw/qr/` — Jeremy can open this on his phone and let people scan directly from the screen.

## 5. URL Parameters

- `?ref=SomeName` — prefills the referral field (overrides default "Jeremy Boxer")
- Standard UTM params (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`) are captured and stored alongside the signup
