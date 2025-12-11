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
        sortBy: 'newest'
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

    // Load data from API
    await loadDataFromApi();

    // Load wishlist from backend if user is logged in
    loadWishlistFromBackend();

    // Setup event listeners
    setupEventListeners();

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

        // 1. Fetch Categories
        const categories = await ProductService.getAllCategories();
        state.categories = categories;
        populateCategoryFilter();
        renderCategoryBar();

        // 2. Fetch Products
        const apiProducts = await ProductService.getAllProducts();

        // 3. Map API data to frontend model
        state.products = apiProducts.map(mapApiProductToFrontend);
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
    // Find category name
    const categoryObj = state.categories.find(c => c.id === apiProduct.categoryId || c._id === apiProduct.categoryId);
    const categoryName = categoryObj ? categoryObj.name.toLowerCase() : 'uncategorized';

    // Handle images
    let images = [];
    if (apiProduct.images && apiProduct.images.length > 0) {
        images = apiProduct.images.map(getFullImageUrl);
    } else {
        images = ['assets/images/placeholder.svg'];
    }

    return {
        id: apiProduct.id, // Keep original ID
        title: apiProduct.productName,
        description: apiProduct.description || 'No description available',
        price: apiProduct.price,
        category: categoryObj ? categoryObj.id : 'others', // Use ID for filtering
        categoryName: categoryName, // Keep name for display if needed
        images: images,
        // ... existing properties
        rating: 4.5, // Default
        isNew: true, // Default
        isOnSale: apiProduct.discountPercent > 0,
        discountPercent: apiProduct.discountPercent,
        mrp: apiProduct.mrp,

        // New Specification Fields
        material: apiProduct.material || 'N/A',
        plating: apiProduct.plating || 'N/A',
        occasion: apiProduct.occasion || 'Everyday',
        color: apiProduct.color || 'N/A',
        size: apiProduct.size || 'Free Size',

        dateAdded: new Date().toISOString()
    };
}

function getFullImageUrl(imagePath) {
    if (!imagePath) return 'assets/images/placeholder.svg';
    if (imagePath.startsWith('http') || imagePath.startsWith('https')) return imagePath;
    if (imagePath.startsWith('data:')) return imagePath;

    // Handle potential incorrect backslashes
    imagePath = imagePath.replace(/\\/g, '/');

    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    return `http://localhost:8080/${cleanPath}`;
}

const CATEGORY_ICONS = {
    'rings': 'https://images.unsplash.com/photo-1605100804763-ebea2407aabd?auto=format&fit=crop&w=100&q=80',
    'necklaces': 'https://images.unsplash.com/photo-1599643478518-17488fbbcd75?auto=format&fit=crop&w=100&q=80',
    'bracelets': 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=100&q=80',
    'earrings': 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=100&q=80',
    'default': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=100&q=80',
    'all': 'https://images.unsplash.com/photo-1576158676285-b473796412f4?auto=format&fit=crop&w=100&q=80'
};



function populateCategoryFilter() {
    const filterSelect = document.getElementById('categoryFilter');
    if (!filterSelect) return;

    // Keep "All Categories"
    filterSelect.innerHTML = '<option value="all">All Categories</option>';

    state.categories.forEach(category => {
        const option = document.createElement('option');
        // Use ID as value for robust filtering
        option.value = category.id || category._id;
        option.textContent = category.name;
        filterSelect.appendChild(option);
    });
}

