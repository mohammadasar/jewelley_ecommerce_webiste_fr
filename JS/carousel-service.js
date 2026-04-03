/**
 * ============================================
 * CAROUSEL SERVICE
 * ============================================
 * Handles hero carousel data and persistence
 */

const CarouselService = (function () {
    'use strict';

    const API_BASE_URL = 'https://jewelley-ecommerce-webiste-bk.onrender.com/api/banners';

    /**
     * Get all banners
     */
    async function getSlides() {
        try {
            const response = await fetch(API_BASE_URL);
            if (!response.ok) throw new Error('Fetch failed');
            const data = await response.json();

            // Map backend "imageUrl" to frontend "image" if needed
            return data.map(item => ({
                ...item,
                image: item.imageUrl // Map for carousel rendering compatibility
            }));
        } catch (error) {
            console.error('Error fetching banners:', error);
            return [];
        }
    }

    /**
     * Upload a new banner (using FormData for MultipartFile)
     */
    async function addSlide(formData) {
        try {
            const response = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem('jewel_token')}`
                },
                body: formData // Note: No Content-Type header so browser sets boundary
            });
            return response.ok;
        } catch (error) {
            console.error('Error uploading banner:', error);
            return false;
        }
    }

    /**
     * Update an existing banner
     */
    async function updateSlide(id, formData) {
        try {
            const response = await fetch(`${API_BASE_URL}/update/${id}`, {
                method: 'PUT',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem('jewel_token')}`
                },
                body: formData
            });
            return response.ok;
        } catch (error) {
            console.error('Error updating banner:', error);
            return false;
        }
    }

    /**
     * Delete a banner
     */
    async function deleteSlide(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem('jewel_token')}`
                },
            });
            return response.ok;
        } catch (error) {
            console.error('Error deleting banner:', error);
            return false;
        }
    }

    return {
        getSlides,
        addSlide,
        updateSlide,
        deleteSlide
    };
})();

