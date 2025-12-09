/**
 * ============================================
 * PRODUCT MANAGEMENT
 * ============================================
 * Main JavaScript for product management page
 */

(function () {
    'use strict';

    // State
    let products = [];
    let categories = [];
    let currentEditId = null;
    let productToDelete = null;
    let uploadedImages = []; // Store uploaded image files

    // DOM Elements
    const productForm = document.getElementById('productForm');
    const productsGrid = document.getElementById('productsGrid');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const resetBtn = document.getElementById('resetBtn');
    const submitBtn = document.getElementById('submitBtn');
    const submitBtnText = document.getElementById('submitBtnText');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const deleteModal = document.getElementById('deleteModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // Image upload elements
    const imageUploadInput = document.getElementById('imageUpload');
    const imageUploadLabel = document.querySelector('.image-upload-label');
    const imagePreview = document.getElementById('imagePreview');

    // Price calculation elements
    const mrpInput = document.getElementById('mrp');
    const priceInput = document.getElementById('price');
    const discountInput = document.getElementById('discountPercent');

    // ==================== INITIALIZATION ====================
    document.addEventListener('DOMContentLoaded', () => {
        checkAuthentication();
        initializeApp();
    });

    function checkAuthentication() {
        const token = localStorage.getItem('jewel_token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        // Check if user is admin
        const userStr = localStorage.getItem('jewel_user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.role !== 'ADMIN') {
                    alert('Access denied. Admin privileges required.');
                    window.location.href = 'index.html';
                }
            } catch (e) {
                console.error('Error parsing user:', e);
            }
        }
    }

    async function initializeApp() {
        setupEventListeners();
        await loadCategories();
        await loadProducts();
    }

    // ==================== EVENT LISTENERS ====================
    function setupEventListeners() {
        // Form submission
        productForm.addEventListener('submit', handleFormSubmit);

        // Reset form
        resetBtn.addEventListener('click', resetForm);

        // Search
        searchInput.addEventListener('input', handleSearch);

        // Category filter
        categoryFilter.addEventListener('change', handleCategoryFilter);

        // Price calculation
        mrpInput.addEventListener('input', calculateDiscountPercent);
        priceInput.addEventListener('input', calculateDiscountPercent);

        // Image upload
        imageUploadInput.addEventListener('change', handleImageSelect);

        // Drag and drop
        imageUploadLabel.addEventListener('dragover', handleDragOver);
        imageUploadLabel.addEventListener('dragleave', handleDragLeave);
        imageUploadLabel.addEventListener('drop', handleDrop);

        // Delete modal
        confirmDeleteBtn.addEventListener('click', confirmDelete);
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
        deleteModal.querySelector('.modal__overlay').addEventListener('click', closeDeleteModal);

        // Logout
        logoutBtn.addEventListener('click', handleLogout);
    }

    // ==================== CATEGORY MANAGEMENT ====================
    async function loadCategories() {
        try {
            categories = await ProductService.getAllCategories();
            populateCategoryDropdowns();
        } catch (error) {
            console.error('Error loading categories:', error);
            showToast('Error loading categories');
        }
    }

    function populateCategoryDropdowns() {
        const categorySelect = document.getElementById('categoryId');
        const filterSelect = document.getElementById('categoryFilter');

        // Clear existing options (except first)
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        filterSelect.innerHTML = '<option value="">All Categories</option>';

        categories.forEach(category => {
            const option1 = document.createElement('option');
            option1.value = category.id;
            option1.textContent = category.name;
            categorySelect.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = category.id;
            option2.textContent = category.name;
            filterSelect.appendChild(option2);
        });
    }

    // ==================== PRODUCT MANAGEMENT ====================
    async function loadProducts() {
        try {
            loadingState.style.display = 'block';
            emptyState.style.display = 'none';
            productsGrid.innerHTML = '';

            products = await ProductService.getAllProducts();
            renderProducts(products);
            updateStats();
        } catch (error) {
            console.error('Error loading products:', error);
            showToast('Error loading products');
            emptyState.style.display = 'block';
        } finally {
            loadingState.style.display = 'none';
        }
    }

    function renderProducts(productsToRender) {
        productsGrid.innerHTML = '';

        if (productsToRender.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        productsToRender.forEach(product => {
            const productCard = createProductCard(product);
            productsGrid.appendChild(productCard);
        });
    }

    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.productId = product.id;

        const category = categories.find(c => c.id === product.categoryId);
        const categoryName = category ? category.name : 'Uncategorized';

        const mainImage = product.images && product.images.length > 0
            ? product.images[0]
            : 'https://via.placeholder.com/300x200?text=No+Image';
        console.log("image url==", mainImage);

        card.innerHTML = `
            <img src="${mainImage}" alt="${product.productName}" class="product-card__image" 
                 onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
            <div class="product-card__content">
                <div class="product-card__header">
                    <h3 class="product-card__title">${product.productName}</h3>
                    <span class="product-card__badge ${product.inStock ? 'badge--in-stock' : 'badge--out-of-stock'}">
                        ${product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                </div>
                <p class="product-card__category">${categoryName}</p>
                <p class="product-card__description">${product.description || 'No description'}</p>
                <div class="product-card__pricing">
                    <span class="product-card__price">₹${product.price.toLocaleString()}</span>
                    ${product.mrp > product.price ? `
                        <span class="product-card__mrp">₹${product.mrp.toLocaleString()}</span>
                        <span class="product-card__discount">${product.discountPercent}% OFF</span>
                    ` : ''}
                </div>
                <div class="product-card__meta">
                    <span>SKU: ${product.sku || 'N/A'}</span>
                    <span>Qty: ${product.quantity}</span>
                </div>
                <div class="product-card__actions">
                    <button class="btn-icon btn-icon--edit" onclick="editProduct('${product.id}')" title="Edit">
                        ✏️
                    </button>
                    <button class="btn-icon btn-icon--delete" onclick="deleteProductPrompt('${product.id}')" title="Delete">
                        🗑️
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    // ==================== FORM HANDLING ====================
    async function handleFormSubmit(e) {
        e.preventDefault();

        // Upload images first if any
        let imageUrls = [];
        if (uploadedImages.length > 0) {
            try {
                submitBtnText.textContent = 'Uploading images...';
                imageUrls = await uploadImagesToServer(uploadedImages);
            } catch (error) {
                console.error('Error uploading images:', error);
                showToast('Error uploading images');
                return;
            }
        }

        const formData = {
            productName: document.getElementById('productName').value,
            description: document.getElementById('description').value,
            categoryId: document.getElementById('categoryId').value,
            subCategory: document.getElementById('subCategory').value,
            mrp: document.getElementById('mrp').value,
            price: document.getElementById('price').value,
            discountPercent: document.getElementById('discountPercent').value,
            material: document.getElementById('material').value,
            color: document.getElementById('color').value,
            plating: document.getElementById('plating').value,
            size: document.getElementById('size').value,
            occasion: document.getElementById('occasion').value,
            quantity: document.getElementById('quantity').value,
            inStock: document.getElementById('inStock').checked,
            sku: document.getElementById('sku').value,
            brand: document.getElementById('brand').value,
            images: imageUrls.join('\n') // Convert array to newline-separated string
        };

        const productData = ProductService.formatProductData(formData);

        try {
            submitBtn.disabled = true;
            submitBtnText.textContent = currentEditId ? 'Updating...' : 'Adding...';

            if (currentEditId) {
                await ProductService.updateProduct(currentEditId, productData);
                showToast('Product updated successfully!');
            } else {
                await ProductService.addProduct(productData);
                showToast('Product added successfully!');
            }

            resetForm();
            await loadProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            showToast('Error saving product. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtnText.textContent = currentEditId ? 'Update Product' : 'Add Product';
        }
    }

    function resetForm() {
        productForm.reset();
        currentEditId = null;
        submitBtnText.textContent = 'Add Product';
        document.getElementById('inStock').checked = true;
        discountInput.value = '0';

        // Clear uploaded images
        uploadedImages = [];
        imagePreview.innerHTML = '';
        imageUploadInput.value = '';
    }

    // ==================== EDIT PRODUCT ====================
    window.editProduct = async function (productId) {
        try {
            const product = await ProductService.getProductById(productId);

            // Populate form
            document.getElementById('productName').value = product.productName || '';
            document.getElementById('description').value = product.description || '';
            document.getElementById('categoryId').value = product.categoryId || '';
            document.getElementById('subCategory').value = product.subCategory || '';
            document.getElementById('mrp').value = product.mrp || 0;
            document.getElementById('price').value = product.price || 0;
            document.getElementById('discountPercent').value = product.discountPercent || 0;
            document.getElementById('material').value = product.material || '';
            document.getElementById('color').value = product.color || '';
            document.getElementById('plating').value = product.plating || '';
            document.getElementById('size').value = product.size || '';
            document.getElementById('occasion').value = product.occasion || '';
            document.getElementById('quantity').value = product.quantity || 0;
            document.getElementById('inStock').checked = product.inStock;
            document.getElementById('sku').value = product.sku || '';
            document.getElementById('brand').value = product.brand || '';

            // Note: For edit, images are already on server, so we don't need to populate upload
            // You could display existing images in preview if needed

            currentEditId = productId;
            submitBtnText.textContent = 'Update Product';

            // Scroll to form
            productForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (error) {
            console.error('Error loading product for edit:', error);
            showToast('Error loading product details');
        }
    };

    // ==================== DELETE PRODUCT ====================
    window.deleteProductPrompt = function (productId) {
        productToDelete = productId;
        deleteModal.style.display = 'flex';
    };

    async function confirmDelete() {
        if (!productToDelete) return;

        try {
            await ProductService.deleteProduct(productToDelete);
            showToast('Product deleted successfully!');
            closeDeleteModal();
            await loadProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            showToast('Error deleting product');
        }
    }

    function closeDeleteModal() {
        deleteModal.style.display = 'none';
        productToDelete = null;
    }

    // ==================== SEARCH & FILTER ====================
    async function handleSearch(e) {
        const query = e.target.value.trim();

        if (query.length === 0) {
            renderProducts(products);
            return;
        }

        try {
            const results = await ProductService.searchProducts(query);
            renderProducts(results);
        } catch (error) {
            console.error('Error searching products:', error);
        }
    }

    async function handleCategoryFilter(e) {
        const categoryId = e.target.value;

        if (!categoryId) {
            renderProducts(products);
            return;
        }

        try {
            const results = await ProductService.getProductsByCategory(categoryId);
            renderProducts(results);
        } catch (error) {
            console.error('Error filtering products:', error);
        }
    }

    // ==================== IMAGE UPLOAD HANDLING ====================
    function handleImageSelect(e) {
        const files = Array.from(e.target.files);
        processImages(files);
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        imageUploadLabel.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        imageUploadLabel.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        imageUploadLabel.classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        processImages(files);
    }

    function processImages(files) {
        files.forEach(file => {
            uploadedImages.push(file);
            displayImagePreview(file);
        });
    }

    function displayImagePreview(file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const previewItem = document.createElement('div');
            previewItem.className = 'image-preview-item';
            previewItem.dataset.fileName = file.name;

            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = file.name;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'image-preview-remove';
            removeBtn.innerHTML = '×';
            removeBtn.type = 'button';
            removeBtn.onclick = () => removeImage(file.name);

            previewItem.appendChild(img);
            previewItem.appendChild(removeBtn);

            // Mark first image as main
            if (uploadedImages.length === 1) {
                const mainBadge = document.createElement('div');
                mainBadge.className = 'image-preview-main';
                mainBadge.textContent = 'Main Image';
                previewItem.appendChild(mainBadge);
            }

            imagePreview.appendChild(previewItem);
        };

        reader.readAsDataURL(file);
    }

    function removeImage(fileName) {
        // Remove from uploaded images array
        uploadedImages = uploadedImages.filter(img => img.name !== fileName);

        // Remove preview element
        const previewItem = imagePreview.querySelector(`[data-file-name="${fileName}"]`);
        if (previewItem) {
            previewItem.remove();
        }

        // Update main badge if needed
        if (uploadedImages.length > 0) {
            const firstPreview = imagePreview.firstElementChild;
            if (firstPreview && !firstPreview.querySelector('.image-preview-main')) {
                const mainBadge = document.createElement('div');
                mainBadge.className = 'image-preview-main';
                mainBadge.textContent = 'Main Image';
                firstPreview.appendChild(mainBadge);
            }
        }
    }

    async function uploadImagesToServer(files) {
        const imageUrls = [];
        const uploadEndpoint = 'http://localhost:8080/api/images/upload';

        for (const file of files) {
            try {
                const formData = new FormData();
                formData.append('file', file);

                const token = localStorage.getItem('jewel_token');
                const response = await fetch(uploadEndpoint, {
                    method: 'POST',
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : ''
                    },
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`Upload failed: ${response.status}`);
                }

                // Backend returns the image URL directly as text
                const imageUrl = await response.text();
                imageUrls.push(imageUrl);
            } catch (error) {
                console.error('Error uploading image:', file.name, error);
                showToast(`Failed to upload ${file.name}`);
                throw error;
            }
        }

        return imageUrls;
    }

    // ==================== UTILITIES ====================
    function calculateDiscountPercent() {
        const mrp = parseFloat(mrpInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const discount = ProductService.calculateDiscount(mrp, price);
        discountInput.value = discount;
    }

    function updateStats() {
        document.getElementById('totalProducts').textContent = products.length;
        const inStockCount = products.filter(p => p.inStock).length;
        document.getElementById('inStockCount').textContent = inStockCount;
    }

    function handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('jewel_token');
            localStorage.removeItem('jewel_user');
            window.location.href = 'login.html';
        }
    }

    function showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

})();
