/**
 * ============================================
 * ORDER SERVICE
 * ============================================
 * Handles all order-related API calls
 */

(function () {
    'use strict';

    const API_BASE_URL = 'http://localhost:8080/api/orders';

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
     * Place a new order
     * @param {object} orderData 
     * @returns {Promise<object>}
     */
    async function placeOrder(orderData) {
        try {
            const response = await fetch(`${API_BASE_URL}/place`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error placing order:', error);
            throw error;
        }
    }

    /**
     * Get all orders (Admin)
     * @returns {Promise<Array>}
     */
    async function getAllOrders() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/all`, {
                method: 'GET',
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }
    }

    /**
     * Update order status (Admin)
     * @param {string} id 
     * @param {string} status 
     * @returns {Promise<object>}
     */
    async function updateOrderStatus(id, status) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/status/${id}?status=${status}`, {
                method: 'PUT',
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    }

    /**
     * Confirm Payment (Admin)
     * @param {string} id 
     * @param {string} paymentMode 
     * @param {string} paymentRefId 
     * @returns {Promise<object>}
     */
    async function confirmPayment(id, paymentMode, paymentRefId) {
        try {
            const queryParams = new URLSearchParams({
                paymentMode: paymentMode,
                paymentRefId: paymentRefId || ''
            });

            const response = await fetch(`${API_BASE_URL}/admin/confirm-payment/${id}?${queryParams}`, {
                method: 'PUT',
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error confirming payment:', error);
            throw error;
        }
    }

    /**
     * Get Sales Report (Admin)
     * @returns {Promise<number>} Total sales amount
     */
    async function getSalesReport() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/sales-report`, {
                method: 'GET',
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching sales report:', error);
            throw error;
        }
    }

    window.OrderService = {
        placeOrder,
        getAllOrders,
        updateOrderStatus,
        confirmPayment,
        getSalesReport
    };

})();
