/**
 * ============================================
 * ADMIN CAROUSEL MANAGEMENT (JS)
 * ============================================
 * Handles slide uploads, deletions, and updates
 */

(function () {
    'use strict';

    // State
    const state = {
        slides: [],
        isEditing: false,
        currentSlideId: null
    };

    // DOM Elements
    const slideGrid = document.getElementById('slideGrid');
    const uploadSection = document.getElementById('uploadSection');
    const slideForm = document.getElementById('slideForm');
    const formTitle = document.getElementById('formTitle');
    const submitBtn = document.getElementById('submitBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const previewBox = document.getElementById('previewBox');
    const imageFile = document.getElementById('imageFile');
    const toast = document.getElementById('toast');

    // Initialize
    document.addEventListener('DOMContentLoaded', async () => {
        // 1. Check access
        if (!checkAdminAccess()) return;
        
        // 2. Load slides
        await loadSlides();
        
        // 3. Setup listeners
        setupEventListeners();
    });

    // Authentication Guard
    function checkAdminAccess() {
        const token = localStorage.getItem('jewel_token');
        const userStr = localStorage.getItem('jewel_user');

        if (!token || !userStr) {
            window.location.href = 'login.html';
            return false;
        }

        try {
            const user = JSON.parse(userStr);
            if (user.role !== 'ADMIN') {
                window.location.href = 'index.html';
                return false;
            }
        } catch (error) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    // Fetch & Render Slides
    async function loadSlides() {
        if (typeof CarouselService === 'undefined') {
            slideGrid.innerHTML = '<div class="empty-state"><p style="color:#ef4444;">Error: CarouselService not loaded.</p></div>';
            return;
        }

        try {
            state.slides = await CarouselService.getSlides();
            renderSlides();
        } catch (error) {
            console.error('Error loading slides:', error);
            showToast('Failed to load slides');
        }
    }

    function renderSlides() {
        if (!state.slides || state.slides.length === 0) {
            slideGrid.innerHTML = `
                <div class="empty-state">
                    <p style="font-size: 1.5rem; font-weight: 700; color: var(--color-text); margin-bottom: 0.5rem;">No active banners found</p>
                    <p style="color: var(--color-text-muted); margin-bottom: 1.5rem;">Upload your first hero slide using the form above.</p>
                </div>
            `;
            return;
        }

        slideGrid.innerHTML = state.slides.map(slide => `
            <div class="slide-card" data-id="${slide.id}">
                <div class="slide-card__image-container">
                    <img src="${slide.image}" alt="${slide.title}" class="slide-card__image" onerror="this.src='assets/images/placeholder.svg'">
                    ${slide.subtitle ? `<span class="slide-card__badge">${slide.subtitle}</span>` : ''}
                </div>
                <div class="slide-card__content" style="padding: 1.5rem;">
                    <h3 class="slide-card__title">${slide.title}</h3>
                    <div class="slide-card__price">
                        ${slide.price}
                        ${slide.oldPrice ? `<span class="slide-card__old-price">${slide.oldPrice}</span>` : ''}
                    </div>
                </div>
                <div class="slide-card__actions" style="padding: 1.5rem; border-top: 1px solid var(--color-border);">
                    <button class="btn-action btn-edit" onclick="editSlide('${slide.id}')">Edit Banner</button>
                    <button class="btn-action btn-delete" onclick="deleteSlide('${slide.id}')">Delete Slide</button>
                </div>
            </div>
        `).join('');
    }

    // Event Listeners
    function setupEventListeners() {
        cancelEditBtn.onclick = () => {
            resetForm();
        };

        // Image Selection (File Preview)
        imageFile.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (re) => {
                    previewBox.innerHTML = `<img src="${re.target.result}" style="width:100%; height:100%; object-fit:cover;">`;
                };
                reader.readAsDataURL(file);
            }
        };

        // Form Submit
        slideForm.onsubmit = async (e) => {
            e.preventDefault();
            
            const slideId = document.getElementById('slideId').value;
            const formData = new FormData();
            
            formData.append('title', document.getElementById('slideTitle').value);
            formData.append('subtitle', document.getElementById('slideSubtitle').value);
            formData.append('description', document.getElementById('slideDescription').value);
            formData.append('price', document.getElementById('slidePrice').value);
            formData.append('oldPrice', document.getElementById('slideOldPrice').value);
            
            const file = imageFile.files[0];
            if (file) {
                formData.append('image', file);
            }

            let success = false;
            showToast('Processing request...');
            
            if (slideId) {
                success = await CarouselService.updateSlide(slideId, formData);
            } else {
                if (!file) {
                    showToast('Please select an image file');
                    return;
                }
                success = await CarouselService.addSlide(formData);
            }

            if (success) {
                showToast(slideId ? 'Banner updated!' : 'Banner added successfully!');
                resetForm();
                await loadSlides();
                // Smooth scroll to grid
                slideGrid.scrollIntoView({ behavior: 'smooth' });
            } else {
                showToast('Action failed. Check console.');
            }
        };
    }

    function resetForm() {
        slideForm.reset();
        document.getElementById('slideId').value = '';
        formTitle.textContent = 'Add New Banner';
        submitBtn.textContent = 'Upload & Publish Banner';
        cancelEditBtn.style.display = 'none';
        previewBox.innerHTML = '<span style="font-size: 2rem; color: #cbd5e0;">🖼️</span>';
    }

    // Exposure for onclick handlers
    window.editSlide = (id) => {
        const slide = state.slides.find(s => s.id === id);
        if (slide) {
            document.getElementById('slideId').value = slide.id;
            document.getElementById('slideTitle').value = slide.title;
            document.getElementById('slidePrice').value = slide.price || '';
            document.getElementById('slideOldPrice').value = slide.oldPrice || '';
            document.getElementById('slideSubtitle').value = slide.subtitle || '';
            document.getElementById('slideDescription').value = slide.description || '';
            
            previewBox.innerHTML = `<img src="${slide.image}" style="width:100%; height:100%; object-fit:cover;">`;
            
            formTitle.textContent = 'Edit Banner Configuration';
            submitBtn.textContent = 'Update Existing Banner';
            cancelEditBtn.style.display = 'block';
            
            // Smooth scroll to form
            uploadSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    window.deleteSlide = async (id) => {
        if (confirm('Permanently delete this banner from the homepage carousel?')) {
            const success = await CarouselService.deleteSlide(id);
            if (success) {
                showToast('Banner deleted');
                await loadSlides();
            }
        }
    };

    function showToast(msg) {
        toast.textContent = msg;
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
})();
