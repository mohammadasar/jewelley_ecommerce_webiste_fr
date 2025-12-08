/**
 * ============================================
 * AUTH STATE MANAGER
 * ============================================
 * Manages user authentication state and profile menu
 */

(function () {
    'use strict';

    // Check if user is logged in
    function isLoggedIn() {
        const token = localStorage.getItem('jewel_token');
        return !!token;
    }

    // Get current user
    function getCurrentUser() {
        const userStr = localStorage.getItem('jewel_user');

        // Check if userStr is null, undefined, or the string "undefined"
        if (!userStr || userStr === 'undefined' || userStr === 'null') {
            return null;
        }

        try {
            return JSON.parse(userStr);
        } catch (error) {
            console.error('Error parsing user data:', error);
            // Clear invalid data
            localStorage.removeItem('jewel_user');
            return null;
        }
    }

    // Update navbar based on auth state
    function updateNavbar() {
        const profileMenuToggle = document.getElementById('profileMenuToggle');
        const loginSignupBtn = document.getElementById('loginSignupBtn');
        const adminPanelLink = document.getElementById('adminPanel');

        if (!profileMenuToggle || !loginSignupBtn) {
            console.error('Profile menu elements not found');
            return;
        }

        if (isLoggedIn()) {
            // User is logged in - show profile menu
            profileMenuToggle.style.display = 'block';
            loginSignupBtn.style.display = 'none';

            // Check if user is admin
            const user = getCurrentUser();
            if (user && user.role === 'ADMIN' && adminPanelLink) {
                adminPanelLink.style.display = 'flex';
            } else if (adminPanelLink) {
                adminPanelLink.style.display = 'none';
            }
        } else {
            // User is not logged in - show login button
            profileMenuToggle.style.display = 'none';
            loginSignupBtn.style.display = 'inline-block';
            if (adminPanelLink) {
                adminPanelLink.style.display = 'none';
            }
        }
    }

    // Setup profile menu event listeners
    function setupProfileMenu() {
        const profileMenuToggle = document.getElementById('profileMenuToggle');
        const profileDropdown = document.getElementById('profileDropdown');
        const logoutBtn = document.getElementById('logoutBtn');
        const myProfile = document.getElementById('myProfile');
        const myOrders = document.getElementById('myOrders');

        if (!profileMenuToggle || !profileDropdown) {
            return;
        }

        // Toggle dropdown
        profileMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileMenuToggle.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove('show');
            }
        });

        // Logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                handleLogout();
            });
        }

        // Profile link
        if (myProfile) {
            myProfile.addEventListener('click', (e) => {
                e.preventDefault();
                alert('Profile page - Coming soon!');
                profileDropdown.classList.remove('show');
            });
        }

        // Orders link
        if (myOrders) {
            myOrders.addEventListener('click', (e) => {
                e.preventDefault();
                alert('Orders page - Coming soon!');
                profileDropdown.classList.remove('show');
            });
        }
    }

    // Handle logout
    function handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('jewel_token');
            localStorage.removeItem('jewel_user');
            window.location.reload();
        }
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        updateNavbar();
        setupProfileMenu();
    });

    // Expose functions globally
    window.AuthState = {
        isLoggedIn,
        getCurrentUser,
        updateNavbar,
        logout: handleLogout
    };

})();
