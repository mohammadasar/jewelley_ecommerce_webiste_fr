/*
    JEWELLERY E-COMMERCE APPLICATION
    =================================
    Vanilla JavaScript for frontend-only e-commerce functionality.
    
    ARCHITECTURE:
    1. Product Data (12+ sample products)
    2. State Management (cart, wishlist, filters, dark mode)
    3. Rendering Functions (products, modal, cart)
    4. Event Handlers (search, filter, sort, cart, wishlist)
    5. localStorage Persistence
    6. Accessibility Features (keyboard navigation, focus management)
    
    HOW IT WORKS:
    - All data is stored in memory and localStorage
    - Products are filtered/sorted client-side
    - Cart and wishlist persist across page refreshes
    - Dark mode preference is saved
    - No backend required - fully functional frontend demo
*/

// ==================== STATE MANAGEMENT ====================
const state = {
    products: [],
    filteredProducts: [],
    categories: [],
    cart: [],
    wishlist: [],
    filters: {
        search: '',
        category: 'all',
        sortBy: 'newest',
        minPrice: null,
        maxPrice: null,
        attributes: {}
    },
    currentProduct: null,
    currentImageIndex: 0,
    darkMode: false
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Load saved data from localStorage (Cart, Theme)
    loadFromLocalStorage();

    // Apply dark mode if saved
    if (state.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Initialize Carousel
    await initHeroCarousel();

    // Load data from API
    await loadDataFromApi();

    // Setup event listeners
    setupEventListeners();

    // Load wishlist and cart from backend if user is logged in
    loadWishlistFromBackend();
    loadCartFromBackend();

    // Update cart badge
    updateCartBadge();
}

// ==================== API INTEGRATION ====================
async function loadDataFromApi() {
    try {
        const productGrid = document.getElementById('productGrid');
        if (productGrid) {
            productGrid.innerHTML = '<div class="loading">Loading products...</div>';
        }

        const categories = await ProductService.getAllCategories();
        state.categories = categories;
        populateCategoryFilters();
        renderCategoryBar();

        // 2. Fetch Products
        const apiProducts = await ProductService.getAllProducts();

        // 3. Map API data to frontend model
        state.products = apiProducts.map(mapApiProductToFrontend).filter(p => p !== null);
        state.filteredProducts = [...state.products];

        // 4. Render
        applyFilters();

    } catch (error) {
        console.error('Error initializing data from API:', error);
        const productGrid = document.getElementById('productGrid');
        if (productGrid) {
            productGrid.innerHTML = '<div class="error">Failed to load products. Please try again later.</div>';
        }
    }
}

function mapApiProductToFrontend(apiProduct) {
    if (!apiProduct) return null;

    // 🔥 UPDATED: Handle both singular 'categoryId' and plural 'categoryIds' from backend
    let categoryObj = null;
    if (apiProduct.categoryIds && Array.isArray(apiProduct.categoryIds) && apiProduct.categoryIds.length > 0) {
        // Find the most specific (last) category name for display
        const lastId = apiProduct.categoryIds[apiProduct.categoryIds.length - 1];
        categoryObj = state.categories.find(c => (c.id || c._id) === lastId);
    } else if (apiProduct.categoryId) {
        categoryObj = state.categories.find(c => (c.id || c._id) === apiProduct.categoryId);
    }

    const categoryName = categoryObj ? categoryObj.name : 'Uncategorized';

    // Handle images
    let images = [];
    if (apiProduct.images && apiProduct.images.length > 0) {
        images = apiProduct.images.map(getFullImageUrl);
    } else {
        images = ['assets/images/placeholder.svg'];
    }

    return {
        id: apiProduct.id || apiProduct._id,
        title: apiProduct.productName || apiProduct.title || 'Untitled Product',
        description: apiProduct.description || 'No description available',
        price: parseFloat(apiProduct.price) || 0,
        mrp: parseFloat(apiProduct.mrp) || apiProduct.price || 0,
        category: categoryObj ? (categoryObj.id || categoryObj._id) : 'others',
        categoryName: categoryName,
        images: images,
        rating: apiProduct.rating || 4.5,
        isNew: apiProduct.isNew !== undefined ? apiProduct.isNew : true,
        isOnSale: (apiProduct.discountPercent > 0) || (apiProduct.mrp > apiProduct.price),
        discountPercent: parseInt(apiProduct.discountPercent) || 0,

        // Specifications
        material: apiProduct.material || 'N/A',
        plating: apiProduct.plating || 'N/A',
        occasion: apiProduct.occasion || 'Everyday',
        color: apiProduct.color || 'N/A',
        size: apiProduct.size || 'Free Size',

        dateAdded: apiProduct.createdAt || new Date().toISOString()
    };
}

function getFullImageUrl(imagePath) {
    if (!imagePath) return 'assets/images/placeholder.svg';
    if (imagePath.startsWith('http') || imagePath.startsWith('https')) return imagePath;
    if (imagePath.startsWith('data:')) return imagePath;

    // Handle potential incorrect backslashes
    imagePath = imagePath.replace(/\\/g, '/');

    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
//     return `http://localhost:8080/${cleanPath}`;
    return `https://jewelley-ecommerce-webiste-bk.onrender.com/${cleanPath}`;
}

function populateCategoryFilters() {
    const container = document.getElementById('categoryFilters');
    if (!container) return;

    container.innerHTML = state.categories.map(cat => {
        const id = cat.id || cat._id;
        return `
            <label class="checkbox-container">
                <input type="checkbox" data-type="category" value="${id}">
                <span class="checkmark"></span>
                <span class="checkbox-label">${cat.name}</span>
            </label>
        `;
    }).join('');

    // Re-attach listeners because we just replaced the innerHTML
    container.querySelectorAll('input').forEach(cb => {
        cb.addEventListener('change', applyFilters);
    });
}

function renderCategoryBar() {
    const categoryBar = document.getElementById('categoryBar');
    if (!categoryBar) return;

    // Filter for Level 1 Categories (Root categories)
    const rootCategories = state.categories.filter(c => !c.parentId);

    const categoriesHtml = rootCategories.map(category => {
        const categoryId = category.id || category._id;
        // API Endpoint for category image
        const iconSrc = ProductService.getCategoryImageUrl(category);

        return `
            <button class="category-item" 
                    onclick="window.location.href='category.html?id=${categoryId}'">
                <img src="${iconSrc}" alt="${category.name}" class="category-item__image" loading="lazy" 
                     onerror="this.src='https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=100&q=80'">
                <span class="category-item__text">${category.name}</span>
            </button>
        `;
    }).join('');

    categoryBar.innerHTML = categoriesHtml;
}

function setCategoryFilter(categoryId) {
    // Update state
    state.filters.category = categoryId;

    // Update UI controls to match
    const dropdown = document.getElementById('categoryFilter');
    if (dropdown) dropdown.value = categoryId;

    // Re-render bar to highlight active
    renderCategoryBar();

    // Apply filters
    applyFilters();
}

// ==================== LOCAL STORAGE ====================
function loadFromLocalStorage() {
    try {
        const savedCart = localStorage.getItem('jewel_cart');
        const savedDarkMode = localStorage.getItem('jewel_darkMode');

        if (savedCart) state.cart = JSON.parse(savedCart);
        if (savedDarkMode) state.darkMode = JSON.parse(savedDarkMode);

        // Wishlist is loaded separately from backend or localStorage
        const savedWishlist = localStorage.getItem('jewel_wishlist');
        if (savedWishlist) state.wishlist = JSON.parse(savedWishlist);
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
}

// Load wishlist from backend API
async function loadWishlistFromBackend() {
    if (typeof WishlistService !== 'undefined') {
        try {
            const wishlist = await WishlistService.fetchWishlist();
            state.wishlist = wishlist;
            updateWishlistBadge();
            renderProducts(); // Re-render to update heart icons
        } catch (error) {
            console.error('Error loading wishlist from backend:', error);
        }
    }
}

// Load cart from backend API
async function loadCartFromBackend() {
    if (typeof CartService !== 'undefined') {
        try {
            const apiCart = await CartService.getCart();
            if (apiCart) {
                // Determine the correct array property name returned by the backend Cart class
                let itemsStr = [];
                if (Array.isArray(apiCart)) {
                    itemsStr = apiCart;
                } else {
                    itemsStr = apiCart.items || apiCart.cartItems || apiCart.products || apiCart.cart || [];
                }
                const mappedItems = [];
                
                for (const item of itemsStr) {
                    const pid = item.productId || item.product?.id || item.id;
                    const pqty = item.quantity !== undefined ? item.quantity : (item.qty || 1);
                    
                    const product = state.products.find(p => p.id == pid || p._id == pid);
                    if (product) {
                        mappedItems.push({
                            id: product.id,
                            title: product.title,
                            price: product.price,
                            image: product.images[0],
                            size: 'Free Size', // Backend doesn't seem to store this yet based on controller, default
                            metal: 'Gold',     // Default
                            quantity: pqty
                        });
                    }
                }

                // If backend gives an empty cart, or we mapped it, update the local state fully
                state.cart = mappedItems;
                updateCartBadge();
                saveToLocalStorage();
            }
        } catch (error) {
            console.error('Error loading cart from backend:', error);
        }
    }
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('jewel_cart', JSON.stringify(state.cart));
        // Wishlist is saved via WishlistService API calls
        // localStorage.setItem('jewel_wishlist', JSON.stringify(state.wishlist));
        localStorage.setItem('jewel_darkMode', JSON.stringify(state.darkMode));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.filters.search = e.target.value;
            applyFilters();
        });
    }

    // Modern Accordion Toggle Logic
    document.addEventListener('click', (e) => {
        const toggle = e.target.closest('.filter-section__toggle');
        if (toggle) {
            const sectionId = toggle.dataset.target;
            if (sectionId) {
                const section = document.getElementById(sectionId);
                if (section) {
                    section.classList.toggle('collapsed');
                }
            }
        }
    });

    // Mobile specific
    const mobileToggle = document.getElementById('filterMobileToggle');
    const filterPanel = document.getElementById('filterPanel');
    const filterOverlay = document.getElementById('filterOverlay');
    const mobileApply = document.getElementById('filterMobileApply');
    const mobileReset = document.getElementById('filterMobileReset');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            filterPanel?.classList.add('open');
            filterOverlay?.classList.add('visible');
            document.body.style.overflow = 'hidden';
        });
    }

    if (filterOverlay) {
        filterOverlay.addEventListener('click', () => {
            filterPanel?.classList.remove('open');
            filterOverlay?.classList.remove('visible');
            document.body.style.overflow = '';
        });
    }

    if (mobileApply) {
        mobileApply.addEventListener('click', () => {
            filterOverlay?.click();
            applyFilters();
        });
    }

    if (mobileReset) {
        mobileReset.addEventListener('click', () => {
             resetFilters();
             filterOverlay?.click();
        });
    }

    // Price Filter
    document.getElementById('filterApplyPrice')?.addEventListener('click', applyFilters);

    // Clear All
    document.getElementById('filterClearAll')?.addEventListener('click', resetFilters);

    // Sorting
    document.querySelectorAll('input[name="sortByMobile"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.filters.sortBy = e.target.value;
            applyFilters();
        });
    });

    // Dark mode toggle
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);

    // Cart toggle
    document.getElementById('cartToggle').addEventListener('click', toggleCart);

    // Wishlist toggle
    document.getElementById('wishlistToggle').addEventListener('click', toggleWishlistPanel);

    // Cart close
    const cartPanel = document.getElementById('cartPanel');
    cartPanel.querySelector('.cart__close').addEventListener('click', closeCart);
    cartPanel.querySelector('.cart__overlay').addEventListener('click', closeCart);

    // Wishlist close
    const wishlistPanel = document.getElementById('wishlistPanel');
    wishlistPanel.querySelector('.cart__close').addEventListener('click', closeWishlist);
    wishlistPanel.querySelector('.cart__overlay').addEventListener('click', closeWishlist);

    // Checkout button (demo only)
    document.getElementById('checkoutBtn').addEventListener('click', handleCheckout);

    // Modal close
    const modal = document.getElementById('productModal');
    modal.querySelector('.modal__close').addEventListener('click', closeModal);
    modal.querySelector('.modal__overlay').addEventListener('click', closeModal);

    // Carousel buttons
    modal.querySelector('.carousel__btn--prev').addEventListener('click', () => navigateCarousel(-1));
    modal.querySelector('.carousel__btn--next').addEventListener('click', () => navigateCarousel(1));

    // Modal add to cart
    document.getElementById('addToCartBtn').addEventListener('click', addToCartFromModal);

    // Modal wishlist
    document.getElementById('modalWishlistBtn').addEventListener('click', toggleWishlistFromModal);



    // Modal Buy Now
    const modalBuyNowBtn = document.getElementById('modalBuyNowBtn');
    if (modalBuyNowBtn) {
        modalBuyNowBtn.addEventListener('click', handleBuyNow);
    }

    // Modal WhatsApp Order
    const modalWhatsAppBtn = document.getElementById('modalWhatsAppBtn');
    if (modalWhatsAppBtn) {
        modalWhatsAppBtn.addEventListener('click', handleWhatsAppOrder);
    }

    // Event delegation for product cards
    document.getElementById('productGrid').addEventListener('click', handleProductCardClick);

    // Event delegation for cart items
    document.getElementById('cartItems').addEventListener('click', handleCartItemClick);

    // Event delegation for wishlist items
    document.getElementById('wishlistItems').addEventListener('click', handleWishlistItemClick);

    // Keyboard accessibility
    document.addEventListener('keydown', handleKeyboard);

    // Listen for user profile updates to refresh cart
    window.addEventListener('user-updated', () => {
        // If cart is open, re-render to show new details
        const cartPanel = document.getElementById('cartPanel');
        if (cartPanel && cartPanel.style.display === 'block') {
            renderCart();
        }
    });
}

