/**
 * ============================================
 * ORDERS PANEL UI
 * ============================================
 * Handles the display and interaction of the "My Orders" sidebar
 */

(function () {
    'use strict';

    const panelId = 'ordersPanel';
    const itemsContainerId = 'ordersList';

    function getPanel() {
        return document.getElementById(panelId);
    }

    function openOrdersPanel() {
        const panel = getPanel();
        if (!panel) return;

        panel.style.display = 'block';
        fetchAndRenderOrders();

        // Close other panels
        if (window.CartService && window.CartService.closeCart) window.CartService.closeCart();
        // Close wishlist if open (manually or via service if exists)
        const wishlistPanel = document.getElementById('wishlistPanel');
        if (wishlistPanel) wishlistPanel.style.display = 'none';

    }

    function closeOrdersPanel() {
        const panel = getPanel();
        if (panel) {
            panel.style.display = 'none';
        }
    }

    async function fetchAndRenderOrders() {
        const container = document.getElementById(itemsContainerId);
        if (!container) return;

        container.innerHTML = '<div class="cart__empty"><p>Loading orders...</p></div>';

        try {
            const orders = await window.OrderService.getMyOrders();

            if (!orders || orders.length === 0) {
                container.innerHTML = `
                    <div class="cart__empty">
                        <p>No orders found</p>
                        <p class="cart__empty-subtitle">You haven't placed any orders yet.</p>
                    </div>
                `;
                return;
            }

            // Sort by date (newest first)
            orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

            container.innerHTML = orders.map(order => createOrderCard(order)).join('');

        } catch (error) {
            console.error('Error rendering orders:', error);
            container.innerHTML = `
                <div class="cart__empty">
                    <p style="color: red;">Failed to load orders</p>
                    <p class="cart__empty-subtitle">Please try again later.</p>
                </div>
            `;
        }
    }

    function createOrderCard(order) {
        const date = new Date(order.orderDate).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
        });
        const statusColor = getStatusColor(order.orderStatus);

        // Calculate items summary
        const itemCount = order.items ? order.items.length : 0;
        const itemText = itemCount === 1 ? '1 item' : `${itemCount} items`;

        // Formatting price
        const total = order.totalAmount ? `₹${order.totalAmount.toLocaleString()}` : '-';

        return `
            <div class="order-card" style="padding: 1rem; border-bottom: 1px solid var(--color-border); margin-bottom: 0.5rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="font-weight: 600;">Order #${order.id ? order.id.toString().slice(-6) : 'N/A'}</span>
                    <span style="color: var(--color-text-muted); font-size: 0.9em;">${date}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span class="badge" style="background-color: ${statusColor}20; color: ${statusColor}; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8em;">
                        ${order.orderStatus || 'Pending'}
                    </span>
                    <span style="font-weight: 600; color: var(--color-primary);">${total}</span>
                </div>
                <div style="font-size: 0.9em; color: var(--color-text-muted);">
                    ${itemText} • ${order.paymentMethod || 'COD'}
                </div>
                <!-- Optional: List items briefly or show detail button -->
            </div>
        `;
    }

    function getStatusColor(status) {
        switch (status?.toUpperCase()) {
            case 'DELIVERED': return 'green';
            case 'SHIPPED': return 'blue';
            case 'CANCELLED': return 'red';
            case 'PROCESSING': return 'orange';
            default: return 'gray';
        }
    }

    // Initialize events
    function init() {
        const panel = getPanel();
        if (!panel) return; // Might not be inserted yet

        // Close button
        const closeBtn = panel.querySelector('.cart__close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeOrdersPanel);
        }

        // Overlay click
        const overlay = panel.querySelector('.cart__overlay');
        if (overlay) {
            overlay.addEventListener('click', closeOrdersPanel);
        }
    }

    // Expose global API
    window.OrdersUI = {
        openOrdersPanel,
        closeOrdersPanel,
        init
    };

    // Auto-init on load
    document.addEventListener('DOMContentLoaded', init);

})();
