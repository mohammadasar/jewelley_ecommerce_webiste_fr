/**
 * ============================================
 * USER SERVICE
 * ============================================
 * Handles user profile and address management
 */

(function () {
    'use strict';

    const API_BASE_URL = 'http://localhost:8080/api/user';

    function getAuthToken() {
        return localStorage.getItem('jewel_token');
    }

    function getHeaders() {
        const token = getAuthToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }

    /**
     * Get Current User Profile
     * GET /api/user/me
     */
    async function getUserProfile() {
        try {
            const response = await fetch(`${API_BASE_URL}/me`, {
                method: 'GET',
                headers: getHeaders()
            });

            if (!response.ok) {
                if (response.status === 401) return null;
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    }

    /**
     * Update User Profile
     * PUT /api/user/update
     */
    async function updateUserProfile(userData) {
        try {
            const response = await fetch(`${API_BASE_URL}/update`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP error! status: ${response.status}`);
            }

            const updatedUser = await response.json();

            // Sync local storage
            localStorage.setItem('jewel_user', JSON.stringify(updatedUser));

            return updatedUser;
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    }

    window.UserService = {
        getUserProfile,
        updateUserProfile
    };

})();