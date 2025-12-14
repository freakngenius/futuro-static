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

// Show success message
function showSuccessMessage() {
    const modalContent = document.querySelector('.modal-content');
    modalContent.innerHTML = `
        <div class="success-message">
            <h2>Your information has been sent. Thank you!</h2>
            <p>We appreciate your interest in Futuro. Someone from our team will reach out to you shortly.</p>
            <button class="success-close-btn" id="successCloseBtn">Close</button>
        </div>
    `;
    
    // Add event listener to new close button
    document.getElementById('successCloseBtn').addEventListener('click', () => {
        location.reload(); // Reload page to reset modal
    });
}

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
        // Call Manus backend API using tRPC format
        const response = await fetch(`${API_URL}/betaSignup.submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ json: data }),
        });

        const result = await response.json();

        // Check if there's an error in the response
        if (result.error) {
            throw new Error(result.error.message || 'Submission failed');
        }

        // Success - show success message
        showSuccessMessage();
    } catch (error) {
        console.error('Error:', error);
        alert('Sorry, there was an error submitting your form. Please try again or email us directly.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
    }
});