function renderCategoryBar() {
    const categoryBar = document.getElementById('categoryBar');
    if (!categoryBar) return;

    // Add "All" category at start
    const allCategoryHtml = `
        <button class="category-item ${state.filters.category === 'all' ? 'active' : ''}" 
                onclick="setCategoryFilter('all')">
            <img src="${CATEGORY_ICONS['all']}" alt="All" class="category-item__image" loading="lazy">
            <span class="category-item__text">All</span>
        </button>
    `;

    const categoriesHtml = state.categories.map(category => {
        const normalizedName = category.name.toLowerCase();
        // Check for specific icon map, fallback to default
        let iconSrc = CATEGORY_ICONS[normalizedName] || CATEGORY_ICONS['default'];

        const isActive = state.filters.category === (category.id || category._id);
        const categoryId = category.id || category._id;

        return `
            <button class="category-item ${isActive ? 'active' : ''}" 
                    onclick="setCategoryFilter('${categoryId}')">
                <img src="${iconSrc}" alt="${category.name}" class="category-item__image" loading="lazy">
                <span class="category-item__text">${category.name}</span>
            </button>
        `;
    }).join('');

    categoryBar.innerHTML = allCategoryHtml + categoriesHtml;
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
    // Search
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', handleSearch);

    // Mobile Search (sync with desktop search)
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', handleSearch);
    }

    // Filters
    document.getElementById('categoryFilter').addEventListener('change', handleCategoryFilter);

    document.getElementById('sortBy').addEventListener('change', handleSort);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);

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



    // Event delegation for product cards
    document.getElementById('productGrid').addEventListener('click', handleProductCardClick);

    // Event delegation for cart items
    document.getElementById('cartItems').addEventListener('click', handleCartItemClick);

    // Event delegation for wishlist items
    document.getElementById('wishlistItems').addEventListener('click', handleWishlistItemClick);

    // Keyboard accessibility
    document.addEventListener('keydown', handleKeyboard);
}

// ==================== SEARCH & FILTER ====================
function handleSearch(e) {
    state.filters.search = e.target.value.toLowerCase();
    applyFilters();
}

function handleCategoryFilter(e) {
    state.filters.category = e.target.value;
    renderCategoryBar(); // Sync bar highlight
    applyFilters();
}



function handleSort(e) {
    state.filters.sortBy = e.target.value;
    applyFilters();
}

function clearFilters() {
    state.filters = {
        search: '',
        category: 'all',

        sortBy: 'newest'
    };

    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = 'all';

    document.getElementById('sortBy').value = 'newest';

    applyFilters();
}

