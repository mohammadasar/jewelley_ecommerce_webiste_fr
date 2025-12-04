// AUTHENTICATION LOGIC
// ====================

// CONFIGURATION
// Replace this with your actual backend URL
const API_BASE_URL = 'http://localhost:8080/api/auth';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
});

async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    const submitBtn = document.getElementById('loginSubmitBtn');

    // Reset error
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';

    // Loading state
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = { message: text };
        }

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        // Save token/user if available
        if (data.token) {
            localStorage.setItem('jewel_token', data.token);
            localStorage.setItem('jewel_user', JSON.stringify(data.user));
        }

        // Redirect to home
        window.location.href = 'index.html';

    } catch (error) {
        console.error("Login error:", error);
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
}

async function handleSignup(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('signupError');
    const submitBtn = document.getElementById('signupSubmitBtn');

    // Reset error
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';

    // Validation
    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.style.display = 'block';
        return;
    }

    // Loading state
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Creating Account...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = { message: text };
        }

        if (!response.ok) {
            throw new Error(data.message || 'Signup failed');
        }

        // Clear form
        document.getElementById('signupForm').reset();

        // Check if we received a token (auto-login) or just a success message
        if (data.token) {
            localStorage.setItem('jewel_token', data.token);
            localStorage.setItem('jewel_user', JSON.stringify(data.user));
            window.location.href = 'index.html';
        } else {
            // Redirect to login page if no token returned
            alert('Account created successfully! Please login.');
            window.location.href = 'login.html';
        }

    } catch (error) {
        console.error("Signup error:", error);
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
}

function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);

    // Toggle Icon
    if (type === 'text') {
        // Show Open Eye (Visible)
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    } else {
        // Show Closed Eye (Hidden)
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
    }
}
