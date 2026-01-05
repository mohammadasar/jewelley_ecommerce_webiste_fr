/**
 * ============================================
 * WISHLIST SERVICE
 * ============================================
 * Handles wishlist operations with backend API
 */

(function () {
    'use strict';

    // Configuration
    const API_BASE_URL = 'http://localhost:8080/api/wishlist'; // Update this to your backend URL

    /**
     * Get the current user ID from localStorage
     * @returns {string|null} User ID or null if not logged in
     */
    function getUserId() {
        // Method 1: Try to get from AuthState if available
        if (typeof AuthState !== 'undefined' && AuthState.getCurrentUser) {
            const user = AuthState.getCurrentUser();
            if (user?.id) {
                console.log('User ID from AuthState:', user.id);
                return user.id;
            }
        }

        // Method 2: Try to get directly from localStorage
        try {
            const userStr = localStorage.getItem('jewel_user');
            if (userStr && userStr !== 'undefined' && userStr !== 'null') {
                const user = JSON.parse(userStr);

                // Try different possible field names
                const userId = user.id || user.userId || user._id || user.username || user.whatsappNumber;

                if (userId) {
                    console.log('User ID from localStorage:', userId);
                    return userId;
                }
            }
        } catch (error) {
            console.error('Error parsing user from localStorage:', error);
        }

        // Method 3: Check if token exists (user is logged in but no user object)
        const token = localStorage.getItem('jewel_token');
        if (token) {
            console.warn('Token exists but User ID not found in localStorage. Profile might be incomplete.');
            // Do NOT force logout here. Allow app to try and recover or just use local wishlist.
            return null;
        }

        console.log('No user ID found - user not logged in');
        return null;
    }

    /**
     * Fetch wishlist from backend
     * @returns {Promise<string[]>} Array of product IDs
     */
    async function fetchWishlist() {
        const userId = getUserId();

        if (!userId) {
            // Attempt to recover user profile if token exists
            if (localStorage.getItem('jewel_token') && window.UserService) {
                console.log('Token found but ID missing. Attempting to fetch profile...');
                try {
                    const user = await window.UserService.getUserProfile();
                    if (user && (user.id || user.whatsappNumber)) {
                        userId = user.id || user.whatsappNumber;
                        // Update local storage with full user object is handled by UserService
                        console.log('Profile recovered. User ID:', userId);
                    }
                } catch (e) {
                    console.error('Failed to recover profile:', e);
                }
            }
        }

        if (!userId) {
            console.warn('User not logged in (and recovery failed), using local wishlist');
            return getLocalWishlist();
        }

        try {
            const token = localStorage.getItem('jewel_token');
            const response = await fetch(`${API_BASE_URL}?userId=${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const wishlist = await response.json();

            // The backend returns a Wishlist object with productIds array
            const productIds = wishlist.productIds || [];

            // Sync with localStorage for offline access
            localStorage.setItem('jewel_wishlist', JSON.stringify(productIds));

            return productIds;
        } catch (error) {
            console.error('Error fetching wishlist from backend:', error);
            // Fallback to local storage
            return getLocalWishlist();
        }
    }

    /**
     * Add product to wishlist
     * @param {string|number} productId - Product ID to add
     * @returns {Promise<boolean>} Success status
     */
    async function addToWishlist(productId) {
        const userId = getUserId();

        if (!userId) {
            // Attempt to recover user profile if token exists
            if (localStorage.getItem('jewel_token') && window.UserService) {
                try {
                    const user = await window.UserService.getUserProfile();
                    if (user && (user.id || user.whatsappNumber)) userId = user.id || user.whatsappNumber;
                } catch (e) { console.error('Recovery failed:', e); }
            }
        }

        if (!userId) {
            console.warn('User not logged in, using local wishlist');
            return addToLocalWishlist(productId);
        }

        try {
            const token = localStorage.getItem('jewel_token');
            const response = await fetch(`${API_BASE_URL}/add?userId=${userId}&productId=${productId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const wishlist = await response.json();
            const productIds = wishlist.productIds || [];

            // Sync with localStorage
            localStorage.setItem('jewel_wishlist', JSON.stringify(productIds));

            return true;
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            // Fallback to local storage
            return addToLocalWishlist(productId);
        }
    }

    /**
     * Remove product from wishlist
     * @param {string|number} productId - Product ID to remove
     * @returns {Promise<boolean>} Success status
     */
    async function removeFromWishlist(productId) {
        const userId = getUserId();

        if (!userId) {
            // Attempt to recover user profile if token exists
            if (localStorage.getItem('jewel_token') && window.UserService) {
                try {
                    const user = await window.UserService.getUserProfile();
                    if (user && (user.id || user.whatsappNumber)) userId = user.id || user.whatsappNumber;
                } catch (e) { console.error('Recovery failed:', e); }
            }
        }

        if (!userId) {
            console.warn('User not logged in, using local wishlist');
            return removeFromLocalWishlist(productId);
        }

        try {
            const token = localStorage.getItem('jewel_token');
            const response = await fetch(`${API_BASE_URL}/remove?userId=${userId}&productId=${productId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const wishlist = await response.json();
            const productIds = wishlist.productIds || [];

            // Sync with localStorage
            localStorage.setItem('jewel_wishlist', JSON.stringify(productIds));

            return true;
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            // Fallback to local storage
            return removeFromLocalWishlist(productId);
        }
    }

    /**
     * Sync local wishlist with backend when user logs in
     * @returns {Promise<void>}
     */
    async function syncWishlistOnLogin() {
        const userId = getUserId();

        if (!userId) {
            return;
        }

        try {
            // Get local wishlist
            const localWishlist = getLocalWishlist();

            // Fetch backend wishlist
            const backendWishlist = await fetchWishlist();

            // Merge: add local items to backend if they don't exist
            const itemsToAdd = localWishlist.filter(id => !backendWishlist.includes(id));

            for (const productId of itemsToAdd) {
                await addToWishlist(productId);
            }

            console.log('Wishlist synced successfully');
        } catch (error) {
            console.error('Error syncing wishlist:', error);
        }
    }

    // ==================== LOCAL STORAGE FALLBACK ====================

    /**
     * Get wishlist from localStorage
     * @returns {string[]} Array of product IDs
     */
    function getLocalWishlist() {
        try {
            const savedWishlist = localStorage.getItem('jewel_wishlist');
            return savedWishlist ? JSON.parse(savedWishlist) : [];
        } catch (error) {
            console.error('Error reading local wishlist:', error);
            return [];
        }
    }

    /**
     * Add to local wishlist
     * @param {string|number} productId - Product ID to add
     * @returns {boolean} Success status
     */
    function addToLocalWishlist(productId) {
        try {
            const wishlist = getLocalWishlist();
            if (!wishlist.includes(productId)) {
                wishlist.push(productId);
                localStorage.setItem('jewel_wishlist', JSON.stringify(wishlist));
            }
            return true;
        } catch (error) {
            console.error('Error adding to local wishlist:', error);
            return false;
        }
    }

    /**
     * Remove from local wishlist
     * @param {string|number} productId - Product ID to remove
     * @returns {boolean} Success status
     */
    function removeFromLocalWishlist(productId) {
        try {
            const wishlist = getLocalWishlist();
            const index = wishlist.indexOf(productId);
            if (index > -1) {
                wishlist.splice(index, 1);
                localStorage.setItem('jewel_wishlist', JSON.stringify(wishlist));
            }
            return true;
        } catch (error) {
            console.error('Error removing from local wishlist:', error);
            return false;
        }
    }

    /**
     * Debug function to check authentication status
     * @returns {object} Debug information
     */
    function debugAuth() {
        const token = localStorage.getItem('jewel_token');
        const userStr = localStorage.getItem('jewel_user');
        let user = null;

        try {
            user = userStr ? JSON.parse(userStr) : null;
        } catch (e) {
            console.error('Error parsing user:', e);
        }

        const userId = getUserId();

        const debug = {
            isLoggedIn: !!token,
            hasToken: !!token,
            hasUserObject: !!user,
            userObject: user,
            userId: userId,
            authStateAvailable: typeof AuthState !== 'undefined',
            recommendations: []
        };

        if (!token) {
            debug.recommendations.push('User is not logged in - no token found');
        }

        if (token && !user) {
            debug.recommendations.push('Token exists but no user object - backend should return user data on login');
        }

        if (user && !userId) {
            debug.recommendations.push('User object exists but no ID field found. User object should have "id", "userId", "_id", or "username" field');
        }

        console.log('=== Wishlist Auth Debug ===');
        console.log('Logged In:', debug.isLoggedIn);
        console.log('Has Token:', debug.hasToken);
        console.log('Has User Object:', debug.hasUserObject);
        console.log('User Object:', debug.userObject);
        console.log('User ID:', debug.userId);
        console.log('AuthState Available:', debug.authStateAvailable);
        if (debug.recommendations.length > 0) {
            console.log('Recommendations:');
            debug.recommendations.forEach(r => console.log('  -', r));
        }
        console.log('========================');

        return debug;
    }

    // Expose API globally
    window.WishlistService = {
        fetchWishlist,
        addToWishlist,
        removeFromWishlist,
        syncWishlistOnLogin,
        getLocalWishlist,
        debugAuth  // Add debug function
    };

})();