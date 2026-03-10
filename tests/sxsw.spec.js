// @ts-check
const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost:8089';

// Helper: set up mocked fetch + API URL override before page loads
async function setupMockedPage(page, url) {
  await page.addInitScript(() => {
    window.__SXSW_API_URL_OVERRIDE = 'https://fake-api.test/exec';
    window.__capturedPayloads = [];
    const origFetch = window.fetch.bind(window);
    window.fetch = async function(fetchUrl, opts) {
      if (opts && opts.method === 'POST') {
        try { window.__capturedPayloads.push(JSON.parse(opts.body)); } catch(e) {}
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return origFetch(fetchUrl, opts);
    };
  });
  await page.goto(url || `${BASE}/sxsw/`);
}

test.describe('SXSW Landing Page — Load', () => {

  test('loads with correct title and elements', async ({ page }) => {
    await page.goto(`${BASE}/sxsw/`);
    await expect(page).toHaveTitle(/Futuro.*SXSW/);
    await expect(page.locator('.headline')).toHaveText("Let's stay connected");
    await expect(page.locator('.subline')).toContainText('agentic production management platform');
    await expect(page.locator('.logo')).toBeVisible();
    await expect(page.locator('#sxswForm')).toBeVisible();
  });

  test('has all form fields', async ({ page }) => {
    await page.goto(`${BASE}/sxsw/`);
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#referral')).toBeVisible();
    await expect(page.locator('#howHeard')).toBeVisible();
    await expect(page.locator('#agreedToTest')).toBeVisible();
    await expect(page.locator('input[name="role"]')).toHaveCount(4);
    await expect(page.locator('input[name="industry"]')).toHaveCount(7);
  });
});

test.describe('SXSW Landing Page — Referral', () => {

  test('defaults to "Jeremy Boxer"', async ({ page }) => {
    await page.goto(`${BASE}/sxsw/`);
    await expect(page.locator('#referral')).toHaveValue('Jeremy Boxer');
  });

  test('?ref= param overrides default', async ({ page }) => {
    await page.goto(`${BASE}/sxsw/?ref=TestPerson`);
    await expect(page.locator('#referral')).toHaveValue('TestPerson');
  });

  test('referral is editable', async ({ page }) => {
    await page.goto(`${BASE}/sxsw/`);
    await page.locator('#referral').clear();
    await page.locator('#referral').fill('Someone Else');
    await expect(page.locator('#referral')).toHaveValue('Someone Else');
  });
});

test.describe('SXSW Landing Page — Validation', () => {

  test('name required', async ({ page }) => {
    await page.goto(`${BASE}/sxsw/`);
    await page.locator('#email').fill('test@example.com');
    await page.locator('#submitBtn').click();
    await expect(page.locator('#nameError')).toHaveText('Name is required');
    await expect(page.locator('#name')).toHaveClass(/error/);
  });

  test('email required', async ({ page }) => {
    await page.goto(`${BASE}/sxsw/`);
    await page.locator('#name').fill('Test User');
    await page.locator('#submitBtn').click();
    await expect(page.locator('#emailError')).toHaveText('Email is required');
  });

  test('invalid email format', async ({ page }) => {
    await page.goto(`${BASE}/sxsw/`);
    await page.locator('#name').fill('Test User');
    await page.locator('#email').fill('notanemail');
    await page.locator('#submitBtn').click();
    await expect(page.locator('#emailError')).toHaveText('Please enter a valid email');
  });

  test('clears name error on input', async ({ page }) => {
    await page.goto(`${BASE}/sxsw/`);
    await page.locator('#submitBtn').click();
    await expect(page.locator('#nameError')).toHaveText('Name is required');
    await page.locator('#name').fill('A');
    await expect(page.locator('#nameError')).toHaveText('');
  });

  test('clears email error on input', async ({ page }) => {
    await page.goto(`${BASE}/sxsw/`);
    await page.locator('#name').fill('Test');
    await page.locator('#submitBtn').click();
    await expect(page.locator('#emailError')).not.toHaveText('');
    await page.locator('#email').fill('a');
    await expect(page.locator('#emailError')).toHaveText('');
  });
});

test.describe('SXSW Landing Page — Survey Fields', () => {

  test('role radios are mutually exclusive', async ({ page }) => {
    await page.goto(`${BASE}/sxsw/`);
    await page.locator('input[name="role"][value="Creator"]').check();
    await expect(page.locator('input[name="role"][value="Creator"]')).toBeChecked();
    await page.locator('input[name="role"][value="Investor"]').check();
    await expect(page.locator('input[name="role"][value="Creator"]')).not.toBeChecked();
    await expect(page.locator('input[name="role"][value="Investor"]')).toBeChecked();
  });

  test('industry checkboxes allow multi-select', async ({ page }) => {
    await page.goto(`${BASE}/sxsw/`);
    await page.locator('input[name="industry"][value="Filmmaking"]').check();
    await page.locator('input[name="industry"][value="Education"]').check();
    await expect(page.locator('input[name="industry"][value="Filmmaking"]')).toBeChecked();
    await expect(page.locator('input[name="industry"][value="Education"]')).toBeChecked();
  });

  test('how heard dropdown works', async ({ page }) => {
    await page.goto(`${BASE}/sxsw/`);
    await page.locator('#howHeard').selectOption('Social Media');
    await expect(page.locator('#howHeard')).toHaveValue('Social Media');
  });

  test('testing interest checkbox toggles', async ({ page }) => {
    await page.goto(`${BASE}/sxsw/`);
    await expect(page.locator('#agreedToTest')).not.toBeChecked();
    await page.locator('#agreedToTest').check();
    await expect(page.locator('#agreedToTest')).toBeChecked();
  });
});

test.describe('SXSW Landing Page — Submit', () => {

  test('successful submit shows success state', async ({ page }) => {
    await setupMockedPage(page);

    await page.locator('#name').fill('Test User');
    await page.locator('#email').fill('test@example.com');
    await page.locator('#submitBtn').click();

    // Form should hide, success should show
    await expect(page.locator('#sxswForm')).toBeHidden();
    await expect(page.locator('#successState')).toBeVisible();
    await expect(page.locator('.success-headline')).toHaveText("You're in.");
  });

  test('submit captures all fields in payload', async ({ page }) => {
    await setupMockedPage(page, `${BASE}/sxsw/?ref=SXSWTest&utm_source=twitter&utm_campaign=sxsw2026`);

    await page.locator('#name').fill('Jeremy Test');
    await page.locator('#email').fill('jeremy@test.com');
    await page.locator('input[name="role"][value="Executive"]').check();
    await page.locator('input[name="industry"][value="Advertising"]').check();
    await page.locator('input[name="industry"][value="Social Media"]').check();
    await page.locator('#howHeard').selectOption('Community');
    await page.locator('#agreedToTest').check();

    await page.locator('#submitBtn').click();
    await expect(page.locator('#successState')).toBeVisible();

    const payloads = await page.evaluate(() => window.__capturedPayloads);
    expect(payloads).toHaveLength(1);

    const p = payloads[0];
    expect(p.name).toBe('Jeremy Test');
    expect(p.email).toBe('jeremy@test.com');
    expect(p.referral).toBe('SXSWTest');
    expect(p.role).toBe('Executive');
    expect(p.industry).toBe('Advertising, Social Media');
    expect(p.howHeard).toBe('Community');
    expect(p.agreedToTest).toBe(true);
    expect(p.source).toBe('sxsw');
    expect(p.page_path).toBe('/sxsw');
    expect(p.utm_source).toBe('twitter');
    expect(p.utm_campaign).toBe('sxsw2026');
    expect(p.created_at).toBeTruthy();
  });

  test('submit with only required fields works', async ({ page }) => {
    await setupMockedPage(page);

    await page.locator('#name').fill('Min User');
    await page.locator('#email').fill('min@test.com');
    await page.locator('#submitBtn').click();

    await expect(page.locator('#successState')).toBeVisible();

    const payloads = await page.evaluate(() => window.__capturedPayloads);
    const p = payloads[0];
    expect(p.name).toBe('Min User');
    expect(p.email).toBe('min@test.com');
    expect(p.referral).toBe('Jeremy Boxer');
    expect(p.role).toBe('');
    expect(p.industry).toBe('');
    expect(p.howHeard).toBe('');
    expect(p.agreedToTest).toBe(false);
  });

  test('submit error re-enables button', async ({ page }) => {
    // Mock a failing API response
    await page.addInitScript(() => {
      window.__SXSW_API_URL_OVERRIDE = 'https://fake-api.test/exec';
      const origFetch = window.fetch.bind(window);
      window.fetch = async function(fetchUrl, opts) {
        if (opts && opts.method === 'POST') {
          return new Response(JSON.stringify({ success: false, error: 'Test error' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return origFetch(fetchUrl, opts);
      };
    });
    await page.goto(`${BASE}/sxsw/`);
    await page.locator('#name').fill('Test');
    await page.locator('#email').fill('test@test.com');
    await page.locator('#submitBtn').click();

    await expect(page.locator('#formError')).toHaveText('Something went wrong — please try again.');
    await expect(page.locator('#submitBtn')).toBeEnabled();
    await expect(page.locator('.btn-text')).toBeVisible();
  });
});

test.describe('SXSW Landing Page — Mobile', () => {

  test('fits within mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/sxsw/`);
    await expect(page.locator('.container')).toBeVisible();
    await expect(page.locator('#submitBtn')).toBeVisible();
    const box = await page.locator('.container').boundingBox();
    expect(box.width).toBeLessThanOrEqual(375);
  });
});

test.describe('SXSW QR Page', () => {

  test('loads with correct elements', async ({ page }) => {
    await page.goto(`${BASE}/sxsw/qr/`);
    await expect(page).toHaveTitle(/Scan to Connect/);
    await expect(page.locator('.qr-tagline')).toHaveText("Let's connect!");
    await expect(page.locator('.qr-container')).toBeVisible();
  });

  test('QR code image loads successfully', async ({ page }) => {
    await page.goto(`${BASE}/sxsw/qr/`);
    const qrImg = page.locator('.qr-container img');
    await expect(qrImg).toBeVisible();
    const loaded = await qrImg.evaluate(img => img.naturalWidth > 0);
    expect(loaded).toBe(true);
  });

  test('works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/sxsw/qr/`);
    await expect(page.locator('.qr-container')).toBeVisible();
  });
});
