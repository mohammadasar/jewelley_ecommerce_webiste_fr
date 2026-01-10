/**
 * ============================================
 * CART SERVICE
 * ============================================
 * Handles cart operations with backend API
 */

(function () {
    'use strict';

    // Configuration
    const API_BASE_URL = 'http://localhost:8080/api/cart';

    /**
     * Get the current user ID
     * @returns {string|null} User ID or null if not logged in
     */
    function getUserId() {
        if (typeof AuthState !== 'undefined' && AuthState.getCurrentUser) {
            const user = AuthState.getCurrentUser();
            if (user?.id) return user.id;
        }

        try {
            const userStr = localStorage.getItem('jewel_user');
            if (userStr) {
                const user = JSON.parse(userStr);
                return user.id || user.userId || user._id || user.username || user.whatsappNumber;
            }
        } catch (e) {
            console.error('Error parsing user:', e);
        }
        return null;
    }

    /**
     * Add Item to Cart
     * @param {string} productId 
     * @param {number} qty 
     * @returns {Promise<object|null>} Updated Cart object or null on failure
     */
    async function addToCart(productId, qty = 1) {
        const userId = getUserId();
        if (!userId) return null; // Handle local cart in app.js if not logged in

        try {
            const token = localStorage.getItem('jewel_token');
            const response = await fetch(`${API_BASE_URL}/add?userId=${userId}&productId=${productId}&qty=${qty}`, {
                method: 'POST',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });

            if (!response.ok) throw new Error('Failed to add to cart');
            return await response.json();
        } catch (error) {
            console.error('CartService: Add failed', error);
            throw error;
        }
    }

    /**
     * Get Cart
     * @returns {Promise<object|null>} Cart object
     */
    async function getCart() {
        const userId = getUserId();
        if (!userId) return null;

        try {
            const token = localStorage.getItem('jewel_token');
            const response = await fetch(`${API_BASE_URL}/view?userId=${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });

            if (!response.ok) throw new Error('Failed to fetch cart');
            return await response.json();
        } catch (error) {
            console.error('CartService: Fetch failed', error);
            return null;
        }
    }

    /**
     * Remove Item from Cart
     * @param {string} productId 
     * @returns {Promise<boolean>} Success status
     */
    async function removeFromCart(productId) {
        const userId = getUserId();
        if (!userId) return false;

        try {
            const token = localStorage.getItem('jewel_token');
            const response = await fetch(`${API_BASE_URL}/remove?userId=${userId}&productId=${productId}`, {
                method: 'POST',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });

            return response.ok;
        } catch (error) {
            console.error('CartService: Remove failed', error);
            return false;
        }
    }

    // Expose API
    window.CartService = {
        addToCart,
        getCart,
        removeFromCart
    };

})();