// ==================== SEARCH & FILTER (NEW API ENGINE) ====================
const API_BASE = 'https://jewelley-ecommerce-webiste-bk.onrender.com/api/products';
let _filterDebounceTimer = null;

function resetFilters() {
    state.filters = { search: '', sortBy: 'newest', minPrice: null, maxPrice: null, attributes: {} };
    
    // Clear Inputs
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    const minPrice = document.getElementById('filterMinPrice');
    if (minPrice) minPrice.value = '';
    
    const maxPrice = document.getElementById('filterMaxPrice');
    if (maxPrice) maxPrice.value = '';

    // Reset Sort
    document.querySelectorAll('input[name="sortByMobile"]').forEach(r => r.checked = r.value === 'newest');
    
    // Uncheck all checkboxes
    document.querySelectorAll('.filter-panel input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    applyFilters();
}

function applyFilters() {
    clearTimeout(_filterDebounceTimer);
    _filterDebounceTimer = setTimeout(_doApiFilter, 150);
}

async function _doApiFilter() {
    updateActiveFilterTags();

    // 1. Collect selected categories and attributes
    const selectedCats = [];
    const selectedCatNames = [];
    const selectedAttrs = {};
    
    document.querySelectorAll('.filter-panel input[type="checkbox"]:checked').forEach(cb => {
        if (cb.dataset.type === 'category') {
            selectedCats.push(cb.value);
            // Also get the name label for fallbacks
            const label = cb.closest('.checkbox-container')?.querySelector('.checkbox-label')?.textContent;
            if (label) selectedCatNames.push(label);
        } else {
            const key = cb.dataset.attrKey;
            if (!selectedAttrs[key]) selectedAttrs[key] = [];
            selectedAttrs[key].push(cb.value);
        }
    });

    // 2. Build Payload (Strictly matching ProductFilterRequest.java DTO)
    const payload = {
        categoryIds: selectedCats.length > 0 ? selectedCats : [],
        minPrice: state.filters.minPrice !== null ? state.filters.minPrice : null,
        maxPrice: state.filters.maxPrice !== null ? state.filters.maxPrice : null,
        attributes: Object.keys(selectedAttrs).length > 0 ? selectedAttrs : {},
        sortBy: state.filters.sortBy || "" 
    };

    if (state.filters.minPrice !== null) payload.minPrice = state.filters.minPrice;
    if (state.filters.maxPrice !== null) payload.maxPrice = state.filters.maxPrice;
    if (Object.keys(selectedAttrs).length > 0) payload.attributes = selectedAttrs;

    console.log("📡 [FILTER ENGINE] Outgoing Payload:", JSON.stringify(payload, null, 2));

    // 3. Show loading state
    showGridSkeleton();

    try {
        const res = await fetch(`${API_BASE}/filter`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Filter API Error: " + res.status);

        const rawProducts = await res.json();
        console.log("💎 [FILTER ENGINE] Raw Backend Response:", rawProducts);

        let finalProducts = [];

        // 4. Hybrid Logic: Use Backend Results if found, otherwise fallback to Intelligent Client-Side Filter
        if (Array.isArray(rawProducts) && rawProducts.length > 0) {
            console.log("✅ [FILTER ENGINE] Using Backend results");
            finalProducts = rawProducts.map(mapApiProductToFrontend).filter(p => p !== null);
        } else {
            console.log("⚠️ [FILTER ENGINE] Backend returned no results. Falling back to Client-Side Intelligence...");
            finalProducts = runClientSideFilter(state.products, payload);
        }

        // 5. Post-Process (Search & Sort)
        if (state.filters.search) {
            const q = state.filters.search.toLowerCase();
            finalProducts = finalProducts.filter(p => 
                (p.title && p.title.toLowerCase().includes(q)) || 
                (p.description && p.description.toLowerCase().includes(q))
            );
        }

        // Client-side sort for consistency
        finalProducts = runClientSideSort(finalProducts, state.filters.sortBy);

        state.filteredProducts = finalProducts;
        renderProducts();

        // 6. Build dynamic filters from results
        if (Object.keys(state.filters.attributes).length === 0 && !state.hasBuiltDynamicFilters) {
            buildDynamicAttributeFilters(finalProducts);
            state.hasBuiltDynamicFilters = true; 
        }

    } catch (err) {
        console.warn("⚠️ [FILTER ENGINE] API Filter failed completely:", err);
        state.filteredProducts = runClientSideFilter(state.products, payload);
        renderProducts();
    }
}

/**
 * INTELLIGENT CLIENT-SIDE FILTER
 * Mirror of the backend logic to ensure UI stays functional
 */
function runClientSideFilter(products, criteria) {
    let filtered = [...products];

    // Category Filter
    if (criteria.categoryIds && criteria.categoryIds.length > 0) {
        filtered = filtered.filter(p => {
            // Check if product is in ANY of the selected categories
            const pCats = Array.isArray(p.categoryIds) ? p.categoryIds : [p.category];
            return criteria.categoryIds.some(id => pCats.includes(id));
        });
    }

    // Price Filter
    if (criteria.minPrice !== null) {
        filtered = filtered.filter(p => p.price >= criteria.minPrice);
    }
    if (criteria.maxPrice !== null) {
        filtered = filtered.filter(p => p.price <= criteria.maxPrice);
    }

    // Attributes Filter
    if (criteria.attributes && Object.keys(criteria.attributes).length > 0) {
        Object.entries(criteria.attributes).forEach(([key, values]) => {
            if (values && values.length > 0) {
                filtered = filtered.filter(p => {
                    const pVal = p[key.toLowerCase()]; // e.g. p.material, p.color
                    return values.includes(pVal) || (p.attributes && p.attributes.some(a => (a.key === key || a.name === key) && values.includes(a.value)));
                });
            }
        });
    }

    return filtered;
}

function runClientSideSort(products, sortBy) {
    const arr = [...products];
    switch (sortBy) {
        case 'price_asc':  return arr.sort((a, b) => a.price - b.price);
        case 'price_desc': return arr.sort((a, b) => b.price - a.price);
        case 'newest':     return arr.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
        default:           return arr;
    }
}

function updateActiveFilterTags() {
    const container = document.getElementById('activeFilterTags');
    const clearAllBtn = document.getElementById('filterClearAll');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    const tags = [];
    
    // Price Tags
    const minStr = document.getElementById('filterMinPrice')?.value;
    const maxStr = document.getElementById('filterMaxPrice')?.value;
    if (minStr || maxStr) {
        const min = minStr || '0';
        const max = maxStr || '∞';
        tags.push({ label: `Price: ₹${min} - ₹${max}`, type: 'price' });
    }

    // Category Tags
    document.querySelectorAll('#categoryFilters input:checked').forEach(cb => {
        const labelText = cb.closest('.checkbox-container')?.querySelector('.checkbox-label')?.textContent;
        // Generate a temporary ID for the checkbox if it doesn't have one
        if (!cb.id) cb.id = 'cat-filter-' + Math.random().toString(36).substr(2, 9);
        tags.push({ label: labelText, elId: cb.id });
    });

    // Dynamic Attribute Tags
    document.querySelectorAll('#dynamicFilters input:checked').forEach(cb => {
        const key = cb.dataset.attrKey;
        const val = cb.value;
        if (!cb.id) cb.id = 'attr-filter-' + Math.random().toString(36).substr(2, 9);
        tags.push({ label: `${key}: ${val}`, elId: cb.id });
    });

    container.innerHTML = tags.map(tag => `
        <span class="filter-tag">
            ${tag.label}
            <span class="filter-tag__remove" 
                  ${tag.elId ? `data-el-id="${tag.elId}"` : ''} 
                  onclick="if(this.dataset.elId) { document.getElementById(this.dataset.elId).click(); } else { window.clearPriceFilter(); }">✕</span>
        </span>
    `).join('');

    // Helper for clearing
    window.clearPriceFilter = () => {
        const min = document.getElementById('filterMinPrice');
        const max = document.getElementById('filterMaxPrice');
        if (min) min.value = '';
        if (max) max.value = '';
        applyFilters();
    };

    // Show/Hide Clear All
    if (clearAllBtn) {
        clearAllBtn.classList.toggle('visible', tags.length > 0);
    }

    // Update Mobile Badge
    const badge = document.getElementById('filterBadge');
    if (badge) {
        badge.textContent = tags.length;
        badge.classList.toggle('visible', tags.length > 0);
    }
}

function showGridSkeleton() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    grid.innerHTML = Array(8).fill(0).map(() => `
        <div class="product-card skeleton" style="height: 350px; background: #eee; border-radius: 12px; animation: pulse 1.5s infinite;"></div>
    `).join('');
}

function buildDynamicAttributeFilters(products) {
    const container = document.getElementById('dynamicFilters');
    if (!container) return;

    const attributes = {};
    products.forEach(p => {
        if (p.material && p.material !== 'N/A') { 
            if(!attributes['Material']) attributes['Material'] = new Set(); 
            attributes['Material'].add(p.material); 
        }
        if (p.color && p.color !== 'N/A') { 
            if(!attributes['Color']) attributes['Color'] = new Set(); 
            attributes['Color'].add(p.color); 
        }
        if (p.occasion && p.occasion !== 'Everyday') { 
            if(!attributes['Occasion']) attributes['Occasion'] = new Set(); 
            attributes['Occasion'].add(p.occasion); 
        }
    });

    container.innerHTML = Object.keys(attributes).map(key => `
        <div class="filter-section" id="section-${key.toLowerCase()}">
            <button class="filter-section__toggle" data-target="section-${key.toLowerCase()}">
                <span>${key}</span>
                <span class="filter-section__chevron">▼</span>
            </button>
            <div class="filter-section__body">
                <div class="checkbox-group">
                    ${Array.from(attributes[key]).map(val => `
                        <label class="checkbox-container">
                            <input type="checkbox" data-attr-key="${key}" value="${val}">
                            <span class="checkmark"></span>
                            <span class="checkbox-label">${val}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');

    container.querySelectorAll('input').forEach(cb => {
        cb.addEventListener('change', applyFilters);
    });
}

// Legacy function renamed to keep compatibility if called elsewhere, but logic moved to mapApiProductToFrontend
function normaliseProduct(p) {
    return mapApiProductToFrontend(p);
}

// ==================== RENDERING ====================
function renderProducts() {
    const grid = document.getElementById('productGrid');
    const noResults = document.getElementById('noResults');
    const productCount = document.getElementById('productCount');

    if (state.filteredProducts.length === 0) {
        grid.innerHTML = '';
        noResults.style.display = 'block';
        productCount.textContent = '0 products';
        return;
    }

    noResults.style.display = 'none';
    productCount.textContent = `${state.filteredProducts.length} product${state.filteredProducts.length !== 1 ? 's' : ''}`;

    grid.innerHTML = state.filteredProducts.map(product => `
        <article class="product-card" role="listitem" data-product-id="${product.id}" style="cursor:pointer;">
            <div class="product-card__image-wrapper">
                <img
                    src="${product.images[0]}"
                    alt="${product.title}"
                    class="product-card__image"
                    loading="lazy"
                    onerror="this.src='assets/images/placeholder.svg'"
                >
            </div>
            <div class="product-card__content">
                <h3 class="product-card__title">${product.title}</h3>
                <div class="product-card__pricing">
                    <span class="product-card__price">₹${product.price ? product.price.toLocaleString() : '0'}</span>
                    ${product.mrp && product.mrp > product.price ? `
                        <span class="product-card__mrp">₹${product.mrp.toLocaleString()}</span>
                        <span class="product-card__discount">${product.discountPercent}% OFF</span>
                    ` : ''}
                </div>
            </div>
        </article>
    `).join('');

    // Trigger GSAP Scroll Animations after the DOM updates
    setTimeout(() => {
        if (typeof initScrollAnimations === 'function') {
            initScrollAnimations();
        }
    }, 50);
}

function renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<span class="star ${i <= rating ? '' : 'empty'}">★</span>`;
    }
    return stars;
}

// ==================== PRODUCT CARD INTERACTIONS ====================
function handleProductCardClick(e) {
    const card = e.target.closest('.product-card');
    if (!card) return;

    // Get ID as string first to handle both GUIDs/ObjectIds and numbers
    const productIdRaw = card.dataset.productId;
    // Try to parse as int, but keep as string if NaN (for UUID/ObjectId)
    const productId = isNaN(productIdRaw) ? productIdRaw : parseInt(productIdRaw);

    const action = e.target.closest('[data-action]')?.dataset.action;

    if (action === 'wishlist') {
        e.preventDefault();
        toggleWishlistItem(productId);
    } else if (action === 'buy-now') {
        e.preventDefault();
        handleBuyNow(e);
    } else if (action === 'view-detail') {
        // Let the <a> tag handle navigation naturally
        return;
    } else {
        // Clicking anywhere else on the card → go to product detail page
        window.location.href = `product.html?id=${productIdRaw}`;
    }
}

// ==================== MODAL ====================
function openProductModal(productId) {
    // Loose equality to handle string vs number ID mismatch
    const product = state.products.find(p => p.id == productId);
    if (!product) return;

    state.currentProduct = product;
    state.currentImageIndex = 0;

    const modal = document.getElementById('productModal');

    // Update modal content
    // Update modal content
    const modalTitle = document.getElementById('modalTitle');
    const modalPrice = document.getElementById('modalPrice');
    const modalMrp = document.getElementById('modalMrp');
    const modalDiscount = document.getElementById('modalDiscount');
    const modalDesc = document.getElementById('modalDescription');
    const modalRating = document.getElementById('modalRating');

    if (modalTitle) modalTitle.textContent = product.title;
    if (modalPrice) modalPrice.textContent = `₹${product.price.toLocaleString()}`;

    // Update MRP and Discount
    if (product.mrp && product.mrp > product.price) {
        if (modalMrp) {
            modalMrp.textContent = `₹${product.mrp.toLocaleString()}`;
            modalMrp.style.display = 'inline';
        }
        if (modalDiscount) {
            modalDiscount.textContent = `${product.discountPercent}% OFF`;
            modalDiscount.style.display = 'inline-block';
        }
    } else {
        if (modalMrp) modalMrp.style.display = 'none';
        if (modalDiscount) modalDiscount.style.display = 'none';
    }

    if (modalDesc) modalDesc.textContent = product.description;
    if (modalRating) modalRating.innerHTML = renderStars(product.rating);

    // Update Specifications
    document.getElementById('modalMaterial').textContent = product.material;
    document.getElementById('modalPlating').textContent = product.plating;
    document.getElementById('modalOccasion').textContent = product.occasion;
    document.getElementById('modalColor').textContent = product.color;

    // Update Size Options
    const sizeSelect = document.getElementById('sizeSelect');
    if (sizeSelect && product.size) {
        sizeSelect.innerHTML = `<option value="${product.size}">${product.size}</option>`;
    }

    // Update image
    updateModalImage();

    // Update carousel dots and controls visibility
    renderCarouselDots();
    updateCarouselControls();

    // Update wishlist button
    const wishlistBtn = document.getElementById('modalWishlistBtn');
    wishlistBtn.textContent = isInWishlist(productId) ? '❤️' : '♡';

    // Show modal
    modal.style.display = 'flex';

    // Focus management
    modal.querySelector('.modal__close').focus();

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function updateCarouselControls() {
    if (!state.currentProduct) return;

    const hasMultipleImages = state.currentProduct.images.length > 1;
    const modal = document.getElementById('productModal');
    const prevBtn = modal.querySelector('.carousel__btn--prev');
    const nextBtn = modal.querySelector('.carousel__btn--next');
    const dotsContainer = document.getElementById('carouselDots');

    if (prevBtn) prevBtn.style.display = hasMultipleImages ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = hasMultipleImages ? 'flex' : 'none';
    if (dotsContainer) dotsContainer.style.display = hasMultipleImages ? 'flex' : 'none';
}

function closeModal() {
    const modal = document.getElementById('productModal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    state.currentProduct = null;
}

function updateModalImage() {
    if (!state.currentProduct) return;

    const img = document.getElementById('modalImage');
    img.src = state.currentProduct.images[state.currentImageIndex];
    img.alt = `${state.currentProduct.title} - Image ${state.currentImageIndex + 1}`;

    // Update active dot
    const dots = document.querySelectorAll('.carousel__dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === state.currentImageIndex);
    });
}

function renderCarouselDots() {
    if (!state.currentProduct) return;

    const dotsContainer = document.getElementById('carouselDots');
    dotsContainer.innerHTML = state.currentProduct.images.map((_, index) => `
        <button 
            class="carousel__dot ${index === 0 ? 'active' : ''}" 
            data-index="${index}"
            aria-label="View image ${index + 1}"
        ></button>
    `).join('');

    // Add click handlers to dots
    dotsContainer.querySelectorAll('.carousel__dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
            state.currentImageIndex = parseInt(e.target.dataset.index);
            updateModalImage();
        });
    });
}

function navigateCarousel(direction) {
    if (!state.currentProduct) return;

    const maxIndex = state.currentProduct.images.length - 1;
    state.currentImageIndex += direction;

    if (state.currentImageIndex < 0) state.currentImageIndex = maxIndex;
    if (state.currentImageIndex > maxIndex) state.currentImageIndex = 0;

    updateModalImage();
}

function handleBuyNow(e) {
    let productId;

    // Check if triggered from card or modal
    if (e.target.id === 'modalBuyNowBtn') {
        if (!state.currentProduct) return;
        productId = state.currentProduct.id;
    } else {
        const card = e.target.closest('.product-card');
        if (!card) return;
        productId = card.dataset.productId;
    }

    const product = state.products.find(p => p.id == productId);
    if (!product) return;

    // Prepare single item for checkout
    const checkoutItem = {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.images[0],
        quantity: 1,
        // Default values for direct buy
        size: 'Free Size',
        metal: 'Gold'
    };

    // Store in specialized key to differentiate from Cart checkout
    localStorage.setItem('jewel_buyNowItem', JSON.stringify(checkoutItem));

    // Redirect
    window.location.href = 'checkout.html';
}

function handleWhatsAppOrder() {
    if (!state.currentProduct) return;

    const product = state.currentProduct;
    const currentUser = (typeof AuthState !== 'undefined') ? AuthState.getCurrentUser() : null;

    const customerName = currentUser ? (currentUser.customerName || currentUser.name || currentUser.username || 'Valued Customer') : 'Valued Customer';
    const whatsappNumber = currentUser ? (currentUser.whatsappNumber || 'N/A') : 'N/A';
    const address = currentUser ? (currentUser.address || 'N/A') : 'N/A';
    const location = currentUser ? `${currentUser.district || ''} ${currentUser.state || ''} - ${currentUser.pincode || ''}`.trim() : 'N/A';

    const msg = `*GURU JEWELLERY* ✅

*The wait is over!* 💎

🔥 *Product Inquiry Alert!* 🔥

*${product.title}*
Starting from *₹${product.price.toLocaleString()}*

*Bonus deals:*
✅ Handcrafted Quality
✅ Fastest Shipping

*Customer Info:*
👤 ${customerName}
📞 ${whatsappNumber}
🏠 ${address}
📍 ${location}

*🔗 View Product:*
${window.location.href}

*🖼️ Image Link:*
${product.images[0]}

*Please send more details or payment options.*`;

    const adminNumber = '6369675902';
    const url = `https://wa.me/${adminNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}

// ==================== CART ====================
function addToCartFromModal() {
    if (!state.currentProduct) return;

    const sizeSelect = document.getElementById('sizeSelect');
    const metalSelect = document.getElementById('metalSelect');

    const size = sizeSelect ? sizeSelect.value : 'Free Size';
    const metal = metalSelect ? metalSelect.value : 'Gold';

    addToCart(state.currentProduct.id, size, metal);
    showToast(`${state.currentProduct.title} added to cart! 🛒`);
}

function addToCart(productId, size = 'medium', metal = 'gold') {
    // Loose equality to handle string vs number ID mismatch
    const product = state.products.find(p => p.id == productId);
    if (!product) return;

    // Check if item already in cart
    const existingItem = state.cart.find(item =>
        item.id === productId && item.size === size && item.metal === metal
    );

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        state.cart.push({
            id: productId,
            title: product.title,
            price: product.price,
            image: product.images[0],
            size,
            metal,
            quantity: 1
        });
    }

    updateCartBadge();
    saveToLocalStorage();

    // Sync with Backend
    if (typeof CartService !== 'undefined') {
        // We pass 1 as qty for addition (increment)
        CartService.addToCart(productId, 1).then(updatedCart => {
            if (updatedCart) console.log('Cart synced with backend');
        }).catch(err => console.error('Cart sync failed', err));
    }
}

function removeFromCart(index) {
    const item = state.cart[index];
    state.cart.splice(index, 1);
    renderCart();
    updateCartBadge();
    saveToLocalStorage();
    showToast(`${item.title} removed from cart`);

    // Sync with Backend (Remove)
    if (typeof CartService !== 'undefined') {
        CartService.removeFromCart(item.id).then(success => {
            if (success) console.log('Item removed from backend cart');
        });
    }
}

function updateCartQuantity(index, change) {
    const item = state.cart[index];
    item.quantity += change;

    if (item.quantity <= 0) {
        removeFromCart(index);
    } else {
        // Optimistic DOM update
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        
        if (cartItems) {
            const incBtn = cartItems.querySelector(`.cart-item__btn[data-action="increase"][data-index="${index}"]`);
            if (incBtn) {
                const row = incBtn.closest('.cart-item');
                if (row) {
                    const qtySpan = row.querySelector('.cart-item__quantity');
                    if (qtySpan) qtySpan.textContent = item.quantity;
                }
            }
            
            const total = state.cart.reduce((sum, cartItem) => sum + (cartItem.price * cartItem.quantity), 0);
            if (cartTotal) cartTotal.textContent = `₹${total.toLocaleString()}`;
        }
        
        updateCartBadge();
        saveToLocalStorage();

        // Sync with Backend
        if (typeof CartService !== 'undefined' && typeof AuthState !== 'undefined' && AuthState.isLoggedIn()) {
            CartService.addToCart(item.id, change).catch(err => console.error('Cart sync failed', err));
        }
    }
}

function handleCartItemClick(e) {
    const button = e.target.closest('[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const index = parseInt(button.dataset.index);

    if (action === 'increase') {
        updateCartQuantity(index, 1);
    } else if (action === 'decrease') {
        updateCartQuantity(index, -1);
    } else if (action === 'remove') {
        removeFromCart(index);
    }
}

function toggleCart() {
    const cartPanel = document.getElementById('cartPanel');
    const isVisible = cartPanel.style.display === 'block';

    if (isVisible) {
        closeCart();
    } else {
        cartPanel.style.display = 'block';
        renderCart();
        document.body.style.overflow = 'hidden';
    }
}

function closeCart() {
    document.getElementById('cartPanel').style.display = 'none';
    document.body.style.overflow = '';
}

function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const cartTotal = document.getElementById('cartTotal');

    // Add null checks to prevent errors - REMOVED emptyCart from check as it's dynamic
    if (!cartItems || !cartTotal) {
        console.error('Cart elements (items or total) not found in DOM');
        return;
    }

    // Clear previous content
    cartItems.innerHTML = '';

    // === NEW: Render User Details Section ===
    if (typeof AuthState !== 'undefined' && AuthState.isLoggedIn()) {
        const user = AuthState.getCurrentUser();
        if (user) {
            const userDetailsHTML = `
                <div class="cart-user-details" style="background: #f8f9fa; padding: 1rem; margin-bottom: 1rem; border-radius: 8px; border: 1px solid #e9ecef;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                        <h4 style="margin: 0; font-size: 0.95rem; color: #333;">Deliver to: <span style="font-weight: 700;">${user.name || user.customerName || user.username || 'User'}</span></h4>
                        <button id="cartUpdateProfileBtn" style="background: none; border: 1px solid #ddd; padding: 0.2rem 0.6rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; color: #007bff;">Change</button>
                    </div>
                    <p style="margin: 0; font-size: 0.85rem; color: #666; line-height: 1.4;">
                        ${user.address ? user.address : '<span style="color: #999; font-style: italic;">No address set</span>'}
                        ${user.pincode ? `<br>${user.district || ''}, ${user.state || ''} - ${user.pincode}` : ''}
                        ${user.whatsappNumber ? `<br>📞 ${user.whatsappNumber}` : ''}
                        ${user.alternateNumber ? ` | 📞 ${user.alternateNumber}` : ''}
                    </p>
                </div>
            `;
            cartItems.innerHTML += userDetailsHTML;

            // Add event listener for the "Change" button
            // We need to use setTimeout or event delegation because we just added it to innerHTML
            setTimeout(() => {
                const updateBtn = document.getElementById('cartUpdateProfileBtn');
                if (updateBtn) {
                    updateBtn.addEventListener('click', () => {
                        // Close cart first to focus on modal (optional, but cleaner)
                        // closeCart(); 
                        if (AuthState.openProfileModal) {
                            AuthState.openProfileModal();
                        }
                    });
                }
            }, 0);
        }
    }

    if (state.cart.length === 0) {
        // If cart is empty, render the empty state directly
        cartItems.innerHTML = `
            <div class="cart__empty" id="emptyCart" style="display: block;">
                <p>Your cart is empty</p>
                <p class="cart__empty-subtitle">Add some beautiful pieces to get started!</p>
            </div>
        `;
        cartTotal.textContent = '₹0';
        return;
    }

    // Logic for non-empty cart
    // We already have User Details at top (if logged in)
    // Now append items

    // Note: emptyCart element reference is now stale if we wiped it. 
    // But we don't need it if we are rendering items.

    const itemsHTML = state.cart.map((item, index) => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.title}" class="cart-item__image">
            <div class="cart-item__info">
                <div class="cart-item__name">${item.title}</div>
                <div class="cart-item__price">₹${item.price.toLocaleString()}</div>
                <div class="cart-item__controls">
                    <button class="cart-item__btn" data-action="decrease" data-index="${index}" aria-label="Decrease quantity">-</button>
                    <span class="cart-item__quantity">${item.quantity}</span>
                    <button class="cart-item__btn" data-action="increase" data-index="${index}" aria-label="Increase quantity">+</button>
                    <button class="cart-item__remove" data-action="remove" data-index="${index}" aria-label="Remove item">Remove</button>
                </div>
            </div>
        </div>
    `).join('');

    cartItems.innerHTML += itemsHTML;

    // Calculate total
    const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `₹${total.toLocaleString()}`;
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = totalItems;
}

function handleCheckout() {
    // Redirect to checkout page
    window.location.href = 'checkout.html';
}

// ==================== WISHLIST ====================
async function toggleWishlistItem(productId) {
    // Use findIndex for loose equality check
    const index = state.wishlist.findIndex(id => id == productId);
    const product = state.products.find(p => p.id == productId);

    if (index > -1) {
        // Remove from wishlist
        if (typeof WishlistService !== 'undefined') {
            const success = await WishlistService.removeFromWishlist(productId);
            // Always update UI for responsiveness, revert if failed (optimistic UI)
            state.wishlist.splice(index, 1);
            showToast('Removed from wishlist');
        } else {
            state.wishlist.splice(index, 1);
            showToast('Removed from wishlist');
            saveToLocalStorage();
        }
    } else {
        // Add to wishlist
        if (typeof WishlistService !== 'undefined') {
            const success = await WishlistService.addToWishlist(productId);
            state.wishlist.push(productId);
            showToast(`${product ? product.title : 'Item'} added to wishlist! ❤️`);
            saveToLocalStorage();
        }
    }

    updateWishlistBadge();
    renderProducts(); // Re-render to update heart icons
}

function toggleWishlistFromModal() {
    if (!state.currentProduct) return;

    toggleWishlistItem(state.currentProduct.id);

    // Update modal button
    const wishlistBtn = document.getElementById('modalWishlistBtn');
    wishlistBtn.textContent = isInWishlist(state.currentProduct.id) ? '❤️' : '♡';
}

function isInWishlist(productId) {
    return state.wishlist.some(id => id == productId);
}

// ==================== WISHLIST PANEL ====================
function toggleWishlistPanel() {
    const wishlistPanel = document.getElementById('wishlistPanel');
    const isVisible = wishlistPanel.style.display === 'block';

    if (isVisible) {
        closeWishlist();
    } else {
        wishlistPanel.style.display = 'block';
        renderWishlist();
        document.body.style.overflow = 'hidden';
    }
}

function closeWishlist() {
    document.getElementById('wishlistPanel').style.display = 'none';
    document.body.style.overflow = '';
}

function renderWishlist() {
    const wishlistItems = document.getElementById('wishlistItems');
    const emptyWishlist = document.getElementById('emptyWishlist');
    const wishlistBadge = document.getElementById('wishlistBadge');

    // Add null checks to prevent errors
    if (!wishlistItems || !emptyWishlist || !wishlistBadge) {
        console.error('Wishlist elements not found in DOM');
        return;
    }

    // Update badge
    wishlistBadge.textContent = state.wishlist.length;

    if (state.wishlist.length === 0) {
        emptyWishlist.style.display = 'block';
        wishlistItems.innerHTML = '';
        return;
    }

    emptyWishlist.style.display = 'none';

    const itemsHTML = state.wishlist.map(productId => {
        const product = state.products.find(p => p.id == productId);
        if (!product) return '';

        return `
            <div class="cart-item">
                <img src="${product.images[0]}" alt="${product.title}" class="cart-item__image">
                <div class="cart-item__info">
                    <div class="cart-item__name">${product.title}</div>
                    <div class="cart-item__price">$${product.price.toLocaleString()}</div>
                    <div class="cart-item__controls">
                        <button class="btn btn--primary" data-action="add-to-cart" data-product-id="${productId}" style="font-size: 0.75rem; padding: 0.25rem 0.75rem;">Add to Cart</button>
                        <button class="cart-item__remove" data-action="remove-from-wishlist" data-product-id="${productId}" aria-label="Remove from wishlist">Remove</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    wishlistItems.innerHTML = itemsHTML;
}

async function removeFromWishlist(productId) {
    // Use findIndex for loose equality (handle string vs number)
    const index = state.wishlist.findIndex(id => id == productId);
    if (index > -1) {
        if (typeof WishlistService !== 'undefined') {
            const success = await WishlistService.removeFromWishlist(productId);
            if (success) {
                state.wishlist.splice(index, 1);
                renderWishlist();
                renderProducts(); // Update heart icons
                showToast('Removed from wishlist');
            }
        } else {
            state.wishlist.splice(index, 1);
            saveToLocalStorage();
            renderWishlist();
            renderProducts(); // Update heart icons
            showToast('Removed from wishlist');
        }
    }
}

function handleWishlistItemClick(e) {
    const button = e.target.closest('[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const productIdRaw = button.dataset.productId;
    // Check if it's a number-like string to decide parsing, OR simply keep as string if we want strictness.
    // However, existing codebase seems to prefer numbers where possible but handles strings for UUIDs.
    // Best match with handleProductCardClick logic:
    const productId = isNaN(productIdRaw) ? productIdRaw : Number(productIdRaw);

    if (action === 'add-to-cart') {
        addToCartFromWishlist(productId);
    } else if (action === 'remove-from-wishlist') {
        removeFromWishlist(productId);
    }
}

function addToCartFromWishlist(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    addToCart(productId);
    showToast(`${product.title} added to cart!`);
}

// ==================== DARK MODE ====================
function toggleDarkMode() {
    state.darkMode = !state.darkMode;

    if (state.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }

    // Update icon
    const icon = document.querySelector('#darkModeToggle .icon');
    if (icon) {
        icon.textContent = state.darkMode ? '☀️' : '🌙';
    }

    saveToLocalStorage();
}

// ==================== KEYBOARD ACCESSIBILITY ====================
function handleKeyboard(e) {
    // ESC key closes modal, cart, and wishlist
    if (e.key === 'Escape') {
        const modal = document.getElementById('productModal');
        const cart = document.getElementById('cartPanel');
        const wishlist = document.getElementById('wishlistPanel');

        if (modal.style.display === 'flex') {
            closeModal();
        } else if (cart.style.display === 'block') {
            closeCart();
        } else if (wishlist.style.display === 'block') {
            closeWishlist();
        }
    }
}
// ==================== CAROUSEL PANEL =========================
// ==================== CAROUSEL PANEL (DYNAMIC) =========================
async function initHeroCarousel() {
    const slidesEl = document.getElementById('slides');
    const dotsEl = document.getElementById('dots');
    const carousel = document.getElementById('carousel');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (!slidesEl || !carousel) return;

    // 1. Fetch slides from service
    let slidesData = [];
    const loader = document.getElementById('carouselLoader');

    if (typeof CarouselService !== 'undefined') {
        slidesData = await CarouselService.getSlides();
    }

    // 2. Hide Loader
    if (loader) loader.style.display = 'none';

    // 3. Render slides if we have data
    if (slidesData && slidesData.length > 0) {
        slidesEl.innerHTML = slidesData.map(slide => `
            <article class="slide" data-title="${slide.title}" data-price="${slide.price}">
                <img src="${slide.image}" alt="${slide.title}" onerror="this.src='assets/images/placeholder.svg'" />
                ${slide.subtitle ? `<span class="badge">${slide.subtitle}</span>` : ''}
                <div class="info">
                    <h2 class="title">${slide.title}</h2>
                    <p class="desc">${slide.description}</p>
                    <div class="price">
                        <span class="amount">${slide.price}</span>
                        ${slide.oldPrice ? `<span class="old">${slide.oldPrice}</span>` : ''}
                    </div>
                </div>
            </article>
        `).join('');
    } else {
        // Empty state fallback or keep default articles? (Already removed in previous step)
        slidesEl.innerHTML = '<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:white;">No active banners collections.</div>';
    }

    const slides = Array.from(slidesEl.querySelectorAll('.slide'));
    let current = 0;
    const total = slides.length;
    let autoplayInterval = 4000;
    let timer = null;
    let isDragging = false;
    let startX = 0;

    // 3. Create dots
    dotsEl.innerHTML = '';
    slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'dot';
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        dot.addEventListener('click', () => goTo(i));
        dotsEl.appendChild(dot);
    });

    const dots = Array.from(dotsEl.children);

    function updateUI() {
        slidesEl.style.transform = `translateX(-${current * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    function goTo(index) {
        current = (index + total) % total;
        updateUI();
        restartAutoplay();
    }

    function next() {
        current = (current + 1) % total;
        updateUI();
    }

    function prev() {
        current = (current - 1 + total) % total;
        updateUI();
    }

    function startAutoplay() {
        stopAutoplay();
        timer = setInterval(next, autoplayInterval);
    }

    function stopAutoplay() {
        if (timer) { clearInterval(timer); timer = null; }
    }

    function restartAutoplay() {
        stopAutoplay();
        startAutoplay();
    }

    // Listeners
    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);
    if (nextBtn) nextBtn.addEventListener('click', () => { next(); restartAutoplay(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { prev(); restartAutoplay(); });

    // Touch / Drag
    slidesEl.addEventListener('pointerdown', (e) => {
        isDragging = true;
        startX = e.clientX;
        slidesEl.style.transition = 'none';
        stopAutoplay();
    });

    window.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        slidesEl.style.transform = `translateX(${-current * 100 + (dx / carousel.offsetWidth) * 100}%)`;
    });

    window.addEventListener('pointerup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        slidesEl.style.transition = '';
        const dx = e.clientX - startX;
        const threshold = carousel.offsetWidth * 0.15;
        if (dx > threshold) prev();
        else if (dx < -threshold) next();
        else updateUI();
        restartAutoplay();
    });

    // Initialize
    updateUI();
    startAutoplay();

    // Expose API
    window.LuxCarousel = { goTo, next, prev, start: startAutoplay, stop: stopAutoplay };
}

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerHTML = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}


// ==================== UTILITY FUNCTIONS ====================
// Helper function to update wishlist badge
function updateWishlistBadge() {
    const wishlistBadge = document.getElementById('wishlistBadge');
    wishlistBadge.textContent = state.wishlist.length;
}

// Make functions globally available for inline event handlers
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.removeFromWishlist = removeFromWishlist;
window.addToCartFromWishlist = addToCartFromWishlist;
