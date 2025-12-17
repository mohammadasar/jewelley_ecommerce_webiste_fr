/**
 * ============================================
 * INVOICE SERVICE
 * ============================================
 * Handles invoice-related API calls
 */

(function () {
    'use strict';

    // Assuming the base URL based on previous patterns
    const API_BASE_URL = 'http://localhost:8080/api/invoices';

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
     * Generate Invoice for an Order
     * POST /api/invoices/admin/generate/{orderId}
     */
    async function generateInvoice(orderId) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/generate/${orderId}`, {
                method: 'POST',
                headers: getHeaders()
            });

            if (!response.ok) {
                // If 409 Conflict, it might mean already exists, handle appropriately
                const errorText = await response.text();
                throw new Error(errorText || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error generating invoice:', error);
            throw error;
        }
    }

    /**
     * Get Invoice by Order ID
     * GET /api/invoices/order/{orderId}
     */
    async function getInvoiceByOrderId(orderId) {
        try {
            const response = await fetch(`${API_BASE_URL}/order/${orderId}`, {
                method: 'GET',
                headers: getHeaders()
            });

            if (response.status === 404) {
                return null; // Invoice not found (standard REST)
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            return text ? JSON.parse(text) : null; // Handle empty body (Spring returns null/empty for missing object)
        } catch (error) {
            console.error('Error fetching invoice:', error);
            throw error;
        }
    }

    window.InvoiceService = {
        generateInvoice,
        getInvoiceByOrderId
    };

})();
