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

// ==================== PRODUCT DATA ====================
const PRODUCTS = [
    {
        id: 1,
        title: "Eternal Diamond Ring",
        description: "18K white gold ring with brilliant-cut diamond",
        price: 2499,
        category: "rings",
        images: [
            "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop"
        ],
        rating: 5,
        isNew: true,
        isOnSale: false,
        dateAdded: "2025-11-20"
    },
    {
        id: 2,
        title: "Sapphire Elegance Necklace",
        description: "Sterling silver necklace with blue sapphire pendant",
        price: 1899,
        category: "necklaces",
        images: [
            "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop"
        ],
        rating: 5,
        isNew: true,
        isOnSale: false,
        dateAdded: "2025-11-22"
    },
    {
        id: 3,
        title: "Rose Gold Charm Bracelet",
        description: "Delicate rose gold bracelet with heart charms",
        price: 899,
        category: "bracelets",
        images: [
            "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&h=600&fit=crop"
        ],
        rating: 4,
        isNew: false,
        isOnSale: true,
        dateAdded: "2025-10-15"
    },
    {
        id: 4,
        title: "Pearl Drop Earrings",
        description: "Classic freshwater pearl earrings in gold",
        price: 599,
        category: "earrings",
        images: [
            "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&h=600&fit=crop"
        ],
        rating: 5,
        isNew: false,
        isOnSale: true,
        dateAdded: "2025-09-10"
    },
    {
        id: 5,
        title: "Vintage Emerald Ring",
        description: "Art deco inspired emerald and diamond ring",
        price: 3299,
        category: "rings",
        images: [
            "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop"
        ],
        rating: 5,
        isNew: true,
        isOnSale: false,
        dateAdded: "2025-11-25"
    },
    {
        id: 6,
        title: "Gold Chain Necklace",
        description: "14K yellow gold chain with adjustable length",
        price: 1299,
        category: "necklaces",
        images: [
            "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600&h=600&fit=crop"
        ],
        rating: 4,
        isNew: false,
        isOnSale: false,
        dateAdded: "2025-08-20"
    },
    {
        id: 7,
        title: "Tennis Bracelet",
        description: "Classic diamond tennis bracelet in platinum",
        price: 4599,
        category: "bracelets",
        images: [
            "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&h=600&fit=crop"
        ],
        rating: 5,
        isNew: false,
        isOnSale: true,
        dateAdded: "2025-07-12"
    },
    {
        id: 8,
        title: "Crystal Stud Earrings",
        description: "Sparkling crystal studs in sterling silver",
        price: 399,
        category: "earrings",
        images: [
            "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&h=600&fit=crop"
        ],
        rating: 4,
        isNew: false,
        isOnSale: false,
        dateAdded: "2025-06-05"
    },
    {
        id: 9,
        title: "Infinity Band Ring",
        description: "Modern infinity symbol ring in white gold",
        price: 799,
        category: "rings",
        images: [
            "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&h=600&fit=crop"
        ],
        rating: 5,
        isNew: true,
        isOnSale: false,
        dateAdded: "2025-11-18"
    },
    {
        id: 10,
        title: "Moonstone Pendant",
        description: "Mystical moonstone pendant on silver chain",
        price: 699,
        category: "necklaces",
        images: [
            "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop"
        ],
        rating: 4,
        isNew: false,
        isOnSale: true,
        dateAdded: "2025-05-22"
    },
    {
        id: 11,
        title: "Bangle Set",
        description: "Set of three gold-plated bangles",
        price: 499,
        category: "bracelets",
        images: [
            "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop"
        ],
        rating: 4,
        isNew: false,
        isOnSale: false,
        dateAdded: "2025-04-10"
    },
    {
        id: 12,
        title: "Hoop Earrings",
        description: "Large gold hoop earrings with diamond accents",
        price: 1199,
        category: "earrings",
        images: [
            "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop"
        ],
        rating: 5,
        isNew: true,
        isOnSale: false,
        dateAdded: "2025-11-15"
    }
];

// ==================== STATE MANAGEMENT ====================
const state = {
    products: [...PRODUCTS],
    filteredProducts: [...PRODUCTS],
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

function initializeApp() {
    // Load saved data from localStorage
    loadFromLocalStorage();

    // Apply dark mode if saved
    if (state.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Render initial products
    renderProducts();

    // Setup event listeners
    setupEventListeners();

    // Update cart badge
    updateCartBadge();

    // Update wishlist badge
    updateWishlistBadge();
}

// ==================== LOCAL STORAGE ====================
function loadFromLocalStorage() {
    try {
        const savedCart = localStorage.getItem('jewel_cart');
        const savedWishlist = localStorage.getItem('jewel_wishlist');
        const savedDarkMode = localStorage.getItem('jewel_darkMode');

        if (savedCart) state.cart = JSON.parse(savedCart);
        if (savedWishlist) state.wishlist = JSON.parse(savedWishlist);
        if (savedDarkMode) state.darkMode = JSON.parse(savedDarkMode);
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('jewel_cart', JSON.stringify(state.cart));
        localStorage.setItem('jewel_wishlist', JSON.stringify(state.wishlist));
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
                    <span class="product-card__price">$${product.price.toLocaleString()}</span>
                    <button 
                        class="product-card__quick-view" 
                        data-action="quick-view"
                        aria-label="Quick view ${product.title}"
                    >
                        Quick View
                    </button>
                </div>
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

    const productId = parseInt(card.dataset.productId);
    const action = e.target.closest('[data-action]')?.dataset.action;

    if (action === 'quick-view') {
        openProductModal(productId);
    } else if (action === 'wishlist') {
        toggleWishlistItem(productId);
    }
}

// ==================== MODAL ====================
function openProductModal(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    state.currentProduct = product;
    state.currentImageIndex = 0;

    const modal = document.getElementById('productModal');

    // Update modal content
    document.getElementById('modalTitle').textContent = product.title;
    document.getElementById('modalPrice').textContent = `$${product.price.toLocaleString()}`;
    document.getElementById('modalDescription').textContent = product.description;
    document.getElementById('modalRating').innerHTML = renderStars(product.rating);

    // Update image
    updateModalImage();

    // Update carousel dots
    renderCarouselDots();

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
    const product = state.products.find(p => p.id === productId);
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
                <div class="cart-item__price">$${item.price.toLocaleString()}</div>
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
    cartTotal.textContent = `$${total.toLocaleString()}`;
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
function toggleWishlistItem(productId) {
    const index = state.wishlist.indexOf(productId);
    const product = state.products.find(p => p.id === productId);

    if (index > -1) {
        state.wishlist.splice(index, 1);
        showToast('Removed from wishlist');
    } else {
        state.wishlist.push(productId);
        showToast(`${product ? product.title : 'Item'} added to wishlist!`);
    }

    saveToLocalStorage();
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
    return state.wishlist.includes(productId);
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

function removeFromWishlist(productId) {
    const index = state.wishlist.indexOf(productId);
    if (index > -1) {
        state.wishlist.splice(index, 1);
        saveToLocalStorage();
        renderWishlist();
        renderProducts(); // Update heart icons
        showToast('Removed from wishlist');
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
