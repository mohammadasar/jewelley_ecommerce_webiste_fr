/**
 * CATEGORY PAGE CONTROLLER
 * Handles logic for category.html — Amazon/Flipkart-style filter panel
 */

(function () {
    'use strict';

    const API_BASE = 'https://jewelley-ecommerce-webiste-bk.onrender.com/api/products';

    // ── State ───────────────────────────────────────────────────────────
    const state = {
        currentCategoryId: null,
        products: [],          // All products (raw from API)
        filteredProducts: [],  // After client/server filter
        categories: [],
        searchQuery: '',

        // Filter state
        filters: {
            minPrice: null,
            maxPrice: null,
            attributes: {},    // { "Material": ["Gold", "Silver"], ... }
            sortBy: ''
        },
        activeFilterCount: 0
    };

    // ── DOM refs ────────────────────────────────────────────────────────
    const pageTitle            = document.getElementById('pageTitle');
    const subCategorySection   = document.getElementById('subCategorySection');
    const subCategoryBar       = document.getElementById('subCategoryBar');
    const productGrid          = document.getElementById('productGrid');
    const searchInput          = document.getElementById('categorySearchInput');
    const productCount         = document.getElementById('productCount');
    const productCountDesktop  = document.getElementById('productCountDesktop');
    const noResults            = document.getElementById('noResults');
    const filterPanel          = document.getElementById('filterPanel');
    const filterOverlay        = document.getElementById('filterOverlay');
    const filterBadge          = document.getElementById('filterBadge');
    const filterClearAll       = document.getElementById('filterClearAll');
    const filterActiveTags     = document.getElementById('filterActiveTags');
    const dynamicFilterSections = document.getElementById('dynamicFilterSections');
    const sortSelectDesktop    = document.getElementById('sortSelectDesktop');
    const noResultsClear       = document.getElementById('noResultsClear');

    // Cart State (minimal)
    const cartState = {
        wishlist: [],
        currentProduct: null,
        currentImageIndex: 0
    };

    // ── Boot ─────────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', initializePage);

    async function initializePage() {
        const urlParams = new URLSearchParams(window.location.search);
        state.currentCategoryId = urlParams.get('id');

        if (!state.currentCategoryId) {
            window.location.href = 'index.html';
            return;
        }

        setupFilterUI();
        setupEventListeners();
        await loadData();
    }

    // ── Event Listeners ─────────────────────────────────────────────────
    function setupEventListeners() {
        // Search
        searchInput?.addEventListener('input', (e) => {
            state.searchQuery = e.target.value.toLowerCase();
            applyFilters();
        });

        // Desktop sort dropdown
        sortSelectDesktop?.addEventListener('change', (e) => {
            state.filters.sortBy = e.target.value;
            syncSortRadios(e.target.value);
            applyFilters();
        });

        // No-results clear
        noResultsClear?.addEventListener('click', clearAllFilters);
    }

    // ── Filter UI Setup ─────────────────────────────────────────────────
    function setupFilterUI() {
        // Price apply button
        document.getElementById('filterApplyPrice')?.addEventListener('click', applyPriceFilter);

        // Clear All
        filterClearAll?.addEventListener('click', clearAllFilters);

        // Mobile toggle open
        document.getElementById('filterMobileToggle')?.addEventListener('click', openMobileFilter);

        // Mobile overlay close
        filterOverlay?.addEventListener('click', closeMobileFilter);

        // Mobile Apply
        document.getElementById('filterMobileApply')?.addEventListener('click', () => {
            applyPriceFilter();
            closeMobileFilter();
            applyFilters();
        });

        // Mobile Reset
        document.getElementById('filterMobileReset')?.addEventListener('click', () => {
            clearAllFilters();
            closeMobileFilter();
        });

        // Section collapse toggles (event delegation)
        document.addEventListener('click', (e) => {
            const toggle = e.target.closest('.filter-section__toggle');
            if (!toggle) return;
            const section = toggle.closest('.filter-section');
            if (section) {
                section.classList.toggle('collapsed');
                toggle.setAttribute('aria-expanded', !section.classList.contains('collapsed'));
            }
        });

        // Sort radios inside filter panel
        document.addEventListener('change', (e) => {
            if (e.target.name === 'sortBy') {
                state.filters.sortBy = e.target.value;
                if (sortSelectDesktop) sortSelectDesktop.value = e.target.value;
                applyFilters();
            }
        });

        // Price inputs — pressing Enter triggers apply
        document.getElementById('filterMinPrice')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') applyPriceFilter();
        });
        document.getElementById('filterMaxPrice')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') applyPriceFilter();
        });
    }

    // ── Mobile Filter Panel ──────────────────────────────────────────────
    function openMobileFilter() {
        filterPanel?.classList.add('open');
        filterOverlay?.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileFilter() {
        filterPanel?.classList.remove('open');
        filterOverlay?.classList.remove('visible');
        document.body.style.overflow = '';
    }

    // ── Data Loading ─────────────────────────────────────────────────────
    async function loadData() {
        try {
            // 1. Fetch categories
            state.categories = await ProductService.getAllCategories();
            const currentCat = state.categories.find(c => (c.id || c._id) === state.currentCategoryId);
            if (currentCat) {
                pageTitle.textContent = currentCat.name;
                const header = document.querySelector('.category-header');
                if (header) {
                    const imgSrc = ProductService.getCategoryImageUrl(currentCat);
                    const fullImgUrl = imgSrc.startsWith('http') ? imgSrc : `https://jewelley-ecommerce-webiste-bk.onrender.com/${imgSrc}`;
                    header.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${fullImgUrl}')`;
                    header.style.backgroundSize = 'cover';
                    header.style.backgroundPosition = 'center';
                    if (pageTitle) {
                        pageTitle.style.color = '#ffffff';
                        pageTitle.style.textShadow = '0 2px 8px rgba(0,0,0,0.6)';
                    }
                }
            }
            renderSubCategories();

            // 2. Fetch products
            state.products = await ProductService.getProductsByCategory(state.currentCategoryId);
            state.filteredProducts = [...state.products];

            // 3. Wishlist
            if (typeof WishlistService !== 'undefined') {
                try {
                    cartState.wishlist = await WishlistService.fetchWishlist() || [];
                } catch (e) { /* ignore */ }
            }

            // 4. Build dynamic attribute filters from products
            buildDynamicAttributeFilters(state.products);

            // 5. Render
            renderProducts();

        } catch (err) {
            console.error('Error loading page data:', err);
            pageTitle.textContent = 'Error Loading Category';
        }
    }

    // ── Dynamic Attribute Filter Builder ─────────────────────────────────
    /**
     * Examines all products' `attributes` array and builds checkboxes
     * for every unique attribute key (Material, Color, Occasion, etc.)
     */
    function buildDynamicAttributeFilters(products) {
        if (!dynamicFilterSections) return;

        // Collect all attribute key → Set of values
        const attrMap = new Map(); // key → Set<value>

        // Also include flat fields  (material, color, occasion, brand, plating)
        const flatFields = [
            { key: 'Material',  field: 'material'  },
            { key: 'Color',     field: 'color'      },
            { key: 'Plating',   field: 'plating'    },
            { key: 'Occasion',  field: 'occasion'   },
            { key: 'Brand',     field: 'brand'      },
        ];

        products.forEach(p => {
            // Flat field attributes
            flatFields.forEach(({ key, field }) => {
                if (p[field] && p[field] !== 'N/A' && p[field] !== 'null') {
                    if (!attrMap.has(key)) attrMap.set(key, new Set());
                    attrMap.get(key).add(p[field]);
                }
            });

            // Dynamic attributes array: [{ key, value }, ...]
            if (Array.isArray(p.attributes)) {
                p.attributes.forEach(attr => {
                    const k = attr.key || attr.attributeName || attr.name;
                    const v = attr.value || attr.attributeValue;
                    if (k && v) {
                        if (!attrMap.has(k)) attrMap.set(k, new Set());
                        attrMap.get(k).add(v);
                    }
                });
            }
        });

        // Render one filter section per attribute key
        dynamicFilterSections.innerHTML = '';
        attrMap.forEach((values, attrKey) => {
            if (values.size === 0) return;
            const sectionEl = buildCheckboxSection(attrKey, [...values], products);
            dynamicFilterSections.appendChild(sectionEl);
        });
    }

    function buildCheckboxSection(attrKey, values, products) {
        const sectionId = `fs-attr-${attrKey.replace(/\s+/g, '-').toLowerCase()}`;
        const section = document.createElement('div');
        section.className = 'filter-section';
        section.id = sectionId;

        // Count products per value for hint numbers
        const countMap = new Map();
        values.forEach(v => {
            const cnt = products.filter(p => productHasAttribute(p, attrKey, v)).length;
            countMap.set(v, cnt);
        });

        // Show only top 5, "Show more" reveals rest
        const SHOW_LIMIT = 5;
        const visible   = values.slice(0, SHOW_LIMIT);
        const hidden    = values.slice(SHOW_LIMIT);

        const checkboxesHTML = (vals, extraClass = '') =>
            vals.map((val, i) => {
                const cbId = `cb-${attrKey}-${i}-${val}`.replace(/\s+/g, '_');
                const cnt  = countMap.get(val) || 0;
                return `
                <li class="filter-checkbox-item ${extraClass}">
                    <input type="checkbox"
                           id="${cbId}"
                           data-attr-key="${attrKey}"
                           data-attr-val="${val}">
                    <label for="${cbId}">${escHtml(val)}</label>
                    <span class="filter-checkbox-count">${cnt}</span>
                </li>`;
            }).join('');

        section.innerHTML = `
            <button class="filter-section__toggle" aria-expanded="true" data-target="${sectionId}">
                <span>${escHtml(attrKey)}</span>
                <span class="filter-section__chevron">▾</span>
            </button>
            <div class="filter-section__body">
                <ul class="filter-checkbox-list">
                    ${checkboxesHTML(visible)}
                    ${hidden.length > 0 ? `
                        <div class="filter-hidden-options" style="display:none;">
                            ${checkboxesHTML(hidden)}
                        </div>
                        <button class="filter-show-more" data-section="${sectionId}">
                            + ${hidden.length} more
                        </button>
                    ` : ''}
                </ul>
            </div>`;

        // Show-more toggle
        section.querySelector('.filter-show-more')?.addEventListener('click', function () {
            const hiddenDiv = section.querySelector('.filter-hidden-options');
            const isHidden  = hiddenDiv.style.display === 'none';
            hiddenDiv.style.display = isHidden ? 'block' : 'none';
            this.textContent = isHidden
                ? `▲ Show less`
                : `+ ${hidden.length} more`;
        });

        // Checkbox change → filter
        section.addEventListener('change', (e) => {
            const cb = e.target;
            if (cb.type !== 'checkbox') return;
            const key = cb.dataset.attrKey;
            const val = cb.dataset.attrVal;

            if (!state.filters.attributes[key]) {
                state.filters.attributes[key] = [];
            }
            if (cb.checked) {
                if (!state.filters.attributes[key].includes(val)) {
                    state.filters.attributes[key].push(val);
                }
            } else {
                state.filters.attributes[key] = state.filters.attributes[key].filter(v => v !== val);
                if (state.filters.attributes[key].length === 0) {
                    delete state.filters.attributes[key];
                }
            }

            applyFilters();
        });

        return section;
    }

    // Check if a product has a given attribute key/value (both flat & dynamic)
    function productHasAttribute(p, key, val) {
        const flatMap = {
            'Material': p.material, 'Color': p.color,
            'Plating': p.plating, 'Occasion': p.occasion, 'Brand': p.brand
        };
        if (flatMap[key] && String(flatMap[key]).toLowerCase() === String(val).toLowerCase()) return true;
        if (Array.isArray(p.attributes)) {
            return p.attributes.some(attr => {
                const k = attr.key || attr.attributeName || attr.name;
                const v = attr.value || attr.attributeValue;
                return String(k).toLowerCase() === String(key).toLowerCase() &&
                       String(v).toLowerCase() === String(val).toLowerCase();
            });
        }
        return false;
    }

    // ── Price Filter ─────────────────────────────────────────────────────
    function applyPriceFilter() {
        const minVal = parseFloat(document.getElementById('filterMinPrice')?.value);
        const maxVal = parseFloat(document.getElementById('filterMaxPrice')?.value);
        state.filters.minPrice = isNaN(minVal) ? null : minVal;
        state.filters.maxPrice = isNaN(maxVal) ? null : maxVal;
        applyFilters();
    }

    // ── Core Filter Engine — Calls Backend API ───────────────────────────
    let _filterDebounceTimer = null;

    function applyFilters() {
        clearTimeout(_filterDebounceTimer);
        _filterDebounceTimer = setTimeout(_doFetchFilter, 150);
    }

    async function _doFetchFilter() {
        updateActiveFilterTags();

        // Build payload matching ProductFilterRequest DTO
        const payload = {
            categoryIds: [state.currentCategoryId],
            sortBy: state.filters.sortBy || null
        };

        // Only send price keys if user actually set them
        if (state.filters.minPrice !== null) payload.minPrice = state.filters.minPrice;
        if (state.filters.maxPrice !== null) payload.maxPrice = state.filters.maxPrice;

        // Only send attributes if at least one is selected
        if (Object.keys(state.filters.attributes).length > 0) {
            payload.attributes = state.filters.attributes;
        }

        const hasActiveFilters = payload.minPrice != null ||
            payload.maxPrice   != null ||
            payload.attributes  != null ||
            (payload.sortBy    != null && payload.sortBy !== '');

        // If nothing is selected just show all products (no API call needed)
        if (!hasActiveFilters && !state.searchQuery) {
            state.filteredProducts = [...state.products];
            renderProducts();
            return;
        }

        // Show skeleton grid while waiting for API
        showGridSkeleton();

        try {
            const res = await fetch(`${API_BASE}/filter`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload)
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const productsRaw = await res.json();
            console.log("💎 [FILTER ENGINE] Raw Category Response:", productsRaw);

            if (!Array.isArray(productsRaw)) {
                console.error("❌ [FILTER ENGINE] Expected array of products, but got:", productsRaw);
                throw new Error("Backend response format error: expected array");
            }

            // Map backend field names to what renderProducts() expects
            let normalisedProducts = productsRaw.map(normaliseProduct);

            // Client-side search on top of API results
            if (state.searchQuery) {
                const q = state.searchQuery;
                normalisedProducts = normalisedProducts.filter(p =>
                    p.productName.toLowerCase().includes(q) ||
                    (p.description && p.description.toLowerCase().includes(q))
                );
            }

            // Client-side sort (API may not sort; we always sort here for consistency)
            normalisedProducts = clientSort(normalisedProducts, state.filters.sortBy);

            state.filteredProducts = normalisedProducts;

        } catch (err) {
            console.warn('Filter API failed, falling back to client-side:', err);
            // Graceful fallback — filter from the cached product list
            state.filteredProducts = clientSideFilter([...state.products]);
        }

        renderProducts();
    }

    // ── Client-side fallback when API is down ────────────────────────────
    function clientSideFilter(products) {
        const q = state.searchQuery;
        if (q) {
            products = products.filter(p =>
                p.productName.toLowerCase().includes(q) ||
                (p.description && p.description.toLowerCase().includes(q))
            );
        }
        if (state.filters.minPrice !== null)
            products = products.filter(p => Number(p.price) >= state.filters.minPrice);
        if (state.filters.maxPrice !== null)
            products = products.filter(p => Number(p.price) <= state.filters.maxPrice);

        const attrFilters = state.filters.attributes;
        Object.keys(attrFilters).forEach(key => {
            const vals = attrFilters[key];
            if (vals && vals.length > 0) {
                products = products.filter(p => vals.some(v => productHasAttribute(p, key, v)));
            }
        });

        return clientSort(products, state.filters.sortBy);
    }

    // ── Sort helper ──────────────────────────────────────────────────────
    function clientSort(products, sortBy) {
        const arr = [...products];
        switch (sortBy) {
            case 'price_asc':
                arr.sort((a, b) => Number(a.price) - Number(b.price));
                break;
            case 'price_desc':
                arr.sort((a, b) => Number(b.price) - Number(a.price));
                break;
            case 'newest':
                arr.sort((a, b) => {
                    const da = a.createdAt ? new Date(a.createdAt) : 0;
                    const db = b.createdAt ? new Date(b.createdAt) : 0;
                    return db - da;
                });
                break;
            case 'discount':
                arr.sort((a, b) => (Number(b.discountPercent) || 0) - (Number(a.discountPercent) || 0));
                break;
        }
        return arr;
    }

    // ── Normalise backend product to frontend shape ───────────────────────
    function normaliseProduct(p) {
        return {
            id:              p.id || p._id,
            productName:     p.productName || p.name || 'Product',
            description:     p.description || '',
            price:           Number(p.price)  || 0,
            mrp:             Number(p.mrp)    || 0,
            discountPercent: Number(p.discountPercent) || 0,
            images:          Array.isArray(p.images) ? p.images : [],
            material:        p.material  || '',
            color:           p.color     || '',
            plating:         p.plating   || '',
            occasion:        p.occasion  || '',
            brand:           p.brand     || '',
            attributes:      p.attributes || [],
            variants:        p.variants   || [],
            createdAt:       p.createdAt  || null,
            rating:          p.rating     || 4.5,
            isNew:           p.isNew      !== undefined ? p.isNew : true
        };
    }

    // ── Grid skeleton while API loads ────────────────────────────────────
    function showGridSkeleton() {
        const skeletonCard = () => `
            <article class="product-card" style="pointer-events:none;">
                <div style="background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);background-size:200% 100%;animation:skeleton-wave 1.4s infinite;height:220px;border-radius:8px 8px 0 0;"></div>
                <div style="padding:0.8rem;">
                    <div class="filter-skeleton" style="width:70%; margin-bottom:8px;"></div>
                    <div class="filter-skeleton" style="width:40%;"></div>
                </div>
            </article>`;
        productGrid.innerHTML = Array(6).fill(skeletonCard()).join('');
        if (noResults) noResults.style.display = 'none';
    }

    // ── Active Filter Tags ───────────────────────────────────────────────
    function updateActiveFilterTags() {
        if (!filterActiveTags) return;
        const tags = [];

        // Price tag
        if (state.filters.minPrice !== null || state.filters.maxPrice !== null) {
            const min = state.filters.minPrice !== null ? `₹${state.filters.minPrice.toLocaleString()}` : '₹0';
            const max = state.filters.maxPrice !== null ? `₹${state.filters.maxPrice.toLocaleString()}` : '∞';
            tags.push({ label: `${min} – ${max}`, key: '__price__', val: null });
        }

        // Attribute tags
        Object.entries(state.filters.attributes).forEach(([key, vals]) => {
            vals.forEach(val => tags.push({ label: `${key}: ${val}`, key, val }));
        });

        // Active filter count
        state.activeFilterCount = tags.length;
        if (filterBadge) {
            filterBadge.textContent = tags.length;
            filterBadge.classList.toggle('visible', tags.length > 0);
        }
        if (filterClearAll) {
            filterClearAll.classList.toggle('visible', tags.length > 0);
        }

        filterActiveTags.innerHTML = tags.map(t => `
            <span class="filter-tag" data-key="${escHtml(t.key)}" data-val="${t.val ? escHtml(t.val) : ''}">
                ${escHtml(t.label)}
                <button class="filter-tag__remove" aria-label="Remove filter ${escHtml(t.label)}">✕</button>
            </span>
        `).join('');

        // Wire remove buttons
        filterActiveTags.querySelectorAll('.filter-tag__remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.closest('.filter-tag');
                const key = tag.dataset.key;
                const val = tag.dataset.val;

                if (key === '__price__') {
                    state.filters.minPrice = null;
                    state.filters.maxPrice = null;
                    const minInput = document.getElementById('filterMinPrice');
                    const maxInput = document.getElementById('filterMaxPrice');
                    if (minInput) minInput.value = '';
                    if (maxInput) maxInput.value = '';
                } else if (val) {
                    state.filters.attributes[key] = (state.filters.attributes[key] || []).filter(v => v !== val);
                    if (state.filters.attributes[key].length === 0) delete state.filters.attributes[key];
                    // Uncheck the corresponding checkbox
                    document.querySelectorAll(`input[data-attr-key="${key}"][data-attr-val="${val}"]`)
                        .forEach(cb => { cb.checked = false; });
                }
                applyFilters();
            });
        });
    }

    // ── Clear All Filters ────────────────────────────────────────────────
    function clearAllFilters() {
        state.filters = { minPrice: null, maxPrice: null, attributes: {}, sortBy: '' };
        state.searchQuery = '';

        // Reset inputs
        const minInput = document.getElementById('filterMinPrice');
        const maxInput = document.getElementById('filterMaxPrice');
        if (minInput) minInput.value = '';
        if (maxInput) maxInput.value = '';
        if (searchInput) searchInput.value = '';
        if (sortSelectDesktop) sortSelectDesktop.value = '';
        document.querySelectorAll('input[name="sortBy"]').forEach(r => { r.checked = r.value === ''; });
        document.querySelectorAll('.filter-section input[type="checkbox"]').forEach(cb => { cb.checked = false; });

        applyFilters();
    }

    // Sync mobile sort-radios with desktop sort-select
    function syncSortRadios(val) {
        document.querySelectorAll('input[name="sortBy"]').forEach(r => {
            r.checked = r.value === val;
        });
    }

    // ── Render Products ─────────────────────────────────────────────────
    function renderProducts() {
        const count = state.filteredProducts.length;

        if (productCount)        productCount.textContent        = `${count} product${count !== 1 ? 's' : ''}`;
        if (productCountDesktop) productCountDesktop.textContent = `${count} product${count !== 1 ? 's' : ''}`;

        if (count === 0) {
            productGrid.innerHTML = '';
            if (noResults) noResults.style.display = 'block';
            return;
        }

        if (noResults) noResults.style.display = 'none';

        productGrid.innerHTML = state.filteredProducts.map(product => {
            const mainImage = product.images && product.images.length > 0
                ? getFullImageUrl(product.images[0])
                : 'assets/images/placeholder.svg';

            const rating    = product.rating || 4.5;
            const isNew     = product.isNew !== undefined ? product.isNew : true;
            const isOnSale  = product.discountPercent > 0;
            const inWishlist = Array.isArray(cartState.wishlist) && cartState.wishlist.includes(product.id);

            return `
                <article class="product-card" role="listitem" data-product-id="${product.id}">
                    <div class="product-card__image-wrapper">
                        <img
                            src="${mainImage}"
                            alt="${escHtml(product.productName)}"
                            class="product-card__image"
                            loading="lazy"
                            onerror="this.src='assets/images/placeholder.svg'"
                        >
                        <div class="product-card__badges">
                            ${isNew     ? '<span class="badge--new">New</span>'             : ''}
                            ${isOnSale  ? `<span class="badge--sale">${product.discountPercent}% OFF</span>` : ''}
                        </div>
                        <button
                            class="product-card__wishlist ${inWishlist ? 'active' : ''}"
                            data-action="wishlist"
                            aria-label="${inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}"
                        >${inWishlist ? '❤️' : '♡'}</button>
                    </div>
                    <div class="product-card__content">
                        <h3 class="product-card__title">${escHtml(product.productName)}</h3>
                        <div class="product-card__rating" aria-label="Rating: ${rating} out of 5 stars">
                            ${renderStars(rating)}
                        </div>
                        <div class="product-card__footer">
                            <div class="product-card__pricing">
                                <span class="product-card__price">₹${product.price ? Number(product.price).toLocaleString() : '0'}</span>
                                ${product.mrp && product.mrp > product.price ? `
                                    <span class="product-card__mrp">₹${Number(product.mrp).toLocaleString()}</span>
                                    <span class="product-card__discount">${product.discountPercent}% OFF</span>
                                ` : ''}
                            </div>
                        </div>
                        <div class="product-card__actions" style="display:flex; gap:0.5rem; margin-top:1rem;">
                            <button
                                class="product-card__btn-primary"
                                style="flex:2; padding:0.5rem; background:#ff9f00; border:none; border-radius:4px; color:white; cursor:pointer; font-weight:600;"
                                data-action="buy-now"
                            >Buy Now</button>
                            <button
                                class="product-card__quick-view"
                                style="flex:1; width:auto !important; margin:0 !important; background-color:var(--color-primary);"
                                data-action="quick-view"
                                aria-label="Quick view ${escHtml(product.productName)}"
                            >View</button>
                        </div>
                    </div>
                </article>`;
        }).join('');
    }

    // ── Product Card Events ──────────────────────────────────────────────
    productGrid.addEventListener('click', handleProductCardClick);

    // Modal Events
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.querySelector('.modal__close').addEventListener('click', closeModal);
        modal.querySelector('.modal__overlay').addEventListener('click', closeModal);
        document.getElementById('addToCartBtn')?.addEventListener('click', addToCartFromModal);
        document.getElementById('modalBuyNowBtn')?.addEventListener('click', handleBuyNow);
        document.getElementById('modalWishlistBtn')?.addEventListener('click', toggleWishlistFromModal);
        modal.querySelector('.carousel__btn--prev')?.addEventListener('click', () => navigateCarousel(-1));
        modal.querySelector('.carousel__btn--next')?.addEventListener('click', () => navigateCarousel(1));
    }

    function handleProductCardClick(e) {
        const card = e.target.closest('.product-card');
        if (!card) return;

        const productIdRaw = card.dataset.productId;
        const productId = isNaN(productIdRaw) ? productIdRaw :
            (productIdRaw.match(/^[0-9a-fA-F]{24}$/) ? productIdRaw : Number(productIdRaw));

        const actionBtn = e.target.closest('[data-action]');
        const action = actionBtn ? actionBtn.dataset.action : null;

        if (action === 'quick-view') {
            openProductModal(productId);
        } else if (action === 'wishlist') {
            toggleWishlistItem(productId);
        } else if (action === 'buy-now') {
            handleBuyNow(e);
        } else if (!action) {
            window.location.href = `product.html?id=${productIdRaw}`;
        }
    }

    // ── Cart / Wishlist Actions ─────────────────────────────────────────
    async function toggleWishlistItem(productId) {
        const index = cartState.wishlist.findIndex(id => id == productId);
        if (index > -1) {
            cartState.wishlist.splice(index, 1);
            showToast('Removed from wishlist');
            if (typeof WishlistService !== 'undefined') await WishlistService.removeFromWishlist(productId);
        } else {
            cartState.wishlist.push(productId);
            showToast('Added to wishlist ❤️');
            if (typeof WishlistService !== 'undefined') await WishlistService.addToWishlist(productId);
        }
        renderProducts();
    }

    function addToCart(productId, size = 'Free Size', metal = 'Gold') {
        const product = state.products.find(p => p.id == productId);
        if (!product) return;

        if (typeof CartService !== 'undefined') {
            CartService.addToCart(productId, 1)
                .then(res => {
                    if (res === null) _saveToLocalCart(product, size, metal);
                    showToast(`${product.productName} added to cart! 🛒`);
                })
                .catch(() => {
                    _saveToLocalCart(product, size, metal);
                    showToast(`${product.productName} added to cart! 🛒`);
                });
        } else {
            _saveToLocalCart(product, size, metal);
            showToast(`${product.productName} added to cart! 🛒`);
        }
    }

    function _saveToLocalCart(product, size, metal) {
        let cart = JSON.parse(localStorage.getItem('jewel_cart') || '[]');
        const existing = cart.find(i =>
            String(i.id) === String(product.id) && i.size === size && i.metal === metal
        );
        if (existing) {
            existing.quantity = (existing.quantity || 1) + 1;
        } else {
            cart.push({
                id: product.id,
                title: product.productName,
                price: parseFloat(product.price) || 0,
                image: product.images?.length > 0 ? getFullImageUrl(product.images[0]) : '',
                size, metal, quantity: 1
            });
        }
        localStorage.setItem('jewel_cart', JSON.stringify(cart));
    }

    function addToCartFromModal() {
        if (!cartState.currentProduct) return;
        const size = document.getElementById('sizeSelect')?.value || 'Free Size';
        addToCart(cartState.currentProduct.id, size, 'Gold');
    }

    async function toggleWishlistFromModal() {
        if (!cartState.currentProduct) return;
        await toggleWishlistItem(cartState.currentProduct.id);
        const wishlistBtn = document.getElementById('modalWishlistBtn');
        const inWishlist = cartState.wishlist.includes(cartState.currentProduct.id);
        if (wishlistBtn) wishlistBtn.textContent = inWishlist ? '❤️' : '♡';
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

        localStorage.setItem('jewel_buyNowItem', JSON.stringify({
            id: product.id,
            title: product.productName,
            price: product.price,
            image: product.images?.length > 0 ? getFullImageUrl(product.images[0]) : '',
            quantity: 1,
            size: 'Free Size',
            metal: 'Gold'
        }));
        window.location.href = 'checkout.html';
    }

    // ── Modal ─────────────────────────────────────────────────────────────
    function openProductModal(productId) {
        const product = state.products.find(p => p.id == productId);
        if (!product) return;

        cartState.currentProduct   = product;
        cartState.currentImageIndex = 0;

        document.getElementById('modalTitle').textContent    = product.productName;
        document.getElementById('modalPrice').textContent    = `₹${Number(product.price).toLocaleString()}`;
        document.getElementById('modalDescription').textContent = product.description || '';

        const modalMrp      = document.getElementById('modalMrp');
        const modalDiscount = document.getElementById('modalDiscount');
        if (product.mrp && product.mrp > product.price) {
            modalMrp.textContent      = `₹${Number(product.mrp).toLocaleString()}`;
            modalMrp.style.display    = 'inline';
            modalDiscount.textContent = `${product.discountPercent}% OFF`;
            modalDiscount.style.display = 'inline-block';
        } else {
            modalMrp.style.display      = 'none';
            modalDiscount.style.display = 'none';
        }

        document.getElementById('modalMaterial').textContent = product.material || 'N/A';
        document.getElementById('modalPlating').textContent  = product.plating  || 'N/A';
        document.getElementById('modalOccasion').textContent = product.occasion || 'N/A';
        document.getElementById('modalColor').textContent    = product.color    || 'N/A';

        const wishlistBtn = document.getElementById('modalWishlistBtn');
        if (wishlistBtn) wishlistBtn.textContent = cartState.wishlist.includes(productId) ? '❤️' : '♡';

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
        const src = cartState.currentProduct.images?.length > 0
            ? getFullImageUrl(cartState.currentProduct.images[cartState.currentImageIndex])
            : 'assets/images/placeholder.svg';
        img.src = src;
        document.querySelectorAll('.carousel__dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === cartState.currentImageIndex);
        });
    }

    function renderCarouselDots() {
        if (!cartState.currentProduct?.images) return;
        const container = document.getElementById('carouselDots');
        container.innerHTML = cartState.currentProduct.images.map((_, i) =>
            `<button class="carousel__dot ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="Image ${i + 1}"></button>`
        ).join('');
        container.querySelectorAll('.carousel__dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                cartState.currentImageIndex = parseInt(e.target.dataset.index);
                updateModalImage();
            });
        });
    }

    function navigateCarousel(dir) {
        if (!cartState.currentProduct?.images) return;
        const len = cartState.currentProduct.images.length;
        cartState.currentImageIndex = (cartState.currentImageIndex + dir + len) % len;
        updateModalImage();
    }

    // ── Sub-categories ────────────────────────────────────────────────────
    function renderSubCategories() {
        const subCategories = state.categories.filter(c => c.parentId === state.currentCategoryId);
        if (subCategories.length === 0) { subCategorySection.style.display = 'none'; return; }
        subCategorySection.style.display = 'block';
        subCategoryBar.innerHTML = subCategories.map(cat => {
            const catId   = cat.id || cat._id;
            const iconSrc = ProductService.getCategoryImageUrl(cat);
            return `
                <button class="sub-category-item" onclick="window.location.href='category.html?id=${catId}'">
                    <img src="${iconSrc}" alt="${cat.name}" class="sub-category-image"
                         onerror="this.src='https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=100&q=80'">
                    <span class="sub-category-text">${cat.name}</span>
                </button>`;
        }).join('');
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    function renderStars(rating) {
        let s = '';
        for (let i = 1; i <= 5; i++)
            s += `<span class="star ${i <= rating ? '' : 'empty'}">★</span>`;
        return s;
    }

    function getFullImageUrl(imagePath) {
        if (!imagePath) return 'assets/images/placeholder.svg';
        if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;
        imagePath = imagePath.replace(/\\/g, '/');
        const clean = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
        return `https://jewelley-ecommerce-webiste-bk.onrender.com/${clean}`;
    }

    function showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toast._t);
        toast._t = setTimeout(() => toast.classList.remove('show'), 3000);
    }

    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

})();
