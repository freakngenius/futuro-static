// ===========================================
// Futuro Friends & Family — 90-Day Promo Capture
// ===========================================

const FRIENDS90_API_URL = 'https://script.google.com/macros/s/AKfycby6IwwtePTpeZ86ijFoKYy3iVNox9KnlC0GOx27uMpY44asfAK8RFc7OnsBqbgUCJeu/exec';

// --- URL Params ---
const urlParams = new URLSearchParams(window.location.search);

// Referral: ?ref=XYZ overrides default
const refParam = urlParams.get('ref');
const DEFAULT_REFERRAL = 'Jeremy Boxer';

// Collect UTM params
const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
const utmData = {};
utmKeys.forEach(key => {
    const val = urlParams.get(key);
    if (val) utmData[key] = val;
});

// --- DOM ---
const form = document.getElementById('friends90Form');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const referralInput = document.getElementById('referral');
const submitBtn = document.getElementById('submitBtn');
const btnText = submitBtn.querySelector('.btn-text');
const btnLoading = submitBtn.querySelector('.btn-loading');
const nameError = document.getElementById('nameError');
const emailError = document.getElementById('emailError');
const formError = document.getElementById('formError');
const successState = document.getElementById('successState');

// Set current year
document.getElementById('year').textContent = new Date().getFullYear();

// Prefill referral
referralInput.value = refParam || DEFAULT_REFERRAL;

// --- Validation ---
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function clearErrors() {
    nameError.textContent = '';
    emailError.textContent = '';
    formError.textContent = '';
    nameInput.classList.remove('error');
    emailInput.classList.remove('error');
}

function validate() {
    clearErrors();
    let valid = true;

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    if (!name) {
        nameError.textContent = 'Name is required';
        nameInput.classList.add('error');
        valid = false;
    }

    if (!email) {
        emailError.textContent = 'Email is required';
        emailInput.classList.add('error');
        valid = false;
    } else if (!isValidEmail(email)) {
        emailError.textContent = 'Please enter a valid email';
        emailInput.classList.add('error');
        valid = false;
    }

    return valid;
}

// Clear individual field errors on input
nameInput.addEventListener('input', () => {
    nameError.textContent = '';
    nameInput.classList.remove('error');
});

emailInput.addEventListener('input', () => {
    emailError.textContent = '';
    emailInput.classList.remove('error');
});

// --- Sanitize ---
function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML.trim();
}

// --- Submit ---
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validate()) return;

    // Disable button
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    formError.textContent = '';

    // Collect survey fields
    const selectedRole = document.querySelector('input[name="role"]:checked');
    const selectedIndustries = Array.from(document.querySelectorAll('input[name="industry"]:checked'))
        .map(cb => cb.value);
    const howHeard = document.getElementById('howHeard').value;
    const agreedToTest = document.getElementById('agreedToTest').checked;

    const payload = {
        name: sanitize(nameInput.value),
        email: sanitize(emailInput.value),
        referral: sanitize(referralInput.value) || DEFAULT_REFERRAL,
        role: selectedRole ? selectedRole.value : '',
        industry: selectedIndustries.join(', '),
        howHeard: howHeard || '',
        agreedToTest: agreedToTest,
        promo: 'friends90',
        promo_days: 90,
        source: 'friends90',
        page_path: '/friends90',
        created_at: new Date().toISOString(),
        ...utmData
    };

    try {
        const apiUrl = window.__FRIENDS90_API_URL_OVERRIDE || FRIENDS90_API_URL;
        if (apiUrl === 'REPLACE_WITH_YOUR_FRIENDS90_APPS_SCRIPT_URL') {
            throw new Error('Apps Script URL not configured. Deploy friends90/apps-script.js first.');
        }

        // Google Apps Script redirects POST via 302, which browsers convert to GET.
        // mode: 'no-cors' bypasses that — the script still runs and writes to the sheet,
        // but the response is opaque so we can't read it back. Just trust it worked.
        await fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
            mode: 'no-cors',
        });

        // Success — swap to confirmation
        showSuccess();

        // Track event
        if (typeof gtag === 'function') {
            gtag('event', 'friends90_signup', {
                event_category: 'engagement',
                event_label: payload.referral,
            });
        }

    } catch (err) {
        console.error('Submit error:', err);
        formError.textContent = 'Something went wrong — please try again.';
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
});

function showSuccess() {
    // Hide the entire form page, show full-screen overlay
    document.getElementById('formPage').style.display = 'none';
    successState.style.display = 'flex';
}
