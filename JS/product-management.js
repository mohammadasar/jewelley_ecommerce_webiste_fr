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

        // Listen for category updates from category-management.js
        document.addEventListener('categoriesUpdated', () => {
            console.log('Categories updated event received, reloading dropdowns...');
            loadCategories();
        });

        // Dynamic Attributes
        document.getElementById('addAttributeBtn').addEventListener('click', () => addAttributeRow());

        // Dynamic Variants
        document.getElementById('addVariantBtn').addEventListener('click', () => addVariantRow());

        // Render empty-state placeholders
        renderAttributesEmpty();
        renderVariantsEmpty();
    }

    // ==================== CATEGORY MANAGEMENT ====================
    async function loadCategories() {
        try {
            console.log('Fetching categories...');
            categories = await ProductService.getAllCategories();
            console.log('Categories loaded:', categories);

            if (!Array.isArray(categories)) {
                console.error('Categories is not an array:', categories);
                return;
            }

            populateCategoryDropdowns();
        } catch (error) {
            console.error('Error loading categories:', error);
            showToast('Error loading categories');
        }
    }

    function populateCategoryDropdowns() {
        // Dropdowns
        const level1 = document.getElementById('categoryLevel1');
        const level2 = document.getElementById('categoryLevel2');
        const level3 = document.getElementById('categoryLevel3');
        const filterSelect = document.getElementById('categoryFilter');

        if (!level1 || !level2 || !level3) return;

        // Reset
        level1.innerHTML = '<option value="">-- Select Main Category --</option>';
        level2.innerHTML = '<option value="">-- Select Sub Category --</option>';
        level3.innerHTML = '<option value="">-- Select Child Category --</option>';
        level2.disabled = true;
        level3.disabled = true;

        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">All Categories</option>';
        }

        // 1. Filter Root Categories (Level 1)
        // Root categories have no parentId or parentId is null/empty string
        const rootCategories = categories.filter(c => !c.parentId);

        rootCategories.forEach(cat => {
            const catId = cat.id || cat._id;
            const option = document.createElement('option');
            option.value = catId;
            option.textContent = cat.name;
            level1.appendChild(option);

            // Populate filter as well (flattened for now, or just roots? let's do all for filter)
            // Actually usually filter is just a flat list or main cats. Let's keep filter simple: all categories
        });

        // Populate Filter with ALL categories for search purposes
        if (filterSelect) {
            categories.forEach(cat => {
                const catId = cat.id || cat._id;
                const option = document.createElement('option');
                option.value = catId;
                option.textContent = cat.name;
                filterSelect.appendChild(option);
            });
        }

        // 2. Setup Event Listeners for Hierarchy
        // Remove old listeners to avoid duplicates if any (though this function is usually called once or on full reload)
        level1.onchange = () => {
            const parentId = level1.value;
            loadSubCategories(parentId, level2);
            // Reset Level 3 when Level 1 changes
            level3.innerHTML = '<option value="">-- Select Child Category --</option>';
            level3.disabled = true;
        };

        level2.onchange = () => {
            const parentId = level2.value;
            loadSubCategories(parentId, level3);
        };
    }

    function loadSubCategories(parentId, targetSelect) {
        // Reset target
        targetSelect.innerHTML = '<option value="">-- Select Category --</option>';

        if (!parentId) {
            targetSelect.disabled = true;
            return;
        }

        const subCategories = categories.filter(c => c.parentId === parentId);

        if (subCategories.length > 0) {
            targetSelect.disabled = false;
            subCategories.forEach(cat => {
                const catId = cat.id || cat._id;
                const option = document.createElement('option');
                option.value = catId;
                option.textContent = cat.name;
                targetSelect.appendChild(option);
            });
        } else {
            targetSelect.disabled = true;
            const option = document.createElement('option');
            option.innerHTML = "No sub-categories";
            targetSelect.appendChild(option);
        }
    }

    function getSelectedCategories() {
        const l1 = document.getElementById('categoryLevel1').value;
        const l2 = document.getElementById('categoryLevel2').value;
        const l3 = document.getElementById('categoryLevel3').value;

        // Return non-empty values
        return [l1, l2, l3].filter(id => id);
    }

    function getCategoryPath() {
        const l1 = document.getElementById('categoryLevel1');
        const l2 = document.getElementById('categoryLevel2');
        const l3 = document.getElementById('categoryLevel3');

        const names = [];
        if (l1.value && l1.selectedOptions[0]) names.push(l1.selectedOptions[0].text);
        if (l2.value && l2.selectedOptions[0]) names.push(l2.selectedOptions[0].text);
        if (l3.value && l3.selectedOptions[0]) names.push(l3.selectedOptions[0].text);

        return names.join(' > ');
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

        // Determine category display
        let categoryName = 'Uncategorized';
        if (product.categoryPath) {
            categoryName = product.categoryPath;
        } else if (product.categoryIds && Array.isArray(product.categoryIds) && product.categoryIds.length > 0) {
            // Find names for IDs
            const names = product.categoryIds.map(id => {
                const c = categories.find(cat => String(cat.id || cat._id) === String(id));
                return c ? c.name : '';
            }).filter(n => n);

            if (names.length > 0) categoryName = names.join(' > ');
        } else {
            const category = categories.find(c => String(c.id || c._id) === String(product.categoryId));
            if (category) categoryName = category.name;
        }

        const mainImage = product.images && product.images.length > 0
            ? getFullImageUrl(product.images[0])
            : 'assets/images/placeholder.svg';
        console.log("image url==", mainImage);

        // Build attributes HTML
        let attributesHtml = '';
        if (product.attributes && Array.isArray(product.attributes) && product.attributes.length > 0) {
            const tags = product.attributes
                .filter(a => a.name)
                .map(a => `<span class="attr-tag"><strong>${a.name}:</strong> ${a.value || '—'}</span>`)
                .join('');
            if (tags) {
                attributesHtml = `
                <div class="product-card__attributes">
                    <div class="product-card__attr-title">Attributes</div>
                    <div class="attr-tag-list">${tags}</div>
                </div>`;
            }
        }

        // Build variants HTML
        let variantsHtml = '';
        if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
            const pills = product.variants.map(v => {
                const colorDot = v.color
                    ? `<span class="v-color-dot" style="background:${v.color.toLowerCase()};"></span>`
                    : '';
                const sizeLabel = v.size ? `${v.size}` : '';
                const colorLabel = v.color ? v.color : '';
                const stockLabel = (v.stock !== undefined && v.stock !== null) ? ` · ${v.stock} pcs` : '';
                return `<span class="variant-pill">${colorDot}${[sizeLabel, colorLabel].filter(Boolean).join(' / ')}${stockLabel}</span>`;
            }).join('');
            if (pills) {
                variantsHtml = `
                <div class="product-card__attributes">
                    <div class="product-card__attr-title">Variants</div>
                    <div class="attr-tag-list">${pills}</div>
                </div>`;
            }
        }

        card.innerHTML = `
            <img src="${mainImage}" alt="${product.productName}" class="product-card__image" 
                 onerror="this.src='assets/images/placeholder.svg'">
            <div class="product-card__content">
                <div class="product-card__header">
                    <h3 class="product-card__title">${product.productName}</h3>
                    <span class="product-card__badge ${product.inStock ? 'badge--in-stock' : 'badge--out-of-stock'}">
                        ${product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                </div>
                <p class="product-card__category">${categoryName}</p>
                <p class="product-card__description">${product.description || 'No description'}</p>
                ${attributesHtml}
                ${variantsHtml}
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
            categoryIds: getSelectedCategories(),
            categoryPath: getCategoryPath(),
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
            images: imageUrls.join('\n'), // Convert array to newline-separated string
            attributes: collectAttributes(),
            variants: collectVariants()
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

        // Reset dropdowns
        populateCategoryDropdowns();

        // Clear uploaded images
        uploadedImages = [];
        imagePreview.innerHTML = '';
        imageUploadInput.value = '';

        // Clear dynamic sections
        document.getElementById('attributesContainer').innerHTML = '';
        document.getElementById('variantsContainer').innerHTML = '';
        renderAttributesEmpty();
        renderVariantsEmpty();
    }

    // ==================== EDIT PRODUCT ====================
    window.editProduct = async function (productId) {
        try {
            const product = await ProductService.getProductById(productId);

            // Populate form
            document.getElementById('productName').value = product.productName || '';
            document.getElementById('description').value = product.description || '';

            // Handle Hierarchical Categories
            const level1 = document.getElementById('categoryLevel1');
            const level2 = document.getElementById('categoryLevel2');
            const level3 = document.getElementById('categoryLevel3');

            // Reset dropdowns first
            populateCategoryDropdowns();

            // Try to find categories. 
            // Case A: Product has explicit categoryIds (new format)
            // Case B: Product has only single categoryId (old format) -> Need to traverse up

            let targetIds = [];
            if (product.categoryIds && Array.isArray(product.categoryIds) && product.categoryIds.length > 0) {
                targetIds = product.categoryIds;
            } else if (product.categoryId) {
                // Traverse up to find the full path
                const path = [];
                let current = categories.find(c => (c.id || c._id) === product.categoryId);
                while (current) {
                    path.unshift(current.id || current._id);
                    if (!current.parentId) break;
                    current = categories.find(c => (c.id || c._id) === current.parentId);
                }
                targetIds = path;
            }

            // Set Level 1
            if (targetIds[0]) {
                level1.value = targetIds[0];
                // Trigger change to load Level 2
                loadSubCategories(targetIds[0], level2);
            }

            // Set Level 2
            if (targetIds[1]) {
                level2.value = targetIds[1];
                // Trigger change to load Level 3
                loadSubCategories(targetIds[1], level3);
            }

            // Set Level 3
            if (targetIds[2]) {
                level3.value = targetIds[2];
            }


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

            // Populate dynamic attributes
            const attrContainer = document.getElementById('attributesContainer');
            attrContainer.innerHTML = '';
            if (product.attributes && Array.isArray(product.attributes) && product.attributes.length > 0) {
                product.attributes.forEach(attr => addAttributeRow(attr.name, attr.value));
            } else {
                renderAttributesEmpty();
            }

            // Populate dynamic variants
            const varContainer = document.getElementById('variantsContainer');
            varContainer.innerHTML = '';
            if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
                product.variants.forEach(v => addVariantRow(v.size, v.color, v.stock));
            } else {
                renderVariantsEmpty();
            }

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
//         const uploadEndpoint = 'http://localhost:8080/api/images/upload';
        const uploadEndpoint = 'https://jewelley-ecommerce-webiste-bk.onrender.com/api/images/upload';

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

    function getFullImageUrl(imagePath) {
        if (!imagePath) return 'assets/images/placeholder.svg';
        if (imagePath.startsWith('http') || imagePath.startsWith('https')) return imagePath;
        if (imagePath.startsWith('data:')) return imagePath;

        // Handle potential incorrect backslashes
        imagePath = imagePath.replace(/\\/g, '/');

        const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
//         return `http://localhost:8080/${cleanPath}`;
        return `https://jewelley-ecommerce-webiste-bk.onrender.com/${cleanPath}`;
    }


    // ==================== DYNAMIC ATTRIBUTES ====================

    function renderAttributesEmpty() {
        const c = document.getElementById('attributesContainer');
        if (c && c.children.length === 0) {
            c.innerHTML = '<div class="dynamic-rows-empty">No attributes yet. Click "Add Attribute" to start.</div>';
        }
    }

    function addAttributeRow(name = '', value = '') {
        const c = document.getElementById('attributesContainer');
        // Remove empty placeholder if present
        const placeholder = c.querySelector('.dynamic-rows-empty');
        if (placeholder) placeholder.remove();

        const row = document.createElement('div');
        row.className = 'dynamic-row';
        row.innerHTML = `
            <input type="text" class="row-input attr-name" placeholder="Attribute name (e.g. Material)" value="${escapeHtml(name)}">
            <span class="row-sep">:</span>
            <input type="text" class="row-input attr-value" placeholder="Value (e.g. Cotton)" value="${escapeHtml(value)}">
            <button type="button" class="btn-remove-row" title="Remove" onclick="this.closest('.dynamic-row').remove(); renderAttributesEmptyCheck();">&#x2715;</button>
        `;
        c.appendChild(row);
    }

    // Exposed so the inline onclick can call it
    window.renderAttributesEmptyCheck = function () {
        const c = document.getElementById('attributesContainer');
        if (c && c.children.length === 0) renderAttributesEmpty();
    };

    function collectAttributes() {
        const rows = document.querySelectorAll('#attributesContainer .dynamic-row');
        const attrs = [];
        rows.forEach(row => {
            const name = row.querySelector('.attr-name').value.trim();
            const value = row.querySelector('.attr-value').value.trim();
            if (name) attrs.push({ name, value });
        });
        return attrs;
    }

    // ==================== DYNAMIC VARIANTS ====================

    function renderVariantsEmpty() {
        const c = document.getElementById('variantsContainer');
        if (c && c.children.length === 0) {
            c.innerHTML = '<div class="dynamic-rows-empty">No variants yet. Click "Add Variant" to start.</div>';
        }
    }

    function addVariantRow(size = '', color = '', stock = '') {
        const c = document.getElementById('variantsContainer');
        const placeholder = c.querySelector('.dynamic-rows-empty');
        if (placeholder) placeholder.remove();

        const row = document.createElement('div');
        row.className = 'dynamic-row';
        row.innerHTML = `
            <input type="text" class="row-input var-size" placeholder="Size (e.g. M, XL, Free)" value="${escapeHtml(String(size))}">
            <span class="row-sep">/</span>
            <input type="text" class="row-input var-color" placeholder="Color (e.g. Red)" value="${escapeHtml(String(color))}">
            <span class="row-sep">/</span>
            <input type="number" class="row-input var-stock" placeholder="Stock" min="0" style="max-width:90px;" value="${stock !== '' ? Number(stock) : ''}">
            <button type="button" class="btn-remove-row" title="Remove" onclick="this.closest('.dynamic-row').remove(); renderVariantsEmptyCheck();">&#x2715;</button>
        `;
        c.appendChild(row);
    }

    window.renderVariantsEmptyCheck = function () {
        const c = document.getElementById('variantsContainer');
        if (c && c.children.length === 0) renderVariantsEmpty();
    };

    function collectVariants() {
        const rows = document.querySelectorAll('#variantsContainer .dynamic-row');
        const variants = [];
        rows.forEach(row => {
            const size  = row.querySelector('.var-size').value.trim();
            const color = row.querySelector('.var-color').value.trim();
            const stockRaw = row.querySelector('.var-stock').value.trim();
            const stock = stockRaw !== '' ? parseInt(stockRaw, 10) : null;
            if (size || color) variants.push({ size, color, stock });
        });
        return variants;
    }

    // ==================== UTILITY: escape HTML ====================
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

})();
