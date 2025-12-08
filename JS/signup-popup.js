/**
 * ============================================
 * SIGNUP/LOGIN POPUP MANAGER
 * ============================================
 * 
 * Features:
 * - Shows popup after 1-2 minutes of browsing
 * - Remembers user choice permanently via localStorage
 * - Never shows again if user signs up, logs in, or closes
 * - Smooth fade-in/out animations
 * - Clean, modular code
 */

(function () {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    const CONFIG = {
        SHOW_DELAY: 20000,        // 20 seconds in milliseconds
        STORAGE_KEY_SIGNED_UP: 'user_signed_up',
        STORAGE_KEY_POPUP_CLOSED: 'popup_closed',
        SIGNUP_PAGE_URL: './signup.html',
        LOGIN_PAGE_URL: './login.html'
    };

    // ============================================
    // STATE MANAGEMENT
    // ============================================
    const PopupState = {
        isShown: false,
        timer: null,

        // Check if popup should be shown
        shouldShow() {
            const hasToken = localStorage.getItem('jewel_token');
            const hasSignedUp = localStorage.getItem(CONFIG.STORAGE_KEY_SIGNED_UP) === 'true';
            const hasClosed = localStorage.getItem(CONFIG.STORAGE_KEY_POPUP_CLOSED) === 'true';
            // Don't show if user is logged in (has token) OR has signed up OR has closed the popup
            return !hasToken && !hasSignedUp && !hasClosed;
        },

        // Mark user as signed up
        markSignedUp() {
            localStorage.setItem(CONFIG.STORAGE_KEY_SIGNED_UP, 'true');
        },

        // Mark popup as closed
        markClosed() {
            localStorage.setItem(CONFIG.STORAGE_KEY_POPUP_CLOSED, 'true');
        },

        // Clear all stored data (for testing)
        reset() {
            localStorage.removeItem(CONFIG.STORAGE_KEY_SIGNED_UP);
            localStorage.removeItem(CONFIG.STORAGE_KEY_POPUP_CLOSED);
        }
    };

    // ============================================
    // DOM ELEMENTS
    // ============================================
    let popupOverlay, popupContainer;

    // ============================================
    // POPUP FUNCTIONS
    // ============================================

    /**
     * Show the popup with animation
     */
    function showPopup() {
        if (!PopupState.shouldShow() || PopupState.isShown) return;

        popupOverlay.classList.add('show');
        popupContainer.classList.add('show');
        PopupState.isShown = true;

        // Prevent body scroll when popup is open
        document.body.style.overflow = 'hidden';
    }

    /**
     * Hide the popup with animation
     */
    function hidePopup() {
        popupOverlay.classList.remove('show');
        popupContainer.classList.remove('show');
        PopupState.isShown = false;

        // Restore body scroll
        document.body.style.overflow = '';
    }

    /**
     * Close popup and remember the choice
     */
    function closePopup() {
        hidePopup();
        PopupState.markClosed();
    }

    /**
     * Redirect to signup page
     */
    function redirectToSignup() {
        PopupState.markSignedUp();
        window.location.href = CONFIG.SIGNUP_PAGE_URL;
    }

    /**
     * Redirect to login page
     */
    function redirectToLogin() {
        PopupState.markSignedUp();
        window.location.href = CONFIG.LOGIN_PAGE_URL;
    }

    // ============================================
    // EVENT HANDLERS
    // ============================================

    /**
     * Handle overlay click (close popup)
     */
    function handleOverlayClick(e) {
        if (e.target === popupOverlay) {
            closePopup();
        }
    }

    /**
     * Handle escape key press
     */
    function handleEscapeKey(e) {
        if (e.key === 'Escape' && PopupState.isShown) {
            closePopup();
        }
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    /**
     * Create popup HTML structure
     */
    function createPopupHTML() {
        const html = `
            <!-- Popup Overlay -->
            <div class="popup-overlay" id="popupOverlay"></div>

            <!-- Signup Popup -->
            <div class="signup-popup" id="signupPopup">
                <button class="popup-close" id="popupClose" aria-label="Close popup">&times;</button>
                
                <div class="popup-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                </div>

                <div class="popup-content">
                    <h2>Join Our Community!</h2>
                    <p>Create an account to unlock exclusive features, save your favorites, and get personalized recommendations.</p>
                </div>

                <div class="popup-buttons">
                    <button class="popup-btn popup-btn-primary" id="signupBtn">
                        Create Account
                    </button>
                    <button class="popup-btn popup-btn-secondary" id="loginBtn">
                        I Already Have an Account
                    </button>
                </div>

                <div class="popup-dismiss">
                    <button id="dismissBtn">Maybe later</button>
                </div>
            </div>
        `;

        // Insert HTML at the end of body
        document.body.insertAdjacentHTML('beforeend', html);
    }

    /**
     * Attach event listeners
     */
    function attachEventListeners() {
        // Get DOM elements
        popupOverlay = document.getElementById('popupOverlay');
        popupContainer = document.getElementById('signupPopup');
        const closeBtn = document.getElementById('popupClose');
        const signupBtn = document.getElementById('signupBtn');
        const loginBtn = document.getElementById('loginBtn');
        const dismissBtn = document.getElementById('dismissBtn');

        // Attach listeners
        closeBtn.addEventListener('click', closePopup);
        signupBtn.addEventListener('click', redirectToSignup);
        loginBtn.addEventListener('click', redirectToLogin);
        dismissBtn.addEventListener('click', closePopup);
        popupOverlay.addEventListener('click', handleOverlayClick);
        document.addEventListener('keydown', handleEscapeKey);
    }

    /**
     * Start the timer to show popup
     */
    function startTimer() {
        if (!PopupState.shouldShow()) return;

        PopupState.timer = setTimeout(() => {
            showPopup();
        }, CONFIG.SHOW_DELAY);
    }

    /**
     * Initialize the popup system
     */
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Create popup HTML
        createPopupHTML();

        // Attach event listeners
        attachEventListeners();

        // Start timer
        startTimer();
    }

    // ============================================
    // GLOBAL API (for manual control)
    // ============================================

    // Expose functions globally for integration with signup/login pages
    window.SignupPopup = {
        show: showPopup,
        hide: hidePopup,
        close: closePopup,
        markUserSignedUp: () => PopupState.markSignedUp(),
        reset: () => PopupState.reset(), // For testing only
        config: CONFIG
    };

    // ============================================
    // START
    // ============================================
    init();

})();
