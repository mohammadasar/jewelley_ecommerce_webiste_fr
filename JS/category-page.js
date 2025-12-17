/**
 * CATEGORY PAGE CONTROLLER
 * Handles logic for category.html
 */

(function () {
    'use strict';

    // State
    const state = {
        currentCategoryId: null,
        products: [],
        filteredProducts: [],
        categories: [],
        searchQuery: ''
    };

    // DOM Elements
    const pageTitle = document.getElementById('pageTitle');
    const subCategorySection = document.getElementById('subCategorySection');
    const subCategoryBar = document.getElementById('subCategoryBar');
    const productGrid = document.getElementById('productGrid');
    const searchInput = document.getElementById('categorySearchInput');
    const productCount = document.getElementById('productCount');
    const noResults = document.getElementById('noResults');

    document.addEventListener('DOMContentLoaded', initializePage);

    async function initializePage() {
        // Get Category ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        state.currentCategoryId = urlParams.get('id');

        if (!state.currentCategoryId) {
            window.location.href = 'index.html';
            return;
        }

        setupEventListeners();

        // Load Data
        await loadData();
    }

    function setupEventListeners() {
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value.toLowerCase();
            filterProducts();
        });
    }

    async function loadData() {
        try {
            // 1. Fetch Categories to find name and subcategories
            state.categories = await ProductService.getAllCategories();

            const currentCat = state.categories.find(c => (c.id || c._id) === state.currentCategoryId);
            if (currentCat) {
                pageTitle.textContent = currentCat.name;
            }

            renderSubCategories();

            // 2. Fetch Products
            // ProductService.getProductsByCategory handles fetching ALL products in a category
            state.products = await ProductService.getProductsByCategory(state.currentCategoryId);
            state.filteredProducts = [...state.products];

            renderProducts();

        } catch (error) {
            console.error('Error loading page data:', error);
            pageTitle.textContent = 'Error Loading Category';
        }
    }

    function renderSubCategories() {
        // Filter for children of current category
        const subCategories = state.categories.filter(c => c.parentId === state.currentCategoryId);

        if (subCategories.length === 0) {
            subCategorySection.style.display = 'none';
            return;
        }

        subCategorySection.style.display = 'block';
        subCategoryBar.innerHTML = subCategories.map(cat => {
            const catId = cat.id || cat._id;
            const iconSrc = ProductService.getCategoryImageUrl(cat);
            console.log("iconSrc=====", iconSrc);

            // Note: Clicking a subcategory... 
            // Option 1: Filter current page products? 
            // Option 2: Navigate to category.html?id=subId? 
            // Based on user request "show all jewellery product showed and top veiw shows Level 2",
            // likely they just want to SEE them or click to drill down. Let's make them clickable to drill down.

            return `
                <button class="sub-category-item" onclick="window.location.href='category.html?id=${catId}'">
                    <img src="${iconSrc}" alt="${cat.name}" class="sub-category-image"
                         onerror="this.src='https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=100&q=80'">
                    <span class="sub-category-text">${cat.name}</span>
                </button>
            `;
        }).join('');
    }

    function filterProducts() {
        const query = state.searchQuery;
        if (!query) {
            state.filteredProducts = [...state.products];
        } else {
            state.filteredProducts = state.products.filter(p =>
                p.productName.toLowerCase().includes(query) ||
                (p.description && p.description.toLowerCase().includes(query))
            );
        }
        renderProducts();
    }

    function renderProducts() {
        if (state.filteredProducts.length === 0) {
            productGrid.innerHTML = '';
            noResults.style.display = 'block';
            productCount.textContent = '0 products';
            return;
        }

        noResults.style.display = 'none';
        productCount.textContent = `${state.filteredProducts.length} product${state.filteredProducts.length !== 1 ? 's' : ''}`;

        productGrid.innerHTML = state.filteredProducts.map(product => {
            const mainImage = product.images && product.images.length > 0
                ? getFullImageUrl(product.images[0])
                : 'assets/images/placeholder.svg';

            // Calculate mock rating since backend might not send it, or use existing
            const rating = product.rating || 4.5;
            const isNew = product.isNew !== undefined ? product.isNew : true;
            const isOnSale = product.discountPercent > 0;

            return `
                <article class="product-card" role="listitem" data-product-id="${product.id}">
                    <div class="product-card__image-wrapper">
                        <img 
                            src="${mainImage}" 
                            alt="${product.productName}"
                            class="product-card__image"
                            loading="lazy"
                        >
                        <div class="product-card__badges">
                            ${isNew ? '<span class="badge--new">New</span>' : ''}
                            ${isOnSale ? '<span class="badge--sale">Sale</span>' : ''}
                        </div>
                        <button 
                            class="product-card__wishlist" 
                            data-action="wishlist"
                            aria-label="Add to wishlist"
                        >
                            ♡
                        </button>
                    </div>
                    <div class="product-card__content">
                        <h3 class="product-card__title">${product.productName}</h3>
                        <p class="product-card__description">${product.description || ''}</p>
                        <div class="product-card__rating" aria-label="Rating: ${rating} out of 5 stars">
                            ${renderStars(rating)}
                        </div>
                        <div class="product-card__footer">
                            <div class="product-card__pricing">
                                <span class="product-card__price">₹${product.price ? product.price.toLocaleString() : '0'}</span>
                                ${product.mrp && product.mrp > product.price ? `
                                    <span class="product-card__mrp">₹${product.mrp.toLocaleString()}</span>
                                    <span class="product-card__discount">${product.discountPercent}% OFF</span>
                                ` : ''}
                            </div>
                        </div>
                         <button 
                                class="product-card__quick-view" 
                                data-action="quick-view"
                                aria-label="Quick view ${product.productName}"
                            >
                                View
                            </button>
                    </div>
                </article>
            `;
        }).join('');
    }

    function renderStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<span class="star ${i <= rating ? '' : 'empty'}">★</span>`;
        }
        return stars;
    }

    function getFullImageUrl(imagePath) {
        if (!imagePath) return 'assets/images/placeholder.svg';
        if (imagePath.startsWith('http') || imagePath.startsWith('https')) return imagePath;
        if (imagePath.startsWith('data:')) return imagePath;
        imagePath = imagePath.replace(/\\/g, '/');
        const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
        return `http://localhost:8080/${cleanPath}`;
    }

})();
