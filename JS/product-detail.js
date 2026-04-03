/**
 * ============================================================
 * PRODUCT DETAIL PAGE — product-detail.js
 * ============================================================
 */

(function () {
    'use strict';

    const API_BASE = 'https://jewelley-ecommerce-webiste-bk.onrender.com/api/products';
    const IMG_BASE = 'https://jewelley-ecommerce-webiste-bk.onrender.com';

    let currentProduct = null;
    let currentImageIndex = 0;
    let selectedVariant = null;
    let currentQuantity = 1;

    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        const id = getProductIdFromUrl();
        setupGlobalActions();
        if (!id) {
            showError('No product ID found in URL.');
            updateBadges();
            return;
        }
        await loadProduct(id);
        updateBadges();
    }

    function getProductIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

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

    function renderProduct(p) {
        const images = getImages(p);
        const price = Number(p.price) || 0;
        const mrp = Number(p.mrp) || 0;
        const discountPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

        document.title = `${p.productName} — Guru Jewellery`;

        const app = document.getElementById('pd-app');
        app.innerHTML = `
            <nav class="pd-breadcrumb" aria-label="Breadcrumb">
                <div class="pd-breadcrumb__inner">
                    <a href="index.html">Home</a>
                    <span class="pd-breadcrumb__sep">›</span>
                    <span class="pd-breadcrumb__current">${escHtml(p.productName)}</span>
                </div>
            </nav>

            <div class="pd-container">
                <aside class="pd-gallery" aria-label="Product images">
                    <div class="pd-gallery__main" id="pd-main-img-wrap">
                        ${images.length > 1 ? `
                            <button class="pd-gallery__arrow pd-gallery__arrow--prev" id="pd-prev-img" aria-label="Previous image">&#8249;</button>
                            <button class="pd-gallery__arrow pd-gallery__arrow--next" id="pd-next-img" aria-label="Next image">&#8250;</button>
                        ` : ''}
                        <img id="pd-main-img" src="${images[0]}" alt="${escHtml(p.productName)}" class="pd-gallery__main-img" onerror="this.src='assets/images/placeholder.svg'">
                    </div>
                    ${images.length > 1 ? `
                        <div class="pd-gallery__thumbs" id="pd-thumbs" role="list">
                            ${images.map((src, i) => `
                                <div class="pd-gallery__thumb ${i === 0 ? 'active' : ''}" role="listitem" data-index="${i}" tabindex="0">
                                    <img src="${src}" alt="Image ${i + 1}" onerror="this.src='assets/images/placeholder.svg'">
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </aside>

                <section class="pd-info" aria-label="Product details">
                    <h1 class="pd-info__title">${escHtml(p.productName)}</h1>
                    <div class="pd-info__rating">
                        <span class="pd-info__stars">★★★★½</span>
                        <span class="pd-info__review-count">(Rated)</span>
                    </div>
                    <div class="pd-info__price-block">
                        <span class="pd-info__price">₹${price.toLocaleString('en-IN')}</span>
                        ${mrp > price ? `
                            <span class="pd-info__mrp">₹${mrp.toLocaleString('en-IN')}</span>
                            <span class="pd-info__discount">${discountPct}% OFF</span>
                        ` : ''}
                    </div>
                    <hr class="pd-divider">
                    ${p.description ? `
                        <div>
                            <p class="pd-info__desc-heading">Description</p>
                            <p class="pd-info__description">${escHtml(p.description)}</p>
                        </div>
                        <hr class="pd-divider">
                    ` : ''}
                    ${renderAttributes(p)}
                    ${renderVariants(p)}
                    
                    <div class="pd-quantity">
                        <label class="pd-quantity__label">Quantity</label>
                        <div class="pd-quantity__controls">
                            <button class="pd-quantity__btn" id="pd-qty-minus" aria-label="Decrease quantity">−</button>
                            <span class="pd-quantity__value" id="pd-qty-val">1</span>
                            <button class="pd-quantity__btn" id="pd-qty-plus" aria-label="Increase quantity">+</button>
                        </div>
                    </div>

                    <div class="pd-info__actions">
                        <button class="pd-btn pd-btn--cart" id="pd-add-cart">🛒 Add to Cart</button>
                        <button class="pd-btn pd-btn--buy" id="pd-buy-now">⚡ Buy Now</button>
                        <button class="pd-btn pd-btn--wishlist" id="pd-wishlist">♡</button>
                    </div>
                </section>
            </div>
        `;

        wireGallery(images);
        wireActions(p);
    }

    function renderAttributes(p) {
        const rows = [];
        const statics = [
            { key: 'Material', val: p.material },
            { key: 'Color', val: p.color },
            { key: 'Plating', val: p.plating },
            { key: 'Size', val: p.size },
            { key: 'Occasion', val: p.occasion },
            { key: 'Brand', val: p.brand },
        ];
        statics.forEach(({ key, val }) => { if (val && val !== 'N/A') rows.push({ key, val }); });
        if (Array.isArray(p.attributes)) {
            p.attributes.forEach(attr => rows.push({ key: attr.key || attr.name, val: attr.value }));
        }
        if (rows.length === 0) return '';
        return `
            <div>
                <p class="pd-info__attr-heading">Specifications</p>
                <div class="pd-attributes">
                    ${rows.map(r => `
                        <div class="pd-attribute-row">
                            <span class="pd-attr-key">${escHtml(r.key)}</span>
                            <span class="pd-attr-val">${escHtml(r.val)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <hr class="pd-divider">
        `;
    }

    function renderVariants(p) {
        if (!Array.isArray(p.variants) || p.variants.length === 0) return '';
        const pills = p.variants.map((v, i) => {
            const stock = Number(v.stock) || 0;
            const outOfStock = stock <= 0;
            return `
                <div class="pd-variant-pill ${outOfStock ? 'out-of-stock' : ''} ${i === 0 && !outOfStock ? 'selected' : ''}"
                     data-variant-index="${i}" data-stock="${stock}">
                    ${escHtml(v.size || v.color || 'Variant')}
                    <span class="pd-variant-stock">${outOfStock ? '(Out of stock)' : `Stock: ${stock}`}</span>
                </div>
            `;
        }).join('');
        return `
            <div>
                <p class="pd-info__variants-heading">Available Variants</p>
                <div class="pd-variants" id="pd-variants">${pills}</div>
            </div>
            <hr class="pd-divider">
        `;
    }

    function wireGallery(images) {
        const mainImg = document.getElementById('pd-main-img');
        const thumbs = document.getElementById('pd-thumbs');
        if (!mainImg) return;
        const setImage = (i) => {
            currentImageIndex = (i + images.length) % images.length;
            mainImg.src = images[currentImageIndex];
            if (thumbs) {
                thumbs.querySelectorAll('.pd-gallery__thumb').forEach((t, idx) => {
                    t.classList.toggle('active', idx === currentImageIndex);
                });
            }
        };
        document.getElementById('pd-prev-img')?.addEventListener('click', () => setImage(currentImageIndex - 1));
        document.getElementById('pd-next-img')?.addEventListener('click', () => setImage(currentImageIndex + 1));
        thumbs?.addEventListener('click', e => {
            const t = e.target.closest('.pd-gallery__thumb');
            if (t) setImage(parseInt(t.dataset.index));
        });
    }

    function wireActions(p) {
        // Reset quantity on render
        currentQuantity = 1;
        const qtyVal = document.getElementById('pd-qty-val');
        const btnMinus = document.getElementById('pd-qty-minus');
        const btnPlus = document.getElementById('pd-qty-plus');

        const updateQtyUI = () => {
            if (qtyVal) qtyVal.textContent = currentQuantity;
            if (btnMinus) btnMinus.disabled = currentQuantity <= 1;
        };

        btnMinus?.addEventListener('click', () => {
            if (currentQuantity > 1) {
                currentQuantity--;
                updateQtyUI();
            }
        });

        btnPlus?.addEventListener('click', () => {
            const max = selectedVariant ? (Number(selectedVariant.stock) || 99) : 99;
            if (currentQuantity < max) {
                currentQuantity++;
                updateQtyUI();
            } else {
                showToast(`Only ${max} units available in stock.`);
            }
        });

        const variantsEl = document.getElementById('pd-variants');
        if (variantsEl) {
            const first = variantsEl.querySelector('.pd-variant-pill:not(.out-of-stock)');
            if (first) selectedVariant = p.variants[parseInt(first.dataset.variantIndex)];
            variantsEl.addEventListener('click', e => {
                const pill = e.target.closest('.pd-variant-pill:not(.out-of-stock)');
                if (!pill) return;
                variantsEl.querySelectorAll('.pd-variant-pill').forEach(el => el.classList.remove('selected'));
                pill.classList.add('selected');
                selectedVariant = p.variants[parseInt(pill.dataset.variantIndex)];
            });
        }
        document.getElementById('pd-add-cart')?.addEventListener('click', () => handleAddToCart(p));
        document.getElementById('pd-buy-now')?.addEventListener('click', () => {
            _saveToLocalCart(buildCartItem(p));
            window.location.href = 'checkout.html';
        });
        const wishBtn = document.getElementById('pd-wishlist');
        if (wishBtn) {
            updateWishlistBtn(wishBtn, p.id);
            wishBtn.addEventListener('click', () => handleToggleWishlist(p, wishBtn));
        }
    }

    // ── Core Logic ───────────────────────────────────────────
    async function handleAddToCart(p) {
        const item = buildCartItem(p);
        showToast('Adding to cart...');
        if (typeof CartService !== 'undefined' && !!localStorage.getItem('jewel_token')) {
            try {
                await CartService.addToCart(p.id, currentQuantity);
            } catch (e) { _saveToLocalCart(item); }
        } else {
            _saveToLocalCart(item);
        }
        showToast(`${currentQuantity} × ${p.productName} added to cart! 🛒`);
        updateBadges();
        if (document.getElementById('cartPanel')?.style.display === 'block') renderMiniCart();
    }

    async function handleToggleWishlist(p, btn) {
        if (typeof WishlistService !== 'undefined') {
            await WishlistService.toggle(p.id);
        } else {
            localToggleWishlist(p.id);
        }
        updateWishlistBtn(btn, p.id);
        showToast(isWishlisted(p.id) ? 'Added to wishlist ❤️' : 'Removed from wishlist');
        updateBadges();
        if (document.getElementById('wishlistPanel')?.style.display === 'block') renderWishlist();
    }

    function localToggleWishlist(id) {
        let list = JSON.parse(localStorage.getItem('jewel_wishlist') || '[]');
        const idx = list.findIndex(w => String(w.id || w) === String(id));
        if (idx >= 0) list.splice(idx, 1); else list.push(id);
        localStorage.setItem('jewel_wishlist', JSON.stringify(list));
    }

    function isWishlisted(id) {
        const list = JSON.parse(localStorage.getItem('jewel_wishlist') || '[]');
        return list.some(w => String(w.id || w) === String(id));
    }

    function updateWishlistBtn(btn, id) {
        const loved = isWishlisted(id);
        btn.textContent = loved ? '❤️' : '♡';
        btn.classList.toggle('active', loved);
    }

    function buildCartItem(p) {
        return {
            id: p.id,
            title: p.productName,
            price: parseFloat(p.price) || 0,
            image: getImages(p)[0],
            quantity: 1
        };
    }

    function _saveToLocalCart(item) {
        const cart = JSON.parse(localStorage.getItem('jewel_cart') || '[]');
        const idx = cart.findIndex(c => String(c.id) === String(item.id));
        if (idx >= 0) cart[idx].quantity += 1; else cart.push(item);
        localStorage.setItem('jewel_cart', JSON.stringify(cart));
    }

    // ── Global Render/Badge Logic (Called by UI toggles) ──────
    async function updateBadges() {
        const wBadge = document.getElementById('wishlistBadge');
        if (wBadge) {
            let list = [];
            if (typeof WishlistService !== 'undefined') {
                try { list = await WishlistService.fetchWishlist(); } catch { list = JSON.parse(localStorage.getItem('jewel_wishlist') || '[]'); }
            } else { list = JSON.parse(localStorage.getItem('jewel_wishlist') || '[]'); }
            wBadge.textContent = list.length;
        }

        const cBadge = document.getElementById('cartBadge');
        if (cBadge) {
            let items = [];
            if (typeof CartService !== 'undefined' && !!localStorage.getItem('jewel_token')) {
                try { const res = await CartService.getCart(); items = res.items || []; } catch { items = JSON.parse(localStorage.getItem('jewel_cart') || '[]'); }
            } else { items = JSON.parse(localStorage.getItem('jewel_cart') || '[]'); }
            cBadge.textContent = items.reduce((acc, i) => acc + (i.quantity || 1), 0);
        }
    }

    async function renderWishlist() {
        const container = document.getElementById('wishlistItems');
        const empty = document.getElementById('emptyWishlist');
        if (!container || !empty) return;

        let list = [];
        if (typeof WishlistService !== 'undefined') {
            try { list = await WishlistService.fetchWishlist(); } catch { list = JSON.parse(localStorage.getItem('jewel_wishlist') || '[]'); }
        } else { list = JSON.parse(localStorage.getItem('jewel_wishlist') || '[]'); }

        if (list.length === 0) {
            empty.style.display = 'block';
            container.innerHTML = '';
            return;
        }
        empty.style.display = 'none';
        container.innerHTML = '<p style="text-align:center; padding:1rem;">Loading...</p>';

        try {
            const productPromises = list.map(id => ProductService.getProductById(id.id || id).catch(() => null));
            const products = (await Promise.all(productPromises)).filter(p => p !== null);
            container.innerHTML = products.map(p => `
                <div class="cart-item">
                    <img src="${resolveImageUrl(p.images[0])}" class="cart-item__image">
                    <div class="cart-item__info">
                        <div class="cart-item__name">${escHtml(p.productName)}</div>
                        <div class="cart-item__price">₹${Number(p.price).toLocaleString()}</div>
                        <button class="cart-item__remove" onclick="window.miniWishlistAction('remove', '${p.id}')">Remove</button>
                    </div>
                </div>
            `).join('');
        } catch { container.innerHTML = '<p>Error loading items</p>'; }
    }

    async function renderMiniCart() {
        const container = document.getElementById('cartItems');
        const empty = document.getElementById('emptyCart');
        const totalEl = document.getElementById('cartTotal');
        if (!container || !empty) return;

        let items = JSON.parse(localStorage.getItem('jewel_cart') || '[]');
        if (items.length === 0) {
            empty.style.display = 'block';
            container.innerHTML = '';
            if (totalEl) totalEl.textContent = '₹0';
            return;
        }
        empty.style.display = 'none';
        let total = 0;
        container.innerHTML = items.map(i => {
            total += (i.price * i.quantity);
            return `
                <div class="cart-item">
                    <img src="${resolveImageUrl(i.image)}" class="cart-item__image">
                    <div class="cart-item__info">
                        <div class="cart-item__name">${escHtml(i.title)}</div>
                        <div class="cart-item__price">₹${Number(i.price).toLocaleString()}</div>
                        <div class="cart-item__qty-row">
                            <button class="cart-item__btn" onclick="window.miniCartAction('decrease', '${i.id}', ${i.quantity})">-</button>
                            <span class="cart-item__qty-val">${i.quantity}</span>
                            <button class="cart-item__btn" onclick="window.miniCartAction('increase', '${i.id}', ${i.quantity})">+</button>
                            <button class="cart-item__remove" onclick="window.miniCartAction('remove', '${i.id}')">×</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        if (totalEl) totalEl.textContent = `₹${total.toLocaleString()}`;
    }

    function setupGlobalActions() {
        window.renderMiniCart = renderMiniCart;
        window.renderWishlist = renderWishlist;
        window.updateBadges = updateBadges;

        window.miniWishlistAction = async (action, id) => {
            if (action === 'remove') {
                if (typeof WishlistService !== 'undefined') await WishlistService.removeFromWishlist(id);
                localToggleWishlist(id);
                updateBadges();
                renderWishlist();
                const btn = document.getElementById('pd-wishlist');
                if (btn && String(currentProduct?.id) === String(id)) updateWishlistBtn(btn, id);
            }
        };

        window.miniCartAction = async (action, id, qty) => {
            let cart = JSON.parse(localStorage.getItem('jewel_cart') || '[]');
            const idx = cart.findIndex(c => String(c.id) === String(id));
            if (idx === -1) return;

            if (action === 'increase') cart[idx].quantity += 1;
            else if (action === 'decrease') {
                cart[idx].quantity -= 1;
                if (cart[idx].quantity <= 0) cart.splice(idx, 1);
            } else if (action === 'remove') cart.splice(idx, 1);

            localStorage.setItem('jewel_cart', JSON.stringify(cart));
            updateBadges();
            renderMiniCart();
            
            // Sync with backend if logged in
            if (typeof CartService !== 'undefined' && !!localStorage.getItem('jewel_token')) {
                if (action === 'remove') CartService.removeFromCart(id);
                else CartService.addToCart(id, action === 'increase' ? 1 : -1);
            }
        };
    }

    // ── UI Helpers ───────────────────────────────────────────
    function showLoading() {
        document.getElementById('pd-app').innerHTML = `<div class="pd-loading"><div class="pd-loading__spinner"></div><p>Loading...</p></div>`;
    }
    function showError(msg) {
        document.getElementById('pd-app').innerHTML = `<div class="pd-error"><p>${escHtml(msg)}</p><a href="index.html">← Back</a></div>`;
    }
    function showToast(msg) {
        let t = document.getElementById('pd-toast');
        if (!t) { t = document.createElement('div'); t.id = 'pd-toast'; document.body.appendChild(t); }
        t.innerHTML = msg; t.classList.add('show');
        clearTimeout(t._timer); t._timer = setTimeout(() => t.classList.remove('show'), 3000);
    }
    function escHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

})();