function applyFilters() {
    let filtered = [...state.products];

    // Search filter
    if (state.filters.search) {
        filtered = filtered.filter(product =>
            product.title.toLowerCase().includes(state.filters.search) ||
            product.description.toLowerCase().includes(state.filters.search)
        );
    }

    // Category filter
    if (state.filters.category !== 'all') {
        filtered = filtered.filter(product => product.category === state.filters.category);
    }



    // Sort
    switch (state.filters.sortBy) {
        case 'price-low':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            filtered.sort((a, b) => b.rating - a.rating);
            break;
        case 'newest':
            filtered.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
            break;
    }

    state.filteredProducts = filtered;
    renderProducts();
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
        <article class="product-card" role="listitem" data-product-id="${product.id}">
            <div class="product-card__image-wrapper">
                <img 
                    src="${product.images[0]}" 
                    alt="${product.title}"
                    class="product-card__image"
                    loading="lazy"
                >
                <div class="product-card__badges">
                    ${product.isNew ? '<span class="badge--new">New</span>' : ''}
                    ${product.isOnSale ? '<span class="badge--sale">Sale</span>' : ''}
                </div>
                <button 
                    class="product-card__wishlist ${isInWishlist(product.id) ? 'active' : ''}" 
                    data-action="wishlist"
                    aria-label="Add to wishlist"
                >
                    ${isInWishlist(product.id) ? '❤️' : '♡'}
                </button>
            </div>
            <div class="product-card__content">
                <h3 class="product-card__title">${product.title}</h3>
                <p class="product-card__description">${product.description}</p>
                <div class="product-card__rating" aria-label="Rating: ${product.rating} out of 5 stars">
                    ${renderStars(product.rating)}
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
                        aria-label="Quick view ${product.title}"
                    >
                        View
                    </button>
            </div>
        </article>
    `).join('');
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

    if (action === 'quick-view') {
        openProductModal(productId);
    } else if (action === 'wishlist') {
        toggleWishlistItem(productId);
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

// ==================== CART ====================
function addToCartFromModal() {
    if (!state.currentProduct) return;

    const size = document.getElementById('sizeSelect').value;
    const metal = document.getElementById('metalSelect').value;

    addToCart(state.currentProduct.id, size, metal);
    showToast(`${state.currentProduct.title} added to cart!`);
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
}

function removeFromCart(index) {
    const item = state.cart[index];
    state.cart.splice(index, 1);
    renderCart();
    updateCartBadge();
    saveToLocalStorage();
    showToast(`${item.title} removed from cart`);
}

function updateCartQuantity(index, change) {
    const item = state.cart[index];
    item.quantity += change;

    if (item.quantity <= 0) {
        removeFromCart(index);
    } else {
        renderCart();
        updateCartBadge();
        saveToLocalStorage();
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

    // Add null checks to prevent errors
    if (!cartItems || !emptyCart || !cartTotal) {
        console.error('Cart elements not found in DOM');
        return;
    }

    if (state.cart.length === 0) {
        emptyCart.style.display = 'block';
        cartItems.innerHTML = '';
        cartTotal.textContent = '$0.00';
        return;
    }

    emptyCart.style.display = 'none';

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

    cartItems.innerHTML = itemsHTML;

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
    showToast('Checkout is a demo feature. In production, this would redirect to payment processing.');
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
            showToast(`${product ? product.title : 'Item'} added to wishlist!`);
        } else {
            state.wishlist.push(productId);
            showToast(`${product ? product.title : 'Item'} added to wishlist!`);
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
        const product = state.products.find(p => p.id === productId);
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
    const index = state.wishlist.indexOf(productId);
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
    const productId = parseInt(button.dataset.productId);

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
    icon.textContent = state.darkMode ? '☀️' : '🌙';

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
(function () {
    const slidesEl = document.getElementById('slides');
    const slides = Array.from(slidesEl.querySelectorAll('.slide'));
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const dotsEl = document.getElementById('dots');
    const carousel = document.getElementById('carousel');

    let current = 0;
    const total = slides.length;
    let autoplayInterval = 2500;
    let timer = null;
    let isDragging = false;
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationID = 0;

    // Create dots
    slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'dot';
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        dot.addEventListener('click', () => goTo(i));
        dotsEl.appendChild(dot);
    });

    const dots = Array.from(dotsEl.children);

    function updateUI() {
        // Move slides
        slidesEl.style.transform = `translateX(-${current * 100}%)`;
        // Update dots
        dots.forEach((d, i) => d.classList.toggle('active', i === current));
        // Update live region or ARIA if needed (here slide articles already have content)
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

    // Autoplay
    function startAutoplay() {
        stopAutoplay();
        timer = setInterval(() => {
            next();
        }, autoplayInterval);
    }

    function stopAutoplay() {
        if (timer) { clearInterval(timer); timer = null; }
    }

    function restartAutoplay() {
        stopAutoplay();
        startAutoplay();
    }

    // Pause on hover/focus
    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);
    carousel.addEventListener('focusin', stopAutoplay);
    carousel.addEventListener('focusout', startAutoplay);

    // Buttons
    nextBtn.addEventListener('click', () => { next(); restartAutoplay(); });
    prevBtn.addEventListener('click', () => { prev(); restartAutoplay(); });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { prev(); restartAutoplay(); }
        if (e.key === 'ArrowRight') { next(); restartAutoplay(); }
    });

    // Touch / Drag support
    slidesEl.addEventListener('pointerdown', pointerDown);
    window.addEventListener('pointerup', pointerUp);
    window.addEventListener('pointermove', pointerMove);

    function pointerDown(e) {
        isDragging = true;
        startX = e.clientX;
        slidesEl.style.transition = 'none';
        stopAutoplay();
    }
    function pointerMove(e) {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        slidesEl.style.transform = `translateX(${-current * 100 + (dx / carousel.offsetWidth) * 100}%)`;
    }
    function pointerUp(e) {
        if (!isDragging) return;
        isDragging = false;
        slidesEl.style.transition = '';
        const dx = e.clientX - startX;
        const threshold = carousel.offsetWidth * 0.18;
        if (dx > threshold) {
            prev();
        } else if (dx < -threshold) {
            next();
        } else {
            updateUI(); // snap back
        }
        restartAutoplay();
    }

    // Initialize
    updateUI();
    startAutoplay();

    // Make slide content easily moddable: clicking a slide logs details (example hook)
    slides.forEach((s, idx) => {
        s.addEventListener('click', () => {
            const title = s.dataset.title || 'Product';
            const price = s.dataset.price || '';
            console.log('Selected:', title, price);
        });
    });

    // Expose a small API on window for quick customization in console
    window.LuxCarousel = {
        goTo,
        next,
        prev,
        start: startAutoplay,
        stop: stopAutoplay,
        getCurrent: () => current
    };
})();
// ==================== TOAST NOTIFICATIONS ====================
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
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
