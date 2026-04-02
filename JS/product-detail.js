/**
 * ============================================================
 * PRODUCT DETAIL PAGE — product-detail.js
 * Fetches a single product by ID from the API and renders it.
 * ============================================================
 */

(function () {
    'use strict';

    // ── Config ──────────────────────────────────────────────
    const API_BASE = 'https://jewelley-ecommerce-webiste-bk.onrender.com/api/products';
    const IMG_BASE = 'https://jewelley-ecommerce-webiste-bk.onrender.com';

    // ── State ───────────────────────────────────────────────
    let currentProduct = null;
    let currentImageIndex = 0;
    let selectedVariant = null;

    // ── Boot ────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        const id = getProductIdFromUrl();
        if (!id) {
            showError('No product ID found in URL.');
            return;
        }
        await loadProduct(id);
    }

    function getProductIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    // ── API ─────────────────────────────────────────────────
    async function loadProduct(id) {
        showLoading();
        try {
            const res = await fetch(`${API_BASE}/${id}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            currentProduct = data;
            renderProduct(data);
        } catch (err) {
            console.error('Failed to load product:', err);
            showError('Could not load product. Please try again later.');
        }
    }

    // ── Image helpers ────────────────────────────────────────
    function resolveImageUrl(path) {
        if (!path) return 'assets/images/placeholder.svg';
        if (path.startsWith('http') || path.startsWith('data:')) return path;
        const clean = path.replace(/\\/g, '/').replace(/^\//, '');
        return `${IMG_BASE}/${clean}`;
    }

    function getImages(product) {
        if (product.images && product.images.length > 0) {
            return product.images.map(resolveImageUrl);
        }
        return ['assets/images/placeholder.svg'];
    }

    // ── Render ───────────────────────────────────────────────
    function renderProduct(p) {
        const images = getImages(p);
        const price = Number(p.price) || 0;
        const mrp = Number(p.mrp) || 0;
        const discountPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

        document.title = `${p.productName} — Guru Jewellery`;

        const app = document.getElementById('pd-app');
        app.innerHTML = `
            <!-- Breadcrumb -->
            <nav class="pd-breadcrumb" aria-label="Breadcrumb">
                <div class="pd-breadcrumb__inner">
                    <a href="index.html">Home</a>
                    <span class="pd-breadcrumb__sep">›</span>
                    <span class="pd-breadcrumb__current">${escHtml(p.productName)}</span>
                </div>
            </nav>

            <!-- Two-Column Layout -->
            <div class="pd-container">

                <!-- LEFT: Gallery -->
                <aside class="pd-gallery" aria-label="Product images">
                    <div class="pd-gallery__main" id="pd-main-img-wrap">
                        ${images.length > 1 ? `
                            <button class="pd-gallery__arrow pd-gallery__arrow--prev" id="pd-prev-img" aria-label="Previous image">&#8249;</button>
                            <button class="pd-gallery__arrow pd-gallery__arrow--next" id="pd-next-img" aria-label="Next image">&#8250;</button>
                        ` : ''}
                        <img
                            id="pd-main-img"
                            src="${images[0]}"
                            alt="${escHtml(p.productName)}"
                            class="pd-gallery__main-img"
                            onerror="this.src='assets/images/placeholder.svg'"
                        >
                    </div>

                    ${images.length > 1 ? `
                        <div class="pd-gallery__thumbs" id="pd-thumbs" role="list" aria-label="Product images">
                            ${images.map((src, i) => `
                                <div class="pd-gallery__thumb ${i === 0 ? 'active' : ''}"
                                     role="listitem"
                                     data-index="${i}"
                                     tabindex="0"
                                     aria-label="View image ${i + 1}">
                                    <img src="${src}" alt="Image ${i + 1}" onerror="this.src='assets/images/placeholder.svg'">
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </aside>

                <!-- RIGHT: Info -->
                <section class="pd-info" aria-label="Product details">

                    <h1 class="pd-info__title">${escHtml(p.productName)}</h1>

                    <div class="pd-info__rating" aria-label="Rating 4.5 out of 5">
                        <span class="pd-info__stars">★★★★½</span>
                        <span class="pd-info__review-count">(Rated)</span>
                    </div>

                    <!-- Price -->
                    <div class="pd-info__price-block">
                        <span class="pd-info__price">₹${price.toLocaleString('en-IN')}</span>
                        ${mrp > price ? `
                            <span class="pd-info__mrp">₹${mrp.toLocaleString('en-IN')}</span>
                            <span class="pd-info__discount">${discountPct}% OFF</span>
                        ` : ''}
                    </div>

                    <hr class="pd-divider">

                    <!-- Description -->
                    ${p.description ? `
                        <div>
                            <p class="pd-info__desc-heading">Description</p>
                            <p class="pd-info__description">${escHtml(p.description)}</p>
                        </div>
                        <hr class="pd-divider">
                    ` : ''}

                    <!-- Dynamic Attributes -->
                    ${renderAttributes(p)}

                    <!-- Dynamic Variants -->
                    ${renderVariants(p)}

                    <!-- Action Buttons -->
                    <div class="pd-info__actions">
                        <button class="pd-btn pd-btn--cart" id="pd-add-cart">
                            🛒 Add to Cart
                        </button>
                        <button class="pd-btn pd-btn--buy" id="pd-buy-now">
                            ⚡ Buy Now
                        </button>
                        <button class="pd-btn pd-btn--wishlist" id="pd-wishlist" aria-label="Add to wishlist">
                            ♡
                        </button>
                    </div>


                </section>
            </div>
        `;

        // Wire up image gallery
        wireGallery(images);

        // Wire up action buttons
        wireActions(p);
    }

    // ── Attribute renderer ───────────────────────────────────
    function renderAttributes(p) {
        const rows = [];

        // Static fields (only show if not empty / not default)
        const statics = [
            { key: 'Material',  val: p.material  },
            { key: 'Color',     val: p.color     },
            { key: 'Plating',   val: p.plating   },
            { key: 'Size',      val: p.size      },
            { key: 'Occasion',  val: p.occasion  },
            { key: 'Brand',     val: p.brand     },
        ];

        statics.forEach(({ key, val }) => {
            if (val && val !== 'N/A' && val !== 'null') {
                rows.push({ key, val });
            }
        });

        // Dynamic attributes array (from the new backend model)
        if (Array.isArray(p.attributes) && p.attributes.length > 0) {
            p.attributes.forEach(attr => {
                const k = attr.key || attr.attributeName || attr.name;
                const v = attr.value || attr.attributeValue;
                if (k && v) rows.push({ key: k, val: v });
            });
        }

        if (rows.length === 0) return '';

        return `
            <div>
                <p class="pd-info__attr-heading">Specifications</p>
                <div class="pd-attributes">
                    ${rows.map(r => `
                        <div class="pd-attribute-row">
                            <span class="pd-attr-key">${escHtml(String(r.key))}</span>
                            <span class="pd-attr-val">${escHtml(String(r.val))}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <hr class="pd-divider">
        `;
    }

    // ── Variant renderer ─────────────────────────────────────
    function renderVariants(p) {
        if (!Array.isArray(p.variants) || p.variants.length === 0) return '';

        const pills = p.variants.map((v, i) => {
            const label = buildVariantLabel(v);
            const stock = v.stock !== undefined && v.stock !== null ? Number(v.stock) : null;
            const outOfStock = stock !== null && stock <= 0;

            return `
                <div class="pd-variant-pill ${outOfStock ? 'out-of-stock' : ''} ${i === 0 && !outOfStock ? 'selected' : ''}"
                     data-variant-index="${i}"
                     data-stock="${stock ?? ''}"
                     role="button"
                     tabindex="${outOfStock ? -1 : 0}"
                     aria-label="${label}${stock !== null ? (outOfStock ? ' - Out of stock' : ` - ${stock} in stock`) : ''}">
                    ${escHtml(label)}
                    ${stock !== null ? `<span class="pd-variant-stock">${outOfStock ? '(Out of stock)' : `Stock: ${stock}`}</span>` : ''}
                </div>
            `;
        }).join('');

        return `
            <div>
                <p class="pd-info__variants-heading">Available Variants</p>
                <div class="pd-variants" id="pd-variants">
                    ${pills}
                </div>
            </div>
            <hr class="pd-divider">
        `;
    }

    function buildVariantLabel(v) {
        const parts = [];
        if (v.size)  parts.push(v.size);
        if (v.color) parts.push(v.color);
        // Fallback: pick any key that's not stock/id
        if (parts.length === 0) {
            Object.entries(v).forEach(([k, val]) => {
                if (!['stock', 'id', '_id'].includes(k.toLowerCase()) && val) {
                    parts.push(`${k}: ${val}`);
                }
            });
        }
        return parts.join(' - ') || 'Variant';
    }

    // ── Gallery Wiring ────────────────────────────────────────
    function wireGallery(images) {
        const mainImg = document.getElementById('pd-main-img');
        const thumbsContainer = document.getElementById('pd-thumbs');

        function setImage(index) {
            currentImageIndex = (index + images.length) % images.length;
            mainImg.src = images[currentImageIndex];
            mainImg.alt = `Image ${currentImageIndex + 1}`;
            if (thumbsContainer) {
                thumbsContainer.querySelectorAll('.pd-gallery__thumb').forEach((t, i) => {
                    t.classList.toggle('active', i === currentImageIndex);
                });
            }
        }

        // Arrow buttons
        const prevBtn = document.getElementById('pd-prev-img');
        const nextBtn = document.getElementById('pd-next-img');
        if (prevBtn) prevBtn.addEventListener('click', () => setImage(currentImageIndex - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => setImage(currentImageIndex + 1));

        // Thumbnails
        if (thumbsContainer) {
            thumbsContainer.addEventListener('click', e => {
                const thumb = e.target.closest('.pd-gallery__thumb');
                if (thumb) setImage(parseInt(thumb.dataset.index, 10));
            });
            thumbsContainer.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    const thumb = e.target.closest('.pd-gallery__thumb');
                    if (thumb) setImage(parseInt(thumb.dataset.index, 10));
                }
            });
        }
    }

    // ── Action Buttons Wiring ────────────────────────────────
    function wireActions(p) {
        // Variants
        const variantsEl = document.getElementById('pd-variants');
        if (variantsEl) {
            // Auto-select first in-stock variant
            const first = variantsEl.querySelector('.pd-variant-pill:not(.out-of-stock)');
            if (first) {
                selectedVariant = p.variants[parseInt(first.dataset.variantIndex, 10)];
            }

            variantsEl.addEventListener('click', e => {
                const pill = e.target.closest('.pd-variant-pill:not(.out-of-stock)');
                if (!pill) return;
                variantsEl.querySelectorAll('.pd-variant-pill').forEach(el => el.classList.remove('selected'));
                pill.classList.add('selected');
                selectedVariant = p.variants[parseInt(pill.dataset.variantIndex, 10)];
            });
        }

        // Add to Cart
        document.getElementById('pd-add-cart')?.addEventListener('click', () => {
            addToCart(p);
        });

        // Buy Now
        document.getElementById('pd-buy-now')?.addEventListener('click', () => {
            buyNow(p);
        });

        // Wishlist
        const wishBtn = document.getElementById('pd-wishlist');
        if (wishBtn) {
            updateWishlistBtn(wishBtn, p.id);
            wishBtn.addEventListener('click', () => toggleWishlist(p, wishBtn));
        }
    }

    // ── Cart ─────────────────────────────────────────────────
    function addToCart(p) {
        const item = buildCartItem(p);
        if (typeof CartService !== 'undefined' && CartService.addToCart) {
            CartService.addToCart(p.id, 1)
                .then((res) => {
                    // CartService returns null if user is not logged in
                    if (res === null) {
                        _saveToLocalCart(item);
                    }
                    showToast(`${p.productName} added to cart! 🛒`);
                    updateDetailsCartBadge();
                })
                .catch(() => {
                    // Backend failed — save to localStorage as fallback
                    _saveToLocalCart(item);
                    showToast(`${p.productName} added to cart! 🛒`);
                    updateDetailsCartBadge();
                });
        } else {
            _saveToLocalCart(item);
            showToast(`${p.productName} added to cart! 🛒`);
            updateDetailsCartBadge();
        }
    }

    async function updateDetailsCartBadge() {
        const badge = document.getElementById('cartBadge');
        if (!badge) return;
        
        let count = 0;
        if (typeof CartService !== 'undefined' && typeof AuthState !== 'undefined' && AuthState.isLoggedIn()) {
            try {
                const apiCart = await CartService.getCart();
                if (apiCart) {
                    const itemsStr = Array.isArray(apiCart) ? apiCart : (apiCart.items || apiCart.cartItems || apiCart.products || apiCart.cart || []);
                    count = itemsStr.reduce((sum, item) => sum + (item.quantity !== undefined ? item.quantity : (item.qty || 1)), 0);
                }
            } catch(e) { }
        } else {
            const cart = JSON.parse(localStorage.getItem('jewel_cart') || '[]');
            count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        }
        badge.textContent = count;
    }

    // Explicitly exposed globally for the inline product.html script to invoke
    window.renderMiniCart = async function() {
        const cartItemsEl = document.getElementById('cartItems');
        const cartTotalEl = document.getElementById('cartTotal');
        if (!cartItemsEl) return;

        // Show spinner safely so user knows background request is working 
        cartItemsEl.innerHTML = '<div style="padding: 1.5rem; text-align: center;"><div class="pd-loading__spinner" style="margin: 0 auto 10px;"></div><p>Loading your cart...</p></div>';

        let items = [];
        if (typeof CartService !== 'undefined' && typeof AuthState !== 'undefined' && AuthState.isLoggedIn()) {
            try {
                const apiCart = await CartService.getCart();
                if (apiCart) {
                    const itemsStr = Array.isArray(apiCart) ? apiCart : (apiCart.items || apiCart.cartItems || apiCart.products || apiCart.cart || []);
                    for (const item of itemsStr) {
                        const pid = item.productId || item.product?.id || item.id;
                        const pqty = item.quantity !== undefined ? item.quantity : (item.qty || 1);
                        items.push({ id: pid, qty: pqty });
                    }
                }
            } catch (e) {
                console.error('Error fetching backend mini-cart:', e);
            }
        } else {
            const localCart = JSON.parse(localStorage.getItem('jewel_cart') || '[]');
            items = localCart.map(i => ({ id: i.id, qty: i.quantity, localData: i }));
        }

        if (items.length === 0) {
            cartItemsEl.innerHTML = `
                <div class="cart__empty" id="emptyCart" style="display: block;">
                    <p>Your cart is empty</p>
                    <p class="cart__empty-subtitle">Add some beautiful pieces to get started!</p>
                </div>`;
            if (cartTotalEl) cartTotalEl.textContent = '₹0';
            return;
        }

        let total = 0;
        let htmlStr = '';
        
        // Render each item, potentially fetching full product details if needed
        for (const item of items) {
            let title = 'Product ' + item.id;
            let price = 0;
            let image = 'assets/images/placeholder.svg';
            
            if (item.localData) {
                title = item.localData.title || title;
                price = Number(item.localData.price) || 0;
                image = item.localData.image || image;
            } else if (typeof ProductService !== 'undefined') {
                 // Try to fetch full product details from API cache or live
                 try {
                     const p = await ProductService.getProductById(item.id);
                     if (p) {
                         title = p.productName;
                         price = Number(p.price) || 0;
                         if (p.images && p.images.length > 0) {
                             const img = p.images[0];
                             image = img.startsWith('http') || img.startsWith('data:') ? img : `https://jewelley-ecommerce-webiste-bk.onrender.com/${img.replace(/\\\\/g, '/')}`;
                         }
                     }
                 } catch(e) {}
            }
            
            total += (price * item.qty);
            htmlStr += `
            <div class="cart-item">
                <img src="${image}" alt="${title}" class="cart-item__image">
                <div class="cart-item__info">
                    <div class="cart-item__name">${title}</div>
                    <div class="cart-item__price">₹${price.toLocaleString()}</div>
                    <div class="cart-item__controls">
                        <button class="cart-item__btn" onclick="window.miniCartAction('decrease', '${item.id}', ${item.qty})" aria-label="Decrease quantity">-</button>
                        <span class="cart-item__quantity">${item.qty}</span>
                        <button class="cart-item__btn" onclick="window.miniCartAction('increase', '${item.id}', ${item.qty})" aria-label="Increase quantity">+</button>
                        <button class="cart-item__remove" onclick="window.miniCartAction('remove', '${item.id}')" aria-label="Remove item">Remove</button>
                    </div>
                </div>
            </div>`;
        }
        
        cartItemsEl.innerHTML = htmlStr;
        if (cartTotalEl) cartTotalEl.textContent = `₹${total.toLocaleString()}`;
    };

    window.miniCartAction = async function(action, id, currentQty = 1) {
        const isLoggedIn = typeof AuthState !== 'undefined' && AuthState.isLoggedIn();
        
        // Auto-remove if decreasing at quantity 1
        if (action === 'decrease' && currentQty <= 1) {
            action = 'remove';
        }

        const change = action === 'increase' ? 1 : -1;

        // --- Optimistic DOM Update ---
        const cartItemsEl = document.getElementById('cartItems');
        const cartTotalEl = document.getElementById('cartTotal');
        
        if (cartItemsEl) {
            const btns = cartItemsEl.querySelectorAll('button');
            for(let btn of btns) {
                const onclickAttr = btn.getAttribute('onclick');
                if (onclickAttr && onclickAttr.includes(`'${id}'`)) {
                    const row = btn.closest('.cart-item');
                    if (row) {
                        if (action === 'remove') {
                            row.remove();
                            // If cart becomes empty
                            if (cartItemsEl.querySelectorAll('.cart-item').length === 0) {
                                cartItemsEl.innerHTML = `
                                    <div class="cart__empty" id="emptyCart" style="display: block;">
                                        <p>Your cart is empty</p>
                                        <p class="cart__empty-subtitle">Add some beautiful pieces to get started!</p>
                                    </div>`;
                            }
                        } else {
                            const newQty = currentQty + change;
                            const qtySpan = row.querySelector('.cart-item__quantity');
                            if (qtySpan) qtySpan.textContent = newQty;
                            
                            const incBtn = row.querySelector('.cart-item__btn[aria-label="Increase quantity"]');
                            if (incBtn) incBtn.setAttribute('onclick', `window.miniCartAction('increase', '${id}', ${newQty})`);
                            
                            const decBtn = row.querySelector('.cart-item__btn[aria-label="Decrease quantity"]');
                            if (decBtn) decBtn.setAttribute('onclick', `window.miniCartAction('decrease', '${id}', ${newQty})`);
                        }
                        break;
                    }
                }
            }

            // Immediately recalculate total
            let newTotal = 0;
            cartItemsEl.querySelectorAll('.cart-item').forEach(row => {
                const priceEl = row.querySelector('.cart-item__price');
                const qtyEl = row.querySelector('.cart-item__quantity');
                if (priceEl && qtyEl) {
                    const priceMatch = priceEl.textContent.replace(/[^0-9.-]+/g, "");
                    const pVal = parseFloat(priceMatch);
                    const qVal = parseInt(qtyEl.textContent, 10);
                    if (!isNaN(pVal) && !isNaN(qVal)) {
                        newTotal += (pVal * qVal);
                    }
                }
            });
            if (cartTotalEl) cartTotalEl.textContent = `₹${newTotal.toLocaleString()}`;
        }

        // Update top badge optimistically
        const badge = document.getElementById('cartBadge');
        if (badge) {
            let current = parseInt(badge.textContent.trim()) || 0;
            if (action === 'remove') {
                current -= currentQty;
            } else {
                current += change;
            }
            badge.textContent = Math.max(0, current);
        }

        // --- Background Sync ---
        if (action === 'remove') {
            if (isLoggedIn && typeof CartService !== 'undefined') {
                CartService.removeFromCart(id).catch(e => console.error(e));
            } else {
                let cart = JSON.parse(localStorage.getItem('jewel_cart') || '[]');
                cart = cart.filter(c => String(c.id) !== String(id));
                localStorage.setItem('jewel_cart', JSON.stringify(cart));
            }
            showToast('Item removed from cart');
        } else {
            if (isLoggedIn && typeof CartService !== 'undefined') {
                CartService.addToCart(id, change).catch(e => console.error('Qty sync failed', e));
            } else {
                let cart = JSON.parse(localStorage.getItem('jewel_cart') || '[]');
                const idx = cart.findIndex(c => String(c.id) === String(id));
                if (idx >= 0) {
                    cart[idx].quantity = (cart[idx].quantity || 1) + change;
                    if (cart[idx].quantity <= 0) {
                        cart.splice(idx, 1);
                        showToast('Item removed from cart');
                    }
                    localStorage.setItem('jewel_cart', JSON.stringify(cart));
                }
            }
        }
    };

    function _saveToLocalCart(item) {
        const cart = JSON.parse(localStorage.getItem('jewel_cart') || '[]');
        const idx = cart.findIndex(c => c.id == item.id);
        if (idx >= 0) {
            cart[idx].quantity = (cart[idx].quantity || 1) + 1;
        } else {
            cart.push(item);
        }
        localStorage.setItem('jewel_cart', JSON.stringify(cart));
    }

    function buyNow(p) {
        const item = buildCartItem(p);
        localStorage.setItem('jewel_buyNowItem', JSON.stringify(item));
        window.location.href = 'checkout.html';
    }

    function buildCartItem(p) {
        return {
            id: p.id,
            title: p.productName,
            price: parseFloat(p.price) || 0,
            image: getImages(p)[0],
            quantity: 1,
            size: selectedVariant?.size || p.size || 'Free Size',
            metal: p.material || 'Gold'
        };
    }

    // ── Wishlist ─────────────────────────────────────────────
    function isWishlisted(id) {
        try {
            const list = JSON.parse(localStorage.getItem('jewel_wishlist') || '[]');
            return list.some(w => {
                if (!w) return false;
                // Handle both object {id: ...} and raw ID
                const itemId = (typeof w === 'object') ? (w.id || w.productId) : w;
                return String(itemId) === String(id);
            });
        } catch { return false; }
    }

    function updateWishlistBtn(btn, id) {
        const loved = isWishlisted(id);
        btn.textContent = loved ? '❤️' : '♡';
        btn.classList.toggle('active', loved);
        btn.setAttribute('aria-label', loved ? 'Remove from wishlist' : 'Add to wishlist');
    }

    function toggleWishlist(p, btn) {
        if (typeof WishlistService !== 'undefined') {
            WishlistService.toggle(p.id).then(() => {
                updateWishlistBtn(btn, p.id);
                showToast(isWishlisted(p.id) ? '❤️ Added to wishlist' : 'Removed from wishlist');
            }).catch(() => localToggleWishlist(p, btn));
        } else {
            localToggleWishlist(p, btn);
        }
    }

    function localToggleWishlist(p, btn) {
        const list = JSON.parse(localStorage.getItem('jewel_wishlist') || '[]');
        // Handle both objects and raw IDs in the list for lookup
        const idx = list.findIndex(w => {
            const itemId = (typeof w === 'object') ? (w.id || w.productId) : w;
            return String(itemId) === String(p.id);
        });

        if (idx >= 0) {
            list.splice(idx, 1);
            showToast('Removed from wishlist');
        } else {
            // Save only ID to match WishlistService and app.js standard
            list.push(p.id);
            showToast('❤️ Added to wishlist');
        }
        localStorage.setItem('jewel_wishlist', JSON.stringify(list));
        updateWishlistBtn(btn, p.id);
    }

    // ── UI States ────────────────────────────────────────────
    function showLoading() {
        document.getElementById('pd-app').innerHTML = `
            <div class="pd-loading" role="status" aria-live="polite">
                <div class="pd-loading__spinner"></div>
                <p>Loading product...</p>
            </div>
        `;
    }

    function showError(msg) {
        document.getElementById('pd-app').innerHTML = `
            <div class="pd-error" role="alert">
                <span class="pd-error__icon">⚠️</span>
                <p class="pd-error__title">Something went wrong</p>
                <p>${escHtml(msg)}</p>
                <a href="index.html" class="pd-back-link">← Back to Products</a>
            </div>
        `;
    }

    // ── Toast ─────────────────────────────────────────────────
    function showToast(msg) {
        let toast = document.getElementById('pd-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'pd-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ── Utility ───────────────────────────────────────────────
    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

})();
