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
            // Silently skip if elements are missing (e.g., simplified checkout page)
            return;
        }

        if (isLoggedIn()) {
            // User is logged in - show profile menu
            profileMenuToggle.style.display = 'block';
            loginSignupBtn.style.display = 'none';

            // Check if user is admin
            const user = getCurrentUser();
            const isAdmin = user && (user.role === 'ADMIN' || user.username === 'admin'); // Fallback check
            if (isAdmin && adminPanelLink) {
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
                openProfileModal();
                profileDropdown.classList.remove('show');
            });
        }

        // Orders link
        if (myOrders) {
            myOrders.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.OrdersUI && window.OrdersUI.openOrdersPanel) {
                    window.OrdersUI.openOrdersPanel();
                } else {
                    console.error('OrdersUI not found');
                    alert('Orders panel loading...');
                }
                profileDropdown.classList.remove('show');
            });
        }

        // Close modal
        const closeProfileBtn = document.getElementById('closeProfileModal');
        const cancelProfileBtn = document.getElementById('cancelProfileUpdate');
        const profileModal = document.getElementById('profileModal');

        if (closeProfileBtn) {
            closeProfileBtn.addEventListener('click', () => {
                profileModal.style.display = 'none';
            });
        }

        if (cancelProfileBtn) {
            cancelProfileBtn.addEventListener('click', () => {
                profileModal.style.display = 'none';
            });
        }

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target === profileModal) {
                profileModal.style.display = 'none';
            }
        });

        // Form submission
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', handleProfileUpdate);
        }
    }

    // Open Profile Modal and fetch data
    async function openProfileModal() {
        const modal = document.getElementById('profileModal');
        if (!modal) return;

        modal.style.display = 'flex';

        try {
            const user = await window.UserService.getUserProfile();
            if (user) {
                document.getElementById('profileUsername').value = user.username || '';
                document.getElementById('profileWhatsapp').value = user.whatsappNumber || '';
                document.getElementById('profileAlternate').value = user.alternateNumber || '';
                document.getElementById('profileAddress').value = user.address || '';
                document.getElementById('profilePincode').value = user.pincode || '';
                document.getElementById('profileState').value = user.state || '';
                document.getElementById('profileDistrict').value = user.district || '';
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            showToast('Failed to load profile details.', 'error');
        }
    }

    // Handle Profile Update
    async function handleProfileUpdate(e) {
        e.preventDefault();

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating...';

        const userData = {
            whatsappNumber: document.getElementById('profileWhatsapp').value,
            alternateNumber: document.getElementById('profileAlternate').value,
            address: document.getElementById('profileAddress').value,
            pincode: document.getElementById('profilePincode').value,
            state: document.getElementById('profileState').value,
            district: document.getElementById('profileDistrict').value
        };

        try {
            await window.UserService.updateUserProfile(userData);
            showToast('Profile updated successfully!', 'success');
            document.getElementById('profileModal').style.display = 'none';
            // Dispatch event so other components (Cart) can update
            window.dispatchEvent(new CustomEvent('user-updated'));
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast(error.message || 'Failed to update profile.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    }

    // Helper for toast
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) {
            alert(message);
            return;
        }

        toast.textContent = message;
        toast.className = `toast show ${type}`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
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
    // Expose functions globally
    window.AuthState = {
        isLoggedIn,
        getCurrentUser,
        updateNavbar,
        logout: handleLogout,
        openProfileModal // Exposed for Cart
    };

    // Dispatch custom event helper
    function dispatchUserUpdated() {
        window.dispatchEvent(new CustomEvent('user-updated'));
    }

})(window.AuthState = window.AuthState || {});