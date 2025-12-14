// API endpoint for Manus-hosted backend
const API_URL = 'https://futuro-lp-bb3izgkk.manus.space/api/trpc';

// Set current year
document.getElementById('year').textContent = new Date().getFullYear();

// Modal elements
const modal = document.getElementById('modal');
const signupBtn = document.getElementById('signupBtn');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const signupForm = document.getElementById('signupForm');
const submitBtn = document.getElementById('submitBtn');

// Open modal
signupBtn.addEventListener('click', () => {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
});

// Close modal
function closeModalHandler() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    signupForm.reset();
}

closeModal.addEventListener('click', closeModalHandler);
cancelBtn.addEventListener('click', closeModalHandler);

// Close modal on outside click
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModalHandler();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModalHandler();
    }
});

// Form submission
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form data
    const formData = new FormData(signupForm);
    
    // Get selected roles
    const roles = Array.from(document.querySelectorAll('input[name="roles"]:checked'))
        .map(cb => cb.value);
    
    // Get selected industries
    const industries = Array.from(document.querySelectorAll('input[name="industries"]:checked'))
        .map(cb => cb.value);

    // Validate
    if (roles.length === 0) {
        alert('Please select at least one role');
        return;
    }

    if (industries.length === 0) {
        alert('Please select at least one industry');
        return;
    }

    if (!document.getElementById('agreedToTest').checked) {
        alert('You must agree to test and give feedback');
        return;
    }

    // Prepare data
    const data = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        webBrowser: formData.get('webBrowser'),
        roles: roles,
        industries: industries,
        howHeard: formData.get('howHeard') || '',
        agreedToTest: true,
    };

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        // Call Manus backend API
        const response = await fetch(`${API_URL}/betaSignup.submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Submission failed');
        }

        const result = await response.json();

        // Success
        alert('Thank you for signing up! We will be in touch soon.');
        closeModalHandler();
    } catch (error) {
        console.error('Error:', error);
        alert('Sorry, there was an error submitting your form. Please try again or email us directly.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
    }
});
