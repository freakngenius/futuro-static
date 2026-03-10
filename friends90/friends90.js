// ===========================================
// Futuro Friends & Family — 90-Day Promo Capture
// ===========================================

const FRIENDS90_API_URL = 'https://script.google.com/macros/s/AKfycby6IwwtePTpeZ86ijFoKYy3iVNox9KnlC0GOx27uMpY44asfAK8RFc7OnsBqbgUCJeu/exec';

// --- Batch Codes ---
// Keys are uppercase (for matching). Values are tracking labels.
const VALID_CODES = {
    'MACHINECINEMA90': 'machine-cinema',
    'REALDREAMS90':    'real-dreams',
    'FOF90':           'friends-of-friends',
};

// Validated code stored after gate unlock
let validatedCode = '';
let validatedCodeGroup = '';

// --- URL Params ---
const urlParams = new URLSearchParams(window.location.search);
const refParam = urlParams.get('ref');
const codeParam = urlParams.get('code');
const DEFAULT_REFERRAL = 'Jeremy Boxer';

// Collect UTM params
const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
const utmData = {};
utmKeys.forEach(key => {
    const val = urlParams.get(key);
    if (val) utmData[key] = val;
});

// --- Set year in all footer elements ---
document.querySelectorAll('.year-text').forEach(el => {
    el.textContent = new Date().getFullYear();
});

// ===========================================
// GATE LOGIC
// ===========================================
const gatePage = document.getElementById('gatePage');
const formPage = document.getElementById('formPage');
const inviteCodeInput = document.getElementById('inviteCode');
const unlockBtn = document.getElementById('unlockBtn');
const codeError = document.getElementById('codeError');

function normalizeCode(raw) {
    return raw.replace(/[\s\-]/g, '').toUpperCase();
}

function validateCode(raw) {
    const normalized = normalizeCode(raw);
    if (VALID_CODES[normalized]) {
        return { valid: true, code: normalized, group: VALID_CODES[normalized] };
    }
    return { valid: false };
}

function unlockGate(code, group, skipAnimation) {
    validatedCode = code;
    validatedCodeGroup = group;

    if (skipAnimation) {
        // URL param bypass — no animation, just swap
        gatePage.style.display = 'none';
        formPage.style.display = 'flex';
        initForm();
        return;
    }

    // Flash green on input
    inviteCodeInput.classList.add('success');

    // Animate gate out, form in
    setTimeout(() => {
        gatePage.classList.add('gate-fade-out');

        gatePage.addEventListener('animationend', function handler() {
            gatePage.removeEventListener('animationend', handler);
            gatePage.style.display = 'none';

            formPage.style.display = 'flex';
            formPage.classList.add('form-fade-in');
            initForm();
        });
    }, 400); // Let the green flash show briefly
}

function showCodeError() {
    codeError.textContent = 'Invalid code — try again';
    inviteCodeInput.classList.add('error');
    inviteCodeInput.classList.add('shake');

    // Remove shake after animation completes
    setTimeout(() => {
        inviteCodeInput.classList.remove('shake');
    }, 500);
}

// Clear error on input
inviteCodeInput.addEventListener('input', () => {
    codeError.textContent = '';
    inviteCodeInput.classList.remove('error');
    inviteCodeInput.classList.remove('success');
});

// Enter key submits gate
inviteCodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        attemptUnlock();
    }
});

unlockBtn.addEventListener('click', attemptUnlock);

function attemptUnlock() {
    const raw = inviteCodeInput.value.trim();
    if (!raw) {
        codeError.textContent = 'Please enter your invite code';
        inviteCodeInput.classList.add('error');
        return;
    }

    const result = validateCode(raw);
    if (result.valid) {
        unlockGate(result.code, result.group, false);
    } else {
        showCodeError();
    }
}

// --- Auto-unlock via ?code= URL param ---
if (codeParam) {
    const result = validateCode(codeParam);
    if (result.valid) {
        unlockGate(result.code, result.group, true);
    }
    // If invalid param, just show the gate normally
}

// ===========================================
// FORM LOGIC (initialized after gate unlock)
// ===========================================
let formInitialized = false;

function initForm() {
    if (formInitialized) return;
    formInitialized = true;

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
            invite_code: validatedCode,
            code_group: validatedCodeGroup,
            promo: 'friends90',
            promo_days: 90,
            source: 'friends90',
            page_path: '/friends90',
            created_at: new Date().toISOString(),
            ...utmData
        };

        try {
            const apiUrl = window.__FRIENDS90_API_URL_OVERRIDE || FRIENDS90_API_URL;

            await fetch(apiUrl, {
                method: 'POST',
                body: JSON.stringify(payload),
                mode: 'no-cors',
            });

            // Success — swap to confirmation
            formPage.style.display = 'none';
            successState.style.display = 'flex';

            // Track event
            if (typeof gtag === 'function') {
                gtag('event', 'friends90_signup', {
                    event_category: 'engagement',
                    event_label: validatedCodeGroup,
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
}
