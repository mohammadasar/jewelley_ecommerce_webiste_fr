/**
 * ============================================
 * PRODUCT SERVICE
 * ============================================
 * Handles all product-related API calls
 */

(function () {
    'use strict';

    // Configuration
    const API_BASE_URL = 'http://localhost:8080/api/products';
    const CATEGORY_API_URL = 'http://localhost:8080/api/categories';

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
     * Fetch all products
     * @returns {Promise<Array>}
     */
    async function getAllProducts() {
        try {
            const response = await fetch(`${API_BASE_URL}/all`, {
                method: 'GET',
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    }

    /**
     * Get product by ID
     * @param {string} id - Product ID
     * @returns {Promise<object>}
     */
    async function getProductById(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'GET',
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching product:', error);
            throw error;
        }
    }

    /**
     * Add new product
     * @param {object} productData - Product data
     * @returns {Promise<object>}
     */
    async function addProduct(productData) {
        try {
            const response = await fetch(`${API_BASE_URL}/add`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(productData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error adding product:', error);
            throw error;
        }
    }

    /**
     * Update existing product
     * @param {string} id - Product ID
     * @param {object} productData - Updated product data
     * @returns {Promise<object>}
     */
    async function updateProduct(id, productData) {
        try {
            const response = await fetch(`${API_BASE_URL}/update/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(productData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    }

    /**
     * Delete product
     * @param {string} id - Product ID
     * @returns {Promise<void>}
     */
    async function deleteProduct(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/delete/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.text();
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    }

    /**
     * Search products by name
     * @param {string} query - Search query
     * @returns {Promise<Array>}
     */
    async function searchProducts(query) {
        try {
            const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error searching products:', error);
            throw error;
        }
    }

    /**
     * Get products by category
     * @param {string} categoryId - Category ID
     * @returns {Promise<Array>}
     */
    async function getProductsByCategory(categoryId) {
        try {
            const response = await fetch(`${API_BASE_URL}/category/${categoryId}`, {
                method: 'GET',
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching products by category:', error);
            throw error;
        }
    }

    /**
     * Fetch all categories
     * @returns {Promise<Array>}
     */
    async function getAllCategories() {
        try {
            const response = await fetch(`${CATEGORY_API_URL}/all`, {
                method: 'GET',
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    }

    /**
     * Calculate discount percentage
     * @param {number} mrp - Maximum Retail Price
     * @param {number} price - Selling Price
     * @returns {number}
     */
    function calculateDiscount(mrp, price) {
        if (!mrp || !price || mrp <= 0) return 0;
        return Math.round(((mrp - price) / mrp) * 100);
    }

    /**
     * Parse image URLs from textarea
     * @param {string} imageText - Image URLs text (one per line)
     * @returns {Array<string>}
     */
    function parseImageUrls(imageText) {
        if (!imageText) return [];
        return imageText
            .split('\n')
            .map(url => url.trim())
            .filter(url => url.length > 0);
    }

    /**
     * Format product data for API
     * @param {object} formData - Form data
     * @returns {object}
     */
    function formatProductData(formData) {
        return {
            productName: formData.productName,
            description: formData.description,
            categoryId: formData.categoryId,
            subCategory: formData.subCategory || '',
            price: parseFloat(formData.price) || 0,
            mrp: parseFloat(formData.mrp) || 0,
            discountPercent: parseInt(formData.discountPercent) || 0,
            images: parseImageUrls(formData.images),
            material: formData.material || '',
            color: formData.color || '',
            plating: formData.plating || '',
            size: formData.size || '',
            occasion: formData.occasion || '',
            inStock: formData.inStock,
            quantity: parseInt(formData.quantity) || 0,
            sku: formData.sku || '',
            brand: formData.brand || ''
        };
    }

    // Expose API globally
    window.ProductService = {
        getAllProducts,
        getProductById,
        addProduct,
        updateProduct,
        deleteProduct,
        searchProducts,
        getProductsByCategory,
        getAllCategories,
        calculateDiscount,
        parseImageUrls,
        formatProductData
    };

})();
