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

    // Cart State (Minimal local state for category page to work independently)
    const cartState = {
        cart: [],
        wishlist: [],
        currentProduct: null,
        currentImageIndex: 0
    };

    // Load initial data for cart/wishlist (badge counts etc if we had them)
    // For now, we rely on services.

    async function loadData() {
        try {
            // 1. Fetch Categories
            state.categories = await ProductService.getAllCategories();
            const currentCat = state.categories.find(c => (c.id || c._id) === state.currentCategoryId);
            if (currentCat) {
                pageTitle.textContent = currentCat.name;

                // Update header background
                const header = document.querySelector('.category-header');
                if (header) {
                    const imgSrc = ProductService.getCategoryImageUrl(currentCat);
                    const fullImgUrl = imgSrc.startsWith('http') ? imgSrc : `http://localhost:8080/${imgSrc}`;

                    // Increased overlay opacity (0.7) for better text visibility on bright images
                    header.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${fullImgUrl}')`;
                    header.style.backgroundSize = 'cover';
                    header.style.backgroundPosition = 'center';
                    header.style.color = '#ffffff'; // Enforce white text

                    // Ensuring title specifically is white
                    if (pageTitle) {
                        pageTitle.style.color = '#ffffff';
                        pageTitle.style.textShadow = '0 2px 8px rgba(0,0,0,0.6)';
                    }
                }
            }

            renderSubCategories();

            // 2. Fetch Products
            state.products = await ProductService.getProductsByCategory(state.currentCategoryId);
            state.filteredProducts = [...state.products];

            // 3. Fetch Wishlist keys for heart status
            if (typeof WishlistService !== 'undefined') {
                try {
                    const wishlist = await WishlistService.fetchWishlist();
                    cartState.wishlist = wishlist; // Array of IDs
                } catch (e) { console.error('Wishlist fetch error', e); }
            }

            renderProducts();

        } catch (error) {
            console.error('Error loading page data:', error);
            pageTitle.textContent = 'Error Loading Category';
        }
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

            const rating = product.rating || 4.5;
            const isNew = product.isNew !== undefined ? product.isNew : true;
            const isOnSale = product.discountPercent > 0;
            const inWishlist = cartState.wishlist.includes(product.id);

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
                            class="product-card__wishlist ${inWishlist ? 'active' : ''}" 
                            data-action="wishlist"
                            aria-label="Add to wishlist"
                        >
                            ${inWishlist ? '❤️' : '♡'}
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
                        
                        <div class="product-card__actions" style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                            <button 
                                class="product-card__btn-primary" 
                                style="flex: 2; padding: 0.5rem; background: #ff9f00; border: none; border-radius: 4px; color: white; cursor: pointer; font-weight: 600;"
                                data-action="buy-now"
                            >
                                Buy Now
                            </button>
                            <button 
                                class="product-card__quick-view" 
                                style="flex: 1; width: auto !important; margin: 0 !important; background-color: var(--color-primary);" 
                                data-action="quick-view"
                                aria-label="Quick view ${product.productName}"
                            >
                                View
                            </button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    }

    // Event Delegation
    productGrid.addEventListener('click', handleProductCardClick);

    // Modal Events
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.querySelector('.modal__close').addEventListener('click', closeModal);
        modal.querySelector('.modal__overlay').addEventListener('click', closeModal);
        document.getElementById('addToCartBtn').addEventListener('click', addToCartFromModal);
        document.getElementById('modalBuyNowBtn').addEventListener('click', handleBuyNow);
        document.getElementById('modalWishlistBtn').addEventListener('click', toggleWishlistFromModal);

        // Carousel
        modal.querySelector('.carousel__btn--prev').addEventListener('click', () => navigateCarousel(-1));
        modal.querySelector('.carousel__btn--next').addEventListener('click', () => navigateCarousel(1));
    }

    function handleProductCardClick(e) {
        const card = e.target.closest('.product-card');
        if (!card) return;

        const productIdRaw = card.dataset.productId;
        // Handle ID types
        const productId = isNaN(productIdRaw) ? productIdRaw : (productIdRaw.match(/^[0-9a-fA-F]{24}$/) ? productIdRaw : Number(productIdRaw));

        const actionBtn = e.target.closest('[data-action]');
        const action = actionBtn ? actionBtn.dataset.action : null;

        if (action === 'quick-view') {
            openProductModal(productId);
        } else if (action === 'wishlist') {
            toggleWishlistItem(productId);
        } else if (action === 'buy-now') {
            handleBuyNow(e);
        } else if (action === 'add-to-cart') {
            // If we had a direct add to cart button on card
            addToCart(productId);
        }
    }

    // --- ACTIONS ---

    async function toggleWishlistItem(productId) {
        // Optimistic UI
        const index = cartState.wishlist.findIndex(id => id == productId);
        if (index > -1) {
            cartState.wishlist.splice(index, 1);
            showToast('Removed from wishlist');
            if (typeof WishlistService !== 'undefined') await WishlistService.removeFromWishlist(productId);
        } else {
            cartState.wishlist.push(productId);
            showToast('Added to wishlist');
            if (typeof WishlistService !== 'undefined') await WishlistService.addToWishlist(productId);
        }
        renderProducts(); // Update hearts
    }

    function addToCart(productId, size = 'Free Size', metal = 'Gold') {
        const product = state.products.find(p => p.id == productId);
        if (!product) return;

        if (typeof CartService !== 'undefined') {
            CartService.addToCart(productId, 1).then(res => {
                showToast(`${product.productName} added to cart!`);
            }).catch(err => {
                showToast('Please login to add to cart');
                console.error(err);
            });
        } else {
            showToast('Cart service not available');
        }
    }

    function addToCartFromModal() {
        if (!cartState.currentProduct) return;
        const size = document.getElementById('sizeSelect').value;
        addToCart(cartState.currentProduct.id, size, 'Gold');
    }

    async function toggleWishlistFromModal() {
        if (!cartState.currentProduct) return;
        await toggleWishlistItem(cartState.currentProduct.id);

        // Update modal button state
        const wishlistBtn = document.getElementById('modalWishlistBtn');
        const inWishlist = cartState.wishlist.includes(cartState.currentProduct.id);
        wishlistBtn.textContent = inWishlist ? '❤️' : '♡';
    }

    function handleBuyNow(e) {
        let productId;
        if (e.target.id === 'modalBuyNowBtn') {
            if (!cartState.currentProduct) return;
            productId = cartState.currentProduct.id;
        } else {
            const card = e.target.closest('.product-card');
            if (!card) return;
            productId = card.dataset.productId;
        }

        const product = state.products.find(p => p.id == productId);
        if (!product) return;

        const checkoutItem = {
            id: product.id,
            title: product.productName,
            price: product.price,
            image: product.images && product.images.length > 0 ? getFullImageUrl(product.images[0]) : '',
            quantity: 1,
            size: 'Free Size',
            metal: 'Gold'
        };

        localStorage.setItem('jewel_buyNowItem', JSON.stringify(checkoutItem));
        window.location.href = 'checkout.html';
    }

    // --- MODAL ---

    function openProductModal(productId) {
        const product = state.products.find(p => p.id == productId);
        if (!product) return;

        cartState.currentProduct = product;
        cartState.currentImageIndex = 0;

        document.getElementById('modalTitle').textContent = product.productName;
        document.getElementById('modalPrice').textContent = `₹${product.price.toLocaleString()}`;
        document.getElementById('modalDescription').textContent = product.description || '';

        const modalMrp = document.getElementById('modalMrp');
        const modalDiscount = document.getElementById('modalDiscount');

        if (product.mrp && product.mrp > product.price) {
            modalMrp.textContent = `₹${product.mrp.toLocaleString()}`;
            modalMrp.style.display = 'inline';
            modalDiscount.textContent = `${product.discountPercent}% OFF`;
            modalDiscount.style.display = 'inline-block';
        } else {
            modalMrp.style.display = 'none';
            modalDiscount.style.display = 'none';
        }

        // Specs (Assuming mock data if missing)
        document.getElementById('modalMaterial').textContent = product.material || 'N/A';
        document.getElementById('modalPlating').textContent = product.plating || 'N/A';
        document.getElementById('modalOccasion').textContent = product.occasion || 'N/A';
        document.getElementById('modalColor').textContent = product.color || 'N/A';

        // Wishlist btn
        const wishlistBtn = document.getElementById('modalWishlistBtn');
        wishlistBtn.textContent = cartState.wishlist.includes(productId) ? '❤️' : '♡';

        updateModalImage();
        renderCarouselDots();

        document.getElementById('productModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        document.getElementById('productModal').style.display = 'none';
        document.body.style.overflow = '';
        cartState.currentProduct = null;
    }

    function updateModalImage() {
        if (!cartState.currentProduct) return;
        const img = document.getElementById('modalImage');
        const src = cartState.currentProduct.images && cartState.currentProduct.images.length > 0
            ? getFullImageUrl(cartState.currentProduct.images[cartState.currentImageIndex])
            : 'assets/images/placeholder.svg';
        img.src = src;

        document.querySelectorAll('.carousel__dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === cartState.currentImageIndex);
        });
    }

    function renderCarouselDots() {
        if (!cartState.currentProduct || !cartState.currentProduct.images) return;
        const container = document.getElementById('carouselDots');
        container.innerHTML = cartState.currentProduct.images.map((_, i) => `
            <button class="carousel__dot ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="Image ${i + 1}"></button>
        `).join('');

        container.querySelectorAll('.carousel__dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                cartState.currentImageIndex = parseInt(e.target.dataset.index);
                updateModalImage();
            });
        });
    }

    function navigateCarousel(dir) {
        if (!cartState.currentProduct || !cartState.currentProduct.images) return;
        const len = cartState.currentProduct.images.length;
        cartState.currentImageIndex = (cartState.currentImageIndex + dir + len) % len;
        updateModalImage();
    }

    function showToast(msg) {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // Helper duplications from app.js
    function renderSubCategories() {
        const subCategories = state.categories.filter(c => c.parentId === state.currentCategoryId);
        if (subCategories.length === 0) {
            subCategorySection.style.display = 'none';
            return;
        }
        subCategorySection.style.display = 'block';
        subCategoryBar.innerHTML = subCategories.map(cat => {
            const catId = cat.id || cat._id;
            const iconSrc = ProductService.getCategoryImageUrl(cat);
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
