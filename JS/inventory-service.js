/**
 * ============================================
 * INVENTORY SERVICE
 * ============================================
 * Handles all inventory-related API calls
 */

(function () {
    'use strict';

    // Configuration
    const API_BASE_URL = 'http://localhost:8080/api/inventory';

    /**
     * Get authentication token
     * @returns {string|null}
     */
    function getAuthToken() {
        return localStorage.getItem('jewel_token');
    }

    /**
     * Get request headers with authentication
     * @returns {object}
     */
    function getHeaders() {
        const token = getAuthToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }

    /**
     * Get all inventories
     * @returns {Promise<Array>}
     */
    async function getAllInventories() {
        try {
            const response = await fetch(`${API_BASE_URL}`, {
                method: 'GET',
                headers: getHeaders()
            });

            if (!response.ok) {
                if (response.status === 403) {
                    console.error('Access Forbidden (403). Token sent:', !!getAuthToken());
                    throw new Error('Access denied. You do not have permission to view inventory or your session has expired.');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching inventory:', error);
            throw error;
        }
    }

    /**
     * Get inventory by product ID
     * @param {string} productId
     * @returns {Promise<object>}
     */
    async function getInventoryByProductId(productId) {
        try {
            const response = await fetch(`${API_BASE_URL}/${productId}`, {
                method: 'GET',
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching product inventory:', error);
            throw error;
        }
    }

    /**
     * Update stock quantity
     * @param {string} productId
     * @param {number} quantity
     * @returns {Promise<object>}
     */
    async function updateStock(productId, quantity) {
        try {
            const response = await fetch(`${API_BASE_URL}/${productId}/stock`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ quantity: parseInt(quantity) })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating stock:', error);
            throw error;
        }
    }

    /**
     * Get available products
     * @returns {Promise<Array>}
     */
    async function getAvailableProducts() {
        try {
            const response = await fetch(`${API_BASE_URL}/available`, {
                method: 'GET',
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching available products:', error);
            throw error;
        }
    }

    /**
     * Get out of stock products
     * @returns {Promise<Array>}
     */
    async function getOutOfStockProducts() {
        try {
            const response = await fetch(`${API_BASE_URL}/out-of-stock`, {
                method: 'GET',
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching out of stock products:', error);
            throw error;
        }
    }

    /**
     * Deduct stock after order
     * @param {object} orderRequest
     * @returns {Promise<string>}
     */
    async function deductStock(orderRequest) {
        try {
            const response = await fetch(`${API_BASE_URL}/deduct-stock`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(orderRequest)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.text();
        } catch (error) {
            console.error('Error deducting stock:', error);
            throw error;
        }
    }

    /**
     * Get low stock alerts
     * @returns {Promise<Array>}
     */
    async function getLowStockAlerts() {
        try {
            const response = await fetch(`${API_BASE_URL}/low-stock`, {
                method: 'GET',
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching low stock alerts:', error);
            throw error;
        }
    }

    // Expose API globally
    window.InventoryService = {
        getAllInventories,
        getInventoryByProductId,
        updateStock,
        getAvailableProducts,
        getAvailableProducts,
        getOutOfStockProducts,
        deductStock,
        getLowStockAlerts,
        deductStockAfterOrder: deductStock
    };

})();
