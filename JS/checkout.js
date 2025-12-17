/**
 * ============================================
 * CHECKOUT LOGIC
 * ============================================
 */

document.addEventListener('DOMContentLoaded', () => {
    loadCheckoutItems();
    setupFormListener();
});

function loadCheckoutItems() {
    const orderItemsContainer = document.getElementById('orderItems');
    const orderTotalElement = document.getElementById('orderTotal');

    // Check if we have a "Buy Now" item first (single item checkout)
    const buyNowItem = localStorage.getItem('jewel_buyNowItem');
    let items = [];

    if (buyNowItem) {
        items = [JSON.parse(buyNowItem)];
        // Optional: clear it so refresh uses cart? Or keep it? 
        // Better to clear it on successful order only, but for now we render it.
    } else {
        // Fallback to Cart
        const cart = localStorage.getItem('jewel_cart');
        if (cart) {
            items = JSON.parse(cart);
        }
    }

    if (!items || items.length === 0) {
        orderItemsContainer.innerHTML = '<p>Your cart is empty. <a href="index.html">Go Shop</a></p>';
        orderTotalElement.textContent = '₹0';
        return;
    }

    // Render items
    orderItemsContainer.innerHTML = items.map(item => `
        <div class="summary-item">
            <img src="${item.image}" alt="${item.title}">
            <div class="summary-details">
                <h4>${item.title}</h4>
                <p>Qty: ${item.quantity} | Size: ${item.size || 'Free'}</p>
                <p>₹${item.price.toLocaleString()}</p>
            </div>
        </div>
    `).join('');

    // Calculate Total
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    orderTotalElement.textContent = `₹${total.toLocaleString()}`;

    // Store total for later use
    orderItemsContainer.dataset.total = total;
}

function setupFormListener() {
    const form = document.getElementById('checkoutForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Button might be outside the form (linked via form attribute)
        const btn = form.querySelector('button[type="submit"]') || document.querySelector('button[form="checkoutForm"]');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Processing...';

        try {
            // 1. Gather Data
            const formData = {
                whatsappNumber: document.getElementById('whatsappNumber').value,
                alternateNumber: document.getElementById('alternateNumber').value || null,
                address: document.getElementById('address').value,
                state: document.getElementById('state').value,
                district: document.getElementById('district').value,
                pincode: document.getElementById('pincode').value,
                items: getOrderItems(),
                totalAmount: parseFloat(document.getElementById('orderItems').dataset.total)
            };

            // 2. Call API
            const savedOrder = await OrderService.placeOrder(formData);

            // 3. Clear Cart / BuyNow Item
            localStorage.removeItem('jewel_cart');
            localStorage.removeItem('jewel_buyNowItem');

            // 4. Redirect to WhatsApp
            redirectToWhatsApp(savedOrder);

            // 5. Redirect to Success Page (or Home for now)
            window.location.href = 'index.html';

        } catch (error) {
            console.error(error);
            showToast('Failed to place order: ' + error.message);
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });
}

function getOrderItems() {
    const buyNowItem = localStorage.getItem('jewel_buyNowItem');
    if (buyNowItem) {
        const item = JSON.parse(buyNowItem);
        return [{
            productId: item.id,
            productName: item.title,
            quantity: item.quantity,
            price: item.price,
            image: item.image
        }];
    }

    const cart = JSON.parse(localStorage.getItem('jewel_cart') || '[]');
    return cart.map(item => ({
        productId: item.id,
        productName: item.title,
        quantity: item.quantity,
        price: item.price,
        image: item.image
    }));
}

function redirectToWhatsApp(data) {
    const msg = `*New Order Received*
Order ID: ${data.orderId}

WhatsApp: ${data.whatsappNumber}

Address:
${data.address}
${data.district}, ${data.state} - ${data.pincode}

Total: ₹${data.totalAmount}

Please send payment details.`;

    // Use specific number from user request or default
    const adminNumber = '6369675902'; // Replace with actual admin number if known, using placeholder
    const url = `https://wa.me/${adminNumber}?text=${encodeURIComponent(msg)}`;

    window.open(url, '_blank');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}
