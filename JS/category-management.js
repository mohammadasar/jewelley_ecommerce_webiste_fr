/**
 * ============================================
 * CATEGORY MANAGEMENT
 * ============================================
 * Handles category CRUD operations independently
 */

(function () {
    'use strict';

    // Configuration
    const API_BASE_URL = 'http://localhost:8080/api/categories';

    // State
    let categories = [];
    let currentEditId = null;

    // DOM Elements
    const categoryForm = document.getElementById('categoryForm');
    const categoryTableBody = document.getElementById('categoryTableBody');
    const parentCategorySelect = document.getElementById('parentCategoryId');
    const btnSubmitCategory = document.getElementById('btnSubmitCategory');
    const btnSubmitCategoryText = document.getElementById('btnSubmitCategoryText');
    const btnResetCategory = document.getElementById('btnResetCategory');

    // ==================== INITIALIZATION ====================
    document.addEventListener('DOMContentLoaded', () => {
        // Only run if elements exist (to prevent errors if HTML isn't updated yet)
        if (categoryForm) {
            setupEventListeners();
            loadCategories();
        }
    });

    // ==================== EVENT LISTENERS ====================
    function setupEventListeners() {
        // Form submission
        categoryForm.addEventListener('submit', handleFormSubmit);

        // Reset form
        btnResetCategory.addEventListener('click', resetForm);
    }

    // ==================== API CALLS ====================
    async function loadCategories() {
        try {
            const res = await fetch(`${API_BASE_URL}/all`, {
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to fetch categories');

            categories = await res.json();
            renderCategoryTable();
            populateParentDropdown();
        } catch (error) {
            console.error('Error loading categories:', error);
            showToast('Error loading categories', 'error');
        }
    }

    async function addCategory(data) {
        const res = await fetch(`${API_BASE_URL}/add`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to add category');
        return await res.json();
    }

    async function updateCategory(id, data) {
        const res = await fetch(`${API_BASE_URL}/update/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to update category');
        return await res.json();
    }

    async function deleteCategory(id) {
        const res = await fetch(`${API_BASE_URL}/delete/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete category');
        return await res.text();
    }

    // ==================== HANDLERS ====================
    async function handleFormSubmit(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('categoryName').value.trim(),
            description: document.getElementById('categoryDescription').value.trim(),
            parentId: document.getElementById('parentCategoryId').value || null
        };

        if (!formData.name) {
            showToast('Category name is required', 'error');
            return;
        }

        try {
            setLoading(true);

            if (currentEditId) {
                await updateCategory(currentEditId, formData);
                showToast('Category updated successfully!', 'success');
            } else {
                await addCategory(formData);
                showToast('Category added successfully!', 'success');
            }

            resetForm();
            await loadCategories();

            // Dispatch event to notify product-management.js to reload its dropdowns
            // (Optional bonus feature for better UX)
            if (window.ProductService) {
                // Ideally product management would listen for this, but for now
                // a manual reload of the page or just re-fetching happens independently
            }

        } catch (error) {
            console.error('Error saving category:', error);
            showToast('Error saving category', 'error');
        } finally {
            setLoading(false);
        }
    }

    window.editCategory = function (id) {
        const category = categories.find(c => (c.id || c._id) === id);
        if (!category) return;

        currentEditId = id;
        document.getElementById('categoryName').value = category.name || '';
        document.getElementById('categoryDescription').value = category.description || '';
        document.getElementById('parentCategoryId').value = category.parentId || '';

        btnSubmitCategoryText.textContent = 'Update Category';
        categoryForm.scrollIntoView({ behavior: 'smooth' });
    };

    window.promptDeleteCategory = async function (id) {
        if (confirm('Are you sure you want to delete this category?')) {
            try {
                await deleteCategory(id);
                showToast('Category deleted', 'success');
                await loadCategories();
            } catch (error) {
                console.error('Error deleting category:', error);
                showToast('Failed to delete category', 'error');
            }
        }
    };

    function resetForm() {
        categoryForm.reset();
        currentEditId = null;
        btnSubmitCategoryText.textContent = 'Add Category';
    }

    // ==================== RENDERING ====================
    function renderCategoryTable() {
        if (!categoryTableBody) return;
        categoryTableBody.innerHTML = '';

        if (categories.length === 0) {
            categoryTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 1rem;">No categories found.</td></tr>';
            return;
        }

        categories.forEach(cat => {
            const catId = cat.id || cat._id;
            const parentName = getCategoryName(cat.parentId);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 1rem; border-bottom: 1px solid #eee;"><strong>${cat.name}</strong></td>
                <td style="padding: 1rem; border-bottom: 1px solid #eee;"><span style="color: #718096; font-size: 0.9em;">${parentName}</span></td>
                <td style="padding: 1rem; border-bottom: 1px solid #eee;">${cat.description || '-'}</td>
                <td style="padding: 1rem; border-bottom: 1px solid #eee;">
                    <button class="btn-icon btn-icon--edit" onclick="editCategory('${catId}')" title="Edit">✏️</button>
                    <button class="btn-icon btn-icon--delete" onclick="promptDeleteCategory('${catId}')" title="Delete">🗑️</button>
                </td>
            `;
            categoryTableBody.appendChild(tr);
        });
    }

    function populateParentDropdown() {
        if (!parentCategorySelect) return;

        // Save current selection to restore after reload if possible
        const currentVal = parentCategorySelect.value;

        parentCategorySelect.innerHTML = '<option value="">-- No Parent (Top Level) --</option>';

        categories.forEach(cat => {
            // Prevent selecting itself as parent (simple check)
            const catId = cat.id || cat._id;
            if (currentEditId && currentEditId === catId) return;

            const option = document.createElement('option');
            option.value = catId;
            option.textContent = cat.name;
            parentCategorySelect.appendChild(option);
        });

        if (currentVal) parentCategorySelect.value = currentVal;
    }

    // ==================== UTILS ====================
    function getCategoryName(id) {
        if (!id) return '-';
        const cat = categories.find(c => (c.id || c._id) === id);
        return cat ? cat.name : id;
    }

    function getHeaders() {
        const token = localStorage.getItem('jewel_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }

    function setLoading(isLoading) {
        btnSubmitCategory.disabled = isLoading;
        btnSubmitCategoryText.textContent = isLoading ?
            (currentEditId ? 'Updating...' : 'Adding...') :
            (currentEditId ? 'Update Category' : 'Add Category');
    }

    // Reuse existing toast logic if available, otherwise simple fallback
    function showToast(msg, type) {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = msg;
            toast.className = 'toast show';
            // Add specific color class if you want, but sticking to existing style
            setTimeout(() => toast.classList.remove('show'), 3000);
        } else {
            alert(msg);
        }
    }

})();
